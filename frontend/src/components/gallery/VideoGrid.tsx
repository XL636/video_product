import { Film } from 'lucide-react'
import { VideoCard } from './VideoCard'
import type { Video } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

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
  const { language } = useLanguage()

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
          <Film className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">
          {language === 'zh-CN' ? '还没有视频' : 'No videos yet'}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {language === 'zh-CN'
            ? '生成你的第一个动漫视频吧！'
            : 'Generate your first anime video to see it here.'}
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
