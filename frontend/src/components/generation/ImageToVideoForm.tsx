import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileDropZone } from '@/components/common/FileDropZone'
import { PromptEditor } from '@/components/common/PromptEditor'
import { StylePresetSelector } from './StylePresetSelector'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useJobStore } from '@/stores/jobStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { StylePreset, Job } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

export function ImageToVideoForm() {
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
  const { isUploading, progress, url: uploadedUrl, upload } = useFileUpload()
  const addJob = useJobStore((state) => state.addJob)
  const { t } = useLanguage()

  const handleFileSelect = async (file: File) => {
    await upload(file)
  }

  const handleGenerate = async () => {
    if (!uploadedUrl) {
      toast({ title: t.messages?.uploadImageFirst, variant: 'destructive' })
      return
    }
    if (!prompt.trim()) {
      toast({ title: t.messages?.enterMotionPrompt, variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      // Submit generation job
      const response = await api.post('/generate/image-to-video', {
        prompt,
        style_preset: stylePreset,
        provider,
        duration: parseInt(duration),
        aspect_ratio: aspectRatio,
        file_url: uploadedUrl,
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
      <FileDropZone
        accept="image"
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        uploadProgress={progress}
      />

      <PromptEditor
        value={prompt}
        onChange={setPrompt}
        label={t.form?.motionDescription}
        placeholder={t.promptEditor?.motionPlaceholder}
      />

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
        disabled={isSubmitting || isUploading || !uploadedUrl}
      >
        <Sparkles className="h-4 w-4" />
        {isSubmitting ? t.button?.generating : t.button?.generateVideo}
      </Button>
    </div>
  )
}
