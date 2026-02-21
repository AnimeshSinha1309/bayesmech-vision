import React from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { CoverageStats } from '../types'

interface SignalRow {
  label: string
  value: (s: CoverageStats) => string
  pct: (s: CoverageStats) => number | null   // null = show text only, no bar
}

const ROWS: SignalRow[] = [
  { label: 'Depth Map',         value: s => `${s.depth}%`,            pct: s => s.depth },
  { label: 'Camera Pose',       value: s => `${s.pose}%`,             pct: s => s.pose },
  { label: 'Linear Accel',      value: s => `${s.linearAccel}%`,      pct: s => s.linearAccel },
  { label: 'Angular Velocity',  value: s => `${s.angularVelocity}%`,  pct: s => s.angularVelocity },
  { label: 'Gravity',           value: s => `${s.gravity}%`,          pct: s => s.gravity },
  { label: 'Magnetic Field',    value: s => `${s.magneticField}%`,    pct: s => s.magneticField },
  { label: 'Geometry',          value: s => `${s.geometry}%`,         pct: s => s.geometry },
  { label: 'Intrinsics',        value: s => `${s.intrinsicsCount} frames`, pct: _ => null },
]

function barColor(pct: number): string {
  if (pct >= 80) return 'var(--accent)'
  if (pct >= 40) return '#e6a817'
  return '#c0392b'
}

const CoverageRow: React.FC<{ row: SignalRow; stats: CoverageStats }> = ({ row, stats }) => {
  const pct = row.pct(stats)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0' }}>
      <div style={{ width: '140px', fontSize: '0.8rem', opacity: 0.7, flexShrink: 0 }}>
        {row.label}
      </div>
      {pct !== null ? (
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: '3px', height: '6px', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: barColor(pct),
            borderRadius: '3px',
            transition: 'width 0.4s ease, background 0.4s ease',
          }} />
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}
      <div style={{ width: '80px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: pct !== null ? barColor(pct) : 'var(--accent)' }}>
        {row.value(stats)}
      </div>
    </div>
  )
}

const CoveragePanel: React.FC = () => {
  const { coverageStats } = useDashboard()
  const window = coverageStats.windowSize

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Signal Coverage</h3>
        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
          {window > 0 ? `last ${window} frames` : 'no frames yet'}
        </span>
      </div>
      <div style={{
        background: 'var(--card-bg)',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        {ROWS.map(row => (
          <CoverageRow key={row.label} row={row} stats={coverageStats} />
        ))}
      </div>
    </div>
  )
}

export default CoveragePanel
