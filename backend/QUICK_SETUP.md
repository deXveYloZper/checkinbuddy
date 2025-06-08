# 🚀 CheckInBuddy Backend - Quick Setup Guide

## Option 1: Docker Setup (Recommended - Easiest)

### Prerequisites
- Docker Desktop installed on Windows
- Git Bash or PowerShell

### Steps
```bash
# 1. Start PostgreSQL + PostGIS with Docker
docker run --name checkinbuddy-postgres \
  -e POSTGRES_PASSWORD=checkinbuddy_dev \
  -e POSTGRES_DB=checkinbuddy \
  -e POSTGRES_USER=checkinbuddy \
  -p 5432:5432 \
  -d postgis/postgis:14-3.2

# 2. Wait for database to start (30 seconds)
# 3. Run database setup
docker exec -i checkinbuddy-postgres psql -U checkinbuddy -d checkinbuddy < database-setup.sql

# 4. Create minimal .env file
```

### Minimal .env for Testing
```env
# Application
APP_PORT=3000
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=checkinbuddy
DATABASE_PASSWORD=checkinbuddy_dev
DATABASE_NAME=checkinbuddy

# JWT (for development only)
JWT_SECRET=development_jwt_secret_minimum_32_characters_long_for_testing
JWT_EXPIRES_IN=24h

# Optional - External services (can be empty for basic testing)
GOOGLE_APPLICATION_CREDENTIALS=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-west-1
AWS_S3_BUCKET_NAME=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
MAPBOX_API_KEY=
```

### Start Backend
```bash
npm run start:dev
```

### Test Backend
```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-07T...","service":"CheckInBuddy API","version":"1.0.0"}
```

---

## Option 2: Local PostgreSQL Installation

### For Windows
```bash
# 1. Download PostgreSQL from https://www.postgresql.org/download/windows/
# 2. During installation, add PostGIS extension
# 3. Create database:
createdb -U postgres checkinbuddy

# 4. Run setup script:
psql -U postgres -d checkinbuddy -f database-setup.sql
```

---

## Option 3: Cloud Database (Production-like)

### Using DigitalOcean Managed Database
1. Create PostgreSQL database on DigitalOcean
2. Enable PostGIS extension
3. Update .env with connection details
4. Run database-setup.sql remotely

### Using Supabase (Free PostgreSQL + PostGIS)
1. Create account at supabase.com
2. Create new project
3. Get connection string
4. PostGIS is already enabled
5. Run database-setup.sql in SQL editor

---

## Testing Without Full Configuration

### What Works Without External Services:
- ✅ Health endpoints
- ✅ User management (without Firebase auth)
- ✅ Check-in requests (without geospatial queries)
- ✅ Input validation
- ✅ Rate limiting

### What Requires Configuration:
- 🔧 Firebase authentication (needs service account)
- 🔧 S3 document upload (needs AWS credentials) 
- 🔧 Stripe payments (needs API keys)
- 🔧 Geospatial queries (needs PostGIS database)

---

## Quick Test Commands

### After database is running:
```bash
# Start backend
npm run start:dev

# Test in another terminal:
curl http://localhost:3000/health
curl http://localhost:3000/health/db

# Test error handling
curl http://localhost:3000/users/me
# Should return 401 Unauthorized
```

---

## Next Steps Priority

1. **Database Setup** (5 minutes) → Basic functionality working
2. **Firebase Setup** (10 minutes) → Authentication working  
3. **AWS S3 Setup** (10 minutes) → Document upload working
4. **Stripe Setup** (10 minutes) → Payments working
5. **Production Deployment** (30 minutes) → Live backend

Choose Option 1 (Docker) for fastest setup! 🐳 