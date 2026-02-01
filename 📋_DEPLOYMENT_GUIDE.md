# Deployment EduNet19 su GitHub Pages e Cloudflare Pages

La guida di **Deployment EduNet19** spiega come pubblicare il sito su GitHub Pages e Cloudflare Pages con dominio personalizzato o sottodominio GitHub, mantenendo la massima flessibilità.

## Requisiti di Deployment EduNet19
- Hosting statico (non serve build step).
- Root del progetto come output (`.`).
- File principali presenti: `index.html`, `homepage.html`, `pages/`, `js/`, `css/`.

## GitHub Pages (project site)
1. Apri **Settings → Pages** del repository.
2. Seleziona **Branch** (es. `main`) e **Root**.
3. Salva e attendi la pubblicazione su `https://username.github.io/repo/`.
4. Verifica che `index.html` si apra correttamente e che i link tra `pages/` funzionino.

## GitHub Pages (user/organization site)
1. Usa un repository chiamato `username.github.io`.
2. Pubblica dalla root del branch principale.
3. Il sito sarà disponibile su `https://username.github.io/`.

## Cloudflare Pages
1. Crea un nuovo progetto in Cloudflare Pages.
2. **Build command**: lascia vuoto.
3. **Output directory**: `.` (root del progetto).
4. Verifica che il file `_headers` sia in root per le policy cache.

## Dominio personalizzato
- **GitHub Pages**: configura il dominio in Settings → Pages e aggiungi un file `CNAME` con il dominio.
- **Cloudflare Pages**: configura il dominio da “Custom Domains”.

## Verifiche post-deploy
- Home e autenticazione: `index.html` e `homepage.html`.
- Reset password: `pages/auth/reset-password.html`.
- Pagine profilo: `pages/profile/profile.html` e `pages/profile/settings.html`.
- Admin: `pages/admin/manage-admins.html`.

## Riferimenti utili
- Struttura progetto: `README_STRUTTURA_PROGETTO.md`
- Checklist di rilascio: `🚀_LAUNCH_CHECKLIST.md`
- Panoramica progetto: `README.md`