import React from 'react'
import { LogOut, LogIn, User as UserIcon, Shield } from 'lucide-react'
import { User, signInWithGoogle, signOutUser } from '../firebase'

interface UserMenuProps {
  user?: User | null
  isGuest?: boolean
}

export default function UserMenu({ user, isGuest }: UserMenuProps) {
  return (
    <div className="p-3 relative" style={{ borderTop: '1px solid rgba(225,29,72,0.08)' }}>
      {/* Top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(225,29,72,0.3), transparent)' }} />

      {user ? (
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-xl"
              style={{ border: '1px solid rgba(225,29,72,0.3)', boxShadow: '0 0 10px rgba(225,29,72,0.15)' }}
            />
          ) : (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(225,29,72,0.1)', border: '1px solid rgba(225,29,72,0.25)' }}>
              <UserIcon size={15} style={{ color: '#fda4af' }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-white/80">{user.displayName || user.email}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield size={9} style={{ color: '#e11d48' }} />
              <p className="text-[10px]" style={{ color: '#3a2030' }}>Pro Plan</p>
            </div>
          </div>
          <button
            onClick={signOutUser}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#3a2030' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3a2030')}
            title="Çıkış Yap"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-center uppercase tracking-widest font-bold" style={{ color: '#2a1820' }}>
            Misafir Modu
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-white text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #e11d48, #f97316)',
              boxShadow: '0 4px 15px rgba(225,29,72,0.25)',
            }}
          >
            <LogIn size={14} />
            Giriş Yap
          </button>
        </div>
      )}
    </div>
  )
}
