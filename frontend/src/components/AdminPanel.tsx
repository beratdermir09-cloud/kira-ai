import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield, LogOut, Users, BarChart2, Eye, EyeOff,
  RefreshCw, X, AlertTriangle, Activity, MessageSquare,
  Clock, Cpu, Lock,
} from 'lucide-react'

const ADMIN_TOKEN_KEY = 'kira_admin_token'

interface Stats {
  total_users: number
  total_conversations: number
  total_messages: number
}

interface User {
  id: string
  email: string
  display_name: string
  photo_url: string
  total_messages: number
  created_at: string
  last_seen: string
  is_admin: boolean
}

function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  return 'http://localhost:8000'
}

const API = getApiBase() + '/api/admin'

async function adminFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': token,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/* ── Login ekranı ── */
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Hatalı şifre')
      }
      const { token } = await res.json()
      localStorage.setItem(ADMIN_TOKEN_KEY, token)
      onLogin(token)
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#020207' }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)', filter: 'blur(90px)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(225,29,72,1) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        {/* Scanlines */}
        <div className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          }} />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Card */}
        <div className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: 'rgba(6,4,12,0.95)',
            border: '1px solid rgba(225,29,72,0.2)',
            boxShadow: '0 0 80px rgba(225,29,72,0.06), 0 40px 80px rgba(0,0,0,0.8)',
            backdropFilter: 'blur(40px)',
          }}>

          {/* Top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.6), transparent)' }} />

          {/* Corner accents */}
          {['tl', 'tr', 'bl', 'br'].map(c => (
            <div key={c} className={`absolute w-6 h-6 ${
              c === 'tl' ? 'top-0 left-0 border-t border-l rounded-tl-3xl' :
              c === 'tr' ? 'top-0 right-0 border-t border-r rounded-tr-3xl' :
              c === 'bl' ? 'bottom-0 left-0 border-b border-l rounded-bl-3xl' :
              'bottom-0 right-0 border-b border-r rounded-br-3xl'
            }`} style={{ borderColor: 'rgba(225,29,72,0.35)' }} />
          ))}

          {/* Icon */}
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                style={{ background: 'linear-gradient(135deg, #e11d48, #f97316)' }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1a0810, #2a0c10)',
                  border: '1px solid rgba(225,29,72,0.4)',
                  boxShadow: '0 0 30px rgba(225,29,72,0.2)',
                }}>
                <Shield size={28} style={{ color: '#fda4af' }} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Admin Paneli</h1>
            <p className="text-xs tracking-widest uppercase" style={{ color: '#3a2030' }}>
              Kira AI · Güvenli Erişim
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin şifresi"
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none text-white"
                style={{
                  background: 'rgba(225,29,72,0.05)',
                  border: '1px solid rgba(225,29,72,0.2)',
                  caretColor: '#e11d48',
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(225,29,72,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(225,29,72,0.2)')}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: '#4a4060' }}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)', color: '#f87171' }}>
                <AlertTriangle size={12} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #e11d48, #f97316)',
                boxShadow: '0 4px 20px rgba(225,29,72,0.3)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Doğrulanıyor...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock size={14} />
                  Giriş Yap
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] mt-4" style={{ color: '#1a1020' }}>
            Bu panel sadece yetkili kişiler içindir
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Stat kartı ── */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'rgba(6,4,12,0.8)',
        border: `1px solid ${color}22`,
        boxShadow: `0 0 30px ${color}08`,
      }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: '#6b7280' }}>{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value?.toLocaleString?.() ?? value}</p>
    </div>
  )
}

