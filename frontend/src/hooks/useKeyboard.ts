import { useEffect } from 'react'

interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : true
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey || !s.shift
        const altMatch = s.alt ? e.altKey : true
        if (
          e.key.toLowerCase() === s.key.toLowerCase() &&
          ctrlMatch && shiftMatch && altMatch
        ) {
          e.preventDefault()
          s.action()
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}

export const SHORTCUTS: Omit<Shortcut, 'action'>[] = [
  { key: 'k', ctrl: true, description: 'Yeni sohbet' },
  { key: 'f', ctrl: true, description: 'Mesaj ara' },
  { key: '/', ctrl: true, description: 'Kısayolları göster' },
  { key: 'Escape', description: 'Kapat / İptal' },
]
