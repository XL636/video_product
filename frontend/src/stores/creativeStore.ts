import { create } from 'zustand'
import type { ChatMessage, CreativeSessionStatus, Storyboard } from '@/types'

interface CreativeState {
  sessionId: string | null
  status: CreativeSessionStatus | null
  messages: ChatMessage[]
  storyboard: Storyboard | null
  storyId: string | null
  isLoading: boolean

  setSessionId: (id: string) => void
  setStatus: (status: CreativeSessionStatus) => void
  addMessage: (msg: ChatMessage) => void
  setMessages: (msgs: ChatMessage[]) => void
  setStoryboard: (sb: Storyboard | null) => void
  setStoryId: (id: string | null) => void
  setIsLoading: (v: boolean) => void
  reset: () => void
}

export const useCreativeStore = create<CreativeState>()((set) => ({
  sessionId: null,
  status: null,
  messages: [],
  storyboard: null,
  storyId: null,
  isLoading: false,

  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (status) => set({ status }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setMessages: (msgs) => set({ messages: msgs }),
  setStoryboard: (sb) => set({ storyboard: sb }),
  setStoryId: (id) => set({ storyId: id }),
  setIsLoading: (v) => set({ isLoading: v }),
  reset: () =>
    set({
      sessionId: null,
      status: null,
      messages: [],
      storyboard: null,
      storyId: null,
      isLoading: false,
    }),
}))
