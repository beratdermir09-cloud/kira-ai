import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Copy, Check, Bot, User, Paperclip, ThumbsUp, ThumbsDown,
  RotateCcw, Pin, Volume2, VolumeX, Download, Share2, Sparkles,
} from 'lucide-react'
import { Message } from '../types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useTextToSpeech } from '../hooks/useSpeech'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  onRegenerate?: () => void
  onPin?: (id: string) => void
  compareLabel?: 'A' | 'B'
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-xs"
      style={{
        background: copied ? 'rgba(74,222,128,0.1)' : 'rgba(225,29,72,0.08)',
        border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(225,29,72,0.2)'}`,
        color: copied ? '#4ade80' : '#94a3b8',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
    </button>
  )
}

function GeneratedImage({ url, prompt }: { url: string; prompt?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Base64 mi yoksa normal URL mi?
  const isBase64 = url.startsWith('data:')

  return (
    <div className="flex flex-col gap-2 my-3" style={{ maxWidth: 'min(400px, calc(100vw - 80px))' }}>
      {/* Image card */}
      <div
        className="relative rounded-2xl overflow-hidden group/img"
        style={{
          width: '100%',
          minHeight: loaded ? 'auto' : '260px',
          background: 'rgba(6,4,12,0.95)',
          border: '1px solid rgba(225,29,72,0.25)',
          boxShadow: '0 12px 50px rgba(0,0,0,0.7), 0 0 30px rgba(225,29,72,0.08)',
        }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-5 h-5 border-t border-l rounded-tl-2xl z-10 pointer-events-none"
          style={{ borderColor: 'rgba(225,29,72,0.5)' }} />
        <div className="absolute top-0 right-0 w-5 h-5 border-t border-r rounded-tr-2xl z-10 pointer-events-none"
          style={{ borderColor: 'rgba(225,29,72,0.5)' }} />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b border-l rounded-bl-2xl z-10 pointer-events-none"
          style={{ borderColor: 'rgba(225,29,72,0.5)' }} />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b border-r rounded-br-2xl z-10 pointer-events-none"
          style={{ borderColor: 'rgba(225,29,72,0.5)' }} />

        {/* Loading */}
        {!loaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 image-skeleton">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(225,29,72,0.15)', borderTopColor: '#e11d48' }} />
              <div className="absolute inset-2 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(249,115,22,0.15)', borderTopColor: '#f97316', animationDirection: 'reverse', animationDuration: '0.8s' }} />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium typing-pulse" style={{ color: '#fda4af' }}>Görsel yükleniyor</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#3a2030' }}>Flux AI</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)' }}>
              <span className="text-2xl">🖼️</span>
            </div>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Görsel yüklenemedi</p>
          </div>
        )}

        {/* Image */}
        <img
          src={url}
          alt={prompt || 'AI Görseli'}
          className="w-full object-cover transition-transform duration-500 group-hover/img:scale-[1.02]"
          style={{ display: loaded ? 'block' : 'none', borderRadius: '14px' }}
          onLoad={() => { setLoaded(true); setError(false) }}
          onError={() => setError(true)}
        />

        {/* Prompt overlay — hover'da göster */}
        {loaded && prompt && (
          <div className="absolute bottom-0 left-0 right-0 px-3 py-3 opacity-0 group-hover/img:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', borderRadius: '0 0 14px 14px' }}>
            <p className="text-xs text-white/80 font-medium line-clamp-2">{prompt}</p>
          </div>
        )}
      </div>

      {/* Alt butonlar — HER ZAMAN görünür */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* İndir — base64 ise çalışır, URL ise yeni sekmede açar */}
        <a
          href={url}
          download={`kira-gorsel-${Date.now()}.jpg`}
          target={isBase64 ? undefined : '_blank'}
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{
            background: 'rgba(225,29,72,0.08)',
            border: '1px solid rgba(225,29,72,0.25)',
            color: '#fda4af',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.18)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(225,29,72,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <Download size={11} />
          <span>İndir</span>
        </a>

        {/* Kopyala — base64 ise kopyala, URL ise linki kopyala */}
        <button
          onClick={async () => {
            try {
              if (isBase64) {
                // Base64'ü blob'a çevir ve panoya kopyala
                const res = await fetch(url)
                const blob = await res.blob()
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
                alert('Görsel panoya kopyalandı!')
              } else {
                await navigator.clipboard.writeText(url)
                alert('Görsel linki kopyalandı!')
              }
            } catch {
              // Clipboard API desteklenmiyorsa linki kopyala
              if (!isBase64) {
                await navigator.clipboard.writeText(url).catch(() => {})
                alert('Link kopyalandı!')
              }
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
          style={{
            background: 'rgba(225,29,72,0.04)',
            border: '1px solid rgba(225,29,72,0.15)',
            color: '#6b7280',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.12)'; e.currentTarget.style.color = '#fda4af' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(225,29,72,0.04)'; e.currentTarget.style.color = '#6b7280' }}
        >
          <Share2 size={11} />
          <span>{isBase64 ? 'Kopyala' : 'Linki kopyala'}</span>
        </button>
      </div>
    </div>
  )
}

function parseContent(content: string): { text: string; images: { url: string; prompt?: string }[] } {
  const images: { url: string; prompt?: string }[] = []
  const text = content
    .replace(/\[GENERATED_IMAGE:([^\]|]+)(?:\|([^\]]*))?\]/g, (_, url, prompt) => {
      images.push({ url: url.trim(), prompt: prompt?.trim() })
      return ''
    })
    .trim()
  return { text, images }
}

export default function MessageBubble({ message, isStreaming, onRegenerate, onPin, compareLabel }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [liked, setLiked] = useState<null | 'up' | 'down'>(null)
  const { speaking, speak, stop } = useTextToSpeech()

  const handleSpeak = () => {
    if (speaking) stop()
    else speak(message.content.replace(/[#*`\[\]]/g, ''))
  }

  const { text: parsedText, images } = parseContent(message.content)
  const allImages = [...images]
  if (message.image_url && !allImages.find(i => i.url === message.image_url)) {
    allImages.push({ url: message.image_url })
  }

  return (
    <div className={`message-enter group flex gap-2 sm:gap-3 px-2 sm:px-3 py-2 mx-0.5 sm:mx-1 rounded-2xl transition-all ${isUser ? 'flex-row-reverse' : ''}`}
      style={{ background: 'transparent' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(225,29,72,0.015)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5 relative">
        {isUser ? (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 3px 12px rgba(124,58,237,0.4)',
            }}>
            <User size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, #1a0810, #2a0c10)',
              border: '1px solid rgba(225,29,72,0.4)',
              boxShadow: '0 3px 12px rgba(225,29,72,0.25), inset 0 1px 0 rgba(225,29,72,0.15)',
            }}>
            <Bot size={14} style={{ color: '#fda4af' }} />
            {/* Pulse ring */}
            {isStreaming && (
              <div className="absolute inset-0 rounded-xl animate-ping opacity-30"
                style={{ border: '1px solid #e11d48' }} />
            )}
          </div>
        )}
        {compareLabel && (
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: compareLabel === 'A' ? '#e11d48' : '#f97316' }}>
            {compareLabel}
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-1.5 min-w-0 ${isUser ? 'items-end max-w-[85%] sm:max-w-[80%]' : 'items-start max-w-[92%] sm:max-w-[88%]'}`}>
        {/* Header */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-semibold"
            style={{ color: isUser ? '#a78bfa' : '#fda4af' }}>
            {isUser ? 'Sen' : compareLabel ? `Model ${compareLabel}` : 'Kira'}
          </span>
          <span className="text-[10px]" style={{ color: '#1a1020' }}>
            {format(new Date(message.timestamp), 'HH:mm', { locale: tr })}
          </span>
          {message.model_used && !isUser && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(225,29,72,0.08)', color: '#e11d48', border: '1px solid rgba(225,29,72,0.18)' }}>
              {message.model_used.split('-')[0]}
            </span>
          )}
          {message.is_pinned && <Pin size={10} className="text-yellow-400" />}
        </div>

        {/* File badge */}
        {message.file_name && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
            style={{ background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)', color: '#94a3b8' }}>
            <Paperclip size={10} />
            <span>{message.file_name}</span>
          </div>
        )}

        {/* Images */}
        {!isStreaming && allImages.map((img, i) => (
          <GeneratedImage key={i} url={img.url} prompt={img.prompt} />
        ))}

        {/* Text bubble */}
        {(parsedText || isStreaming) && (
          isUser ? (
            /* ── User bubble ── */
            <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                boxShadow: '0 4px 20px rgba(79,70,229,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}>
              {/* Shine */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }} />
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : (
            /* ── AI bubble ── */
            <div className="relative rounded-2xl rounded-tl-sm text-sm overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(16,8,24,0.7) 0%, rgba(8,4,12,0.7) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(225,29,72,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(225,29,72,0.15)',
              }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #e11d48, #f97316, transparent)' }} />

              {/* Left accent bar */}
              <div className="absolute left-0 top-3 bottom-3 w-px"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(225,29,72,0.4), transparent)' }} />

              {/* AI label */}
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                <Sparkles size={10} style={{ color: '#e11d48' }} />
                <span className="text-[10px] font-mono tracking-wider" style={{ color: '#3a2030' }}>
                  KIRA
                </span>
                {isStreaming && (
                  <span className="text-[10px] font-mono tracking-wider animate-pulse" style={{ color: '#e11d48' }}>
                    ● yazıyor
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="px-4 pb-3">
                <div className={`markdown-body text-[#d1d5db] ${isStreaming ? 'typing-cursor' : ''}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const isBlock = !props.inline && match
                        return isBlock ? (
                          <div className="relative my-3 rounded-xl overflow-hidden"
                            style={{ border: '1px solid rgba(225,29,72,0.18)' }}>
                            {/* Code header */}
                            <div className="flex items-center justify-between px-4 py-2"
                              style={{ background: 'rgba(4,2,8,0.98)', borderBottom: '1px solid rgba(225,29,72,0.12)' }}>
                              <div className="flex items-center gap-2.5">
                                <div className="flex gap-1.5">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.7)' }} />
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.7)' }} />
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.7)' }} />
                                </div>
                                <span className="text-xs font-mono font-medium" style={{ color: '#e11d48' }}>
                                  {match[1]}
                                </span>
                              </div>
                              <CopyButton text={String(children).replace(/\n$/, '')} />
                            </div>
                            <SyntaxHighlighter
                              style={oneDark} language={match[1]} PreTag="div"
                              customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.78rem', background: '#020108', padding: '1rem', lineHeight: '1.6' }}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className={className} {...props}>{children}</code>
                        )
                      },
                    }}
                  >
                    {parsedText || message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Bottom glow */}
              <div className="absolute bottom-0 left-0 right-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.15), transparent)' }} />
            </div>
          )
        )}

        {/* Action bar */}
        {!isStreaming && message.content && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 px-1">
            <ActionBtn onClick={() => setLiked(liked === 'up' ? null : 'up')} active={liked === 'up'} activeColor="#4ade80" title="Beğen">
              <ThumbsUp size={11} />
            </ActionBtn>
            <ActionBtn onClick={() => setLiked(liked === 'down' ? null : 'down')} active={liked === 'down'} activeColor="#f87171" title="Beğenme">
              <ThumbsDown size={11} />
            </ActionBtn>
            {!isUser && (
              <ActionBtn onClick={() => navigator.clipboard.writeText(parsedText || message.content)} title="Kopyala">
                <Copy size={11} />
              </ActionBtn>
            )}
            {!isUser && (
              <ActionBtn onClick={handleSpeak} active={speaking} activeColor="#fda4af" title={speaking ? 'Durdur' : 'Sesli oku'}>
                {speaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
              </ActionBtn>
            )}
            {onRegenerate && (
              <ActionBtn onClick={onRegenerate} title="Yeniden oluştur">
                <RotateCcw size={11} />
              </ActionBtn>
            )}
            {onPin && (
              <ActionBtn onClick={() => onPin(message.id)} active={message.is_pinned} activeColor="#facc15" title="Sabitle">
                <Pin size={11} />
              </ActionBtn>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBtn({
  children, onClick, active, activeColor = '#94a3b8', title,
}: {
  children: React.ReactNode; onClick: () => void
  active?: boolean; activeColor?: string; title?: string
}) {
  return (
    <button
      onClick={onClick} title={title}
      className="p-1.5 rounded-lg transition-all"
      style={{ color: active ? activeColor : '#2a1820' }}
      onMouseEnter={e => { e.currentTarget.style.color = activeColor; e.currentTarget.style.background = 'rgba(225,29,72,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.color = active ? activeColor : '#2a1820'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}
