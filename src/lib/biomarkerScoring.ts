// Reads EXISTING quiz formData fields and calculates biomarker risk scores.
// Supports dynamic campaign data from admin portal or falls back to hardcoded metadata.

export type BiomarkerRisk = {
  key: string
  name: string
  score: number
  severity: 'high' | 'medium' | 'low' | null
  headline: string
  why: string
  program: string
  programPath: string
  programPrice: string
  crossSell?: string
  crossSellPath?: string
  crossSellPrice?: string
}

// Campaign data structure from database
export type BiomarkerCampaignData = {
  key: string
  name: string
  headline: string
  description: string
  program: string
  programPath: string
  programPrice: string
  crossSellEnabled: boolean
  crossSell: string | null
  crossSellPath: string | null
  crossSellPrice: string | null
  thresholdHigh: number
  thresholdMedium: number
  thresholdLow: number
  genderFilter: 'ALL' | 'MALE_ONLY' | 'FEMALE_ONLY'
}

// Default hardcoded metadata (fallback if no campaigns loaded)
const DEFAULT_META: Record<string, Omit<BiomarkerRisk, 'key' | 'score' | 'severity'>> = {
  homaIR: { name: 'Insulin Resistance (HOMA-IR)', headline: 'Insulin resistance may be the missing piece', why: 'Your health profile is consistent with insulin resistance — the most common hidden driver of weight gain and fatigue.', program: 'Weight Management', programPath: '/weight-management/assessment', programPrice: '$549 trial', crossSell: 'Fatty Liver Program', crossSellPath: '/metabolic-care/fatty-liver', crossSellPrice: '$199/mo' },
  dht: { name: 'DHT (Hair Loss Hormone)', headline: 'DHT may already be affecting your hair follicles', why: 'Your pattern is consistent with DHT-driven hair loss — the most common and treatable form.', program: 'Hair Loss Program', programPath: '/hair-health', programPrice: '$79/mo', crossSell: "Men's Vitality Program", crossSellPath: '/mens-health', crossSellPrice: '$149/mo' },
  testosterone: { name: 'Testosterone', headline: 'Low testosterone may be contributing to your symptoms', why: 'Fatigue, reduced drive, and muscle changes are classic indicators of suboptimal testosterone.', program: "Men's Vitality Program", programPath: '/mens-health', programPrice: '$149/mo', crossSell: 'Hair Loss Program', crossSellPath: '/hair-health', crossSellPrice: '$79/mo' },
  cardiovascular: { name: 'Cardiovascular Markers', headline: 'ED is often an early cardiovascular signal — worth screening', why: 'Erectile dysfunction has strong evidence as an early warning sign for cardiovascular disease.', program: 'Erectile Dysfunction Program', programPath: '/mens-health/assessment', programPrice: '$99/mo', crossSell: 'Heart Health Monitoring', crossSellPath: '/mens-health', crossSellPrice: '+$49/mo' },
  cortisol: { name: 'Cortisol (Stress Hormone)', headline: 'Stress hormones may be working against your goals', why: 'Chronic stress elevates cortisol, which promotes belly fat storage and blocks weight loss.', program: "Men's / Women's Vitality", programPath: '/mens-health', programPrice: '$149/mo', crossSell: 'Weight Management', crossSellPath: '/weight-management/assessment', crossSellPrice: '$249/mo' },
  tsh: { name: 'Thyroid Function (TSH)', headline: 'Thyroid function may be slowing your metabolism', why: 'Fatigue, difficulty losing weight, and hair changes are the classic cluster of thyroid dysfunction.', program: 'Weight Management / Women\'s Health', programPath: '/weight-management/assessment', programPrice: '$549 trial', crossSell: 'Essential Biomarker Panel', crossSellPath: '/labs', crossSellPrice: '$299 one-off' },
  estrogenProg: { name: 'Oestrogen / Progesterone', headline: 'Hormonal imbalance is likely driving your symptoms', why: 'Your symptom pattern points to an identifiable hormonal cause that guides the right treatment.', program: "Women's Health Program", programPath: '/womens-health/assessment', programPrice: '$149/mo', crossSell: 'Weight Management', crossSellPath: '/weight-management/assessment', crossSellPrice: '$249/mo' },
  altAst: { name: 'Liver Markers (ALT / AST)', headline: 'Liver health may be affecting your metabolism', why: 'Your profile is associated with fatty liver. GLP-1 medications are proven to reverse this.', program: 'Fatty Liver Program', programPath: '/metabolic-care/fatty-liver', programPrice: '$199/mo', crossSell: 'Weight Management', crossSellPath: '/weight-management/assessment', crossSellPrice: '$249/mo' },
  ferritinIron: { name: 'Ferritin / Iron', headline: 'Iron deficiency may be contributing to your symptoms', why: 'Fatigue and hair thinning are the most common presentation of low ferritin — especially in women.', program: 'Women\'s Health / Essential Labs', programPath: '/labs', programPrice: '$299 one-off', crossSell: 'Hair Loss Program', crossSellPath: '/hair-health', crossSellPrice: '$79/mo' },
}

