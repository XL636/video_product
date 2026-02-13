import { useState, useCallback } from 'react'
import api from '@/lib/api'

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
  url: string | null
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    url: null,
  })

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setState({ isUploading: true, progress: 0, error: null, url: null })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post<{ url: string }>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setState((prev) => ({ ...prev, progress: percentCompleted }))
        },
      })

      const url = response.data.url
      setState({ isUploading: false, progress: 100, error: null, url })
      return url
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Upload failed'
      setState({ isUploading: false, progress: 0, error: message, url: null })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null, url: null })
  }, [])

  return { ...state, upload, reset }
}
