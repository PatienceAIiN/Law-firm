'use client'

import { useMemo, useState } from 'react'
import { Plus, Edit3, Trash2, Eye, Save, LayoutGrid } from 'lucide-react'
import { AdminDialog } from './admin-dialog'
import { ImageUpload } from './image-upload'
import { updateSitePages } from '@/app/admin/(authenticated)/settings/actions'
import { type SitePage, type SitePagePlacement } from '@/lib/site-pages'

interface PageManagerProps {
  initialPages: SitePage[]
}

function createDraftPage(): SitePage {
  const now = new Date().toISOString()
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    slug: '',
    summary: '',
    content: '',
    heroImage: '',
    placement: 'BOTH',
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\/+/, '')
}

function placementLabel(value: SitePagePlacement) {
  switch (value) {
    case 'NAVBAR':
      return 'Navbar'
    case 'FOOTER':
      return 'Footer'
    case 'BOTH':
      return 'Both'
    default:
      return 'Hidden'
  }
}

export function PageManager({ initialPages }: PageManagerProps) {
  const [pages, setPages] = useState(initialPages)
  const [saving, setSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [previewPage, setPreviewPage] = useState<SitePage | null>(null)
  const [draft, setDraft] = useState<SitePage | null>(null)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')),
    [pages]
  )

  const persistPages = async (next: SitePage[]) => {
    setSaving(true)
    try {
      await updateSitePages(next)
      setPages(next)
    } finally {
      setSaving(false)
    }
  }

  const startCreate = () => {
    setDraft(createDraftPage())
    setEditorMode('create')
    setEditorOpen(true)
  }

  const startEdit = (page: SitePage) => {
    setDraft({ ...page })
    setEditorMode('edit')
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setDraft(null)
    setPreviewPage(null)
  }

  const saveDraft = async () => {
    if (!draft?.title.trim() || !draft?.slug.trim()) return

    const normalizedSlug = normalizeSlug(draft.slug)
    const duplicate = pages.find((page) => page.slug === normalizedSlug && page.id !== draft.id)
    if (duplicate) {
      window.alert('A page with this slug already exists.')
      return
    }

    const nextPage = {
      ...draft,
      slug: normalizedSlug,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      content: draft.content.trim(),
      heroImage: draft.heroImage?.trim() || '',
      updatedAt: new Date().toISOString(),
      createdAt: draft.createdAt || new Date().toISOString(),
      placement: draft.placement,
    }

    const existingIndex = editorMode === 'edit' ? pages.findIndex((page) => page.id === nextPage.id) : -1
    const next = existingIndex >= 0
      ? pages.map((page) => (page.id === nextPage.id ? nextPage : page))
      : [...pages, nextPage]

    await persistPages(next)
    closeEditor()
  }

  const deletePage = async (id: string) => {
    const target = pages.find((page) => page.id === id)
    if (!target) return
    if (!window.confirm(`Delete page "${target.title}"?`)) return
    await persistPages(pages.filter((page) => page.id !== id))
  }

  const updatePlacement = async (id: string, placement: SitePagePlacement) => {
    const next = pages.map((page) => (page.id === id ? { ...page, placement, updatedAt: new Date().toISOString() } : page))
    await persistPages(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Custom Pages</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter text-primary">
            Navbar, footer, and page content
          </h2>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#F6F0E8] hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Add More Page
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sortedPages.map((page) => (
          <div key={page.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">{page.slug}</p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-tighter text-[#0f172a]">{page.title}</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-slate-500">
                {placementLabel(page.placement)}
              </span>
            </div>

            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
              {page.summary || page.content || 'No content added yet.'}
            </p>

            <div className="mt-5 grid gap-3">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                Show in
              </label>
              <select
                value={page.placement}
                onChange={(e) => updatePlacement(page.id, e.target.value as SitePagePlacement)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none"
              >
                <option value="NONE">Hidden</option>
                <option value="NAVBAR">Navbar</option>
                <option value="FOOTER">Footer</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreviewPage(page)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-primary hover:text-primary"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={() => startEdit(page)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 transition-colors hover:border-primary hover:text-primary"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => deletePage(page.id)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedPages.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No custom pages yet. Add a page to wire it into the navbar and footer.
        </div>
      )}

      <AdminDialog
        isOpen={editorOpen}
        onClose={closeEditor}
        title={editorMode === 'edit' ? 'Edit Page' : 'Create Page'}
        description="Create a public page and choose where it appears"
        isLoading={saving}
      >
        {draft && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Title</label>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none"
                    placeholder="Rights & Policy"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Slug</label>
                  <input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: normalizeSlug(e.target.value) })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none"
                    placeholder="rights-policy"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Summary</label>
                  <textarea
                    value={draft.summary}
                    onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
                    placeholder="Short description shown in page intro."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Placement</label>
                  <select
                    value={draft.placement}
                    onChange={(e) => setDraft({ ...draft, placement: e.target.value as SitePagePlacement })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[#0f172a] outline-none"
                  >
                    <option value="NONE">Hidden</option>
                    <option value="NAVBAR">Navbar</option>
                    <option value="FOOTER">Footer</option>
                    <option value="BOTH">Both</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <ImageUpload
                  value={draft.heroImage || ''}
                  onChange={(url) => setDraft({ ...draft, heroImage: url })}
                  label="Hero Design Image"
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Page Content</label>
                  <textarea
                    value={draft.content}
                    onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                    rows={11}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-700 outline-none"
                    placeholder="Add the page body copy here. New lines render as separate paragraphs."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPreviewPage(draft)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600 transition-colors hover:border-primary hover:text-primary"
              >
                <LayoutGrid className="h-4 w-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#F6F0E8] hover:text-primary"
              >
                <Save className="h-4 w-4" />
                Save Page
              </button>
            </div>
          </div>
        )}
      </AdminDialog>

      <AdminDialog
        isOpen={Boolean(previewPage)}
        onClose={() => setPreviewPage(null)}
        title={previewPage?.title || 'Page Preview'}
        description="Desktop and mobile-safe preview"
      >
        {previewPage && (
          <div className="space-y-6">
            {previewPage.heroImage ? (
              <div className="overflow-hidden rounded-[28px] border border-slate-200">
                <img src={previewPage.heroImage} alt={previewPage.title} className="h-56 w-full object-cover" />
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Blank page preview
              </div>
            )}

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">{previewPage.slug}</p>
              <h3 className="mt-3 text-3xl font-black uppercase tracking-tighter text-[#0f172a]">{previewPage.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{previewPage.summary}</p>
              <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
                {previewPage.content
                  .split('\n')
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={`${previewPage.id}-${index}`}>{paragraph}</p>
                  ))}
              </div>
            </div>
          </div>
        )}
      </AdminDialog>
    </div>
  )
}
