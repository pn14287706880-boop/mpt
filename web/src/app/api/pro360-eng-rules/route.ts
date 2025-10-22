import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

// GET: Fetch rules with optional filters
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const showHistory = searchParams.get("history") === "true";
    const onlyActive = searchParams.get("active") === "true";
    const onlyLatest = searchParams.get("latest") !== "false"; // default true

    const where: Record<string, unknown> = {};
    
    if (onlyLatest && !showHistory) {
      where.isLatest = 1;
    }
    
    if (onlyActive) {
      where.isActive = 1;
    }

    const rules = await prisma.pro360EngRule.findMany({
      where,
      orderBy: [
        { eventName: "asc" },
        { version: "desc" },
      ],
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

// POST: Create new rule
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventName, billingType, tacticField, isEngagement, isExposure } = body;

    // Validate required fields
    if (!eventName || !billingType || isEngagement === undefined || isExposure === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate values
    if (!["CPX", "CPE", "CPVS"].includes(billingType)) {
      return NextResponse.json(
        { error: "Invalid billingType. Must be CPX, CPE, or CPVS" },
        { status: 400 }
      );
    }

    if (![0, 1].includes(isEngagement) || ![0, 1].includes(isExposure)) {
      return NextResponse.json(
        { error: "isEngagement and isExposure must be 0 or 1" },
        { status: 400 }
      );
    }

    // Check if eventName already exists as latest
    const existing = await prisma.pro360EngRule.findFirst({
      where: {
        eventName,
        isLatest: 1,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A rule with this eventName already exists" },
        { status: 409 }
      );
    }

    // Create new rule
    const newRule = await prisma.pro360EngRule.create({
      data: {
        eventName,
        billingType,
        tacticField: tacticField || null,
        isEngagement,
        isExposure,
        isActive: 1,
        isLatest: 1,
        version: 1,
        validFrom: new Date(),
        validTo: null,
        modifiedBy: user.email,
      },
    });

    return NextResponse.json(newRule, { status: 201 });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}

// PUT: Update existing rule (creates new version with SCD Type 2)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventName, billingType, tacticField, isEngagement, isExposure } = body;

    // Validate required fields
    if (!eventName || !billingType || isEngagement === undefined || isExposure === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate values
    if (!["CPX", "CPE", "CPVS"].includes(billingType)) {
      return NextResponse.json(
        { error: "Invalid billingType. Must be CPX, CPE, or CPVS" },
        { status: 400 }
      );
    }

    if (![0, 1].includes(isEngagement) || ![0, 1].includes(isExposure)) {
      return NextResponse.json(
        { error: "isEngagement and isExposure must be 0 or 1" },
        { status: 400 }
      );
    }

    // Execute SCD Type 2 update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find current latest record
      const currentRecord = await tx.pro360EngRule.findFirst({
        where: {
          eventName,
          isLatest: 1,
        },
      });

      if (!currentRecord) {
        throw new Error("Rule not found");
      }

      // Close the current record
      const now = new Date();
      await tx.pro360EngRule.update({
        where: { id: currentRecord.id },
        data: {
          isLatest: 0,
          validTo: now,
          updatedAt: now,
        },
      });

      // Create new version with updated fields, preserving status
      const newVersion = await tx.pro360EngRule.create({
        data: {
          eventName,
          billingType,
          tacticField: tacticField || null,
          isEngagement,
          isExposure,
          isActive: currentRecord.isActive, // Preserve (0 or 1)
          isLatest: 1,
          version: currentRecord.version + 1,
          validFrom: now,
          validTo: null,
          modifiedBy: user.email,
          inactivatedAt: currentRecord.inactivatedAt, // Preserve
          inactivatedBy: currentRecord.inactivatedBy, // Preserve
        },
      });

      return newVersion;
    });

    return NextResponse.json(result);
    } catch (error) {
      console.error("Error updating rule:", error);
      if (error instanceof Error && error.message === "Rule not found") {
        return NextResponse.json(
          { error: "Rule not found" },
          { status: 404 }
        );
      }
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

// DELETE: Hard delete a rule (optional - use with caution)
export async function DELETE(request: NextRequest) {
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

    // Delete all versions of the rule
    await prisma.pro360EngRule.deleteMany({
      where: { eventName },
    });

    return NextResponse.json({ message: "Rule deleted successfully" });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}

