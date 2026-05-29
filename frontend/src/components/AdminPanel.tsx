import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield, LogOut, Users, BarChart2, Eye, EyeOff, RefreshCw,
  AlertTriangle, Activity, MessageSquare, Lock, Sparkles,
  TrendingUp, Search, Crown, Database, Zap, Globe,
  ChevronUp, ChevronDown, ShieldAlert, Heart, CheckCircle, XCircle,
} from 'lucide-react'

const ADMIN_TOKEN_KEY = 'kira_admin_token'

interface Stats { total_users: number; total_conversations: number; total_messages: number }
interface User { id: string; email: string; display_name: string; photo_url: string; total_messages: number; created_at: string; last_seen: string; is_admin: boolean }
interface SecurityData { active_sessions: number; locked_ips: string[]; suspicious_ips: Record<string, number>; max_attempts: number; lockout_duration: number }
interface ActivityItem { id: string; user: string; content: string; conversation: string; created_at: string }
interface HealthData { db_connected: boolean; db_latency_ms: number; groq_configured: boolean; active_sessions: number; model: string; environment: string }

function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  return 'http://localhost:8000'
}
const API = getApiBase() + '/api/admin'

async function adminFetch(path: string, token: string, options: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': token, ...(options.headers || {}) },
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function StatCard({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden transition-all"
      style={{ background: 'rgba(8,6,18,0.8)', border: `1px solid ${color}25` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}45` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}25` }}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>{icon}</div>
        {sub && <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>{sub}</span>}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</p>
      <p className="text-xs" style={{ color: '#4a3a6a' }}>{label}</p>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-xs" style={{ color: '#6b7280' }}>{label}</span>
      <span className="text-xs font-semibold font-mono" style={{ color }}>{value}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(124,58,237,0.15)', borderTopColor: '#7c3aed' }} />
        <div className="absolute inset-2 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(8,145,178,0.15)', borderTopColor: '#0891b2', animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
    </div>
  )
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res = await fetch(API + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      if (!res.ok) { let msg = 'Hatalı kullanıcı adı veya şifre'; try { const d = await res.json(); msg = d.detail || msg } catch {} throw new Error(msg) }
      const { token } = await res.json()
      localStorage.setItem(ADMIN_TOKEN_KEY, token); onLogin(token)
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? 'Backend kapalı. start.bat ile başlatın.' : err.message || 'Giriş başarısız')
    } finally { setLoading(false) }
  }

  const inp = (extra: React.InputHTMLAttributes<HTMLInputElement>) => ({
    className: "w-full px-4 py-3 rounded-xl text-sm outline-none text-white",
    style: { background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.2)', caretColor: '#7c3aed' } as React.CSSProperties,
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(139,92,246,0.5)'),
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'rgba(139,92,246,0.2)'),
    ...extra,
  })

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#04030a' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="rounded-3xl p-8 relative overflow-hidden" style={{ background: 'rgba(8,6,18,0.95)', border: '1px solid rgba(139,92,246,0.25)', boxShadow: '0 0 80px rgba(124,58,237,0.1), 0 40px 80px rgba(0,0,0,0.8)', backdropFilter: 'blur(40px)' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)' }} />
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e1040, #0c2040)', border: '1px solid rgba(139,92,246,0.4)' }}>
                <Shield size={28} style={{ color: '#a78bfa' }} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">Admin Paneli</h1>
            <p className="text-xs tracking-widest uppercase" style={{ color: '#2d1f4a' }}>Kira AI · Güvenli Erişim</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input {...inp({ type: 'text', value: username, onChange: e => setUsername(e.target.value), placeholder: 'Kullanıcı adı', autoComplete: 'username' })} />
            <div className="relative">
              <input {...inp({ type: show ? 'text' : 'password', value: password, onChange: e => setPassword(e.target.value), placeholder: 'Admin şifresi', autoComplete: 'current-password', style: { background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.2)', caretColor: '#7c3aed', paddingRight: '3rem' } as React.CSSProperties })} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: '#4a3a6a' }}>
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                <AlertTriangle size={12} />{error}
              </div>
            )}
            <button type="submit" disabled={loading || !username || !password}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Doğrulanıyor...</span>
                : <span className="flex items-center justify-center gap-2"><Lock size={14} />Giriş Yap</span>}
            </button>
          </form>
          <p className="text-center text-[10px] mt-4" style={{ color: '#1e1030' }}>Bu panel sadece yetkili kişiler içindir</p>
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [security, setSecurity] = useState<SecurityData | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [health, setHealth] = useState<HealthData | null>(null)
  const [tab, setTab] = useState<'overview' | 'users' | 'activity' | 'system' | 'security'>('overview')
  const [loading, setLoading] = useState(true)
  const [secLoading, setSecLoading] = useState(false)
  const [actLoading, setActLoading] = useState(false)
  const [hlLoading, setHlLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'messages' | 'date'>('messages')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [s, u] = await Promise.all([adminFetch('/stats', token), adminFetch('/users', token)])
      setStats(s); setUsers(u)
    } catch (err: any) { setError(err.message === 'Failed to fetch' ? 'Backend kapalı. start.bat ile başlatın.' : 'Veri yüklenemedi: ' + err.message) }
    finally { setLoading(false) }
  }, [token])

  const loadSec = useCallback(async () => { setSecLoading(true); try { setSecurity(await adminFetch('/security', token)) } catch { setSecurity(null) } finally { setSecLoading(false) } }, [token])
  const loadAct = useCallback(async () => { setActLoading(true); try { setActivity(await adminFetch('/activity', token)) } catch { setActivity([]) } finally { setActLoading(false) } }, [token])
  const loadHl = useCallback(async () => { setHlLoading(true); try { setHealth(await adminFetch('/health', token)) } catch { setHealth(null) } finally { setHlLoading(false) } }, [token])

  useEffect(() => { load() }, [load])
  useEffect(() => { if (tab === 'security') loadSec(); if (tab === 'activity') loadAct(); if (tab === 'system') loadHl() }, [tab])

  const handleLogout = async () => { try { await adminFetch('/logout', token, { method: 'POST' }) } catch {} localStorage.removeItem(ADMIN_TOKEN_KEY); onLogout() }

  const filtered = users.filter(u => !search || (u.display_name || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => { const m = sortDir === 'desc' ? -1 : 1; return sortBy === 'messages' ? (a.total_messages - b.total_messages) * m : (new Date(a.last_seen).getTime() - new Date(b.last_seen).getTime()) * m })

  const avgMsg = users.length > 0 ? Math.round(users.reduce((s, u) => s + u.total_messages, 0) / users.length) : 0
  const activeToday = users.filter(u => new Date(u.last_seen).toDateString() === new Date().toDateString()).length
  const topUser = users.length > 0 ? users.reduce((a, b) => a.total_messages > b.total_messages ? a : b) : null

  const TABS = [
    { id: 'overview', label: 'Genel Bakış', icon: <BarChart2 size={13} /> },
    { id: 'users', label: 'Kullanıcılar', icon: <Users size={13} /> },
    { id: 'activity', label: 'Aktivite', icon: <Activity size={13} /> },
    { id: 'system', label: 'Sistem', icon: <Heart size={13} /> },
    { id: 'security', label: 'Güvenlik', icon: <ShieldAlert size={13} /> },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: '#04030a' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[700px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0" style={{ background: 'rgba(4,3,10,0.97)', borderBottom: '1px solid rgba(139,92,246,0.1)', backdropFilter: 'blur(20px)' }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(8,145,178,0.3), transparent)' }} />
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl blur-lg opacity-60" style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)' }} />
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e1040, #0c2040)', border: '1px solid rgba(139,92,246,0.4)' }}>
                <Shield size={16} style={{ color: '#a78bfa' }} />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold" style={{ background: 'linear-gradient(135deg, #a78bfa, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Paneli</h1>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: '#2d1f4a' }}>Kira AI · Kontrol Merkezi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Çevrimiçi
            </div>
            <button onClick={load} className="p-2 rounded-xl transition-all" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#4a3a6a' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')} onMouseLeave={e => (e.currentTarget.style.color = '#4a3a6a')}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}>
              <LogOut size={13} />Çıkış
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertTriangle size={14} />{error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-8 p-1 rounded-2xl w-fit" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent', border: `1px solid ${tab === t.id ? 'rgba(139,92,246,0.4)' : 'transparent'}`, color: tab === t.id ? '#a78bfa' : '#4a3a6a' }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : (
          <>
            {/* GENEL BAKIŞ */}
            {tab === 'overview' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Users size={18} style={{ color: '#a78bfa' }} />} label="Toplam Kullanıcı" value={stats.total_users} color="#7c3aed" sub="Kayıtlı" />
                  <StatCard icon={<MessageSquare size={18} style={{ color: '#67e8f9' }} />} label="Toplam Sohbet" value={stats.total_conversations} color="#0891b2" sub="Aktif" />
                  <StatCard icon={<Activity size={18} style={{ color: '#34d399' }} />} label="Toplam Mesaj" value={stats.total_messages} color="#10b981" sub="Gönderildi" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4"><TrendingUp size={14} style={{ color: '#a78bfa' }} /><h3 className="text-sm font-semibold text-white">Kullanıcı Analizi</h3></div>
                    <div className="space-y-2">
                      <MiniStat label="Bugün aktif" value={activeToday} color="#34d399" />
                      <MiniStat label="Ort. mesaj/kullanıcı" value={avgMsg} color="#a78bfa" />
                      <MiniStat label="Sohbet/kullanıcı" value={stats.total_users > 0 ? (stats.total_conversations / stats.total_users).toFixed(1) : '0'} color="#67e8f9" />
                      <MiniStat label="Mesaj/sohbet" value={stats.total_conversations > 0 ? (stats.total_messages / stats.total_conversations).toFixed(1) : '0'} color="#f59e0b" />
                    </div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4"><Crown size={14} style={{ color: '#f59e0b' }} /><h3 className="text-sm font-semibold text-white">En Aktif Kullanıcı</h3></div>
                    {topUser ? (
                      <div className="flex items-center gap-3">
                        {topUser.photo_url ? <img src={topUser.photo_url} alt="" className="w-12 h-12 rounded-2xl" style={{ border: '2px solid rgba(245,158,11,0.4)' }} />
                          : <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)' }}><Users size={20} style={{ color: '#f59e0b' }} /></div>}
                        <div>
                          <p className="text-sm font-semibold text-white">{topUser.display_name || 'İsimsiz'}</p>
                          <p className="text-xs" style={{ color: '#6b7280' }}>{topUser.email || '—'}</p>
                          <div className="flex items-center gap-1 mt-1"><Zap size={10} style={{ color: '#f59e0b' }} /><span className="text-xs font-mono" style={{ color: '#f59e0b' }}>{topUser.total_messages} mesaj</span></div>
                        </div>
                      </div>
                    ) : <p className="text-xs" style={{ color: '#4a3a6a' }}>Henüz kullanıcı yok</p>}
                  </div>
                </div>
              </div>
            )}

            {/* KULLANICILAR */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4a3a6a' }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim veya e-posta ara..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none text-white"
                      style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', caretColor: '#7c3aed' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(139,92,246,0.4)')} onBlur={e => (e.target.style.borderColor = 'rgba(139,92,246,0.15)')} />
                  </div>
                  <div className="flex gap-2">
                    {[{ id: 'messages', label: 'Mesaj' }, { id: 'date', label: 'Tarih' }].map(s => (
                      <button key={s.id} onClick={() => { if (sortBy === s.id) setSortDir(d => d === 'desc' ? 'asc' : 'desc'); else { setSortBy(s.id as any); setSortDir('desc') } }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ background: sortBy === s.id ? 'rgba(124,58,237,0.12)' : 'rgba(139,92,246,0.04)', border: `1px solid ${sortBy === s.id ? 'rgba(139,92,246,0.35)' : 'rgba(139,92,246,0.1)'}`, color: sortBy === s.id ? '#a78bfa' : '#4a3a6a' }}>
                        {s.label}{sortBy === s.id && (sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />)}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#4a3a6a' }}>{filtered.length} kullanıcı{search && ` ("${search}" için)`}</p>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.15)', background: 'rgba(8,6,18,0.8)' }}>
                  <div className="grid grid-cols-5 gap-3 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest" style={{ background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid rgba(139,92,246,0.1)', color: '#4a3a6a' }}>
                    <span className="col-span-2">Kullanıcı</span><span>E-posta</span><span className="text-center">Mesaj</span><span className="text-right">Son Görülme</span>
                  </div>
                  {filtered.length === 0 ? <div className="text-center py-12 text-sm" style={{ color: '#2d1f4a' }}>{search ? 'Sonuç bulunamadı' : 'Henüz kullanıcı yok'}</div>
                    : filtered.map((u, i) => (
                      <div key={u.id} className="grid grid-cols-5 gap-3 px-5 py-3.5 items-center transition-colors"
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(139,92,246,0.06)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                          {u.photo_url ? <img src={u.photo_url} alt="" className="w-8 h-8 rounded-xl shrink-0" style={{ border: '1px solid rgba(139,92,246,0.25)' }} />
                            : <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}><Users size={13} style={{ color: '#a78bfa' }} /></div>}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-white/80 truncate">{u.display_name || 'İsimsiz'}</span>
                              {u.is_admin && <span className="text-[9px] px-1.5 py-0.5 rounded-md font-mono shrink-0" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>ADM</span>}
                            </div>
                            <p className="text-[10px] truncate" style={{ color: '#2d1f4a' }}>Katıldı: {new Date(u.created_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                        <span className="text-xs truncate" style={{ color: '#6b7280' }}>{u.email || '—'}</span>
                        <div className="text-center"><span className="text-xs font-mono font-semibold" style={{ color: u.total_messages > 100 ? '#34d399' : u.total_messages > 20 ? '#a78bfa' : '#6b7280' }}>{u.total_messages}</span></div>
                        <span className="text-xs text-right" style={{ color: '#4a3a6a' }}>{new Date(u.last_seen).toLocaleDateString('tr-TR')}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* AKTİVİTE */}
            {tab === 'activity' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#4a3a6a' }}>Son 50 kullanıcı mesajı</p>
                  <button onClick={loadAct} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.12)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}>
                    <RefreshCw size={11} className={actLoading ? 'animate-spin' : ''} />Yenile
                  </button>
                </div>
                {actLoading ? <Spinner /> : activity.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.1)' }}>
                    <MessageSquare size={28} className="mx-auto mb-3" style={{ color: '#2d1f4a' }} />
                    <p className="text-sm" style={{ color: '#4a3a6a' }}>Henüz aktivite yok</p>
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.15)', background: 'rgba(8,6,18,0.8)' }}>
                    <div className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
                      style={{ background: 'rgba(124,58,237,0.06)', borderBottom: '1px solid rgba(139,92,246,0.1)', color: '#4a3a6a' }}>
                      <span className="col-span-2">Kullanıcı</span><span className="col-span-5">Mesaj</span><span className="col-span-3">Sohbet</span><span className="col-span-2 text-right">Zaman</span>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                      {activity.map((item, i) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 px-5 py-3 items-start transition-colors"
                          style={{ borderBottom: i < activity.length - 1 ? '1px solid rgba(139,92,246,0.05)' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.04)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <div className="col-span-2 flex items-center gap-1.5 min-w-0">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
                              <Users size={10} style={{ color: '#a78bfa' }} />
                            </div>
                            <span className="text-[10px] truncate" style={{ color: '#94a3b8' }}>{item.user}</span>
                          </div>
                          <p className="col-span-5 text-xs leading-relaxed" style={{ color: '#d1d5db' }}>{item.content}{item.content.length >= 120 ? '...' : ''}</p>
                          <p className="col-span-3 text-[10px] truncate" style={{ color: '#4a3a6a' }}>{item.conversation}</p>
                          <div className="col-span-2 text-right">
                            <span className="text-[10px]" style={{ color: '#2d1f4a' }}>{new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <p className="text-[9px]" style={{ color: '#1e1030' }}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SİSTEM */}
            {tab === 'system' && (
              <div className="space-y-4">
                {hlLoading ? <Spinner /> : health ? (
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><Heart size={14} style={{ color: '#ec4899' }} /><h3 className="text-sm font-semibold text-white">Sistem Sağlığı</h3></div>
                      <button onClick={loadHl} className="p-1.5 rounded-lg" style={{ color: '#4a3a6a' }} onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')} onMouseLeave={e => (e.currentTarget.style.color = '#4a3a6a')}><RefreshCw size={12} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      {[
                        { label: 'Veritabanı', ok: health.db_connected, detail: `${health.db_latency_ms}ms gecikme` },
                        { label: 'Groq API', ok: health.groq_configured, detail: 'Yapılandırıldı' },
                        { label: 'Ortam', ok: true, detail: health.environment === 'production' ? '🚀 Production' : '💻 Local' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                          style={{ background: item.ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${item.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                          {item.ok ? <CheckCircle size={14} style={{ color: '#34d399', flexShrink: 0 }} /> : <XCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />}
                          <div><p className="text-xs font-medium" style={{ color: item.ok ? '#34d399' : '#f87171' }}>{item.label}</p><p className="text-[10px]" style={{ color: '#4a3a6a' }}>{item.detail}</p></div>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <p className="text-[10px]" style={{ color: '#4a3a6a' }}>Model: <span style={{ color: '#a78bfa' }}>{health.model}</span> · Aktif Oturum: <span style={{ color: '#67e8f9' }}>{health.active_sessions}</span></p>
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4"><Database size={14} style={{ color: '#67e8f9' }} /><h3 className="text-sm font-semibold text-white">Teknoloji Stack</h3></div>
                    <div className="space-y-2">
                      <MiniStat label="Frontend" value="React + Vite" color="#67e8f9" />
                      <MiniStat label="Backend" value="FastAPI + Python" color="#a78bfa" />
                      <MiniStat label="Veritabanı" value="MySQL (XAMPP)" color="#34d399" />
                      <MiniStat label="AI Altyapısı" value="Groq API" color="#f59e0b" />
                      <MiniStat label="Görsel Üretim" value="Pollinations AI" color="#ec4899" />
                      <MiniStat label="Hosting" value="Vercel + Railway" color="#06b6d4" />
                    </div>
                  </div>
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <div className="flex items-center gap-2 mb-4"><Zap size={14} style={{ color: '#f59e0b' }} /><h3 className="text-sm font-semibold text-white">Hızlı İşlemler</h3></div>
                    <div className="space-y-2">
                      <button onClick={load} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left"
                        style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: '#a78bfa' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.12)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}>
                        <RefreshCw size={12} />Verileri Yenile
                      </button>
                      <a href="https://kiragpt.vercel.app" target="_blank" rel="noreferrer" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{ background: 'rgba(8,145,178,0.06)', border: '1px solid rgba(8,145,178,0.15)', color: '#67e8f9', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(8,145,178,0.12)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(8,145,178,0.06)')}>
                        <Globe size={12} />Siteyi Aç
                      </a>
                      <a href="https://github.com/beratdermir09-cloud/kira-ai" target="_blank" rel="noreferrer" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', display: 'flex' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}>
                        <Sparkles size={12} />GitHub Repo
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GÜVENLİK */}
            {tab === 'security' && (
              <div className="space-y-4">
                {secLoading ? <Spinner /> : security ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <StatCard icon={<Activity size={18} style={{ color: '#34d399' }} />} label="Aktif Oturum" value={security.active_sessions} color="#10b981" sub="Canlı" />
                      <StatCard icon={<Lock size={18} style={{ color: '#f87171' }} />} label="Kilitli IP" value={security.locked_ips.length} color="#ef4444" sub="Engelli" />
                      <StatCard icon={<AlertTriangle size={18} style={{ color: '#f59e0b' }} />} label="Şüpheli IP" value={Object.keys(security.suspicious_ips).length} color="#f59e0b" sub="İzleniyor" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div className="flex items-center gap-2 mb-4"><Lock size={14} style={{ color: '#f87171' }} /><h3 className="text-sm font-semibold text-white">Kilitli IP'ler</h3></div>
                        {security.locked_ips.length === 0 ? <p className="text-xs py-4 text-center" style={{ color: '#4a3a6a' }}>Kilitli IP yok ✓</p>
                          : <div className="space-y-2">{security.locked_ips.map((ip, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                              <span className="text-xs font-mono text-white/70">{ip}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>KİLİTLİ</span>
                            </div>
                          ))}</div>}
                      </div>
                      <div className="rounded-2xl p-5" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <div className="flex items-center gap-2 mb-4"><AlertTriangle size={14} style={{ color: '#f59e0b' }} /><h3 className="text-sm font-semibold text-white">Şüpheli IP'ler</h3></div>
                        {Object.keys(security.suspicious_ips).length === 0 ? <p className="text-xs py-4 text-center" style={{ color: '#4a3a6a' }}>Şüpheli IP yok ✓</p>
                          : <div className="space-y-2">{Object.entries(security.suspicious_ips).map(([ip, count], i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                              <span className="text-xs font-mono text-white/70">{ip}</span>
                              <span className="text-xs font-mono font-semibold" style={{ color: '#f59e0b' }}>{count} deneme</span>
                            </div>
                          ))}</div>}
                      </div>
                    </div>
                    <div className="rounded-2xl p-4" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <div className="flex items-center gap-2 mb-3"><ShieldAlert size={13} style={{ color: '#a78bfa' }} /><h3 className="text-xs font-semibold text-white">Güvenlik Ayarları</h3></div>
                      <div className="grid grid-cols-2 gap-2">
                        <MiniStat label="Maks. deneme" value={security.max_attempts} color="#a78bfa" />
                        <MiniStat label="Kilitleme (sn)" value={security.lockout_duration} color="#67e8f9" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={loadSec} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                        style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.12)')} onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}>
                        <RefreshCw size={12} className={secLoading ? 'animate-spin' : ''} />Güvenlik Verilerini Yenile
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(8,6,18,0.8)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: '#f87171' }} />
                    <p className="text-sm font-semibold text-white mb-1">Güvenlik verileri yüklenemedi</p>
                    <button onClick={loadSec} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium mx-auto mt-3 transition-all"
                      style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                      <RefreshCw size={12} />Tekrar Dene
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

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
        <div className="absolute inset-0 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(124,58,237,0.15)', borderTopColor: '#7c3aed' }} />
      </div>
    </div>
  )

  if (!token || !verified) return <AdminLogin onLogin={t => { setToken(t); setVerified(true) }} />
  return <AdminDashboard token={token} onLogout={() => { setToken(null); setVerified(false) }} />
}
