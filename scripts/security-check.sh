#!/bin/sh
set -eu

site_url="${1:-https://ffbeauty1.com}"
audit_dir="$(mktemp -d)"
trap 'rm -rf "$audit_dir"' EXIT HUP INT TERM

curl -fsS "$site_url/" -o "$audit_dir/home.html"
curl -fsSI "$site_url/" -o "$audit_dir/headers.txt"

check_header() {
  header_name="$1"
  if ! grep -qi "^${header_name}:" "$audit_dir/headers.txt"; then
    echo "FAIL: missing ${header_name} header" >&2
    exit 1
  fi
}

check_header "Strict-Transport-Security"
check_header "Content-Security-Policy"
check_header "Permissions-Policy"
check_header "Cross-Origin-Opener-Policy"
check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "Referrer-Policy"

if ! grep -q "FF Beauty Package Studio" "$audit_dir/home.html"; then
  echo "FAIL: homepage content marker missing" >&2
  exit 1
fi

redirect_status="$(curl -sS -o /dev/null -w '%{http_code}' "http://${site_url#https://}/")"
if [ "$redirect_status" != "301" ] && [ "$redirect_status" != "308" ]; then
  echo "FAIL: HTTP did not redirect to HTTPS (status $redirect_status)" >&2
  exit 1
fi

post_status="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$site_url/")"
if [ "$post_status" != "403" ] && [ "$post_status" != "405" ]; then
  echo "FAIL: static origin accepted POST (status $post_status)" >&2
  exit 1
fi

echo "PASS: live security baseline verified for $site_url"
