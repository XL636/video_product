import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Image, Type, Film, BookOpen, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'
import type { Video } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

export function DashboardPage() {
  const [recentVideos, setRecentVideos] = useState<Video[]>([])
  const { language, t } = useLanguage()

  const features = [
    {
      icon: Image,
      title: t.generation?.img2vid || 'Image to Video',
      description: language === 'zh-CN'
        ? '使用 AI 动画技术将静态图片转换为动态动漫场景。'
        : 'Transform static images into animated anime scenes with AI-powered motion.',
      tab: 'img2vid',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: Type,
      title: t.generation?.txt2vid || 'Text to Video',
      description: language === 'zh-CN'
        ? '用文字描述场景，看着它变为动漫视频。'
        : 'Describe your scene in words and watch it come to life as anime.',
      tab: 'txt2vid',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Film,
      title: t.generation?.vid2anime || 'Video to Anime',
      description: language === 'zh-CN'
        ? '将真实视频素材转换为精美的动漫风格视频。'
        : 'Convert real-world footage into beautiful anime-style videos.',
      tab: 'vid2anime',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: BookOpen,
      title: t.generation?.story || 'Story Studio',
      description: language === 'zh-CN'
        ? '创建多场景动漫故事，保持角色一致性。'
        : 'Create multi-scene anime stories with consistent characters.',
      tab: 'story',
      gradient: 'from-amber-500 to-orange-600',
    },
  ]

  useEffect(() => {
    api
      .get<Video[]>('/videos', { params: { limit: 6 } })
      .then((res) => setRecentVideos(res.data))
      .catch(() => {
        // ignore errors on initial load
      })
  }, [])

  return (
    <div className="p-4 sm:p-6">
      {/* Hero Section */}
      <div className="relative mb-8 sm:mb-10 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 anime-gradient opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 to-slate-950/50" />
        <div className="relative px-6 py-10 sm:px-8 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-3 text-2xl sm:text-3xl lg:text-4xl font-bold">
              {language === 'zh-CN' ? '欢迎使用' : 'Welcome to'}{' '}
              <span className="anime-gradient-text">AnimeGen Studio</span>
            </h1>
            <p className="mb-5 sm:mb-6 max-w-lg text-sm sm:text-base lg:text-lg text-slate-300">
              {language === 'zh-CN'
                ? '使用 AI 驱动创建惊艳的动漫视频。将图片、文字和视频转换为精美的动漫内容。'
                : 'Create stunning anime videos powered by AI. Transform images, text, and videos into beautiful anime content.'}
            </p>
            <Button variant="anime" size="default" className="w-full sm:w-auto sm:size-lg" asChild>
              <Link to="/create">
                {language === 'zh-CN' ? '开始创作' : 'Start Creating'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Feature Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={`/create?tab=${feature.tab}`}>
              <Card className="group h-full cursor-pointer border-slate-800 bg-slate-900/50 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="p-5 sm:p-6">
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Generations */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg sm:text-xl font-semibold">
            {language === 'zh-CN' ? '最近生成' : 'Recent Generations'}
          </h2>
          <Button variant="ghost" size="sm" className="self-start sm:self-auto" asChild>
            <Link to="/gallery">
              {language === 'zh-CN' ? '查看全部' : 'View all'}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>

        {recentVideos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {recentVideos.map((video) => (
              <Link
                key={video.id}
                to="/gallery"
                className="group overflow-hidden rounded-xl border border-slate-800 transition-all hover:border-slate-700"
              >
                <div className="aspect-video overflow-hidden bg-slate-800">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="truncate text-xs font-medium">{video.title}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Film className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {language === 'zh-CN'
                  ? '还没有生成视频。创建你的第一个吧！'
                  : 'No videos generated yet. Create your first one!'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
