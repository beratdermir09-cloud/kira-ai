import React from 'react'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  dark: boolean
  onToggle: () => void
}

export default function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="p-1.5 rounded-lg bg-[#1e1e2e] border border-[#2a2a3e] text-[#6b7280] hover:text-white hover:border-indigo-500 transition-colors"
      title={dark ? 'Açık tema' : 'Koyu tema'}
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
