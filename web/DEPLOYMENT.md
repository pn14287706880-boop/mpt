# Production Deployment Guide

## Summary of Changes Made

We've added a professional sidebar with shadcn/ui components and MedPage Today color scheme. Here's what was installed:

### New Dependencies Added

**Production Dependencies:**
- `@radix-ui/react-avatar` - Avatar component for user profile
- `@radix-ui/react-collapsible` - Collapsible menus in sidebar
- `@radix-ui/react-dialog` - Dialog/modal components
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-separator` - Visual separators
- `@radix-ui/react-slot` - Slot component for composition
- `@radix-ui/react-tooltip` - Tooltips
- `class-variance-authority` - CVA for component variants
- `clsx` - Utility for conditional classNames
- `lucide-react` - Icon library
- `tailwind-merge` - Merge Tailwind CSS classes
- `tailwindcss-animate` - Animation utilities for Tailwind

**Dev Dependencies:**
- `tailwindcss@^3.4.18` - CSS framework
- `autoprefixer@^10.4.21` - PostCSS plugin
- `postcss@^8.5.6` - CSS preprocessor

### New Files Created

**Components:**
- `src/components/app-sidebar.tsx` - Main sidebar component
- `src/components/team-switcher.tsx` - Company logo/switcher
- `src/components/nav-main.tsx` - Main navigation menu
- `src/components/nav-projects.tsx` - Projects navigation
- `src/components/nav-user.tsx` - User profile dropdown
- `src/components/ui/sidebar.tsx` - Sidebar UI primitives
- `src/components/ui/avatar.tsx` - Avatar component
- `src/components/ui/dropdown-menu.tsx` - Dropdown component
- `src/components/ui/collapsible.tsx` - Collapsible component
- `src/components/ui/breadcrumb.tsx` - Breadcrumb navigation
- `src/components/ui/button.tsx` - Button component
- `src/components/ui/separator.tsx` - Separator component
- `src/components/ui/sheet.tsx` - Sheet/drawer component
- `src/components/ui/tooltip.tsx` - Tooltip component
- `src/components/ui/input.tsx` - Input component
- `src/components/ui/skeleton.tsx` - Skeleton loading component

**Layouts:**
- `src/app/(dashboard)/layout.tsx` - Dashboard layout with sidebar
- `src/app/(dashboard)/dashboard/page.tsx` - Dashboard page
- `src/app/(auth)/layout.tsx` - Auth pages layout

**Configuration:**
- `tailwind.config.ts` - Tailwind configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui configuration
- `src/lib/utils.ts` - Utility functions
- `src/hooks/use-mobile.ts` - Mobile detection hook

**Styles:**
- Updated `src/app/globals.css` - MedPage Today color scheme

**Assets:**
- `public/mpt-logo.png` - Your MPT logo (you need to add this!)

---

## Deployment Steps

### Option 1: Deploy to Production Server (VPS/Cloud)

#### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (for Prisma)
- Environment variables configured

#### Step 1: Install Dependencies

On your production server, run:

```bash
cd /path/to/your/web/directory
npm install --production=false
```

This will install all dependencies including devDependencies needed for the build.

#### Step 2: Set Up Environment Variables

Create a `.env.production` file or set environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Next.js
NODE_ENV=production
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# Add any other environment variables you need
```

#### Step 3: Build the Application

```bash
npm run build
```

Note: The current build script uses `--turbopack` flag. For production, you might want to update `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "build:turbo": "next build --turbopack"
  }
}
```

Then run:
```bash
npm run build
```

#### Step 4: Run Database Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

#### Step 5: Start the Application

```bash
npm start
```

This will start the Next.js production server on port 3000 by default.

#### Step 6: Use a Process Manager (Recommended)

Install PM2 for process management:

```bash
npm install -g pm2
pm2 start npm --name "mpt-app" -- start
pm2 save
pm2 startup
```

#### Step 7: Set Up Nginx Reverse Proxy (Recommended)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Option 2: Deploy to Vercel (Recommended for Next.js)

Vercel is the easiest way to deploy Next.js apps:

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Deploy

```bash
vercel
```

Follow the prompts to link your project and deploy.

#### Step 3: Set Environment Variables

In Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all variables from your `.env` file

#### Step 4: Configure Build Settings

Vercel will auto-detect Next.js. Make sure:
- Build Command: `next build` (remove --turbopack flag)
- Output Directory: `.next`
- Install Command: `npm install`

---

### Option 3: Deploy to Docker

#### Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

#### Build and Run:

```bash
docker build -t mpt-app .
docker run -p 3000:3000 --env-file .env.production mpt-app
```

---

## Important Files Checklist

Before deploying, ensure you have:

- ✅ All dependencies in `package.json`
- ✅ `tailwind.config.ts` configured
- ✅ `postcss.config.mjs` configured
- ✅ `components.json` for shadcn/ui
- ✅ `.env.production` with environment variables
- ✅ `public/mpt-logo.png` - **ADD YOUR LOGO!**
- ✅ Database migrations ready (`prisma/migrations/`)

---

## Post-Deployment Verification

1. **Check the app loads**: Visit your domain
2. **Test authentication**: Try logging in/signing up
3. **Verify sidebar**: After login, check the sidebar displays correctly
4. **Check logo**: Ensure MPT logo appears in sidebar
5. **Test navigation**: Click through all menu items
6. **Mobile responsive**: Test on mobile devices
7. **Check console**: Look for any JavaScript errors

---

## Troubleshooting

### Build Fails

If build fails with Turbopack errors, update `package.json`:
```json
"build": "next build"
```

### Tailwind Styles Not Loading

Ensure these files exist:
- `tailwind.config.ts`
- `postcss.config.mjs`
- `src/app/globals.css` with `@tailwind` directives

### Sidebar Not Showing

Check:
- User is logged in
- Route is under `(dashboard)` group
- All shadcn components are installed

### Logo Not Appearing

- Ensure `public/mpt-logo.png` exists
- Check image path in `team-switcher.tsx`
- Verify file permissions on server

---

## Performance Optimization

For production, consider:

1. **Enable Image Optimization** in `next.config.ts`:
```typescript
images: {
  domains: ['yourdomain.com'],
}
```

2. **Add CDN** for static assets

3. **Enable compression** in Nginx

4. **Use Redis** for session storage

5. **Add monitoring** (Sentry, LogRocket, etc.)

---

## Quick Deploy Commands

```bash
# 1. Clone/pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Run migrations
npx prisma migrate deploy

# 5. Start (with PM2)
pm2 restart mpt-app

# Or without PM2
npm start
```

---

## Need Help?

Common issues:
- **Port already in use**: Change port with `PORT=3001 npm start`
- **Database connection**: Check DATABASE_URL in .env
- **Missing dependencies**: Run `npm install` again
- **Build errors**: Check Node.js version (needs 18+)
