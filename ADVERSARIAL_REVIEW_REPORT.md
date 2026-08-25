# Gistwarden — Adversarial Security Audit

**Repo:** https://github.com/uongsuadaubung/gistwarden (commit 0fd9947, shallow clone depth 50)
**Scope:** full monorepo (apps/extension, apps/web, packages/{domain,network,orchestrator,repository,ui}, scripts, tests) — ~97k LOC TypeScript, 150 source files. Excluded: none (no vendored code).
**Date:** 2026-08-25
**Method:** automated pattern scan (eval/innerHTML/crypto/secrets/storage) → tiered deep review of crypto, session, FIDO2, autofill, messaging, sync, network → PoC verification of the top finding → 93/93 unit tests pass (bun test).

---

## Verdict

**NOT SAFE FOR PRODUCTION USE.** The core cryptography (Argon2id + AES-GCM) is implemented correctly and the codebase is unusually disciplined (strategy/state patterns, zod validation everywhere, neverthrow results, no `eval`, no `innerHTML`, no leaked secrets, 93 passing tests). However there is **one critical, remotely-exploitable XSS that bypasses the entire security model**, plus a design decision (raw master key persisted in storage) that turns that XSS into total compromise, and several medium issues that contradict the project's zero-knowledge marketing claims.

Confirmed findings: **1 critical, 1 high, 3 medium, 4 low.** Suspected/design-tradeoff findings: 4 (marked ⚠).

---

## Confirmed findings

### CRITICAL — C1: XSS in the FIDO2 prompt popup → RCE in extension context (vault bypass)

**Files:** `packages/ui/src/features/passkey/Fido2Prompt.tsx:451,463,619,652` · `packages/ui/src/components/ui/SafeHtml.tsx:20-27` · `packages/domain/src/i18n.ts:1160-1178` · `apps/extension/src/extension/fido2-page-script.ts:143-175` · `apps/extension/src/extension/handlers/fido2-handlers.ts:37-57`

**Chain (fully verified, PoC passing):**
1. Any website calls `navigator.credentials.create({ publicKey: { rp: { name: "<img src=x onerror=PAYLOAD>", id: ... }, user: { name: ... }, challenge }})`. The extension's page script (MAIN world) intercepts it (`fido2-page-script.ts:143`) and forwards `rp.name` / `user.name` verbatim — **no sanitization**.
2. Background stores it and auto-opens `chrome-extension://…/popup.html?mode=fido2-prompt` (`fido2-handlers.ts:56-62`) — an extension page with full privileges. Popup opens on **any** WebAuthn call; no user interaction required.
3. `Fido2Prompt.tsx:451` renders `SafeHtml(t("fido2_register_subtitle_new", { rp: attackerRpName, user }))`. `t()` does **raw** `String(v)` interpolation (`i18n.ts:1166-1169` — no escaping); the attacker string lands inside `<strong>{rp}</strong>`.
4. `SafeHtml` parses the string with `DOMParser` and attaches the nodes to the live DOM. Event-handler attributes survive DOMParser; `<img src=x onerror=…>` fires when the image fails to load — **JS executes in the chrome-extension:// origin**.

**Blast radius (gated by vault-unlocked, the normal state):** the injected script runs in the popup = "extension sender". It can:
- read `chrome.storage.session` → the **raw AES-256 master key** (see H1) → decrypt the entire vault and the GitHub PAT locally, no master password;
- call any internal-only background route (`MSG_UPLOAD_TO_GIST`, `MSG_RESOLVE_FIDO2_REQUEST`, …) — e.g. trigger passkey assertions / exfiltrate via sync;
- read `chrome.storage.local` (encrypted vault, PIN-encrypted key, settings).

Also affected: `fido2_assert_subtitle` (line 619, interpolates attacker `rpId`) and `fido2_register_subtitle_choose` (line 463, `user`).

**PoC evidence:** `bun test` with a mirror of the exact `t()` → SafeHtml pipeline confirmed `t()` returns raw HTML and the `onerror` attribute survives DOMParser as a live handler. (`tests/xss_poc_test.ts` removed after verification.)

