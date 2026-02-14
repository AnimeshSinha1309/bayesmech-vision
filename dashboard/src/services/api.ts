import type { ClientsResponse } from '../types'

/**
 * Fetch the list of currently connected clients.
 */
export async function fetchClients(): Promise<ClientsResponse> {
  const res = await fetch('/api/clients')
  if (!res.ok) {
    throw new Error(`Failed to fetch clients: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<ClientsResponse>
}

/**
 * Enable segmentation processing for a client.
 */
export async function enableSegmentation(clientId: string): Promise<void> {
  const res = await fetch('/api/segmentation/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId }),
  })
  if (!res.ok) {
    throw new Error(`Failed to enable segmentation: ${res.status} ${res.statusText}`)
  }
}

/**
 * Disable segmentation processing for a client.
 */
export async function disableSegmentation(clientId: string): Promise<void> {
  const res = await fetch('/api/segmentation/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId }),
  })
  if (!res.ok) {
    throw new Error(`Failed to disable segmentation: ${res.status} ${res.statusText}`)
  }
}

/**
 * Upload a recording file.
 */
export async function uploadRecording(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload_recording', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    throw new Error(`Failed to upload recording: ${res.status} ${res.statusText}`)
  }
}
