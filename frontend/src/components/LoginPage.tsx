import React, { useState } from 'react'
import { signInWithGoogle } from '../firebase'
import { Sparkles, Zap, Code2, Brain, Image, Globe, ArrowRight, MessageSquare, Shield, Cpu } from 'lucide-react'

interface LoginPageProps {
  onGuestLogin?: () => void
}

const FEATURES = [
  { icon: <Zap size={18} />, color: '#f59e0b', label: 'Ultra Hızlı', desc: 'Groq altyapısı ile anlık yanıt' },
  { icon: <Brain size={18} />, color: '#8b5cf6', label: 'Akıllı Hafıza', desc: 'Seni tanır, hatırlar' },
  { icon: <Code2 size={18} />, color: '#06b6d4', label: 'Kod Uzmanı', desc: '50+ programlama dili' },
  { icon: <Image size={18} />, color: '#ec4899', label: 'Görsel Üretim', desc: 'Flux AI ile görsel oluştur' },
  { icon: <Globe size={18} />, color: '#10b981', label: 'Web Araması', desc: 'Güncel bilgiye erişim' },
  { icon: <Shield size={18} />, color: '#f97316', label: 'Güvenli', desc: 'Şifreli & özel sohbet' },
]

const CHAT_PREVIEWS = [
  { role: 'user', text: 'Python ile async bir web scraper yazar mısın?' },
  { role: 'ai', text: 'Tabii! asyncio ve httpx kullanarak hızlı bir scraper yazalım...' },
  { role: 'user', text: 'Bugün dolar kaç?' },
  { role: 'ai', text: 'Araştırdım — güncel kur bilgisini getiriyorum 🔍' },
]

