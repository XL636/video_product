import { create } from 'zustand'
import type { Job } from '@/types'

interface JobState {
  jobs: Job[]
  activeJob: Job | null
  addJob: (job: Job) => void
  updateJob: (jobId: string, updates: Partial<Job>) => void
  removeJob: (jobId: string) => void
  setActiveJob: (job: Job | null) => void
  setJobs: (jobs: Job[]) => void
}

export const useJobStore = create<JobState>()((set) => ({
  jobs: [],
  activeJob: null,

  addJob: (job: Job) => {
    set((state) => ({
      jobs: [job, ...state.jobs],
    }))
  },

  updateJob: (jobId: string, updates: Partial<Job>) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
      activeJob:
        state.activeJob?.id === jobId
          ? { ...state.activeJob, ...updates }
          : state.activeJob,
    }))
  },

  removeJob: (jobId: string) => {
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== jobId),
      activeJob: state.activeJob?.id === jobId ? null : state.activeJob,
    }))
  },

  setActiveJob: (job: Job | null) => {
    set({ activeJob: job })
  },

  setJobs: (jobs: Job[]) => {
    set({ jobs })
  },
}))
