import React from 'react'
import { X, Keyboard } from 'lucide-react'

interface ShortcutsModalProps {
  onClose: () => void
}

const shortcuts = [
  { keys: ['Ctrl', 'K'], desc: 'Yeni sohbet oluştur' },
  { keys: ['Ctrl', 'F'], desc: 'Mesajlarda ara' },
  { keys: ['Ctrl', '/'], desc: 'Kısayolları göster' },
  { keys: ['Enter'], desc: 'Mesaj gönder' },
  { keys: ['Shift', 'Enter'], desc: 'Yeni satır' },
  { keys: ['Esc'], desc: 'Modalı kapat' },
]

export default function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={18} className="text-indigo-400" />
            <h3 className="text-white font-semibold">Klavye Kısayolları</h3>
          </div>
          <button onClick={onClose} className="text-[#6b7280] hover:text-white"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[#94a3b8] text-sm">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-2 py-0.5 bg-[#2a2a3e] border border-[#3a3a5e] rounded text-xs text-[#94a3b8] font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
