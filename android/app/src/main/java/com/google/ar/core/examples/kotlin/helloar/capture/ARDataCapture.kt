package com.google.ar.core.examples.kotlin.helloar.capture

import android.graphics.Bitmap
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

class ARDataCapture(
    private val streamClient: ARStreamClient,
    private val config: StreamConfig
) {
    private val TAG = "ARDataCapture"
    private var frameNumber = 0
    private var lastSentTimestamp = 0L
    private val bandwidthMonitor = BandwidthMonitor()
    private var currentQuality = QualityLevel.HIGH

    suspend fun captureAndSend(
        frame: Frame,
        camera: Camera,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray,
        cameraFrameBitmap: Bitmap?
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
                cameraFrameBitmap
            )

            // Send frame
            streamClient.sendFrame(arFrame)

            // Record bandwidth
            val frameSize = arFrame.serializedSize
            bandwidthMonitor.recordSent(frameSize)

            lastSentTimestamp = now
            frameNumber++

            if (frameNumber % 30 == 0) {
                Log.d(TAG, "Sent frame $frameNumber, quality: $currentQuality, " +
                        "bandwidth: ${"%.2f".format(bandwidthMonitor.getCurrentBandwidthMbps())} Mbps")
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
        cameraFrameBitmap: Bitmap?
    ): ArStream.ARFrame {
        val builder = ArStream.ARFrame.newBuilder()
            .setTimestampNs(frame.timestamp)
            .setFrameNumber(frameNumber)

        // Always include camera data (minimal overhead)
        val imageWidth = cameraFrameBitmap?.width ?: 1920
        val imageHeight = cameraFrameBitmap?.height ?: 1080
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

        // Add depth frame if enabled
        if (currentQuality.sendDepth && config.sendDepthFrames) {
            val depthFrame = CameraDataExtractor.extractDepthFrame(frame, currentQuality.depthScale.toInt())
            if (depthFrame != null) {
                builder.depthFrame = depthFrame
            }
        }

        return builder.build()
    }

    fun getCurrentQuality(): QualityLevel = currentQuality

    fun getStats(): Map<String, Any> {
        return mapOf(
            "frame_number" to frameNumber,
            "current_quality" to currentQuality.name,
            "bandwidth_mbps" to bandwidthMonitor.getCurrentBandwidthMbps()
        )
    }
}
