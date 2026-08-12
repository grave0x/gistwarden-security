import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const VAULTS_DIR = path.join(DATA_DIR, "vaults");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VAULTS_DIR)) fs.mkdirSync(VAULTS_DIR, { recursive: true });

// Standard CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

// Response helper with CORS
function jsonResponse(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

// Bun file storage helpers
async function readUsers() {
  const file = Bun.file(USERS_FILE);
  if (!(await file.exists())) return { users: {}, tokens: {} };
  return await file.json();
}

async function writeUsers(data: unknown) {
  await Bun.write(USERS_FILE, JSON.stringify(data, null, 2));
}

function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.substring(7).trim();
}

async function authenticate(req: Request): Promise<string | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const usersData = await readUsers();
  return usersData.tokens?.[token] || null;
}

// Start native Bun HTTP server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method.toUpperCase();

    // 1. CORS Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. POST /auth/register
    if (method === "POST" && pathname === "/auth/register") {
      const body = await req.json().catch(() => ({}));
      const { username, password } = body;

      if (
        !username ||
        !password ||
        typeof username !== "string" ||
        typeof password !== "string"
      ) {
        return jsonResponse(
          {
            error: "bad_request",
            message: "Username and password are required",
          },
          400,
        );
      }

      const usersData = await readUsers();
      if (usersData.users[username]) {
        return jsonResponse(
          { error: "user_already_exists", message: "Username is taken" },
          409,
        );
      }

      usersData.users[username] = {
        password,
        createdAt: new Date().toISOString(),
      };
      const accessToken = `sec_tok_${crypto.randomBytes(24).toString("hex")}`;
      if (!usersData.tokens) usersData.tokens = {};
      usersData.tokens[accessToken] = username;

      await writeUsers(usersData);
      console.log(`[POST /auth/register] Created user "${username}"`);
      return jsonResponse({ accessToken, username });
    }

    // 3. POST /auth/login
    if (method === "POST" && pathname === "/auth/login") {
      const body = await req.json().catch(() => ({}));
      const { username, password } = body;

      const usersData = await readUsers();
      const user = usersData.users[username];

      if (!user || user.password !== password) {
        return jsonResponse(
          {
            error: "invalid_credentials",
            message: "Invalid username or password",
          },
          401,
        );
      }

      const accessToken = `sec_tok_${crypto.randomBytes(24).toString("hex")}`;
      if (!usersData.tokens) usersData.tokens = {};
      usersData.tokens[accessToken] = username;

      await writeUsers(usersData);
      console.log(`[POST /auth/login] User "${username}" logged in`);
      return jsonResponse({ accessToken, username });
    }

    // 4. GET /user — Validate Token & User Profile
    if (method === "GET" && pathname === "/user") {
      const username = await authenticate(req);
      if (!username) {
        return jsonResponse(
          {
            error: "unauthorized",
            message: "Access token is missing, expired or invalid",
          },
          401,
        );
      }

      return jsonResponse({
        username,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
      });
    }

    // 5. GET /vault — Read Vault
    if (method === "GET" && pathname === "/vault") {
      const username = await authenticate(req);
      if (!username) {
        return jsonResponse(
          {
            error: "unauthorized",
            message: "Access token is missing, expired or invalid",
          },
          401,
        );
      }

      const vaultFile = Bun.file(path.join(VAULTS_DIR, `${username}.json`));
      if (!(await vaultFile.exists())) {
        console.log(`[GET /vault] User "${username}" has no vault -> 404`);
        return jsonResponse(
          {
            error: "vault_not_found",
            message: "Vault dataset does not exist for this account yet.",
          },
          404,
        );
      }

      const vaultData = await vaultFile.json();
      console.log(`[GET /vault] Returned vault payload for "${username}"`);
      return jsonResponse(vaultData);
    }

    // 6. POST /vault — Save / Update Vault
    if (method === "POST" && pathname === "/vault") {
      const username = await authenticate(req);
      if (!username) {
        return jsonResponse(
          {
            error: "unauthorized",
            message: "Access token is missing, expired or invalid",
          },
          401,
        );
      }

      const body = await req.json().catch(() => ({}));
      const { salt, iv, ciphertext } = body;

      if (!salt || !iv || !ciphertext) {
        return jsonResponse(
          { error: "bad_request", message: "Missing salt, iv, or ciphertext" },
          400,
        );
      }

      const vaultPath = path.join(VAULTS_DIR, `${username}.json`);
      const payload = {
        salt,
        iv,
        ciphertext,
        updatedAt: new Date().toISOString(),
      };

      await Bun.write(vaultPath, JSON.stringify(payload, null, 2));
      console.log(`[POST /vault] Saved vault for "${username}"`);
      return jsonResponse({ success: true });
    }

    // 7. DELETE /vault — Delete Vault
    if (method === "DELETE" && pathname === "/vault") {
      const username = await authenticate(req);
      if (!username) {
        return jsonResponse(
          {
            error: "unauthorized",
            message: "Access token is missing, expired or invalid",
          },
          401,
        );
      }

      const vaultPath = path.join(VAULTS_DIR, `${username}.json`);
      if (fs.existsSync(vaultPath)) {
        fs.unlinkSync(vaultPath);
      }

      console.log(`[DELETE /vault] Deleted vault for "${username}"`);
      return jsonResponse({ success: true });
    }

    return jsonResponse(
      {
        error: "not_found",
        message: `Endpoint ${method} ${pathname} not found`,
      },
      404,
    );
  },
});

console.log(
  `🚀 Native Bun Self-Hosted Server running on http://localhost:${server.port}`,
);
console.log(`📁 User database: ${USERS_FILE}`);
console.log(`📁 Vault storage: ${VAULTS_DIR}`);
