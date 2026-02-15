package com.bayesmech.camalytics.coverage

/**
 * Tracks data coverage over a rolling 10-second window.
 *
 * For each AR frame captured, records which data types were present.
 * Computes per-type coverage as a percentage of all frames in the window.
 * Thread-safe: called from IO dispatcher in ARDataCapture, read from UI thread.
 */
class CoverageTracker {

    private val windowMs = 10_000L

    private data class FrameRecord(
        val timestampMs: Long,
        val hasDepth: Boolean,
        val hasAccelerometer: Boolean,
        val hasGyroscope: Boolean,
        val hasMagnetometer: Boolean,
        val hasIntrinsics: Boolean,
        val hasPose: Boolean,
        val hasGeometry: Boolean
    )

    private val lock = Any()
    private val frames = ArrayDeque<FrameRecord>()
    private var totalIntrinsicsCount = 0

    fun recordFrame(
        hasDepth: Boolean,
        hasAccelerometer: Boolean,
        hasGyroscope: Boolean,
        hasMagnetometer: Boolean,
        hasIntrinsics: Boolean,
        hasPose: Boolean,
        hasGeometry: Boolean
    ) {
        val now = System.currentTimeMillis()
        synchronized(lock) {
            if (hasIntrinsics) totalIntrinsicsCount++
            frames.addLast(
                FrameRecord(
                    now, hasDepth, hasAccelerometer, hasGyroscope,
                    hasMagnetometer, hasIntrinsics, hasPose, hasGeometry
                )
            )
            pruneOldFrames(now)
        }
    }

    fun getStats(): CoverageStats {
        val now = System.currentTimeMillis()
        synchronized(lock) {
            pruneOldFrames(now)
            val total = frames.size
            if (total == 0) return CoverageStats(cameraIntrinsicsCount = totalIntrinsicsCount)

            val timeSpanMs = if (total >= 2) {
                frames.last().timestampMs - frames.first().timestampMs
            } else {
                1000L
            }
            val fps = if (timeSpanMs > 0) (total * 1000f / timeSpanMs) else 0f

            return CoverageStats(
                depthCoverage = frames.count { it.hasDepth } * 100f / total,
                accelerometerCoverage = frames.count { it.hasAccelerometer } * 100f / total,
                gyroscopeCoverage = frames.count { it.hasGyroscope } * 100f / total,
                magnetometerCoverage = frames.count { it.hasMagnetometer } * 100f / total,
                cameraIntrinsicsCount = totalIntrinsicsCount,
                poseCoverage = frames.count { it.hasPose } * 100f / total,
                inferredGeometryCoverage = frames.count { it.hasGeometry } * 100f / total,
                averageFps = fps
            )
        }
    }

    fun reset() {
        synchronized(lock) {
            frames.clear()
            totalIntrinsicsCount = 0
        }
    }

    private fun pruneOldFrames(now: Long) {
        while (frames.isNotEmpty() && now - frames.first().timestampMs > windowMs) {
            frames.removeFirst()
        }
    }
}
