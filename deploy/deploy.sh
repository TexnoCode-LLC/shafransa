#!/usr/bin/env bash
# Serverdə işləyir (GitHub Actions ssh ilə çağırır):
#   staging-dəki yeni build canlı qovluqla atomik əvəz olunur → yoxlanır → uğursuzdursa köhnə versiya geri qaytarılır.
# Caddy SSL sertifikatları üçün /var/www/html/.well-known istifadə edir — o, yeni buraxılışa köçürülür.
set -euo pipefail

LIVE_DIR="${LIVE_DIR:-/var/www/html}"
STAGING_DIR="${STAGING_DIR:-/var/www/html.staging}"
PREVIOUS_DIR="${PREVIOUS_DIR:-/var/www/html.previous}"
CHECK_URL="${CHECK_URL:-http://127.0.0.1:8080/}"
CHECK_HOST="${CHECK_HOST:-shafransa.com}"

fail() { echo "❌ $*"; exit 1; }

[ -f "$STAGING_DIR/index.html" ] || fail "Staging qovluğu boşdur: $STAGING_DIR"

# Tətbiqə aid olmayan, amma canlı qovluqda saxlanmalı fayllar
[ -d "$LIVE_DIR/.well-known" ] && cp -a "$LIVE_DIR/.well-known" "$STAGING_DIR/"
[ -f "$LIVE_DIR/index.nginx-debian.html" ] && cp -a "$LIVE_DIR/index.nginx-debian.html" "$STAGING_DIR/"
chmod -R u=rwX,go=rX "$STAGING_DIR"

rm -rf "$PREVIOUS_DIR"
[ -d "$LIVE_DIR" ] && mv "$LIVE_DIR" "$PREVIOUS_DIR"
mv "$STAGING_DIR" "$LIVE_DIR"

# Yoxlama: sayt cavab verir və yeni index.html-dəki JS faylı mövcuddur
ASSET=$(grep -o 'assets/index-[^"]*\.js' "$LIVE_DIR/index.html" | head -1)
if curl -fsS --max-time 5 -H "Host: $CHECK_HOST" "$CHECK_URL" | grep -q "$ASSET" \
   && curl -fsS --max-time 5 -o /dev/null -H "Host: $CHECK_HOST" "$CHECK_URL$ASSET"; then
  echo "✅ Frontend deploy uğurlu oldu ($ASSET)"
  exit 0
fi

echo "❌ Yoxlama alınmadı — əvvəlki versiya geri qaytarılır"
[ -d "$PREVIOUS_DIR" ] || fail "Əvvəlki versiya yoxdur"
rm -rf "$LIVE_DIR.failed"
mv "$LIVE_DIR" "$LIVE_DIR.failed"
mv "$PREVIOUS_DIR" "$LIVE_DIR"
exit 1
