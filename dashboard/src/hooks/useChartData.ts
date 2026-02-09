import { useRef, useCallback, useState } from 'react'
import type { ChartPoint } from '../types'

interface ChartDataConfig {
  maxDataPoints?: number
  windowDuration?: number // seconds
}

interface ChartDataResult {
  datasets: ChartPoint[][]
  xMin: number
  xMax: number
  addPoint: (values: number[]) => void
}

/**
 * Custom hook for managing rolling time-series chart data.
 *
 * @param axisCount     Number of data series (e.g. 3 for XYZ, 4 for XYZW)
 * @param config        Optional tuning parameters
 * @returns             The current datasets, visible x-range, and an addPoint function
 */
export function useChartData(
  axisCount: number,
  config?: ChartDataConfig
): ChartDataResult {
  const maxDataPoints = config?.maxDataPoints ?? 2000
  const windowDuration = config?.windowDuration ?? 300 // seconds

  // Store the actual data in refs so pushing new points does not trigger renders
  const datasetsRef = useRef<ChartPoint[][]>(
    Array.from({ length: axisCount }, () => [] as ChartPoint[])
  )

  // Render counter -- bumped at most every 100ms to trigger a re-render
  const [, setRenderTick] = useState(0)
  const lastRenderTime = useRef(0)
  const pendingRender = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRender = useCallback(() => {
    const now = Date.now()
    const elapsed = now - lastRenderTime.current

    if (elapsed >= 100) {
      // Enough time has passed -- render immediately
      lastRenderTime.current = now
      setRenderTick((t) => t + 1)
    } else if (!pendingRender.current) {
      // Schedule a deferred render
      pendingRender.current = setTimeout(() => {
        pendingRender.current = null
        lastRenderTime.current = Date.now()
        setRenderTick((t) => t + 1)
      }, 100 - elapsed)
    }
  }, [])

  const addPoint = useCallback(
    (values: number[]) => {
      const now = Date.now() / 1000 // seconds
      const cutoff = now - windowDuration

      for (let i = 0; i < axisCount; i++) {
        const series = datasetsRef.current[i]

        // Push new point
        series.push({ x: now, y: values[i] ?? 0 })

        // Trim old points beyond the window
        while (series.length > 0 && series[0].x < cutoff) {
          series.shift()
        }

        // Hard cap
        while (series.length > maxDataPoints) {
          series.shift()
        }
      }

      scheduleRender()
    },
    [axisCount, maxDataPoints, windowDuration, scheduleRender]
  )

  const now = Date.now() / 1000
  const xMin = now - windowDuration
  const xMax = now + 10

  return {
    datasets: datasetsRef.current,
    xMin,
    xMax,
    addPoint,
  }
}
