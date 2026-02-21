import type { ConnectionStatus } from '../types'
import { bayesmech } from '../proto/bundle'
import { PREFIX_FRAME, PREFIX_ANNOTATION, decodeFrames, decodeAnnotations } from './proto'

export type FrameListener = (frames: bayesmech.vision.PerceiverDataFrame[]) => void
export type AnnotationListener = (annotations: bayesmech.vision.SegmentationResponse[]) => void
export type StatsListener = (stats: Record<string, unknown>) => void
type StatusListener = (status: ConnectionStatus) => void

class DashboardWebSocketService {
  private ws: WebSocket | null = null
  private frameListeners: Set<FrameListener> = new Set()
  private annotationListeners: Set<AnnotationListener> = new Set()
  private statsListeners: Set<StatsListener> = new Set()
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

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.intentionalClose = false
    this.setStatus('Connecting')

    const ws = new WebSocket(this.url)
    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      this.setStatus('Connected')
    }

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        this.handleBinary(new Uint8Array(event.data))
      } else if (typeof event.data === 'string') {
        this.handleText(event.data)
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
      // onclose will fire after onerror
    }

    this.ws = ws
  }

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

  // ---- Send control messages ----

  getStats(): void {
    this.send({ action: 'get_stats' })
  }

  seek(start: number, end: number): void {
    this.send({ action: 'seek', start, end })
  }

  getAnnotations(): void {
    this.send({ action: 'get_annotations' })
  }

  getAnnotationForFrame(frameNumber: number): void {
    this.send({ action: 'get_annotations', frame_number: frameNumber })
  }

  // ---- Listeners ----

  addFrameListener(cb: FrameListener): () => void {
    this.frameListeners.add(cb)
    return () => { this.frameListeners.delete(cb) }
  }

  addAnnotationListener(cb: AnnotationListener): () => void {
    this.annotationListeners.add(cb)
    return () => { this.annotationListeners.delete(cb) }
  }

  addStatsListener(cb: StatsListener): () => void {
    this.statsListeners.add(cb)
    return () => { this.statsListeners.delete(cb) }
  }

  addStatusListener(cb: StatusListener): () => void {
    this.statusListeners.add(cb)
    cb(this._status)
    return () => { this.statusListeners.delete(cb) }
  }

  // ---- Internal ----

  private handleBinary(buf: Uint8Array): void {
    if (buf.length < 2) return
    const prefix = buf[0]
    const payload = buf.subarray(1)

    if (prefix === PREFIX_FRAME) {
      const frames = decodeFrames(payload)
      if (frames.length > 0) {
        this.frameListeners.forEach((cb) => cb(frames))
      }
    } else if (prefix === PREFIX_ANNOTATION) {
      const annotations = decodeAnnotations(payload)
      if (annotations.length > 0) {
        this.annotationListeners.forEach((cb) => cb(annotations))
      }
    }
  }

  private handleText(data: string): void {
    try {
      const msg = JSON.parse(data)
      if (msg.type === 'stats') {
        this.statsListeners.forEach((cb) => cb(msg))
      }
    } catch {
      // Ignore non-JSON
    }
  }

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
