package com.bayesmech.camalytics.capture

import android.graphics.Bitmap
import android.media.Image
import android.util.Log
import com.bayesmech.vision.PerceiverDataFrame
import com.bayesmech.vision.PerceiverFrameIdentifier
import com.google.ar.core.Camera
import com.google.ar.core.Frame
import com.google.ar.core.PointCloud
import com.bayesmech.camalytics.network.ARStreamClient
import com.bayesmech.camalytics.network.BandwidthMonitor
import com.bayesmech.camalytics.network.QualityLevel
import com.bayesmech.camalytics.network.StreamConfig
import com.bayesmech.camalytics.recording.RecordingManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.bayesmech.camalytics.sensors.SensorDataCollector

class ARDataCapture(
    private val client: ARStreamClient,
    private val config: StreamConfig,
    private val deviceId: String,
    private val sensorCollector: SensorDataCollector,
    private val recordingManager: RecordingManager
) {
    private val TAG = "ARDataCapture"
    private var frameNumber = 0
    private var lastSentTimestamp = 0L
    private val bandwidthMonitor = BandwidthMonitor()
    private var currentQuality = QualityLevel.HIGH

    // Depth tracking
    private var depthFramesIncluded = 0
    private var depthFramesMissing = 0

    suspend fun captureAndSend(
        frame: Frame,
        session: com.google.ar.core.Session,
        camera: Camera,
        cameraFrameBitmap: Bitmap?,
        depthImage: Image?,
        pointCloudData: PointCloud?,
        imageWidth: Int,
        imageHeight: Int
    ) = withContext(Dispatchers.IO) {
        try {
            val now = System.nanoTime()
            val minInterval = (1_000_000_000 / currentQuality.targetFps).toLong()
            if (now - lastSentTimestamp < minInterval) {
                return@withContext
            }

            if (config.enableAdaptiveQuality) {
                currentQuality = bandwidthMonitor.getQualityLevel()
            }

            val perceiverFrame = buildPerceiverDataFrame(
                frame,
                session,
                camera,
                cameraFrameBitmap,
                depthImage,
                pointCloudData,
                imageWidth,
                imageHeight
            )

            if (recordingManager.isRecording()) {
                recordingManager.writeFrame(perceiverFrame)
            }

            client.sendFrame(perceiverFrame)

            val frameSize = perceiverFrame.serializedSize
            bandwidthMonitor.recordSent(frameSize)

            lastSentTimestamp = now
            frameNumber++

            if (frameNumber % 30 == 0) {
                val depthTotal = depthFramesIncluded + depthFramesMissing
                val depthPercentage = if (depthTotal > 0) (depthFramesIncluded * 100f / depthTotal) else 0f
                Log.i(TAG, "Sent frame $frameNumber, quality: $currentQuality, " +
                        "bandwidth: ${"%.2f".format(bandwidthMonitor.getCurrentBandwidthMbps())} Mbps, " +
                        "depth: $depthFramesIncluded/$depthTotal (${depthPercentage.toInt()}%)")
                Log.i(TAG, "  Sensors: ${sensorCollector.getSensorSummary()}")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error capturing and sending frame", e)
        }
    }

    private fun buildPerceiverDataFrame(
        frame: Frame,
        session: com.google.ar.core.Session,
        camera: Camera,
        cameraFrameBitmap: Bitmap?,
        depthImage: Image?,
        pointCloudData: PointCloud?,
        imageWidth: Int,
        imageHeight: Int
    ): PerceiverDataFrame {
        val builder = PerceiverDataFrame.newBuilder()

        // Frame identifier
        builder.frameIdentifier = PerceiverFrameIdentifier.newBuilder()
            .setTimestampNs(frame.timestamp)
            .setFrameNumber(frameNumber)
            .setDeviceId(deviceId)
            .build()

        // Camera pose
        builder.cameraPose = CameraDataExtractor.extractCameraPose(camera)

        // Camera intrinsics — only on first frame
        if (frameNumber == 0) {
            val depthWidth = depthImage?.width ?: imageWidth
            val depthHeight = depthImage?.height ?: imageHeight
            builder.cameraIntrinsics = CameraDataExtractor.extractCameraIntrinsics(
                camera, depthWidth, depthHeight
            )
        }

        // RGB frame (conditional on quality/config)
        if (currentQuality.sendRgb && config.sendRgbFrames && cameraFrameBitmap != null) {
            builder.rgbFrame = CameraDataExtractor.extractRgbFrame(
                cameraFrameBitmap,
                currentQuality.jpegQuality,
                currentQuality.rgbWidth,
                currentQuality.rgbHeight
            )
        }

        // Depth frame (conditional on quality/config)
        if (currentQuality.sendDepth && config.sendDepthFrames) {
            if (depthImage != null) {
                val depthFrame = CameraDataExtractor.processDepthImage(
                    depthImage, currentQuality.depthScale.toInt()
                )
                if (depthFrame != null) {
                    builder.depthFrame = depthFrame
                    depthFramesIncluded++
                } else {
                    depthFramesMissing++
                }
            } else {
                depthFramesMissing++
            }
        }

        // IMU data
        val imuData = sensorCollector.getCurrentImuData()
        if (imuData.hasAngularVelocity() || imuData.hasLinearAcceleration() ||
            imuData.hasGravity() || imuData.hasMagneticField()) {
            builder.imuData = imuData
        }

        // Inferred geometry (planes + point cloud)
        builder.inferredGeometry = CameraDataExtractor.extractInferredGeometry(session, pointCloudData)

        return builder.build()
    }

    fun getCurrentQuality(): QualityLevel = currentQuality

    fun getStats(): Map<String, Any> {
        return mapOf(
            "frame_number" to frameNumber,
            "current_quality" to currentQuality.name,
            "bandwidth_mbps" to bandwidthMonitor.getCurrentBandwidthMbps(),
            "sensor_summary" to sensorCollector.getSensorSummary()
        )
    }
}
