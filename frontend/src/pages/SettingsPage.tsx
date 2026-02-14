import { useState, useEffect } from 'react'
import { Key, Save, Trash2, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toast'
import { useSettingsStore } from '@/stores/settingsStore'
import api from '@/lib/api'
import type { ApiKeyConfig, StylePreset } from '@/types'
import { useLanguage } from '@/hooks/useLanguage'

interface ProviderConfig {
  key: string
  label: string
  description: string
}

export function SettingsPage() {
  const {
    defaultProvider,
    defaultStylePreset,
    setDefaultProvider,
    setDefaultStylePreset,
  } = useSettingsStore()
  const { t } = useLanguage()

  const providers: ProviderConfig[] = [
    {
      key: 'kling',
      label: 'Kling AI',
      description: t.settings?.klingDesc || '',
    },
    {
      key: 'jimeng',
      label: '即梦 Jimeng',
      description: t.settings?.jimengDesc || '',
    },
    {
      key: 'vidu',
      label: 'Vidu 生数科技',
      description: t.settings?.viduDesc || '',
    },
    {
      key: 'comfyui',
      label: 'ComfyUI',
      description: t.settings?.comfyuiDesc || '',
    },
  ]

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h2 className="mb-6 text-xl font-semibold">{t.nav?.settings}</h2>

      {/* API Keys */}
      <div className="mb-8 space-y-4">
        <h3 className="text-lg font-medium">
          {t.settings?.apiKeys}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.settings?.apiKeysDesc}
        </p>
        <div className="space-y-4">
          {providers.map((provider) => (
            <ApiKeyCard key={provider.key} provider={provider} />
          ))}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Defaults */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">
          {t.settings?.defaults}
        </h3>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t.settings?.defaultProvider}</Label>
            <Select value={defaultProvider} onValueChange={setDefaultProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kling">Kling AI</SelectItem>
                <SelectItem value="jimeng">即梦 Jimeng</SelectItem>
                <SelectItem value="vidu">Vidu</SelectItem>
                <SelectItem value="comfyui">ComfyUI ({t.settings?.local})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.settings?.defaultStylePreset}</Label>
            <Select
              value={defaultStylePreset}
              onValueChange={(val) =>
                setDefaultStylePreset(val as StylePreset)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ghibli">{t.styles?.ghibli}</SelectItem>
                <SelectItem value="shonen">{t.styles?.shonen}</SelectItem>
                <SelectItem value="seinen">{t.styles?.seinen}</SelectItem>
                <SelectItem value="cyberpunk_anime">{t.styles?.cyberpunk}</SelectItem>
                <SelectItem value="chibi">{t.styles?.chibi}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiKeyCard({ provider }: { provider: ProviderConfig }) {
  const { t } = useLanguage()
  const [apiKey, setApiKey] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Check if API key is configured
    api
      .get(`/settings/api-keys`)
      .then((res) => {
        const keys = res.data.data || res.data.keys || []
        const keyConfig = keys.find((k: ApiKeyConfig) => k.provider === provider.key)
        setIsConfigured(keyConfig?.configured || false)
      })
      .catch(() => {
        // not configured
      })
  }, [provider.key])

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setIsSaving(true)
    try {
      await api.post(`/settings/api-keys`, {
        provider: provider.key,
        api_key: apiKey,
      })
      setIsConfigured(true)
      setApiKey('')
      setShowKey(false)
      toast({
        title: `${provider.label} ${t.messages?.apiKeySaved}`,
        variant: 'success',
      })
    } catch {
      toast({
        title: t.messages?.apiKeySaveFailed,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/settings/api-keys/${provider.key}`)
      setIsConfigured(false)
      setApiKey('')
      toast({
        title: `${provider.label} ${t.messages?.apiKeyRemoved}`,
        variant: 'default',
      })
    } catch {
      toast({
        title: t.messages?.apiKeyRemoveFailed,
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{provider.label}</CardTitle>
            <CardDescription>{provider.description}</CardDescription>
          </div>
          {isConfigured && (
            <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              {t.settings?.configured}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isConfigured ? '********' : t.settings?.enterApiKey}
              className="pr-9"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <Button
            onClick={handleSave}
            disabled={!apiKey.trim() || isSaving}
            size="sm"
          >
            <Save className="mr-1 h-3 w-3" />
            {t.common?.save}
          </Button>
          {isConfigured && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-1 h-3 w-3" />
              {t.common?.delete}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
