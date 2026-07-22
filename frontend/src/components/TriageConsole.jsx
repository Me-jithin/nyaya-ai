import React, { useState, useEffect, useRef } from 'react'
import { Shield, Send, Terminal, Printer, RefreshCw, AlertOctagon } from 'lucide-react'

export default function TriageConsole({ 
  onTriageStart, 
  onResetResources,
  triageLogs, 
  result, 
  loading, 
  mockMode, 
  setMockMode,
  apiKeyConfigured
}) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [query, setQuery] = useState('')
  const [realtimeEmergency, setRealtimeEmergency] = useState(false)
  const logsEndRef = useRef(null)
  const [locating, setLocating] = useState(false)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
          if (response.ok) {
            const data = await response.json()
            const addr = data.address
            const resolvedLoc = addr.city || addr.town || addr.suburb || addr.village || addr.municipality || addr.state || "Kottayam"
            setLocation(resolvedLoc)
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          }
        } catch (err) {
          console.error("Reverse geocoding failed: ", err)
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        console.error("Geolocation failed: ", err)
        alert(`Location access failed: ${err.message}`)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const emergencyKeywords = ["violence", "attack", "bleeding", "threat", "weapon", "kill", "assault", "beating", "help", "rape", "robbery"]

  // Real-time emergency detection helper
  useEffect(() => {
    const queryLower = query ? query.toLowerCase() : ''
    const matches = emergencyKeywords.filter(kw => queryLower.includes(kw))
    setRealtimeEmergency(matches.length > 0)
  }, [query])

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [triageLogs])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !location.trim() || !query.trim()) return
    onTriageStart({ name, location, query, mockMode })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Autonomous Legal Intake Console</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Input legal grievance or request immediate dispatch aid</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={mockMode} 
                onChange={(e) => setMockMode(e.target.checked)}
                disabled={loading}
              />
              <span>Mock Classifier</span>
            </label>
            <button 
              onClick={onResetResources} 
              className="theme-btn" 
              title="Reset Resource pool availability"
              style={{ padding: '0.4rem 0.6rem', display: 'flex', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600 }}
              disabled={loading}
            >
              <RefreshCw size={12} />
              Reset Pool
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Citizen Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Rahul Sharma" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Current Jurisdiction / City</label>
                <button 
                  type="button" 
                  onClick={handleGetLocation} 
                  disabled={locating || loading}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--accent-primary)', 
                    cursor: 'pointer', 
                    fontSize: '0.75rem', 
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  {locating ? '⌛ Locating...' : '📍 Locate Me'}
                </button>
              </div>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Karukachal" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Describe your dispute or emergency situation</label>
            <textarea 
              className="form-textarea" 
              placeholder="e.g. My landlord has locked the main gates and is threatening to evict me without notice..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              required
              disabled={loading}
            />
            {realtimeEmergency && (
              <div style={{ 
                position: 'absolute', 
                bottom: '10px', 
                right: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: 'var(--accent-error)', 
                background: 'rgba(239, 68, 68, 0.12)', 
                border: '1px solid rgba(239, 68, 68, 0.3)', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px' 
              }}>
                <AlertOctagon size={12} />
                Emergency Keywords Detected
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.85rem' }} 
            disabled={loading || !name || !location || !query}
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                <span>Running Agentic Nodes...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>File Intake Statement & Run Pipeline</span>
              </>
            )}
          </button>
        </form>

        {/* Live Logs console */}
        {(triageLogs.length > 0 || loading) && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <Terminal size={14} />
              <span>Real-Time Node Execution Logs</span>
            </div>
            <div className="logs-console">
              {triageLogs.map((log, index) => (
                <div key={index} className="log-line">
                  {log}
                </div>
              ))}
              {loading && <div className="log-line" style={{ color: 'var(--text-muted)' }}>⌛ Executing next agent state...</div>}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Ticket Card */}
      {result && !loading && (
        <div className={`ticket-container ${result.category === 'emergency_police' ? 'emergency' : ''}`}>
          <div className="ticket-header">
            <div className="ticket-title" style={{ color: result.category === 'emergency_police' ? 'var(--accent-error)' : 'var(--accent-success)' }}>
              <Shield size={18} />
              <span>NYAYAAI OFFICIAL DISPATCH PASS</span>
            </div>
            <button onClick={handlePrint} className="theme-btn" style={{ padding: '0.4rem', display: 'flex', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <Printer size={12} />
              Print
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="ticket-row">
              <span className="ticket-label">Citizen Name</span>
              <span className="ticket-value highlight">{result.name}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Location / Area</span>
              <span className="ticket-value">{result.location}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Classification</span>
              <span className="ticket-value" style={{ 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                color: result.category === 'emergency_police' ? 'var(--accent-error)' : 'var(--accent-success)' 
              }}>
                {result.category.replace('_', ' ')}
              </span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Reasoning</span>
              <span className="ticket-value" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>{result.reasoning}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Applicable Law</span>
              <span className="ticket-value highlight" style={{ color: 'var(--accent-primary)' }}>{result.applicable_law}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Rights Guidance</span>
              <span className="ticket-value" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                {result.rights_summary}
              </span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Assigned Entity</span>
              <span className="ticket-value highlight" style={{ color: 'var(--accent-success)', fontWeight: 700 }}>
                {result.assigned_entity}
              </span>
            </div>
            {result.assigned_phone && (
              <div className="ticket-row">
                <span className="ticket-label">Contact Phone</span>
                <span className="ticket-value highlight">
                  <a href={`tel:${result.assigned_phone}`} style={{ color: 'var(--accent-success)', textDecoration: 'none', fontWeight: 700 }}>
                    {result.assigned_phone} 📞 Call Now
                  </a>
                </span>
              </div>
            )}
            {result.assigned_email && (
              <div className="ticket-row">
                <span className="ticket-label">Contact Email</span>
                <span className="ticket-value highlight">
                  <a href={`mailto:${result.assigned_email}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                    {result.assigned_email} ✉️ Write Email
                  </a>
                </span>
              </div>
            )}
            
            {/* Interactive Map Embed */}
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <span className="ticket-label" style={{ display: 'block', marginBottom: '0.5rem' }}>📍 Dispatch Map Coordinates</span>
              <iframe 
                src={`https://maps.google.com/maps?q=${encodeURIComponent(result.assigned_entity + ' ' + result.location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                width="100%" 
                height="200" 
                style={{ border: 0, borderRadius: '8px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }} 
                allowFullScreen="" 
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
