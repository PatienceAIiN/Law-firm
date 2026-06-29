#!/usr/bin/env node
/**
 * generate-ads-with-gemini.mjs
 *
 * Uses Google Imagen (via the Gemini API) to mint a fresh batch of
 * viral pastel "Google-style ad" creatives for Instagram + LinkedIn +
 * the AppSumo listing. Overwrites the placeholders shipped under
 * appsumo-kit/social-ads/.
 *
 * Usage:
 *   export GEMINI_API_KEY=...    # https://aistudio.google.com/apikey
 *   node scripts/generate-ads-with-gemini.mjs
 *
 * Falls back to printing the prompts if no key is set, so you can
 * paste them into Imagen 3 / Midjourney / Ideogram by hand.
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'appsumo-kit', 'social-ads')

const SHARED_STYLE = `
viral pastel google-style minimal flat illustration, soft cream + lavender + amber gradient background,
crisp serif headline, single hero illustration of a friendly Indian lawyer in modern attire,
generous whitespace, rounded UI cards, soft drop shadow, sharp 4k render, no text artifacts,
brand colours: navy #14203E + gold #B7913D + amber accents.
`

const ADS = [
  {
    file: 'instagram-square.png',
    aspect: '1:1',
    prompt: `${SHARED_STYLE}
Hero headline reads "Find a Barrister in 60 seconds".
Subhead "Chat • Video call • Book online".
Bottom-right tagline pill "Barrister by Patience AI".
Square 1080x1080 social poster, instagram-feed friendly.`,
  },
  {
    file: 'instagram-story.png',
    aspect: '9:16',
    prompt: `${SHARED_STYLE}
Tall portrait 1080x1920 instagram story.
Big headline "Find your lawyer. Instantly.".
Sub-text "Across every Indian state, city & PIN code".
CTA pill bottom: "Try Find a Barrister →".`,
  },
  {
    file: 'linkedin-landscape.png',
    aspect: '16:9',
    prompt: `${SHARED_STYLE}
LinkedIn share card 1200x627, business-pastel aesthetic.
Headline "India's first chat + video lawyer directory".
Subhead "For solo advocates and small firms — free workspaces, AppSumo lifetime deal".
Inline credibility line "10,000+ districts • Live chat • Razorpay payouts".`,
  },
  {
    file: 'google-display-ad.png',
    aspect: '16:9',
    prompt: `${SHARED_STYLE}
Google Display 1200x628.
Hero "Your law firm. Fully online.".
Sub "Branded site • Lawyer portal • Find-Barrister listing • LawAI assistant".
CTA: "Start a workspace — free".`,
  },
  {
    file: 'newsletter-banner.png',
    aspect: '21:9',
    prompt: `${SHARED_STYLE}
Email-newsletter top banner 1200x400.
Headline "Now live: Find a Barrister".
Tag "From any state, city, locality or PIN — chat or video call in seconds.".`,
  },
]

const API = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict'

async function callImagen(prompt, aspectRatio) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY not set')
  const res = await fetch(`${API}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio, safetyFilterLevel: 'block_only_high', personGeneration: 'allow_adult' },
    }),
  })
  if (!res.ok) throw new Error(`Imagen API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded
  if (!b64) throw new Error('No image in response: ' + JSON.stringify(data).slice(0, 200))
  return Buffer.from(b64, 'base64')
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  if (!process.env.GEMINI_API_KEY) {
    console.log('\nGEMINI_API_KEY not set — printing prompts for manual generation:\n')
    for (const a of ADS) console.log(`\n=== ${a.file} (${a.aspect}) ===\n${a.prompt}\n`)
    console.log('\nGet a free key at https://aistudio.google.com/apikey and re-run.')
    process.exit(0)
  }
  for (const a of ADS) {
    process.stdout.write(`Generating ${a.file} (${a.aspect})… `)
    try {
      const buf = await callImagen(a.prompt.trim(), a.aspect)
      await writeFile(join(OUT_DIR, a.file), buf)
      console.log('✓')
    } catch (e) {
      console.log('✗', e.message)
    }
  }
  console.log(`\nDone. Files written to ${OUT_DIR}.`)
  console.log('Replace AppSumo listing photos by uploading the same files to the AppSumo dashboard.')
}

main().catch((e) => { console.error(e); process.exit(1) })
