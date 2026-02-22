# Albion Events — Guild Content Planner

A full-stack Discord-authenticated event signup and composition management system for Albion Online guilds.

## Features

- 🔐 Discord OAuth2 authentication — no passwords, no manual name entry
- 📅 Event scheduling with party/role compositions
- ✅ Player signup with up to 3 preferred roles (ranked)
- 🎯 Admin assignment board — quickly assign players from waitlist to role slots
- 🔒 Event lifecycle: Draft → Published → Locked → Completed
- 📝 Full audit log of admin actions
- 📱 Mobile-first responsive design

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v4 + Discord OAuth2
- **Hosting**: Vercel + Vercel Postgres (or self-hosted Docker)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- A Discord application with OAuth2 configured

---

## Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd albion-events
npm install
```

### 2. Create a Discord OAuth2 Application

1. Go to https://discord.com/developers/applications
2. Click **New Application** → name it (e.g. "Guild Events")
3. Go to **OAuth2** → **General**
4. Note your **Client ID** and **Client Secret**
5. Add redirect URI: `http://localhost:3000/api/auth/callback/discord`

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/albion_events"

# NextAuth — generate secret with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# Discord OAuth2
DISCORD_CLIENT_ID="your-client-id"
DISCORD_CLIENT_SECRET="your-client-secret"
```

### 4. Start database (Docker)

```bash
docker run -d \
  --name albion-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=albion_events \
  -p 5432:5432 \
  postgres:16-alpine
```

### 5. Run database migrations

```bash
npm run db:migrate
# Enter migration name: "init"
```

Or push schema directly (dev only, no migration history):

```bash
npm run db:push
```

### 6. Seed with example data

```bash
npm run db:seed
```

This creates:
- 1 admin user (seeded Discord ID: `123456789`)
- 3 player users
- 1 published ZvZ event with 2 parties and full compositions
- 1 draft Hellgate event
- 3 player signups on the ZvZ event

> **To make yourself admin**: After logging in with Discord, run:
> ```sql
> UPDATE users SET role = 'ADMIN' WHERE discord_user_id = 'YOUR_DISCORD_ID';
> ```

### 7. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Database Migration Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create a new migration (recommended for production)
npm run db:migrate

# Push schema directly without migration file (dev only)
npm run db:push

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## Running Tests

```bash
npm test
```

Tests cover:
- Max 3 preferred roles per signup
- Slot capacity enforcement
- One assignment per user per event
- Event status governs editability rules
- Permission checks (admin vs player)

---

## Deployment (Vercel)

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "init"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Create Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Framework preset: **Next.js**

### 3. Add Vercel Postgres

1. In Vercel dashboard → your project → **Storage** tab
2. Create a **Postgres** database
3. It will auto-add `DATABASE_URL`, `POSTGRES_URL`, etc. to your environment

### 4. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate with openssl rand -base64 32>
DISCORD_CLIENT_ID=<from Discord developer portal>
DISCORD_CLIENT_SECRET=<from Discord developer portal>
```

### 5. Update Discord Redirect URI

Add to your Discord OAuth2 application:
`https://your-app.vercel.app/api/auth/callback/discord`

### 6. Run migrations on Vercel

```bash
npx vercel env pull .env.production.local
npx prisma migrate deploy
```

Or add to your build command in `package.json`:
```json
"vercel-build": "prisma migrate deploy && next build"
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/events` | Public | List published events |
| POST | `/api/events` | Admin | Create event |
| GET | `/api/events/:id` | Public* | Get event details |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event |
| POST | `/api/events/:id/lock` | Admin | Lock event |
| POST | `/api/events/:id/signup` | Player | Create signup |
| PUT | `/api/events/:id/signup` | Player | Update signup |
| DELETE | `/api/events/:id/signup` | Player | Withdraw signup |
| GET | `/api/events/:id/signups` | Admin | List all signups |
| POST | `/api/events/:id/assign` | Admin | Assign player to slot |
| POST | `/api/events/:id/unassign` | Admin | Remove assignment |
| POST | `/api/events/:id/parties` | Admin | Add party to event |
| PUT | `/api/events/:id/parties` | Admin | Update party slots |

*Draft events require admin authentication

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Home — events list
│   ├── layout.tsx                  # Root layout + nav
│   ├── providers.tsx               # NextAuth SessionProvider
│   ├── globals.css                 # Global styles + Tailwind
│   ├── auth/signin/page.tsx        # Custom sign-in page
│   ├── events/[id]/page.tsx        # Event detail + signup
│   ├── admin/events/
│   │   ├── new/page.tsx            # Create event
│   │   └── [id]/
│   │       ├── edit/page.tsx       # Edit event + compositions
│   │       └── assign/page.tsx     # Assignment board
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       └── events/                 # REST API routes
├── components/
│   ├── NavBar.tsx                  # Top navigation
│   ├── SignupForm.tsx              # Player signup form
│   ├── EventBuilderForm.tsx        # Admin event/party editor
│   └── AssignmentBoard.tsx         # Admin drag-assign board
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # NextAuth configuration
│   └── audit.ts                    # Audit log helper
└── __tests__/
    └── business-rules.test.ts      # Core business logic tests
```

---

## Extension: Discord Bot (Option B)

The spec calls for an Option B webhook/bot flow. This can be added without breaking the existing system:

**Interface contract:**

```typescript
// POST /api/events/:id/dm-links
// Admin triggers DM to all guild members who haven't signed up
// Body: { guildId: string }
// Bot sends: "Sign up for [Event Title]: https://your-app.vercel.app/events/:id"

// The OAuth2 flow (Option A) handles the binding automatically when they click the link.
```

**Implementation notes:**
- Create a Discord bot in the same application
- Add `discord.js` and a `/dm-links` API endpoint
- Bot needs `Send Messages` permission in DMs
- Users click the link → redirected to event page → sign in with Discord → bound automatically

---

## Making a User Admin

After first login via Discord:

```sql
-- Find user by Discord name
SELECT * FROM users WHERE discord_name LIKE '%YourName%';

-- Grant admin
UPDATE users SET role = 'ADMIN' WHERE discord_user_id = 'YOUR_DISCORD_USER_ID';
```

Or via Prisma Studio:
```bash
npx prisma studio
# Open Users table, find your record, change role to ADMIN
```
