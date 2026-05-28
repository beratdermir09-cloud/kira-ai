import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Send, Paperclip, X, StopCircle, Mic, MicOff, BookOpen, GitCompare } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeech'

interface ChatInputProps {
  onSend: (message: string, file: File | null) => void
  isLoading: boolean
  onStop?: () => void
  disabled?: boolean
  guestLimitReached?: boolean
  onGuestLimitClick?: () => void
  compareMode?: boolean
  onCompare?: (prompt: string) => void
}

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx,.doc,.csv,.json,.py,.js,.ts,.html,.css,.xml,.jpg,.jpeg,.png,.gif,.webp'

const TEMPLATE_CATEGORIES = [
  {
    label: 'Yazı',
    items: [
      { label: '📝 Özetle', text: 'Aşağıdaki metni kısaca özetle:\n\n' },
      { label: '✅ Düzelt', text: 'Bu metindeki hataları düzelt:\n\n' },
      { label: '🌍 Çevir', text: 'Şunu Türkçeye çevir:\n\n' },
      { label: '✍️ Yeniden yaz', text: 'Bu metni daha profesyonel bir dille yeniden yaz:\n\n' },
    ],
  },
  {
    label: 'Kod',
    items: [
      { label: '💻 Kod yaz', text: 'Şu işlevi yapan kod yaz:\n\n' },
      { label: '🐛 Hata bul', text: 'Bu koddaki hataları bul ve düzelt:\n\n' },
      { label: '📖 Açıkla', text: 'Bu kodu satır satır açıkla:\n\n' },
      { label: '⚡ Optimize et', text: 'Bu kodu optimize et ve performansını artır:\n\n' },
    ],
  },
  {
    label: 'Yaratıcı',
    items: [
      { label: '🖼️ Görsel', text: 'Şunu çiz: ' },
      { label: '📖 Hikaye', text: 'Şu konuda kısa bir hikaye yaz:\n\n' },
      { label: '💡 Fikir', text: 'Şu konu hakkında 5 yaratıcı fikir ver:\n\n' },
      { label: '🎭 Senaryo', text: 'Şu sahne için diyalog yaz:\n\n' },
    ],
  },
  {
    label: 'Analiz',
    items: [
      { label: '🔍 Açıkla', text: 'Şunu detaylıca açıkla:\n\n' },
      { label: '📊 Analiz et', text: 'Şunu analiz et ve değerlendir:\n\n' },
      { label: '⚖️ Karşılaştır', text: 'Şunları karşılaştır:\n\n' },
      { label: '📋 Plan yap', text: 'Şu proje için adım adım plan oluştur:\n\n' },
    ],
  },
]

