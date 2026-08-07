"""
Auth API Test Suite for AI Career Copilot
Run: python test_auth.py
"""
import urllib.request
import urllib.parse
import urllib.error
import json
import sys

BASE = "http://localhost:8000"
API = BASE + "/api/v1"
PASS_LIST = []
FAIL_LIST = []


def req(method, url, data=None, headers=None, form=False):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    body = None
    if data and form:
        body = urllib.parse.urlencode(data).encode()
        h["Content-Type"] = "application/x-www-form-urlencoded"
    elif data:
        body = json.dumps(data).encode()
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {}


def check(name, status, body, expected_status, check_key=None, extra_info=""):
    ok = status == expected_status and (check_key is None or check_key in body)
    sym = "PASS" if ok else "FAIL"
    print(f"  [{sym}] [{status}] {name}")
    if extra_info:
        print(f"         {extra_info}")
    if not ok:
        print(f"         Got: {json.dumps(body)[:150]}")
    (PASS_LIST if ok else FAIL_LIST).append(name)
    return body


print()
print("=" * 50)
print("  AI Career Copilot - Auth API Tests")
print("=" * 50)
print()

# ── 1. Health Check ───────────────────────────────────
s, b = req("GET", f"{BASE}/health")
check("GET /health", s, b, 200, "status", f"project={b.get('project','?')}")

# ── 2. Register New User ──────────────────────────────
s, b = req("POST", f"{API}/auth/register", {
    "name": "Test User",
    "email": "test@copilot.dev",
    "password": "Secure123!"
})
check("POST /auth/register - new user", s, b, 201, "id",
      f"user id = {b.get('id', '?')}")

# ── 3. Register Duplicate Email ───────────────────────
s, b = req("POST", f"{API}/auth/register", {
    "name": "Test User",
    "email": "test@copilot.dev",
    "password": "Secure123!"
})
check("POST /auth/register - duplicate email (409)", s, b, 409)

# ── 4. Register Short Password ────────────────────────
s, b = req("POST", f"{API}/auth/register", {
    "name": "Weak",
    "email": "weak@copilot.dev",
    "password": "123"
})
check("POST /auth/register - short password (422)", s, b, 422)

# ── 5. Login JSON (Frontend style) ────────────────────
s, b = req("POST", f"{API}/auth/login/json", {
    "email": "test@copilot.dev",
    "password": "Secure123!"
})
check("POST /auth/login/json - valid credentials", s, b, 200, "access_token")
access_token = b.get("access_token", "")
refresh_token = b.get("refresh_token", "")
token_preview = access_token[:40] + "..." if access_token else "MISSING"
print(f"         access_token = {token_preview}")

# ── 6. Login JSON Wrong Password ──────────────────────
s, b = req("POST", f"{API}/auth/login/json", {
    "email": "test@copilot.dev",
    "password": "wrongpassword"
})
check("POST /auth/login/json - wrong password (401)", s, b, 401)

# ── 7. Login Form (OAuth2 / Swagger UI) ───────────────
s, b = req("POST", f"{API}/auth/login", {
    "username": "test@copilot.dev",
    "password": "Secure123!"
}, form=True)
check("POST /auth/login - OAuth2 form (Swagger UI)", s, b, 200, "access_token")

# ── 8. Protected Route /me ────────────────────────────
s, b = req("GET", f"{API}/auth/me", headers={"Authorization": f"Bearer {access_token}"})
check("GET /auth/me - valid token (protected)", s, b, 200, "email",
      f"logged in as: {b.get('name','?')} <{b.get('email','?')}>")

# ── 9. Protected Route Without Token ─────────────────
s, b = req("GET", f"{API}/auth/me")
check("GET /auth/me - no token (401)", s, b, 401)

# ── 10. Refresh Token ─────────────────────────────────
s, b = req("POST", f"{API}/auth/refresh", {"refresh_token": refresh_token})
check("POST /auth/refresh - new access token", s, b, 200, "access_token")
new_access = b.get("access_token", access_token)

# ── 11. Logout ────────────────────────────────────────
s, b = req("POST", f"{API}/auth/logout", headers={"Authorization": f"Bearer {access_token}"})
check("POST /auth/logout - blacklist token", s, b, 200, "message",
      f"server says: {b.get('message', '?')}")

# ── 12. Revoked Token Rejected ────────────────────────
s, b = req("GET", f"{API}/auth/me", headers={"Authorization": f"Bearer {access_token}"})
check("GET /auth/me - revoked token rejected (401)", s, b, 401)

# ── 13. New Token Still Valid ─────────────────────────
s, b = req("GET", f"{API}/auth/me", headers={"Authorization": f"Bearer {new_access}"})
check("GET /auth/me - new token valid after logout", s, b, 200, "email")

# ── Summary ───────────────────────────────────────────
print()
print("=" * 50)
print(f"  Results: {len(PASS_LIST)} passed | {len(FAIL_LIST)} failed")
if FAIL_LIST:
    print(f"  Failed: {FAIL_LIST}")
print("=" * 50)
print()

if FAIL_LIST:
    sys.exit(1)
