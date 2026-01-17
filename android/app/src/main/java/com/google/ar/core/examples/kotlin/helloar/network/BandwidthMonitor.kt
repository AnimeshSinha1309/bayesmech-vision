package com.google.ar.core.examples.kotlin.helloar.network

class BandwidthMonitor {
    private val sendTimes = mutableListOf<Pair<Long, Int>>()  // (timestamp, bytes)
    private val windowMs = 5000L  // 5 second window

    fun recordSent(bytes: Int) {
        val now = System.currentTimeMillis()
        sendTimes.add(now to bytes)

        // Remove old entries
        sendTimes.removeAll { it.first < now - windowMs }
    }

    fun getCurrentBandwidthMbps(): Double {
        if (sendTimes.size < 2) return 0.0

        val totalBytes = sendTimes.sumOf { it.second }
        val timeSpanMs = sendTimes.last().first - sendTimes.first().first

        if (timeSpanMs == 0L) return 0.0

        // Convert to Mbps
        return (totalBytes * 8.0) / (timeSpanMs / 1000.0) / 1_000_000.0
    }

    fun getQualityLevel(): QualityLevel {
        val bw = getCurrentBandwidthMbps()
        return when {
            bw > 3.0 -> QualityLevel.FULL
            bw > 1.5 -> QualityLevel.HIGH
            bw > 0.8 -> QualityLevel.MEDIUM
            bw > 0.4 -> QualityLevel.LOW
            else -> QualityLevel.MINIMAL
        }
    }
}
