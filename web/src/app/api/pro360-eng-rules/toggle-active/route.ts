import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PATCH: Toggle isActive status without creating a new version
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventName, isActive } = body;

    if (!eventName || (isActive !== 0 && isActive !== 1)) {
      return NextResponse.json(
        { error: "eventName and isActive (0 or 1) are required" },
        { status: 400 }
      );
    }

    // Find the latest record
    const currentRecord = await prisma.pro360EngRule.findFirst({
      where: {
        eventName,
        isLatest: 1,
      },
    });

    if (!currentRecord) {
      return NextResponse.json(
        { error: "Rule not found" },
        { status: 404 }
      );
    }

    // Update the active status
    const now = new Date();
    const updatedRule = await prisma.pro360EngRule.update({
      where: { id: currentRecord.id },
      data: {
        isActive,
        inactivatedAt: isActive ? null : now,
        inactivatedBy: isActive ? null : user.email,
        updatedAt: now,
      },
    });

    return NextResponse.json(updatedRule);
  } catch (error) {
    console.error("Error toggling active status:", error);
    return NextResponse.json(
      { error: "Failed to toggle active status" },
      { status: 500 }
    );
  }
}

