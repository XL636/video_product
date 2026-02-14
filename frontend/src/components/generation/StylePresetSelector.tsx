import { cn } from '@/lib/utils'
import type { StylePreset } from '@/types'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/hooks/useLanguage'

interface StylePresetSelectorProps {
  value: StylePreset
  onChange: (preset: StylePreset) => void
}

export function StylePresetSelector({ value, onChange }: StylePresetSelectorProps) {
  const { t } = useLanguage()

  const presets: { value: StylePreset; labelKey: string; descKey: string; gradient: string }[] = [
    {
      value: 'ghibli',
      labelKey: 'ghibli',
      descKey: 'ghibliDesc',
      gradient: 'from-emerald-500 to-sky-400',
    },
    {
      value: 'shonen',
      labelKey: 'shonen',
      descKey: 'shonenDesc',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      value: 'seinen',
      labelKey: 'seinen',
      descKey: 'seinenDesc',
      gradient: 'from-slate-400 to-slate-600',
    },
    {
      value: 'cyberpunk_anime',
      labelKey: 'cyberpunk',
      descKey: 'cyberpunkDesc',
      gradient: 'from-violet-500 to-cyan-400',
    },
    {
      value: 'chibi',
      labelKey: 'chibi',
      descKey: 'chibiDesc',
      gradient: 'from-pink-400 to-rose-400',
    },
  ]

  return (
    <div className="space-y-3">
      <Label>{t.form?.stylePreset}</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              'group relative flex flex-col items-center rounded-xl border p-4 transition-all hover:scale-105',
              value === preset.value
                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            )}
          >
            <div
              className={cn(
                'mb-2 h-10 w-10 rounded-lg bg-gradient-to-br',
                preset.gradient
              )}
            />
            <span className="text-sm font-medium">
              {(t.styles as any)?.[preset.labelKey] || preset.labelKey}
            </span>
            <span className="mt-0.5 text-center text-[10px] text-muted-foreground leading-tight">
              {(t.styles as any)?.[preset.descKey] || preset.descKey}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
