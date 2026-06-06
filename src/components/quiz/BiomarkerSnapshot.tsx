'use client'
import { useState } from 'react'
import type { BiomarkerRisk } from '@/lib/biomarkerScoring'

interface Props {
  risks: BiomarkerRisk[]
  primaryProgram: string
  primaryPrice: string
  firstName?: string
  onPrimary: () => void
  onLabs: () => void
}

const SEV = {
  high:   { bg:'#FEF2F2', border:'#FECACA', dot:'#DC2626', tag:'Likely', tagBg:'#FEE2E2', tagColor:'#991B1B' },
  medium: { bg:'#FFFBEB', border:'#FDE68A', dot:'#D97706', tag:'Possible', tagBg:'#FEF3C7', tagColor:'#92400E' },
  low:    { bg:'#F8FAFC', border:'#E2E8F0', dot:'#94A3B8', tag:'Worth checking', tagBg:'#F1F5F9', tagColor:'#64748B' }
}

export function BiomarkerSnapshot({ risks, primaryProgram, primaryPrice, firstName, onPrimary, onLabs }: Props) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
          Your health snapshot
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {firstName ? `${firstName.split(' ')[0]}, here's what we found` : "Here's what your answers suggest"}
        </h2>
        <p className="text-sm text-gray-500">
          Based on your symptom pattern — not a diagnosis.
          Your Sanative doctor confirms this with clinical assessment.
        </p>
      </div>

      {risks.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mb-6">
          <p className="font-semibold text-green-800 mb-1">Your profile looks balanced</p>
          <p className="text-sm text-green-700">A baseline biomarker panel will confirm this and give you a scientific starting point.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {risks.map((r, i) => {
            const s = r.severity ? SEV[r.severity] : SEV.low
            return (
              <div key={r.key} onClick={() => setOpen(open === i ? null : i)}
                className="rounded-xl border cursor-pointer"
                style={{ background: s.bg, borderColor: s.border }}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: s.dot }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: s.tagBg, color: s.tagColor }}>{s.tag}</span>
                      </div>
                      <p className="text-sm text-gray-700">{r.headline}</p>
                      {open === i && (
                        <div className="mt-3 pt-3 border-t border-black border-opacity-5">
                          <p className="text-sm text-gray-600 leading-relaxed mb-3">{r.why}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-semibold">
                              {r.program} · {r.programPrice}
                            </span>
                            {r.crossSell && (
                              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                                + {r.crossSell} · {r.crossSellPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-300 text-sm">{open === i ? '▲' : '▼'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-3">
        <button onClick={onPrimary}
          className="w-full py-4 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl text-sm transition-colors">
          Start {primaryProgram} — {primaryPrice}
        </button>
        <button onClick={onLabs}
          className="w-full py-4 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-colors">
          Confirm with a biomarker test first — $299
        </button>
      </div>

      {risks.some(r => r.crossSell) && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">
            Also flagged in your snapshot
          </p>
          {risks.filter(r => r.crossSell).map(r => (
            <a key={r.key + 'cs'} href={r.crossSellPath}
              className="flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm mb-1 transition-colors">
              <span className="font-medium text-gray-700">{r.crossSell}</span>
              <span className="text-gray-400 text-xs">{r.crossSellPrice}</span>
            </a>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
        Symptom-based risk indicators only — not a medical diagnosis.
        All treatment decisions made by AHPRA-registered doctors.
      </p>
    </div>
  )
}
