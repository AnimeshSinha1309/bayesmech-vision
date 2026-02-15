package com.bayesmech.camalytics

import android.os.Bundle
import android.util.Log
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.google.ar.core.Config
import com.google.ar.core.Session
import com.bayesmech.camalytics.common.helpers.ARCoreSessionLifecycleHelper
import com.bayesmech.camalytics.common.helpers.CameraPermissionHelper
import com.bayesmech.camalytics.common.samplerender.SampleRender
import com.bayesmech.camalytics.databinding.ActivityMainBinding
import com.bayesmech.camalytics.network.StreamConfig
import com.bayesmech.camalytics.recording.RecordingManager
import com.bayesmech.camalytics.ui.CameraFragment
import com.bayesmech.camalytics.ui.LibraryFragment
import com.bayesmech.camalytics.ui.SettingsFragment
import com.google.ar.core.exceptions.CameraNotAvailableException
import com.google.ar.core.exceptions.UnavailableApkTooOldException
import com.google.ar.core.exceptions.UnavailableDeviceNotCompatibleException
import com.google.ar.core.exceptions.UnavailableSdkTooOldException
import com.google.ar.core.exceptions.UnavailableUserDeclinedInstallationException
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.debounce
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val COVERAGE_POLL_INTERVAL_MS = 1000L
    }

    val appViewModel: AppViewModel by viewModels()

    lateinit var arCoreSessionHelper: ARCoreSessionLifecycleHelper
    lateinit var renderer: DatagrabRenderer
    lateinit var recordingManager: RecordingManager

    private lateinit var binding: ActivityMainBinding

    // Track which fragment tab is active (0=camera, 1=library, 2=settings)
    private var activeTabIndex = 0

    @OptIn(FlowPreview::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Keep screen on during AR recording
        window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Edge-to-edge: GL surface fills the whole screen including behind the status bar.
        // The UI overlay (header + nav) is shifted down/up by the real inset heights so
        // content never hides behind the status bar, camera notch, or gesture nav bar.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            // Push the header down by exactly the status-bar + notch height
            binding.appHeader.setPadding(
                binding.appHeader.paddingLeft,
                bars.top,
                binding.appHeader.paddingRight,
                binding.appHeader.paddingBottom
            )
            // Pad the bottom nav up by the gesture/nav-bar height
            binding.bottomNav.setPadding(0, 0, 0, bars.bottom)
            insets
        }

        recordingManager = RecordingManager(this)

        // ── ARCore setup ────────────────────────────────────────────────────
        arCoreSessionHelper = ARCoreSessionLifecycleHelper(this)
        arCoreSessionHelper.exceptionCallback = { exception ->
            val message = when (exception) {
                is UnavailableUserDeclinedInstallationException ->
                    getString(R.string.error_arcore_not_installed)
                is UnavailableApkTooOldException -> getString(R.string.error_arcore_outdated)
                is UnavailableSdkTooOldException -> getString(R.string.error_app_outdated)
                is UnavailableDeviceNotCompatibleException ->
                    getString(R.string.error_device_not_compatible)
                is CameraNotAvailableException -> getString(R.string.error_camera_unavailable)
                else -> getString(R.string.error_ar_session_failed, exception.toString())
            }
            Log.e(TAG, "ARCore threw an exception", exception)
            appViewModel.setArcoreError(message)
        }
        arCoreSessionHelper.beforeSessionResume = ::configureSession
        lifecycle.addObserver(arCoreSessionHelper)

        // ── Renderer setup ──────────────────────────────────────────────────
        renderer = DatagrabRenderer(this)
        lifecycle.addObserver(renderer)
        SampleRender(binding.surfaceview, renderer, assets)

        // ── Start streaming ─────────────────────────────────────────────────
        val streamConfig = StreamConfig(
            serverUrl = appViewModel.serverUrl.value,
            targetFps = 20,
            sendRgbFrames = true,
            sendDepthFrames = true,
            rgbJpegQuality = 80,
            enableAdaptiveQuality = true
        )
        renderer.startStreaming(streamConfig)

        // ── Bottom navigation ────────────────────────────────────────────────
        binding.navCamera.setOnClickListener { switchTab(0) }
        binding.navLibrary.setOnClickListener { switchTab(1) }
        binding.navSettings.setOnClickListener { switchTab(2) }

        // Show initial fragment
        if (savedInstanceState == null) {
            switchTab(0)
        }

        // ── Observe server URL changes and reconnect ─────────────────────────
        lifecycleScope.launch {
            @Suppress("EXPERIMENTAL_API_USAGE")
            appViewModel.serverUrl
                .drop(1)           // skip initial emission
                .debounce(600)     // wait for typing to pause
                .collect { url ->
                    if (renderer.isStreaming()) {
                        Log.i(TAG, "Server URL changed, reconnecting to $url")
                        renderer.restartStreaming(url)
                    }
                }
        }

        // ── Poll coverage tracker and push to ViewModel ──────────────────────
        lifecycleScope.launch {
            while (true) {
                kotlinx.coroutines.delay(COVERAGE_POLL_INTERVAL_MS)
                appViewModel.updateCoverageStats(renderer.getCoverageTracker().getStats())
            }
        }
    }

    private fun configureSession(session: Session) {
        session.configure(
            session.config.apply {
                lightEstimationMode = Config.LightEstimationMode.ENVIRONMENTAL_HDR
                depthMode = if (session.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
                    Config.DepthMode.AUTOMATIC
                } else {
                    Config.DepthMode.DISABLED
                }
            }
        )
    }

    private fun switchTab(index: Int) {
        if (index == activeTabIndex && supportFragmentManager.findFragmentById(R.id.fragment_container) != null) {
            return
        }

        val fragment: Fragment = when (index) {
            0 -> CameraFragment()
            1 -> LibraryFragment()
            2 -> SettingsFragment()
            else -> CameraFragment()
        }

        // Update indicator bars
        binding.indicatorCamera.alpha = if (index == 0) 1f else 0f
        binding.indicatorLibrary.alpha = if (index == 1) 1f else 0f
        binding.indicatorSettings.alpha = if (index == 2) 1f else 0f

        // Update icon tints
        val red = getColor(R.color.accent_red)
        val gray = getColor(R.color.nav_icon_inactive)
        binding.navCamera.setColorFilter(if (index == 0) red else gray)
        binding.navLibrary.setColorFilter(if (index == 1) red else gray)
        binding.navSettings.setColorFilter(if (index == 2) red else gray)

        val direction = index - activeTabIndex
        activeTabIndex = index

        val (enterAnim, exitAnim) = if (direction > 0) {
            R.anim.slide_in_right to R.anim.slide_out_left
        } else {
            R.anim.slide_in_left to R.anim.slide_out_right
        }

        supportFragmentManager.beginTransaction()
            .setCustomAnimations(enterAnim, exitAnim)
            .replace(R.id.fragment_container, fragment)
            .commit()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        results: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, results)
        if (!CameraPermissionHelper.hasCameraPermission(this)) {
            if (!CameraPermissionHelper.shouldShowRequestPermissionRationale(this)) {
                CameraPermissionHelper.launchPermissionSettings(this)
            }
            finish()
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
    }

    override fun onDestroy() {
        super.onDestroy()
        renderer.stopStreaming()
    }
}