export default function LoginPage({ onGuestLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAuthModal, setShowAuthModal] = useState<'login' | 'register' | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden relative" style={{ background: '#04030a' }}>

      {/* ── ARKA PLAN ── */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div className="absolute top-[10%] right-[-15%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[800px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        {/* Noise vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, transparent 50%, rgba(4,3,10,0.6) 100%)' }} />
      </div>

      {/* ── NAVİGASYON ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 sm:px-10 py-5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-xl blur-md opacity-80"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }} />
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1e1040, #0c2040)', border: '1px solid rgba(139,92,246,0.5)' }}>
              <Sparkles size={16} style={{ color: '#a78bfa' }} />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{
            background: 'linear-gradient(135deg, #a78bfa, #67e8f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Kira AI
          </span>
        </div>

        {/* Nav butonları */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuthModal('login')}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#a78bfa',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.15)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.08)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)' }}
          >
            Oturum Aç
          </button>
          <button
            onClick={() => setShowAuthModal('register')}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 28px rgba(124,58,237,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.35)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Ücretsiz Kaydol
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 text-center px-6 pt-16 pb-20 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa',
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Yapay Zeka Asistanı — Ücretsiz & Sınırsız
        </div>

        {/* Başlık */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          <span style={{
            background: 'linear-gradient(135deg, #e2e8f0 0%, #a78bfa 40%, #67e8f9 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Merhaba,
          </span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #f472b6 0%, #a78bfa 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            ben Kira 👋
          </span>
        </h1>

        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#64748b' }}>
          Arkadaşın, asistanın, kod yazarın — ne istersen.
          <br />
          <span style={{ color: '#475569' }}>Soru sor, kod yaz, görsel üret, araştır.</span>
        </p>

        {/* CTA butonları */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={() => setShowAuthModal('register')}
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.55)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.4)' }}
          >
            <Sparkles size={18} />
            Ücretsiz Başla
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onGuestLogin}
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <MessageSquare size={16} />
            Misafir olarak dene
          </button>
        </div>

        {/* Chat önizleme kartı */}
        <div className="relative max-w-lg mx-auto mb-20">
          <div className="absolute inset-0 rounded-3xl blur-xl opacity-30"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
          <div className="relative rounded-3xl p-5 text-left space-y-3"
            style={{
              background: 'rgba(10,8,20,0.9)',
              border: '1px solid rgba(139,92,246,0.2)',
              backdropFilter: 'blur(20px)',
            }}>
            {/* Pencere başlığı */}
            <div className="flex items-center gap-2 pb-3 mb-1" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ef4444' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
              </div>
              <span className="text-[10px] font-mono ml-2" style={{ color: '#334155' }}>kira-ai · sohbet</span>
            </div>
            {CHAT_PREVIEWS.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
                    <Sparkles size={10} className="text-white" />
                  </div>
                )}
                <div className="max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }
                  }>
                  {msg.text}
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            <div className="flex gap-2.5 justify-start">
              <div className="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }}>
                <Sparkles size={10} className="text-white" />
              </div>
              <div className="px-3 py-2.5 rounded-2xl flex items-center gap-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#7c3aed', animation: `bounce 1s ${d}ms infinite` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Özellikler grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${f.color}15`, color: f.color }}>
                {f.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80">{f.label}</p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: '#475569' }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alt not */}
        <p className="text-[11px] mt-10" style={{ color: '#1e293b' }}>
          Ücretsiz · Kayıt gerektirmez · Sohbet geçmişi için giriş yap
        </p>
      </section>

      {/* ── AUTH MODAL ── */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShowAuthModal(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl p-8"
            style={{
              background: 'rgba(8,6,18,0.98)',
              border: '1px solid rgba(139,92,246,0.25)',
              boxShadow: '0 0 80px rgba(124,58,237,0.15), 0 40px 80px rgba(0,0,0,0.8)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.7), transparent)' }} />

            {/* Logo */}
            <div className="text-center mb-7">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="absolute inset-0 rounded-2xl blur-lg opacity-70"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1e1040, #0c2040)', border: '1px solid rgba(139,92,246,0.4)' }}>
                  <Sparkles size={22} style={{ color: '#a78bfa' }} />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                {showAuthModal === 'login' ? 'Tekrar hoş geldin 👋' : 'Kira\'ya katıl ✨'}
              </h2>
              <p className="text-xs" style={{ color: '#475569' }}>
                {showAuthModal === 'login'
                  ? 'Hesabınla giriş yap, sohbetlerin seni bekliyor'
                  : 'Ücretsiz hesap oluştur, hemen başla'}
              </p>
            </div>

            {/* Google butonu */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 mb-4"
              style={{
                background: 'white',
                color: '#1e293b',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading ? 'Bağlanıyor...' : 'Google ile ' + (showAuthModal === 'login' ? 'Giriş Yap' : 'Kaydol')}
            </button>

            {error && (
              <p className="text-red-400 text-xs text-center mb-3">{error}</p>
            )}

            {/* Geçiş linki */}
            <p className="text-center text-xs" style={{ color: '#334155' }}>
              {showAuthModal === 'login' ? (
                <>Hesabın yok mu?{' '}
                  <button onClick={() => setShowAuthModal('register')} className="font-semibold transition-colors"
                    style={{ color: '#a78bfa' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}>
                    Ücretsiz kaydol
                  </button>
                </>
              ) : (
                <>Zaten hesabın var mı?{' '}
                  <button onClick={() => setShowAuthModal('login')} className="font-semibold transition-colors"
                    style={{ color: '#a78bfa' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c4b5fd')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#a78bfa')}>
                    Giriş yap
                  </button>
                </>
              )}
            </p>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.1)' }} />
              <span className="text-[10px] tracking-widest uppercase" style={{ color: '#1e293b' }}>veya</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.1)' }} />
            </div>

            <button
              onClick={() => { setShowAuthModal(null); onGuestLogin?.() }}
              className="w-full py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              Misafir olarak devam et
            </button>

            <p className="text-[10px] text-center mt-3" style={{ color: '#1e293b' }}>
              Misafir modunda sohbet geçmişi kaydedilmez
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
