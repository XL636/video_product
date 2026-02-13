import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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
  label = 'Prompt',
  placeholder = 'Describe your anime scene in detail...',
  rows = 4,
}: PromptEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {value.length} characters
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-none bg-slate-900/50 focus:ring-primary"
      />
    </div>
  )
}
