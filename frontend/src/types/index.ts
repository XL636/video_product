export interface User {
  id: string
  email: string
  username: string
  credits: number
}

export interface Job {
  id: string
  job_type: 'img2vid' | 'txt2vid' | 'vid2anime' | 'story'
  provider: string
  status: 'queued' | 'submitted' | 'processing' | 'completed' | 'failed'
  prompt: string
  style_preset: string
  input_file_url?: string
  output_video_url?: string
  thumbnail_url?: string
  error_message?: string
  progress: number
  created_at: string
}

export interface Video {
  id: string
  title: string
  url: string
  thumbnail_url: string
  duration: number
  width: number
  height: number
  created_at: string
  job_type: string
}

export interface Character {
  id: string
  name: string
  description: string
  reference_image_url: string
}

export interface Story {
  id: string
  title: string
  description: string
  scenes: Scene[]
}

export interface Scene {
  id: string
  order_index: number
  prompt: string
  character_id?: string
  job_id?: string
  video_url?: string
  status: string
}

export type GenerationMode = 'fast' | 'coherent'

export type StylePreset = 'ghibli' | 'shonen' | 'seinen' | 'cyberpunk_anime' | 'chibi'

export interface ApiKeyConfig {
  provider: string
  is_configured: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface GenerationRequest {
  job_type: 'img2vid' | 'txt2vid' | 'vid2anime' | 'story'
  prompt: string
  style_preset: StylePreset
  provider: string
  duration?: number
  aspect_ratio?: string
  input_file_url?: string
  style_strength?: number
}

export interface WebSocketMessage {
  type: 'job_update' | 'job_completed' | 'job_failed' | 'progress'
  job_id: string
  status?: Job['status']
  progress?: number
  output_video_url?: string
  thumbnail_url?: string
  error_message?: string
}
