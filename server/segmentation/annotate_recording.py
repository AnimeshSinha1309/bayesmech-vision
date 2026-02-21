#!/usr/bin/env python3
"""
Annotate a .pb recording via the running segmentation server.

Connects to the segmentation server over HTTP + WebSocket, sends each frame
as a SegmentationRequest, collects SegmentationResponse results, and writes
them to a .seg.pb file next to the input.

The segmentation server must already be running (default: http://127.0.0.1:8081).

Usage:
    uv run python segmentation/annotate_recording.py server/recordings/<name>.pb
    uv run python segmentation/annotate_recording.py server/recordings/<name>.pb --host http://host:port
"""

import asyncio
import sys
from pathlib import Path

_server_root = Path(__file__).resolve().parent.parent
_project_root = _server_root.parent
sys.path.insert(0, str(_project_root))
sys.path.insert(0, str(_server_root))

import aiohttp
from tqdm import tqdm

from proto import segmentation_pb2, perceiver_pb2
from streamlog.protoio import ProtoIO

_frame_io = ProtoIO(perceiver_pb2.PerceiverDataFrame)
_seg_io = ProtoIO(segmentation_pb2.SegmentationResponse)

DEFAULT_HOST = "http://127.0.0.1:8081"
RESULT_TIMEOUT = 300  # seconds


def seg_path(recording_path: Path) -> Path:
    return recording_path.with_suffix(".seg.pb")


async def main():
    # ── Parse args ────────────────────────────────────────────────────────
    args = sys.argv[1:]
    host = DEFAULT_HOST
    rec_file = None

    for arg in args:
        if arg.startswith("--host"):
            continue
        if args and args[args.index(arg) - 1] == "--host":
            continue
        rec_file = arg

    if "--host" in args:
        host = args[args.index("--host") + 1]

    if not rec_file:
        print(f"Usage: {sys.argv[0]} <recording.pb> [--host http://host:port]")
        sys.exit(1)

    rec_path = Path(rec_file).resolve()
    if not rec_path.exists():
        print(f"File not found: {rec_path}")
        sys.exit(1)

    out_path = seg_path(rec_path)
    ws_url = host.replace("http://", "ws://").replace("https://", "wss://")

    # ── Load frames ───────────────────────────────────────────────────────
    print(f"Loading {rec_path.name}...")
    frames = _frame_io.read_file(rec_path)
    if not frames:
        print("No frames in recording")
        sys.exit(1)
    print(f"Loaded {len(frames)} frames")

    # ── Connect to segmentation server ────────────────────────────────────
    session = aiohttp.ClientSession()
    try:
        async with session.get(f"{host}/segment/status", timeout=aiohttp.ClientTimeout(total=3)) as resp:
            if resp.status != 200:
                print(f"Segmentation server returned {resp.status}")
                sys.exit(1)
            status = await resp.json()
            print(f"Server: {status.get('model_type', '?')} on {status.get('device', '?')}")
    except aiohttp.ClientConnectorError:
        print(f"Cannot connect to segmentation server at {host}")
        await session.close()
        sys.exit(1)

    # Start a session
    async with session.post(f"{host}/segment/session/start") as resp:
        data = await resp.json()
        session_id = data["session_id"]
    print(f"Session: {session_id}")

    # Open WebSocket
    ws = await session.ws_connect(
        f"{ws_url}/segment/stream?session_id={session_id}",
        heartbeat=30,
    )

    # ── Send frames & collect results ─────────────────────────────────────
    results: list[segmentation_pb2.SegmentationResponse] = []
    all_done = asyncio.Event()
    send_bar = tqdm(total=len(frames), desc="Sending frames", unit="frame")
    recv_bar = tqdm(total=0, desc="Receiving masks", unit="result")

    async def listen():
        """Read SegmentationResponse messages from the WebSocket."""
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.BINARY:
                    resp = segmentation_pb2.SegmentationResponse()
                    resp.ParseFromString(msg.data)
                    results.append(resp)
                    recv_bar.update(1)
                elif msg.type in (aiohttp.WSMsgType.ERROR, aiohttp.WSMsgType.CLOSE):
                    break
        except asyncio.CancelledError:
            pass
        finally:
            all_done.set()

    listen_task = asyncio.create_task(listen())

    # Send all frames as SegmentationRequest protos
    for frame in frames:
        if ws.closed:
            break
        req = segmentation_pb2.SegmentationRequest()
        req.frame_identifier.CopyFrom(frame.frame_identifier)
        req.image_frame.CopyFrom(frame.rgb_frame)
        try:
            await ws.send_bytes(req.SerializeToString())
        except (ConnectionResetError, aiohttp.ClientConnectionResetError):
            print("\nConnection lost while sending frames")
            break
        send_bar.update(1)

    send_bar.close()
    print("All frames sent, waiting for segmentation results...")

    # Wait for at least one result (segmentation server batches frames)
    try:
        await asyncio.wait_for(all_done.wait(), timeout=RESULT_TIMEOUT)
    except asyncio.TimeoutError:
        print(f"Timed out after {RESULT_TIMEOUT}s waiting for results")

    # Allow a moment for any trailing messages
    await asyncio.sleep(1)
    listen_task.cancel()
    try:
        await listen_task
    except asyncio.CancelledError:
        pass

    recv_bar.close()

    # ── Save results ──────────────────────────────────────────────────────
    if results:
        if out_path.exists():
            out_path.unlink()
        _seg_io.write_file(out_path, results)
        total_masks = sum(len(r.masks) for r in results)
        print(f"Wrote {len(results)} results ({total_masks} masks) to {out_path.name}")
    else:
        print("No segmentation results received")

    # ── Cleanup ───────────────────────────────────────────────────────────
    await ws.close()
    try:
        await session.delete(f"{host}/segment/session/{session_id}")
    except Exception:
        pass
    await session.close()


if __name__ == "__main__":
    asyncio.run(main())
