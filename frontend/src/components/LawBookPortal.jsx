import React, { useState } from 'react'
import { BookOpen, Search } from 'lucide-react'

export default function LawBookPortal({ laws }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLaws = laws.filter(item => 
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.applicable_act.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.rights_summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BookOpen size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Digital Law & Rights Portal</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Explore constitutional codes, legal acts and rights summaries</p>
        </div>

        <div style={{ position: 'relative', width: '220px' }}>
          <input 
            type="text" 
            placeholder="Search acts/laws..." 
            className="form-input" 
            style={{ paddingLeft: '2rem', fontSize: '0.85rem', paddingRight: '0.5rem', height: '34px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Category</th>
              <th style={{ width: '30%' }}>Applicable Legal Code</th>
              <th style={{ width: '50%' }}>Rights Summary Guidance</th>
            </tr>
          </thead>
          <tbody>
            {filteredLaws.length > 0 ? (
              filteredLaws.map((law, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {law.category.replace('_', ' ')}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {law.applicable_act}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {law.rights_summary}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No matching acts found in database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
