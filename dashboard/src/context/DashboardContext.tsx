import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type {
  ConnectionStatus,
  ClientInfo,
  FrameUpdateMessage,
  DashboardMessage,
  SegmentationUpdateMessage,
} from '../types'
import { dashboardWs } from '../services/websocket'
import { fetchClients, enableSegmentation, disableSegmentation } from '../services/api'

interface DashboardState {
  connectionStatus: ConnectionStatus
  clients: ClientInfo[]
  selectedClientId: string | null
  latestFrame: FrameUpdateMessage | null
  segmentationEnabled: boolean
  segmentationMaskCount: number
  frameCount: number
  fps: number
}

interface DashboardContextValue extends DashboardState {
  selectClient: (clientId: string) => void
  toggleSegmentation: () => void
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined)

const CLIENT_POLL_INTERVAL = 5000
const FPS_WINDOW_SIZE = 10

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected')
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [latestFrame, setLatestFrame] = useState<FrameUpdateMessage | null>(null)
  const [segmentationEnabled, setSegmentationEnabled] = useState(false)
  const [segmentationMaskCount, setSegmentationMaskCount] = useState(0)
  const [frameCount, setFrameCount] = useState(0)
  const [fps, setFps] = useState(0)

  // Mutable refs for FPS calculation
  const frameTimestamps = useRef<number[]>([])
  const clientPollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- Fetch clients helper ---
  const refreshClients = useCallback(async () => {
    try {
      const data = await fetchClients()
      setClients(data.clients)
    } catch {
      // Network error -- keep the existing list
    }
  }, [])

  // --- WebSocket message handler ---
  const handleMessage = useCallback((msg: DashboardMessage) => {
    switch (msg.type) {
      case 'frame_update': {
        const frameMsg = msg as FrameUpdateMessage
        setLatestFrame(frameMsg)
        setFrameCount((c) => c + 1)

        // Rolling FPS calculation
        const now = performance.now()
        frameTimestamps.current.push(now)
        if (frameTimestamps.current.length > FPS_WINDOW_SIZE) {
          frameTimestamps.current.shift()
        }

        const ts = frameTimestamps.current
        if (ts.length >= 2) {
          const elapsed = (ts[ts.length - 1] - ts[0]) / 1000 // seconds
          const calculatedFps = (ts.length - 1) / elapsed
          setFps(Math.round(calculatedFps * 10) / 10)
        }
        break
      }
      case 'segmentation_update': {
        const segMsg = msg as SegmentationUpdateMessage
        setSegmentationMaskCount(Object.keys(segMsg.masks).length)
        break
      }
      // clients_update intentionally not handled -- we poll via REST
      default:
        break
    }
  }, [])

  // --- Mount / unmount ---
  useEffect(() => {
    // Connect WebSocket
    dashboardWs.connect()

    const unsubMessage = dashboardWs.addMessageListener(handleMessage)
    const unsubStatus = dashboardWs.addStatusListener(setConnectionStatus)

    // Initial client fetch + polling
    refreshClients()
    clientPollTimer.current = setInterval(refreshClients, CLIENT_POLL_INTERVAL)

    return () => {
      unsubMessage()
      unsubStatus()
      dashboardWs.disconnect()

      if (clientPollTimer.current !== null) {
        clearInterval(clientPollTimer.current)
        clientPollTimer.current = null
      }
    }
  }, [handleMessage, refreshClients])

  // --- Select client ---
  const selectClient = useCallback((clientId: string) => {
    setSelectedClientId(clientId)
    dashboardWs.subscribe(clientId)

    // Reset frame tracking
    setFrameCount(0)
    setFps(0)
    frameTimestamps.current = []
  }, [])

  // --- Toggle segmentation ---
  const toggleSegmentation = useCallback(async () => {
    if (!selectedClientId) return

    const newEnabled = !segmentationEnabled
    setSegmentationEnabled(newEnabled)

    try {
      if (newEnabled) {
        await enableSegmentation(selectedClientId)
      } else {
        await disableSegmentation(selectedClientId)
      }
    } catch {
      // Revert on failure
      setSegmentationEnabled(!newEnabled)
    }
  }, [selectedClientId, segmentationEnabled])

  const value: DashboardContextValue = {
    connectionStatus,
    clients,
    selectedClientId,
    latestFrame,
    segmentationEnabled,
    segmentationMaskCount,
    frameCount,
    fps,
    selectClient,
    toggleSegmentation,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext)
  if (!ctx) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return ctx
}
