'use client'

import { useEffect, useMemo, useState } from 'react'
import { Save, Plus, Trash2, Link as LinkIcon, Globe, Layout, Type, Palette, Users, MonitorPlay, ArrowUp, ArrowDown } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { AdminDialog } from './admin-dialog'
import { ImageUpload } from './image-upload'
import { BrandLogoForm } from './brand-logo-form'
import { IconPicker } from './icon-picker'
import { ContentVisualEditor } from './content-visual-editor'
import { buildAdminLinkOptions } from '@/lib/admin-links'
import type { SitePage } from '@/lib/site-pages'

interface SiteEditorProps {
  hero: any
  brand: any
  navigation: any[]
  footer: any
  metrics: any[]
  theme: any
  content: any
  adminUsers: any[]
  meetingConfig: any
  updateHero: (formData: FormData) => Promise<void>
  updateBrand: (formData: FormData) => Promise<void>
  updateNavigation: (nav: any[]) => Promise<void>
  updateFooter: (formData: FormData) => Promise<void>
  updateMetrics: (metrics: any[]) => Promise<void>
  updateTheme: (formData: FormData) => Promise<void>
  updateContent: (formData: FormData) => Promise<void>
  updateMeetingConfig: (formData: FormData) => Promise<void>
  createAdminUser: (formData: FormData) => Promise<void>
  updateAdminUser: (formData: FormData) => Promise<void>
  deleteAdminUser: (formData: FormData) => Promise<void>
  sitePages: SitePage[]
}

