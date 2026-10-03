import { useState } from 'react'

/* ── Shared UI primitives (Particulier + Entreprise) ── */

export const selectStyle: React.CSSProperties = {
  padding: '7px 24px 7px 8px', borderRadius: 7, border: '1px solid #d1d5db',
  background: '#fff', fontSize: 14, width: '100%', cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 4l3 3 3-3' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center',
}

export interface SelectOption { value: string; label: string; cat?: string }

export function Sel({ value, onChange, options, grouped }: {
  value: string; onChange: (v: string) => void; options: SelectOption[]; grouped?: boolean
}) {
  if (grouped) {
    const cats = [...new Set(options.map(o => o.cat))]
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
        {cats.map(c => (
          <optgroup key={c} label={c}>
            {options.filter(o => o.cat === c).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    )
  }
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function NI({ value, onChange, suffix, step = 1, w = 68, title }: {
  value: number; onChange: (v: number) => void; suffix?: string; step?: number; w?: number; title?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }} title={title}>
      <input type="number" value={value} step={step} min={0}
        onChange={e => onChange(Number(e.target.value))}
        style={{ padding: '6px 5px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: w, textAlign: 'right' }} />
      {suffix && <span style={{ fontSize: 12, color: '#6b7280' }}>{suffix}</span>}
    </div>
  )
}

export function FL({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 12, color: '#6b7280', marginBottom: 1, display: 'block' }}>{children}</label>
}

export function SL({ color, icon, label, style: s }: { color: string; icon: string; label: string; style?: React.CSSProperties }) {
  return <h4 style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.04em', ...s }}>{icon} {label}</h4>
}

export function Tip({ text, children, align = 'center', interactive = false, below = false }: { text: React.ReactNode; children: React.ReactNode; align?: 'center' | 'left'; interactive?: boolean; below?: boolean }) {
  const [h, setH] = useState(false)
  const hPos = align === 'left' ? { left: 0 } : { left: '50%', transform: 'translateX(-50%)' }
  const vPos = below ? { top: '100%', marginTop: 4 } : { bottom: '50%' }
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
      {h && (
        <div style={{ position: 'absolute', ...vPos, ...hPos, background: '#1f2937', color: '#fff', padding: '6px 10px', borderRadius: 7, fontSize: 12, lineHeight: 1.4, width: interactive ? 300 : 260, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', pointerEvents: interactive ? 'auto' : 'none', textAlign: 'left' }}>
          {text}
        </div>
      )}
    </div>
  )
}


export function BarR({ value, max, color, label, suffix }: { value: number; max: number; color: string; label: string; suffix: string }) {
  return (
    <div style={{ marginBottom: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 1 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: '#1f2937' }}>{Math.round(value).toLocaleString('fr-FR')} {suffix}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

export function Badge({ grade, color, label, sub, tip }: { grade: string; color: string; label: string; sub: string; tip: string }) {
  return (
    <Tip text={tip}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'help' }}>
        <div style={{ width: 34, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: color, color: '#fff', fontWeight: 900, fontSize: 18, boxShadow: `0 2px 8px ${color}44` }}>{grade}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{sub} <span style={{ opacity: 0.5 }}>ⓘ</span></div>
        </div>
      </div>
    </Tip>
  )
}
