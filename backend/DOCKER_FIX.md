# 🐳 Docker Crypto Fix Guide

## Issue: crypto is not defined

**Problem**: Node.js v18 in Alpine Linux containers has crypto module compatibility issues with NestJS/TypeORM.

**Error Message**:
```
ReferenceError: crypto is not defined
at generateString (/app/node_modules/@nestjs/typeorm/dist/common/typeorm.utils.js:123:37)
```

## ✅ Solutions Applied

### 1. Crypto Polyfill (Fixed in src/main.ts)
Added Node.js crypto polyfill to ensure compatibility:
```typescript
// Crypto polyfill for Node.js v18 compatibility
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}
```

### 2. Alternative Dockerfile (Recommended)
Created `Dockerfile.debian` using Debian base image instead of Alpine:
- Better Node.js compatibility
- Avoids crypto-related issues
- More stable for production

### 3. Updated Docker Compose
Modified `docker-compose.yml` to use the Debian-based Dockerfile.

## 🚀 How to Use

### Option A: Use Fixed Docker Compose (Recommended)
```bash
# Stop any existing containers
docker-compose down

# Remove old images (optional but recommended)
docker-compose down --rmi all

# Build and start with the fix
docker-compose up --build
```

### Option B: Use Alpine Dockerfile (if you prefer smaller images)
```bash
# Build with Alpine + crypto fix
docker build -f Dockerfile -t checkinbuddy-backend .

# Run manually
docker run -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e JWT_SECRET=development_jwt_secret_minimum_32_characters_long \
  checkinbuddy-backend
```

### Option C: Use Debian Dockerfile (most stable)
```bash
# Build with Debian base
docker build -f Dockerfile.debian -t checkinbuddy-backend .

# Run manually
docker run -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e JWT_SECRET=development_jwt_secret_minimum_32_characters_long \
  checkinbuddy-backend
```

## 🧪 Testing After Fix

### 1. Check Container Logs
```bash
# View backend logs
docker-compose logs app

# Should see:
# [Nest] LOG [NestFactory] Starting Nest application...
# [Nest] LOG [InstanceLoader] AppModule dependencies initialized
# Application is running on: http://[::]:3000
```

### 2. Test Health Endpoint
```bash
# Wait for startup (30 seconds), then test
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-07T...","service":"CheckInBuddy API","version":"1.0.0"}
```

### 3. Test Database Connection
```bash
curl http://localhost:3000/health/db

# Expected response:
# {"database":"connected","timestamp":"2025-01-07T..."}
```

## 🔧 If Still Having Issues

### Issue: Database Connection Failed
```bash
# Check if PostgreSQL container is running
docker ps | grep postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test direct database connection
docker exec -it checkinbuddy-postgres psql -U checkinbuddy -d checkinbuddy -c "SELECT version();"
```

### Issue: Port Already in Use
```bash
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill process or change port in docker-compose.yml:
# ports:
#   - "3001:3000"  # Use different external port
```

### Issue: Memory Problems
```bash
# Increase Docker Desktop memory allocation
# Settings → Resources → Memory: 4GB+

# Or run with memory limit
docker-compose up --build --scale app=1 --memory=2g
```

## 📊 Image Size Comparison

| Dockerfile | Base Image | Size | Compatibility |
|------------|------------|------|---------------|
| Dockerfile | Alpine | ~150MB | Good (with fix) |
| Dockerfile.debian | Debian | ~200MB | Excellent |

**Recommendation**: Use `Dockerfile.debian` for production - better stability, minimal size difference.

## ✅ Verification Checklist

- [ ] No crypto errors in logs
- [ ] Health endpoint responds (200 OK)
- [ ] Database health check passes
- [ ] All modules load successfully
- [ ] Container stays running (not exiting)

## 🚀 Next Steps

Once Docker is working:
1. **Configure external services** (Firebase, AWS, Stripe)
2. **Test API endpoints** using `test-api.http`
3. **Deploy to production** using the same Docker configuration
4. **Build frontend** to connect to working backend

The crypto fix is now permanently applied! 🎉 