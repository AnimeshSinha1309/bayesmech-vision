import { useEffect } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { useChartData } from '../hooks/useChartData'
import SensorChart from './SensorChart'
import type { ImuData } from '../types'

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

  useEffect(() => {
    const data = latestFrame?.imu?.[field]
    if (!data) return

    const record = data as unknown as Record<string, number>
    const values = axisLabels.map((label) => record[label.toLowerCase()] ?? 0)
    addPoint(values)
  }, [latestFrame, field, axisLabels, addPoint])

  return (
    <SensorChart
      title={title}
      yAxisLabel={yAxisLabel}
      datasets={datasets}
      axisLabels={axisLabels}
      xMin={xMin}
      xMax={xMax}
      yMin={yMin}
      yMax={yMax}
    />
  )
}

export default MotionChart
