import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  Loader2,
  Play,
  RotateCcw,
  Pencil,
  Trash2,
  Plus,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toast'
import { useCreativeStore } from '@/stores/creativeStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useLanguage } from '@/hooks/useLanguage'
import api from '@/lib/api'
import type { Storyboard, StoryboardScene, ChatMessage } from '@/types'

// ---- Chat Panel ----

function ChatPanel({
  messages,
  isLoading,
  onSend,
  compact,
}: {
  messages: ChatMessage[]
  isLoading: boolean
  onSend: (msg: string) => void
  compact?: boolean
}) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
  }

  return (
    <div className={`flex flex-col ${compact ? 'h-full' : 'h-[60vh]'}`}>
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {msg.role === 'assistant'
                  ? msg.content.replace(/```json[\s\S]*?```/g, '').trim() || msg.content
                  : msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-2.5 text-sm text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t.aiCreator?.thinking || 'AI is thinking...'}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex items-center gap-2 border-t border-slate-800 p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.aiCreator?.chatPlaceholder || 'Type your reply...'}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isLoading}
        />
        <Button size="icon" onClick={handleSend} disabled={isLoading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ---- Storyboard Editor ----

function StoryboardEditor({
  storyboard,
  onChange,
}: {
  storyboard: Storyboard
  onChange: (sb: Storyboard) => void
}) {
  const { t } = useLanguage()

  const updateScene = (idx: number, patch: Partial<StoryboardScene>) => {
    const updated = { ...storyboard }
    updated.scenes = storyboard.scenes.map((s, i) =>
      i === idx ? { ...s, ...patch } : s
    )
    onChange(updated)
  }

  const removeScene = (idx: number) => {
    const updated = { ...storyboard }
    updated.scenes = storyboard.scenes
      .filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, order_index: i }))
    onChange(updated)
  }

  const addScene = () => {
    const updated = { ...storyboard }
    updated.scenes = [
      ...storyboard.scenes,
      {
        order_index: storyboard.scenes.length,
        prompt: '',
        character_name: storyboard.characters[0]?.name,
        duration: 5,
      },
    ]
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Title and description */}
      <div className="space-y-2">
        <Input
          value={storyboard.title}
          onChange={(e) => onChange({ ...storyboard, title: e.target.value })}
          className="text-lg font-semibold"
          placeholder={t.aiCreator?.storyTitle || 'Story title'}
        />
        <Input
          value={storyboard.description}
          onChange={(e) => onChange({ ...storyboard, description: e.target.value })}
          placeholder={t.aiCreator?.storyDesc || 'Brief description'}
          className="text-sm text-muted-foreground"
        />
      </div>

      {/* Characters */}
      {storyboard.characters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {storyboard.characters.map((ch, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {ch.name}: {ch.description.slice(0, 40)}
              {ch.description.length > 40 ? '...' : ''}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Scenes */}
      <div className="space-y-3">
        {storyboard.scenes.map((scene, idx) => (
          <Card key={idx} className="border-slate-800 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {t.aiCreator?.scene || 'Scene'} {idx + 1}
                </Badge>
                {scene.character_name && (
                  <Badge variant="secondary" className="text-xs">
                    {scene.character_name}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-400"
                onClick={() => removeScene(idx)}
                disabled={storyboard.scenes.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <Textarea
                value={scene.prompt}
                onChange={(e) => updateScene(idx, { prompt: e.target.value })}
                rows={3}
                placeholder="Describe this scene in detail (English)..."
                className="resize-none text-sm"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={addScene}>
        <Plus className="mr-2 h-4 w-4" />
        {t.aiCreator?.addScene || 'Add Scene'}
      </Button>
    </div>
  )
}

// ---- Main Page ----

export function AICreatorPage() {
  const {
    sessionId,
    status,
    messages,
    storyboard,
    storyId,
    isLoading,
    setSessionId,
    setStatus,
    addMessage,
    setMessages,
    setStoryboard,
    setStoryId,
    setIsLoading,
    reset,
  } = useCreativeStore()

  const { defaultProvider } = useSettingsStore()
  const { t } = useLanguage()
  const [ideaInput, setIdeaInput] = useState('')

  // Start a new session with initial idea
  const handleStart = async () => {
    const idea = ideaInput.trim()
    if (!idea) return

    reset()
    setIsLoading(true)
    addMessage({ role: 'user', content: idea })

    try {
      const res = await api.post('/creative/sessions', { idea })
      const data = res.data
      setSessionId(data.id)
      setStatus(data.status)
      setMessages(data.conversation_history || [])
      if (data.storyboard) setStoryboard(data.storyboard)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to start creative session')
      reset()
    } finally {
      setIsLoading(false)
      setIdeaInput('')
    }
  }

  // Continue chat
  const handleChat = async (message: string) => {
    if (!sessionId) return
    setIsLoading(true)
    addMessage({ role: 'user', content: message })

    try {
      const res = await api.post(`/creative/sessions/${sessionId}/chat`, { message })
      const data = res.data
      setMessages(data.conversation_history || [])
      setStatus(data.status)
      if (data.storyboard) setStoryboard(data.storyboard)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Chat failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Save edited storyboard
  const handleSaveStoryboard = async (sb: Storyboard) => {
    setStoryboard(sb)
    if (!sessionId) return
    try {
      await api.put(`/creative/sessions/${sessionId}/storyboard`, { storyboard: sb })
    } catch {
      // silent — local state is the source of truth for editing
    }
  }

  // Confirm and generate
  const handleConfirm = async () => {
    if (!sessionId || !storyboard) return
    setIsLoading(true)
    try {
      // Save latest storyboard first
      await api.put(`/creative/sessions/${sessionId}/storyboard`, { storyboard })
      const res = await api.post(`/creative/sessions/${sessionId}/confirm`, {
        provider: defaultProvider || 'jimeng',
      })
      const data = res.data
      setStatus('generating')
      if (data.story_id) setStoryId(data.story_id)
      toast.success(data.message || (t.aiCreator?.generationStarted || 'Generation started!'))
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to start generation')
    } finally {
      setIsLoading(false)
    }
  }

  // Regenerate storyboard (re-enter chat)
  const handleRegenerate = () => {
    setStoryboard(null)
    setStatus('chatting')
  }

  // ---- Phase: Initial idea input (no session yet) ----
  if (!sessionId && !isLoading && messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl anime-gradient">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold anime-gradient-text">
              {t.aiCreator?.title || 'AI Creative Director'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.aiCreator?.subtitle || 'Describe your video idea in one sentence, and AI will help you create it'}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              placeholder={t.aiCreator?.ideaPlaceholder || 'e.g. A samurai wandering through cherry blossoms at dusk...'}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleStart()
                }
              }}
            />
            <Button onClick={handleStart} disabled={!ideaInput.trim()}>
              <Sparkles className="mr-2 h-4 w-4" />
              {t.aiCreator?.start || 'Start'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Phase: Generating ----
  if (status === 'generating') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <h2 className="text-lg font-semibold">
            {t.aiCreator?.generating || 'Generating your video...'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {storyId
              ? (t.aiCreator?.generatingStory || 'Story generation in progress. Check the Jobs page for status.')
              : (t.aiCreator?.generatingSingle || 'Video generation in progress. Check the Jobs page for status.')}
          </p>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t.aiCreator?.newSession || 'New Session'}
          </Button>
        </div>
      </div>
    )
  }

  // ---- Phase: Chat + optional storyboard preview ----
  const hasStoryboard = !!storyboard && status === 'storyboard_ready'

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Left: Chat */}
      <div
        className={`flex flex-col border-b border-slate-800 lg:border-b-0 lg:border-r ${
          hasStoryboard ? 'lg:w-2/5' : 'lg:w-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">
              {t.aiCreator?.chatTitle || 'Creative Chat'}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            {t.aiCreator?.newSession || 'New'}
          </Button>
        </div>
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSend={handleChat}
          compact={hasStoryboard}
        />
      </div>

      {/* Right: Storyboard editor */}
      {hasStoryboard && storyboard && (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold">
              {t.aiCreator?.storyboardTitle || 'Storyboard'}
            </h2>
            <Badge variant="secondary">
              {storyboard.scenes.length} {t.aiCreator?.scenes || 'scenes'}
            </Badge>
          </div>
          <ScrollArea className="flex-1 p-4">
            <StoryboardEditor storyboard={storyboard} onChange={handleSaveStoryboard} />
          </ScrollArea>
          <div className="flex items-center gap-2 border-t border-slate-800 p-3">
            <Button variant="outline" className="flex-1" onClick={handleRegenerate}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t.aiCreator?.regenerate || 'Regenerate'}
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {t.aiCreator?.confirmGenerate || 'Confirm & Generate'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
