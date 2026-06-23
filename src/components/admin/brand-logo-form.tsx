'use client'

import { useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { ImageUpload } from './image-upload'

type Brand = {
  logo_text?: string
  firm_name?: string
  firm_full_name?: string
  logo_image_url?: string
  logo_style?: {
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    color?: string
    letterSpacing?: string
  }
  use_image_logo?: boolean
}

interface Props {
  brand: Brand
  updateBrand: (formData: FormData) => Promise<void>
}

const FONT_FAMILIES = [
  { label: 'Sans (Default)', value: 'inherit' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Display', value: '"Playfair Display", Georgia, serif' },
  { label: 'Mono', value: 'ui-monospace, monospace' },
]
const WEIGHTS = ['400', '500', '600', '700', '800', '900']

export function BrandLogoForm({ brand, updateBrand }: Props) {
  const [pending, startTransition] = useTransition()
  const [useImage, setUseImage] = useState<boolean>(Boolean(brand.use_image_logo ?? brand.logo_image_url))
  const [logoImage, setLogoImage] = useState<string>(brand.logo_image_url || '')
  const style = brand.logo_style || {}
  const [fontFamily, setFontFamily] = useState(style.fontFamily || 'inherit')
  const [fontWeight, setFontWeight] = useState(style.fontWeight || '700')
  const [fontStyle, setFontStyle] = useState(style.fontStyle || 'normal')
  const [color, setColor] = useState(style.color || 'var(--primary)')
  const [letterSpacing, setLetterSpacing] = useState(style.letterSpacing || '-0.02em')
  const [logoText, setLogoText] = useState(brand.logo_text || '')
  const [firmName, setFirmName] = useState(brand.firm_name || '')
  const [firmFullName, setFirmFullName] = useState(brand.firm_full_name || '')

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('use_image_logo', useImage ? 'on' : '')
    fd.set('logo_image_url', logoImage)
    fd.set('logo_style', JSON.stringify({ fontFamily, fontWeight, fontStyle, color, letterSpacing }))
    startTransition(() => { updateBrand(fd) })
  }

  const previewStyle: React.CSSProperties = {
    fontFamily, fontWeight, fontStyle, color, letterSpacing,
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl bg-gray-100 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setUseImage(false)}
          className={`flex-1 rounded-xl px-3 py-2 ${!useImage ? 'bg-white shadow text-[var(--primary)]' : 'text-gray-500'}`}
        >
          Styled Text
        </button>
        <button
          type="button"
          onClick={() => setUseImage(true)}
          className={`flex-1 rounded-xl px-3 py-2 ${useImage ? 'bg-white shadow text-[var(--primary)]' : 'text-gray-500'}`}
        >
          Upload Image
        </button>
      </div>

      {useImage ? (
        <ImageUpload
          value={logoImage}
          onChange={setLogoImage}
          label="Logo image (PNG/SVG)"
          previewType="cover"
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400">Logo Text (Short)</label>
            <input
              name="logo_text"
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              className="w-full rounded-xl bg-gray-50 p-4 font-black outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Font</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full rounded-xl bg-gray-50 p-3 text-sm outline-none"
              >
                {FONT_FAMILIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Weight</label>
              <select
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value)}
                className="w-full rounded-xl bg-gray-50 p-3 text-sm outline-none"
              >
                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Style</label>
              <select
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value)}
                className="w-full rounded-xl bg-gray-50 p-3 text-sm outline-none"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Letter Spacing</label>
              <input
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(e.target.value)}
                placeholder="-0.02em"
                className="w-full rounded-xl bg-gray-50 p-3 text-sm outline-none"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white"
                />
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 rounded-xl bg-gray-50 p-3 font-mono text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400">Firm Name (Short)</label>
        <input
          name="firm_name"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          className="w-full rounded-xl bg-gray-50 p-4 font-bold outline-none"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase text-gray-400">Firm Full Name</label>
        <input
          name="firm_full_name"
          value={firmFullName}
          onChange={(e) => setFirmFullName(e.target.value)}
          className="w-full rounded-xl bg-gray-50 p-4 outline-none"
        />
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview</p>
        <div className="mt-3 flex h-16 items-center">
          {useImage && logoImage ? (
            <img src={logoImage} alt="Logo" className="max-h-12 w-auto" />
          ) : (
            <span className="text-2xl" style={previewStyle}>{logoText || firmName || 'Your Logo'}</span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] p-5 font-black uppercase tracking-widest text-white hover:bg-black disabled:opacity-60"
      >
        <Save className="h-5 w-5" />
        {pending ? 'Saving…' : 'Save Identity'}
      </button>
    </form>
  )
}
