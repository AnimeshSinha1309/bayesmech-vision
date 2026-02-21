"""
Length-delimited protobuf I/O.

Wire format: [uint32 big-endian = N] [N bytes of serialized proto] repeated.
"""

import logging
import struct
from pathlib import Path
from typing import TypeVar

from google.protobuf.message import Message

logger = logging.getLogger(__name__)

M = TypeVar("M", bound=Message)


class ProtoIO:
    """Encode, decode, read, and write length-delimited protobuf messages."""

    FRAME_SIZE_LIMIT = 10 * 1024 * 1024  # 10 MB sanity cap

    def __init__(self, msg_type: type[M]) -> None:
        self._msg_type = msg_type

    def encode(self, messages: list[Message]) -> bytes:
        """Encode messages with length prefixes."""
        parts: list[bytes] = []
        for msg in messages:
            raw = msg.SerializeToString()
            parts.append(struct.pack(">I", len(raw)))
            parts.append(raw)
        return b"".join(parts)

    def decode(self, data: bytes) -> list[M]:
        """Decode length-delimited bytes from an in-memory buffer."""
        messages: list[M] = []
        offset = 0
        errors = 0
        while offset + 4 <= len(data):
            (length,) = struct.unpack(">I", data[offset : offset + 4])
            offset += 4
            if length == 0 or length > self.FRAME_SIZE_LIMIT:
                break
            if offset + length > len(data):
                break
            msg = self._msg_type()
            try:
                msg.ParseFromString(data[offset : offset + length])
                messages.append(msg)
            except Exception as exc:
                errors += 1
                logger.warning(
                    "Skipping corrupt frame at byte offset %d (length=%d): %s",
                    offset - 4, length, exc,
                )
            offset += length
        if errors:
            logger.warning(
                "Recovered %d frames, skipped %d corrupt frame(s)",
                len(messages), errors,
            )
        return messages

    def read_file(self, path: Path) -> list[M]:
        """Stream all messages from a length-delimited file with corruption recovery.

        When a length prefix reads as impossibly large (> FRAME_SIZE_LIMIT) the
        reader scans forward one byte at a time until it re-syncs with the frame
        stream, so partial/corrupt writes don't discard the rest of the file.
        """
        messages: list[M] = []
        errors = 0
        seek_to: int | None = None  # set when we need to rewind+scan

        with open(path, "rb") as f:
            while True:
                if seek_to is not None:
                    f.seek(seek_to)
                    seek_to = None

                header_pos = f.tell()
                header = f.read(4)
                if len(header) < 4:
                    break  # clean EOF

                (length,) = struct.unpack(">I", header)

                if length == 0 or length > self.FRAME_SIZE_LIMIT:
                    # Zero or impossibly-large length prefix — could be mid-file
                    # corruption or padding. Scan forward one byte and retry rather
                    # than stopping, so we don't lose frames later in the file.
                    errors += 1
                    if errors <= 10:
                        logger.warning(
                            "Suspicious length %d at offset %d, scanning forward",
                            length, header_pos,
                        )
                    seek_to = header_pos + 1
                    continue

                data = f.read(length)
                if len(data) < length:
                    break  # truncated file

                msg = self._msg_type()
                try:
                    msg.ParseFromString(data)
                    messages.append(msg)
                except Exception as exc:
                    errors += 1
                    if errors <= 10:
                        logger.warning(
                            "Corrupt frame at offset %d (length=%d): %s",
                            header_pos, length, exc,
                        )
                # Advance past this frame whether it parsed or not.

        if errors:
            logger.warning(
                "Recovered %d frames, encountered %d error(s)",
                len(messages), errors,
            )
        return messages

    def write_file(self, path: Path, messages: list[Message]) -> int:
        """Append messages to a length-delimited file. Returns count written."""
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "ab") as f:
            f.write(self.encode(messages))
        return len(messages)
