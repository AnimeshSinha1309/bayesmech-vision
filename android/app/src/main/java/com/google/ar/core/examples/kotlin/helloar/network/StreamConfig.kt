package com.google.ar.core.examples.kotlin.helloar.network

data class StreamConfig(
    val serverUrl: String = "ws://192.168.1.100:8080/ar-stream",
    val targetFps: Int = 30,              // Target streaming FPS
    val maxQueueSize: Int = 5,            // Frame queue size

    // Data selection
    val sendRgbFrames: Boolean = true,
    val sendDepthFrames: Boolean = true,
    val sendARCoreData: Boolean = false,  // Planes/points optional

    // Compression
    val rgbJpegQuality: Int = 75,         // 0-100, lower = smaller
    val depthCompression: Boolean = false, // PNG compression for depth
    val subsamplePointCloud: Float = 0.1f, // Keep 10% of points

    // Adaptive streaming
    val enableAdaptiveQuality: Boolean = true,
    val minFps: Int = 10,
    val maxFps: Int = 30
)

enum class QualityLevel(
    val targetFps: Int,
    val rgbWidth: Int,
    val rgbHeight: Int,
    val jpegQuality: Int,
    val depthScale: Float,
    val pointCloudSubsample: Float,
    val sendRgb: Boolean,
    val sendDepth: Boolean
) {
    FULL(30, 1280, 720, 85, 1.0f, 1.0f, true, true),
    HIGH(30, 960, 540, 80, 1.0f, 0.5f, true, true),
    MEDIUM(25, 640, 480, 75, 1.0f, 0.2f, true, true),
    LOW(20, 480, 360, 70, 1.0f, 0.1f, true, true),
    MINIMAL(15, 320, 240, 60, 1.0f, 0.0f, true, false);
}
