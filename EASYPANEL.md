# EasyPanel Configuration
# This file describes the services for EasyPanel deployment

# Service 1: PostgreSQL Database
# - Use EasyPanel's built-in PostgreSQL service
# - Or deploy with docker-compose.prod.yml

# Service 2: Backend API
# Source: GitHub Repository -> /backend
# Build: Dockerfile
# Port: 4000
# Domain: api.yourdomain.com

# Service 3: Frontend
# Source: GitHub Repository -> /frontend
# Build: Dockerfile
# Port: 80
# Domain: yourdomain.com, *.yourdomain.com

# Required Environment Variables (set in EasyPanel):
# - POSTGRES_PASSWORD (for database)
# - JWT_ACCESS_SECRET
# - JWT_REFRESH_SECRET
# - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
# - DOMAIN
# - APP_URL
# - CORS_ORIGINS

# Steps to deploy:
# 1. Create new project in EasyPanel
# 2. Add PostgreSQL service (or use external database)
# 3. Add Backend service from GitHub (/backend folder)
#    - Set environment variables
#    - Configure domain: api.yourdomain.com
# 4. Add Frontend service from GitHub (/frontend folder)
#    - Set VITE_API_URL build arg to https://api.yourdomain.com/api
#    - Configure domains: yourdomain.com and *.yourdomain.com
# 5. Run prisma migrate on backend
# 6. Seed initial data if needed

# Post-deployment:
# Run these commands in backend container:
# npx prisma migrate deploy
# npx prisma db seed (optional, for demo data)
