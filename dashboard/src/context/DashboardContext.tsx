import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type { ConnectionStatus, FrameUpdateMessage, DashboardMessage } from '../types'
import { dashboardWs } from '../services/websocket'

interface DashboardState {
  connectionStatus: ConnectionStatus
  latestFrame: FrameUpdateMessage | null
  frameCount: number
  fps: number
}

const DashboardContext = createContext<DashboardState | undefined>(undefined)

const FPS_WINDOW_SIZE = 10

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('Disconnected')
  const [latestFrame, setLatestFrame] = useState<FrameUpdateMessage | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const [fps, setFps] = useState(0)

  const frameTimestamps = useRef<number[]>([])

  const handleMessage = useCallback((msg: DashboardMessage) => {
    if (msg.type === 'frame_update') {
      setLatestFrame(msg)
      setFrameCount((c) => c + 1)

      const now = performance.now()
      frameTimestamps.current.push(now)
      if (frameTimestamps.current.length > FPS_WINDOW_SIZE) {
        frameTimestamps.current.shift()
      }

      const ts = frameTimestamps.current
      if (ts.length >= 2) {
        const elapsed = (ts[ts.length - 1] - ts[0]) / 1000
        setFps(Math.round(((ts.length - 1) / elapsed) * 10) / 10)
      }
    }
  }, [])

  useEffect(() => {
    dashboardWs.connect()
    const unsubMessage = dashboardWs.addMessageListener(handleMessage)
    const unsubStatus = dashboardWs.addStatusListener(setConnectionStatus)

    return () => {
      unsubMessage()
      unsubStatus()
      dashboardWs.disconnect()
    }
  }, [handleMessage])

  return (
    <DashboardContext.Provider value={{ connectionStatus, latestFrame, frameCount, fps }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within a DashboardProvider')
  return ctx
}
