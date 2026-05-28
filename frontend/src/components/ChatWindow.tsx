import React, { useEffect, useRef } from 'react'
import { Conversation, Message, CompareResult } from '../types'
import MessageBubble from './MessageBubble'
import { Sparkles, Zap, Code2, Globe, Image, Brain, Search } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatWindowProps {
  conversation: Conversation | null
  streamingMessage: Message | null
  isStreaming: boolean
  onRegenerate?: () => void
  onPinMessage?: (id: string) => void
  onSuggestionClick?: (text: string) => void
  darkMode?: boolean
  compareMode?: boolean
  compareResult?: CompareResult | null
  isComparing?: boolean
}

const SUGGESTIONS = [
  { icon: '⚡', text: 'Python ile async web scraping yaz', category: 'Kod', color: '#f59e0b' },
  { icon: '🎨', text: 'Karanlık bir cyberpunk şehri çiz', category: 'Görsel', color: '#ec4899' },
  { icon: '🔍', text: 'Bugün dolar kaç, araştır', category: 'Arama', color: '#10b981' },
  { icon: '💬', text: 'Bugün nasılsın, ne konuşalım?', category: 'Sohbet', color: '#8b5cf6' },
]

const FEATURES = [
  { icon: <Zap size={11} />, text: 'Ultra Hızlı', color: '#f59e0b' },
  { icon: <Brain size={11} />, text: 'Akıllı Hafıza', color: '#8b5cf6' },
  { icon: <Code2 size={11} />, text: 'Kod Uzmanı', color: '#06b6d4' },
  { icon: <Image size={11} />, text: 'Görsel Üretim', color: '#ec4899' },
  { icon: <Search size={11} />, text: 'Web Araması', color: '#10b981' },
  { icon: <Globe size={11} />, text: 'URL Analizi', color: '#f97316' },
]

function ComparePanel({ result, isComparing }: { result: CompareResult | null; isComparing: boolean }) {
  if (!result && !isComparing) return null

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#04030a' }}>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {result && (
          <div className="mb-6 px-4 py-3 rounded-2xl text-sm text-center"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: '#94a3b8' }}>
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#4a3a6a' }}>Karşılaştırılan Soru</span>
            <p className="mt-1 text-white/80">{result.prompt}</p>
          </div>
        )}

        {isComparing && !result && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="flex gap-3 justify-center mb-4">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 rounded-full bounce-dot"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', animationDelay: `${d}ms` }} />
                ))}
              </div>
              <p className="text-sm" style={{ color: '#4a3a6a' }}>İki model yanıt üretiyor...</p>
            </div>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>A</div>
                <span className="text-xs font-mono" style={{ color: '#a78bfa' }}>{result.modelA}</span>
              </div>
              <div className="p-4">
                <div className="markdown-body text-sm" style={{ color: '#d1d5db' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.responseA}</ReactMarkdown>
                </div>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.2)' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'rgba(8,145,178,0.1)', borderBottom: '1px solid rgba(8,145,178,0.15)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #0891b2, #0e7490)' }}>B</div>
                <span className="text-xs font-mono" style={{ color: '#67e8f9' }}>{result.modelB}</span>
              </div>
              <div className="p-4">
                <div className="markdown-body text-sm" style={{ color: '#d1d5db' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.responseB}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatWindow({
  conversation, streamingMessage, isStreaming,
  onRegenerate, onPinMessage, onSuggestionClick,
  compareMode, compareResult, isComparing,
}: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages, streamingMessage, compareResult])

  if (compareMode) {
    return <ComparePanel result={compareResult || null} isComparing={isComparing || false} />
  }

  const allMessages = [...(conversation?.messages || [])]
  if (streamingMessage && streamingMessage.content.trim()) allMessages.push(streamingMessage)

  if (!conversation || allMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto relative" style={{ background: '#04030a' }}>
        {/* Background orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 65%)', filter: 'blur(80px)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }} />
        </div>

        <div className="relative text-center max-w-2xl px-6 py-10 z-10 w-full">
          {/* Logo */}
          <div className="relative w-20 h-20 mx-auto mb-6 float">
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
            <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1e1040, #0c2040)',
                border: '1px solid rgba(139,92,246,0.5)',
                boxShadow: '0 0 50px rgba(124,58,237,0.3), inset 0 1px 0 rgba(139,92,246,0.2)',
              }}>
              <Sparkles size={34} style={{ color: '#a78bfa' }} />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
            <span style={{
              background: 'linear-gradient(135deg, #e2e8f0 0%, #a78bfa 40%, #67e8f9 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Merhaba, ben Kira 👋
            </span>
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: '#475569' }}>
            Arkadaşın, asistanın, kod yazarın — ne istersen. Sor bakalım 🙂
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: `${f.color}12`,
                  border: `1px solid ${f.color}30`,
                  color: f.color,
                }}>
                {f.icon}<span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Suggestion cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="text-left px-4 py-3.5 rounded-2xl text-sm transition-all group relative overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(139,92,246,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onClick={() => onSuggestionClick?.(s.text)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#94a3b8' }}>
                      {s.text}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: s.color + '80' }}>{s.category}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-[10px] mt-7 tracking-wider" style={{ color: '#1e293b' }}>
            ENTER · GÖNDER &nbsp;|&nbsp; SHIFT+ENTER · YENİ SATIR &nbsp;|&nbsp; CTRL+K · YENİ SOHBET
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#04030a' }}>
      <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-1 px-1 sm:px-2">
        {allMessages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && idx === allMessages.length - 1 && msg.role === 'assistant'}
            onRegenerate={!isStreaming && idx === allMessages.length - 1 && msg.role === 'assistant' ? onRegenerate : undefined}
            onPin={onPinMessage}
          />
        ))}

        {/* Typing indicator */}
        {isStreaming && !streamingMessage?.content && (
          <div className="flex gap-3 px-4 py-3 mx-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #1e1040, #0c2040)',
                border: '1px solid rgba(139,92,246,0.4)',
                boxShadow: '0 0 12px rgba(124,58,237,0.2)',
              }}>
              <Sparkles size={14} style={{ color: '#a78bfa' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
              style={{ background: 'rgba(10,8,20,0.9)', border: '1px solid rgba(139,92,246,0.15)' }}>
              {[0, 150, 300].map(d => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bounce-dot"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} className="h-6" />
      </div>
    </div>
  )
}
