import { formatDistanceToNow } from 'date-fns'
import { X, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { truncate } from '@/lib/utils'
import type { Job } from '@/types'

interface JobCardProps {
  job: Job
  onRemove: (jobId: string) => void
}

const statusConfig: Record<
  Job['status'],
  { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' }
> = {
  queued: {
    icon: <Clock className="h-3 w-3" />,
    label: 'Queued',
    variant: 'secondary',
  },
  submitted: {
    icon: <Clock className="h-3 w-3" />,
    label: 'Submitted',
    variant: 'info',
  },
  processing: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    label: 'Processing',
    variant: 'warning',
  },
  completed: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Completed',
    variant: 'success',
  },
  failed: {
    icon: <XCircle className="h-3 w-3" />,
    label: 'Failed',
    variant: 'destructive',
  },
}

const typeLabels: Record<string, string> = {
  img2vid: 'Img2Vid',
  txt2vid: 'Txt2Vid',
  vid2anime: 'Vid2Anime',
  story: 'Story',
}

export function JobCard({ job, onRemove }: JobCardProps) {
  const config = statusConfig[job.status]
  const isActive = job.status === 'processing' || job.status === 'submitted' || job.status === 'queued'

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 transition-all hover:border-slate-700">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={config.variant} className="gap-1 text-[10px]">
            {config.icon}
            {config.label}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {typeLabels[job.job_type] || job.job_type}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0"
          onClick={() => onRemove(job.id)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <p className="mb-1 text-xs text-foreground">
        {truncate(job.prompt, 60)}
      </p>

      <p className="mb-2 text-[10px] text-muted-foreground">
        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
      </p>

      {isActive && (
        <div className="space-y-1">
          <Progress value={job.progress} className="h-1" />
          <p className="text-right text-[10px] text-muted-foreground">
            {job.progress}%
          </p>
        </div>
      )}

      {job.status === 'failed' && job.error_message && (
        <p className="mt-1 text-[10px] text-red-400">
          {truncate(job.error_message, 80)}
        </p>
      )}
    </div>
  )
}
