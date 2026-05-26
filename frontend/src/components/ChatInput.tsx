import React, { useRef, useState, useEffect } from 'react'
import { Send, Paperclip, X, StopCircle, Mic, MicOff, Zap, BookOpen, GitCompare } from 'lucide-react'
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

  if (guestLimitReached) {
    return (
      <div className="px-4 pb-4 pt-2"
        style={{ background: '#020207', borderTop: '1px solid rgba(225,29,72,0.08)' }}>
        <button
          onClick={onGuestLimitClick}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl transition-all active:scale-[0.99]"
          style={{ background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(225,29,72,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(225,29,72,0.2)')}
        >
          <span className="text-lg">🔒</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Misafir limiti doldu</p>
            <p className="text-xs" style={{ color: '#e11d48' }}>Sınırsız kullanım için giriş yap →</p>
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="px-3 sm:px-4 pb-4 pt-2 relative chat-input-wrapper"
      style={{ background: '#020207', borderTop: '1px solid rgba(225,29,72,0.08)' }}>

      {/* Compare mode banner */}
      {compareMode && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)' }}>
          <GitCompare size={12} style={{ color: '#e11d48' }} />
          <span className="text-xs" style={{ color: '#fda4af' }}>
            Karşılaştırma modu — mesajın iki modele aynı anda gönderilecek
          </span>
        </div>
      )}

      {/* Template library */}
      {showTemplates && (
        <div className="mb-3 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(6,4,12,0.97)', border: '1px solid rgba(225,29,72,0.15)' }}>
          {/* Category tabs */}
          <div className="flex border-b" style={{ borderColor: 'rgba(225,29,72,0.1)' }}>
            {TEMPLATE_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => setActiveCategory(i)}
                className="flex-1 py-2 text-xs font-medium transition-all"
                style={{
                  color: activeCategory === i ? '#fda4af' : '#4a4060',
                  background: activeCategory === i ? 'rgba(225,29,72,0.08)' : 'transparent',
                  borderBottom: activeCategory === i ? '2px solid #e11d48' : '2px solid transparent',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Items */}
          <div className="grid grid-cols-2 gap-1.5 p-2">
            {TEMPLATE_CATEGORIES[activeCategory].items.map((t, i) => (
              <button
                key={i}
                onClick={() => { setMessage(t.text); setShowTemplates(false); textareaRef.current?.focus() }}
                className="prompt-card text-left px-3 py-2 rounded-xl text-xs transition-all"
                style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.1)', color: '#94a3b8' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(225,29,72,0.35)'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(225,29,72,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File preview */}
      {file && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl w-fit max-w-full"
          style={{ background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.2)' }}>
          {/* Resim önizleme */}
          {file.type.startsWith('image/') ? (
            <img
              src={URL.createObjectURL(file)}
              alt="önizleme"
              className="w-8 h-8 rounded-lg object-cover shrink-0"
              style={{ border: '1px solid rgba(225,29,72,0.3)' }}
            />
          ) : (
            <Paperclip size={11} style={{ color: '#e11d48' }} className="shrink-0" />
          )}
          <span className="text-xs truncate max-w-[180px]" style={{ color: '#94a3b8' }}>{file.name}</span>
          <span className="text-xs" style={{ color: '#3a2030' }}>{formatSize(file.size)}</span>
          {file.type.startsWith('image/') && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(225,29,72,0.1)', color: '#fda4af', border: '1px solid rgba(225,29,72,0.2)' }}>
              👁 Vision
            </span>
          )}
          <button onClick={() => setFile(null)} className="ml-1 transition-colors"
            style={{ color: '#4a4060' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4a4060')}>
            <X size={11} />
          </button>
        </div>
      )}

      {/* Main input */}
      <div
        className="flex items-end gap-2 rounded-2xl px-3 py-2.5 transition-all relative"
        style={{
          background: 'rgba(8,6,14,0.95)',
          border: `1px solid ${focused ? 'rgba(225,29,72,0.4)' : 'rgba(225,29,72,0.12)'}`,
          boxShadow: focused
            ? '0 0 0 3px rgba(225,29,72,0.06), 0 8px 32px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.4)',
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        {/* Glow when focused */}
        {focused && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: 'inset 0 0 20px rgba(225,29,72,0.03)' }} />
        )}

        {/* Template toggle */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={isDisabled}
          className="shrink-0 p-1.5 rounded-lg transition-all mb-0.5"
          style={{
            color: showTemplates ? '#fda4af' : '#3a2030',
            background: showTemplates ? 'rgba(225,29,72,0.12)' : 'transparent',
          }}
          title="Şablon kütüphanesi"
        >
          <BookOpen size={16} />
        </button>

        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isDisabled}
          className="shrink-0 p-1.5 rounded-lg transition-all mb-0.5 disabled:opacity-40"
          style={{ color: '#3a2030' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fda4af')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3a2030')}
          title="Dosya yükle"
        >
          <Paperclip size={16} />
        </button>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES}
          onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); e.target.value = '' }}
          className="hidden" />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            compareMode
              ? 'İki modeli karşılaştır...'
              : isDisabled
              ? 'Sohbet seç veya yeni sohbet başlat...'
              : 'Kira\'ya bir şey sor... (Enter = gönder)'
          }
          disabled={isLoading || isDisabled}
          rows={1}
          className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed disabled:opacity-50 max-h-[200px] overflow-y-auto py-0.5"
          style={{ color: '#e2e8f0', caretColor: '#e11d48' }}
        />

        {/* Voice */}
        {speechSupported && (
          <button
            onClick={listening ? stopListening : startListening}
            disabled={isLoading || isDisabled}
            className="shrink-0 p-1.5 rounded-lg transition-all mb-0.5 disabled:opacity-40"
            style={{
              color: listening ? '#f87171' : '#3a2030',
              background: listening ? 'rgba(248,113,113,0.08)' : 'transparent',
            }}
            title={listening ? 'Durdur' : 'Sesli giriş'}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        {/* Send / Stop */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="shrink-0 p-2 rounded-xl text-white transition-all mb-0.5 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}
            title="Durdur"
          >
            <StopCircle size={16} />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0 p-2 rounded-xl text-white transition-all mb-0.5 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            style={canSend
              ? { background: 'linear-gradient(135deg, #e11d48, #f97316)', boxShadow: '0 4px 12px rgba(225,29,72,0.4)' }
              : { background: 'rgba(225,29,72,0.06)' }}
            title={compareMode ? 'Karşılaştır' : 'Gönder (Enter)'}
          >
            {compareMode ? <GitCompare size={16} /> : <Send size={16} />}
          </button>
        )}
      </div>

      <p className="text-center text-[10px] mt-2" style={{ color: '#1a1020' }}>
        Kira hata yapabilir · Dosya, görsel ve URL analizi desteklenir · Shift+Enter yeni satır
      </p>
    </div>
  )
}
