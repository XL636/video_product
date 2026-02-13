import { VideoCard } from './VideoCard'
import type { Video } from '@/types'

interface VideoGridProps {
  videos: Video[]
  onPlay: (video: Video) => void
  onDelete: (video: Video) => void
  onRegenerate: (video: Video) => void
}

export function VideoGrid({
  videos,
  onPlay,
  onDelete,
  onRegenerate,
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No videos yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate your first anime video to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onPlay={onPlay}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
        />
      ))}
    </div>
  )
}
