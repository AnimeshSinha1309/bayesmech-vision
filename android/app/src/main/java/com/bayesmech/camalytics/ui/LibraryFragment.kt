package com.bayesmech.camalytics.ui

import android.graphics.Color
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import com.bayesmech.camalytics.R
import com.bayesmech.camalytics.databinding.FragmentLibraryBinding
import com.google.android.material.chip.Chip

enum class ExperienceType { ACTIVITY, SESSION, GOAL }

data class Experience(val id: String, val name: String, val type: ExperienceType)

class LibraryFragment : Fragment() {

    private var _binding: FragmentLibraryBinding? = null
    private val binding get() = _binding!!

    private val selectedIds = mutableSetOf<String>()

    private val allExperiences = listOf(
        Experience("1", "sport-karting", ExperienceType.ACTIVITY),
        Experience("2", "exp-pendulum", ExperienceType.ACTIVITY),
        Experience("3", "sport-snooker", ExperienceType.ACTIVITY),
        Experience("4", "sport-karting 2026-02-13-evening", ExperienceType.SESSION),
        Experience("5", "sport-karting 2026-02-12-morning", ExperienceType.SESSION),
        Experience("6", "sport-snooker 2026-02-11-afternoon", ExperienceType.SESSION),
        Experience("7", "exp-pendulum 2026-02-10-evening", ExperienceType.SESSION),
        Experience("8", "sport-snooker back-spin", ExperienceType.GOAL),
        Experience("9", "sport-snooker top-spin", ExperienceType.GOAL),
        Experience("10", "sport-karting drift-technique", ExperienceType.GOAL),
        Experience("11", "exp-pendulum oscillation-frequency", ExperienceType.GOAL)
    )

    private val exampleExperiences = listOf(
        allExperiences[0], allExperiences[1],
        allExperiences[3], allExperiences[6],
        allExperiences[7], allExperiences[9]
    )

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentLibraryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        renderExperiences(exampleExperiences)

        binding.searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                val query = s?.toString()?.trim() ?: ""
                val results = if (query.isEmpty()) {
                    exampleExperiences
                } else {
                    allExperiences.filter { it.name.contains(query, ignoreCase = true) }
                }
                val selected = results.filter { selectedIds.contains(it.id) }
                val unselected = results.filter { !selectedIds.contains(it.id) }
                renderExperiences((selected + unselected).take(8))
            }
        })

        binding.startAnalysisButton.isEnabled = false
        binding.startAnalysisButton.alpha = 0.4f
    }

    private fun renderExperiences(list: List<Experience>) {
        binding.experienceChipGroup.removeAllViews()
        list.forEach { exp ->
            val chip = Chip(requireContext()).apply {
                text = exp.name
                isCheckable = true
                isChecked = selectedIds.contains(exp.id)
                tag = exp.id

                val (bgSelected, bgUnselected, textColor) = when (exp.type) {
                    ExperienceType.ACTIVITY -> Triple(
                        Color.parseColor("#EF4444"),
                        Color.parseColor("#4D7F1A1A"),
                        Color.WHITE
                    )
                    ExperienceType.SESSION -> Triple(
                        Color.parseColor("#3B82F6"),
                        Color.parseColor("#4D1E3A5F"),
                        Color.WHITE
                    )
                    ExperienceType.GOAL -> Triple(
                        Color.parseColor("#22C55E"),
                        Color.parseColor("#4D14532A"),
                        Color.WHITE
                    )
                }

                chipBackgroundColor = android.content.res.ColorStateList(
                    arrayOf(
                        intArrayOf(android.R.attr.state_checked),
                        intArrayOf(-android.R.attr.state_checked)
                    ),
                    intArrayOf(bgSelected, bgUnselected)
                )
                setTextColor(textColor)
                chipStrokeWidth = 2f

                setOnCheckedChangeListener { _, checked ->
                    if (checked) selectedIds.add(exp.id) else selectedIds.remove(exp.id)
                    updateStartButton()
                }
            }
            binding.experienceChipGroup.addView(chip)
        }
    }

    private fun updateStartButton() {
        val hasSelected = selectedIds.isNotEmpty()
        binding.startAnalysisButton.isEnabled = hasSelected
        binding.startAnalysisButton.alpha = if (hasSelected) 1f else 0.4f
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
