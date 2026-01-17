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
}
