import React, { useEffect, useCallback, useRef } from 'react'

// Memory optimization hook
export const useMemoryOptimization = () => {
  const cleanupTasks = useRef<(() => void)[]>([])

  const addCleanupTask = useCallback((task: () => void) => {
    cleanupTasks.current.push(task)
  }, [])

  useEffect(() => {
    return () => {
      // Run all cleanup tasks when component unmounts
      cleanupTasks.current.forEach(task => {
        try {
          task()
        } catch (error) {
          console.warn('Cleanup task failed:', error)
        }
      })
      cleanupTasks.current = []
    }
  }, [])

  return { addCleanupTask }
}

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const startTime = useRef<number>()

  const startMeasure = useCallback((name: string) => {
    startTime.current = performance.now()
    performance.mark(`${name}-start`)
  }, [])

  const endMeasure = useCallback((name: string) => {
    if (startTime.current) {
      const endTime = performance.now()
      const duration = endTime - startTime.current
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
    return 0
  }, [])

  return { startMeasure, endMeasure }
}

// Debounce hook for performance optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}