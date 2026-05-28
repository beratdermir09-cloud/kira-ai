import React, { useState } from 'react'
import { ChevronDown, Download, X, Keyboard, Sliders, Menu, GitCompare } from 'lucide-react'
import { Model, Conversation, KiraPersonality } from '../types'

const PERSONALITIES: { id: KiraPersonality; emoji: string; label: string; description: string }[] = [
  { id: 'default',   emoji: '✨', label: 'Varsayılan', description: 'Samimi ve dengeli Kira' },
  { id: 'serious',   emoji: '🎯', label: 'Ciddi',      description: 'Profesyonel, net, emojisiz' },
  { id: 'funny',     emoji: '😄', label: 'Esprili',    description: 'Neşeli, eğlenceli, komik' },
  { id: 'technical', emoji: '⚙️', label: 'Teknik',     description: 'Derin, detaylı, uzman' },
]

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], desc: 'Yeni sohbet oluştur' },
  { keys: ['Ctrl', 'F'], desc: 'Mesajlarda ara' },
  { keys: ['Enter'],     desc: 'Mesaj gönder' },
  { keys: ['Shift', 'Enter'], desc: 'Yeni satır' },
  { keys: ['Esc'],       desc: 'Modalı kapat' },
]

interface HeaderProps {
  title: string
  models: Model[]
  selectedModel: string
  onModelChange: (model: string) => void
  conversation: Conversation | null
  onClearChat: () => void
  onExport: () => void
  onShare: () => void
  temperature: number
  onTemperatureChange: (v: number) => void
  darkMode: boolean
  onToggleTheme: () => void
  onShowShortcuts: () => void
  onMenuClick?: () => void
  compareMode?: boolean
  onToggleCompare?: () => void
  compareModelA?: string
  compareModelB?: string
  onCompareModelAChange?: (m: string) => void
  onCompareModelBChange?: (m: string) => void
  personality?: KiraPersonality
  onPersonalityChange?: (p: KiraPersonality) => void
  isGuest?: boolean
}

