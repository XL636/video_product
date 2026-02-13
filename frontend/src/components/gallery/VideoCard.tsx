import { Play, Download, Trash2, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDuration } from '@/lib/utils'
import type { Video } from '@/types'

interface VideoCardProps {
  video: Video
  onPlay: (video: Video) => void
  onDelete: (video: Video) => void
  onRegenerate: (video: Video) => void
}

const typeLabels: Record<string, string> = {
  img2vid: 'Image to Video',
  txt2vid: 'Text to Video',
  vid2anime: 'Video to Anime',
  story: 'Story',
}

export function VideoCard({
  video,
  onPlay,
  onDelete,
  onRegenerate,
}: VideoCardProps) {
  return (
    <Card className="group overflow-hidden border-slate-800 bg-slate-900/50 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-primary/5">
      <div
        className="relative aspect-video cursor-pointer overflow-hidden"
        onClick={() => onPlay(video)}
      >
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-800">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40">
          <Play className="h-12 w-12 text-white opacity-0 transition-all group-hover:opacity-100" />
        </div>

        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="bg-black/70 text-xs">
            {formatDuration(video.duration)}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="line-clamp-1 text-sm font-medium">{video.title}</h3>
          <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
            {typeLabels[video.job_type] || video.job_type}
          </Badge>
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(video.created_at), {
            addSuffix: true,
          })}
        </p>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              const a = document.createElement('a')
              a.href = video.url
              a.download = video.title
              a.click()
            }}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRegenerate(video)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(video)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
