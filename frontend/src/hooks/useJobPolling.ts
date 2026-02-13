import { useEffect, useRef } from 'react'
import { useJobStore } from '@/stores/jobStore'
import api from '@/lib/api'
import type { Job } from '@/types'

const POLL_INTERVAL = 5000

export function useJobPolling() {
  const jobs = useJobStore((state) => state.jobs)
  const updateJob = useJobStore((state) => state.updateJob)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    const activeJobs = jobs.filter(
      (job) =>
        job.status === 'queued' ||
        job.status === 'submitted' ||
        job.status === 'processing'
    )

    if (activeJobs.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
      return
    }

    const pollJobs = async () => {
      for (const job of activeJobs) {
        try {
          const response = await api.get<Job>(`/jobs/${job.id}`)
          const updated = response.data
          if (
            updated.status !== job.status ||
            updated.progress !== job.progress
          ) {
            updateJob(job.id, {
              status: updated.status,
              progress: updated.progress,
              output_video_url: updated.output_video_url,
              thumbnail_url: updated.thumbnail_url,
              error_message: updated.error_message,
            })
          }
        } catch {
          // silently fail on polling errors
        }
      }
    }

    intervalRef.current = setInterval(pollJobs, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [jobs, updateJob])
}
