# Sanative Health Portal - Deployment Guide

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database. Recommended services:
   - [Neon](https://neon.tech) - Free tier available
   - [Supabase](https://supabase.com) - Free tier available
   - [Railway](https://railway.app) - Free tier available
   - [PlanetScale](https://planetscale.com) - MySQL alternative

2. **Netlify Account**: For hosting the application

## Environment Variables

Set these in your Netlify dashboard under Site Settings > Environment Variables:

```bash
# Required
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
NEXTAUTH_URL="https://your-app.netlify.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Optional - for email notifications
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
EMAIL_FROM="noreply@sanative.com.au"
```

## Deployment Steps

### 1. Set Up Database

#### Using Neon (Recommended for free tier):
1. Create a Neon account at https://neon.tech
2. Create a new project
3. Copy the connection string from the dashboard
4. The connection string looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Deploy to Netlify

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build settings:
   - Build command: `bun run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy!

### 3. Initialize Database

After deployment, run the database migrations:

```bash
# Option 1: Using Netlify CLI
netlify env:import .env.production
npx prisma migrate deploy
npx prisma db seed

# Option 2: Connect directly to your database
DATABASE_URL="your-production-url" npx prisma migrate deploy
DATABASE_URL="your-production-url" npx prisma db seed
```

### 4. Verify Deployment

1. Visit your Netlify URL
2. Log in with demo credentials:
   - Member: `demo@sanative.com.au` / `demo123`
   - Admin: `admin@sanative.com.au` / `admin123`

## Local Development

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Generate Prisma client
bun run db:generate

# Run migrations
bun run db:migrate

# Seed the database
bun run db:seed

# Start development server
bun run dev
```

## Database Commands

```bash
# Generate Prisma client
bun run db:generate

# Push schema changes (development)
bun run db:push

# Create migration (development)
bun run db:migrate

# Deploy migrations (production)
bun run db:migrate:deploy

# Seed database
bun run db:seed

# Open Prisma Studio (GUI)
bun run db:studio

# Reset database
bun run db:reset
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Package Manager**: Bun

### API Routes
- `/api/auth/*` - NextAuth authentication
- `/api/users` - User management
- `/api/biomarkers` - Biomarker definitions
- `/api/biomarkers/results` - Biomarker test results
- `/api/goals` - Health goals
- `/api/notifications` - User notifications
- `/api/health-scores` - Health score calculations

### Database Models
- `User` - User accounts and profiles
- `BiomarkerDefinition` - Biomarker reference data
- `BiomarkerResult` - Test results
- `HealthScore` - Calculated health scores
- `HealthGoal` - User health goals
- `Reminder` - User reminders
- `Notification` - In-app notifications
- `AIReport` - AI-generated health reports
- `Appointment` - Scheduled appointments
- `ActivityLog` - Audit trail

## Troubleshooting

### Build Fails
- Ensure all environment variables are set
- Check that DATABASE_URL is valid
- Run `prisma generate` before building

### Database Connection Issues
- Verify your connection string includes `?sslmode=require` for cloud databases
- Check firewall rules allow connections from Netlify IP ranges
- Ensure database user has proper permissions

### Authentication Issues
- Verify NEXTAUTH_URL matches your deployment URL
- Generate a new NEXTAUTH_SECRET for production
- Clear browser cookies and try again

## Security Checklist

- [ ] Use strong NEXTAUTH_SECRET (min 32 characters)
- [ ] Enable SSL for database connections
- [ ] Set up proper CORS headers
- [ ] Review and limit database user permissions
- [ ] Enable rate limiting for API routes
- [ ] Set up monitoring and alerts
