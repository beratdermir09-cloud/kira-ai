import React, { useState, useEffect } from 'react'
import { signInWithGoogle } from '../firebase'
import { Bot, Zap, Code2, Brain, UserX, Eye, Cpu, Globe } from 'lucide-react'

interface LoginPageProps {
  onGuestLogin?: () => void
}

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute w-px rounded-full pointer-events-none"
      style={{
        background: 'linear-gradient(to top, transparent, rgba(225,29,72,0.8), transparent)',
        height: `${Math.random() * 60 + 20}px`,
        animation: `drift ${Math.random() * 8 + 6}s linear infinite`,
        animationDelay: `${Math.random() * 8}s`,
        ...style,
      }}
    />
  )
}

export default function LoginPage({ onGuestLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
    }))
  )

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch {
      setError('Giriş yapılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 overflow-hidden relative"
      style={{ background: '#030308' }}
    >
      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <Particle key={p.id} style={{ left: p.left, animationDelay: p.delay }} />
        ))}
      </div>

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }} />
        {/* Grid */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(225,29,72,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,0.04) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(3,3,8,0.8) 100%)' }} />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Card */}
        <div
          className="relative rounded-3xl p-8 overflow-hidden"
          style={{
            background: 'rgba(8, 6, 14, 0.92)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(225,29,72,0.2)',
            boxShadow: '0 0 80px rgba(225,29,72,0.08), 0 40px 80px rgba(0,0,0,0.7)',
          }}
        >
          {/* Top glow line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.6), transparent)' }} />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l rounded-tl-3xl"
            style={{ borderColor: 'rgba(225,29,72,0.4)' }} />
          <div className="absolute top-0 right-0 w-8 h-8 border-t border-r rounded-tr-3xl"
            style={{ borderColor: 'rgba(225,29,72,0.4)' }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l rounded-bl-3xl"
            style={{ borderColor: 'rgba(225,29,72,0.4)' }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r rounded-br-3xl"
            style={{ borderColor: 'rgba(225,29,72,0.4)' }} />

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-5 float">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-70"
                style={{ background: 'linear-gradient(135deg, #e11d48, #f97316)' }} />
              <div
                className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #e11d48, #f97316)',
                  boxShadow: '0 0 40px rgba(225,29,72,0.5)',
                }}
              >
                <Bot size={36} className="text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-1 flicker">
              <span className="gradient-text">Kira AI</span>
            </h1>
            <p className="text-xs tracking-[0.3em] uppercase" style={{ color: '#4a4060' }}>
              Neural Interface v3.0
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2 mb-7">
            {[
              { icon: <Zap size={14} className="text-yellow-400" />, text: 'Ultra Hızlı Groq', sub: 'Llama 3.3 70B' },
              { icon: <Brain size={14} className="text-red-400" />, text: 'Sınırsız AI', sub: 'Kısıtlamasız' },
              { icon: <Code2 size={14} className="text-orange-400" />, text: 'Kod Uzmanı', sub: '50+ Dil' },
              { icon: <Eye size={14} className="text-pink-400" />, text: 'Görsel Üretim', sub: 'Flux AI' },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{
                  background: 'rgba(225,29,72,0.04)',
                  border: '1px solid rgba(225,29,72,0.1)',
                }}
              >
                <div className="shrink-0">{f.icon}</div>
                <div>
                  <p className="text-xs font-medium text-white/80">{f.text}</p>
                  <p className="text-[10px]" style={{ color: '#4a4060' }}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3.5 px-6 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mb-3"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
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
            {loading ? 'Bağlanıyor...' : 'Google ile Giriş Yap'}
          </button>

          {error && (
            <p className="text-red-400 text-xs text-center mb-3 px-2">{error}</p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(225,29,72,0.12)' }} />
            <span className="text-[10px] tracking-widest uppercase" style={{ color: '#3a3050' }}>veya</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(225,29,72,0.12)' }} />
          </div>

          {/* Guest button */}
          <button
            onClick={onGuestLogin}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-2xl font-medium text-sm transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(225,29,72,0.05)',
              border: '1px solid rgba(225,29,72,0.2)',
              color: '#94a3b8',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(225,29,72,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(225,29,72,0.2)')}
          >
            <UserX size={16} style={{ color: '#e11d48' }} />
            Misafir olarak devam et
          </button>

          <p className="text-[10px] text-center mt-3" style={{ color: '#2a2040' }}>
            Misafir modunda sohbet geçmişi kaydedilmez
          </p>
        </div>

        <p className="text-center text-[10px] mt-4 tracking-wider" style={{ color: '#1a1030' }}>
          KULLANIM KOŞULLARINI KABUL EDEREK GİRİŞ YAPIYORSUNUZ
        </p>
      </div>
    </div>
  )
}
