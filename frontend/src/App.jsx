import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import KPICards from './components/KPICards'
import TriageConsole from './components/TriageConsole'
import GraphVisualizer from './components/GraphVisualizer'
import LawBookPortal from './components/LawBookPortal'
import ResourceAllocator from './components/ResourceAllocator'
import { ShieldAlert, BookOpen, Users, Compass, HelpCircle } from 'lucide-react'

export default function App() {
  const [isDark, setIsDark] = useState(true)
  const [activeTab, setActiveTab] = useState('triage')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [mockMode, setMockMode] = useState(true) // Default to mock mode or true to make it friendly

  // Dynamic DB states
  const [resources, setResources] = useState([])
  const [laws, setLaws] = useState([])
  
  // Triage state
  const [triageLogs, setTriageLogs] = useState([])
  const [result, setResult] = useState(null)
  const [activeNode, setActiveNode] = useState(null) // intake, router, law_finder, branch, allocator, end
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ totalProcessed: 0 })

  // Toggle Theme
  const handleToggleTheme = () => {
    setIsDark(!isDark)
    if (isDark) {
      document.body.classList.remove('dark')
      document.body.classList.add('light')
    } else {
      document.body.classList.remove('light')
      document.body.classList.add('dark')
    }
  }

  // Fetch initial configuration and CSV databases
  const fetchData = async () => {
    try {
      // 1. Check API Key
      const confRes = await fetch('/api/config')
      if (confRes.ok) {
        const confData = await confRes.json()
        setApiKeyConfigured(confData.api_key_configured)
        if (confData.api_key_configured) {
          setMockMode(false) // Disable mock mode if key is configured
        }
      }

      // 2. Load Resources
      const resRes = await fetch('/api/resources')
      if (resRes.ok) {
        const resData = await resRes.json()
        setResources(resData)
        // Count busy ones to deduce statistics if needed
        const processedCount = resData.filter(r => r.status === 'busy').length
        setStats({ totalProcessed: processedCount })
      }

      // 3. Load Law Book
      const lawRes = await fetch('/api/laws')
      if (lawRes.ok) {
        const lawData = await lawRes.json()
        setLaws(lawData)
      }
    } catch (err) {
      console.error("Error fetching initial database state: ", err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Action: Triage intake statement processing
  const handleTriageStart = async (formData) => {
    setLoading(true)
    setResult(null)
    setTriageLogs([])
    setCategory('')
    
    // Animate Graph nodes step-by-step with delay
    const steps = [
      { node: 'intake', delay: 600, log: '📥 [Intake Node] Capturing statement parameters...' },
      { node: 'router', delay: 1000, log: '🧠 [Router Node] Evaluating safety guardrails and classification...' },
      { node: 'law_finder', delay: 900, log: '📖 [Law Finder Node] Checking digital law book for relevant acts...' },
      { node: 'branch', delay: 800, log: '⚖️ Routing to specialized category branch handling...' },
      { node: 'allocator', delay: 600, log: '📌 [Resource Allocator Node] Matching available advocates or stations...' }
    ]

    let currentLogBuffer = []

    for (let step of steps) {
      setActiveNode(step.node)
      currentLogBuffer = [...currentLogBuffer, step.log]
      setTriageLogs(currentLogBuffer)
      await new Promise(r => setTimeout(r, step.delay))
    }

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error("Backend classification node error.")
      }

      const data = await response.json()
      
      // Complete animation & load results
      setCategory(data.category)
      setActiveNode('end')
      
      // Update logs with backend's trace logs
      setTriageLogs(data.logs)
      setResult(data)

      // Refresh resource pool display
      const resRes = await fetch('/api/resources')
      if (resRes.ok) {
        const resData = await resRes.json()
        setResources(resData)
        const processedCount = resData.filter(r => r.status === 'busy').length
        setStats({ totalProcessed: processedCount })
      }

    } catch (err) {
      console.error(err)
      setTriageLogs(prev => [...prev, `❌ Error: ${err.message || 'System error during execution node.'}`])
      setActiveNode(null)
    } finally {
      setLoading(false)
    }
  }

  // Action: Reset resource database
  const handleResetResources = async () => {
    try {
      const response = await fetch('/api/resources/reset', { method: 'POST' })
      if (response.ok) {
        const resRes = await fetch('/api/resources')
        if (resRes.ok) {
          const resData = await resRes.json()
          setResources(resData)
          setStats({ totalProcessed: 0 })
          setResult(null)
          setTriageLogs([])
          setActiveNode(null)
          setCategory('')
        }
      }
    } catch (err) {
      console.error("Failed resetting resource database state:", err)
    }
  }

  // Action: Save API settings
  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!apiKeyInput.trim()) return

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKeyInput })
      })

      if (response.ok) {
        setApiKeyConfigured(true)
        setMockMode(false)
        setIsSettingsOpen(false)
        setApiKeyInput('')
        alert('Groq API Key configured successfully!')
      } else {
        alert('Failed to configure Groq API Key.')
      }
    } catch (err) {
      console.error(err)
      alert('Error updating API Key settings.')
    }
  }

  return (
    <div className="app-container">
      {/* Top Banner Navigation */}
      <Header 
        isDark={isDark} 
        onToggleTheme={handleToggleTheme} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        apiKeyConfigured={apiKeyConfigured}
      />

      {/* KPI Info row */}
      <KPICards stats={stats} />

      {/* Tabs list selector */}
      <div className="tabs-navigation">
        <button 
          onClick={() => setActiveTab('triage')} 
          className={`tab-trigger ${activeTab === 'triage' ? 'active' : ''}`}
        >
          <Compass size={16} />
          Triage Console
        </button>
        <button 
          onClick={() => setActiveTab('laws')} 
          className={`tab-trigger ${activeTab === 'laws' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          Digital Law Book
        </button>
        <button 
          onClick={() => setActiveTab('resources')} 
          className={`tab-trigger ${activeTab === 'resources' ? 'active' : ''}`}
        >
          <Users size={16} />
          Resource Pool
        </button>
      </div>

      {/* Main Container Panels */}
      <main style={{ minHeight: '500px' }}>
        {activeTab === 'triage' && (
          <div className="dashboard-grid">
            <TriageConsole 
              onTriageStart={handleTriageStart}
              onResetResources={handleResetResources}
              triageLogs={triageLogs}
              result={result}
              loading={loading}
              mockMode={mockMode}
              setMockMode={setMockMode}
              apiKeyConfigured={apiKeyConfigured}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <GraphVisualizer activeNode={activeNode} category={category} />
              
              {/* SDG 16 Educational Banner Card */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-primary)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
                  <ShieldAlert size={16} />
                  UN SDG 16: Equal Access to Justice
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  NyayaAI directly targets <strong>SDG Goal 16.3</strong>: promoting the rule of law and ensuring equal access to justice. 
                  By providing instant legal classification, citing applicable acts, and routing emergencies straight to responders, we resolve legal complexity and keep dispatch helplines clear.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'laws' && <LawBookPortal laws={laws} />}

        {activeTab === 'resources' && <ResourceAllocator resources={resources} />}
      </main>

      {/* Settings Drawer Slide-out overlay */}
      <div className={`drawer-overlay ${isSettingsOpen ? 'open' : ''}`} onClick={() => setIsSettingsOpen(false)}>
        <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
          <div className="drawer-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Settings & Configuration</h3>
            <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>×</button>
          </div>
          
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Groq API Key</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="gsk_..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                required
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Paste your Groq API Key to invoke the Llama 3.3 70B model. Keys are saved securely to your local backend config.
              </p>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Settings
            </button>
          </form>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-warning)', marginBottom: '0.5rem' }}>
              <HelpCircle size={14} />
              Testing Tip
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              If you don't have a Groq key right now, simply check the <strong>Mock Classifier</strong> checkbox in the Triage Console. The app will run local rule-based category checks automatically!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
