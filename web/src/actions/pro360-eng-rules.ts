"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export interface EngRule {
  id: string;
  eventName: string;
  billingType: string;
  tacticField: string | null;
  isEngagement: number;
  isExposure: number;
  isActive: number;
  isLatest: number;
  version: number;
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
  modifiedBy: string;
  inactivatedAt: Date | null;
  inactivatedBy: string | null;
}

export interface GetRulesParams {
  showHistory?: boolean;
  onlyActive?: boolean;
  onlyLatest?: boolean;
}

export interface CreateRuleParams {
  eventName: string;
  billingType: string;
  tacticField?: string | null;
  isEngagement: number;
  isExposure: number;
}

export interface UpdateRuleParams {
  eventName: string;
  billingType: string;
  tacticField?: string | null;
  isEngagement: number;
  isExposure: number;
}

export interface ToggleActiveParams {
  eventName: string;
  isActive: number;
}

// GET: Fetch rules with optional filters
export async function getRulesAction(
  params: GetRulesParams = {}
): Promise<EngRule[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { showHistory = false, onlyActive = false, onlyLatest = true } = params;

  const where: Record<string, unknown> = {};

  if (onlyLatest && !showHistory) {
    where.isLatest = 1;
  }

  if (onlyActive) {
    where.isActive = 1;
  }

  const rules = await prisma.pro360EngRule.findMany({
    where,
    orderBy: [{ eventName: "asc" }, { version: "desc" }],
  });

  return rules as EngRule[];
}

// POST: Create new rule
export async function createRuleAction(
  params: CreateRuleParams
): Promise<EngRule> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { eventName, billingType, tacticField, isEngagement, isExposure } =
    params;

  // Validate required fields
  if (
    !eventName ||
    !billingType ||
    isEngagement === undefined ||
    isExposure === undefined
  ) {
    throw new Error("Missing required fields");
  }

  // Validate values
  if (!["CPX", "CPE", "CPVS"].includes(billingType)) {
    throw new Error("Invalid billingType. Must be CPX, CPE, or CPVS");
  }

  if (![0, 1].includes(isEngagement) || ![0, 1].includes(isExposure)) {
    throw new Error("isEngagement and isExposure must be 0 or 1");
  }

  // Check if eventName already exists as latest
  const existing = await prisma.pro360EngRule.findFirst({
    where: {
      eventName,
      isLatest: 1,
    },
  });

  if (existing) {
    throw new Error("A rule with this eventName already exists");
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

  return newRule as EngRule;
}

// PUT: Update existing rule (creates new version with SCD Type 2)
export async function updateRuleAction(
  params: UpdateRuleParams
): Promise<EngRule> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { eventName, billingType, tacticField, isEngagement, isExposure } =
    params;

  // Validate required fields
  if (
    !eventName ||
    !billingType ||
    isEngagement === undefined ||
    isExposure === undefined
  ) {
    throw new Error("Missing required fields");
  }

  // Validate values
  if (!["CPX", "CPE", "CPVS"].includes(billingType)) {
    throw new Error("Invalid billingType. Must be CPX, CPE, or CPVS");
  }

  if (![0, 1].includes(isEngagement) || ![0, 1].includes(isExposure)) {
    throw new Error("isEngagement and isExposure must be 0 or 1");
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

  return result as EngRule;
}

// PATCH: Toggle isActive status without creating a new version
export async function toggleActiveAction(
  params: ToggleActiveParams
): Promise<EngRule> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { eventName, isActive } = params;

  if (!eventName || (isActive !== 0 && isActive !== 1)) {
    throw new Error("eventName and isActive (0 or 1) are required");
  }

  // Find the latest record
  const currentRecord = await prisma.pro360EngRule.findFirst({
    where: {
      eventName,
      isLatest: 1,
    },
  });

  if (!currentRecord) {
    throw new Error("Rule not found");
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

  return updatedRule as EngRule;
}

// DELETE: Hard delete a rule
export async function deleteRuleAction(eventName: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!eventName) {
    throw new Error("eventName is required");
  }

  // Delete all versions of the rule
  await prisma.pro360EngRule.deleteMany({
    where: { eventName },
  });
}

// GET: Fetch history for a specific eventName
export async function getRuleHistoryAction(
  eventName: string
): Promise<EngRule[]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!eventName) {
    throw new Error("eventName is required");
  }

  const history = await prisma.pro360EngRule.findMany({
    where: { eventName },
    orderBy: { version: "desc" },
  });

  return history as EngRule[];
}

