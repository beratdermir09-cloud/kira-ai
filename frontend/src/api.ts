import axios from 'axios'
import { Conversation, Model, SearchResult } from './types'

// URL belirleme mantığı:
// 1. VITE_API_URL env variable varsa onu kullan (production/Vercel)
// 2. localhost'ta ise localhost:8000
// 3. Başka bir IP'den açılıyorsa (telefon/LAN) o IP:8000
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8000'
  }
  return `http://${host}:8000`
}

const BASE = getBaseUrl() + '/api'
const h = (userId: string) => ({ 'x-user-id': userId })

export const api = {
  getConversations: (userId: string) =>
    axios.get<Conversation[]>(`${BASE}/conversations/`, { headers: h(userId) }).then(r => r.data),

  getConversation: (id: string, userId: string) =>
    axios.get<Conversation>(`${BASE}/conversations/${id}`, { headers: h(userId) }).then(r => r.data),

  createConversation: (userId: string, title?: string) =>
    axios.post<Conversation>(`${BASE}/conversations/`, { title: title || 'Yeni Sohbet' }, { headers: h(userId) }).then(r => r.data),

  updateConversation: (id: string, userId: string, data: { title?: string; tags?: string[]; is_pinned?: boolean }) =>
    axios.patch<Conversation>(`${BASE}/conversations/${id}`, data, { headers: h(userId) }).then(r => r.data),

  deleteConversation: (id: string, userId: string) =>
    axios.delete(`${BASE}/conversations/${id}`, { headers: h(userId) }).then(r => r.data),

  shareConversation: (id: string, userId: string) =>
    axios.post<{ share_id: string; share_url: string }>(`${BASE}/conversations/${id}/share`, {}, { headers: h(userId) }).then(r => r.data),

  getSharedConversation: (shareId: string) =>
    axios.get<Conversation>(`${BASE}/conversations/shared/${shareId}`).then(r => r.data),

  searchMessages: (userId: string, query: string) =>
    axios.get<SearchResult[]>(`${BASE}/conversations/search`, { params: { q: query }, headers: h(userId) }).then(r => r.data),

  pinMessage: (msgId: string, userId: string) =>
    axios.post(`${BASE}/chat/messages/${msgId}/pin`, {}, { headers: h(userId) }).then(r => r.data),

  getModels: () =>
    axios.get<{ models: Model[] }>(`${BASE}/models`).then(r => r.data.models),

  generateImage: (prompt: string, width = 1024, height = 1024) =>
    axios.post<{ image_url: string; prompt: string }>(
      `${BASE}/chat/generate-image`,
      { prompt, width, height },
      { timeout: 130000 }  // 130 sn — backend 120 sn bekliyor
    ).then(r => r.data),

  generateTitle: (message: string) =>
    axios.post<{ title: string }>(`${BASE}/chat/generate-title`, { message }).then(r => r.data),

  compareModels: (prompt: string, modelA: string, modelB: string) =>
    axios.post<{ responseA: string; responseB: string }>(`${BASE}/chat/compare`, { prompt, model_a: modelA, model_b: modelB }).then(r => r.data),
}

export async function streamChat(
  conversationId: string,
  message: string,
  file: File | null,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
  model?: string,
  temperature?: number,
  userId?: string,
) {
  const formData = new FormData()
  formData.append('conversation_id', conversationId)
  formData.append('message', message)
  if (file) formData.append('file', file)
  if (model) formData.append('model', model)
  if (temperature !== undefined) formData.append('temperature', temperature.toString())

  let doneCalled = false

  try {
    const response = await fetch(`${BASE}/chat/stream`, {
      method: 'POST',
      headers: userId ? { 'x-user-id': userId } : {},
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 429) {
        onError('Rate limit aşıldı. Otomatik model değiştirme deneniyor...')
      } else {
        onError(`Sunucu hatası: ${response.status}`)
      }
      return
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.token) {
              onToken(data.token)
            } else if (data.done && !doneCalled) {
              doneCalled = true
              onDone()
            } else if (data.error) {
              onError(data.error)
            }
          } catch { }
        }
      }
    }

    if (!doneCalled) {
      doneCalled = true
      onDone()
    }
  } catch (err: any) {
    onError(err.message || 'Bağlantı hatası')
  }
}
