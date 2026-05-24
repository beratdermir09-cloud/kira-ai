import React, { useEffect, useRef } from 'react'
import { Conversation, Message, CompareResult } from '../types'
import MessageBubble from './MessageBubble'
import { Bot, Zap, FileText, Code2, Sparkles, Brain, Image, Globe } from 'lucide-react'
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
  { icon: '⚡', text: 'Python ile async web scraping yaz', category: 'Kod' },
  { icon: '🎨', text: 'Karanlık bir cyberpunk şehri çiz', category: 'Görsel' },
  { icon: '🧠', text: 'Kuantum bilgisayarları nasıl çalışır?', category: 'Öğren' },
  { icon: '💬', text: 'Bugün nasılsın, ne konuşalım?', category: 'Sohbet' },
]

const FEATURES = [
  { icon: <Zap size={12} className="text-yellow-400" />, text: 'Ultra Hızlı' },
  { icon: <Brain size={12} style={{ color: '#e11d48' }} />, text: 'Sınırsız AI' },
  { icon: <Code2 size={12} className="text-orange-400" />, text: 'Kod Uzmanı' },
  { icon: <FileText size={12} className="text-green-400" />, text: 'Dosya Analizi' },
  { icon: <Image size={12} className="text-pink-400" />, text: 'Görsel Üretim' },
  { icon: <Globe size={12} className="text-cyan-400" />, text: 'URL Analizi' },
]

function FloatingOrb({ style }: { style: React.CSSProperties }) {
  return (
    <div className="absolute rounded-full pointer-events-none"
      style={{ filter: 'blur(60px)', ...style }} />
  )
}

function ComparePanel({ result, isComparing }: { result: CompareResult | null; isComparing: boolean }) {
  if (!result && !isComparing) return null

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#020207' }}>
      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Prompt */}
        {result && (
          <div className="mb-6 px-4 py-3 rounded-2xl text-sm text-center"
            style={{ background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.15)', color: '#94a3b8' }}>
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#3a2030' }}>Karşılaştırılan Soru</span>
            <p className="mt-1 text-white/80">{result.prompt}</p>
          </div>
        )}

        {isComparing && !result && (
          <div className="flex items-center justify-center py-20 gap-4">
            <div className="text-center">
              <div className="flex gap-3 justify-center mb-4">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-2 h-2 rounded-full bounce-dot"
                    style={{ background: 'linear-gradient(135deg, #e11d48, #f97316)', animationDelay: `${d}ms` }} />
                ))}
              </div>
              <p className="text-sm" style={{ color: '#4a4060' }}>İki model yanıt üretiyor...</p>
            </div>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model A */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.2)' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'rgba(225,29,72,0.08)', borderBottom: '1px solid rgba(225,29,72,0.15)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #e11d48, #f97316)' }}>A</div>
                <span className="text-xs font-mono" style={{ color: '#fda4af' }}>{result.modelA}</span>
              </div>
              <div className="p-4">
                <div className="markdown-body text-sm" style={{ color: '#d1d5db' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.responseA}</ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Model B */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <div className="flex items-center gap-2 px-4 py-3"
                style={{ background: 'rgba(249,115,22,0.08)', borderBottom: '1px solid rgba(249,115,22,0.15)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #f97316, #eab308)' }}>B</div>
                <span className="text-xs font-mono" style={{ color: '#fb923c' }}>{result.modelB}</span>
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

  // Compare mode
  if (compareMode) {
    return <ComparePanel result={compareResult || null} isComparing={isComparing || false} />
  }

  const allMessages = [...(conversation?.messages || [])]
  if (streamingMessage && streamingMessage.content.trim()) allMessages.push(streamingMessage)

  if (!conversation || allMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto relative" style={{ background: '#020207' }}>
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <FloatingOrb style={{ top: '10%', left: '5%', width: 500, height: 500, background: 'rgba(225,29,72,0.06)' }} />
          <FloatingOrb style={{ bottom: '10%', right: '5%', width: 500, height: 500, background: 'rgba(249,115,22,0.05)' }} />
          <FloatingOrb style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, background: 'rgba(192,38,211,0.04)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(225,29,72,1) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,1) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }} />
          {/* Vignette */}
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(2,2,7,0.75) 100%)' }} />
        </div>

        <div className="relative text-center max-w-2xl px-6 py-10 z-10 w-full">
          {/* Logo */}
          <div className="relative w-24 h-24 mx-auto mb-7 float">
            <div className="absolute inset-0 rounded-3xl blur-2xl opacity-60"
              style={{ background: 'linear-gradient(135deg, #e11d48, #f97316)' }} />
            <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1a0810, #2a0c10)',
                border: '1px solid rgba(225,29,72,0.4)',
                boxShadow: '0 0 60px rgba(225,29,72,0.25), inset 0 1px 0 rgba(225,29,72,0.2)',
              }}>
              <Bot size={42} style={{ color: '#fda4af' }} />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight flicker">
            <span className="gradient-text">Merhaba, ben Kira 👋</span>
          </h2>
          <p className="text-sm leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: '#3a2030' }}>
            Arkadaşın, asistanın, kod yazarın — ne istersen. Sor bakalım 🙂
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.1)', color: '#4a4060' }}>
                {f.icon}<span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Suggestion cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="text-left px-4 py-3.5 rounded-2xl text-sm transition-all group relative overflow-hidden glitch"
                style={{ background: 'rgba(225,29,72,0.03)', border: '1px solid rgba(225,29,72,0.1)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(225,29,72,0.07)'
                  e.currentTarget.style.borderColor = 'rgba(225,29,72,0.3)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(225,29,72,0.08)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(225,29,72,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(225,29,72,0.1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onClick={() => onSuggestionClick?.(s.text)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <div className="flex items-center gap-3">
                  <span className="text-lg w-9 h-9 flex items-center justify-center rounded-xl shrink-0 group-hover:scale-110 transition-transform"
                    style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.15)' }}>
                    {s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium group-hover:text-white transition-colors truncate" style={{ color: '#94a3b8' }}>
                      {s.text}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#2a1820' }}>{s.category}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="text-[10px] mt-7 tracking-wider" style={{ color: '#1a1020' }}>
            ENTER · GÖNDER &nbsp;|&nbsp; SHIFT+ENTER · YENİ SATIR &nbsp;|&nbsp; CTRL+K · YENİ SOHBET
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#020207' }}>
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
              style={{ background: 'linear-gradient(135deg, #1a0810, #2a0c10)', border: '1px solid rgba(225,29,72,0.3)', boxShadow: '0 0 12px rgba(225,29,72,0.15)' }}>
              <Bot size={14} style={{ color: '#fda4af' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
              style={{ background: 'rgba(8,6,14,0.95)', border: '1px solid rgba(225,29,72,0.1)' }}>
              {[0, 150, 300].map(d => (
                <div key={d} className="w-1.5 h-1.5 rounded-full bounce-dot"
                  style={{ background: 'linear-gradient(135deg, #e11d48, #f97316)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} className="h-6" />
      </div>
    </div>
  )
}
