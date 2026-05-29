import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield, LogOut, Users, BarChart2, Eye, EyeOff, RefreshCw,
  AlertTriangle, Activity, MessageSquare, Lock, Sparkles,
  TrendingUp, Clock, Search, Trash2, Crown, UserCheck,
  Database, Zap, Globe, ChevronUp, ChevronDown,
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

/* ── Login ── */
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Hatalı şifre') }
      const { token } = await res.json()
      localStorage.setItem(ADMIN_TOKEN_KEY, token)
      onLogin(token)
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#04030a' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background: 'rgba(8,6,18,0.95)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 80px rgba(124,58,237,0.1), 0 40px 80px rgba(0,0,0,0.8)', backdropFilter: 'blur(40px)' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)' }} />
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-60"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e1040, #0c2040)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 30px rgba(124,58,237,0.2)' }}>
                <Shield size={28} style={{ color: '#a78bfa' }} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Admin Paneli</h1>
            <p className="text-xs tracking-widest uppercase" style={{ color: '#2d1f4a' }}>Kira AI · Güvenli Erişim</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Admin şifresi" autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none text-white"
                style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.2)', caretColor: '#7c3aed' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(139,92,246,0.2)')} />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#4a3a6a' }}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertTriangle size={12} />{error}
              </div>
            )}
            <button type="submit" disabled={loading || !password}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Doğrulanıyor...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Lock size={14} />Giriş Yap</span>
              )}
            </button>
          </form>
          <p className="text-center text-[10px] mt-4" style={{ color: '#1e1030' }}>Bu panel sadece yetkili kişiler içindir</p>
        </div>
      </div>
    </div>
  )
}

/* ── Stat Kartı ── */
function StatCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden transition-all"
      style={{ background: 'rgba(8,6,18,0.8)', border: `1px solid ${color}25`, boxShadow: `0 0 30px ${color}08` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}45`; e.currentTarget.style.boxShadow = `0 0 40px ${color}12` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}25`; e.currentTarget.style.boxShadow = `0 0 30px ${color}08` }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        {sub && <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>{sub}</span>}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</p>
      <p className="text-xs" style={{ color: '#4a3a6a' }}>{label}</p>
    </div>
  )
}

/* ── Mini Stat ── */
function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
      <span className="text-xs font-semibold font-mono" style={{ color }}>{value}</span>
    </div>
  )
}

