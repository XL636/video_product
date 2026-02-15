import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileVideo, Image } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/hooks/useLanguage'

interface FileDropZoneProps {
  accept: 'image' | 'video'
  onFileSelect: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number
  className?: string
}

export function FileDropZone({
  accept,
  onFileSelect,
  isUploading = false,
  uploadProgress = 0,
  className,
}: FileDropZoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const { t } = useLanguage()

  const acceptConfig: Record<string, string[]> =
    accept === 'image'
      ? { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }
      : { 'video/*': ['.mp4', '.webm', '.mov'] }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setFileName(file.name)
      if (accept === 'image') {
        const url = URL.createObjectURL(file)
        setPreview(url)
      } else {
        setPreview(null)
      }
      onFileSelect(file)
    },
    [accept, onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptConfig,
    maxFiles: 1,
    disabled: isUploading,
  })

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
  }

  const FileIcon = accept === 'image' ? Image : FileVideo

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 transition-colors cursor-pointer',
        isDragActive && 'border-primary bg-primary/5',
        isUploading && 'pointer-events-none opacity-70',
        className
      )}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative w-full">
          <img
            src={preview}
            alt="Preview"
            className="mx-auto max-h-48 rounded-lg object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-slate-800"
            onClick={clearFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : fileName ? (
        <div className="flex items-center gap-3">
          <FileIcon className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {accept === 'video' ? t.fileUpload?.videoSelected : t.fileUpload?.imageSelected}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">
            {isDragActive
              ? t.fileUpload?.dropHere
              : accept === 'image'
                ? t.fileUpload?.dragImage
                : t.fileUpload?.dragVideo}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.fileUpload?.clickToBrowse}
          </p>
        </>
      )}

      {isUploading && (
        <div className="mt-4 w-full">
          <Progress value={uploadProgress} className="h-1.5" />
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {t.fileUpload?.uploading} {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  )
}
