import { useState } from 'react'
import { Sparkles, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PromptEditor } from '@/components/common/PromptEditor'
import { StylePresetSelector } from './StylePresetSelector'
import { useJobStore } from '@/stores/jobStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { StylePreset, Job } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

const STYLE_KEYWORDS: Record<string, { zh: string[]; en: string[] }> = {
  ghibli: {
    zh: ['吉卜力风格', '水彩质感', '柔和光线', '宫崎骏式构图', '梦幻田园', '手绘细节', '自然氛围'],
    en: ['ghibli style', 'watercolor texture', 'soft lighting', 'miyazaki composition', 'dreamy pastoral', 'hand-drawn detail', 'natural atmosphere'],
  },
  shonen: {
    zh: ['少年漫画风格', '热血动作', '粗犷线条', '速度线效果', '战斗场景', '动态构图', '力量感'],
    en: ['shonen style', 'intense action', 'bold linework', 'speed lines', 'battle scene', 'dynamic composition', 'powerful impact'],
  },
  seinen: {
    zh: ['青年漫画风格', '写实比例', '暗色调氛围', '精细阴影', '成熟叙事', '电影感镜头', '细腻表情'],
    en: ['seinen style', 'realistic proportions', 'dark atmosphere', 'detailed shading', 'mature narrative', 'cinematic framing', 'subtle expressions'],
  },
  cyberpunk_anime: {
    zh: ['赛博朋克风格', '霓虹灯光', '未来都市', '科技感', '暗色调', '全息投影', '机械元素'],
    en: ['cyberpunk style', 'neon lighting', 'futuristic city', 'high-tech', 'dark tone', 'holographic', 'mechanical elements'],
  },
  chibi: {
    zh: ['Q版风格', '可爱角色', '大眼睛', '萌系设计', '明亮配色', '简化比例', '卡哇伊'],
    en: ['chibi style', 'cute characters', 'big eyes', 'kawaii design', 'bright colors', 'simplified proportions', 'adorable'],
  },
}

const GENERAL_KEYWORDS = {
  zh: ['动漫风格', '精细线条', '鲜艳色彩', '动态镜头', '精美背景', '流畅动画', '日系画风'],
  en: ['anime style', 'detailed linework', 'vibrant colors', 'dynamic camera', 'detailed background', 'smooth animation', 'japanese art style'],
}

export function TextToVideoForm() {
  const [prompt, setPrompt] = useState('')
  const [stylePreset, setStylePreset] = useState<StylePreset>(
    useSettingsStore.getState().defaultStylePreset
  )
  const [provider, setProvider] = useState(
    useSettingsStore.getState().defaultProvider
  )
  const [duration, setDuration] = useState('5')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addJob = useJobStore((state) => state.addJob)
  const { language, t } = useLanguage()

  const enhancePrompt = () => {
    const lang = language === 'zh-CN' ? 'zh' : 'en'
    const keywords = STYLE_KEYWORDS[stylePreset]?.[lang] ?? GENERAL_KEYWORDS[lang]
    const currentPrompt = prompt.trim().toLowerCase()
    const available = keywords.filter((kw) => !currentPrompt.includes(kw.toLowerCase()))
    const selected = available.sort(() => Math.random() - 0.5).slice(0, 3)
    if (selected.length === 0) return
    const enhanced = prompt.trim()
      ? `${prompt.trim()}, ${selected.join(', ')}`
      : selected.join(', ')
    setPrompt(enhanced)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: t.messages?.enterPrompt, variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      // Submit generation job
      const response = await api.post('/generate/text-to-video', {
        prompt,
        style_preset: stylePreset,
        provider,
        duration: parseInt(duration),
        aspect_ratio: aspectRatio,
      })

      // Get full job details
      const jobId = response.data.data?.job_id || response.data.job_id
      const jobResponse = await api.get<Job>(`/jobs/${jobId}`)

      // Add job to store with complete data
      addJob(jobResponse.data)
      toast({ title: t.messages?.jobSubmitted, variant: 'success' })
      setPrompt('')
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const msg = detail?.includes('No API key')
        ? t.messages?.noApiKey?.replace('{provider}', provider) || detail
        : detail || t.messages?.jobFailed
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <PromptEditor
          value={prompt}
          onChange={setPrompt}
          label={t.form?.sceneDescription}
          placeholder={t.promptEditor?.scenePlaceholder}
          rows={6}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={enhancePrompt}
          className="mt-2"
        >
          <Wand2 className="mr-1 h-3 w-3" />
          {t.button?.enhancePrompt}
        </Button>
      </div>

      <StylePresetSelector value={stylePreset} onChange={setStylePreset} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>{t.form?.provider}</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kling">Kling AI</SelectItem>
              <SelectItem value="jimeng">即梦 Jimeng</SelectItem>
              <SelectItem value="vidu">Vidu</SelectItem>
              <SelectItem value="cogvideo">智谱 CogVideoX</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.form?.duration}</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">{t.duration?.fiveSeconds}</SelectItem>
              <SelectItem value="10">{t.duration?.tenSeconds}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t.form?.aspectRatio}</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">{t.aspectRatio?.landscape}</SelectItem>
              <SelectItem value="9:16">{t.aspectRatio?.portrait}</SelectItem>
              <SelectItem value="1:1">{t.aspectRatio?.square}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        variant="anime"
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={isSubmitting || !prompt.trim()}
      >
        <Sparkles className="h-4 w-4" />
        {isSubmitting ? t.button?.generating : t.button?.generateVideo}
      </Button>
    </div>
  )
}
