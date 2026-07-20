'use client'
import { useState } from 'react'
import {
  ArrowRight,
  Beaker,
  CalendarCheck2,
  Check,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import type { BiomarkerRisk } from '@/lib/biomarkerScoring'

interface AdvancedPanelOffer {
  name: string
  priceAud: number
  billingLabel: string
  markerCount?: number
  tagline?: string
  highlights?: string[]
  onSelect: () => void
}

interface Props {
  risks: BiomarkerRisk[]
  primaryProgram: string
  primaryPrice: string
  firstName?: string
  onPrimary: () => void
  onLabs: () => void
  /**
   * Hair (and similar) funnels: keep risk reasoning, hide program/labs offers,
   * and show Advanced panel checkout CTA instead.
   */
  offerMode?: 'programs' | 'advancedPanel'
  advancedPanel?: AdvancedPanelOffer
  /** Optional override for the marketing headline above the Advanced panel card. */
  marketingHeadline?: string
  /** Optional override for the short supporting line under the headline. */
  marketingSubcopy?: string
}

const SEV = {
  high:   { bg:'#FEF2F2', border:'#FECACA', dot:'#DC2626', tag:'Likely', tagBg:'#FEE2E2', tagColor:'#991B1B' },
  medium: { bg:'#FFFBEB', border:'#FDE68A', dot:'#D97706', tag:'Possible', tagBg:'#FEF3C7', tagColor:'#92400E' },
  low:    { bg:'#F8FAFC', border:'#E2E8F0', dot:'#94A3B8', tag:'Worth checking', tagBg:'#F1F5F9', tagColor:'#64748B' }
}

const ADVANCED_JOURNEY_STEPS = [
  {
    icon: Beaker,
    title: 'Get your Advanced Panel',
    detail: 'Establish your biological starting point',
  },
  {
    icon: CalendarCheck2,
    title: 'Book your doctor consultation',
    detail: 'Included in your panel price',
  },
  {
    icon: ClipboardList,
    title: 'Unlock your action plan',
    detail: 'Precise next steps based on your results',
  },
] as const

const ADVANCED_INCLUSIONS = [
  'Initial doctor consultation',
  '12-month Biological Age & Biomarkers Portal access',
  'Comprehensive health overview for your treatment plan',
] as const

export function BiomarkerSnapshot({
  risks,
  primaryProgram,
  primaryPrice,
  firstName,
  onPrimary,
  onLabs,
  offerMode = 'programs',
  advancedPanel,
  marketingHeadline,
  marketingSubcopy,
}: Props) {
  const [open, setOpen] = useState<number | null>(0)
  const showAdvancedPanel = offerMode === 'advancedPanel' && advancedPanel
  const headline =
    marketingHeadline ||
    'Biomarker analysis defines the biological starting point for your treatment plan'
  const subcopy =
    marketingSubcopy ||
    'Confirm what your symptoms suggest, then unlock a precise action plan with your doctor.'

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
        <div className="bg-[#f4f7f2] border border-[#cdd8c6] rounded-xl p-5 text-center mb-6">
          <p className="font-semibold text-[#2c3628] mb-1">
            We need to get some tests on the way for you.
          </p>
          <p className="text-sm text-[#5c7a52] leading-relaxed">
            Understand your body&apos;s biomarkers — your doctor will use them to diagnose
            and improve your long-term health.
          </p>
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
                          {!showAdvancedPanel && (
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
                          )}
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

      {showAdvancedPanel ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#cdd8c6] bg-gradient-to-b from-[#f4f7f2] to-white p-5">
            <div className="mb-4 flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#5c7a52]/12">
                <Sparkles className="h-4 w-4 text-[#5c7a52]" />
              </div>
              <div>
                <p className="text-base font-semibold leading-snug text-[#2c3628]">
                  {headline}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5c7a52]">
                  {subcopy}
                </p>
              </div>
            </div>

            <ol className="space-y-3">
              {ADVANCED_JOURNEY_STEPS.map((step, index) => {
                const Icon = step.icon
                return (
                  <li key={step.title} className="flex items-start gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5c7a52] text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      {index < ADVANCED_JOURNEY_STEPS.length - 1 && (
                        <div className="mt-1 h-4 w-px bg-[#cdd8c6]" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-[#5c7a52]" />
                        <p className="text-sm font-semibold text-[#2c3628]">{step.title}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-[#7e9a72]">{step.detail}</p>
                    </div>
                  </li>
                )
              })}
            </ol>

            <p className="mt-4 border-t border-[#e6ebe3] pt-3 text-center text-xs font-medium text-[#5c7a52]">
              Treatment plans start at <span className="font-semibold text-[#2c3628]">$19/pm</span>
            </p>
          </div>

          <button
            type="button"
            onClick={advancedPanel.onSelect}
            className="w-full rounded-2xl border-2 border-[#5c7a52] bg-white p-5 text-left transition-colors hover:bg-[#f4f7f2]"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5c7a52]/10">
                  <Beaker className="h-5 w-5 text-[#5c7a52]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#5c7a52]">
                    Recommended for you
                  </p>
                  <h3 className="text-xl font-serif text-[#2c3628]">
                    {advancedPanel.name} Biomarker Panel
                  </h3>
                </div>
              </div>
              <span className="rounded-full bg-[#c17a58] px-2.5 py-1 text-xs font-medium text-white whitespace-nowrap">
                Most Popular
              </span>
            </div>

            {advancedPanel.tagline && (
              <p className="mb-3 text-sm text-[#5c7a52]">{advancedPanel.tagline}</p>
            )}

            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-serif text-[#2c3628]">
                  ${advancedPanel.priceAud}
                  <span className="text-sm font-normal text-[#7e9a72]"> AUD</span>
                </p>
                <p className="text-xs text-[#7e9a72]">{advancedPanel.billingLabel}</p>
              </div>
              {typeof advancedPanel.markerCount === 'number' && (
                <p className="text-sm text-[#7e9a72]">
                  {advancedPanel.markerCount} tests & markers
                </p>
              )}
            </div>

            <div className="mb-4 rounded-xl border border-[#e6ebe3] bg-[#f4f7f2]/80 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5c7a52]">
                Your price includes
              </p>
              <ul className="space-y-2">
                {ADVANCED_INCLUSIONS.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#34412f]">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {advancedPanel.highlights && advancedPanel.highlights.length > 0 && (
              <ul className="mb-4 space-y-2">
                {advancedPanel.highlights.slice(0, 3).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#5c7a52]">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#5c7a52] px-4 py-3 text-sm font-semibold text-white">
              Get your {advancedPanel.name} Panel
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
      ) : (
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
      )}

      {!showAdvancedPanel && risks.some(r => r.crossSell) && (
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
