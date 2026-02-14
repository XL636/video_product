import { useState, useCallback, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Play,
  Merge,
  Upload,
  GripVertical,
  Sparkles,
  Download,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { FileDropZone } from '@/components/common/FileDropZone'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useJobStore } from '@/stores/jobStore'
import { toast } from '@/components/ui/toast'
import api from '@/lib/api'
import type { Character, Scene, Job } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

// For now, we'll use a mock story ID for merge functionality
// In a full implementation, this would come from a saved story
const STORY_ID = localStorage.getItem('current_story_id') || 'temp-story-id'

export function StudioPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [showCharDialog, setShowCharDialog] = useState(false)
  const [newCharName, setNewCharName] = useState('')
  const [newCharDesc, setNewCharDesc] = useState('')
  const [isMerging, setIsMerging] = useState(false)
  const [mergedVideoUrl, setMergedVideoUrl] = useState<string | null>(null)
  const { upload } = useFileUpload()
  const addJob = useJobStore((state) => state.addJob)
  const { t } = useLanguage()

  const [charImageUrl, setCharImageUrl] = useState<string | null>(null)

  const handleCharImageSelect = useCallback(
    async (file: File) => {
      const url = await upload(file)
      if (url) setCharImageUrl(url)
    },
    [upload]
  )

  const addCharacter = () => {
    if (!newCharName.trim()) return
    const character: Character = {
      id: crypto.randomUUID(),
      name: newCharName,
      description: newCharDesc,
      reference_image_url: charImageUrl || '',
    }
    setCharacters((prev) => [...prev, character])
    setNewCharName('')
    setNewCharDesc('')
    setCharImageUrl(null)
    setShowCharDialog(false)
  }

  const removeCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
  }

  const addScene = () => {
    const scene: Scene = {
      id: crypto.randomUUID(),
      order_index: scenes.length,
      prompt: '',
      character_id: undefined,
      job_id: undefined,
      status: 'draft',
    }
    setScenes((prev) => [...prev, scene])
  }

  const updateScene = (id: string, updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    )
  }

  const removeScene = (id: string) => {
    setScenes((prev) => prev.filter((s) => s.id !== id))
  }

  const generateScene = async (scene: Scene) => {
    if (!scene.prompt.trim()) {
      toast({ title: t.messages?.sceneNeedsPrompt, variant: 'destructive' })
      return
    }

    try {
      const response = await api.post<Job>('/jobs', {
        job_type: 'story',
        prompt: scene.prompt,
        style_preset: 'ghibli',
        provider: 'kling',
        duration: 5,
      })
      addJob(response.data)
      updateScene(scene.id, {
        job_id: response.data.id,
        status: 'processing',
      })
      toast({ title: t.messages?.sceneGenStarted, variant: 'success' })
    } catch {
      toast({ title: t.messages?.sceneGenFailed, variant: 'destructive' })
    }
  }

  const generateAll = async () => {
    const pendingScenes = scenes.filter(
      (s) => s.status === 'draft' && s.prompt.trim()
    )
    if (pendingScenes.length === 0) {
      toast({ title: t.messages?.noScenesToGenerate, variant: 'destructive' })
      return
    }
    for (const scene of pendingScenes) {
      await generateScene(scene)
    }
  }

  const mergeScenes = async () => {
    const completedScenes = scenes.filter(s => s.status === 'completed')
    if (completedScenes.length === 0) {
      toast({ title: t.messages?.noCompletedScenes, variant: 'destructive' })
      return
    }

    setIsMerging(true)
    try {
      // Call the merge endpoint
      const response = await api.post(`/stories/${STORY_ID}/merge`)
      toast({
        title: t.messages?.mergeStarted,
        description: (t.messages?.mergingScenes || '').replace('{count}', String(response.data.scene_count)),
        variant: 'default',
      })
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast({
          title: t.messages?.saveStoryFirst,
          description: t.messages?.saveStoryDesc,
          variant: 'destructive',
        })
      } else {
        toast({
          title: t.messages?.mergeFailed,
          description: error?.response?.data?.detail || error?.message || '',
          variant: 'destructive',
        })
      }
    } finally {
      setIsMerging(false)
    }
  }

  const downloadMergedVideo = () => {
    if (mergedVideoUrl) {
      const a = document.createElement('a')
      a.href = mergedVideoUrl
      a.download = 'merged-story.mp4'
      a.click()
    }
  }

  const statusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'processing':
        return 'warning'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string | undefined> = {
      queued: t.status?.queued,
      processing: t.status?.processing,
      completed: t.status?.completed,
      failed: t.status?.failed,
      submitted: t.status?.submitted,
      draft: t.status?.draft,
    }
    return statusMap[status] || status
  }

  return (
    <div className="flex flex-col h-full lg:flex-row">
      {/* Left Panel - Characters */}
      <div className="w-full border-r border-slate-800 flex flex-col lg:w-72 lg:border-r lg:border-b-0 border-b lg:border-b border-slate-800 max-h-48 lg:max-h-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold">{t.studio?.characters}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowCharDialog(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-3">
          {characters.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              {t.studio?.addCharHint}
            </p>
          ) : (
            <div className="space-y-2">
              {characters.map((char) => (
                <Card
                  key={char.id}
                  className="border-slate-800 bg-slate-900/50"
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    {char.reference_image_url ? (
                      <img
                        src={char.reference_image_url}
                        alt={char.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-sm font-medium text-primary">
                        {char.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {char.name}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {char.description || t.studio?.noDescription}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeCharacter(char.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Center - Scene Timeline */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <h3 className="text-sm font-semibold">{t.studio?.sceneTimeline}</h3>
          <Button variant="outline" size="sm" onClick={addScene}>
            <Plus className="mr-1 h-3 w-3" />
            {t.button?.addScene}
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="text-base font-medium">{t.studio?.noScenesYet}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.studio?.addSceneHint}
              </p>
              <Button variant="outline" className="mt-4" onClick={addScene}>
                <Plus className="mr-1 h-3 w-3" />
                {t.button?.addFirstScene}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scenes.map((scene, index) => (
                <Card
                  key={scene.id}
                  className="border-slate-800 bg-slate-900/50"
                >
                  <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t.studio?.scene} {index + 1}
                    </span>
                    <Badge variant={statusBadgeVariant(scene.status)}>
                      {getStatusLabel(scene.status)}
                    </Badge>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => generateScene(scene)}
                        disabled={scene.status === 'processing'}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeScene(scene.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:grid-cols-4">
                      <div className="sm:col-span-3 lg:col-span-3">
                        <Textarea
                          value={scene.prompt}
                          onChange={(e) =>
                            updateScene(scene.id, { prompt: e.target.value })
                          }
                          placeholder={t.studio?.describeScene}
                          rows={3}
                          className="resize-none bg-slate-900/50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t.form?.character}</Label>
                        <Select
                          value={scene.character_id || ''}
                          onValueChange={(val) =>
                            updateScene(scene.id, {
                              character_id: val || undefined,
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder={t.common?.none} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t.common?.none}</SelectItem>
                            {characters.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {scenes.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 p-4">
              {mergedVideoUrl ? (
                <Button variant="anime" className="w-full sm:w-auto" onClick={downloadMergedVideo}>
                  <Download className="mr-1 h-3 w-3" />
                  {t.button?.downloadMerged}
                </Button>
              ) : (
                <Button
                  variant="anime"
                  className="w-full sm:w-auto"
                  onClick={mergeScenes}
                  disabled={isMerging}
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      {t.button?.merging}
                    </>
                  ) : (
                    <>
                      <Merge className="mr-1 h-3 w-3" />
                      {t.button?.mergeExport}
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" className="w-full sm:w-auto" onClick={generateAll}>
                <Play className="mr-1 h-3 w-3" />
                {t.button?.generateAll}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Add Character Dialog */}
      <Dialog open={showCharDialog} onOpenChange={setShowCharDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.button?.addCharacter}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.form?.name}</Label>
              <Input
                value={newCharName}
                onChange={(e) => setNewCharName(e.target.value)}
                placeholder={t.form?.name}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.form?.description}</Label>
              <Textarea
                value={newCharDesc}
                onChange={(e) => setNewCharDesc(e.target.value)}
                placeholder={t.form?.description}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.form?.referenceImage}</Label>
              <FileDropZone
                accept="image"
                onFileSelect={handleCharImageSelect}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCharDialog(false)}>
              {t.common?.cancel}
            </Button>
            <Button onClick={addCharacter} disabled={!newCharName.trim()}>
              {t.button?.addCharacter}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