// Default thresholds
const DEFAULT_THRESHOLDS = { high: 60, medium: 35, low: 20 }

export function scoreWeightManagement(data: Record<string, unknown>, campaigns?: BiomarkerCampaignData[]): BiomarkerRisk[] {
  const scores: Record<string, number> = { homaIR: 0, dht: 0, tsh: 0, altAst: 0, cardiovascular: 0, cortisol: 0 }
  const metabolic = (data.metabolicConditions as string[]) || []
  if (metabolic.some((c: string) => c.toLowerCase().includes('diabetes'))) scores.homaIR += 40
  if (metabolic.some((c: string) => c.toLowerCase().includes('insulin'))) scores.homaIR += 35
  if (metabolic.some((c: string) => c.toLowerCase().includes('pcos'))) scores.homaIR += 30
  const cardio = (data.cardiovascularConditions as string[]) || []
  if (cardio.some((c: string) => c.toLowerCase().includes('blood pressure'))) scores.cardiovascular += 35
  if (cardio.some((c: string) => c.toLowerCase().includes('heart'))) scores.cardiovascular += 40
  const mental = (data.mentalHealthConditions as string[]) || []
  if (mental.some((c: string) => c.toLowerCase().includes('anxiety'))) scores.cortisol += 20
  if (mental.some((c: string) => c.toLowerCase().includes('depression'))) scores.cortisol += 15
  const digestive = (data.digestiveConditions as string[]) || []
  if (digestive.some((c: string) => c.toLowerCase().includes('liver'))) scores.altAst += 50
  if (digestive.some((c: string) => c.toLowerCase().includes('fatty'))) scores.altAst += 60
  const weight = Number.parseFloat((data.currentWeight as string) || '0')
  const heightCm = Number.parseFloat((data.height as string) || '0')
  if (weight > 0 && heightCm > 0) {
    const bmi = weight / Math.pow(heightCm / 100, 2)
    if (bmi >= 35) { scores.homaIR += 25; scores.altAst += 25 }
    else if (bmi >= 30) { scores.homaIR += 15; scores.altAst += 15 }
  }
  const gender = ((data.gender as string) || '').toLowerCase()
  const isMale = gender.includes('male')
  if (isMale) scores.dht += 20
  const motivations = (data.motivations as string[]) || []
  if (motivations.some((m: string) => m.toLowerCase().includes('energy'))) scores.tsh += 10
  return buildFlags(scores, gender.includes('female') ? 'female' : 'male', campaigns)
}