export function SiteEditor({ 
  hero, 
  brand, 
  navigation: initialNavigation, 
  footer,
  metrics: initialMetrics,
  theme,
  content,
  adminUsers: initialAdminUsers,
  meetingConfig: initialMeetingConfig,
  updateHero,
  updateBrand,
  updateNavigation,
  updateFooter,
  updateMetrics,
  updateTheme,
  updateContent,
  updateMeetingConfig,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  sitePages
}: SiteEditorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeTab = searchParams.get('tab')
  const [loading, setLoading] = useState(false)
  const [navItems, setNavItems] = useState(initialNavigation)
  const [metricItems, setMetricItems] = useState(initialMetrics)
  const [footerQuickLinks, setFooterQuickLinks] = useState(footer.quick_links || initialNavigation || [])
  const [logoUrl, setLogoUrl] = useState(theme.logoUrl || '')
  const [faviconUrl, setFaviconUrl] = useState(theme.faviconUrl || '')
  const [heroImage, setHeroImage] = useState(hero.heroImage || '')
  const [contentJson] = useState(JSON.stringify(content, null, 2))
  const [adminUsers, setAdminUsers] = useState(initialAdminUsers)
  const [meetingConfig, setMeetingConfig] = useState(initialMeetingConfig)
  const [newAdminUser, setNewAdminUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  })

  useEffect(() => {
    setFooterQuickLinks(footer.quick_links || initialNavigation || [])
  }, [footer.quick_links, initialNavigation])

  useEffect(() => {
    setAdminUsers(initialAdminUsers)
  }, [initialAdminUsers])

  useEffect(() => {
    setMeetingConfig(initialMeetingConfig)
  }, [initialMeetingConfig])

  const linkOptions = useMemo(() => buildAdminLinkOptions(sitePages), [sitePages])

  const setActiveTab = (tab: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab) params.set('tab', tab)
    else params.delete('tab')
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const tabs = [
    { id: 'theme', name: 'Design & Theme', icon: Palette, description: 'Colors, fonts, and site-wide styling' },
    { id: 'hero', name: 'Hero Section', icon: Layout, description: 'Main landing page content' },
    { id: 'brand', name: 'Branding', icon: Globe, description: 'Identity, logos, and firm names' },
    { id: 'nav', name: 'Navigation', icon: LinkIcon, description: 'Menu links and site structure' },
    { id: 'metrics', name: 'Site Metrics', icon: Plus, description: 'Performance and trust indicators' },
    { id: 'footer', name: 'Footer & Legal', icon: Type, description: 'Disclaimers and contact summary' },
    { id: 'content', name: 'Pages & Content', icon: Type, description: 'All page copy stored centrally' },
    { id: 'meeting', name: 'Meeting Controls', icon: MonitorPlay, description: 'Virtual meeting storage and recording rules' },
    { id: 'users', name: 'Admin Users', icon: Users, description: 'Create and manage admin accounts' },
  ]

  const handleNavAdd = () => {
    setNavItems([...navItems, { name: 'New Link', href: '/' }])
  }

  const handleNavRemove = (index: number) => {
    setNavItems(navItems.filter((_, i) => i !== index))
  }

  const handleNavChange = (index: number, field: string, value: string) => {
    const updated = [...navItems]
    updated[index][field] = value
    setNavItems(updated)
  }

  const handleNavMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= navItems.length) return
    const next = [...navItems]
    const [item] = next.splice(index, 1)
    next.splice(targetIndex, 0, item)
    setNavItems(next)
  }

  const handleMetricAdd = () => {
    setMetricItems([...metricItems, { label: 'New Metric', value: '0', icon: 'Star', order: metricItems.length }])
  }

  const handleMetricRemove = (index: number) => {
    setMetricItems(metricItems.filter((_, i) => i !== index))
  }

  const handleMetricChange = (index: number, field: string, value: any) => {
    const updated = [...metricItems]
    updated[index][field] = value
    setMetricItems(updated)
  }

  const handleFooterLinkAdd = () => {
    setFooterQuickLinks([...footerQuickLinks, { name: 'New Link', href: linkOptions[0]?.href || '/' }])
  }

  const handleFooterLinkRemove = (index: number) => {
    setFooterQuickLinks(footerQuickLinks.filter((_: any, i: number) => i !== index))
  }

  const handleFooterLinkChange = (index: number, field: string, value: string) => {
    const updated = [...footerQuickLinks]
    updated[index][field] = value
    setFooterQuickLinks(updated)
  }

  const onNavSubmit = async () => {
    setLoading(true)
    await updateNavigation(navItems)
    setLoading(false)
    setActiveTab(null)
    router.refresh()
  }

  const withLoading = (fn: (fd: FormData) => Promise<void>) => async (fd: FormData) => {
    setLoading(true)
    await fn(fd)
    setLoading(false)
    setActiveTab(null)
    router.refresh()
  }

  const runTask = async (task: () => Promise<void>, closeTab = false) => {
    setLoading(true)
    await task()
    setLoading(false)
    if (closeTab) {
      setActiveTab(null)
    }
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="group relative bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-navy-900/10 transition-all text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="w-10 h-10 bg-navy-900 text-white rounded-2xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
             </div>
          </div>

          <div className="space-y-6">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-navy-900 group-hover:text-white transition-colors duration-500">
               <tab.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-navy-900 uppercase tracking-tighter mb-1">{tab.name}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{tab.description}</p>
            </div>
          </div>
        </button>
      ))}

      {/* Extreme Theme Editor Modal */}
      <AdminDialog
        isOpen={activeTab === 'theme'}
        onClose={() => setActiveTab(null)}
        title="Design & Theme"
        description="Full control over colors, fonts, and brand identity"
        isLoading={loading}
      >
        <form action={withLoading(updateTheme)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-navy-900 border-b pb-2">Color Palette</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" name="primaryColor" defaultValue={theme.primaryColor} className="w-10 h-10 rounded-lg cursor-pointer border-none" />
                    <input name="primaryColorValue" defaultValue={theme.primaryColor} className="flex-1 p-2 bg-gray-50 rounded-lg text-xs font-mono outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" name="secondaryColor" defaultValue={theme.secondaryColor} className="w-10 h-10 rounded-lg cursor-pointer border-none" />
                    <input name="secondaryColorValue" defaultValue={theme.secondaryColor} className="flex-1 p-2 bg-gray-50 rounded-lg text-xs font-mono outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-navy-900 border-b pb-2">Typography & Style</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Font Family</label>
                  <select name="fontFamily" defaultValue={theme.fontFamily} className="w-full p-2.5 bg-gray-50 rounded-lg text-xs font-bold outline-none">
                    <option value="sans">Modern Sans</option>
                    <option value="serif">Classic Serif</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Border Radius</label>
                  <input name="borderRadius" defaultValue={theme.borderRadius} className="w-full p-2.5 bg-gray-50 rounded-lg text-xs font-bold outline-none" placeholder="0.75rem" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-navy-900 border-b pb-2">Site Identity</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Browser Tab Title</label>
                <input name="siteTitle" defaultValue={theme.siteTitle} className="w-full p-3 bg-gray-50 rounded-xl text-xs font-bold outline-none" />
              </div>
              <div className="space-y-4">
                <input type="hidden" name="logoUrl" value={logoUrl} />
                <ImageUpload 
                  label="Site Logo (Light)"
                  value={logoUrl}
                  onChange={setLogoUrl}
                />
              </div>
              <div className="space-y-4">
                <input type="hidden" name="faviconUrl" value={faviconUrl} />
                <ImageUpload 
                  label="Favicon (32x32)"
                  value={faviconUrl}
                  onChange={setFaviconUrl}
                  previewType="icon"
                />
              </div>
            </div>
          </div>

          <button className="w-full bg-navy-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
            <Save className="w-5 h-5" />
            Apply Theme Changes
          </button>
        </form>
      </AdminDialog>

      {/* Other Modals (Hero, Brand, Nav, etc.) */}
      <AdminDialog
        isOpen={activeTab === 'hero'}
        onClose={() => setActiveTab(null)}
        title="Hero Section"
        description="Modify main landing content"
        isLoading={loading}
      >
        <form action={withLoading(updateHero)} className="space-y-6">
          <div className="space-y-4">
            <input type="hidden" name="heroImage" value={heroImage} />
            <ImageUpload 
              label="Hero Background/Overlay Image"
              value={heroImage}
              onChange={setHeroImage}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400">Badge Text</label>
            <input name="badge" defaultValue={hero.badge} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400">Main Headline</label>
            <input name="title" defaultValue={hero.title} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-400">Description</label>
            <textarea name="subtitle" defaultValue={hero.subtitle} rows={3} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all resize-none font-medium" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Primary CTA Text</label>
              <input name="cta_primary_text" defaultValue={hero.cta_primary_text} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Primary Link</label>
              <select name="cta_primary_link" defaultValue={hero.cta_primary_link} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none font-semibold">
                {linkOptions.map((option) => (
                  <option key={option.href} value={option.href}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Secondary CTA Text</label>
              <input name="cta_secondary_text" defaultValue={hero.cta_secondary_text} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Secondary Link</label>
              <select name="cta_secondary_link" defaultValue={hero.cta_secondary_link} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none font-semibold">
                {linkOptions.map((option) => (
                  <option key={option.href} value={option.href}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="w-full bg-navy-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black">
            <Save className="w-5 h-5" />
            Update Hero Section
          </button>
        </form>
      </AdminDialog>

      <AdminDialog
        isOpen={activeTab === 'brand'}
        onClose={() => setActiveTab(null)}
        title="Branding"
        description="Firm identity and logos"
        isLoading={loading}
      >
        <BrandLogoForm brand={brand} updateBrand={updateBrand} />
      </AdminDialog>

      <AdminDialog
        isOpen={activeTab === 'nav'}
        onClose={() => setActiveTab(null)}
        title="Navigation Menu"
        description="Website link structure"
        isLoading={loading}
      >
        <div className="space-y-6">
          <div className="space-y-3">
            {navItems.map((item, index) => (
              <div key={index} className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-3 lg:flex-row lg:items-center">
                <div className="grid flex-1 gap-3 md:grid-cols-[1.15fr_1fr]">
                  <input
                    value={item.name}
                    onChange={e => handleNavChange(index, 'name', e.target.value)}
                    className="rounded-xl bg-white p-3 text-xs font-bold outline-none"
                    placeholder="Label"
                  />
                  <select
                    value={item.href}
                    onChange={e => handleNavChange(index, 'href', e.target.value)}
                    className="rounded-xl bg-white p-3 text-xs font-bold outline-none"
                  >
                    {linkOptions.map((option) => (
                      <option key={option.href} value={option.href}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleNavMove(index, -1)}
                    disabled={index === 0}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition-all hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Move link up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavMove(index, 1)}
                    disabled={index === navItems.length - 1}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-slate-500 transition-all hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Move link down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleNavRemove(index)} className="rounded-xl p-3 text-red-500 transition-colors hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={handleNavAdd} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-100 p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:border-navy-900 hover:text-navy-900">
              <Plus className="w-4 h-4" /> Add Link
            </button>
          </div>
          <button type="button" onClick={onNavSubmit} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-900 p-5 font-black uppercase tracking-widest text-white transition-all hover:bg-black">
            <Save className="w-5 h-5" />
            Publish Changes
          </button>
        </div>
      </AdminDialog>

      <AdminDialog
        isOpen={activeTab === 'metrics'}
        onClose={() => setActiveTab(null)}
        title="Site Metrics"
        description="Key performance indicators"
        isLoading={loading}
      >
        <div className="space-y-6">
          <div className="space-y-4">
            {metricItems.map((item, index) => (
              <div key={index} className="flex gap-4 items-center bg-gray-50 p-6 rounded-3xl">
                <div className="flex-1 space-y-2">
                  <label className="text-[8px] font-black uppercase text-gray-400">Label</label>
                  <input value={item.label} onChange={e => handleMetricChange(index, 'label', e.target.value)} className="w-full bg-white p-3 rounded-xl text-xs font-bold outline-none" />
                </div>
                <div className="w-24 space-y-2">
                  <label className="text-[8px] font-black uppercase text-gray-400">Value</label>
                  <input value={item.value} onChange={e => handleMetricChange(index, 'value', e.target.value)} className="w-full bg-white p-3 rounded-xl text-xs font-bold outline-none" />
                </div>
                <div className="flex-1 space-y-2">
                  <IconPicker 
                    value={item.icon}
                    onChange={(val) => handleMetricChange(index, 'icon', val)}
                  />
                </div>
                <button onClick={() => handleMetricRemove(index)} className="mt-4 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={handleMetricAdd} className="w-full p-4 border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:border-navy-900 hover:text-navy-900 transition-all font-black uppercase text-[10px] tracking-widest gap-2">
              <Plus className="w-4 h-4" /> Add Metric
            </button>
          </div>
          <button onClick={() => runTask(async () => { await updateMetrics(metricItems) }, true)} className="w-full bg-navy-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
            <Save className="w-5 h-5" />
            Update Metrics
          </button>
        </div>
      </AdminDialog>

      <AdminDialog
        isOpen={activeTab === 'footer'}
        onClose={() => setActiveTab(null)}
        title="Footer & Legal"
        description="Global footer content and legals"
        isLoading={loading}
      >
        <form action={withLoading(updateFooter)} className="space-y-6">
          <input type="hidden" name="quickLinksJson" value={JSON.stringify(footerQuickLinks)} />
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Summary Paragraph</label>
              <textarea name="description" defaultValue={footer.description} rows={3} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all resize-none text-sm font-medium" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Legal Disclaimer</label>
              <textarea name="legal_disclaimer" defaultValue={footer.legal_disclaimer} rows={2} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all resize-none text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Office Hours (List)</label>
              <textarea name="office_hours" defaultValue={footer.office_hours?.join('\n')} rows={4} className="w-full p-4 bg-gray-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-navy-900 transition-all font-mono text-[10px] uppercase font-bold" placeholder="One entry per line..." />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400">Footer Quick Links</label>
              {footerQuickLinks.map((item: any, index: number) => (
                <div key={`${item.name}-${index}`} className="flex gap-3 rounded-2xl bg-gray-50 p-3">
                  <input
                    value={item.name}
                    onChange={(e) => handleFooterLinkChange(index, 'name', e.target.value)}
                    className="flex-1 rounded-xl bg-white p-3 text-xs font-bold outline-none"
                    placeholder="Label"
                  />
                  <select
                    value={item.href}
                    onChange={(e) => handleFooterLinkChange(index, 'href', e.target.value)}
                    className="flex-1 rounded-xl bg-white p-3 text-xs font-semibold outline-none"
                  >
                    {linkOptions.map((option) => (
                      <option key={option.href} value={option.href}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => handleFooterLinkRemove(index)} className="rounded-xl p-3 text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleFooterLinkAdd} className="w-full rounded-2xl border-2 border-dashed border-gray-100 p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:border-navy-900 hover:text-navy-900">
                Add Quick Link
              </button>
            </div>
          </div>
          <button className="w-full bg-navy-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
            <Save className="w-5 h-5" />
            Update Footer
          </button>
        </form>
      </AdminDialog>

      <AdminDialog
        isOpen={activeTab === 'content'}
        onClose={() => setActiveTab(null)}
        title="Pages & Content"
        description="Edit every text, label, and copy on your site — visually or via JSON"
        isLoading={loading}
      >
        <ContentVisualEditor
          initialContent={content}
          updateContent={updateContent}
          withLoading={withLoading}
        />
      </AdminDialog>

      <AdminDialog
        isOpen={activeTab === 'meeting'}
        onClose={() => setActiveTab(null)}
        title="Meeting Controls"
        description="Virtual meeting launch and recording preferences"
        isLoading={loading}
      >
        <form action={withLoading(updateMeetingConfig)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Storage Mode</label>
              <select
                name="storageMode"
                value={meetingConfig.storageMode}
                onChange={(e) => setMeetingConfig({ ...meetingConfig, storageMode: e.target.value })}
                className="w-full rounded-xl bg-gray-50 p-4 text-xs font-bold outline-none"
              >
                <option value="SERVER">Server Path</option>
                <option value="BROWSER">Local Device Download</option>
                <option value="BOTH">Server + Local Device</option>
                <option value="GOOGLE_DRIVE">Google Drive Queue</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Server Save Path</label>
              <input
                name="localSavePath"
                value={meetingConfig.localSavePath}
                onChange={(e) => setMeetingConfig({ ...meetingConfig, localSavePath: e.target.value })}
                className="w-full rounded-xl bg-gray-50 p-4 text-xs font-mono outline-none"
                placeholder="public/meeting-recordings"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Google Drive Folder Id</label>
              <input
                name="googleDriveFolderId"
                value={meetingConfig.googleDriveFolderId || ''}
                onChange={(e) => setMeetingConfig({ ...meetingConfig, googleDriveFolderId: e.target.value })}
                className="w-full rounded-xl bg-gray-50 p-4 text-xs font-mono outline-none"
                placeholder="Optional folder id for queue handoff"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'allowRecording', label: 'Enable Recording' },
              { key: 'autoUploadToServer', label: 'Auto Upload To Server' },
              { key: 'autoDownloadToBrowser', label: 'Auto Download To Device' },
              { key: 'fullScreenByDefault', label: 'Open Workspace Full Screen' },
              { key: 'preferEmbeddedView', label: 'Prefer Embedded Meeting View' },
              { key: 'sameTabOnly', label: 'Force Same Tab Flow' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 text-xs font-black uppercase tracking-widest text-primary">
                <input
                  type="checkbox"
                  name={item.key}
                  checked={Boolean(meetingConfig[item.key])}
                  onChange={(e) => setMeetingConfig({ ...meetingConfig, [item.key]: e.target.checked })}
                  className="h-4 w-4"
                />
                {item.label}
              </label>
            ))}
          </div>

          <button className="w-full bg-navy-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all">
            <Save className="w-5 h-5" />
            Save Meeting Controls
          </button>
        </form>
      </AdminDialog>

      <AdminDialog
        isOpen={activeTab === 'users'}
        onClose={() => setActiveTab(null)}
        title="Admin Users"
        description="Create, update, and remove dashboard accounts"
        isLoading={loading}
      >
        <div className="space-y-8">
          <div className="space-y-4">
            {adminUsers.map((user: any, index: number) => (
              <div key={user.id} className="rounded-3xl bg-gray-50 p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={user.name}
                    onChange={(e) => {
                      const next = [...adminUsers]
                      next[index] = { ...next[index], name: e.target.value }
                      setAdminUsers(next)
                    }}
                    className="rounded-xl bg-white p-4 text-xs font-bold outline-none"
                    placeholder="Name"
                  />
                  <input
                    value={user.email}
                    onChange={(e) => {
                      const next = [...adminUsers]
                      next[index] = { ...next[index], email: e.target.value }
                      setAdminUsers(next)
                    }}
                    className="rounded-xl bg-white p-4 text-xs font-bold outline-none"
                    placeholder="Email"
                  />
                  <input
                    value={user.role}
                    onChange={(e) => {
                      const next = [...adminUsers]
                      next[index] = { ...next[index], role: e.target.value }
                      setAdminUsers(next)
                    }}
                    className="rounded-xl bg-white p-4 text-xs font-bold outline-none"
                    placeholder="Role"
                  />
                  <input
                    type="password"
                    placeholder="New password (optional)"
                    className="rounded-xl bg-white p-4 text-xs font-bold outline-none"
                    onChange={(e) => {
                      const next = [...adminUsers]
                      next[index] = { ...next[index], password: e.target.value }
                      setAdminUsers(next)
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => runTask(async () => {
                      const formData = new FormData()
                      formData.set('id', user.id)
                      formData.set('name', user.name)
                      formData.set('email', user.email)
                      formData.set('role', user.role)
                      if (user.password) {
                        formData.set('password', user.password)
                      }
                      await updateAdminUser(formData)
                    })}
                    className="rounded-2xl bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white"
                  >
                    Save User
                  </button>
                  <button
                    type="button"
                    onClick={() => runTask(async () => {
                      const formData = new FormData()
                      formData.set('id', user.id)
                      await deleteAdminUser(formData)
                      setAdminUsers(adminUsers.filter((item: any) => item.id !== user.id))
                    })}
                    className="rounded-2xl border border-red-200 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-red-600"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-dashed border-gray-200 p-5 space-y-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">Add Admin User</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newAdminUser.name} onChange={(e) => setNewAdminUser({ ...newAdminUser, name: e.target.value })} className="rounded-xl bg-gray-50 p-4 text-xs font-bold outline-none" placeholder="Name" />
              <input value={newAdminUser.email} onChange={(e) => setNewAdminUser({ ...newAdminUser, email: e.target.value })} className="rounded-xl bg-gray-50 p-4 text-xs font-bold outline-none" placeholder="Email" />
              <input type="password" value={newAdminUser.password} onChange={(e) => setNewAdminUser({ ...newAdminUser, password: e.target.value })} className="rounded-xl bg-gray-50 p-4 text-xs font-bold outline-none" placeholder="Password" />
              <input value={newAdminUser.role} onChange={(e) => setNewAdminUser({ ...newAdminUser, role: e.target.value })} className="rounded-xl bg-gray-50 p-4 text-xs font-bold outline-none" placeholder="Role" />
            </div>
            <button
              type="button"
              onClick={() => runTask(async () => {
                const formData = new FormData()
                formData.set('name', newAdminUser.name)
                formData.set('email', newAdminUser.email)
                formData.set('password', newAdminUser.password)
                formData.set('role', newAdminUser.role)
                await createAdminUser(formData)
                setNewAdminUser({ name: '', email: '', password: '', role: 'admin' })
              })}
              className="w-full rounded-2xl bg-navy-900 p-5 text-[10px] font-black uppercase tracking-widest text-white"
            >
              Create Admin User
            </button>
          </div>
        </div>
      </AdminDialog>
    </div>
  )
}
