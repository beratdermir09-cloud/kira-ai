import React, { useState } from 'react'
import {
  Plus, MessageSquare, Trash2, Edit2, Check, X, Bot,
  Search, Pin, Sparkles, FolderOpen, Folder, ChevronRight,
  ChevronDown as ChevronDownIcon, Tag,
} from 'lucide-react'
import { Conversation } from '../types'
import UserMenu from './UserMenu'
import { User } from '../firebase'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onPin: (id: string, pinned: boolean) => void
  onTag: (id: string, tags: string[]) => void
  onSearch: () => void
  user: User | null
  isGuest?: boolean
  darkMode?: boolean
  guestMessageCount?: number
  guestMessageLimit?: number
  onGuestLimitClick?: () => void
}

const FOLDERS = ['İş', 'Kişisel', 'Kod', 'Araştırma']

const FOLDER_COLORS: Record<string, string> = {
  'İş': 'rgba(59,130,246,0.6)',
  'Kişisel': 'rgba(34,197,94,0.6)',
  'Kod': 'rgba(168,85,247,0.6)',
  'Araştırma': 'rgba(234,179,8,0.6)',
}

export default function Sidebar({
  conversations, activeId, onSelect, onCreate, onDelete,
  onRename, onPin, onTag, onSearch, user, isGuest = false,
  guestMessageCount = 0, guestMessageLimit = 20,
  onGuestLimitClick,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set())
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null)

  const toggleFolder = (f: string) => {
    setCollapsedFolders(prev => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
  }

  const filtered = conversations.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const matchFolder = !activeFolder || (c.folder === activeFolder)
    return matchSearch && matchFolder
  })

  const pinned = filtered.filter(c => c.is_pinned)
  const unpinned = filtered.filter(c => !c.is_pinned)

  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const week = new Date(today); week.setDate(week.getDate() - 7)

  const groups = [
    { label: 'Bugün', items: unpinned.filter(c => new Date(c.updated_at).toDateString() === today.toDateString()) },
    { label: 'Dün', items: unpinned.filter(c => new Date(c.updated_at).toDateString() === yesterday.toDateString()) },
    { label: 'Bu Hafta', items: unpinned.filter(c => { const d = new Date(c.updated_at); return d < yesterday && d >= week }) },
    { label: 'Daha Önce', items: unpinned.filter(c => new Date(c.updated_at) < week) },
  ].filter(g => g.items.length > 0)

  const ConvItem = ({ conv }: { conv: Conversation }) => {
    const isActive = activeId === conv.id
    return (
      <div
        onClick={() => onSelect(conv.id)}
        className="sidebar-item group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all relative"
        style={{
          background: isActive
            ? 'linear-gradient(135deg, rgba(225,29,72,0.1), rgba(249,115,22,0.06))'
            : 'transparent',
          border: `1px solid ${isActive ? 'rgba(225,29,72,0.25)' : 'transparent'}`,
          color: isActive ? '#fda4af' : '#6b7280',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(225,29,72,0.04)'
            e.currentTarget.style.color = '#94a3b8'
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#6b7280'
          }
        }}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
            style={{ background: 'linear-gradient(to bottom, #e11d48, #f97316)' }} />
        )}
        <MessageSquare size={11} className="shrink-0 opacity-40" />
        <div className="flex-1 min-w-0">
          {editingId === conv.id ? (
            <input
              autoFocus
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onRename(conv.id, editTitle); setEditingId(null) }
                if (e.key === 'Escape') setEditingId(null)
              }}
              onClick={e => e.stopPropagation()}
              className="w-full text-white text-xs px-2 py-0.5 rounded-lg outline-none"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.3)' }}
            />
          ) : (
            <p className="text-xs truncate font-medium">{conv.title}</p>
          )}
        </div>

        {editingId === conv.id ? (
          <div className="flex gap-1 shrink-0">
            <button onClick={e => { e.stopPropagation(); onRename(conv.id, editTitle); setEditingId(null) }} className="p-1 text-green-400"><Check size={10} /></button>
            <button onClick={e => { e.stopPropagation(); setEditingId(null) }} className="p-1 text-red-400"><X size={10} /></button>
          </div>
        ) : (
          <div className="hidden group-hover:flex gap-0.5 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onPin(conv.id, !conv.is_pinned) }}
              className="p-1 rounded transition-colors"
              style={{ color: conv.is_pinned ? '#facc15' : '#4a4a6a' }}
              title="Sabitle"
            ><Pin size={9} /></button>
            <button
              onClick={e => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title) }}
              className="p-1 rounded transition-colors"
              style={{ color: '#4a4a6a' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a4a6a')}
            ><Edit2 size={9} /></button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
              className="p-1 rounded transition-colors"
              style={{ color: '#4a4a6a' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a4a6a')}
            ><Trash2 size={9} /></button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full w-[280px] sm:w-72 min-w-[280px] relative overflow-hidden"
      style={{ background: 'rgba(4,3,8,0.99)', borderRight: '1px solid rgba(225,29,72,0.08)' }}
    >
      {/* Scan line effect */}
      <div className="scan-line" />

      {/* Top ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(225,29,72,0.06) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 relative"
        style={{ borderBottom: '1px solid rgba(225,29,72,0.08)' }}>
        <div className="relative w-9 h-9 shrink-0">
          <div className="absolute inset-0 rounded-xl blur-lg opacity-60"
            style={{ background: 'linear-gradient(135deg, #e11d48, #f97316)' }} />
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1a0810, #2a0c10)',
              border: '1px solid rgba(225,29,72,0.4)',
              boxShadow: '0 0 20px rgba(225,29,72,0.2)',
            }}>
            <Bot size={17} className="text-red-400" />
          </div>
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight gradient-text flicker">Kira AI</h1>
          <p className="text-[10px] tracking-wider" style={{ color: '#3a2030' }}>NEURAL v3.0</p>
        </div>
        <div className="ml-auto">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px]"
            style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', color: '#4ade80' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-glow" />
            <span>ONLINE</span>
          </div>
        </div>
      </div>

      {/* New Chat + Search */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition-all active:scale-[0.98] relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #e11d48, #f97316)',
            boxShadow: '0 4px 20px rgba(225,29,72,0.3)',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 28px rgba(225,29,72,0.55)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(225,29,72,0.3)')}
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
          <Plus size={16} />
          Yeni Sohbet
        </button>
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.1)', color: '#4a4060' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(225,29,72,0.3)'; e.currentTarget.style.color = '#94a3b8' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(225,29,72,0.1)'; e.currentTarget.style.color = '#4a4060' }}
        >
          <Search size={13} />
          <span className="text-xs">Mesajlarda ara... <kbd>Ctrl+F</kbd></span>
        </button>
      </div>

      {/* Folders */}
      <div className="px-3 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-1 mb-1.5" style={{ color: '#2a1820' }}>
          Klasörler
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFolder(null)}
            className="text-[10px] px-2.5 py-1 rounded-lg transition-all font-medium"
            style={{
              background: !activeFolder ? 'rgba(225,29,72,0.15)' : 'rgba(225,29,72,0.04)',
              border: `1px solid ${!activeFolder ? 'rgba(225,29,72,0.35)' : 'rgba(225,29,72,0.1)'}`,
              color: !activeFolder ? '#fda4af' : '#4a4060',
            }}
          >
            Tümü
          </button>
          {FOLDERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFolder(activeFolder === f ? null : f)}
              className="text-[10px] px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1"
              style={{
                background: activeFolder === f ? 'rgba(225,29,72,0.12)' : 'rgba(225,29,72,0.03)',
                border: `1px solid ${activeFolder === f ? 'rgba(225,29,72,0.3)' : 'rgba(225,29,72,0.08)'}`,
                color: activeFolder === f ? '#fda4af' : '#4a4060',
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: FOLDER_COLORS[f] }} />
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.1)' }}>
              <Sparkles size={20} style={{ color: 'rgba(225,29,72,0.3)' }} />
            </div>
            <p className="text-xs" style={{ color: '#2a1820' }}>
              {search ? 'Sonuç bulunamadı' : 'Henüz sohbet yok'}
            </p>
            {!search && (
              <p className="text-[10px] mt-1" style={{ color: '#1a1020' }}>
                Yeni sohbet başlatmak için butona tıkla
              </p>
            )}
          </div>
        )}

        {pinned.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold px-2 py-1 flex items-center gap-1.5 uppercase tracking-widest"
              style={{ color: '#2a1820' }}>
              <Pin size={8} className="text-yellow-500/40" />
              Sabitlenmiş
            </p>
            <div className="space-y-0.5">{pinned.map(c => <ConvItem key={c.id} conv={c} />)}</div>
          </div>
        )}

        {groups.map(g => (
          <div key={g.label}>
            <p className="text-[10px] font-semibold px-2 py-1 uppercase tracking-widest" style={{ color: '#1a1020' }}>
              {g.label}
            </p>
            <div className="space-y-0.5">{g.items.map(c => <ConvItem key={c.id} conv={c} />)}</div>
          </div>
        ))}
      </div>

      {/* Guest limit */}
      {isGuest && guestMessageCount >= guestMessageLimit * 0.8 && (
        <div className="px-3 pb-3">
          <button
            onClick={onGuestLimitClick}
            className="w-full rounded-xl p-3 text-left transition-all"
            style={{ background: 'rgba(225,29,72,0.05)', border: '1px solid rgba(225,29,72,0.15)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(225,29,72,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(225,29,72,0.15)')}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: '#f87171' }}>⚠️ Limit Dolmak Üzere</span>
              <span className="text-xs font-mono" style={{ color: '#f87171' }}>{guestMessageCount}/{guestMessageLimit}</span>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(225,29,72,0.1)' }}>
              <div className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((guestMessageCount / guestMessageLimit) * 100, 100)}%`,
                  background: 'linear-gradient(90deg, #e11d48, #f97316)',
                }} />
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(248,113,113,0.5)' }}>Sınırsız için giriş yap →</p>
          </button>
        </div>
      )}

      <UserMenu user={user} isGuest={isGuest} />
    </div>
  )
}
