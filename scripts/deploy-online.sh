#!/usr/bin/env bash
#
# Pubblica le demo su GitHub Pages partendo da `main`.
#
# Il deploy online è il workflow `.github/workflows/deploy-pages.yml`, che parte
# a ogni push su `main`. Questo script prepara il commit, pusha, attende la fine
# del workflow e verifica che le pagine rispondano.
#
# Uso:
#   scripts/deploy-online.sh -m "feat: descrizione modifica"
#   scripts/deploy-online.sh --skip-checks -m "docs: aggiorna guida"
#   scripts/deploy-online.sh --full-checks -m "feat: modifica grande"
#
# Opzioni:
#   -m, --message TESTO   messaggio di commit (default: "chore: aggiorna demo online")
#       --skip-checks     salta build e test unitari
#       --full-checks     esegue anche lint, test API e test E2E smoke
#       --no-wait         non attende né verifica il deploy
#   -h, --help            mostra questo aiuto

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
PAGES_BASE="${PAGES_BASE:-https://coachgodzup.github.io/palazzo_derivate}"
MESSAGE="chore: aggiorna demo online"
CHECK_MODE="default"
WAIT_DEPLOY=1

die() {
  echo "errore: $*" >&2
  exit 1
}

usage() {
  sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      [[ $# -ge 2 ]] || die "manca il messaggio dopo $1"
      MESSAGE="$2"
      shift 2
      ;;
    --skip-checks)
      CHECK_MODE="skip"
      shift
      ;;
    --full-checks)
      CHECK_MODE="full"
      shift
      ;;
    --no-wait)
      WAIT_DEPLOY=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      die "opzione sconosciuta: $1 (usa --help)"
      ;;
    *)
      MESSAGE="$1"
      shift
      ;;
  esac
done

# --- prerequisiti -----------------------------------------------------------

command -v git >/dev/null || die "git non trovato"
command -v npm >/dev/null || die "npm non trovato"
command -v gh >/dev/null || die "gh (GitHub CLI) non trovato"
gh auth status >/dev/null 2>&1 || die "gh non è autenticato: esegui 'gh auth login'"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "non sei in un repository git"

CURRENT_BRANCH="$(git symbolic-ref --quiet --short HEAD || true)"
[[ "$CURRENT_BRANCH" == "$BRANCH" ]] ||
  die "sei sul branch '$CURRENT_BRANCH': il deploy online parte solo da '$BRANCH'"

echo "▶ Repo:   $ROOT"
echo "▶ Remoto: $REMOTE/$BRANCH"
echo "▶ Pagine: $PAGES_BASE/"
echo

# --- verifiche --------------------------------------------------------------

case "$CHECK_MODE" in
  skip)
    echo "▶ Verifiche saltate (--skip-checks)"
    ;;
  full)
    echo "▶ Lint"
    npm run lint
    echo "▶ Test API"
    npm run test:api
    echo "▶ Test unitari"
    npm run test:unit
    echo "▶ Test E2E smoke"
    npm run test:e2e:smoke
    ;;
  default)
    echo "▶ Test unitari"
    npm run test:unit
    ;;
esac

if [[ "$CHECK_MODE" != "skip" ]]; then
  echo "▶ Build locale (demo 1, 2 e 3)"
  npm run build
fi

# --- commit e push ----------------------------------------------------------

git fetch "$REMOTE" "$BRANCH" --quiet

git add -A
if git diff --cached --quiet; then
  echo "▶ Nessuna modifica da committare"
  COMMITTED=0
else
  git commit -m "$MESSAGE"
  COMMITTED=1
fi

UPSTREAM="$REMOTE/$BRANCH"
if git rev-parse --verify --quiet "$UPSTREAM" >/dev/null; then
  AHEAD="$(git rev-list --count "$UPSTREAM"..HEAD)"
else
  AHEAD=1
fi

if [[ "$AHEAD" -gt 0 ]]; then
  echo "▶ Push di $AHEAD commit su $UPSTREAM"
  git push "$REMOTE" "$BRANCH"
  PUSHED=1
else
  echo "▶ Nessun commit da pushare"
  PUSHED=0
fi

HEAD_SHA="$(git rev-parse HEAD)"
SHORT_SHA="$(git rev-parse --short HEAD)"
echo "▶ HEAD: $SHORT_SHA"

if [[ "$WAIT_DEPLOY" -eq 0 ]]; then
  echo "▶ Deploy non atteso (--no-wait)"
  exit 0
fi

# --- workflow GitHub Pages --------------------------------------------------

if [[ "$PUSHED" -eq 0 ]]; then
  echo "▶ Nessun push: avvio manuale del workflow di deploy"
  gh workflow run deploy-pages.yml --ref "$BRANCH"
fi

echo "▶ Cerco il run di deploy per $SHORT_SHA"
RUN_ID=""
for _ in $(seq 1 24); do
  RUN_ID="$(
    gh run list \
      --workflow=deploy-pages.yml \
      --branch "$BRANCH" \
      --limit 10 \
      --json databaseId,headSha \
      --jq ".[] | select(.headSha == \"$HEAD_SHA\") | .databaseId" |
      head -n 1
  )"
  [[ -n "$RUN_ID" ]] && break
  sleep 5
done
[[ -n "$RUN_ID" ]] || die "nessun run di deploy trovato per $SHORT_SHA"

echo "▶ Attendo il deploy (run $RUN_ID)"
gh run watch "$RUN_ID" --exit-status --interval 10

# --- verifica delle pagine --------------------------------------------------

echo "▶ Verifico le pagine online"
FAILED=0
for path in / /demo-2/ /demo-3/ /demo-4/; do
  url="${PAGES_BASE}${path}?deploy=${SHORT_SHA}"
  code=""
  for _ in $(seq 1 12); do
    code="$(curl -fsS -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || true)"
    [[ "$code" == "200" ]] && break
    sleep 5
  done
  if [[ "$code" == "200" ]]; then
    echo "  ✓ $PAGES_BASE$path"
  else
    echo "  ✗ $PAGES_BASE$path (HTTP ${code:-nessuna risposta})" >&2
    FAILED=1
  fi
done

if [[ "$FAILED" -ne 0 ]]; then
  die "deploy completato ma alcune pagine non rispondono: controlla https://github.com/$(gh repo view --json nameWithOwner --jq .nameWithOwner)/actions"
fi

echo
echo "✓ Online aggiornato: $PAGES_BASE/"
echo "  commit $SHORT_SHA · run $RUN_ID"