export function scoreMensHealth(data: Record<string, unknown>, campaigns?: BiomarkerCampaignData[]): BiomarkerRisk[] {
  const scores: Record<string, number> = { cardiovascular: 0, testosterone: 0, dht: 0, cortisol: 0, homaIR: 0 }
  const edSev = ((data.edSeverity as string) || '').toLowerCase()
  if (edSev.includes('severe')) scores.cardiovascular += 50
  else if (edSev.includes('moderate')) scores.cardiovascular += 30
  else if (edSev.includes('mild')) scores.cardiovascular += 15
  if (data.takingNitrates === 'yes') scores.cardiovascular += 60
  const conditions = (data.medicalConditions as string[]) || []
  if (conditions.some((c: string) => c.toLowerCase().includes('diabetes'))) scores.homaIR += 40
  if (conditions.some((c: string) => c.toLowerCase().includes('blood pressure'))) scores.cardiovascular += 35
  if (conditions.some((c: string) => c.toLowerCase().includes('heart'))) scores.cardiovascular += 40
  const lifestyle = (data.lifestyleFactors as string[]) || []
  if (lifestyle.some((l: string) => l.toLowerCase().includes('stress'))) scores.cortisol += 20
  if (lifestyle.some((l: string) => l.toLowerCase().includes('sleep'))) scores.cortisol += 15
  if (scores.cardiovascular > 20) scores.testosterone += 15
  return buildFlags(scores, 'male', campaigns)
}

export function scoreHairLoss(data: Record<string, unknown>, campaigns?: BiomarkerCampaignData[]): BiomarkerRisk[] {
  const scores: Record<string, number> = { dht: 0, tsh: 0, ferritinIron: 0, testosterone: 0 }
  const gender = ((data.gender as string) || '').toLowerCase()
  const isMale = gender.includes('male')
  const stage = ((data.hairStage as string) || '')
  if (isMale) {
    if (stage.includes('3') || stage.includes('4') || stage.includes('5') || stage.includes('6')) scores.dht += 50
    else if (stage.includes('2')) scores.dht += 30
  } else {
    scores.tsh += 30; scores.ferritinIron += 35
  }
  const timeline = ((data.hairLossTimeline as string) || '').toLowerCase()
  if (timeline.includes('sudden') || timeline.includes('rapid')) { scores.tsh += 20; scores.ferritinIron += 20 }
  else if (timeline.includes('gradual') || timeline.includes('slow') && isMale) scores.dht += 20
  const family = ((data.familyHistory as string) || '').toLowerCase()
  if ((family.includes('yes') || family.includes('one') || family.includes('both')) && isMale) scores.dht += 25
  const conditions = (data.medicalConditions as string[]) || []
  if (conditions.some((c: string) => c.toLowerCase().includes('thyroid'))) scores.tsh += 50
  if (((data.pregnancyStatus as string) || '').toLowerCase().includes('yes')) return []
  return buildFlags(scores, isMale ? 'male' : 'female', campaigns)
}

export function scoreWomensHealth(data: Record<string, unknown>, campaigns?: BiomarkerCampaignData[]): BiomarkerRisk[] {
  const scores: Record<string, number> = { estrogenProg: 0, homaIR: 0, tsh: 0, cortisol: 0, ferritinIron: 0 }
  const category = ((data.category as string) || '').toLowerCase()
  if (category.includes('menopause') || category.includes('hrt')) scores.estrogenProg += 50
  if (category.includes('pcos') || category.includes('fertility')) { scores.estrogenProg += 35; scores.homaIR += 30 }
  const concerns = (data.primaryConcerns as string[]) || []
  if (concerns.some((c: string) => c.toLowerCase().includes('irregular'))) scores.estrogenProg += 30
  if (concerns.some((c: string) => c.toLowerCase().includes('weight'))) { scores.homaIR += 25; scores.tsh += 15 }
  if (concerns.some((c: string) => c.toLowerCase().includes('fatigue'))) { scores.tsh += 20; scores.ferritinIron += 20 }
  if (concerns.some((c: string) => c.toLowerCase().includes('hot') || c.toLowerCase().includes('sweat'))) scores.estrogenProg += 40
  const conditions = (data.medicalConditions as string[]) || []
  if (conditions.some((c: string) => c.toLowerCase().includes('thyroid'))) scores.tsh += 50
  if (conditions.some((c: string) => c.toLowerCase().includes('pcos'))) { scores.estrogenProg += 40; scores.homaIR += 35 }
  const menstrual = ((data.menstrualStatus as string) || '').toLowerCase()
  if (menstrual.includes('irregular')) scores.estrogenProg += 20
  return buildFlags(scores, 'female', campaigns)
}

