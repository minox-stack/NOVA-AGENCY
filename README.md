# NOVA-AGENCY

Portfolio of Mohamed Amine Hebilez — NOVA Agency. Live at **https://novadz.space**.

Website development · video editing · social media advertising · UX/UI design · creator of the FOWZ platform.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | English version |
| `ar.html` | Arabic version (right-to-left) |
| `styles.css` | All styles, including the liquid-glass look and the light mode for slower devices |
| `script.js` | Project filters, project popup, contact form (email / WhatsApp), language switch |
| `fx.js` | Visual effects: loader, smooth scrolling, animated background, cursor, ripples, scroll effects |
| `assets/` | Photo, logos, project images, icons |

Plain HTML, CSS and JavaScript — no build step. Smooth scrolling loads [Lenis](https://github.com/darkroomengineering/lenis) from a CDN.

## Publishing

Every push to `main` is published to GitHub Pages (`.github/workflows/`), on the custom domain novadz.space.

Test the effects levels by adding `?fx=lite` or `?fx=full` to the address.
