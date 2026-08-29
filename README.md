# FF Beauty Package Studio: Website

A static, no-build website (`index.html` + `css/style.css` + `js/main.js`). No npm, no framework. Open it or drop it on any static host.

## Run it locally

Double-clicking `index.html` works, but for the smoothest experience (fonts, smooth-scroll) serve it over a local server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

## Things to fill in before launch

Search the codebase for these placeholders and replace them with real info:

- **Hours**: `index.html`, `#book` section (`[Insert Hours]`)
- **Address**: `index.html`, `#book` section (`[Insert Studio Address]`)
- **Instagram / Facebook links**: `index.html`, `#book` section (`href="#"` on the social links)
- **Client reviews**: `index.html`, `#reviews` section. Three placeholder quote cards are ready. Replace the bracketed text with real client quotes and names.

## Current media status

Real photos and one video from the studio are wired in:

- **Studio panel** and **Package section**: real photos (`assets/images/studio-bridal-updo.webp`, `assets/images/traditional-dressing-kente.webp`)
- **Gallery**: 11 real photos plus a lazy-loaded, autoplaying braiding video. Sisterlocks, Box Braids, Loc Repairs & Retwist, Color Services, and Crochet Styles have no photos yet, so instead of a placeholder card in the gallery, they're listed in a short text note just below it ("Also on the Menu"), pointing back to the full Services list.

The full set of supplied photos lives in `assets/images/` as the original `WhatsApp Image...` files. A curated, compressed subset (clean filenames, WebP) is what the site actually uses. The four multi-photo collage images were cropped down into individual clean shots rather than used as-is (a collage grid with white gutters reads as a screenshot, not photography). One supplied photo (a lash-application close-up) was left out because it carries a visible third-party watermark ("AMG") in the frame; it's still in the folder if the rights to use it are confirmed.

Real photos load eagerly rather than lazily (no `loading="lazy"`), trading a small amount of upfront weight for reliability, since a photo that never appears is worse than one that costs a few extra kilobytes.

## Adding Photos & Video (without slowing the site down)

The rule for adding more: **where the file lives matters less than how it's loaded.** A handful of well-compressed local images will always load fine. A single uncompressed phone photo (4 to 8MB) will not.

### Photos

1. Compress and resize first. Export at the size the photo actually displays on screen (roughly 700 to 900px wide for a gallery card, up to about 1100px wide for the Studio/Package panels, never the raw 3000px+ camera/phone resolution), as **WebP**. [squoosh.app](https://squoosh.app) does this in the browser, no install needed. Target ballpark: 80 to 150KB for a gallery card.
2. Drop the finished file into `assets/images/`.
3. Wire it in: find the matching `.gallery-card` in `index.html` and add the image as the first child, replacing a placeholder:
   ```html
   <div class="gallery-card" data-tone="2">
     <img src="assets/images/your-file.webp" alt="Describe the photo" decoding="async">
     <span class="gallery-label">Sisterlocks</span>
   </div>
   ```
   The gold gradient stays as an instant fallback while the photo loads, the film-grain overlay and caption scrim keep sitting on top automatically. No CSS changes needed.
4. Portrait orientation (4:5 or 3:4) fits the Studio panel, Package panel, and gallery cards best.

### Video

Don't self-host anything long. For a quick looping clip (10 to 20 seconds):

1. Compress it. H.264 mp4, capped at 720p, muted (looping clips never need audio), aiming under 3 to 5MB:
   ```bash
   ffmpeg -i input.mov -vf scale=720:-2 -c:v libx264 -crf 28 -preset slow -an assets/video/your-clip.mp4
   ```
2. In `index.html`, use `data-src` instead of `src` so it doesn't download until it's about to scroll into view (already wired up in `js/main.js`):
   ```html
   <video poster="assets/images/your-poster.jpg" data-src="assets/video/your-clip.mp4" muted loop playsinline autoplay preload="none"></video>
   ```

For anything longer than a short loop (a full behind-the-scenes reel, video testimonials), host it on YouTube (unlisted) or Vimeo and embed the player instead. Their CDN carries the bandwidth, your site stays light either way.

### Once real media is in: deploy to a CDN-backed host

A plain server (or `file://`) has no compression or edge caching. Deploying to **Netlify, Vercel, Cloudflare Pages, or GitHub Pages** (all free for a site this size) automatically serves everything compressed from an edge network close to the visitor. That's a bigger real-world speed win than anything above, and takes about five minutes once you're ready to go live.

## Structure

```
index.html         all markup and content (services list matches the flyer exactly)
css/style.css       design system: colors, type, layout, animation
js/main.js          preloader, custom cursor, nav, tabs, gallery drag, reveals, magnetic buttons, lazy video mount
assets/images/      photos (raw supplied files plus the compressed WebP versions actually used)
assets/video/       video clips (raw + compressed)
```

## Design notes

- Palette pulled from the original flyer: near-black, deep wine/burgundy, gold. Not a generic pastel "beauty site" palette.
- Type: Playfair Display (editorial serif) + Alex Brush (script accent, echoing the "Studio" script on the flyer) + Jost (clean sans for body/UI).
- Interaction details worth knowing about: custom gold cursor (desktop only), scroll-triggered line reveals, a draggable horizontal gallery strip, animated tab underline, and magnetic hover on primary buttons. All motion respects `prefers-reduced-motion`.
- Content is visible by default and only animates once JavaScript confirms it can run (a tiny inline script sets a `js` class on `<html>`, and everything that starts hidden is scoped under `.js` in the CSS). If a script is ever blocked or fails, nothing on the page goes missing, it just skips the animation. The preloader is the one exception worth knowing about: it only appears once `.js` is set, and even then a pure-CSS animation force-hides it after about 3 seconds no matter what, so it can never get stuck covering the site.