// Helper to get metadata for a key - uses campaign data if available, falls back to defaults
function getMetadata(key: string, campaigns?: BiomarkerCampaignData[]): Omit<BiomarkerRisk, 'key' | 'score' | 'severity'> | null {
  // First check if we have campaign data
  if (campaigns && campaigns.length > 0) {
    const campaign = campaigns.find(c => c.key === key)
    if (campaign) {
      return {
        name: campaign.name,
        headline: campaign.headline,
        why: campaign.description,
        program: campaign.program,
        programPath: campaign.programPath,
        programPrice: campaign.programPrice,
        crossSell: campaign.crossSellEnabled ? campaign.crossSell || undefined : undefined,
        crossSellPath: campaign.crossSellEnabled ? campaign.crossSellPath || undefined : undefined,
        crossSellPrice: campaign.crossSellEnabled ? campaign.crossSellPrice || undefined : undefined,
      }
    }
  }

  // Fall back to default metadata
  return DEFAULT_META[key] || null
}

// Helper to get thresholds for a key - uses campaign data if available
function getThresholds(key: string, campaigns?: BiomarkerCampaignData[]): { high: number; medium: number; low: number } {
  if (campaigns && campaigns.length > 0) {
    const campaign = campaigns.find(c => c.key === key)
    if (campaign) {
      return {
        high: campaign.thresholdHigh,
        medium: campaign.thresholdMedium,
        low: campaign.thresholdLow,
      }
    }
  }
  return DEFAULT_THRESHOLDS
}

// Helper to check if a biomarker should be shown for a given gender
function shouldShowForGender(key: string, gender: 'male' | 'female' | 'other', campaigns?: BiomarkerCampaignData[]): boolean {
  // Check campaign-based gender filter
  if (campaigns && campaigns.length > 0) {
    const campaign = campaigns.find(c => c.key === key)
    if (campaign) {
      if (campaign.genderFilter === 'MALE_ONLY' && gender !== 'male') return false
      if (campaign.genderFilter === 'FEMALE_ONLY' && gender !== 'female') return false
      return true
    }
  }

  // Default gender exclusions (hardcoded fallback)
  const maleOnly = ['dht', 'testosterone']
  const femaleOnly = ['estrogenProg', 'ferritinIron']

  if (gender === 'female' && maleOnly.includes(key)) return false
  if (gender === 'male' && femaleOnly.includes(key)) return false

  return true
}

function buildFlags(scores: Record<string, number>, gender: 'male' | 'female' | 'other', campaigns?: BiomarkerCampaignData[]): BiomarkerRisk[] {
  return Object.entries(scores)
    .filter(([key, score]) => {
      const thresholds = getThresholds(key, campaigns)
      const meta = getMetadata(key, campaigns)
      return score >= thresholds.low && meta && shouldShowForGender(key, gender, campaigns)
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, score]) => {
      const thresholds = getThresholds(key, campaigns)
      const meta = getMetadata(key, campaigns)!
      return {
        key,
        score,
        severity: score >= thresholds.high ? 'high' as const : score >= thresholds.medium ? 'medium' as const : 'low' as const,
        ...meta
      }
    })
}

// Utility function to fetch campaigns for a specific quiz type
export async function fetchBiomarkerCampaigns(quizType: string): Promise<BiomarkerCampaignData[]> {
  try {
    const response = await fetch(`/api/biomarker-campaigns?quizType=${quizType}`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch biomarker campaigns:', error)
    return []
  }
}

// Utility function to get biomarker flags from already-calculated risks
// Used by engagement injection screens to show teaser biomarker cards
export function getBiomarkerFlags(
  risks: BiomarkerRisk[],
  limit: number = 3,
  gender: 'male' | 'female' | 'other' = 'male',
  campaigns?: BiomarkerCampaignData[]
): Array<{ displayName: string; name: string; key: string; severity: string }> {
  return risks
    .filter(r => shouldShowForGender(r.key, gender, campaigns))
    .slice(0, limit)
    .map(r => ({
      displayName: r.name,
      name: r.name,
      key: r.key,
      severity: r.severity || 'low'
    }))
}
