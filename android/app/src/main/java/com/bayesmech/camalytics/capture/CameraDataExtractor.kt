package com.bayesmech.camalytics.capture

import android.graphics.Bitmap
import android.media.Image
import com.bayesmech.vision.CameraIntrinsics
import com.bayesmech.vision.DepthFrame
import com.bayesmech.vision.ImageFrame
import com.bayesmech.vision.InferredGeometry
import com.bayesmech.vision.Pose
import com.bayesmech.vision.Quaternion
import com.bayesmech.vision.Vector3
import com.google.ar.core.Camera
import com.google.ar.core.PointCloud
import com.google.ar.core.Session
import com.google.ar.core.TrackingState
import com.google.protobuf.ByteString
import java.io.ByteArrayOutputStream

object CameraDataExtractor {

    fun extractCameraPose(camera: Camera): Pose {
        val pose = camera.pose
        return Pose.newBuilder()
            .setPosition(
                Vector3.newBuilder()
                    .setX(pose.tx())
                    .setY(pose.ty())
                    .setZ(pose.tz())
            )
            .setRotation(
                Quaternion.newBuilder()
                    .setX(pose.qx())
                    .setY(pose.qy())
                    .setZ(pose.qz())
                    .setW(pose.qw())
            )
            .build()
    }

    fun extractCameraIntrinsics(camera: Camera, depthWidth: Int, depthHeight: Int): CameraIntrinsics {
        val intrinsics = camera.imageIntrinsics
        val focal = intrinsics.focalLength
        val principal = intrinsics.principalPoint
        val dims = intrinsics.imageDimensions
        return CameraIntrinsics.newBuilder()
            .setFx(focal[0])
            .setFy(focal[1])
            .setCx(principal[0])
            .setCy(principal[1])
            .setImageWidth(dims[0].toFloat())
            .setImageHeight(dims[1].toFloat())
            .setDepthWidth(depthWidth.toFloat())
            .setDepthHeight(depthHeight.toFloat())
            .build()
    }

    fun extractRgbFrame(
        bitmap: Bitmap,
        jpegQuality: Int,
        targetWidth: Int = 0,
        targetHeight: Int = 0
    ): ImageFrame {
        val resizedBitmap = if (targetWidth > 0 && targetHeight > 0) {
            Bitmap.createScaledBitmap(bitmap, targetWidth, targetHeight, true)
        } else {
            bitmap
        }

        val stream = ByteArrayOutputStream()
        resizedBitmap.compress(Bitmap.CompressFormat.JPEG, jpegQuality, stream)
        val jpegData = stream.toByteArray()

        if (resizedBitmap !== bitmap) {
            resizedBitmap.recycle()
        }

        return ImageFrame.newBuilder()
            .setData(ByteString.copyFrom(jpegData))
            .setFormat(ImageFrame.ImageFormat.JPEG)
            .setQuality(jpegQuality)
            .build()
    }

    fun processDepthImage(
        depthImage: Image,
        depthScale: Int = 1
    ): DepthFrame? {
        try {
            val width = depthImage.width / depthScale
            val height = depthImage.height / depthScale

            val depthBuffer = depthImage.planes[0].buffer
            val depthBytes = ByteArray(width * height * 2)

            if (depthScale == 1) {
                depthBuffer.rewind()
                depthBuffer.get(depthBytes)
            } else {
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

            return DepthFrame.newBuilder()
                .setData(ByteString.copyFrom(depthBytes))
                .setFormat(DepthFrame.DepthFormat.UINT16_MILLIMETERS)
                .build()

        } catch (e: Exception) {
            android.util.Log.e("CameraDataExtractor", "✗ Depth processing failed: ${e.javaClass.simpleName}: ${e.message}")
            return null
        }
    }

    fun extractInferredGeometry(
        session: Session,
        pointCloud: PointCloud?
    ): InferredGeometry {
        val builder = InferredGeometry.newBuilder()

        // Extract planes (only TRACKING ones)
        for (plane in session.getAllTrackables(com.google.ar.core.Plane::class.java)) {
            if (plane.trackingState != TrackingState.TRACKING) continue

            val planeBuilder = InferredGeometry.Plane.newBuilder()
                .setType(mapPlaneType(plane.type))
                .setExtentX(plane.extentX)
                .setExtentZ(plane.extentZ)

            val pose = plane.centerPose
            planeBuilder.centerPose = Pose.newBuilder()
                .setPosition(Vector3.newBuilder().setX(pose.tx()).setY(pose.ty()).setZ(pose.tz()))
                .setRotation(Quaternion.newBuilder().setX(pose.qx()).setY(pose.qy()).setZ(pose.qz()).setW(pose.qw()))
                .build()

            val polygon = plane.polygon
            if (polygon != null) {
                polygon.rewind()
                while (polygon.remaining() >= 2) {
                    val x = polygon.get()
                    val z = polygon.get()
                    planeBuilder.addPolygon(Vector3.newBuilder().setX(x).setY(0f).setZ(z))
                }
            }

            builder.addPlanes(planeBuilder)
        }

        // Extract point cloud (sparse SLAM feature points)
        if (pointCloud != null) {
            val points = pointCloud.points
            points.rewind()
            while (points.remaining() >= 4) {
                val x = points.get()
                val y = points.get()
                val z = points.get()
                val confidence = points.get()
                builder.addPointCloud(
                    InferredGeometry.TrackedPoint.newBuilder()
                        .setPoint(Vector3.newBuilder().setX(x).setY(y).setZ(z))
                        .setConfidence(confidence)
                )
            }
        }

        return builder.build()
    }

    private fun mapPlaneType(type: com.google.ar.core.Plane.Type): InferredGeometry.Plane.PlaneType {
        return when (type) {
            com.google.ar.core.Plane.Type.HORIZONTAL_UPWARD_FACING -> InferredGeometry.Plane.PlaneType.HORIZONTAL_UPWARD_FACING
            com.google.ar.core.Plane.Type.HORIZONTAL_DOWNWARD_FACING -> InferredGeometry.Plane.PlaneType.HORIZONTAL_DOWNWARD_FACING
            com.google.ar.core.Plane.Type.VERTICAL -> InferredGeometry.Plane.PlaneType.VERTICAL
            else -> InferredGeometry.Plane.PlaneType.PLANE_TYPE_UNKNOWN
        }
    }
}
