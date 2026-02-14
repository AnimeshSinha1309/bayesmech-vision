import React, { useRef, useEffect } from 'react'
import Chart from 'chart.js/auto'
import type { ChartPoint } from '../types'

const COLORS = ['#ff4466', '#00ff88', '#00d4ff', '#ffaa00']

interface SensorChartProps {
  title: string
  yAxisLabel: string
  datasets: ChartPoint[][]
  axisLabels: string[]
  xMin: number
  xMax: number
  yMin?: number
  yMax?: number
}

const SensorChart: React.FC<SensorChartProps> = ({
  title,
  yAxisLabel,
  datasets,
  axisLabels,
  xMin,
  xMax,
  yMin,
  yMax,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  // Create the chart instance ONCE
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: axisLabels.map((label, i) => ({
          label,
          data: datasets[i] ? [...datasets[i]] : [],
          borderColor: COLORS[i % COLORS.length],
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        })),
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: {
            type: 'linear',
            min: xMin,
            max: xMax,
            display: false,
          },
          y: {
            title: {
              display: true,
              text: yAxisLabel,
              font: { size: 10 },
            },
            min: yMin,
            max: yMax,
            ticks: {
              font: { size: 9 },
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 10 },
            },
          },
        },
      },
    })

    chartRef.current = chart

    return () => {
      chart.destroy()
      chartRef.current = null
    }
    // Only run on mount/unmount -- we update data imperatively below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update data imperatively when datasets, xMin, or xMax change
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    // Update each dataset's data
    for (let i = 0; i < datasets.length; i++) {
      if (chart.data.datasets[i]) {
        chart.data.datasets[i].data = datasets[i] ? [...datasets[i]] : []
      }
    }

    // Update x-axis scale bounds
    const xScale = chart.options.scales?.x
    if (xScale) {
      xScale.min = xMin
      xScale.max = xMax
    }

    // Update y-axis bounds if provided
    const yScale = chart.options.scales?.y
    if (yScale) {
      if (yMin !== undefined) yScale.min = yMin
      if (yMax !== undefined) yScale.max = yMax
    }

    chart.update('none')
  }, [datasets, xMin, xMax, yMin, yMax])

  return (
    <div className="stream-card">
      <div className="stream-header">
        <span className="stream-title">{title}</span>
      </div>
      <div style={{ padding: '0.5rem' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

export default SensorChart
