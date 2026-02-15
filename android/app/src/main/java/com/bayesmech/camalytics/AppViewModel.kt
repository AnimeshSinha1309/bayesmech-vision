package com.bayesmech.camalytics

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import com.bayesmech.camalytics.coverage.CoverageStats
import com.bayesmech.camalytics.network.ConnectionStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppViewModel(application: Application) : AndroidViewModel(application) {

    private val prefs = application.getSharedPreferences("app_settings", Context.MODE_PRIVATE)

    // ── Server ──────────────────────────────────────────────────────────────

    private val _serverUrl = MutableStateFlow(
        prefs.getString("server_url", "ws://192.168.1.2:8080/ar-stream")
            ?: "ws://192.168.1.2:8080/ar-stream"
    )
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    fun setServerUrl(url: String) {
        _serverUrl.value = url
        prefs.edit().putString("server_url", url).apply()
    }

    // ── Data selection settings ──────────────────────────────────────────────

    private val _enableDepthData = MutableStateFlow(prefs.getBoolean("enable_depth", true))
    val enableDepthData: StateFlow<Boolean> = _enableDepthData.asStateFlow()

    fun setEnableDepthData(enabled: Boolean) {
        _enableDepthData.value = enabled
        prefs.edit().putBoolean("enable_depth", enabled).apply()
    }

    private val _enableInferredGeometry = MutableStateFlow(prefs.getBoolean("enable_geometry", false))
    val enableInferredGeometry: StateFlow<Boolean> = _enableInferredGeometry.asStateFlow()

    fun setEnableInferredGeometry(enabled: Boolean) {
        _enableInferredGeometry.value = enabled
        prefs.edit().putBoolean("enable_geometry", enabled).apply()
    }

    // ── Visualization settings ───────────────────────────────────────────────

    private val _visualizeDepthMap = MutableStateFlow(prefs.getBoolean("viz_depth", false))
    val visualizeDepthMap: StateFlow<Boolean> = _visualizeDepthMap.asStateFlow()

    fun setVisualizeDepthMap(enabled: Boolean) {
        _visualizeDepthMap.value = enabled
        prefs.edit().putBoolean("viz_depth", enabled).apply()
    }

    private val _visualizePointCloud = MutableStateFlow(prefs.getBoolean("viz_points", true))
    val visualizePointCloud: StateFlow<Boolean> = _visualizePointCloud.asStateFlow()

    fun setVisualizePointCloud(enabled: Boolean) {
        _visualizePointCloud.value = enabled
        prefs.edit().putBoolean("viz_points", enabled).apply()
    }

    private val _visualizePlanes = MutableStateFlow(prefs.getBoolean("viz_planes", false))
    val visualizePlanes: StateFlow<Boolean> = _visualizePlanes.asStateFlow()

    fun setVisualizePlanes(enabled: Boolean) {
        _visualizePlanes.value = enabled
        prefs.edit().putBoolean("viz_planes", enabled).apply()
    }

    // ── Connection status (written by MainActivity, read by SettingsFragment) ─

    private val _connectionStatus = MutableStateFlow<ConnectionStatus?>(null)
    val connectionStatus: StateFlow<ConnectionStatus?> = _connectionStatus.asStateFlow()

    fun updateConnectionStatus(status: ConnectionStatus) {
        _connectionStatus.value = status
    }

    // ── Recording state ──────────────────────────────────────────────────────

    private val _isRecording = MutableStateFlow(false)
    val isRecording: StateFlow<Boolean> = _isRecording.asStateFlow()

    fun setRecording(recording: Boolean) {
        _isRecording.value = recording
    }

    // ── Coverage stats (written by MainActivity via CoverageTracker) ──────────

    private val _coverageStats = MutableStateFlow(CoverageStats())
    val coverageStats: StateFlow<CoverageStats> = _coverageStats.asStateFlow()

    fun updateCoverageStats(stats: CoverageStats) {
        _coverageStats.value = stats
    }

    // ── ARCore / rendering errors (logged, not toasted) ───────────────────────

    private val _arcoreError = MutableStateFlow<String?>(null)
    val arcoreError: StateFlow<String?> = _arcoreError.asStateFlow()

    fun setArcoreError(message: String) {
        _arcoreError.value = message
    }

    fun clearArcoreError() {
        _arcoreError.value = null
    }
}
