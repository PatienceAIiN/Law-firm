'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Save, Code2, LayoutTemplate } from 'lucide-react'
import { DEFAULT_SITE_CONTENT } from '@/lib/site-content-data'

function deepMerge(base: any, override: any): any {
  if (!override) return base
  const result: any = { ...base }
  for (const key of Object.keys(override)) {
    if (
      typeof base[key] === 'object' &&
      base[key] !== null &&
      !Array.isArray(base[key]) &&
      typeof override[key] === 'object' &&
      override[key] !== null &&
      !Array.isArray(override[key])
    ) {
      result[key] = deepMerge(base[key], override[key])
    } else {
      result[key] = override[key]
    }
  }
  return result
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      {value.length > 80 ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1a1208]/10 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#1a1208]/10"
        />
      )}
    </div>
  )
}

function ArrayField({ label, value, onChange }: { label: string; value: any[]; onChange: (v: any[]) => void }) {
  const [json, setJson] = useState(JSON.stringify(value, null, 2))
  const [error, setError] = useState('')

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(json)
      setError('')
      onChange(parsed)
    } catch {
      setError('Invalid JSON')
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</label>
      <textarea
        rows={5}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-mono text-gray-700 outline-none focus:ring-2 focus:ring-[#1a1208]/10 resize-y"
        spellCheck={false}
      />
      {error && <p className="text-red-500 text-[10px]">{error}</p>}
    </div>
  )
}

