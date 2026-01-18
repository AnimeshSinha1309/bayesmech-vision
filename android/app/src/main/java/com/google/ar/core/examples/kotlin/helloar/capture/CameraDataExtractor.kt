package com.google.ar.core.examples.kotlin.helloar.capture

import android.graphics.Bitmap
import android.opengl.Matrix
import ar_stream.ArStream
import com.google.ar.core.Camera
import com.google.ar.core.Frame
import java.io.ByteArrayOutputStream

object CameraDataExtractor {

    fun extractCameraData(
        camera: Camera,
        viewMatrix: FloatArray,
        projectionMatrix: FloatArray,
        imageWidth: Int,
        imageHeight: Int
    ): ArStream.CameraData {
        // Get camera pose (inverse of view matrix)
        val poseMatrix = FloatArray(16)
        Matrix.invertM(poseMatrix, 0, viewMatrix, 0)

        return ArStream.CameraData.newBuilder()
            .addAllProjectionMatrix(projectionMatrix.toList())
            .addAllViewMatrix(viewMatrix.toList())
            .addAllPoseMatrix(poseMatrix.toList())
            .setImageWidth(imageWidth)
            .setImageHeight(imageHeight)
            .setTrackingState(mapTrackingState(camera.trackingState))
            .build()
    }

    fun extractRgbFrame(
        bitmap: Bitmap,
        jpegQuality: Int,
        targetWidth: Int = 0,
        targetHeight: Int = 0
    ): ArStream.ImageFrame {
        // Resize if needed
        val resizedBitmap = if (targetWidth > 0 && targetHeight > 0) {
            Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
        } else {
            bitmap
        }

        // Compress to JPEG
        val stream = ByteArrayOutputStream()
        resizedBitmap.compress(Bitmap.CompressFormat.JPEG, jpegQuality, stream)
        val jpegData = stream.toByteArray()

        // Clean up if we created a new bitmap
        if (resizedBitmap !== bitmap) {
            resizedBitmap.recycle()
        }

        return ArStream.ImageFrame.newBuilder()
            .setData(com.google.protobuf.ByteString.copyFrom(jpegData))
            .setFormat(ArStream.ImageFormat.JPEG)
            .setWidth(resizedBitmap.width)
            .setHeight(resizedBitmap.height)
            .setQuality(jpegQuality)
            .build()
    }

    private fun mapTrackingState(state: com.google.ar.core.TrackingState): ArStream.TrackingState {
        return when (state) {
            com.google.ar.core.TrackingState.TRACKING -> ArStream.TrackingState.TRACKING
            com.google.ar.core.TrackingState.PAUSED -> ArStream.TrackingState.LIMITED
            com.google.ar.core.TrackingState.STOPPED -> ArStream.TrackingState.NOT_TRACKING
        }
    }

    fun extractDepthFrame(
        frame: Frame,
        depthScale: Int = 1
    ): ArStream.DepthFrame? {
        try {
            // Try to acquire depth image
            val depthImage = frame.acquireDepthImage16Bits()
            
            val width = depthImage.width / depthScale
            val height = depthImage.height / depthScale
            
            android.util.Log.d("CameraDataExtractor", "Extracting depth frame: ${depthImage.width}x${depthImage.height} -> ${width}x${height} (scale=$depthScale)")
            
            // Get depth data as ShortBuffer (16-bit unsigned integers in millimeters)
            val depthBuffer = depthImage.planes[0].buffer
            
            // Convert to byte array (will be sent as is - 16-bit values)
            val depthBytes = ByteArray(width * height * 2)
            
            if (depthScale == 1) {
                // No downsampling - copy directly
                depthBuffer.rewind()
                depthBuffer.get(depthBytes)
            } else {
                // Downsample depth map
                depthBuffer.rewind()
                var destIdx = 0
                for (y in 0 until height) {
                    for (x in 0 until width) {
                        val srcIdx = (y * depthScale * depthImage.width + x * depthScale) * 2
                        depthBytes[destIdx++] = depthBuffer.get(srcIdx)
                        depthBytes[destIdx++] = depthBuffer.get(srcIdx + 1)
                    }
                }
            }
            
            // Calculate statistics for debugging
            var sum = 0L
            var minDepth = 65535
            var maxDepth = 0
            val pixelCount = width * height
            for (i in 0 until pixelCount) {
                val idx = i * 2
                val depth = ((depthBytes[idx + 1].toInt() and 0xFF) shl 8) or (depthBytes[idx].toInt() and 0xFF)
                sum += depth
                if (depth < minDepth) minDepth = depth
                if (depth > maxDepth) maxDepth = depth
            }
            val meanDepth = sum / pixelCount
            
            android.util.Log.i("CameraDataExtractor", "Depth frame: ${width}x${height}, mean=${meanDepth}mm, min=${minDepth}mm, max=${maxDepth}mm, bytes=${depthBytes.size}")
            
            if (meanDepth == 0L && minDepth == 0 && maxDepth == 0) {
                android.util.Log.e("CameraDataExtractor", "WARNING: Depth frame is all zeros!")
            }
            
            val result = ArStream.DepthFrame.newBuilder()
                .setData(com.google.protobuf.ByteString.copyFrom(depthBytes))
                .setWidth(width)
                .setHeight(height)
                .setMinDepthM(0.1f)  // ARCore typical min depth
                .setMaxDepthM(5.0f)  // ARCore typical max depth
                .build()
            
            depthImage.close()
            return result
            
        } catch (e: Exception) {
            // Depth may not be available on all frames/devices
            android.util.Log.w("CameraDataExtractor", "Failed to extract depth frame: ${e.message}")
            return null
        }
    }
}
