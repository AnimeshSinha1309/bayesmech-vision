package com.bayesmech.camalytics.ui

import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import com.bayesmech.camalytics.AppViewModel
import com.bayesmech.camalytics.MainActivity
import com.bayesmech.camalytics.databinding.FragmentCameraBinding
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class CameraFragment : Fragment() {

    private var _binding: FragmentCameraBinding? = null
    private val binding get() = _binding!!

    private val viewModel: AppViewModel by activityViewModels()

    private var timerJob: Job? = null
    private var recordingStartMs = 0L
    private var pulseAnimator: ObjectAnimator? = null
    private var isFullscreen = false

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCameraBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Record button
        binding.recordButton.setOnClickListener {
            val isRecording = viewModel.isRecording.value
            val mainActivity = activity as? MainActivity ?: return@setOnClickListener

            if (isRecording) {
                val file = mainActivity.recordingManager.stopRecording()
                viewModel.setRecording(false)
            } else {
                val filename = mainActivity.recordingManager.startRecording()
                if (filename != null) {
                    viewModel.setRecording(true)
                }
            }
        }

        // Observe recording state
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.isRecording.collect { recording ->
                updateRecordButtonState(recording)
                if (recording) {
                    recordingStartMs = System.currentTimeMillis()
                    startTimer()
                } else {
                    stopTimer()
                    binding.recordingTimer.text = ""
                    binding.recordingTimer.visibility = View.GONE
                }
            }
        }

        // Fullscreen toggle
        binding.fullscreenButton.setOnClickListener { toggleFullscreen() }

        // Non-functional UI placeholders
        binding.helpButton.setOnClickListener { /* placeholder */ }
        binding.micButton.setOnClickListener { /* placeholder */ }
        binding.sendButton.setOnClickListener {
            binding.messageInput.text?.clear()
        }
        binding.messageInput.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: android.text.Editable?) {
                binding.sendButton.isEnabled = !s.isNullOrBlank()
                binding.sendButton.alpha = if (!s.isNullOrBlank()) 1f else 0.4f
            }
        })
    }

    private fun toggleFullscreen() {
        isFullscreen = !isFullscreen
        if (isFullscreen) {
            binding.chatPanel.visibility = View.GONE
            binding.recordButton.visibility = View.GONE
            binding.fullscreenButton.setImageResource(com.bayesmech.camalytics.R.drawable.ic_fullscreen_exit)
        } else {
            binding.chatPanel.visibility = View.VISIBLE
            binding.recordButton.visibility = View.VISIBLE
            binding.fullscreenButton.setImageResource(com.bayesmech.camalytics.R.drawable.ic_fullscreen)
        }
    }

    private fun updateRecordButtonState(isRecording: Boolean) {
        if (isRecording) {
            binding.recordButton.setBackgroundResource(com.bayesmech.camalytics.R.drawable.record_button_recording)
            binding.liveBadge.text = "● REC"
            startPulse()
        } else {
            stopPulse()
            binding.recordButton.setBackgroundResource(com.bayesmech.camalytics.R.drawable.record_button_idle)
            binding.liveBadge.text = "● LIVE"
        }
    }

    // Opacity pulse matching Tailwind animate-pulse: alpha 1.0 ↔ 0.5, 2s cycle
    private fun startPulse() {
        stopPulse()
        pulseAnimator = ObjectAnimator.ofFloat(binding.recordButton, View.ALPHA, 1f, 0.5f).apply {
            duration = 1000L
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    private fun stopPulse() {
        pulseAnimator?.cancel()
        pulseAnimator = null
        binding.recordButton.alpha = 1f
    }

    private fun startTimer() {
        timerJob?.cancel()
        timerJob = viewLifecycleOwner.lifecycleScope.launch {
            binding.recordingTimer.visibility = View.VISIBLE
            while (true) {
                val elapsed = System.currentTimeMillis() - recordingStartMs
                val totalSeconds = (elapsed / 1000).toInt()
                val minutes = totalSeconds / 60
                val seconds = totalSeconds % 60
                binding.recordingTimer.text = "%d:%02d".format(minutes, seconds)
                delay(1000)
            }
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        timerJob = null
    }

    override fun onDestroyView() {
        super.onDestroyView()
        stopTimer()
        stopPulse()
        isFullscreen = false
        _binding = null
    }
}