**Fix (smallest):** escape interpolated params before substitution in `t()` (HTML-encode `& < > " '`), or never pass untrusted strings into SafeHtml — render them as plain SolidJS text nodes and only allow trusted static HTML. Add a zod `.max()` + character-class check on `rp.name`/`user.name` as defense-in-depth.

---

### HIGH — H1: Raw master key persisted (exportable) in session storage — undermines zero-knowledge

**Files:** `packages/orchestrator/src/session-usecases.ts:21-46` · `packages/domain/src/crypto.ts:141-153` (extractable: true) · `packages/repository/src/storage.ts:192-204` (chrome.storage.session) · `packages/repository/src/web-storage.ts` (web: window.sessionStorage)

The Argon2id-derived AES-256-GCM key is `crypto.subtle.exportKey("raw", …)`'d and stored base64 in `chrome.storage.session` (extension) / `window.sessionStorage` (web SPA) while unlocked. The key is imported with `extractable: true` (`crypto.ts:141-153`), which is what makes this possible.

Impact:
- Any XSS in *any* extension page (C1 is one) or any compromised extension context recovers the master key **without the master password** — the vault encryption is effectively bypassed. Storing the key in JS heap (Bitwarden's model) is unavoidable, but a *serialized, universally readable* copy in storage is worse: it survives context reloads and is readable by every extension page at any time, not just the page that holds the reference.
- The web SPA stores the raw key in `sessionStorage` — same-origin XSS in the SPA = full compromise.
- `extractable: true` also means any XSS'd page can `exportKey` even if the raw copy were removed.

**Fix (smallest):** keep the CryptoKey non-extractable (`extractable: false`) and **do not persist the raw key** — for cross-page sharing in MV3, pass the key to the service worker via message (the background already owns the session) or store an encrypted copy under a per-browser-session wrapper key; on the web, prefer keeping the key in a single tab's JS memory. At minimum, mark the key non-extractable and drop the `persistSessionKey` raw export.

---

### MEDIUM — M1: PIN unlock stores the master key encrypted with a low-entropy PIN in *persistent* storage

**Files:** `packages/orchestrator/src/vault-auth-usecases.ts:467-506` · `packages/ui/src/features/auth/auth-service.ts:640-740`

`setPinUnlockUseCase` derives an Argon2id key from the PIN (typically 4–6 digits) and AES-GCM-encrypts the raw master key, storing `{value, iv, salt, failedAttempts, failedMac}` in `chrome.storage.local` (persistent, survives browser restarts and survives even vault "lock").

- **Offline brute-force:** an attacker with a copy of the browser profile (or any storage-read primitive) can try PINs offline — ~10⁴ (4-digit) to ~10⁶ (6-digit) Argon2id(64 MB) attempts. The 3-attempt lockout and the HMAC'd counter provide **zero offline protection**: the attacker who can edit `failedAttempts` also has the salt and can recompute the HMAC (`computeHmac` with the stored salt as key).
- The `requireMasterPasswordOnRestart` option mitigates the *restart* case but not the persistent-copy brute-force.

This matches Bitwarden's PIN design tradeoff, but Bitwarden relies on it only for convenience with the same caveat — here it's worth a warning in-UI: **a short PIN does not protect the vault from an attacker with local storage access.**

**Fix (smallest):** document the tradeoff in the PIN setup UI; consider a PIN strength floor (≥6 digits, warn on 4); on repeated failed local attempts, wipe the PIN-encrypted key copy.

---

### MEDIUM — M2: Full email sent to a third-party API contradicts the privacy claims

**Files:** `packages/network/src/breach-api.ts:33-52` · `packages/orchestrator/src/report-usecases.ts:55-83` · `README.md:39`

The vault report's breach check sends the **entire email address** to `https://api.xposedornot.com/v1/check-email/{email}` — no k-anonymity. The password check correctly uses HIBP's k-anonymity (5-char SHA-1 prefix, `breach-api.ts:5-30`), but the README's claim ("checks … against Have I Been Pwned … using privacy-preserving k-Anonymity API model") doesn't cover the email check, which leaks email + IP + timing to a third party the user never consented to. Verify this is opt-in and clearly disclosed.

**Fix (smallest):** make the email check explicitly opt-in with a disclosure, or route it through HIBP's privacy-preserving email endpoint (hash-based) instead of xposedornot.

---

### MEDIUM — M3: Third-party trust anchor: author's Cloudflare worker mediates OAuth + TOTP time sync

**Files:** `packages/domain/src/constants.ts:6-7` · `packages/network/src/github-api.ts:214-244` (OAuth) · `packages/orchestrator/src/crypto-usecases.ts:101-130` (time sync)

- GitHub OAuth (`chrome.identity.launchWebAuthFlow`) redirects to the author's worker `gistwarden.uongsuadaubung.workers.dev`, which exchanges the code and redirects back with `?token=…` (`github-api.ts:214-244`). The worker is closed-source and **sees every OAuth code, IP, and can mint tokens**. This is the standard extension-OAuth pattern (Bitwarden does the same), but the "no one can read your data / runs independently" claims should explicitly carve out OAuth metadata.
- The extension also calls the worker's `/time` endpoint to compute a TOTP time offset (`crypto-usecases.ts:101-130`) — a phone-home on TOTP use. TOTP works fine with local time; this adds a fingerprinting/privacy surface for marginal benefit (only helps users with a wrong system clock).
- **OAuth `state` is a predictable constant** (the redirect URI itself, `github-api.ts:222`) — no per-attempt nonce; OAuth-CSRF hardening is absent (exploitability is limited by the extension context, but it's non-standard).

**Fix (smallest):** bind a random nonce in `state` and verify it on redirect; make time-sync opt-in (default off) or drop it; document the worker as a trust anchor.

---

### LOW — L1: Content scripts + autofill/FIDO2 run on `http://*/*` (insecure origins)

**Files:** `apps/extension/src/manifest.json:26-52` (content_scripts match `http://*/*` AND `https://*/*`)

Autofill and the virtual FIDO2 authenticator are injected into every HTTP page. Risks: (a) autofilling credentials on an HTTP page puts them on a MITM-readable channel; (b) the FIDO2 polyfill enables WebAuthn on HTTP, where a network attacker can drive the confirmation flow with a victim's stored passkeys (mitigated by the user confirmation popup). Password managers typically restrict to HTTPS (or warn). There is a locale warning for http:// vault URIs, but no runtime guard.

**Fix:** match `https://*/*` only (and `file:` if desired); keep autofill off on http.

---

### LOW — L2: Sync merge is last-writer-wins on client clocks; transient 404 resets sync config

**Files:** `packages/orchestrator/src/sync-usecases.ts:76-130` (LWW by revisionDate) · `:212-218` (`provider_error_not_found` → `resetAccountSettings`)

- Concurrent edits on two devices silently drop one side (LWW by `revisionDate`, which is client-generated — clock skew between devices directly causes data loss). No conflict UI.
- A transient 404 from GitHub (or a temporarily deleted gist) triggers `resetAccountSettings`, wiping the sync config (encrypted token) and session cache; if the gist is genuinely gone, the only copy of the vault is lost with no local backup offered.

**Fix:** on `not_found`, don't auto-reset — surface a recover/backup prompt first; keep a local encrypted backup of the last synced payload.

---

### LOW — L3: `isDomainExcluded` uses substring matching (over-exclusion)

**Files:** `packages/orchestrator/src/autofill-usecases.ts:41-58`

`normalized.includes(cleanEx) || cleanEx.includes(normalized)` — an exclusion for `example.com` also excludes `notexample.com` / `xexample.com`. Functional (fail-safe direction: credentials not saved), but surprising.

**Fix:** compare registrable domains (`getBaseDomain`), not substrings.

---

### LOW — L4: `decryptData` zlib-magic sniffing + compression-before-encryption

**Files:** `packages/domain/src/crypto.ts:60-92`

Decrypt sniffs the first byte `0x78` to decide decompression; a plaintext that happens to start with 0x78 triggers a failed-decompress fallback (handled) — benign but fragile. Compression (zlib) before AES-GCM is a CRIME-family consideration only for interactive remote protocols; for a local vault it's fine — just noting the sniffing heuristic could be replaced by a versioned envelope (`{v:1, z:bool}`).

---

## Suspected / design-tradeoff (unverified or intentional)

- ⚠ **Extractable key + in-memory CryptoKey in the same page as vault data** — any same-context compromise is total; this is inherent to JS password managers, but C1 + H1 make it weaponizable remotely, which is not inherent.
- ⚠ **Virtual FIDO2 authenticator runs in the page's MAIN world** — any page can trigger the extension popup, enumerate *which* passkeys exist for a given RP (`findMatchingFido2Credentials` by rpId; `discoverable: true`), and drive unlimited confirmation prompts (prompt-spam / presence-leak). Origin binding (`sender.origin`) and the confirmation popup are correctly implemented — the leak is metadata (which RPs the user has passkeys for + presence), not the credentials themselves.
- ⚠ **`isUserVerifyingPlatformAuthenticatorAvailable = () => true` + `authenticatorAttachment: "platform"`** — the extension claims platform UVAA for every site; a site that trusts UV will believe a passkey was user-verified when UV was actually derived from `userVerification !== "discouraged"` (`passkey-crypto.ts:546-549`) without a per-ceremony biometric check.
- ⚠ **Attestation is "none"-style without a signature** (`packages/ui/src/core/cbor-utils.ts` packAttestationObject + fixed AAGUID) — fine for consumer RPs; enterprise RP attestation policies will reject these passkeys.

## What is done well (verified)

- Argon2id 64 MB / 3 iter / parallelism 1 with per-vault random salt; AES-GCM-256 with fresh 12-byte random IV per save; tamper → decryption failure (AEAD) — core crypto is correct (`crypto.ts`).
- Master-password verification token (encrypted `verification_token`) instead of a stored hash — good.
- GitHub PAT is encrypted with the master key at rest (`syncTokenEncrypted`+IV) — good.
- Passkey origin is derived from the **message sender** (`sender.origin`), not page input; assertions sign `authData ‖ clientDataHash` with ECDSA P-256 — correct WebAuthn structure.
- Message router: internal-only routes reject non-extension senders; payloads zod-validated; `externally_connectable` absent so pages cannot message the background directly.
- Domain matching uses tldts registrable-domain logic with punycode handling; HIBP password check is proper k-anonymity.
- No `eval`/`new Function`/`innerHTML`/`document.write`; SolidJS text interpolation is escaping by default (notification bar is safe).
- No secrets/tokens in the repo (only test fixtures); manifest CSP is tight (`'wasm-unsafe-eval'` only, needed for hash-wasm); Firefox manifest declares `data_collection_permissions: ["none"]`; 93/93 tests pass; WER assets limited to fonts/icons/images.

---

## Priority fix list (smallest change first)

1. **[C1 — critical]** Escape all interpolation params in `t()` before substitution (HTML-encode `&<>"'`), OR replace SafeHtml-with-user-data with plain text nodes in Fido2Prompt; add `.max()`/charset validation on `rp.name`, `rp.id`, `user.name`. — 1–2 files, <30 lines.
2. **[H1]** Import AES key as non-extractable; stop persisting the raw key to `chrome.storage.session`/`sessionStorage` (keep it in background memory; message-pass it to pages). — `crypto.ts`, `session-usecases.ts`.
3. **[M2]** Make the email breach check opt-in with disclosure (or switch to HIBP hash-based endpoint).
4. **[M3]** Random OAuth nonce in `state`; make time-sync opt-in; document the worker trust anchor.
5. **[L1]** Restrict content scripts to `https://*/*`.
6. **[L2]** Don't auto-reset sync config on transient 404; offer local encrypted backup before wipe.
7. **[L3]** Registrable-domain comparison in `isDomainExcluded`.
8. **[M1]** PIN strength floor + warning copy.

Re-verification after fixes: re-run `bun test` (93 tests) + the XSS PoC (must fail to inject), and a manual pass of `Fido2Prompt` rendering with a crafted `rp.name`.
