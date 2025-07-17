import React, { useEffect, useState } from 'react'
import { Box, Typography, Collapse, IconButton, Card, CardContent } from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import { usePerformanceMonitor } from '../hooks/usePerformance'

interface PerformanceMonitorProps {
  componentName: string
  children: React.ReactNode
}

interface PerformanceMetrics {
  memoryUsage: number
  renderTime: number
  componentCount: number
  lastUpdate: Date
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  componentName, 
  children 
}) => {
  const { renderCount } = usePerformanceMonitor(componentName)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    componentCount: 0,
    lastUpdate: new Date()
  })
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const updateMetrics = () => {
      const memory = (performance as any).memory
      setMetrics({
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
        renderTime: performance.now(),
        componentCount: renderCount,
        lastUpdate: new Date()
      })
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 1000)
    return () => clearInterval(interval)
  }, [renderCount])

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  return (
    <Box>
      {children}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
        <Card sx={{ maxWidth: 300 }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="primary">
                Performance Monitor
              </Typography>
              <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            <Collapse in={expanded}>
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" display="block">
                  Component: {componentName}
                </Typography>
                <Typography variant="caption" display="block">
                  Renders: {metrics.componentCount}
                </Typography>
                <Typography variant="caption" display="block">
                  Memory: {metrics.memoryUsage.toFixed(2)} MB
                </Typography>
                <Typography variant="caption" display="block">
                  Last Update: {metrics.lastUpdate.toLocaleTimeString()}
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

// HOC for wrapping components with performance monitoring
export const withPerformanceMonitor = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => (
    <PerformanceMonitor componentName={componentName}>
      <Component {...props} />
    </PerformanceMonitor>
  ))
}

export default PerformanceMonitor