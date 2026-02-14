import React, { useRef } from 'react'
import { uploadRecording } from '../services/api'

const UploadButton: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate .pb extension
    if (!file.name.endsWith('.pb')) {
      alert('Invalid file type. Please select a .pb recording file.')
      // Reset the input
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      await uploadRecording(file)
      alert(`Recording "${file.name}" uploaded successfully.`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Upload failed: ${message}`)
    }

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pb"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        className="theme-toggle"
        onClick={handleClick}
        title="Upload recording (.pb)"
      >
        {'\u{1F4C1}'}
      </button>
    </>
  )
}

export default UploadButton
