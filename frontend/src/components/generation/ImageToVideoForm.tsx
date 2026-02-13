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

  const handleFileSelect = async (file: File) => {
    await upload(file)
  }

  const handleGenerate = async () => {
    if (!uploadedUrl) {
      toast({ title: 'Please upload an image first', variant: 'destructive' })
      return
    }
    if (!prompt.trim()) {
      toast({ title: 'Please enter a motion prompt', variant: 'destructive' })
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
      <FileDropZone
        accept="image"
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        uploadProgress={progress}
      />

      <PromptEditor
        value={prompt}
        onChange={setPrompt}
        label="Motion Description"
        placeholder="Describe how the image should animate... e.g., 'camera slowly pans right, cherry blossoms falling gently'"
      />

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
        disabled={isSubmitting || isUploading || !uploadedUrl}
      >
        <Sparkles className="h-4 w-4" />
        {isSubmitting ? 'Generating...' : 'Generate Video'}
      </Button>
    </div>
  )
}
