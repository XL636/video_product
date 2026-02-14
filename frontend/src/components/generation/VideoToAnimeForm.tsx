import { useState } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { FileDropZone } from '@/components/common/FileDropZone'
import { StylePresetSelector } from './StylePresetSelector'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useJobStore } from '@/stores/jobStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { StylePreset, Job } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

export function VideoToAnimeForm() {
  const [stylePreset, setStylePreset] = useState<StylePreset>(
    useSettingsStore.getState().defaultStylePreset
  )
  const [styleStrength, setStyleStrength] = useState([0.7])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isUploading, progress, url: uploadedUrl, upload } = useFileUpload()
  const addJob = useJobStore((state) => state.addJob)
  const { t } = useLanguage()

  const handleFileSelect = async (file: File) => {
    await upload(file)
  }

  const handleGenerate = async () => {
    if (!uploadedUrl) {
      toast({ title: t.messages?.uploadVideoFirst, variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      // Submit generation job
      const response = await api.post('/generate/video-to-anime', {
        prompt: `Convert to ${stylePreset} anime style`,
        style_preset: stylePreset,
        provider: 'kling',  // Use kling as default since comfyui needs local setup
        file_url: uploadedUrl,
        style_strength: styleStrength[0],
      })

      // Get full job details
      const jobId = response.data.data?.job_id || response.data.job_id
      const jobResponse = await api.get<Job>(`/jobs/${jobId}`)

      // Add job to store with complete data
      addJob(jobResponse.data)
      toast({ title: t.messages?.jobSubmitted, variant: 'success' })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      const msg = detail?.includes('No API key')
        ? t.messages?.noApiKey?.replace('{provider}', 'comfyui') || detail
        : detail || t.messages?.jobFailed
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{t.vid2anime?.comfyuiWarning}</span>
      </div>

      <FileDropZone
        accept="video"
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        uploadProgress={progress}
      />

      <StylePresetSelector value={stylePreset} onChange={setStylePreset} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t.form?.styleStrength}</Label>
          <span className="text-sm text-muted-foreground">
            {styleStrength[0].toFixed(1)}
          </span>
        </div>
        <Slider
          value={styleStrength}
          onValueChange={setStyleStrength}
          min={0.3}
          max={1.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{t.vid2anime?.subtle}</span>
          <span>{t.vid2anime?.full}</span>
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
        {isSubmitting ? t.button?.converting : t.button?.convertToAnime}
      </Button>
    </div>
  )
}
