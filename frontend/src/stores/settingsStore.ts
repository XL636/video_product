import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StylePreset } from '@/types'

interface SettingsState {
  defaultProvider: string
  defaultStylePreset: StylePreset
  defaultDuration: number
  defaultAspectRatio: string
  setDefaultProvider: (provider: string) => void
  setDefaultStylePreset: (preset: StylePreset) => void
  setDefaultDuration: (duration: number) => void
  setDefaultAspectRatio: (ratio: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultProvider: 'kling',
      defaultStylePreset: 'ghibli',
      defaultDuration: 5,
      defaultAspectRatio: '16:9',

      setDefaultProvider: (provider: string) => {
        set({ defaultProvider: provider })
      },

      setDefaultStylePreset: (preset: StylePreset) => {
        set({ defaultStylePreset: preset })
      },

      setDefaultDuration: (duration: number) => {
        set({ defaultDuration: duration })
      },

      setDefaultAspectRatio: (ratio: string) => {
        set({ defaultAspectRatio: ratio })
      },
    }),
    {
      name: 'settings-storage',
    }
  )
)
