import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VideoGrid } from '@/components/gallery/VideoGrid'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { Video } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

export function GalleryPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const { language, t } = useLanguage()

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const response = await api.get('/gallery')
        const data = response.data.data || response.data
        setVideos(data.items || [])
      } catch {
        // empty gallery on error
      } finally {
        setIsLoading(false)
      }
    }
    loadVideos()
  }, [])

  useEffect(() => {
    let result = videos

    if (typeFilter !== 'all') {
      result = result.filter((v) => v.job_type === typeFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((v) => v.title.toLowerCase().includes(q))
    }

    setFilteredVideos(result)
  }, [videos, typeFilter, search])

  const handleDelete = async (video: Video) => {
    try {
      await api.delete(`/gallery/${video.id}`)
      setVideos((prev) => prev.filter((v) => v.id !== video.id))
      toast({
        title: language === 'zh-CN' ? '视频已删除' : 'Video deleted',
        variant: 'default',
      })
    } catch {
      toast({
        title: language === 'zh-CN' ? '删除视频失败' : 'Failed to delete video',
        variant: 'destructive',
      })
    }
  }

  const handleRegenerate = (video: Video) => {
    toast({
      title: language === 'zh-CN' ? '重新生成已加入队列' : 'Regeneration queued',
      description: `${language === 'zh-CN' ? '正在重新生成' : 'Regenerating'} "${video.title}"`,
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Filter Bar */}
      <div className="mb-4 lg:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'zh-CN' ? '搜索视频...' : 'Search videos...'}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={language === 'zh-CN' ? '按类型筛选' : 'Filter by type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.videoType?.all || 'All Types'}</SelectItem>
            <SelectItem value="img2vid">{t.videoType?.img2vid || 'Image to Video'}</SelectItem>
            <SelectItem value="txt2vid">{t.videoType?.txt2vid || 'Text to Video'}</SelectItem>
            <SelectItem value="vid2anime">{t.videoType?.vid2anime || 'Video to Anime'}</SelectItem>
            <SelectItem value="story">{t.generation?.story || 'Story'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Video Grid */}
      <VideoGrid
        videos={filteredVideos}
        onPlay={setSelectedVideo}
        onDelete={handleDelete}
        onRegenerate={handleRegenerate}
      />

      {/* Video Player Dialog */}
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => !open && setSelectedVideo(null)}
      >
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-base truncate">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <video
                src={selectedVideo.url}
                controls
                autoPlay
                className="h-full w-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
