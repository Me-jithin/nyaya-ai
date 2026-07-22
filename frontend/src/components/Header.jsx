import React from 'react'
import { Sun, Moon, Settings, Shield } from 'lucide-react'

export default function Header({ isDark, onToggleTheme, onOpenSettings, apiKeyConfigured }) {
  return (
    <header className="glass-panel" style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #2563eb, #10b981)', 
          padding: '0.75rem', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <Shield size={24} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(to right, var(--text-primary), var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NyayaAI</h1>
            <span style={{ 
              fontSize: '0.7rem', 
              fontWeight: 700, 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6', 
              padding: '0.2rem 0.5rem', 
              borderRadius: '9999px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              SDG 16
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Agentic Legal Aid & Emergency Dispatch System</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '6px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: apiKeyConfigured ? 'var(--accent-success)' : 'var(--accent-warning)',
            boxShadow: apiKeyConfigured ? '0 0 8px var(--accent-success)' : '0 0 8px var(--accent-warning)'
          }}></span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {apiKeyConfigured ? 'Groq Active' : 'Mock Mode Fallback'}
          </span>
        </div>

        {/* Theme Toggle */}
        <button onClick={onToggleTheme} className="theme-btn" title="Toggle Theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings Toggle */}
        <button onClick={onOpenSettings} className="theme-btn" title="Settings" style={{ background: apiKeyConfigured ? 'transparent' : 'rgba(245,158,11,0.08)', borderColor: apiKeyConfigured ? 'var(--border-subtle)' : 'rgba(245,158,11,0.3)' }}>
          <Settings size={18} style={{ color: apiKeyConfigured ? 'inherit' : 'var(--accent-warning)' }} />
        </button>
      </div>
    </header>
  )
}
