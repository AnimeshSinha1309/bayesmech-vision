package com.bayesmech.camalytics.coverage

data class CoverageStats(
    val depthCoverage: Float = 0f,
    val accelerometerCoverage: Float = 0f,
    val gyroscopeCoverage: Float = 0f,
    val magnetometerCoverage: Float = 0f,
    val cameraIntrinsicsCount: Int = 0,
    val poseCoverage: Float = 0f,
    val inferredGeometryCoverage: Float = 0f,
    val averageFps: Float = 0f
)
