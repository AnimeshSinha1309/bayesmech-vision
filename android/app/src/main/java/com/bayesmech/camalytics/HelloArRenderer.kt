/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.bayesmech.camalytics

import android.opengl.GLES30
import android.opengl.Matrix
import android.util.Log
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import com.google.ar.core.Frame
import com.google.ar.core.Session
import com.google.ar.core.TrackingFailureReason
import com.google.ar.core.TrackingState
import com.bayesmech.camalytics.common.helpers.DisplayRotationHelper
import com.bayesmech.camalytics.common.helpers.TrackingStateHelper
import com.bayesmech.camalytics.common.samplerender.Framebuffer
import com.bayesmech.camalytics.common.samplerender.GLError
import com.bayesmech.camalytics.common.samplerender.Mesh
import com.bayesmech.camalytics.common.samplerender.SampleRender
import com.bayesmech.camalytics.common.samplerender.Shader
import com.bayesmech.camalytics.common.samplerender.Texture
import com.bayesmech.camalytics.common.samplerender.VertexBuffer
import com.bayesmech.camalytics.common.samplerender.arcore.BackgroundRenderer
import com.bayesmech.camalytics.common.samplerender.arcore.PlaneRenderer
import com.google.ar.core.exceptions.CameraNotAvailableException
import com.google.ar.core.exceptions.NotYetAvailableException
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import android.graphics.Bitmap
import com.bayesmech.camalytics.network.ARStreamClient
import com.bayesmech.camalytics.network.StreamConfig
import com.bayesmech.camalytics.capture.ARDataCapture
import com.bayesmech.camalytics.sensors.SensorDataCollector
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/** Renders the HelloAR application using our example Renderer. */
class HelloArRenderer(val activity: HelloArActivity) :
  SampleRender.Renderer, DefaultLifecycleObserver {
    val TAG = "HelloArRenderer"

    private val Z_NEAR = 0.1f
    private val Z_FAR = 100f

  lateinit var render: SampleRender
  lateinit var planeRenderer: PlaneRenderer
  lateinit var backgroundRenderer: BackgroundRenderer
  // Point Cloud
  lateinit var pointCloudVertexBuffer: VertexBuffer
  lateinit var pointCloudMesh: Mesh
  lateinit var pointCloudShader: Shader

  var hasSetTextureNames = false

  // Keep track of the last point cloud rendered to avoid updating the VBO if point cloud
  // was not changed.  Do this using the timestamp since we can't compare PointCloud objects.
  var lastPointCloudTimestamp: Long = 0

  // Temporary matrix allocated here to reduce number of allocations for each frame.
  val modelMatrix = FloatArray(16)
  val viewMatrix = FloatArray(16)
  val projectionMatrix = FloatArray(16)
  val modelViewMatrix = FloatArray(16) // view x model

  val modelViewProjectionMatrix = FloatArray(16) // projection x view x model

  val session
    get() = activity.arCoreSessionHelper.session

  val displayRotationHelper = DisplayRotationHelper(activity)
  val trackingStateHelper = TrackingStateHelper(activity)

  // AR Streaming components
  private var streamClient: ARStreamClient? = null
  private var dataCapture: ARDataCapture? = null
  private var sensorCollector: SensorDataCollector? = null  // NEW: Sensor data collector
  private val streamingScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

  // Track viewport dimensions
  private var viewportWidth: Int = 1
  private var viewportHeight: Int = 1

  override fun onResume(owner: LifecycleOwner) {
    displayRotationHelper.onResume()
    hasSetTextureNames = false
  }

  override fun onPause(owner: LifecycleOwner) {
    displayRotationHelper.onPause()
  }

  override fun onSurfaceCreated(render: SampleRender) {
    // Prepare the rendering objects.
    // This involves reading shaders and 3D model files, so may throw an IOException.
    try {
      planeRenderer = PlaneRenderer(render)
      backgroundRenderer = BackgroundRenderer(render)
      
      // Point cloud
      pointCloudShader =
        Shader.createFromAssets(
            render,
            "shaders/point_cloud.vert",
            "shaders/point_cloud.frag",
            /*defines=*/ null
          )
          .setVec4("u_Color", floatArrayOf(31.0f / 255.0f, 188.0f / 255.0f, 210.0f / 255.0f, 1.0f))
          .setFloat("u_PointSize", 5.0f)

      // four entries per vertex: X, Y, Z, confidence
      pointCloudVertexBuffer =
        VertexBuffer(render, /*numberOfEntriesPerVertex=*/ 4, /*entries=*/ null)
      val pointCloudVertexBuffers = arrayOf(pointCloudVertexBuffer)
      pointCloudMesh =
        Mesh(render, Mesh.PrimitiveMode.POINTS, /*indexBuffer=*/ null, pointCloudVertexBuffers)
    } catch (e: IOException) {
      Log.e(TAG, "Failed to read a required asset file", e)
      showError("Failed to read a required asset file: $e")
    }
  }

  override fun onSurfaceChanged(render: SampleRender, width: Int, height: Int) {
    displayRotationHelper.onSurfaceChanged(width, height)
    displayRotationHelper.onSurfaceChanged(width, height)
    // Store viewport dimensions for frame extraction
    viewportWidth = width
    viewportHeight = height
  }

  override fun onDrawFrame(render: SampleRender) {
    val session = session ?: return

    // Texture names should only be set once on a GL thread unless they change. This is done during
    // onDrawFrame rather than onSurfaceCreated since the session is not guaranteed to have been
    // initialized during the execution of onSurfaceCreated.
    if (!hasSetTextureNames) {
      session.setCameraTextureNames(intArrayOf(backgroundRenderer.cameraColorTexture.textureId))
      hasSetTextureNames = true
    }

    // -- Update per-frame state

    // Notify ARCore session that the view size changed so that the perspective matrix and
    // the video background can be properly adjusted.
    displayRotationHelper.updateSessionIfNeeded(session)

    // Obtain the current frame from ARSession. When the configuration is set to
    // UpdateMode.BLOCKING (it is by default), this will throttle the rendering to the
    // camera framerate.
    val frame =
      try {
        session.update()
      } catch (e: CameraNotAvailableException) {
        Log.e(TAG, "Camera not available during onDrawFrame", e)
        showError("Camera not available. Try restarting the app.")
        return
      }

    val camera = frame.camera

    // Update velocity from ARCore pose (if tracking)
    if (camera.trackingState == TrackingState.TRACKING) {
      sensorCollector?.updateVelocityFromPose(camera.pose.translation)
    }

    // Update BackgroundRenderer state to match the depth settings.
    try {
      backgroundRenderer.setUseDepthVisualization(
        render,
        activity.depthSettings.depthColorVisualizationEnabled()
      )
      backgroundRenderer.setUseOcclusion(render, activity.depthSettings.useDepthForOcclusion())
    } catch (e: IOException) {
      Log.e(TAG, "Failed to read a required asset file", e)
      showError("Failed to read a required asset file: $e")
      return
    }

    // BackgroundRenderer.updateDisplayGeometry must be called every frame to update the coordinates
    // used to draw the background camera image.
    backgroundRenderer.updateDisplayGeometry(frame)
    val shouldGetDepthImage =
      activity.depthSettings.useDepthForOcclusion() ||
        activity.depthSettings.depthColorVisualizationEnabled()
    if (camera.trackingState == TrackingState.TRACKING && shouldGetDepthImage) {
      try {
        val depthImage = frame.acquireDepthImage16Bits()
        backgroundRenderer.updateCameraDepthTexture(depthImage)
        depthImage.close()
      } catch (e: NotYetAvailableException) {
        // This normally means that depth data is not available yet. This is normal so we will not
        // spam the logcat with this.
      }
    }

    // Show a message based on whether tracking has failed, if planes are detected, and if the user
    // has placed any objects.
    val message: String? =
      when {
        camera.trackingState == TrackingState.PAUSED &&
          camera.trackingFailureReason == TrackingFailureReason.NONE ->
          activity.getString(R.string.searching_planes)
        camera.trackingState == TrackingState.PAUSED ->
          TrackingStateHelper.getTrackingFailureReasonString(camera)
        session.hasTrackingPlane() ->
          activity.getString(R.string.waiting_taps) // Kept for now, or change to "Tracking planes"
        else -> activity.getString(R.string.searching_planes)
      }
    if (message == null) {
      activity.view.snackbarHelper.hide(activity)
    } else {
      activity.view.snackbarHelper.showMessage(activity, message)
    }

    // -- Draw background
    // Draw background FIRST - this renders the camera image to the screen
    backgroundRenderer.drawBackground(render)
    
    // NOW capture the camera frame AFTER it's been rendered
    // IMPORTANT: Extract bitmap AND depth SYNCHRONOUSLY on render thread
    // ARCore frames expire in ~33ms, so we MUST acquire depth NOW before async processing
    dataCapture?.let { capture ->
      if (camera.trackingState == TrackingState.TRACKING) {
        // Extract RGB bitmap NOW, synchronously on the render thread
        val cameraFrameBitmap = extractCameraImageBitmap(frame)
        
        // Get bitmap dimensions NOW before coroutine (to avoid accessing recycled bitmap)
        val imageWidth = cameraFrameBitmap?.width ?: 1920
        val imageHeight = cameraFrameBitmap?.height ?: 1080
        
        camera.getViewMatrix(viewMatrix, 0)
        camera.getProjectionMatrix(projectionMatrix, 0, Z_NEAR, Z_FAR)
        
        // CRITICAL: Also acquire depth image NOW on render thread!
        // If we try to get it later in coroutine, frame will be stale -> DeadlineExceededException
        val depthImage = try {
          frame.acquireDepthImage16Bits()
        } catch (e: Exception) {
          null  // Depth not available - this is OK
        }
        
        // Make copies of the matrices for the coroutine
        val viewMatrixCopy = viewMatrix.clone()
        val projectionMatrixCopy = projectionMatrix.clone()

        // NOW launch coroutine with pre-acquired bitmap AND depth image
        streamingScope.launch {
          capture.captureAndSend(
            frame,
            session,
            camera,
            viewMatrixCopy,
            projectionMatrixCopy,
            cameraFrameBitmap,
            depthImage,  // Pass pre-acquired depth image
            imageWidth,  // Pass pre-captured dimensions
            imageHeight
          )

          cameraFrameBitmap?.recycle()
          depthImage?.close()  // Close depth image after use
        }
      }
    }
    if (frame.timestamp != 0L) {
      // Suppress rendering if the camera did not produce the first frame yet. This is to avoid
      // drawing possible leftover data from previous sessions if the texture is reused.
    }

    // If not tracking, don't draw 3D objects.
    if (camera.trackingState == TrackingState.PAUSED) {
      return
    }

    // -- Draw non-occluded virtual objects (planes, point cloud)

    // Get projection matrix.
    camera.getProjectionMatrix(projectionMatrix, 0, Z_NEAR, Z_FAR)

    // Get camera matrix and draw.
    camera.getViewMatrix(viewMatrix, 0)
    frame.acquirePointCloud().use { pointCloud ->
      if (pointCloud.timestamp > lastPointCloudTimestamp) {
        pointCloudVertexBuffer.set(pointCloud.points)
        lastPointCloudTimestamp = pointCloud.timestamp
      }
      Matrix.multiplyMM(modelViewProjectionMatrix, 0, projectionMatrix, 0, viewMatrix, 0)
      pointCloudShader.setMat4("u_ModelViewProjection", modelViewProjectionMatrix)
      render.draw(pointCloudMesh, pointCloudShader)
    }

    // Visualize planes.
    planeRenderer.drawPlanes(
      render,
      session.getAllTrackables(com.google.ar.core.Plane::class.java),
      camera.displayOrientedPose,
      projectionMatrix
    )
  }

  /** Checks if we detected at least one plane. */
  private fun Session.hasTrackingPlane() =
    getAllTrackables(com.google.ar.core.Plane::class.java).any { it.trackingState == TrackingState.TRACKING }



  fun startStreaming(config: StreamConfig) {
    streamClient = ARStreamClient(config.serverUrl, config)
    
    // Set up connection status callback to update UI
    streamClient?.setStatusCallback { status ->
      activity.runOnUiThread {
        activity.view.connectionStatusView.updateStatus(status)
      }
    }
    
    streamClient?.connect()
    
    // Get stable device ID for client identification across reconnections
    val deviceId = android.provider.Settings.Secure.getString(
      activity.contentResolver,
      android.provider.Settings.Secure.ANDROID_ID
    )
    
    // Initialize sensor collector and start collecting
    sensorCollector = SensorDataCollector(activity)
    sensorCollector?.startCollecting()
    
    dataCapture = ARDataCapture(streamClient!!, config, deviceId, sensorCollector!!)
    Log.i(TAG, "AR streaming started to ${config.serverUrl} with device_id: $deviceId")
    Log.i(TAG, "Sensor data collection started")
  }

  fun stopStreaming() {
    sensorCollector?.stopCollecting()
    sensorCollector = null
    streamClient?.disconnect()
    streamClient = null
    dataCapture = null
    Log.i(TAG, "AR streaming stopped")
    Log.i(TAG, "Sensor data collection stopped")
  }

  private fun extractCameraFrameBitmap(render: SampleRender): Bitmap? {
    return null  // Not used anymore - using ARCore camera image directly
  }
  
  private fun extractCameraImageBitmap(frame: Frame): Bitmap? {
    try {
      // Get camera image directly from ARCore (not from screen!)
      val cameraImage = frame.acquireCameraImage()
      
      val width = cameraImage.width
      val height = cameraImage.height

      // ARCore camera image is in YUV format
      // Convert YUV to RGB
      val yPlane = cameraImage.planes[0].buffer
      val uPlane = cameraImage.planes[1].buffer
      val vPlane = cameraImage.planes[2].buffer
      
      val ySize = yPlane.remaining()
      val uSize = uPlane.remaining()
      val vSize = vPlane.remaining()
      
      val nv21 = ByteArray(ySize + uSize + vSize)
      
      // Copy Y
      yPlane.get(nv21, 0, ySize)
      
      // Copy V and U (interleaved for NV21)
      vPlane.get(nv21, ySize, vSize)
      uPlane.get(nv21, ySize + vSize, uSize)
      
      // Convert NV21 to RGB
      val yuvImage = android.graphics.YuvImage(nv21, android.graphics.ImageFormat.NV21, width, height, null)
      val out = java.io.ByteArrayOutputStream()
      yuvImage.compressToJpeg(android.graphics.Rect(0, 0, width, height), 100, out)
      val imageBytes = out.toByteArray()
      
      val bitmap = android.graphics.BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
      
      // Calculate mean for debugging
      val pixels = IntArray(bitmap.width * bitmap.height)
      bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
      cameraImage.close()
      return bitmap
      
    } catch (e: Exception) {
      Log.e(TAG, "Error extracting camera image from ARCore", e)
      return null
    }
  }

  private fun showError(errorMessage: String) =
    activity.view.snackbarHelper.showError(activity, errorMessage)
}


