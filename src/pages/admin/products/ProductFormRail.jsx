import React from 'react'
import { Check } from 'lucide-react'

export default function ProductFormRail({
  sections,
  activeSection,
  scrollToSection,
  requiredDone,
  requiredChecks
}) {
  return (
    <nav className="pform-rail" aria-label="Form sections">
      {sections.map((s, index) => (
        <button
          key={s.id}
          type="button"
          className={activeSection === s.id ? 'active' : ''}
          onClick={() => scrollToSection(s.id)}
        >
          <span className="pform-rail-num">{index + 1}</span>
          <span className="pform-rail-text">
            <strong>{s.label}</strong>
            <small>{s.hint}</small>
          </span>
        </button>
      ))}
      <div className="pform-rail-progress">
        <div className="pform-rail-progress-head">
          <span>Required</span>
          <strong>{requiredDone}/{requiredChecks.length}</strong>
        </div>
        <div className="pform-meter">
          <i style={{ width: `${(requiredDone / requiredChecks.length) * 100}%` }} />
        </div>
        <ul>
          {requiredChecks.map(c => (
            <li key={c.label} className={c.done ? 'done' : ''}>
              <Check size={12} aria-hidden="true" />
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
