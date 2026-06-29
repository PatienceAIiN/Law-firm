# Gemini / Imagen prompts — Find a Barrister ad set

Paste each block into Google AI Studio (https://aistudio.google.com),
**Gemini** (with "Generate image" enabled) or **Imagen 3**. Save the
result with the filename shown above each block — drop them into
`appsumo-kit/social-ads/` to replace the placeholders.

---

## Shared style (prepend if your prompt UI doesn't carry the system instruction)

> Viral pastel Google-style minimal flat illustration. Soft cream + lavender + amber gradient background. Crisp serif headline, single hero illustration of a friendly Indian lawyer in modern attire, generous whitespace, rounded UI cards, soft drop shadow, 4k render, no text artifacts. Brand colours: navy #14203E + gold #B7913D + amber accents. The phrase **"Find a Barrister"** must appear sharp and legible.

---

### `instagram-square.png` — 1:1 (1080 × 1080)
```
Viral pastel Google-style flat illustration. Soft cream + amber gradient background, navy #14203E and gold #B7913D accents. Square 1080x1080 Instagram feed poster.

Headline (large serif): "Find a Barrister in 60 seconds"
Subtext: "Chat · Video call · Book online — across every Indian state, city and PIN"
Hero illustration: friendly Indian lawyer in modern attire holding a phone with a chat bubble.
Bottom right pill: "Barrister by Patience AI".
No spelling errors. Generous whitespace.
```

### `instagram-story.png` — 9:16 (1080 × 1920)
```
Viral pastel Google-style flat illustration. Cream + lavender + amber gradient. Portrait 1080x1920 Instagram story.

Huge headline at the top: "Find your lawyer. Instantly."
Sub-text: "Across every Indian state, city & PIN code."
Center hero: stylised map of India with glowing pins, lawyer avatar smiling alongside.
Bottom CTA pill: "Try Find a Barrister →"
Brand mark: navy #14203E + gold #B7913D. Sharp, legible text only.
```

### `linkedin-landscape.png` — 1.91:1 (1200 × 627)
```
LinkedIn share card 1200x627, business-pastel aesthetic. Cream + amber gradient.

Headline: "India's first chat + video lawyer directory"
Sub: "For solo advocates & small firms — free workspaces, AppSumo lifetime deal."
Credibility row (icons): "10,000+ districts · Live chat · Razorpay payouts".
Right side: laptop mockup showing a lawyer profile with "Chat" and "Video call" buttons.
Navy #14203E header text, gold #B7913D accents.
```

### `google-display-ad.png` — 1.91:1 (1200 × 628)
```
Google Display 1200x628 ad. Pastel cream + amber gradient.

Hero headline: "Your law firm. Fully online."
Sub: "Branded site · Lawyer portal · Find-Barrister listing · LawAI assistant."
CTA button: "Start a workspace — free"
Illustration: confident Indian lawyer with a laptop showing a clean dashboard. Tiny gold scale-of-justice motif.
Brand palette navy #14203E + gold #B7913D + cream #FFFCF8.
```

### `newsletter-banner.png` — 3:1 (1200 × 400)
```
Email-newsletter top banner 1200x400. Cream + amber pastel gradient.

Headline (centered): "Now live: Find a Barrister"
Tagline: "From any state, city, locality or PIN — chat or video call in seconds."
Left: small lawyer illustration. Right: phone mockup with the directory cards. Gold underline beneath the headline.
```

---

## Where the rendered files go

```
appsumo-kit/social-ads/
  ├── instagram-square.png        ← 1080×1080
  ├── instagram-story.png         ← 1080×1920
  ├── linkedin-landscape.png      ← 1200×627
  ├── google-display-ad.png       ← 1200×628
  └── newsletter-banner.png       ← 1200×400
```

Upload the same files to AppSumo Vendor → Media. Caption copy is in
`appsumo-kit/social-ads/captions.md`.

---

## Automated alternative

```bash
export GEMINI_API_KEY=…    # https://aistudio.google.com/apikey
node scripts/generate-ads-with-gemini.mjs
```

mints all 5 PNGs in one run via the Imagen 3 endpoint.
