package com.bayesmech.camalytics.recording

import android.content.Context
import android.util.Log
import com.bayesmech.vision.PerceiverDataFrame
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.channels.FileChannel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Manages recording of AR frames to local storage.
 * Writes frames as length-delimited protobuf messages.
 *
 * Wire format: [uint32 big-endian length][N bytes of serialized proto] repeated.
 *
 * Atomicity guarantee: each frame (4-byte header + data) is packed into a single
 * ByteBuffer and written via FileChannel.write(), so a SIGKILL cannot leave a
 * partial length prefix on disk. lastGoodPosition advances only after a confirmed
 * complete write. stopRecording() truncates the file to lastGoodPosition, removing
 * any partially-written trailing frame.
 */
class RecordingManager(private val context: Context) {
    private val TAG = "RecordingManager"

    private var currentFile: File? = null
    private var channel: FileChannel? = null
    private var lastGoodPosition: Long = 0L
    private var frameCount = 0
    private var isRecording = false

    companion object {
        private const val FILE_PREFIX = "arstream_"
        private const val FILE_EXTENSION = ".pb"
        private const val FSYNC_INTERVAL = 30  // fdatasync every N frames
    }

    /**
     * Start a new recording session.
     * @return The filename of the recording, or null if failed.
     */
    fun startRecording(): String? {
        if (isRecording) {
            Log.w(TAG, "Recording already in progress")
            return null
        }

        try {
            val recordingsDir = getRecordingsDirectory()
            if (!recordingsDir.exists()) {
                val created = recordingsDir.mkdirs()
                if (!created && !recordingsDir.exists()) {
                    Log.e(TAG, "Failed to create recordings directory: ${recordingsDir.absolutePath}")
                    return null
                }
            }

            if (!recordingsDir.canWrite()) {
                Log.e(TAG, "Recordings directory is not writable: ${recordingsDir.absolutePath}")
                return null
            }

            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val filename = "$FILE_PREFIX$timestamp$FILE_EXTENSION"
            currentFile = File(recordingsDir, filename)

            channel = FileOutputStream(currentFile!!).channel
            lastGoodPosition = 0L
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
     * Truncates the file to the last confirmed complete frame, then fsyncs.
     * @return The recording file, or null if no recording was active.
     */
    fun stopRecording(): File? {
        if (!isRecording) {
            Log.w(TAG, "No recording in progress")
            return null
        }

        try {
            channel?.let { ch ->
                val currentPos = ch.position()
                if (currentPos != lastGoodPosition) {
                    Log.w(
                        TAG,
                        "Truncating partial trailing frame: file at $currentPos, last good at $lastGoodPosition"
                    )
                    ch.truncate(lastGoodPosition)
                }
                // Full fsync including metadata so the OS won't lose frames on power-off.
                ch.force(true)
            }

            Log.i(
                TAG,
                "Stopped recording: $frameCount frames, ${lastGoodPosition} bytes, file=${currentFile?.absolutePath}"
            )

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
     *
     * The 4-byte big-endian length prefix and frame bytes are packed into one
     * ByteBuffer so there is no window where only part of the header is on disk.
     * lastGoodPosition is advanced only after the full packet is written; a crash
     * at any point leaves the file truncatable back to the previous good frame.
     */
    fun writeFrame(frame: PerceiverDataFrame) {
        if (!isRecording) return
        val ch = channel ?: return

        try {
            val frameBytes = frame.toByteArray()
            val length = frameBytes.size

            // Verify the channel position matches our last confirmed state. If it
            // drifted (e.g. OS partial write on a previous frame), truncate first.
            val currentPos = ch.position()
            if (currentPos != lastGoodPosition) {
                Log.w(
                    TAG,
                    "Position mismatch before frame $frameCount: expected $lastGoodPosition, got $currentPos; truncating"
                )
                ch.truncate(lastGoodPosition)
                ch.position(lastGoodPosition)
            }

            // Pack [4-byte big-endian length][frame bytes] as one contiguous buffer.
            val packet = ByteBuffer.allocate(4 + length)
            packet.put((length shr 24 and 0xFF).toByte())
            packet.put((length shr 16 and 0xFF).toByte())
            packet.put((length shr 8  and 0xFF).toByte())
            packet.put((length        and 0xFF).toByte())
            packet.put(frameBytes)
            packet.flip()

            // Write until the buffer is drained (FileChannel may loop for large frames).
            while (packet.hasRemaining()) {
                ch.write(packet)
            }

            // Advance the "last good" cursor only after the full packet is written.
            lastGoodPosition = ch.position()
            frameCount++

            // Periodic fdatasync: bounds data loss on power-off without flushing metadata
            // on every frame (which would be very slow).
            if (frameCount % FSYNC_INTERVAL == 0) {
                ch.force(false)
                Log.d(TAG, "fsync at frame $frameCount (${lastGoodPosition / 1024} KB written)")
            }

        } catch (e: IOException) {
            Log.e(TAG, "Error writing frame $frameCount", e)
            stopRecording()
        }
    }

    fun isRecording(): Boolean = isRecording
    fun getCurrentFile(): File? = currentFile
    fun getFrameCount(): Int = frameCount

    private fun getRecordingsDirectory(): File {
        // App-specific external storage — no WRITE_EXTERNAL_STORAGE permission needed.
        val appExternalDir = context.getExternalFilesDir(null)
        return File(appExternalDir, "recordings")
    }

    private fun cleanup() {
        try {
            channel?.close()
        } catch (e: IOException) {
            Log.e(TAG, "Error closing channel", e)
        }

        channel = null
        currentFile = null
        lastGoodPosition = 0L
        isRecording = false
        frameCount = 0
    }

    /**
     * List all recorded files, sorted by name (newest-first via timestamp in filename).
     */
    fun listRecordings(): List<File> {
        val recordingsDir = getRecordingsDirectory()
        if (!recordingsDir.exists()) return emptyList()

        return recordingsDir.listFiles { file ->
            file.isFile && file.name.startsWith(FILE_PREFIX) && file.name.endsWith(FILE_EXTENSION)
        }?.sortedByDescending { it.name }?.toList() ?: emptyList()
    }
}
