package com.google.ar.core.examples.kotlin.helloar.capture

import android.graphics.Bitmap
import android.media.Image
import android.util.Log
import ar_stream.ArStream
import com.google.ar.core.Camera
import com.google.ar.core.Frame
import com.google.ar.core.examples.kotlin.helloar.network.ARStreamClient
import com.google.ar.core.examples.kotlin.helloar.network.BandwidthMonitor
import com.google.ar.core.examples.kotlin.helloar.network.QualityLevel
import com.google.ar.core.examples.kotlin.helloar.network.StreamConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import com.google.ar.core.examples.kotlin.helloar.sensors.SensorDataCollector

class ARDataCapture(
    private val streamClient: ARStreamClient,
    private val config: StreamConfig,
    private val deviceId: String,  // Stable device identifier
    private val sensorCollector: SensorDataCollector  // NEW: Sensor data collector
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
        camera: Camera,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray,
        cameraFrameBitmap: Bitmap?,
        depthImage: Image?,  // Pre-acquired depth
        imageWidth: Int,     // Pre-captured dimensions
        imageHeight: Int
    ) = withContext(Dispatchers.IO) {
        try {
            // Throttle based on target FPS
            val now = System.nanoTime()
            val minInterval = (1_000_000_000 / currentQuality.targetFps).toLong()
            if (now - lastSentTimestamp < minInterval) {
                return@withContext  // Skip this frame
            }

            // Update quality based on bandwidth
            if (config.enableAdaptiveQuality) {
                currentQuality = bandwidthMonitor.getQualityLevel()
            }

            // Build ARFrame
            val arFrame = buildARFrame(
                frame,
                camera,
                viewMatrix,
                projectionMatrix,
                cameraFrameBitmap,
                depthImage,     // Pass pre-acquired depth
                imageWidth,     // Pass pre-captured dimensions
                imageHeight
            )

            // Send frame
            streamClient.sendFrame(arFrame)

            // Record bandwidth
            val frameSize = arFrame.serializedSize
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

    private fun buildARFrame(
        frame: Frame,
        camera: Camera,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray,
        cameraFrameBitmap: Bitmap?,
        depthImage: Image?,      // Pre-acquired depth
        imageWidth: Int,         // Pre-captured dimensions
        imageHeight: Int
    ): ArStream.ARFrame {
        val builder = ArStream.ARFrame.newBuilder()
            .setTimestampNs(frame.timestamp)
            .setFrameNumber(frameNumber)
            .setDeviceId(deviceId)  // Include stable device ID

        // Always include camera data (minimal overhead)
        // Use pre-captured dimensions to avoid accessing potentially recycled bitmap
        builder.camera = CameraDataExtractor.extractCameraData(
            camera,
            viewMatrix,
            projectionMatrix,
            imageWidth,
            imageHeight
        )

        // Conditionally include RGB frame
        if (currentQuality.sendRgb && config.sendRgbFrames && cameraFrameBitmap != null) {
            builder.rgbFrame = CameraDataExtractor.extractRgbFrame(
                cameraFrameBitmap,
                currentQuality.jpegQuality,
                currentQuality.rgbWidth,
                currentQuality.rgbHeight
            )
        }

        // Add depth frame if enabled and available
        if (currentQuality.sendDepth && config.sendDepthFrames) {
            if (depthImage != null) {
                val depthFrame = CameraDataExtractor.processDepthImage(depthImage, currentQuality.depthScale.toInt())
                if (depthFrame != null) {
                    builder.depthFrame = depthFrame
                    depthFramesIncluded++
                } else {
                    depthFramesMissing++
                    if (frameNumber % 10 == 0) {
                        Log.w(TAG, "✗ Depth processing failed for frame $frameNumber")
                    }
                }
            } else {
                depthFramesMissing++
                if (frameNumber % 10 == 0) {
                    Log.w(TAG, "✗ Depth not acquired for frame $frameNumber (total missing: $depthFramesMissing)")
                }
            }
        }

        // Add motion/sensor data
        val motionData = sensorCollector.getCurrentMotionData()
        if (motionData.hasLinearAcceleration() || motionData.hasAngularVelocity() || 
            motionData.hasGravity() || motionData.hasOrientation()) {
            builder.motion = motionData
        }

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
