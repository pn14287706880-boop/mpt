import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Fetch all versions of a specific eventName
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventName = searchParams.get("eventName");

    if (!eventName) {
      return NextResponse.json(
        { error: "eventName is required" },
        { status: 400 }
      );
    }

    const history = await prisma.pro360EngRule.findMany({
      where: { eventName },
      orderBy: { version: "desc" },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching rule history:", error);
    return NextResponse.json(
      { error: "Failed to fetch rule history" },
      { status: 500 }
    );
  }
}

