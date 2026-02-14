import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/hooks/useLanguage'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  rows?: number
}

export function PromptEditor({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
}: PromptEditorProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label || t.promptEditor?.defaultLabel}</Label>
        <span className="text-xs text-muted-foreground">
          {value.length} {t.promptEditor?.characters}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t.promptEditor?.defaultPlaceholder}
        rows={rows}
        className="resize-none bg-slate-900/50 focus:ring-primary"
      />
    </div>
  )
}
