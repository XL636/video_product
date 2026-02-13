import { cn } from '@/lib/utils'
import type { StylePreset } from '@/types'
import { Label } from '@/components/ui/label'

interface StylePresetSelectorProps {
  value: StylePreset
  onChange: (preset: StylePreset) => void
}

const presets: { value: StylePreset; label: string; description: string; gradient: string }[] = [
  {
    value: 'ghibli',
    label: 'Ghibli',
    description: 'Soft, painterly watercolor style',
    gradient: 'from-emerald-500 to-sky-400',
  },
  {
    value: 'shonen',
    label: 'Shonen',
    description: 'Bold, dynamic action style',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    value: 'seinen',
    label: 'Seinen',
    description: 'Mature, detailed realistic style',
    gradient: 'from-slate-400 to-slate-600',
  },
  {
    value: 'cyberpunk_anime',
    label: 'Cyberpunk',
    description: 'Neon-lit futuristic aesthetic',
    gradient: 'from-violet-500 to-cyan-400',
  },
  {
    value: 'chibi',
    label: 'Chibi',
    description: 'Cute, super-deformed style',
    gradient: 'from-pink-400 to-rose-400',
  },
]

export function StylePresetSelector({ value, onChange }: StylePresetSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Style Preset</Label>
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
            <span className="text-sm font-medium">{preset.label}</span>
            <span className="mt-0.5 text-center text-[10px] text-muted-foreground leading-tight">
              {preset.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
