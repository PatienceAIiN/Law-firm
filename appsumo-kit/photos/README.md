# AppSumo Photo Kit — Section-by-Section

All images are pre-rendered at the **exact** dimensions AppSumo's vendor portal expects. Copy the file straight into the matching upload field — no resizing required.

| File | Dimensions | AppSumo section | Notes |
| --- | --- | --- | --- |
| `logo-square.png` | 512 × 512 PNG | "Brand logo" + "Marketplace icon" | Transparent-friendly, used as the small product avatar across Sumo. |
| `banner-hero.png` | 1200 × 630 PNG | "Listing hero" + OG share image | Used as the marketplace card preview AND when buyers share on social. |
| `screenshot-dashboard.png` | 1920 × 1080 PNG | "Product screenshots #1" | Admin overview — the headline shot. Recommend placing FIRST. |
| `screenshot-public.png` | 1920 × 1080 PNG | "Product screenshots #2" | Public-facing branded site. |
| `screenshot-lawai.png` | 1920 × 1080 PNG | "Product screenshots #3" | LawAI assistant — biggest "wow" shot. |
| `screenshot-lawyer.png` | 1920 × 1080 PNG | "Product screenshots #4" | Lawyer portal — proves the multi-role story. |
| `screenshot-branding.png` | 1920 × 1080 PNG | "Product screenshots #5" | Branding panel — shows the white-label angle. |
| `mobile-dashboard.png` | 1080 × 2400 PNG | "Mobile screenshots #1" | Phone view of the admin dashboard. |
| `mobile-lawai.png` | 1080 × 2400 PNG | "Mobile screenshots #2" | Phone view of LawAI chat. |
| `mobile-public.png` | 1080 × 2400 PNG | "Mobile screenshots #3" | Phone view of the public site. |
| `walkthrough.mp4` | 1920 × 1080, 60-90s | "Product video" | **You still need to record this.** Suggested script in `walkthrough-script.md`. |

## Upload order in the vendor portal

1. **Branding tab**
   - Marketplace icon → `logo-square.png`
   - Listing hero → `banner-hero.png`
2. **Media tab → Screenshots (desktop)**
   - Slot 1 → `screenshot-dashboard.png`
   - Slot 2 → `screenshot-public.png`
   - Slot 3 → `screenshot-lawai.png`
   - Slot 4 → `screenshot-lawyer.png`
   - Slot 5 → `screenshot-branding.png`
3. **Media tab → Mobile screenshots**
   - Slot 1 → `mobile-dashboard.png`
   - Slot 2 → `mobile-lawai.png`
   - Slot 3 → `mobile-public.png`
4. **Media tab → Product video** → upload your `walkthrough.mp4`.

## Replacing the placeholders with real screenshots

The PNGs in this folder are stylistic mockups generated from the project's color tokens — they're good enough to submit, but a real product screenshot will convert better. To replace any of them:

1. Spin up a workspace with seed data (`harsh-and-co` is the reference tenant).
2. Open the page that matches the file name (`/team/<slug>/admin` for `screenshot-dashboard.png`, etc.).
3. Take a 1920×1080 screenshot (Chrome DevTools → device toolbar → "Responsive" → set viewport, then `Cmd/Ctrl+Shift+P` → "Capture full size screenshot").
4. Save with the **same filename** in this folder — the submission checklist will pick it up.

## License

These mockups are project-owned. You're free to use, edit, and republish them across AppSumo, your own marketing site, social posts, and product hunt.
