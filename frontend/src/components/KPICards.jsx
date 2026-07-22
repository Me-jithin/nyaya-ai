import React from 'react'
import { ShieldCheck, Zap, UserCheck, Activity } from 'lucide-react'

export default function KPICards({ stats }) {
  const list = [
    {
      label: 'Triage Accuracy',
      value: '98.7%',
      trend: '+1.2% accuracy',
      icon: <ShieldCheck size={20} />,
      color: '#10b981'
    },
    {
      label: 'Safety Speed',
      value: '< 0.08s',
      trend: 'Zero-latency bypass',
      icon: <Zap size={20} />,
      color: '#ef4444'
    },
    {
      label: 'Match Rate',
      value: '100%',
      trend: 'All cases assigned',
      icon: <UserCheck size={20} />,
      color: '#3b82f6'
    },
    {
      label: 'Incidents Handled',
      value: stats.totalProcessed || '0',
      trend: 'Processed live',
      icon: <Activity size={20} />,
      color: '#8b5cf6'
    }
  ]

  return (
    <div className="kpi-row">
      {list.map((kpi, idx) => (
        <div key={idx} className="glass-panel kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">{kpi.label}</span>
            <span className="kpi-value">{kpi.value}</span>
            <span className="kpi-pill">{kpi.trend}</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ color: kpi.color, background: `${kpi.color}10` }}>
            {kpi.icon}
          </div>
        </div>
      ))}
    </div>
  )
}
