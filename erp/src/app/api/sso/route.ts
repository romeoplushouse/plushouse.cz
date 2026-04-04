import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import crypto from "crypto";

// ============================================================================
// SSO API - Single Sign-On pro plushouse.cz + erp.plushouse.cz + plusconnect.cz
//
// Flow:
// 1. Uživatel klikne "Přihlásit se" na plushouse.cz
// 2. Widget otevře popup/redirect na erp.plushouse.cz/api/sso/authorize
// 3. Uživatel se přihlásí (nebo je již přihlášen)
// 4. ERP vrátí SSO token zpět na plushouse.cz/plusconnect.cz
// 5. Token se ověří přes /api/sso/verify
// ============================================================================

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://plushouse.cz",
  "https://www.plushouse.cz",
  "https://plusconnect.cz",
  "https://www.plusconnect.cz",
  "https://erp.plushouse.cz",
  "http://localhost:3000",
  "http://localhost:3007",
];

// Allowed redirect URLs (prevents open redirect)
const ALLOWED_REDIRECT_HOSTS = [
  "plushouse.cz",
  "www.plushouse.cz",
  "plusconnect.cz",
  "www.plusconnect.cz",
  "erp.plushouse.cz",
  "localhost",
];

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_REDIRECT_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const headers = new Headers();
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

// OPTIONS - CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

// POST /api/sso - Login and get SSO token
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json");

  try {
    const body = await request.json();
    const { action, email, password, token, returnUrl } = body;

    // ACTION: login - authenticate and return SSO token
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email a heslo jsou povinné" },
          { status: 400, headers }
        );
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: "Nesprávný email nebo heslo" },
          { status: 401, headers }
        );
      }

      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Nesprávný email nebo heslo" },
          { status: 401, headers }
        );
      }

      // Generate SSO token
      const ssoToken = crypto.randomUUID() + "-" + crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

      // Store token in session
      await prisma.session.create({
        data: {
          userId: user.id,
          token: ssoToken,
          expiresAt,
        },
      });

      return NextResponse.json(
        {
          success: true,
          token: ssoToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          expiresAt: expiresAt.toISOString(),
          // URLs for each service
          services: {
            erp: `https://erp.plushouse.cz?sso_token=${ssoToken}`,
            plusconnect: `https://plusconnect.cz?sso_token=${ssoToken}`,
            website: `https://plushouse.cz`,
          },
        },
        { status: 200, headers }
      );
    }

    // ACTION: verify - verify SSO token (called by plusconnect.cz etc.)
    if (action === "verify") {
      if (!token) {
        return NextResponse.json(
          { error: "Token je povinný" },
          { status: 400, headers }
        );
      }

      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || new Date() > session.expiresAt) {
        return NextResponse.json(
          { valid: false, error: "Token vypršel nebo neexistuje" },
          { status: 401, headers }
        );
      }

      return NextResponse.json(
        {
          valid: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          },
        },
        { status: 200, headers }
      );
    }

    // ACTION: logout - invalidate token
    if (action === "logout") {
      if (token) {
        await prisma.session.deleteMany({ where: { token } }).catch(() => {});
      }
      return NextResponse.json({ success: true }, { status: 200, headers });
    }

    return NextResponse.json(
      { error: "Neplatná akce. Použijte: login, verify, logout" },
      { status: 400, headers }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Interní chyba serveru" },
      { status: 500, headers }
    );
  }
}

// GET /api/sso?token=xxx - Quick token verification (for redirects)
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  headers.set("Content-Type", "application/json");

  const token = request.nextUrl.searchParams.get("token");
  const returnUrl = request.nextUrl.searchParams.get("return_url");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Token chybí" },
      { status: 400, headers }
    );
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || new Date() > session.expiresAt) {
    // If return_url provided, redirect to login (validate first)
    if (returnUrl && isAllowedRedirectUrl(returnUrl)) {
      return NextResponse.redirect(
        `https://erp.plushouse.cz/prihlaseni?return_url=${encodeURIComponent(returnUrl)}`
      );
    }
    return NextResponse.json(
      { valid: false },
      { status: 401, headers }
    );
  }

  // If return_url, redirect back with token (validate first)
  if (returnUrl && isAllowedRedirectUrl(returnUrl)) {
    const separator = returnUrl.includes("?") ? "&" : "?";
    return NextResponse.redirect(`${returnUrl}${separator}sso_token=${token}`);
  }

  return NextResponse.json(
    {
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    },
    { status: 200, headers }
  );
}
