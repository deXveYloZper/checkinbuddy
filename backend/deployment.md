# CheckInBuddy Backend Deployment Guide

## Environment Configuration

### Required Environment Variables

```bash
# Application Configuration
APP_PORT=3000
NODE_ENV=development # or production

# Database (PostgreSQL with PostGIS)
DATABASE_HOST=localhost # or your PostgreSQL host
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_username
DATABASE_PASSWORD=your_db_password
DATABASE_NAME=checkinbuddy

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-service-account.json

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-1
AWS_S3_BUCKET_NAME=checkinbuddy-documents

# Stripe
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...

# Mapbox (for geocoding)
MAPBOX_API_KEY=pk.eyJ1...
```

## Local Development Setup

### 1. Database Setup (PostgreSQL + PostGIS)

```bash
# Install PostgreSQL with PostGIS (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis postgresql-14-postgis-3

# Or using Docker
docker run --name checkinbuddy-postgres \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=checkinbuddy \
  -p 5432:5432 \
  -d postgis/postgis:14-3.2

# Connect and run setup script
psql -h localhost -U your_username -d checkinbuddy -f database-setup.sql
```

### 2. Start Development Server

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run start:dev

# Or start production server
npm run start:prod
```

## Testing

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. API Testing

#### Authentication Test
```bash
# This requires a valid Firebase token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your_firebase_token"}'
```

#### Protected Endpoint Test
```bash
# Get user profile (requires JWT token)
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer your_jwt_token"
```

### 3. Database Connection Test
```bash
# Check if TypeORM can connect to database
npm run start:dev
# Look for "Database connected successfully" in logs
```

## Production Deployment (DigitalOcean)

### 1. Server Setup

```bash
# Create Ubuntu droplet (minimum 2GB RAM recommended)
# Connect via SSH

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL + PostGIS
sudo apt-get install postgresql postgresql-contrib postgis

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Application Deployment

```bash
# Clone repository
git clone <your-repo-url>
cd checkinbuddy/backend

# Install dependencies
npm install

# Build application
npm run build

# Set up environment variables in .env file

# Run database setup
sudo -u postgres psql -d checkinbuddy -f database-setup.sql

# Start with PM2
pm2 start dist/main.js --name "checkinbuddy-api"
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Docker Deployment (Alternative)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - postgres

  postgres:
    image: postgis/postgis:14-3.2
    environment:
      POSTGRES_DB: checkinbuddy
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database-setup.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## Monitoring & Logging

### 1. Application Logs
```bash
# PM2 logs
pm2 logs checkinbuddy-api

# Docker logs
docker logs container_name
```

### 2. Database Monitoring
```sql
-- Check database connections
SELECT * FROM pg_stat_activity WHERE datname = 'checkinbuddy';

-- Check PostGIS extension
SELECT * FROM pg_extension WHERE extname = 'postgis';
```

## Security Checklist

- [ ] Environment variables properly secured
- [ ] Database access restricted
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Firebase service account secured
- [ ] AWS IAM permissions minimal
- [ ] Stripe webhooks verified

## Performance Optimization

- [ ] Database indexes created (see database-setup.sql)
- [ ] Connection pooling configured
- [ ] Cron jobs scheduled for document cleanup
- [ ] Rate limiting enabled (100 req/min)
- [ ] CORS properly configured 