/* ── Ana panel ── */
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tab, setTab] = useState<'stats' | 'users'>('stats')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, u] = await Promise.all([
        adminFetch('/stats', token),
        adminFetch('/users', token),
      ])
      setStats(s)
      setUsers(u)
    } catch (err: any) {
      setError('Veri yüklenemedi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleLogout = async () => {
    try { await adminFetch('/logout', token, { method: 'POST' }) } catch { }
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    onLogout()
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#020207' }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[800px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.06) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(225,29,72,1) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        <div className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)',
          }} />
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0"
        style={{
          background: 'rgba(4,3,8,0.97)',
          borderBottom: '1px solid rgba(225,29,72,0.1)',
          backdropFilter: 'blur(20px)',
        }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.4), transparent)' }} />
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1a0810, #2a0c10)',
                border: '1px solid rgba(225,29,72,0.4)',
                boxShadow: '0 0 15px rgba(225,29,72,0.2)',
              }}>
              <Shield size={15} style={{ color: '#fda4af' }} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Admin Paneli</h1>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: '#3a2030' }}>Kira AI · Kontrol Merkezi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2 rounded-xl transition-all"
              style={{ background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)', color: '#4a4060' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fda4af')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a4060')}
              title="Yenile"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(225,29,72,0.06)', border: '1px solid rgba(225,29,72,0.15)', color: '#f87171' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(225,29,72,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(225,29,72,0.06)')}
            >
              <LogOut size={13} />
              Çıkış
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)', color: '#f87171' }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: 'stats', label: 'İstatistikler', icon: <BarChart2 size={14} /> },
            { id: 'users', label: 'Kullanıcılar', icon: <Users size={14} /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? 'rgba(225,29,72,0.12)' : 'rgba(225,29,72,0.04)',
                border: `1px solid ${tab === t.id ? 'rgba(225,29,72,0.35)' : 'rgba(225,29,72,0.1)'}`,
                color: tab === t.id ? '#fda4af' : '#6b7280',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Stats tab */}
        {tab === 'stats' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(225,29,72,0.2)', borderTopColor: '#e11d48' }} />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  icon={<Users size={16} style={{ color: '#fda4af' }} />}
                  label="Toplam Kullanıcı"
                  value={stats.total_users}
                  color="#e11d48"
                />
                <StatCard
                  icon={<MessageSquare size={16} style={{ color: '#fb923c' }} />}
                  label="Toplam Sohbet"
                  value={stats.total_conversations}
                  color="#f97316"
                />
                <StatCard
                  icon={<Activity size={16} style={{ color: '#c084fc' }} />}
                  label="Toplam Mesaj"
                  value={stats.total_messages}
                  color="#c026d3"
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'rgba(225,29,72,0.2)', borderTopColor: '#e11d48' }} />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(225,29,72,0.15)', background: 'rgba(6,4,12,0.8)' }}>
                {/* Table header */}
                <div className="grid grid-cols-4 gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest"
                  style={{ background: 'rgba(225,29,72,0.06)', borderBottom: '1px solid rgba(225,29,72,0.1)', color: '#4a4060' }}>
                  <span>Kullanıcı</span>
                  <span>E-posta</span>
                  <span className="text-center">Mesaj</span>
                  <span className="text-right">Son Görülme</span>
                </div>

                {users.length === 0 ? (
                  <div className="text-center py-12 text-sm" style={{ color: '#3a2030' }}>
                    Henüz kullanıcı yok
                  </div>
                ) : (
                  users.map((u, i) => (
                    <div
                      key={u.id}
                      className="grid grid-cols-4 gap-4 px-5 py-3.5 items-center transition-colors"
                      style={{
                        borderBottom: i < users.length - 1 ? '1px solid rgba(225,29,72,0.06)' : 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(225,29,72,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {u.photo_url ? (
                          <img src={u.photo_url} alt="" className="w-7 h-7 rounded-lg shrink-0"
                            style={{ border: '1px solid rgba(225,29,72,0.2)' }} />
                        ) : (
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.2)' }}>
                            <Users size={12} style={{ color: '#fda4af' }} />
                          </div>
                        )}
                        <span className="text-xs font-medium text-white/80 truncate">
                          {u.display_name || 'İsimsiz'}
                        </span>
                        {u.is_admin && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono shrink-0"
                            style={{ background: 'rgba(225,29,72,0.15)', color: '#fda4af', border: '1px solid rgba(225,29,72,0.3)' }}>
                            ADM
                          </span>
                        )}
                      </div>
                      <span className="text-xs truncate" style={{ color: '#6b7280' }}>{u.email || '—'}</span>
                      <span className="text-xs text-center font-mono" style={{ color: '#fb923c' }}>{u.total_messages}</span>
                      <span className="text-xs text-right" style={{ color: '#4a4060' }}>
                        {new Date(u.last_seen).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Ana export ── */
export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(ADMIN_TOKEN_KEY)
  })
  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(!!localStorage.getItem(ADMIN_TOKEN_KEY))

  // Sayfa açılınca token geçerli mi kontrol et
  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (!saved) { setChecking(false); return }

    fetch(getApiBase() + '/api/admin/verify', {
      headers: { 'x-admin-token': saved },
    }).then(r => {
      if (r.ok) { setToken(saved); setVerified(true) }
      else { localStorage.removeItem(ADMIN_TOKEN_KEY); setToken(null) }
    }).catch(() => {
      localStorage.removeItem(ADMIN_TOKEN_KEY); setToken(null)
    }).finally(() => setChecking(false))
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020207' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(225,29,72,0.2)', borderTopColor: '#e11d48' }} />
      </div>
    )
  }

  if (!token || !verified) {
    return <AdminLogin onLogin={t => { setToken(t); setVerified(true) }} />
  }

  return <AdminDashboard token={token} onLogout={() => { setToken(null); setVerified(false) }} />
}