export default function Header({
  title, models, selectedModel, onModelChange,
  conversation, onExport,
  temperature, onTemperatureChange,
  onMenuClick,
  compareMode, onToggleCompare,
  compareModelA, compareModelB,
  onCompareModelAChange, onCompareModelBChange,
  personality = 'default', onPersonalityChange, isGuest = false,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'general' | 'compare' | 'shortcuts'>('general')
  const hasMessages = (conversation?.messages?.length ?? 0) > 0
  const activePersonality = PERSONALITIES.find(p => p.id === personality) || PERSONALITIES[0]

  const Btn = ({
    onClick, children, title: t, hoverColor = '#fda4af', active = false,
  }: {
    onClick: () => void; children: React.ReactNode; title?: string
    hoverColor?: string; active?: boolean
  }) => (
    <button
      onClick={onClick}
      title={t}
      className="p-1.5 rounded-xl transition-all"
      style={{
        background: active ? 'rgba(225,29,72,0.12)' : 'rgba(225,29,72,0.04)',
        border: `1px solid ${active ? 'rgba(225,29,72,0.35)' : 'rgba(225,29,72,0.1)'}`,
        color: active ? '#fda4af' : '#4a4060',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={e => (e.currentTarget.style.color = active ? '#fda4af' : '#4a4060')}
    >
      {children}
    </button>
  )

  const SelectBox = ({
    value, onChange, label,
  }: { value: string; onChange: (v: string) => void; label?: string }) => (
    <div className="relative flex items-center gap-1.5">
      {label && <span className="text-[10px] font-mono" style={{ color: '#4a4060' }}>{label}</span>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none text-xs px-3 py-1.5 pr-7 rounded-xl outline-none cursor-pointer transition-all"
        style={{
          background: 'rgba(225,29,72,0.04)',
          border: '1px solid rgba(225,29,72,0.12)',
          color: '#94a3b8',
        }}
      >
        {models.map(m => (
          <option key={m.id} value={m.id} style={{ background: '#0a0812' }}>{m.name}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4a4060' }} />
    </div>
  )

  const Tab = ({ id, label }: { id: typeof settingsTab; label: string }) => (
    <button
      onClick={() => setSettingsTab(id)}
      className="flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-all"
      style={{
        background: settingsTab === id ? 'rgba(225,29,72,0.12)' : 'transparent',
        color: settingsTab === id ? '#fda4af' : '#4a4060',
        border: settingsTab === id ? '1px solid rgba(225,29,72,0.3)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  )

  return (
    <div className="relative">
      <div
        className="flex items-center justify-between px-4 py-2.5 relative"
        style={{
          background: 'rgba(4,3,8,0.97)',
          borderBottom: '1px solid rgba(225,29,72,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Glow line top */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.3), transparent)' }} />

        {/* Left */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.1)', color: '#4a4060' }}
          >
            <Menu size={15} />
          </button>
          <div className="w-1.5 h-1.5 rounded-full hidden sm:block"
            style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.8)' }} />
          <h2 className="font-semibold text-sm truncate max-w-[130px] sm:max-w-[200px]" style={{ color: '#e2e8f0' }}>
            {title}
          </h2>
          {/* Aktif kişilik badge */}
          {!isGuest && personality && personality !== 'default' && (
            <button
              onClick={() => { setShowSettings(true); setSettingsTab('general') }}
              className="hidden sm:flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono tracking-wider transition-all"
              style={{
                background: 'rgba(225,29,72,0.08)',
                border: '1px solid rgba(225,29,72,0.2)',
                color: '#fda4af',
              }}
              title="Kişiliği değiştir"
            >
              <span>{activePersonality.emoji}</span>
              <span>{activePersonality.label.toUpperCase()}</span>
            </button>
          )}
          {compareMode && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono tracking-wider"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.25)', color: '#fda4af' }}>
              KARŞILAŞTIRMA
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
          {compareMode ? (
            <>
              <SelectBox value={compareModelA || selectedModel} onChange={v => onCompareModelAChange?.(v)} label="A:" />
              <span className="text-[10px] hidden sm:block" style={{ color: '#3a2030' }}>vs</span>
              <SelectBox value={compareModelB || selectedModel} onChange={v => onCompareModelBChange?.(v)} label="B:" />
            </>
          ) : (
            <div className="hidden sm:block">
              <SelectBox value={selectedModel} onChange={onModelChange} />
            </div>
          )}

          <Btn onClick={() => setShowSettings(!showSettings)} title="Ayarlar" active={showSettings}>
            <Sliders size={14} />
          </Btn>

          {hasMessages && (
            <Btn onClick={onExport} title="Dışa aktar" hoverColor="#4ade80">
              <Download size={14} />
            </Btn>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          className="absolute right-4 top-14 z-50 rounded-2xl p-5 w-80 shadow-2xl"
          style={{
            background: 'rgba(6,4,12,0.98)',
            border: '1px solid rgba(225,29,72,0.2)',
            backdropFilter: 'blur(40px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(225,29,72,0.06)',
          }}
        >
          {/* Top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.5), transparent)' }} />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-white flex items-center gap-2">
              <Sliders size={13} style={{ color: '#e11d48' }} />
              Ayarlar
            </h3>
            <button onClick={() => setShowSettings(false)} style={{ color: '#4a4060' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a4060')}>
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.08)' }}>
            <Tab id="general"   label="Genel" />
            <Tab id="compare"   label="Karşılaştır" />
            <Tab id="shortcuts" label="Kısayollar" />
          </div>

          {/* ── GENEL TAB ── */}
          {settingsTab === 'general' && (
            <>
              {/* Temperature */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Yaratıcılık</label>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(225,29,72,0.1)', color: '#fda4af' }}>
                    {temperature.toFixed(1)}
                  </span>
                </div>
                <input type="range" min="0" max="1" step="0.1" value={temperature}
                  onChange={e => onTemperatureChange(parseFloat(e.target.value))} className="w-full" />
                <div className="flex justify-between text-[10px] mt-2" style={{ color: '#2a1820' }}>
                  <span>Kesin</span><span>Yaratıcı</span>
                </div>
              </div>

              {/* Kişilik Seçici */}
              {!isGuest && onPersonalityChange && (
                <div>
                  <label className="text-xs font-medium block mb-3" style={{ color: '#94a3b8' }}>
                    Kira'nın Kişiliği
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERSONALITIES.map(p => (
                      <button
                        key={p.id}
                        onClick={() => onPersonalityChange(p.id)}
                        className="flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all"
                        style={{
                          background: personality === p.id ? 'rgba(225,29,72,0.12)' : 'rgba(225,29,72,0.03)',
                          border: `1px solid ${personality === p.id ? 'rgba(225,29,72,0.45)' : 'rgba(225,29,72,0.1)'}`,
                        }}
                        onMouseEnter={e => { if (personality !== p.id) e.currentTarget.style.borderColor = 'rgba(225,29,72,0.3)' }}
                        onMouseLeave={e => { if (personality !== p.id) e.currentTarget.style.borderColor = 'rgba(225,29,72,0.1)' }}
                      >
                        <span className="text-base mb-0.5">{p.emoji}</span>
                        <span className="text-xs font-semibold" style={{ color: personality === p.id ? '#fda4af' : '#94a3b8' }}>
                          {p.label}
                        </span>
                        <span className="text-[10px] leading-tight mt-0.5" style={{ color: '#3a2030' }}>
                          {p.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── KARŞILAŞTIR TAB ── */}
          {settingsTab === 'compare' && (
            <div>
              <p className="text-xs mb-4" style={{ color: '#4a4060' }}>
                Aynı soruyu iki farklı modele aynı anda sor, yanıtları yan yana gör.
              </p>

              {/* Model seçiciler */}
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-[10px] font-mono mb-1.5 block" style={{ color: '#4a4060' }}>MODEL A</label>
                  <div className="relative">
                    <select
                      value={compareModelA || selectedModel}
                      onChange={e => onCompareModelAChange?.(e.target.value)}
                      className="w-full appearance-none text-xs px-3 py-2 pr-7 rounded-xl outline-none cursor-pointer"
                      style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.15)', color: '#94a3b8' }}
                    >
                      {models.map(m => <option key={m.id} value={m.id} style={{ background: '#0a0812' }}>{m.name}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4a4060' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-mono mb-1.5 block" style={{ color: '#4a4060' }}>MODEL B</label>
                  <div className="relative">
                    <select
                      value={compareModelB || selectedModel}
                      onChange={e => onCompareModelBChange?.(e.target.value)}
                      className="w-full appearance-none text-xs px-3 py-2 pr-7 rounded-xl outline-none cursor-pointer"
                      style={{ background: 'rgba(225,29,72,0.04)', border: '1px solid rgba(225,29,72,0.15)', color: '#94a3b8' }}
                    >
                      {models.map(m => <option key={m.id} value={m.id} style={{ background: '#0a0812' }}>{m.name}</option>)}
                    </select>
                    <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#4a4060' }} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => { onToggleCompare?.(); setShowSettings(false) }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: compareMode ? 'rgba(225,29,72,0.15)' : 'linear-gradient(135deg, rgba(225,29,72,0.8), rgba(249,115,22,0.8))',
                  border: '1px solid rgba(225,29,72,0.4)',
                  color: compareMode ? '#fda4af' : 'white',
                }}
              >
                <GitCompare size={12} className="inline mr-1.5" />
                {compareMode ? 'Karşılaştırmayı Kapat' : 'Karşılaştırmayı Başlat'}
              </button>
            </div>
          )}

          {/* ── KISAYOLLAR TAB ── */}
          {settingsTab === 'shortcuts' && (
            <div className="space-y-2.5">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                  style={{ background: 'rgba(225,29,72,0.03)' }}>
                  <span className="text-xs" style={{ color: '#94a3b8' }}>{s.desc}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <kbd key={j} className="px-2 py-0.5 rounded text-[10px] font-mono"
                        style={{ background: 'rgba(225,29,72,0.08)', border: '1px solid rgba(225,29,72,0.2)', color: '#fda4af' }}>
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
