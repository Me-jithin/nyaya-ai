import React, { useState } from 'react'
import { Users, Search } from 'lucide-react'

export default function ResourceAllocator({ resources }) {
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.entity_name.toLowerCase().includes(search.toLowerCase()) || 
                          res.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || res.jurisdiction === filterType;
    return matchesSearch && matchesType;
  })

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={18} style={{ color: 'var(--accent-success)' }} />
            <span>Advocate & Station Resource Pool</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time availability of dispatched police stations and advocates</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select 
            className="form-input" 
            style={{ width: '130px', fontSize: '0.8rem', height: '34px', padding: '0 0.5rem' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Sectors</option>
            <option value="emergency_police">Emergency Police</option>
            <option value="property_civil">Civil / Property</option>
            <option value="labor_employment">Labor Rights</option>
          </select>

          <div style={{ position: 'relative', width: '180px' }}>
            <input 
              type="text" 
              placeholder="Search resource..." 
              className="form-input" 
              style={{ paddingLeft: '2.2rem', fontSize: '0.8rem', height: '34px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Entity / Organization Name</th>
              <th>Sector / Category</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.length > 0 ? (
              filteredResources.map((res, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{res.entity_name}</td>
                  <td style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    {res.jurisdiction.replace('_', ' ')}
                  </td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{res.location}</td>
                  <td>
                    <span className={`status-badge ${res.status.toLowerCase()}`}>
                      <span style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: res.status === 'available' ? 'var(--accent-success)' : 'var(--accent-warning)',
                        display: 'inline-block' 
                      }}></span>
                      {res.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  No resources found in current pool.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
