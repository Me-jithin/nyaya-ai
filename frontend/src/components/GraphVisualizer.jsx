import React from 'react'
import { ArrowRight, FileInput, Compass, BookOpen, AlertTriangle, Home, Briefcase, UserCheck, CheckCircle } from 'lucide-react'

export default function GraphVisualizer({ activeNode, category }) {
  // Nodes in our LangGraph state machine:
  // - intake
  // - router
  // - law_finder
  // - branch (emergency_police, property_civil, labor_employment)
  // - allocator
  // - end

  const getStatus = (nodeName) => {
    if (!activeNode) return 'inactive'
    if (activeNode === nodeName) return 'active'
    
    // Simple state flow hierarchy to show completed nodes
    const order = ['intake', 'router', 'law_finder', 'branch', 'allocator', 'end']
    const activeIndex = order.indexOf(activeNode)
    const nodeIndex = order.indexOf(nodeName)
    
    if (activeIndex > nodeIndex) return 'completed'
    return 'inactive'
  }

  const getBranchStatus = (branchType) => {
    if (activeNode === 'branch' && category === branchType) {
      return branchType === 'emergency_police' ? 'emergency-active' : 'active'
    }
    if (getStatus('branch') === 'completed' && category === branchType) {
      return 'completed'
    }
    return 'inactive'
  }

  return (
    <div className="glass-panel graph-container">
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>LangGraph Active Flow Pipeline</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visualizes the agentic state machine execution in real-time</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
        {/* Row 1: Intake -> Router -> Law Finder */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className={`node ${getStatus('intake')}`}>
            <FileInput size={16} />
            <span>Intake Node</span>
          </div>

          <div className="connector-arrow"><ArrowRight size={16} /></div>

          <div className={`node ${getStatus('router')}`}>
            <Compass size={16} />
            <span>Router & Guardrails</span>
          </div>

          <div className="connector-arrow"><ArrowRight size={16} /></div>

          <div className={`node ${getStatus('law_finder')}`}>
            <BookOpen size={16} />
            <span>Law Finder</span>
          </div>
        </div>

        {/* Dynamic Branch Splitter Row */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 2rem' }}>
          <div style={{ borderLeft: '2px dashed var(--border-subtle)', height: '16px' }}></div>
          <div style={{ width: '80%', borderTop: '2px dashed var(--border-subtle)', height: '16px' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '90%', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Branch 1: Emergency */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className={`node ${getBranchStatus('emergency_police')}`}>
                <AlertTriangle size={16} />
                <span>Emergency Police</span>
              </div>
            </div>

            {/* Branch 2: Property/Civil */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className={`node ${getBranchStatus('property_civil')}`}>
                <Home size={16} />
                <span>Property / Civil</span>
              </div>
            </div>

            {/* Branch 3: Labor/Employment */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className={`node ${getBranchStatus('labor_employment')}`}>
                <Briefcase size={16} />
                <span>Labor & Employment</span>
              </div>
            </div>
          </div>
          
          <div style={{ width: '80%', borderBottom: '2px dashed var(--border-subtle)', height: '16px' }}></div>
          <div style={{ borderLeft: '2px dashed var(--border-subtle)', height: '16px' }}></div>
        </div>

        {/* Row 3: Allocator -> End */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <div className={`node ${getStatus('allocator')}`}>
            <UserCheck size={16} />
            <span>Resource Allocator</span>
          </div>

          <div className="connector-arrow"><ArrowRight size={16} /></div>

          <div className={`node ${getStatus('end')}`}>
            <CheckCircle size={16} />
            <span>Dispatch Completed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