/* ── Ana Dashboard ── */
function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tab, setTab] = useState<'overview' | 'users' | 'system'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'messages' | 'date'>('messages')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [s, u] = await Promise.all([adminFetch('/stats', token), adminFetch('/users', token)])
      setStats(s); setUsers(u)
    } catch (err: any) { setError('Veri yüklenemedi: ' + err.message) }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleLogout = async () => {
    try { await adminFetch('/logout', token, { method: 'POST' }) } catch { }
    localStorage.removeItem(ADMIN_TOKEN_KEY); onLogout()
  }

  const filteredUsers = users
    .filter(u => {
      if (!search) return true
      const q = search.toLowerCase()
      return (u.display_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1
      if (sortBy === 'messages') return (a.total_messages - b.total_messages) * mult
      return (new Date(a.last_seen).getTime() - new Date(b.last_seen).getTime()) * mult
    })

  const avgMessages = users.length > 0 ? Math.round(users.reduce((s, u) => s + u.total_messages, 0) / users.length) : 0
  const activeToday = users.filter(u => new Date(u.last_seen).toDateString() === new Date().toDateString()).length
  const topUser = users.reduce((a, b) => a.total_messages > b.total_messages ? a : b, users[0])

  const TABS = [
    { id: 'overview', label: 'Genel Bakış', icon: <BarChart2 size={14} /> },
    { id: 'users',    label: 'Kullanıcılar', icon: <Users size={14} /> },
    { id: 'system',   label: 'Sistem', icon: <Database size={14} /> },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: '#04030a' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[700px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0"
        style={{ background: 'rgba(4,3,10,0.97)', borderBottom: '1px solid rgba(139,92,246,0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(8,145,178,0.3), transparent)' }} />
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-60"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e1040, #0c2040)', border: '1px solid rgba(139,92,246,0.4)' }}>
                <Shield size={16} style={{ color: '#a78bfa' }} />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ background: 'linear-gradient(135deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Admin Paneli
              </h1>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: '#2d1f4a' }}>Kira AI · Kontrol Merkezi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Çevrimiçi
            </div>
            <button onClick={load} className="p-2 rounded-xl transition-all"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#4a3a6a' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a3a6a')} title="Yenile">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}>
              <LogOut size={13} />Çıkış
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertTriangle size={14} />{error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl w-fit"
          style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                border: `1px solid ${tab === t.id ? 'rgba(139,92,246,0.4)' : 'transparent'}`,
                color: tab === t.id ? '#a78bfa' : '#4a3a6a',
              }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(124,58,237,0.15)', borderTopColor: '#7c3aed' }} />
                <div className="absolute inset-2 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(8,145,178,0.15)', borderTopColor: '#0891b2', animationDirection: 'reverse', animationDuration: '0.8s' }} />
              </div>
              <p className="text-xs" style={{ color: '#4a3a6a' }}>Veriler yükleniyor...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── GENEL BAKIŞ ── */}
            {tab === 'overview' && stats && (
              <div className="space-y-6">
                {/* Ana istatistikler */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Users size={18} style={{ color: '#a78bfa' }} />} label="Toplam Kullanıcı" value={stats.total_users} color="#7c3aed" sub="Kayıtlı" />
                  <StatCard icon={<MessageSquare size={18} style={{ color: '#67e8f9' }} />} label="Toplam Sohbet" value={stats.total_conversations} color="#0891b2" sub="Aktif" />
                  <StatCard icon={<Activity size={18} style={{ color: '#34d399' }} />} label="Toplam Mesaj" value={stats.total_messages} color="#10b981" sub="Gönderildi" />
                </div>

                {/* Detay kartları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kullanıcı analizi */}
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={14} style={{ color: '#a78bfa' }} />
                      <h3 className="text-sm font-semibold text-white">Kullanıcı Analizi</h3>
                    </div>
                    <div className="space-y-2">
                      <MiniStat label="Bugün aktif" value={activeToday} color="#34d399" />
                      <MiniStat label="Ortalama mesaj/kullanıcı" value={avgMessages} color="#a78bfa" />
                      <MiniStat label="Sohbet/kullanıcı oranı" value={stats.total_users > 0 ? (stats.total_conversations / stats.total_users).toFixed(1) : '0'} color="#67e8f9" />
                      <MiniStat label="Mesaj/sohbet oranı" value={stats.total_conversations > 0 ? (stats.total_messages / stats.total_conversations).toFixed(1) : '0'} color="#f59e0b" />
                    </div>
                  </div>

                  {/* En aktif kullanıcı */}
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Crown size={14} style={{ color: '#f59e0b' }} />
                      <h3 className="text-sm font-semibold text-white">En Aktif Kullanıcı</h3>
                    </div>
                    {topUser ? (
                      <div className="flex items-center gap-3">
                        {topUser.photo_url ? (
                          <img src={topUser.photo_url} alt="" className="w-12 h-12 rounded-2xl"
                            style={{ border: '2px solid rgba(245,158,11,0.4)' }} />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)' }}>
                            <Users size={20} style={{ color: '#f59e0b' }} />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-white">{topUser.display_name || 'İsimsiz'}</p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{topUser.email || '—'}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Zap size={10} style={{ color: '#f59e0b' }} />
                            <span className="text-xs font-mono" style={{ color: '#f59e0b' }}>{topUser.total_messages} mesaj</span>
                          </div>
                        </div>
                      </div>
                    ) : <p className="text-xs" style={{ color: '#4a3a6a' }}>Henüz kullanıcı yok</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ── KULLANICILAR ── */}
            {tab === 'users' && (
              <div className="space-y-4">
                {/* Arama + sıralama */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a3a6a' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="İsim veya e-posta ara..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none text-white"
                      style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', caretColor: '#7c3aed' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.4)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(139,92,246,0.15)')} />
                  </div>
                  <div className="flex gap-2">
                    {[{ id: 'messages', label: 'Mesaj' }, { id: 'date', label: 'Tarih' }].map(s => (
                      <button key={s.id} onClick={() => { if (sortBy === s.id) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(s.id as any); setSortDir('desc') } }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: sortBy === s.id ? 'rgba(124,58,237,0.12)' : 'rgba(139,92,246,0.04)',
                          border: `1px solid ${sortBy === s.id ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.1)'}`,
                          color: sortBy === s.id ? '#a78bfa' : '#4a3a6a',
                        }}>
                        {s.label}
                        {sortBy === s.id && (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kullanıcı sayısı */}
                <p className="text-xs" style={{ color: '#4a3a6a' }}>
                  {filteredUsers.length} kullanıcı {search && `("${search}" için)`}
                </p>

                {/* Tablo */}
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.15)', background: 'rgba(8,6,18,0.8)' }}>
                  <div className="grid grid-cols-5 gap-3 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid rgba(139,92,246,0.1)', color: '#4a3a6a' }}>
                    <span className="col-span-2">Kullanıcı</span>
                    <span>E-posta</span>
                    <span className="text-center">Mesaj</span>
                    <span className="text-right">Son Görülme</span>
                  </div>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-sm" style={{ color: '#2d1f4a' }}>
                      {search ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'}
                    </div>
                  ) : filteredUsers.map((u, i) => (
                    <div key={u.id} className="grid grid-cols-5 gap-3 px-5 py-3.5 items-center transition-colors"
                      style={{ borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(139,92,246,0.06)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                        {u.photo_url ? (
                          <img src={u.photo_url} alt="" className="w-8 h-8 rounded-xl shrink-0"
                            style={{ border: '1px solid rgba(139,92,246,0.25)' }} />
                        ) : (
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                            <Users size={13} style={{ color: '#a78bfa' }} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white/80 truncate">{u.display_name || 'İsimsiz'}</span>
                            {u.is_admin && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono shrink-0"
                                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>ADM</span>
                            )}
                          </div>
                          <p className="text-[10px] truncate" style={{ color: '#2d1f4a' }}>
                            Katıldı: {new Date(u.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs truncate" style={{ color: '#6b7280' }}>{u.email || '—'}</span>
                      <div className="text-center">
                        <span className="text-xs font-mono font-semibold" style={{ color: u.total_messages > 100 ? '#34d399' : u.total_messages > 20 ? '#a78bfa' : '#6b7280' }}>
                          {u.total_messages}
                        </span>
                      </div>
                      <span className="text-xs text-right" style={{ color: '#4a3a6a' }}>
                        {new Date(u.last_seen).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SİSTEM ── */}
            {tab === 'system' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sistem bilgisi */}
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Database size={14} style={{ color: '#67e8f9' }} />
                      <h3 className="text-sm font-semibold text-white">Sistem Bilgisi</h3>
                    </div>
                    <div className="space-y-2">
                      <MiniStat label="Frontend" value="React + Vite" color="#67e8f9" />
                      <MiniStat label="Backend" value="FastAPI + Python" color="#a78bfa" />
                      <MiniStat label="Veritabanı" value="MySQL (XAMPP)" color="#34d399" />
                      <MiniStat label="AI Altyapısı" value="Groq API" color="#f59e0b" />
                      <MiniStat label="Görsel Üretim" value="Pollinations AI" color="#ec4899" />
                      <MiniStat label="Hosting" value="Vercel + Railway" color="#06b6d4" />
                    </div>
                  </div>

                  {/* Hızlı işlemler */}
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Zap size={14} style={{ color: '#f59e0b' }} />
                      <h3 className="text-sm font-semibold text-white">Hızlı İşlemler</h3>
                    </div>
                    <div className="space-y-2">
                      <button onClick={load}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left"
                        style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}>
                        <RefreshCw size={12} />Verileri Yenile
                      </button>
                      <a href="https://kiragpt.vercel.app" target="_blank" rel="noreferrer"
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)', color: '#67e8f9', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(8,145,178,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(8,145,178,0.06)')}>
                        <Globe size={12} />Siteyi Aç
                      </a>
                      <a href="https://github.com/beratdermir09-cloud/kira-ai" target="_blank" rel="noreferrer"
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                        <Sparkles size={12} />GitHub Repo
                      </a>
                    </div>
                  </div>
                </div>

                {/* Güvenlik notu */}
                <div className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <Shield size={14} style={{ color: '#f59e0b', marginTop: 1 }} />
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>Güvenlik Notu</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>
                      Admin oturumu 1 saat sonra otomatik sona erer. Şifrenizi kimseyle paylaşmayın.
                      Şüpheli aktivite fark ederseniz hemen şifreyi değiştirin.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ── Ana Export ── */
export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ADMIN_TOKEN_KEY))
  const [verified, setVerified] = useState(false)
  const [checking, setChecking] = useState(!!localStorage.getItem(ADMIN_TOKEN_KEY))

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (!saved) { setChecking(false); return }
    fetch(getApiBase() + '/api/admin/verify', { headers: { 'x-admin-token': saved } })
      .then(r => { if (r.ok) { setToken(saved); setVerified(true) } else { localStorage.removeItem(ADMIN_TOKEN_KEY); setToken(null) } })
      .catch(() => { localStorage.removeItem(ADMIN_TOKEN_KEY); setToken(null) })
      .finally(() => setChecking(false))
  }, [])

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#04030a' }}>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(124,58,237,0.15)', borderTopColor: '#7c3aed' }} />
      </div>
    </div>
  )

  if (!token || !verified) return <AdminLogin onLogin={t => { setToken(t); setVerified(true) }} />
  return <AdminDashboard token={token} onLogout={() => { setToken(null); setVerified(false) }} />
}
