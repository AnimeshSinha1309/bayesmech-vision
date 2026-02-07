package com.bayesmech.camalytics

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bayesmech.camalytics.recording.RecordingManager
import com.google.android.material.button.MaterialButton
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Activity to display and manage recorded AR sessions.
 * Shows a list of recordings with options to share or delete each one.
 */
class RecordingsActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var emptyView: TextView
    private lateinit var recordingManager: RecordingManager
    private lateinit var adapter: RecordingsAdapter

    companion object {
        private const val TAG = "RecordingsActivity"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_recordings)

        // Set up toolbar
        val toolbar = findViewById<androidx.appcompat.widget.Toolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        recordingManager = RecordingManager(this)

        recyclerView = findViewById(R.id.recordings_recycler_view)
        emptyView = findViewById(R.id.empty_view)

        recyclerView.layoutManager = LinearLayoutManager(this)

        loadRecordings()
    }

    override fun onResume() {
        super.onResume()
        loadRecordings()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun loadRecordings() {
        val recordings = recordingManager.listRecordings().sortedByDescending { it.lastModified() }

        if (recordings.isEmpty()) {
            recyclerView.visibility = View.GONE
            emptyView.visibility = View.VISIBLE
        } else {
            recyclerView.visibility = View.VISIBLE
            emptyView.visibility = View.GONE

            adapter = RecordingsAdapter(recordings, ::onShareClick, ::onDeleteClick)
            recyclerView.adapter = adapter
        }

        Log.i(TAG, "Loaded ${recordings.size} recordings")
    }

    private fun onShareClick(file: File) {
        try {
            // Use FileProvider to get content URI
            val uri: Uri = FileProvider.getUriForFile(
                this,
                "${applicationContext.packageName}.fileprovider",
                file
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = "application/octet-stream"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "AR Recording: ${file.name}")
                putExtra(Intent.EXTRA_TEXT, "Sharing AR recording captured on ${getFormattedDate(file)}")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            startActivity(Intent.createChooser(shareIntent, "Share Recording"))

        } catch (e: Exception) {
            Log.e(TAG, "Error sharing file", e)
            Toast.makeText(this, "Failed to share: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun onDeleteClick(file: File) {
        AlertDialog.Builder(this)
            .setTitle("Delete Recording")
            .setMessage("Are you sure you want to delete ${file.name}?")
            .setPositiveButton("Delete") { _, _ ->
                try {
                    if (file.delete()) {
                        Toast.makeText(this, "Recording deleted", Toast.LENGTH_SHORT).show()
                        loadRecordings()
                    } else {
                        Toast.makeText(this, "Failed to delete recording", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error deleting file", e)
                    Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun getFormattedDate(file: File): String {
        val date = Date(file.lastModified())
        val format = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        return format.format(date)
    }
}

/**
 * RecyclerView adapter for displaying recording items.
 */
class RecordingsAdapter(
    private val recordings: List<File>,
    private val onShareClick: (File) -> Unit,
    private val onDeleteClick: (File) -> Unit
) : RecyclerView.Adapter<RecordingsAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val nameText: TextView = view.findViewById(R.id.recording_name)
        val dateText: TextView = view.findViewById(R.id.recording_date)
        val sizeText: TextView = view.findViewById(R.id.recording_size)
        val shareButton: MaterialButton = view.findViewById(R.id.share_button)
        val deleteButton: MaterialButton = view.findViewById(R.id.delete_button)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_recording, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val file = recordings[position]

        holder.nameText.text = file.name
        holder.dateText.text = formatDate(file.lastModified())
        holder.sizeText.text = formatFileSize(file.length())

        holder.shareButton.setOnClickListener { onShareClick(file) }
        holder.deleteButton.setOnClickListener { onDeleteClick(file) }
    }

    override fun getItemCount() = recordings.size

    private fun formatDate(timestamp: Long): String {
        val date = Date(timestamp)
        val format = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        return format.format(date)
    }

    private fun formatFileSize(bytes: Long): String {
        return when {
            bytes < 1024 -> "$bytes B"
            bytes < 1024 * 1024 -> "${bytes / 1024} KB"
            else -> "%.1f MB".format(bytes / (1024.0 * 1024.0))
        }
    }
}
