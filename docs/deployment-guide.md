# Student Profile System - Production Deployment Guide

## Overview

This guide covers deploying the Student Profile & Goal Tracking System to production environments. The system supports multiple deployment methods: traditional server deployment, Docker containers, and cloud platforms.

## 🎯 Quick Start

### Option 1: Automated Deployment Script
```bash
# Clone and setup
git clone <repository-url>
cd student-profile-challenge

# Run automated deployment
./deploy.sh
```

### Option 2: Docker Deployment
```bash
# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings

# Start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f app
```

### Option 3: Manual Deployment
Follow the detailed steps below for custom deployment.

---

## 📋 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+, CentOS 8+, or similar Linux distribution
- **Node.js**: Version 18.x or higher
- **Database**: MariaDB 10.6+ or MySQL 8.0+
- **Memory**: Minimum 2GB RAM, recommended 4GB+
- **Storage**: Minimum 10GB free space
- **Network**: Ports 80, 443, 3001 available

### Software Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx curl

# CentOS/RHEL
sudo yum install -y nodejs npm mysql-server nginx curl

# Or install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## 🔧 Environment Configuration

### 1. Database Setup

#### Create Database User
```sql
-- Connect to MySQL/MariaDB as root
mysql -u root -p

-- Create dedicated user
CREATE USER 'student_profile_user'@'localhost' IDENTIFIED BY 'your_secure_password';
CREATE USER 'student_profile_user'@'%' IDENTIFIED BY 'your_secure_password';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON student_profiles.* TO 'student_profile_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON student_profiles.* TO 'student_profile_user'@'%';
FLUSH PRIVILEGES;
```

#### Run Database Setup Script
```bash
# Run the setup script
mysql -u root -p < database/setup.sql
```

### 2. Environment Variables

Create production `.env` file:
```bash
# Copy template
cp .env.example .env

# Edit with your settings
nano .env
```

**Critical settings to update:**
```env
# Database
DB_HOST=localhost
DB_USER=student_profile_user
DB_PASSWORD=your_secure_database_password
DB_NAME=student_profiles

# Security
SESSION_SECRET=your_super_secure_session_secret_min_32_chars
BCRYPT_ROUNDS=12

# Server
NODE_ENV=production
PORT=3001

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
```

---

## 🚀 Deployment Methods

### Method 1: Traditional Server Deployment

#### 1. Application Setup
```bash
# Install dependencies
npm install --production

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..

# Create required directories
mkdir -p logs uploads backups
```

#### 2. Process Management with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'student-profile-system',
    script: 'backend/production-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Nginx Reverse Proxy
```bash
# Copy nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/sites-available/student-profile-system

# Enable site
sudo ln -s /etc/nginx/sites-available/student-profile-system /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (add to crontab)
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Method 2: Docker Deployment

#### 1. Basic Docker Setup
```bash
# Build and run with Docker
docker build -t student-profile-system .
docker run -d \
  --name student-profile-app \
  -p 3001:3001 \
  --env-file .env \
  student-profile-system
```

#### 2. Docker Compose (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale application (if needed)
docker-compose up -d --scale app=3

# Update application
docker-compose build app
docker-compose up -d app
```

#### 3. Docker Production Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    restart: unless-stopped
    environment:
      NODE_ENV: production
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

### Method 3: Cloud Platform Deployment

#### Heroku Deployment
```bash
# Install Heroku CLI and login
heroku login

# Create application
heroku create your-app-name

# Add database addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secret

# Deploy
git push heroku main
```

#### AWS EC2 Deployment
```bash
# Launch EC2 instance (Ubuntu 20.04)
# Connect via SSH

# Install dependencies
sudo apt update
sudo apt install -y nodejs npm mysql-server nginx

# Clone repository
git clone <your-repo>
cd student-profile-challenge

# Run deployment script
./deploy.sh

# Configure security groups (ports 80, 443, 22)
```

