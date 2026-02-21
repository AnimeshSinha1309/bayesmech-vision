/**
 * Protobuf decode helpers for the binary dashboard WebSocket protocol.
 *
 * Wire format from server:
 *   Binary: 1-byte prefix + length-delimited protobuf(s)
 *     0x01 = PerceiverDataFrame(s)
 *     0x02 = SegmentationResponse(s)
 *   Text (JSON): stats / control responses
 *
 * Length-delimited: [uint32 BE = N] [N bytes of proto] repeated
 */

import { bayesmech } from '../proto/bundle'

const { PerceiverDataFrame, SegmentationResponse } = bayesmech.vision

export const PREFIX_FRAME = 0x01
export const PREFIX_ANNOTATION = 0x02

/**
 * Decode all length-delimited messages from a buffer (after the prefix byte).
 */
function readDelimited<T>(
  buf: Uint8Array,
  decode: (reader: Uint8Array) => T,
): T[] {
  const results: T[] = []
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let offset = 0

  while (offset + 4 <= buf.length) {
    const len = view.getUint32(offset)
    offset += 4
    if (offset + len > buf.length) break
    const slice = buf.subarray(offset, offset + len)
    results.push(decode(slice))
    offset += len
  }
  return results
}

export function decodeFrames(payload: Uint8Array): bayesmech.vision.PerceiverDataFrame[] {
  return readDelimited(payload, (b) => PerceiverDataFrame.decode(b))
}

export function decodeAnnotations(payload: Uint8Array): bayesmech.vision.SegmentationResponse[] {
  return readDelimited(payload, (b) => SegmentationResponse.decode(b))
}

/**
 * Create an object URL from raw JPEG/PNG bytes. Caller must revoke when done.
 */
export function bytesToBlobUrl(data: Uint8Array, mime: string = 'image/jpeg'): string {
  const copy = new Uint8Array(data)
  const blob = new Blob([copy], { type: mime })
  return URL.createObjectURL(blob)
}

/**
 * Convert a protobuf `bytes` mask field (base64-encoded RGBA PNG) to a blob URL.
 * The proto `bytes` field arrives as a Uint8Array containing the base64 ASCII chars.
 * We decode to raw PNG bytes and create an object URL. Caller must revoke when done.
 */
export function maskToBlobUrl(maskData: Uint8Array): string {
  // maskData is base64-encoded PNG; decode the base64 string to raw bytes
  const b64 = new TextDecoder().decode(maskData)
  const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return bytesToBlobUrl(raw, 'image/png')
}
