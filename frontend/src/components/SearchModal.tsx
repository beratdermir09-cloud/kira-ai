import React, { useState, useEffect, useRef } from 'react'
import { Search, X, MessageSquare, ArrowRight } from 'lucide-react'
import { api } from '../api'
import { SearchResult } from '../types'

interface SearchModalProps {
  userId: string
  onClose: () => void
  onSelectConversation: (convId: string) => void
}

export default function SearchModal({ userId, onClose, onSelectConversation }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.searchMessages(userId, query)
        setResults(data)
      } catch { }
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [query, userId])

  const highlight = (text: string, q: string) => {
    if (!q) return text
    const idx = text.toLowerCase().indexOf(q.toLowerCase())
    if (idx === -1) return text.slice(0, 100)
    const start = Math.max(0, idx - 40)
    const end = Math.min(text.length, idx + q.length + 60)
    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl w-full max-w-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a3e]">
          <Search size={18} className="text-[#6b7280] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Mesajlarda ara..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#4a4a6a]"
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          {loading && <div className="w-4 h-4 border border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />}
          <button onClick={onClose} className="text-[#6b7280] hover:text-white"><X size={16} /></button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query && !loading && (
            <p className="text-center text-[#4a4a6a] text-sm py-8">Sonuç bulunamadı</p>
          )}
          {results.length === 0 && !query && (
            <p className="text-center text-[#4a4a6a] text-sm py-8">Aramak istediğiniz metni yazın</p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onSelectConversation(r.message.conversation_id || ''); onClose() }}
              className="w-full text-left px-4 py-3 hover:bg-[#2a2a3e] transition-colors border-b border-[#2a2a3e]/50 last:border-0"
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare size={12} className="text-indigo-400 shrink-0" />
                <span className="text-indigo-400 text-xs font-medium truncate">{r.conversation_title}</span>
                <span className="text-[#4a4a6a] text-xs ml-auto">{r.message.role === 'user' ? 'Sen' : 'AI'}</span>
              </div>
              <p className="text-[#94a3b8] text-xs leading-relaxed">
                {highlight(r.message.content, query)}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#2a2a3e] flex items-center gap-4 text-xs text-[#4a4a6a]">
          <span>↑↓ Gezin</span>
          <span>Enter Seç</span>
          <span>Esc Kapat</span>
        </div>
      </div>
    </div>
  )
}
