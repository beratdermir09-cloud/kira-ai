import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// /admin path'inde AdminPanel, diğerlerinde normal App
const isAdmin = window.location.pathname.startsWith('/admin')

if (isAdmin) {
  import('./components/AdminPanel').then(({ default: AdminPanel }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <AdminPanel />
      </React.StrictMode>
    )
  })
} else {
  import('./App').then(({ default: App }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
}
