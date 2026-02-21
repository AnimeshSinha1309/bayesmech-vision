import { useRef, useEffect } from 'react'
import Chart from 'chart.js/auto'
import { useDashboard } from '../context/DashboardContext'
import { useChartData } from '../hooks/useChartData'
import type { ImuData } from '../types'

const COLORS = ['#ff4466', '#00ff88', '#00d4ff', '#ffaa00']

interface MotionChartProps {
  title: string
  yAxisLabel: string
  field: keyof ImuData
  axisLabels: string[]
  yMin?: number
  yMax?: number
}

const MotionChart = ({ title, yAxisLabel, field, axisLabels, yMin, yMax }: MotionChartProps) => {
  const { latestFrame } = useDashboard()
  const { datasets, xMin, xMax, addPoint } = useChartData(axisLabels.length)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  // Extract IMU data and push to chart buffer
  useEffect(() => {
    const data = latestFrame?.imu?.[field]
    if (!data) return

    const record = data as unknown as Record<string, number>
    const values = axisLabels.map((label) => record[label.toLowerCase()] ?? 0)
    addPoint(values)
  }, [latestFrame, field, axisLabels, addPoint])

  // Create the Chart.js instance once
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
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: { type: 'linear', min: xMin, max: xMax, display: false },
          y: {
            title: { display: true, text: yAxisLabel, font: { size: 10 } },
            min: yMin,
            max: yMax,
            ticks: { font: { size: 9 } },
          },
        },
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } },
        },
      },
    })

    chartRef.current = chart
    return () => {
      chart.destroy()
      chartRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Imperatively update chart data
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    for (let i = 0; i < datasets.length; i++) {
      if (chart.data.datasets[i]) {
        chart.data.datasets[i].data = datasets[i] ? [...datasets[i]] : []
      }
    }

    const xScale = chart.options.scales?.x
    if (xScale) {
      xScale.min = xMin
      xScale.max = xMax
    }

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

export default MotionChart
