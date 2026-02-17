import type { StreamStats, RecordingInfo } from '../types'

export async function fetchStreamStats(): Promise<StreamStats> {
  const res = await fetch('/api/stream')
  if (!res.ok) throw new Error(`Failed to fetch stream stats: ${res.status}`)
  return res.json() as Promise<StreamStats>
}

export async function fetchRecordings(): Promise<{ recordings: RecordingInfo[] }> {
  const res = await fetch('/api/recordings')
  if (!res.ok) throw new Error(`Failed to fetch recordings: ${res.status}`)
  return res.json() as Promise<{ recordings: RecordingInfo[] }>
}

export async function startPlayback(filename: string, speed = 1.0, loop = false): Promise<void> {
  const res = await fetch('/api/playback/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, speed, loop }),
  })
  if (!res.ok) throw new Error(`Failed to start playback: ${res.status}`)
}

export async function stopPlayback(): Promise<void> {
  const res = await fetch('/api/playback/stop', { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to stop playback: ${res.status}`)
}

export async function uploadRecording(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload_recording', { method: 'POST', body: formData })
  if (!res.ok) throw new Error(`Failed to upload recording: ${res.status}`)
}
