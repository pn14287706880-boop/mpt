-- Create target schema if it does not exist
CREATE SCHEMA IF NOT EXISTS "mpt";

-- Ensure tables exist inside the mpt schema
CREATE TABLE IF NOT EXISTS "mpt"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_key" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "mpt"."Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_token_key" UNIQUE ("token"),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "mpt"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Clean up any tables accidentally created in the public schema
DROP TABLE IF EXISTS "public"."Session";
DROP TABLE IF EXISTS "public"."User";
