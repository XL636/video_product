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

const ANIME_KEYWORDS = [
  'anime style',
  'detailed cel shading',
  'vibrant colors',
  'dynamic camera movement',
  'sakura petals',
  'soft lighting',
  'detailed background art',
]

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

  const enhancePrompt = () => {
    const randomKeywords = ANIME_KEYWORDS.sort(() => Math.random() - 0.5).slice(
      0,
      3
    )
    const enhanced = prompt.trim()
      ? `${prompt.trim()}, ${randomKeywords.join(', ')}`
      : randomKeywords.join(', ')
    setPrompt(enhanced)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Please enter a prompt', variant: 'destructive' })
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
      toast({ title: 'Job submitted successfully!', variant: 'success' })
      setPrompt('')
    } catch {
      toast({ title: 'Failed to submit job', variant: 'destructive' })
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
          label="Scene Description"
          placeholder="Describe your anime video scene in detail... e.g., 'A lone samurai stands on a misty mountain peak at dawn, wind blowing through their hair, cherry blossom petals swirling around'"
          rows={6}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={enhancePrompt}
          className="mt-2"
        >
          <Wand2 className="mr-1 h-3 w-3" />
          Enhance with anime keywords
        </Button>
      </div>

      <StylePresetSelector value={stylePreset} onChange={setStylePreset} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kling">Kling AI</SelectItem>
              <SelectItem value="hailuo">Hailuo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="10">10 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={setAspectRatio}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 Landscape</SelectItem>
              <SelectItem value="9:16">9:16 Portrait</SelectItem>
              <SelectItem value="1:1">1:1 Square</SelectItem>
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
        {isSubmitting ? 'Generating...' : 'Generate Video'}
      </Button>
    </div>
  )
}
