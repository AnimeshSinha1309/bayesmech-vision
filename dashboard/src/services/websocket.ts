import type { DashboardMessage, ConnectionStatus } from '../types'

type MessageListener = (message: DashboardMessage) => void
type StatusListener = (status: ConnectionStatus) => void

class DashboardWebSocketService {
  private ws: WebSocket | null = null
  private messageListeners: Set<MessageListener> = new Set()
  private statusListeners: Set<StatusListener> = new Set()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private intentionalClose = false
  private _status: ConnectionStatus = 'Disconnected'

  private get url(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws/dashboard`
  }

  private setStatus(status: ConnectionStatus): void {
    this._status = status
    this.statusListeners.forEach((cb) => cb(status))
  }

  /**
   * Opens the WebSocket connection.  If already connected, this is a no-op.
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.intentionalClose = false
    this.setStatus('Connecting')

    const ws = new WebSocket(this.url)

    ws.onopen = () => {
      this.setStatus('Connected')
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: DashboardMessage = JSON.parse(event.data)
        this.messageListeners.forEach((cb) => cb(message))
      } catch {
        // Ignore non-JSON messages
      }
    }

    ws.onclose = () => {
      this.setStatus('Disconnected')
      this.ws = null

      if (!this.intentionalClose) {
        this.scheduleReconnect()
      }
    }

    ws.onerror = () => {
      // onclose will fire after onerror, so reconnect is handled there
    }

    this.ws = ws
  }

  /**
   * Closes the WebSocket connection intentionally (no auto-reconnect).
   */
  disconnect(): void {
    this.intentionalClose = true

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.setStatus('Disconnected')
  }

  /**
   * Request the latest stream stats from the server.
   */
  getStats(): void {
    this.send({ action: 'get_stats' })
  }

  /**
   * Request the latest frame to be resent.
   */
  getLatest(): void {
    this.send({ action: 'get_latest' })
  }

  /**
   * Registers a callback invoked for every incoming WebSocket message.
   * Returns an unsubscribe function.
   */
  addMessageListener(cb: MessageListener): () => void {
    this.messageListeners.add(cb)
    return () => {
      this.messageListeners.delete(cb)
    }
  }

  /**
   * Registers a callback invoked when the connection status changes.
   * Returns an unsubscribe function.
   */
  addStatusListener(cb: StatusListener): () => void {
    this.statusListeners.add(cb)
    // Immediately notify with current status
    cb(this._status)
    return () => {
      this.statusListeners.delete(cb)
    }
  }

  // ---- Private helpers ----

  private send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, 3000)
  }
}

export const dashboardWs = new DashboardWebSocketService()
