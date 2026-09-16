# FF Beauty Security Plan

Last reviewed: 2026-09-16

## Scope and data flow

FF Beauty is a static website served by Nginx. It has no customer accounts,
application database, online payment processing, or file uploads.

The public chat widget sends a visitor's message and the six most recent chat
turns to a Google Apps Script web app. Apps Script reads the Groq API key from
Script Properties, requests a response from Groq, and may append the timestamp,
visitor message, and reply to a private Google Sheet. The appointment form does
not submit to FF Beauty infrastructure; it prepares a WhatsApp message in the
visitor's browser.

## Data classification

| Data | Classification | Location | Primary controls |
|---|---|---|---|
| Public site content | Public | GitHub, Nginx server | HTTPS, deployment access |
| Chat messages and replies | Confidential | Google/Groq, Google Sheet | Access restriction, minimization, retention |
| Groq API key | Secret | Apps Script Properties | Never in client or repository, rotation |
| SSH deployment key | Secret | Administrator workstation | Key-only SSH, restricted access |
| Client photos and videos | Confidential before consent; public after consent | Repository, Nginx server | Documented permission, removal process |

## Launch controls

Status values: PASS, PARTIAL, MANUAL, N/A.

| ID | Priority | Control | Status | Evidence / next action |
|---|---|---|---|---|
| INF-01 | P0 | HTTPS with valid automatic renewal | PASS | Let's Encrypt certificate; `certbot.timer` active |
| INF-02 | P0 | Firewall deny-by-default | PASS | UFW active; inbound limited to SSH, HTTP, HTTPS |
| INF-03 | P0 | SSH passwords disabled | PASS | `PasswordAuthentication no`; key authentication enabled |
| INF-04 | P1 | Dedicated non-root deployment user | PARTIAL | Root is key-only, but 17 authorized root keys serve several projects; owners must review/revoke stale keys before access is redesigned |
| INF-05 | P1 | Browser security headers | PASS | CSP, HSTS, Permissions-Policy, COOP, anti-framing, MIME-sniffing, and referrer controls verified live |
| INF-06 | P1 | OS security updates | PARTIAL | Unattended upgrades are enabled; the shared server currently requires a reviewed reboot maintenance window |
| INF-07 | P1 | Web files owned by a known server account | PASS | Webroot normalized to `root:root`, directories 755, files 644 |
| INF-08 | P1 | Restore procedure tested | PASS | Clean server-side clone of production source verified at commit `dbba2d1` |
| APP-01 | P0 | Secrets excluded from source and browser | PASS | Groq key is read from Apps Script Properties |
| APP-02 | P0 | Server-side request and message limits | PASS* | Implemented locally; deploy a new Apps Script version |
| APP-03 | P0 | Conversation roles allowlisted | PASS* | Only `user` and `assistant` history roles accepted; deploy required |
| APP-04 | P0 | Cost-abuse rate limits | PASS* | Global minute/hour quotas added; deploy required |
| APP-05 | P0 | Spreadsheet formula injection protection | PASS* | Logged text beginning with formula markers is escaped; deploy required |
| APP-06 | P1 | Safe upstream error logging | PASS* | Provider response bodies are no longer logged; deploy required |
| APP-07 | P1 | Output inserted as text, not HTML | PASS | Chat uses `textContent` |
| APP-08 | P1 | Public health response exposes no internals | PASS | Apps Script returns only `{status:"ok"}` |
| PRIV-01 | P0 | Privacy policy describes actual processing | PASS | Chat logging, processors, WhatsApp flow, and sensitive-data warning documented |
| PRIV-02 | P0 | Visitor warned before using chat | PASS | Chat greeting warns about logging and sensitive information |
| PRIV-03 | P1 | Chat retention period documented and enforced | MANUAL | Studio must choose a retention period and delete older Sheet rows accordingly |
| PRIV-04 | P1 | Client media permission records retained | MANUAL | Keep evidence of consent and honor removal requests |
| OPS-01 | P0 | MFA on GitHub, Google, hosting, and domain accounts | MANUAL | Account owners must verify |
| OPS-02 | P1 | Groq spending/quota alerts | MANUAL | Configure in provider account if available |
| OPS-03 | P1 | Uptime and security-baseline monitoring | PASS | Scheduled GitHub workflow checks the public site twice hourly |
| OPS-04 | P1 | Incident contacts and key-rotation steps | MANUAL | Record owner/contact and test the API-key rotation procedure |
| OPS-05 | P1 | Protected production deployment flow | PASS | Main blocks force-push/deletion and requires reviewed PRs for non-admins; secret scanning, push protection, vulnerability alerts, and Dependabot security updates enabled |
| AUTH-01 | — | Customer authentication and authorization | N/A | No customer accounts or protected user data routes |
| DB-01 | — | Application database/RLS/migrations | N/A | No application database; Google Sheet is an internal chat log only |
| PAY-01 | — | Payment and webhook security | N/A | No online payments or payment webhooks |
| FILE-01 | — | User-upload validation | N/A | No user uploads |

`PASS*` means the control is implemented in this repository but is not active
until the updated Apps Script is deployed as a new web-app version.

## Verification commands

After each website deployment:

```sh
curl -I https://ffbeauty1.com/
curl -sS https://ffbeauty1.com/ | grep -F 'FF Beauty Package Studio'
```

Verify the response includes HTTPS plus the documented security headers. Test
the chat with a normal question, an empty message, a message over 500 characters,
and repeated requests until the friendly quota response appears. Confirm that a
message beginning with `=1+1` is stored as text in Google Sheets, not evaluated.

## Incident response

If the Groq key is exposed: disable it, create a replacement, update the Apps
Script Property, deploy if needed, inspect usage and logs, and document the cause.

If the Google or GitHub account is compromised: revoke active sessions, rotate
credentials and keys, review audit/deployment history, restore known-good content,
and notify affected people if required.

If the site is altered unexpectedly: preserve logs, take the site offline if it
is harmful, restore the last known-good Git commit to the Nginx web root, verify
headers and assets, then investigate the access path before reopening.
