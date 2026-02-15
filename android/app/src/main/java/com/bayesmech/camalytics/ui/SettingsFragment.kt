package com.bayesmech.camalytics.ui

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bayesmech.camalytics.AppViewModel
import com.bayesmech.camalytics.MainActivity
import com.bayesmech.camalytics.R
import com.bayesmech.camalytics.databinding.FragmentSettingsBinding
import com.bayesmech.camalytics.databinding.ItemSavedFileBinding
import com.bayesmech.camalytics.network.ConnectionStatus
import com.bayesmech.camalytics.recording.RecordingManager
import kotlinx.coroutines.launch
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SettingsFragment : Fragment() {

    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    private val viewModel: AppViewModel by activityViewModels()

    enum class Page {
        MAIN, SERVER_CONNECTION, SENSOR_PROPERTIES, SAVED_FILES, USER_PROFILE, ABOUT
    }

    private var currentPage = Page.MAIN

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        showPage(Page.MAIN)

        // Back button
        binding.backButton.setOnClickListener { showPage(Page.MAIN) }

        // Main page navigation
        binding.cardServerConnection.setOnClickListener { showPage(Page.SERVER_CONNECTION) }
        binding.cardSavedFiles.setOnClickListener { showPage(Page.SAVED_FILES) }
        binding.cardSensorProperties.setOnClickListener { showPage(Page.SENSOR_PROPERTIES) }
        binding.cardUserProfile.setOnClickListener { showPage(Page.USER_PROFILE) }
        binding.cardAbout.setOnClickListener { showPage(Page.ABOUT) }

        setupSensorPropertiesPage()
        setupServerConnectionPage()
        loadSavedFiles()

        // Observe connection status for the server connection page
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.connectionStatus.collect { status ->
                status?.let { updateConnectionStatusUI(it) }
            }
        }

        // Observe coverage stats for sensor properties page
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.coverageStats.collect { stats ->
                binding.coverageDepth.text = "%.0f%%".format(stats.depthCoverage)
                binding.coverageAccel.text = "%.0f%%".format(stats.accelerometerCoverage)
                binding.coverageGyro.text = "%.0f%%".format(stats.gyroscopeCoverage)
                binding.coverageMag.text = "%.0f%%".format(stats.magnetometerCoverage)
                binding.coverageIntrinsics.text = "${stats.cameraIntrinsicsCount} frame(s)"
                binding.coveragePose.text = "%.1f%%".format(stats.poseCoverage)
                binding.coverageGeometry.text = "%.0f%%".format(stats.inferredGeometryCoverage)
                binding.coverageFps.text = "%.1f FPS".format(stats.averageFps)
            }
        }
    }

    private fun showPage(page: Page) {
        currentPage = page

        // Show/hide header back button and title
        val isMain = page == Page.MAIN
        binding.backButton.visibility = if (isMain) View.GONE else View.VISIBLE
        binding.pageTitle.text = when (page) {
            Page.MAIN -> "Settings"
            Page.SERVER_CONNECTION -> "Server Connection"
            Page.SENSOR_PROPERTIES -> "Sensor Properties"
            Page.SAVED_FILES -> "Saved Files"
            Page.USER_PROFILE -> "User Profile"
            Page.ABOUT -> "About"
        }

        // Hide all pages, show the requested one
        binding.pageMain.visibility = View.GONE
        binding.pageServerConnection.visibility = View.GONE
        binding.pageSensorProperties.visibility = View.GONE
        binding.pageSavedFiles.visibility = View.GONE
        binding.pageGeneric.visibility = View.GONE

        when (page) {
            Page.MAIN -> binding.pageMain.visibility = View.VISIBLE
            Page.SERVER_CONNECTION -> binding.pageServerConnection.visibility = View.VISIBLE
            Page.SENSOR_PROPERTIES -> binding.pageSensorProperties.visibility = View.VISIBLE
            Page.SAVED_FILES -> {
                binding.pageSavedFiles.visibility = View.VISIBLE
                loadSavedFiles()
            }
            Page.USER_PROFILE -> {
                binding.pageGeneric.visibility = View.VISIBLE
                binding.genericPageMessage.text = "User Profile settings would go here."
            }
            Page.ABOUT -> {
                binding.pageGeneric.visibility = View.VISIBLE
                binding.genericPageMessage.text = "BayesMech Vision\nVersion 1.0\n\nAR data capture and streaming application."
            }
        }
    }

    fun onBackPressed(): Boolean {
        return if (currentPage != Page.MAIN) {
            showPage(Page.MAIN)
            true
        } else {
            false
        }
    }

    // ── Server Connection ────────────────────────────────────────────────────

    private fun setupServerConnectionPage() {
        binding.serverUrlInput.setText(viewModel.serverUrl.value)
        binding.serverUrlInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val url = s?.toString()?.trim() ?: return
                if (url.isNotEmpty()) {
                    viewModel.setServerUrl(url)
                }
            }
        })
    }

    private fun updateConnectionStatusUI(status: ConnectionStatus) {
        if (status.isConnected) {
            binding.connectionStatusTitle.text = "Connected"
            binding.connectionStatusSubtitle.text = "Streaming to ${status.serverUrl}"
            binding.connectionStatusDot.setBackgroundResource(R.drawable.dot_connected)
        } else if (status.isRetrying) {
            val tryingForSec = status.lastErrorTime?.let {
                (System.currentTimeMillis() - it) / 1000
            } ?: 0
            binding.connectionStatusTitle.text = "Attempting to Reconnect"
            binding.connectionStatusSubtitle.text =
                "Attempt #${status.retryCount}, Trying for ${tryingForSec}s"
            binding.connectionStatusDot.setBackgroundResource(R.drawable.dot_reconnecting)
        } else {
            binding.connectionStatusTitle.text = "Disconnected"
            binding.connectionStatusSubtitle.text = status.lastError ?: "Not connected"
            binding.connectionStatusDot.setBackgroundResource(R.drawable.dot_disconnected)
        }
    }

    // ── Sensor Properties ────────────────────────────────────────────────────

    private fun setupSensorPropertiesPage() {
        // Initialize switch states from ViewModel
        binding.switchDepthData.isChecked = viewModel.enableDepthData.value
        binding.switchInferredGeometry.isChecked = viewModel.enableInferredGeometry.value
        binding.switchVisualizeDepth.isChecked = viewModel.visualizeDepthMap.value
        binding.switchVisualizePoints.isChecked = viewModel.visualizePointCloud.value
        binding.switchVisualizePlanes.isChecked = viewModel.visualizePlanes.value

        binding.switchDepthData.setOnCheckedChangeListener { _, checked ->
            viewModel.setEnableDepthData(checked)
        }
        binding.switchInferredGeometry.setOnCheckedChangeListener { _, checked ->
            viewModel.setEnableInferredGeometry(checked)
        }
        binding.switchVisualizeDepth.setOnCheckedChangeListener { _, checked ->
            viewModel.setVisualizeDepthMap(checked)
        }
        binding.switchVisualizePoints.setOnCheckedChangeListener { _, checked ->
            viewModel.setVisualizePointCloud(checked)
        }
        binding.switchVisualizePlanes.setOnCheckedChangeListener { _, checked ->
            viewModel.setVisualizePlanes(checked)
        }
    }

    // ── Saved Files ──────────────────────────────────────────────────────────

    private fun loadSavedFiles() {
        val mainActivity = activity as? MainActivity ?: return
        val recordings = mainActivity.recordingManager.listRecordings()
            .sortedByDescending { it.lastModified() }

        binding.savedFilesEmpty.visibility = if (recordings.isEmpty()) View.VISIBLE else View.GONE
        binding.savedFilesList.visibility = if (recordings.isEmpty()) View.GONE else View.VISIBLE

        if (recordings.isNotEmpty()) {
            binding.savedFilesList.layoutManager = LinearLayoutManager(requireContext())
            binding.savedFilesList.adapter = SavedFilesAdapter(
                recordings,
                onShare = { shareFile(it) },
                onDelete = { confirmDelete(it) }
            )
        }
    }

    private fun shareFile(file: File) {
        try {
            val uri: Uri = FileProvider.getUriForFile(
                requireContext(),
                "${requireContext().packageName}.fileprovider",
                file
            )
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/octet-stream"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "AR Recording: ${file.name}")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            startActivity(Intent.createChooser(intent, "Share Recording"))
        } catch (e: Exception) {
            Log.e("SettingsFragment", "Error sharing file", e)
        }
    }

    private fun confirmDelete(file: File) {
        AlertDialog.Builder(requireContext())
            .setTitle("Delete Recording")
            .setMessage("Delete ${file.name}?")
            .setPositiveButton("Delete") { _, _ ->
                file.delete()
                loadSavedFiles()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}

// ── Saved Files RecyclerView Adapter ────────────────────────────────────────

class SavedFilesAdapter(
    private val files: List<File>,
    private val onShare: (File) -> Unit,
    private val onDelete: (File) -> Unit
) : RecyclerView.Adapter<SavedFilesAdapter.ViewHolder>() {

    inner class ViewHolder(val binding: ItemSavedFileBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemSavedFileBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val file = files[position]
        holder.binding.fileName.text = file.name
        holder.binding.fileMeta.text = buildMeta(file)
        holder.binding.shareButton.setOnClickListener { onShare(file) }
        holder.binding.deleteButton.setOnClickListener { onDelete(file) }
    }

    override fun getItemCount() = files.size

    private fun buildMeta(file: File): String {
        val date = SimpleDateFormat("MMM dd, yyyy • hh:mm a", Locale.getDefault())
            .format(Date(file.lastModified()))
        val size = when {
            file.length() < 1024 -> "${file.length()} B"
            file.length() < 1024 * 1024 -> "${file.length() / 1024} KB"
            else -> "%.1f MB".format(file.length() / (1024.0 * 1024.0))
        }
        return "$size • $date"
    }
}