export default function ChatInput({
  onSend, isLoading, onStop, disabled, guestLimitReached, onGuestLimitClick,
  compareMode, onCompare,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { listening, start: startListening, stop: stopListening, supported: speechSupported } =
    useSpeechRecognition((text) => setMessage(prev => prev + (prev ? ' ' : '') + text))

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 200) + 'px' }
  }, [message])

  const handleSend = () => {
    if ((!message.trim() && !file) || isLoading || disabled) return
    if (compareMode && onCompare && message.trim()) {
      onCompare(message.trim())
      setMessage('')
      return
    }
    onSend(message.trim(), file)
    setMessage(''); setFile(null); setShowTemplates(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const formatSize = (b: number) =>
    b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB'

  const isDisabled = disabled || guestLimitReached
  const canSend = (message.trim() || file) && !isDisabled

  const handleGlobalPaste = useCallback((e: ClipboardEvent) => {
    if (isDisabled || isLoading) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        if (blob) {
          const ext = item.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
          const pastedFile = new File([blob], `ekran-goruntusu-${Date.now()}.${ext}`, { type: item.type })
          setFile(pastedFile)
          setTimeout(() => textareaRef.current?.focus(), 50)
        }
        break
      }
    }
  }, [isDisabled, isLoading])

  useEffect(() => {
    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [handleGlobalPaste])

  if (guestLimitReached) {
    return (
      <div className="px-4 pb-4 pt-2"
        style={{ background: '#04030a', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <button
          onClick={onGuestLimitClick}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all active:scale-[0.99]"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)')}
        >
          <span className="text-lg">🔒</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Misafir limiti doldu</p>
            <p className="text-xs" style={{ color: '#a78bfa' }}>Sınırsız kullanım için giriş yap →</p>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-4 pb-4 pt-2 relative chat-input-wrapper"
      style={{ background: '#04030a', borderTop: '1px solid rgba(139,92,246,0.1)' }}>

      {/* Compare mode banner */}
      {compareMode && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <GitCompare size={12} style={{ color: '#7c3aed' }} />
          <span className="text-xs" style={{ color: '#a78bfa' }}>
            Karşılaştırma modu — mesajın iki modele aynı anda gönderilecek
          </span>
        </div>
      )}

      {/* Template library */}
      {showTemplates && (
        <div className="mb-3 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(8,6,18,0.97)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="flex border-b" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
            {TEMPLATE_CATEGORIES.map((cat, i) => (
              <button key={i} onClick={() => setActiveCategory(i)}
                className="flex-1 py-2 text-xs font-medium transition-all"
                style={{
                  color: activeCategory === i ? '#a78bfa' : '#4a3a6a',
                  background: activeCategory === i ? 'rgba(124,58,237,0.08)' : 'transparent',
                  borderBottom: activeCategory === i ? '2px solid #7c3aed' : '2px solid transparent',
                }}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {TEMPLATE_CATEGORIES[activeCategory].items.map((t, i) => (
              <button key={i}
                onClick={() => { setMessage(t.text); setShowTemplates(false); textareaRef.current?.focus() }}
                className="prompt-card text-left px-3 py-2 rounded-xl text-xs transition-all"
                style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)', color: '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.1)'; e.currentTarget.style.color = '#94a3b8' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="mb-2">
          {file.type.startsWith('image/') ? (
            <div className="relative inline-block">
              <img
                src={URL.createObjectURL(file)}
                alt="önizleme"
                className="rounded-2xl object-cover"
                style={{
                  maxWidth: '180px', maxHeight: '180px', minWidth: '80px', minHeight: '80px',
                  border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', display: 'block',
                }}
              />
              <button onClick={() => setFile(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                style={{ background: 'rgba(10,8,20,0.95)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', boxShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(10,8,20,0.95)')}>
                <X size={12} />
              </button>
              <div className="absolute bottom-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded-md font-mono"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                👁 Vision
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl w-fit max-w-full"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <span className="text-sm shrink-0">
                {file.name.endsWith('.pdf') ? '📄' : file.name.match(/\.(docx?|doc)$/i) ? '📝' :
                 file.name.match(/\.(xlsx?|xls)$/i) ? '📊' : file.name.match(/\.(csv)$/i) ? '📊' :
                 file.name.match(/\.(json)$/i) ? '🔧' :
                 file.name.match(/\.(py|js|ts|jsx|tsx|java|c|cpp|cs|go|rs|php|rb|sh)$/i) ? '💻' : '📎'}
              </span>
              <div className="min-w-0">
                <span className="text-xs truncate max-w-[200px] block" style={{ color: '#e2e8f0' }}>{file.name}</span>
                <span className="text-[10px]" style={{ color: '#4a3a6a' }}>{formatSize(file.size)} · Analiz için hazır</span>
              </div>
              <button onClick={() => setFile(null)} className="ml-1 shrink-0 transition-colors"
                style={{ color: '#4a3a6a' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a3a6a')}>
                <X size={11} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main input */}
      <div
        className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all relative"
        style={{
          background: 'rgba(10,8,20,0.95)',
          border: `1px solid ${focused ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.15)'}`,
          boxShadow: focused
            ? '0 0 0 3px rgba(124,58,237,0.08), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.4)',
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        {focused && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: 'inset 0 0 20px rgba(124,58,237,0.04)' }} />
        )}

        <button onClick={() => setShowTemplates(!showTemplates)} disabled={isDisabled}
          className="shrink-0 p-1.5 rounded-lg transition-all mb-0.5"
          style={{ color: showTemplates ? '#a78bfa' : '#2d1f4a', background: showTemplates ? 'rgba(124,58,237,0.12)' : 'transparent' }}
          title="Şablon kütüphanesi">
          <BookOpen size={16} />
        </button>

        <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || isDisabled}
          className="shrink-0 p-1.5 rounded-lg transition-all mb-0.5 disabled:opacity-40"
          style={{ color: '#2d1f4a' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={e => (e.currentTarget.style.color = '#2d1f4a')}
          title="Dosya yükle">
          <Paperclip size={16} />
        </button>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES}
          onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = '' }}
          className="hidden" />

        <textarea
          ref={textareaRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            compareMode ? 'İki modeli karşılaştır...'
            : isDisabled ? 'Sohbet seç veya yeni sohbet başlat...'
            : file?.type.startsWith('image/') ? 'Görsel hakkında ne sormak istiyorsun?'
            : file ? `"${file.name}" hakkında ne sormak istiyorsun?`
            : 'Kira\'ya bir şey sor...'
          }
          disabled={isLoading || isDisabled}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed disabled:opacity-50 max-h-[200px] overflow-y-auto py-0.5"
          style={{ color: '#e2e8f0', caretColor: '#7c3aed' }}
        />

        {speechSupported && (
          <button onClick={listening ? stopListening : startListening} disabled={isLoading || isDisabled}
            className="shrink-0 p-1.5 rounded-lg transition-all mb-0.5 disabled:opacity-40"
            style={{ color: listening ? '#f87171' : '#2d1f4a', background: listening ? 'rgba(248,113,113,0.08)' : 'transparent' }}
            title={listening ? 'Durdur' : 'Sesli giriş'}>
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        {isLoading ? (
          <button onClick={onStop}
            className="shrink-0 p-2 rounded-xl text-white transition-all mb-0.5 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}
            title="Durdur">
            <StopCircle size={16} />
          </button>
        ) : (
          <button onClick={handleSend} disabled={!canSend}
            className="shrink-0 p-2 rounded-xl text-white transition-all mb-0.5 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={canSend
              ? { background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 4px 12px rgba(124,58,237,0.4)' }
              : { background: 'rgba(139,92,246,0.06)' }}
            title={compareMode ? 'Karşılaştır' : 'Gönder (Enter)'}>
            {compareMode ? <GitCompare size={16} /> : <Send size={16} />}
          </button>
        )}
      </div>

      <p className="text-center text-[10px] mt-2" style={{ color: '#1e293b' }}>
        Kira hata yapabilir · Dosya, görsel ve URL analizi desteklenir · Shift+Enter yeni satır
      </p>
    </div>
  )
}
