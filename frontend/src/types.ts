export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  file_name?: string
  is_pinned?: boolean
  model_used?: string
  conversation_id?: string
  image_url?: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  tags: string[]
  is_pinned: boolean
  is_shared: boolean
  share_id?: string
  model?: string
  folder?: string
  created_at: string
  updated_at: string
  user_id?: string
}

export interface Model {
  id: string
  name: string
  description?: string
  speed?: 'fast' | 'medium' | 'slow'
}

export interface SearchResult {
  message: Message
  conversation_title: string
}

export interface PromptTemplate {
  id: string
  label: string
  icon: string
  text: string
  category: string
}

export interface CompareResult {
  modelA: string
  modelB: string
  responseA: string
  responseB: string
  prompt: string
}
