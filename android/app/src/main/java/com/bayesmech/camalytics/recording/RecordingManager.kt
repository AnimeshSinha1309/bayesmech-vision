package com.bayesmech.camalytics.recording

import android.content.Context
import android.os.Environment
import android.util.Log
import com.bayesmech.vision.PerceiverDataFrame
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Manages recording of AR frames to local storage.
 * Writes frames as length-delimited protobuf messages.
 */
class RecordingManager(private val context: Context) {
    private val TAG = "RecordingManager"
    
    private var currentFile: File? = null
    private var outputStream: FileOutputStream? = null
    private var frameCount = 0
    private var isRecording = false
    
    companion object {
        private const val RECORDINGS_DIR = "ARStream/recordings"
        private const val FILE_PREFIX = "arstream_"
        private const val FILE_EXTENSION = ".pb"
    }
    
    /**
     * Start a new recording session.
     * @return The filename of the recording, or null if failed
     */
    fun startRecording(): String? {
        if (isRecording) {
            Log.w(TAG, "Recording already in progress")
            return null
        }
        
        try {
            // Create recordings directory if it doesn't exist
            val recordingsDir = getRecordingsDirectory()
            if (!recordingsDir.exists()) {
                val created = recordingsDir.mkdirs()
                if (!created && !recordingsDir.exists()) {
                    Log.e(TAG, "Failed to create recordings directory: ${recordingsDir.absolutePath}")
                    return null
                }
            }
            
            // Verify directory is writable
            if (!recordingsDir.canWrite()) {
                Log.e(TAG, "Recordings directory is not writable: ${recordingsDir.absolutePath}")
                return null
            }
            
            // Generate filename with timestamp
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val filename = "$FILE_PREFIX$timestamp$FILE_EXTENSION"
            currentFile = File(recordingsDir, filename)
            
            // Open file for writing
            outputStream = FileOutputStream(currentFile)
            
            isRecording = true
            frameCount = 0
            
            Log.i(TAG, "Started recording to: ${currentFile?.absolutePath}")
            return filename
            
        } catch (e: IOException) {
            Log.e(TAG, "Failed to start recording", e)
            cleanup()
            return null
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied for recording", e)
            cleanup()
            return null
        }
    }
    
    /**
     * Stop the current recording session.
     * @return The file containing the recording, or null if no recording was active
     */
    fun stopRecording(): File? {
        if (!isRecording) {
            Log.w(TAG, "No recording in progress")
            return null
        }
        
        try {
            outputStream?.flush()
            outputStream?.close()
            
            Log.i(TAG, "Stopped recording. Frames recorded: $frameCount, File: ${currentFile?.absolutePath}")
            
            val file = currentFile
            cleanup()
            return file
            
        } catch (e: IOException) {
            Log.e(TAG, "Error stopping recording", e)
            cleanup()
            return null
        }
    }
    
    /**
     * Write a single AR frame to the recording.
     * Frame is written with a 4-byte length prefix for length-delimited format.
     */
    fun writeFrame(frame: PerceiverDataFrame) {
        if (!isRecording) {
            return
        }
        
        try {
            val frameBytes = frame.toByteArray()
            val length = frameBytes.size
            
            // Write 4-byte length prefix (big-endian)
            outputStream?.write((length shr 24) and 0xFF)
            outputStream?.write((length shr 16) and 0xFF)
            outputStream?.write((length shr 8) and 0xFF)
            outputStream?.write(length and 0xFF)
            
            // Write the frame data
            outputStream?.write(frameBytes)
            
            frameCount++
            
            if (frameCount % 100 == 0) {
                Log.d(TAG, "Recorded $frameCount frames")
            }
            
        } catch (e: IOException) {
            Log.e(TAG, "Error writing frame to recording", e)
            // Stop recording on error
            stopRecording()
        }
    }
    
    /**
     * Check if currently recording.
     */
    fun isRecording(): Boolean = isRecording
    
    /**
     * Get the current recording file.
     */
    fun getCurrentFile(): File? = currentFile
    
    /**
     * Get the number of frames recorded in the current session.
     */
    fun getFrameCount(): Int = frameCount
    
    /**
     * Get the recordings directory.
     * Uses app-specific external storage which doesn't require permissions.
     */
    private fun getRecordingsDirectory(): File {
        // Use app-specific external storage (no permissions needed)
        // Path: /storage/emulated/0/Android/data/com.bayesmech.camalytics/files/recordings
        val appExternalDir = context.getExternalFilesDir(null)
        return File(appExternalDir, "recordings")
    }
    
    /**
     * Clean up resources.
     */
    private fun cleanup() {
        try {
            outputStream?.close()
        } catch (e: IOException) {
            Log.e(TAG, "Error closing output stream", e)
        }
        
        outputStream = null
        currentFile = null
        isRecording = false
        frameCount = 0
    }
    
    /**
     * List all recorded files.
     */
    fun listRecordings(): List<File> {
        val recordingsDir = getRecordingsDirectory()
        if (!recordingsDir.exists()) {
            return emptyList()
        }
        
        return recordingsDir.listFiles { file ->
            file.isFile && file.name.startsWith(FILE_PREFIX) && file.name.endsWith(FILE_EXTENSION)
        }?.toList() ?: emptyList()
    }
}