function Section({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-xs font-black uppercase tracking-widest text-[#1a1208]">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 space-y-4 bg-white">{children}</div>}
    </div>
  )
}

interface ContentVisualEditorProps {
  initialContent: any
  updateContent: (formData: FormData) => Promise<void>
  withLoading: (fn: (fd: FormData) => Promise<void>) => (fd: FormData) => Promise<void>
}

export function ContentVisualEditor({ initialContent, updateContent, withLoading }: ContentVisualEditorProps) {
  const [tab, setTab] = useState<'visual' | 'json'>('visual')
  const merged = deepMerge(DEFAULT_SITE_CONTENT as any, initialContent || {})
  const [data, setData] = useState<any>(merged)

  const set = (path: string[], value: any) => {
    setData((prev: any) => {
      const next = JSON.parse(JSON.stringify(prev))
      let obj = next
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]]
      obj[path[path.length - 1]] = value
      return next
    })
  }

  const f = (path: string[]) => (v: string) => set(path, v)
  const a = (path: string[]) => (v: any[]) => set(path, v)

  const handleVisualSave = async () => {
    const fd = new FormData()
    fd.set('contentJson', JSON.stringify(data))
    await withLoading(updateContent)(fd)
  }

  const jsonStr = JSON.stringify(data, null, 2)

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('visual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === 'visual' ? 'bg-white text-[#1a1208] shadow-sm' : 'text-gray-500 hover:text-[#1a1208]'}`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" /> Visual Editor
        </button>
        <button
          type="button"
          onClick={() => setTab('json')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === 'json' ? 'bg-white text-[#1a1208] shadow-sm' : 'text-gray-500 hover:text-[#1a1208]'}`}
        >
          <Code2 className="w-3.5 h-3.5" /> Raw JSON
        </button>
      </div>

      {tab === 'visual' ? (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {/* HOME PAGE */}
          <Section title="Home — About Section" defaultOpen>
            <Field label="Badge" value={data.home?.about?.badge ?? ''} onChange={f(['home','about','badge'])} />
            <Field label="Title" value={data.home?.about?.title ?? ''} onChange={f(['home','about','title'])} />
            <Field label="Subtitle" value={data.home?.about?.subtitle ?? ''} onChange={f(['home','about','subtitle'])} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primary CTA Text" value={data.home?.about?.ctaPrimaryText ?? ''} onChange={f(['home','about','ctaPrimaryText'])} />
              <Field label="Primary CTA Link" value={data.home?.about?.ctaPrimaryLink ?? ''} onChange={f(['home','about','ctaPrimaryLink'])} />
              <Field label="Secondary CTA Text" value={data.home?.about?.ctaSecondaryText ?? ''} onChange={f(['home','about','ctaSecondaryText'])} />
              <Field label="Secondary CTA Link" value={data.home?.about?.ctaSecondaryLink ?? ''} onChange={f(['home','about','ctaSecondaryLink'])} />
            </div>
            <ArrayField label="Highlights (array of strings)" value={data.home?.about?.highlights ?? []} onChange={a(['home','about','highlights'])} />
          </Section>

          <Section title="Home — Practice Areas Section">
            <Field label="Badge" value={data.home?.practiceAreas?.badge ?? ''} onChange={f(['home','practiceAreas','badge'])} />
            <Field label="Title" value={data.home?.practiceAreas?.title ?? ''} onChange={f(['home','practiceAreas','title'])} />
            <Field label="Subtitle" value={data.home?.practiceAreas?.subtitle ?? ''} onChange={f(['home','practiceAreas','subtitle'])} />
            <Field label="CTA Text" value={data.home?.practiceAreas?.ctaText ?? ''} onChange={f(['home','practiceAreas','ctaText'])} />
          </Section>

          <Section title="Home — Testimonials Section">
            <Field label="Badge" value={data.home?.testimonials?.badge ?? ''} onChange={f(['home','testimonials','badge'])} />
            <Field label="Title" value={data.home?.testimonials?.title ?? ''} onChange={f(['home','testimonials','title'])} />
            <Field label="Subtitle" value={data.home?.testimonials?.subtitle ?? ''} onChange={f(['home','testimonials','subtitle'])} />
          </Section>

          <Section title="Home — Contact CTA Section">
            <Field label="Badge" value={data.home?.contactCta?.badge ?? ''} onChange={f(['home','contactCta','badge'])} />
            <Field label="Title" value={data.home?.contactCta?.title ?? ''} onChange={f(['home','contactCta','title'])} />
            <Field label="Subtitle" value={data.home?.contactCta?.subtitle ?? ''} onChange={f(['home','contactCta','subtitle'])} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Call Label" value={data.home?.contactCta?.callLabel ?? ''} onChange={f(['home','contactCta','callLabel'])} />
              <Field label="Email Label" value={data.home?.contactCta?.emailLabel ?? ''} onChange={f(['home','contactCta','emailLabel'])} />
              <Field label="Visit Label" value={data.home?.contactCta?.visitLabel ?? ''} onChange={f(['home','contactCta','visitLabel'])} />
              <Field label="Secondary CTA Text" value={data.home?.contactCta?.secondaryCtaText ?? ''} onChange={f(['home','contactCta','secondaryCtaText'])} />
            </div>
          </Section>

          {/* PRACTICE AREAS */}
          <Section title="Practice Areas — Listing Page">
            <Field label="Badge" value={data.home?.practiceAreasPage?.badge ?? ''} onChange={f(['home','practiceAreasPage','badge'])} />
            <Field label="Title" value={data.home?.practiceAreasPage?.title ?? ''} onChange={f(['home','practiceAreasPage','title'])} />
            <Field label="Subtitle" value={data.home?.practiceAreasPage?.subtitle ?? ''} onChange={f(['home','practiceAreasPage','subtitle'])} />
          </Section>

          <Section title="Practice Areas — Detail Page">
            <Field label="Badge" value={data.home?.practiceAreaDetail?.badge ?? ''} onChange={f(['home','practiceAreaDetail','badge'])} />
            <Field label="Intro Label" value={data.home?.practiceAreaDetail?.introLabel ?? ''} onChange={f(['home','practiceAreaDetail','introLabel'])} />
            <Field label="Highlights Title" value={data.home?.practiceAreaDetail?.highlightsTitle ?? ''} onChange={f(['home','practiceAreaDetail','highlightsTitle'])} />
            <Field label="Assistance Title" value={data.home?.practiceAreaDetail?.assistanceTitle ?? ''} onChange={f(['home','practiceAreaDetail','assistanceTitle'])} />
            <Field label="Assistance Body" value={data.home?.practiceAreaDetail?.assistanceBody ?? ''} onChange={f(['home','practiceAreaDetail','assistanceBody'])} />
            <Field label="Consultation Button" value={data.home?.practiceAreaDetail?.consultationButton ?? ''} onChange={f(['home','practiceAreaDetail','consultationButton'])} />
            <Field label="Trust Title" value={data.home?.practiceAreaDetail?.trustTitle ?? ''} onChange={f(['home','practiceAreaDetail','trustTitle'])} />
            <Field label="Trust Body" value={data.home?.practiceAreaDetail?.trustBody ?? ''} onChange={f(['home','practiceAreaDetail','trustBody'])} />
          </Section>

          {/* ABOUT PAGE */}
          <Section title="About — Hero">
            <Field label="Badge" value={data.about?.hero?.badge ?? ''} onChange={f(['about','hero','badge'])} />
            <Field label="Title" value={data.about?.hero?.title ?? ''} onChange={f(['about','hero','title'])} />
            <Field label="Subtitle" value={data.about?.hero?.subtitle ?? ''} onChange={f(['about','hero','subtitle'])} />
          </Section>

          <Section title="About — Experience Section">
            <Field label="Heading" value={data.about?.experience?.heading ?? ''} onChange={f(['about','experience','heading'])} />
            <Field label="Intro" value={data.about?.experience?.intro ?? ''} onChange={f(['about','experience','intro'])} />
            <ArrayField label="Achievements (array of {stat, title, description})" value={data.about?.experience?.achievements ?? []} onChange={a(['about','experience','achievements'])} />
            <ArrayField label="Milestones (array of {year, label})" value={data.about?.experience?.milestones ?? []} onChange={a(['about','experience','milestones'])} />
          </Section>

          <Section title="About — Philosophy Section">
            <Field label="Badge" value={data.about?.philosophy?.badge ?? ''} onChange={f(['about','philosophy','badge'])} />
            <Field label="Heading" value={data.about?.philosophy?.heading ?? ''} onChange={f(['about','philosophy','heading'])} />
            <Field label="Subtitle" value={data.about?.philosophy?.subtitle ?? ''} onChange={f(['about','philosophy','subtitle'])} />
            <Field label="Mission Title" value={data.about?.philosophy?.missionTitle ?? ''} onChange={f(['about','philosophy','missionTitle'])} />
            <Field label="Mission Body" value={data.about?.philosophy?.missionBody ?? ''} onChange={f(['about','philosophy','missionBody'])} />
            <ArrayField label="Values (array of {title, description})" value={data.about?.philosophy?.values ?? []} onChange={a(['about','philosophy','values'])} />
            <ArrayField label="Mission Points (array of {title, subtitle})" value={data.about?.philosophy?.missionPoints ?? []} onChange={a(['about','philosophy','missionPoints'])} />
          </Section>

          <Section title="About — Team Section">
            <Field label="Badge" value={data.about?.team?.badge ?? ''} onChange={f(['about','team','badge'])} />
            <Field label="Heading" value={data.about?.team?.heading ?? ''} onChange={f(['about','team','heading'])} />
            <Field label="Subtitle" value={data.about?.team?.subtitle ?? ''} onChange={f(['about','team','subtitle'])} />
            <Field label="Why Choose Title" value={data.about?.team?.whyChooseTitle ?? ''} onChange={f(['about','team','whyChooseTitle'])} />
            <Field label="Why Choose Intro" value={data.about?.team?.whyChooseIntro ?? ''} onChange={f(['about','team','whyChooseIntro'])} />
            <Field label="CTA Text" value={data.about?.team?.ctaText ?? ''} onChange={f(['about','team','ctaText'])} />
            <ArrayField label="Why Choose Points (array of {title, description})" value={data.about?.team?.points ?? []} onChange={a(['about','team','points'])} />
          </Section>

          {/* CONTACT PAGE */}
          <Section title="Contact — Hero">
            <Field label="Title" value={data.contact?.hero?.title ?? ''} onChange={f(['contact','hero','title'])} />
            <Field label="Subtitle" value={data.contact?.hero?.subtitle ?? ''} onChange={f(['contact','hero','subtitle'])} />
          </Section>

          <Section title="Contact — Info Block">
            <Field label="Heading" value={data.contact?.info?.heading ?? ''} onChange={f(['contact','info','heading'])} />
            <Field label="Office Hours Heading" value={data.contact?.info?.officeHoursHeading ?? ''} onChange={f(['contact','info','officeHoursHeading'])} />
            <Field label="Emergency Note" value={data.contact?.info?.emergencyNote ?? ''} onChange={f(['contact','info','emergencyNote'])} />
            <Field label="CTA Title" value={data.contact?.info?.ctaTitle ?? ''} onChange={f(['contact','info','ctaTitle'])} />
            <Field label="CTA Body" value={data.contact?.info?.ctaBody ?? ''} onChange={f(['contact','info','ctaBody'])} />
            <Field label="CTA Button Text" value={data.contact?.info?.ctaButton ?? ''} onChange={f(['contact','info','ctaButton'])} />
            <Field label="Call Line Text" value={data.contact?.info?.callLineText ?? ''} onChange={f(['contact','info','callLineText'])} />
          </Section>

          {/* CONSULTATION PAGE */}
          <Section title="Consultation — Hero">
            <Field label="Badge" value={data.consultation?.hero?.badge ?? ''} onChange={f(['consultation','hero','badge'])} />
            <Field label="Title" value={data.consultation?.hero?.title ?? ''} onChange={f(['consultation','hero','title'])} />
            <Field label="Subtitle" value={data.consultation?.hero?.subtitle ?? ''} onChange={f(['consultation','hero','subtitle'])} />
          </Section>

          <Section title="Consultation — Features & Form">
            <ArrayField label="Features (array of {title, desc})" value={data.consultation?.features ?? []} onChange={a(['consultation','features'])} />
            <Field label="Form Title" value={data.consultation?.form?.title ?? ''} onChange={f(['consultation','form','title'])} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name Label" value={data.consultation?.form?.fullNameLabel ?? ''} onChange={f(['consultation','form','fullNameLabel'])} />
              <Field label="Email Label" value={data.consultation?.form?.emailLabel ?? ''} onChange={f(['consultation','form','emailLabel'])} />
              <Field label="Phone Label" value={data.consultation?.form?.phoneLabel ?? ''} onChange={f(['consultation','form','phoneLabel'])} />
              <Field label="Meeting Mode Label" value={data.consultation?.form?.meetingModeLabel ?? ''} onChange={f(['consultation','form','meetingModeLabel'])} />
              <Field label="Notes Label" value={data.consultation?.form?.notesLabel ?? ''} onChange={f(['consultation','form','notesLabel'])} />
              <Field label="Submit Button Text" value={data.consultation?.form?.submitText ?? ''} onChange={f(['consultation','form','submitText'])} />
            </div>
            <Field label="Success Title" value={data.consultation?.form?.successTitle ?? ''} onChange={f(['consultation','form','successTitle'])} />
            <Field label="Success Message" value={data.consultation?.form?.successMessage ?? ''} onChange={f(['consultation','form','successMessage'])} />
            <Field label="Home Button Text" value={data.consultation?.form?.homeText ?? ''} onChange={f(['consultation','form','homeText'])} />
          </Section>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-gray-400">Edit raw JSON. Changes made in Visual Editor are reflected here.</p>
          <textarea
            name="contentJson"
            defaultValue={jsonStr}
            rows={22}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#1a1208]/10 font-mono text-[11px] leading-6 resize-y"
            spellCheck={false}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                setData(parsed)
              } catch {}
            }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleVisualSave}
        className="w-full bg-[#1a1208] text-white p-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#2d1f0d] transition-all text-sm"
      >
        <Save className="w-4 h-4" />
        Save All Content
      </button>
    </div>
  )
}
