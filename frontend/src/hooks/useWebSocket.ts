import { useEffect, useRef, useCallback } from 'react'
import { useJobStore } from '@/stores/jobStore'
import { useAuthStore } from '@/stores/authStore'
import type { WebSocketMessage } from '@/types'

const RECONNECT_INTERVAL = 3000
const MAX_RECONNECT_ATTEMPTS = 10

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const updateJob = useJobStore((state) => state.updateJob)
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)

        // Backend sends: {job_id, status, progress, error, video_url, ...}
        // We normalize to our store format
        const jobId = data.job_id

        if (!jobId) return

        const updateData: Partial<Job> = {}

        if (data.status) {
          updateData.status = data.status
        }

        if (data.progress !== undefined) {
          updateData.progress = data.progress
        }

        if (data.error) {
          updateData.error_message = data.error
          updateData.status = 'failed'
        }

        if (data.video_url) {
          updateData.output_video_url = data.video_url
          updateData.status = 'completed'
          updateData.progress = 100
        }

        updateJob(jobId, updateData)
      } catch {
        // ignore malformed messages
      }
    },
    [updateJob]
  )

  const connect = useCallback(() => {
    if (!user?.id || !isAuthenticated) return

    const wsUrl =
      import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

    const ws = new WebSocket(`${wsUrl}/ws/jobs/${user.id}`)

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0
    }

    ws.onmessage = handleMessage

    ws.onclose = () => {
      wsRef.current = null
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          connect()
        }, RECONNECT_INTERVAL)
      }
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [user?.id, isAuthenticated, handleMessage])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return wsRef
}
