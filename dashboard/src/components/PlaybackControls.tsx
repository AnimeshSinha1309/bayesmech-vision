import React from 'react'
import { useDashboard } from '../context/DashboardContext'

const PlaybackControls: React.FC = () => {
  const { currentIndex, totalFrames, isPlaying, play, pause, seekTo, skipForward, skipBackward } = useDashboard()

  if (totalFrames === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--card-bg, #1e1e2e)',
        borderRadius: '8px',
        marginBottom: '1.5rem',
      }}
    >
      <button onClick={skipBackward} style={btnStyle} title="Skip back 10s">
        ⏪
      </button>

      <button onClick={isPlaying ? pause : play} style={btnStyle} title={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button onClick={skipForward} style={btnStyle} title="Skip forward 10s">
        ⏩
      </button>

      <span style={{ fontSize: '0.85rem', opacity: 0.7, whiteSpace: 'nowrap', minWidth: '7rem', textAlign: 'center' }}>
        {currentIndex + 1} / {totalFrames}
      </span>

      <input
        type="range"
        min={0}
        max={totalFrames - 1}
        value={currentIndex}
        onChange={(e) => seekTo(Number(e.target.value))}
        style={{ flex: 1, cursor: 'pointer' }}
      />
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  fontSize: '1.25rem',
  cursor: 'pointer',
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  lineHeight: 1,
}

export default PlaybackControls
