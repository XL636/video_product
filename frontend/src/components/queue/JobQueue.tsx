import { useJobStore } from '@/stores/jobStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { JobCard } from './JobCard'
import { ListOrdered } from 'lucide-react'

export function JobQueue() {
  const jobs = useJobStore((state) => state.jobs)
  const removeJob = useJobStore((state) => state.removeJob)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-800 p-4">
        <ListOrdered className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Job Queue</h3>
        <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-muted-foreground">
          {jobs.length}
        </span>
      </div>

      <ScrollArea className="flex-1 p-3">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-muted-foreground">
              No active jobs. Submit a generation to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onRemove={removeJob} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
