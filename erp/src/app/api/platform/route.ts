import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlusConnectSyncData, getClientPortalOverview } from "@/lib/actions/platform";

// CORS for cross-domain
const ALLOWED_ORIGINS = [
  "https://plushouse.cz",
  "https://www.plushouse.cz",
  "https://plusconnect.cz",
  "https://www.plusconnect.cz",
  "https://erp.plushouse.cz",
  "http://localhost:3000",
  "http://localhost:3777",
];

function corsHeaders(origin: string | null) {
  const headers = new Headers();
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Content-Type", "application/json");
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

// GET /api/platform?action=sync&token=xxx - Get unified data for PlusConnect
// GET /api/platform?action=client&contactId=xxx&token=xxx - Get client portal data
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  const action = request.nextUrl.searchParams.get("action");
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token je povinný" },
      { status: 401, headers }
    );
  }

  // Verify SSO token
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || new Date() > session.expiresAt) {
    return NextResponse.json(
      { error: "Neplatný nebo vypršelý token" },
      { status: 401, headers }
    );
  }

  try {
    if (action === "sync") {
      const data = await getPlusConnectSyncData(session.userId);
      return NextResponse.json(data, { headers });
    }

    if (action === "client") {
      const contactId = request.nextUrl.searchParams.get("contactId");
      if (!contactId) {
        return NextResponse.json(
          { error: "contactId je povinný" },
          { status: 400, headers }
        );
      }
      const data = await getClientPortalOverview(contactId);
      return NextResponse.json(data, { headers });
    }

    return NextResponse.json(
      { error: "Neplatná akce. Použijte: sync, client" },
      { status: 400, headers }
    );
  } catch {
    return NextResponse.json(
      { error: "Interní chyba" },
      { status: 500, headers }
    );
  }
}
