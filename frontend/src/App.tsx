import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Conversation, Message, Model, KiraPersonality } from './types'
import { api, streamChat } from './api'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'
import ChatInput from './components/ChatInput'
import Header from './components/Header'
import LoginPage from './components/LoginPage'
import SearchModal from './components/SearchModal'
import ShortcutsModal from './components/ShortcutsModal'
import { auth, onAuthStateChanged, User } from './firebase'
import { useKeyboardShortcuts } from './hooks/useKeyboard'

// Misafir için mesaj limiti
const GUEST_MESSAGE_LIMIT = 999

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const [showGuestLimitModal, setShowGuestLimitModal] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile')
  const [temperature, setTemperature] = useState(0.7)
  const [personality, setPersonality] = useState<KiraPersonality>('default')

  const [showSearch, setShowSearch] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Model compare
  const [compareMode, setCompareMode] = useState(false)
  const [compareModelA, setCompareModelA] = useState('llama-3.3-70b-versatile')
  const [compareModelB, setCompareModelB] = useState('llama-3.1-8b-instant')
  const [compareResult, setCompareResult] = useState<import('./types').CompareResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  const abortRef = useRef<boolean>(false)
  const lastUserMessageRef = useRef<{ message: string; file: File | null } | null>(null)
  const isGuestRef = useRef(isGuest)
  useEffect(() => { isGuestRef.current = isGuest }, [isGuest])

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false) })
    return unsub
  }, [])

  // Backend'i uyandır — Railway ücretsiz planda uyku moduna geçiyor
  useEffect(() => {
    const wakeUp = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || ''
        if (base) {
          await fetch(base + '/api/health', { method: 'GET' })
        }
      } catch { /* sessizce geç */ }
    }
    wakeUp()
  }, [])

  // Guest limit: localStorage'dan yükle
  useEffect(() => {
    if (isGuest) {
      const saved = parseInt(localStorage.getItem('guest_msg_count') || '0', 10)
      setGuestMessageCount(saved)
    }
  }, [isGuest])

  useEffect(() => {
    if (user || isGuest) { loadConversations(); loadModels() }
    else { setConversations([]); setActiveConvId(null); setActiveConv(null) }
  }, [user, isGuest])

  useEffect(() => {
    if (activeConvId && (user || isGuest)) loadConversation(activeConvId)
    else setActiveConv(null)
  }, [activeConvId, user, isGuest])

  useEffect(() => {
    if (activeConv && isGuest) {
      setConversations(prev => prev.map(c => c.id === activeConv.id ? activeConv : c))
    }
  }, [activeConv?.id, isGuest]) // sadece id değişince sync et, sonsuz döngü önle

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, description: 'Yeni sohbet', action: () => (user || isGuest) && handleCreateConversation() },
    { key: 'f', ctrl: true, description: 'Ara', action: () => setShowSearch(true) },
    { key: '/', ctrl: true, description: 'Kısayollar', action: () => setShowShortcuts(true) },
    { key: 'Escape', description: 'Kapat', action: () => { setShowSearch(false); setShowShortcuts(false) } },
  ])

  const uid = () => user?.uid || 'guest'

  const loadConversations = async () => {
    // Guests have no DB history, skip
    if (isGuest) return
    try { setConversations(await api.getConversations(uid())) } catch { }
  }

  const loadConversation = async (id: string) => {
    // Guests: state is already up to date, skip DB reload
    if (isGuest) {
      setConversations(prev => {
        const conv = prev.find(c => c.id === id)
        if (conv) setActiveConv(conv)
        return prev
      })
      return
    }
    try { setActiveConv(await api.getConversation(id, uid())) } catch { }
  }

  const loadModels = async () => {
    try { setModels(await api.getModels()) } catch {
      setModels([
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
        { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick' },
        { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (Vision)' },
        { id: 'moonshotai/kimi-k2-instruct-0905', name: 'Kimi K2' },
        { id: 'qwen/qwen3-32b', name: 'Qwen3 32B' },
        { id: 'qwen-qwq-32b', name: 'QwQ 32B (Reasoning)' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B' },
        { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Qwen 32B' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Hızlı)' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
      ])
    }
  }

  const handleCreateConversation = async () => {
    if (isGuest) {
      // Guest için local konuşma oluştur
      const conv: Conversation = {
        id: uuidv4(),
        title: 'Yeni Sohbet',
        messages: [],
        tags: [],
        is_pinned: false,
        is_shared: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setConversations(prev => [conv, ...prev])
      setActiveConvId(conv.id)
      setActiveConv(conv)
      return
    }
    try {
      const conv = await api.createConversation(uid())
      setConversations(prev => [conv, ...prev])
      setActiveConvId(conv.id)
      setActiveConv(conv)
    } catch { }
  }

  const handleDeleteConversation = async (id: string) => {
    if (isGuest) {
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConvId === id) { setActiveConvId(null); setActiveConv(null) }
      return
    }
    try {
      await api.deleteConversation(id, uid())
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConvId === id) setActiveConvId(null)
    } catch { }
  }

  const handleRenameConversation = async (id: string, title: string) => {
    if (isGuest) {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
      if (activeConv?.id === id) setActiveConv(prev => prev ? { ...prev, title } : null)
      return
    }
    try {
      await api.updateConversation(id, uid(), { title })
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title } : c))
      if (activeConv?.id === id) setActiveConv(prev => prev ? { ...prev, title } : null)
    } catch { }
  }

  const handlePinConversation = async (id: string, pinned: boolean) => {
    if (isGuest) {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, is_pinned: pinned } : c))
      return
    }
    try {
      await api.updateConversation(id, uid(), { is_pinned: pinned })
      setConversations(prev => prev.map(c => c.id === id ? { ...c, is_pinned: pinned } : c))
    } catch { }
  }

  const handleTagConversation = async (id: string, tags: string[]) => {
    if (isGuest) {
      setConversations(prev => prev.map(c => c.id === id ? { ...c, tags } : c))
      return
    }
    try {
      await api.updateConversation(id, uid(), { tags })
      setConversations(prev => prev.map(c => c.id === id ? { ...c, tags } : c))
    } catch { }
  }

  const handleClearChat = async () => {
    if (!activeConvId || !activeConv) return
    if (!confirm('Bu sohbetin tüm mesajları silinecek. Emin misin?')) return
    if (isGuest) {
      const cleared = { ...activeConv, messages: [], updated_at: new Date().toISOString() }
      setActiveConv(cleared)
      setConversations(prev => prev.map(c => c.id === activeConvId ? cleared : c))
      return
    }
    try {
      await api.deleteConversation(activeConvId, uid())
      const newConv = await api.createConversation(uid(), activeConv.title)
      setConversations(prev => prev.map(c => c.id === activeConvId ? newConv : c))
      setActiveConvId(newConv.id)
    } catch { }
  }

  const handleExport = () => {
    if (!activeConv) return
    const lines = activeConv.messages.map(m =>
      `[${m.role === 'user' ? 'Sen' : 'AI'}] ${new Date(m.timestamp).toLocaleString('tr-TR')}\n${m.content}\n`
    )
    const content = `Sohbet: ${activeConv.title}\nKullanıcı: ${user?.displayName || 'Anonim'}\nTarih: ${new Date().toLocaleString('tr-TR')}\n\n` + lines.join('\n---\n\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `sohbet-${activeConv.title.slice(0, 30)}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleShare = async () => {
    if (!activeConvId) return
    try {
      const { share_id } = await api.shareConversation(activeConvId, uid())
      const url = `${window.location.origin}/shared/${share_id}`
      await navigator.clipboard.writeText(url)
      alert(`Paylaşım linki kopyalandı:\n${url}`)
    } catch { }
  }

  const handlePinMessage = async (msgId: string) => {
    try {
      await api.pinMessage(msgId, uid())
      if (activeConvId) await loadConversation(activeConvId)
    } catch { }
  }

  // Auto-generate title after first message
  const autoGenerateTitle = async (convId: string, firstMessage: string) => {
    try {
      const { title } = await api.generateTitle(firstMessage)
      if (title) {
        await handleRenameConversation(convId, title)
      }
    } catch { }
  }

  // Model compare handler
  const handleCompare = async (prompt: string) => {
    setIsComparing(true)
    setCompareResult(null)
    try {
      const result = await api.compareModels(prompt, compareModelA, compareModelB)
      setCompareResult({
        modelA: compareModelA,
        modelB: compareModelB,
        responseA: result.responseA,
        responseB: result.responseB,
        prompt,
      })
    } catch (err) {
      console.error('Compare failed:', err)
    } finally {
      setIsComparing(false)
    }
  }

  const sendMessage = useCallback(async (message: string, file: File | null, convId: string) => {
    if (isStreaming) return
    
    abortRef.current = false
    setIsStreaming(true)
    setStreamingMessage({ id: uuidv4(), role: 'assistant', content: '', timestamp: new Date().toISOString(), is_pinned: false })
    lastUserMessageRef.current = { message, file }

    // Add user message to UI immediately
    const userMsg: Message = {
      id: uuidv4(), role: 'user', content: message,
      timestamp: new Date().toISOString(), file_name: file?.name,
      is_pinned: false,
    }

    setActiveConv(prev => prev ? { ...prev, messages: [...prev.messages, userMsg] } : null)

    let fullContent = ''

    const handleDone = async () => {
      if (abortRef.current) return
      const currentIsGuest = isGuestRef.current

      // Image Generation Logic
      // LLM bazen boşuklu bazen boşuksuz yazar, her ikisini de yakala
      const imageMatch = fullContent.match(/\[IMAGE_GEN:\s*([\s\S]+?)\]/)
      if (imageMatch) {
        const rawPrompt = imageMatch[1].trim()
        // Prompt içinde yanlışlıkla Türkçe yorum varsa temizle (satır sonu sonrası)
        const prompt = rawPrompt.split('\n')[0].trim()

        // Tagı ve etrafındaki boşlukları temizle, kalan metni al
        const cleanContent = fullContent
          .replace(/\[IMAGE_GEN:\s*[\s\S]+?\]/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim()

        setStreamingMessage(prev => prev ? {
          ...prev, content: (cleanContent ? cleanContent + '\n\n' : '') + '🎨 Görsel oluşturuluyor... (10-30 sn sürebilir)'
        } : null)

        try {
          const { image_url } = await api.generateImage(prompt)
          const finalContent = (cleanContent ? cleanContent + '\n\n' : '') + `[GENERATED_IMAGE:${image_url}|${prompt}]`
          
          const assistantMsg: Message = {
            id: uuidv4(), role: 'assistant', content: finalContent, image_url,
            timestamp: new Date().toISOString(), is_pinned: false
          }

          setStreamingMessage(null)
          setIsStreaming(false)
          setActiveConv(prev => {
            if (!prev) return null
            const updated = { ...prev, messages: [...prev.messages, assistantMsg], updated_at: new Date().toISOString() }
            if (currentIsGuest) {
              setConversations(convs => convs.map(c => c.id === updated.id ? updated : c))
            }
            return updated
          })
        } catch (err) {
          console.error("Image generation failed:", err)
          setIsStreaming(false)
          setStreamingMessage(null)
          setActiveConv(prev => prev ? {
            ...prev, messages: [...prev.messages, {
              id: uuidv4(), role: 'assistant',
              content: '❌ Görsel oluşturulamadı. Lütfen tekrar deneyin.',
              timestamp: new Date().toISOString(), is_pinned: false
            }]
          } : null)
        }
        if (!currentIsGuest) await loadConversations()
        return
      }

      // Normal Message Completion
      const assistantMsg: Message = {
        id: uuidv4(), role: 'assistant', content: fullContent,
        timestamp: new Date().toISOString(), is_pinned: false
      }

      setStreamingMessage(null)
      setIsStreaming(false)

      setActiveConv(prev => {
        if (!prev) return null
        const updated = { ...prev, messages: [...prev.messages, assistantMsg], updated_at: new Date().toISOString() }
        if (currentIsGuest) {
          setConversations(convs => convs.map(c => c.id === updated.id ? updated : c))
        }
        return updated
      })

      if (!currentIsGuest) {
        await loadConversation(convId)
        await loadConversations()
      }
    }

    await streamChat(
      convId, message, file,
      (token) => {
        if (abortRef.current) return
        fullContent += token
        
        let displayContent = fullContent
        
        // Stream sırasında [IMAGE_GEN:...] tagını gizle, yerine animasyonlu yazı koy
        if (displayContent.includes('[IMAGE_GEN:')) {
          // Tagdan önceki temiz metni al
          const beforeTag = displayContent.replace(/\[IMAGE_GEN:[\s\S]*$/, '').trim()
          displayContent = (beforeTag ? beforeTag + '\n\n' : '') + '🎨 Görsel oluşturuluyor...'
        }
        
        setStreamingMessage(prev => prev ? { ...prev, content: displayContent } : null)
      },
      handleDone,
      (err) => {
        console.error("Stream error:", err)
        setStreamingMessage(null)
        setIsStreaming(false)
        setActiveConv(prev => prev ? {
          ...prev, messages: [...prev.messages, {
            id: uuidv4(), role: 'assistant', content: `❌ Bağlantı hatası: ${err}`,
            timestamp: new Date().toISOString(), is_pinned: false
          }]
        } : null)
      },
      selectedModel, temperature, uid(),
      // Sadece giriş yapan kullanıcılara kişilik özelliği
      !isGuest ? personality : undefined
    )
  }, [selectedModel, temperature, user, isStreaming, loadConversation, loadConversations, uid])

  const handleSend = useCallback(async (message: string, file: File | null) => {
    if (!activeConvId || isStreaming) return

    // Misafir mesaj limiti kontrolü
    if (isGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT) {
      setShowGuestLimitModal(true)
      return
    }

    // Misafir sayacını artır
    if (isGuest) {
      const newCount = guestMessageCount + 1
      setGuestMessageCount(newCount)
      localStorage.setItem('guest_msg_count', String(newCount))
    }

    // Auto-generate title for first message
    const conv = conversations.find(c => c.id === activeConvId)
    if (conv && conv.messages.length === 0 && conv.title === 'Yeni Sohbet') {
      autoGenerateTitle(activeConvId, message)
    }

    await sendMessage(message, file, activeConvId)
  }, [activeConvId, isStreaming, sendMessage, isGuest, guestMessageCount])

  const handleRegenerate = useCallback(async () => {
    if (!activeConvId || isStreaming || !lastUserMessageRef.current) return
    setActiveConv(prev => {
      if (!prev) return null
      const msgs = [...prev.messages]
      if (msgs[msgs.length - 1]?.role === 'assistant') msgs.pop()
      return { ...prev, messages: msgs }
    })
    await sendMessage(lastUserMessageRef.current.message, lastUserMessageRef.current.file, activeConvId)
  }, [activeConvId, isStreaming, sendMessage])

  const handleStop = () => { abortRef.current = true; setIsStreaming(false); setStreamingMessage(null) }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#04030a' }}>
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />
      <div className="text-center relative z-10">
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-70"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1e1040, #0c2040)', border: '1px solid rgba(139,92,246,0.4)' }}>
            <div className="w-8 h-8 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7c3aed' }} />
          </div>
        </div>
        <p className="text-sm tracking-widest uppercase" style={{ color: '#3a2030' }}>Yükleniyor...</p>
      </div>
    </div>
  )

  if (!user && !isGuest) return <LoginPage onGuestLogin={() => setIsGuest(true)} />

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#04030a' }}>
      {/* Animated ambient lights */}
      <div className="ambient-orb-1" />
      <div className="ambient-orb-2" />
      <div className="ambient-orb-3" />
      
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar

        conversations={conversations}
        activeId={activeConvId}
        onSelect={(id) => { setActiveConvId(id); setIsMobileSidebarOpen(false); }}
        onCreate={handleCreateConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        onPin={handlePinConversation}
        onTag={handleTagConversation}
        onSearch={() => setShowSearch(true)}
        user={user}
        isGuest={isGuest}
        darkMode={darkMode}
        guestMessageCount={guestMessageCount}
        guestMessageLimit={GUEST_MESSAGE_LIMIT}
        onGuestLimitClick={() => setShowGuestLimitModal(true)}
      />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          title={activeConv?.title || 'Kira AI'}
          models={models}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          conversation={activeConv}
          onClearChat={handleClearChat}
          onExport={handleExport}
          onShare={handleShare}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(!darkMode)}
          onShowShortcuts={() => setShowShortcuts(true)}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          compareMode={compareMode}
          onToggleCompare={() => { setCompareMode(!compareMode); setCompareResult(null) }}
          compareModelA={compareModelA}
          compareModelB={compareModelB}
          onCompareModelAChange={setCompareModelA}
          onCompareModelBChange={setCompareModelB}
          personality={personality}
          onPersonalityChange={setPersonality}
          isGuest={isGuest}
        />

        <ChatWindow
          conversation={activeConv}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          onRegenerate={handleRegenerate}
          onPinMessage={handlePinMessage}
          onSuggestionClick={(text) => handleSend(text, null)}
          darkMode={darkMode}
          compareMode={compareMode}
          compareResult={compareResult}
          isComparing={isComparing}
        />

        <ChatInput
          onSend={handleSend}
          isLoading={isStreaming || isComparing}
          onStop={handleStop}
          disabled={!activeConvId && !compareMode}
          guestLimitReached={isGuest && guestMessageCount >= GUEST_MESSAGE_LIMIT}
          onGuestLimitClick={() => setShowGuestLimitModal(true)}
          compareMode={compareMode}
          onCompare={handleCompare}
        />
      </div>

      {showSearch && (
        <SearchModal
          userId={uid()}
          onClose={() => setShowSearch(false)}
          onSelectConversation={(id) => { setActiveConvId(id); setShowSearch(false) }}
        />
      )}

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Misafir Limit Modal */}
      {showGuestLimitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative rounded-3xl p-8 max-w-sm w-full mx-4 text-center"
            style={{
              background: 'rgba(13,13,25,0.98)',
              border: '1px solid rgba(99,102,241,0.3)',
              boxShadow: '0 0 60px rgba(99,102,241,0.15), 0 40px 80px rgba(0,0,0,0.6)'
            }}>
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
              style={{ boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Misafir Limiti Doldu</h3>
            <p className="text-[#94a3b8] text-sm mb-1">
              Misafir olarak <span className="text-indigo-400 font-semibold">{GUEST_MESSAGE_LIMIT} mesaj</span> hakkın bitti.
            </p>
            <p className="text-[#6b7280] text-xs mb-6">
              Sınırsız kullanım için ücretsiz hesap oluştur.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setIsGuest(false); setShowGuestLimitModal(false) }}
                className="w-full py-3 px-6 rounded-2xl text-white font-semibold text-sm transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
                Giriş Yap / Kayıt Ol
              </button>
              <button
                onClick={() => setShowGuestLimitModal(false)}
                className="w-full py-2.5 px-6 rounded-2xl text-sm transition-all"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', color: '#6b7280' }}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