#### DigitalOcean App Platform
```yaml
# .do/app.yaml
name: student-profile-system
services:
- environment_slug: node-js
  github:
    branch: main
    repo: your-username/student-profile-challenge
  name: web
  routes:
  - path: /
  run_command: npm start
  source_dir: /
databases:
- engine: MYSQL
  name: student-profiles-db
  version: "8"
```

---

## 🔒 Security Configuration

### 1. Firewall Setup
```bash
# Ubuntu UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. Database Security
```sql
-- Secure MySQL installation
mysql_secure_installation

-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Remove test database
DROP DATABASE test;

-- Reload privileges
FLUSH PRIVILEGES;
```

### 3. Application Security
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 Monitoring and Maintenance

### 1. Health Checks
```bash
# Application health
curl -f http://localhost:3001/api/health

# Database health
mysql -u student_profile_user -p -e "SELECT 1"

# Nginx health
sudo nginx -t
```

### 2. Log Management
```bash
# View application logs
tail -f logs/combined.log

# View nginx logs
sudo tail -f /var/log/nginx/access.log

# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f app
```

### 3. Database Backup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/path/to/backups"
DB_NAME="student_profiles"
DB_USER="student_profile_user"

# Create backup
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
EOF

# Make executable and add to crontab
chmod +x backup.sh
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### 4. Performance Monitoring
```bash
# Install monitoring tools
npm install -g pm2-logrotate
pm2 install pm2-server-monit

# System monitoring
sudo apt install htop iotop nethogs

# Application metrics
curl http://localhost:3001/api/health
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
npm run logs
pm2 logs
docker-compose logs app

# Check environment
node --version
npm --version
mysql --version

# Test database connection
mysql -u student_profile_user -p -e "USE student_profiles; SHOW TABLES;"
```

#### 2. Database Connection Issues
```bash
# Check MySQL status
sudo systemctl status mysql

# Check firewall
sudo ufw status
netstat -tlnp | grep :3306

# Test connection
telnet localhost 3306
```

#### 3. Frontend Build Issues
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 4. SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Check nginx configuration
sudo nginx -t
```

### Performance Issues

#### 1. High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Optimize PM2
pm2 start ecosystem.config.js --max-memory-restart 500M
```

#### 2. Slow Database Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Check slow queries
SELECT * FROM mysql.slow_log;
```

#### 3. High CPU Usage
```bash
# Check CPU usage
top
htop

# Optimize Node.js
pm2 start ecosystem.config.js --instances max
```

---

## 📈 Scaling and Performance

### Horizontal Scaling
```bash
# Load balancer with nginx
upstream app_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
```

### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_students_search ON students(name, email, major_focus);
CREATE INDEX idx_skills_search ON student_skills(skill_name, proficiency_level);

-- Optimize MySQL configuration
# /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
query_cache_size = 128M
max_connections = 200
```

### Caching Strategy
```bash
# Install Redis for session storage
sudo apt install redis-server

# Configure in .env
REDIS_URL=redis://localhost:6379
```

---

## 🎯 Post-Deployment Checklist

- [ ] Application starts successfully
- [ ] Database connection works
- [ ] All API endpoints respond correctly
- [ ] Frontend loads and functions properly
- [ ] SSL certificate is installed and valid
- [ ] Firewall is configured correctly
- [ ] Monitoring is set up
- [ ] Backup strategy is implemented
- [ ] Log rotation is configured
- [ ] Health checks are passing
- [ ] Performance metrics are within acceptable ranges

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check application logs and performance metrics
2. **Monthly**: Update system packages and dependencies
3. **Quarterly**: Review and update SSL certificates
4. **Annually**: Security audit and penetration testing

### Emergency Contacts
- Database issues: Check database/troubleshooting.md
- Application issues: Check logs/combined.log
- Security issues: Follow incident response plan

### Useful Commands
```bash
# Quick status check
./scripts/health-check.sh

# Update application
git pull origin main
npm install --production
cd frontend && npm run build
pm2 reload all

# Emergency restart
pm2 restart all
sudo systemctl restart nginx
```

---

This deployment guide provides comprehensive coverage for production deployment. Choose the method that best fits your infrastructure and requirements.