---
name: deploy-online
description: Use when publishing Le Mille e Una Derivata online (GitHub Pages), after changes to demo-1/demo-2/demo-3/demo-4. Commits on main, pushes, waits for the Pages workflow and verifies all demo URLs with scripts/deploy-online.sh.
---

# Deploy online — GitHub Pages

Pubblica il repository su GitHub Pages con lo script dello stesso repo. Non
inventare comandi `gh` o passaggi manuali: lo script incapsula commit, push,
attesa del workflow e verifica delle URL.

## Quando usarla

Solo quando l'utente chiede esplicitamente di pubblicare, aggiornare online o
pushare su GitHub Pages. Non usarla per semplici salvataggi locali.

## Prerequisiti

- Essere sul branch `main` (il workflow parte solo da `main`).
- `gh` autenticato (`gh auth status`).
- `npm` e dipendenze installate.
- Nessun altro agente deve avere modifiche non committate che non vuoi
  pubblicare: lo script usa `git add -A`.

## Comando

```bash
scripts/deploy-online.sh -m "feat: descrizione della modifica"
```

Varianti:

```bash
scripts/deploy-online.sh --skip-checks -m "docs: aggiorna guida"   # solo commit/push/deploy
scripts/deploy-online.sh --full-checks -m "feat: modifica grande" # lint + API + unit + E2E smoke
scripts/deploy-online.sh --no-wait -m "feat: pubblica senza attendere"
```

Il messaggio è obbligatorio in pratica: descrivi cosa cambia e perché, in una
riga, come negli altri commit del repo.

## Cosa fa lo script

1. Verifica branch, `git`, `npm`, `gh` e autenticazione.
2. Esegue i test unitari e `npm run build` (demo 1, 2 e 3). Con `--full-checks`
   esegue anche `npm run lint`, `npm run test:api` e `npm run test:e2e:smoke`.
3. Fa `git add -A`, commit e push su `origin/main`.
4. Se non c'è nulla da pushare, avvia il workflow con `gh workflow run
deploy-pages.yml`.
5. Attende il run GitHub Pages con `gh run watch --exit-status`.
6. Verifica con `curl` che rispondano `200`:
   - `/`
   - `/demo-2/`
   - `/demo-3/`
   - `/demo-4/`

Se una pagina non risponde, lo script termina con errore e stampa il link alle
Actions.

## Dopo il deploy

Riporta all'utente:

- hash breve del commit e numero del run;
- URL `https://coachgodzup.github.io/palazzo_derivate/`;
- eventuali pagine fallite e il link ai log.

Se il browser mostra la versione vecchia, è cache: suggerisci un refresh forzato
(⌘⇧R) o l'URL con `?deploy=<hash>` incluso nello script.

## Problemi comuni

- **`sei sul branch ...`** — torna su `main` prima di pubblicare.
- **`gh non è autenticato`** — esegui `gh auth login`.
- **Build o test falliti** — correggi e rilancia; non usare `--skip-checks` per
  aggirare un errore reale.
- **Il run non compare** — controlla `gh run list --workflow=deploy-pages.yml`
  e che il push sia arrivato su `origin/main`.
- **Una pagina resta non-200** — attende qualche minuto: la propagazione di
  GitHub Pages può essere più lenta del workflow; poi riprova con l'URL
  cache-busted.
- **Demo-4** — l'export Web Godot avviene nel workflow, non in locale; lo script
  verifica solo che gli asset siano serviti.
