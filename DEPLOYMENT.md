# Deployment Guide

## Prerequisites

- Node.js v16+
- MySQL 5.7+
- npm or yarn

## Local Development

### 1. Install Dependencies

```bash
# From project root
npm install
```

### 2. Database Setup

Create MySQL database and user:

```sql
CREATE DATABASE ecommerce_db;
CREATE USER 'ecommerce'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ecommerce_db.* TO 'ecommerce'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure Environment

**Backend** (`server/.env`):
```
PORT=5000
DB_HOST=localhost
DB_USER=ecommerce
DB_PASSWORD=your_password
DB_NAME=ecommerce_db
JWT_SECRET=your_super_secret_key_here
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`client/.env`):
```
VITE_API_URL=http://localhost:5000/api
```

### 4. Start Development

```bash
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Production Deployment

### Backend Deployment

#### Option 1: Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Set environment variables:
   ```bash
   heroku config:set DB_HOST=your_db_host
   heroku config:set DB_USER=your_db_user
   heroku config:set DB_PASSWORD=your_db_password
   heroku config:set DB_NAME=your_db_name
   heroku config:set JWT_SECRET=your_production_secret
   heroku config:set NODE_ENV=production
   ```
5. Deploy: `git push heroku main`

#### Option 2: AWS EC2

1. Launch EC2 instance (Ubuntu 20.04)
2. SSH into instance
3. Install Node.js and MySQL client
4. Clone repository
5. Configure environment variables
6. Install PM2: `npm install -g pm2`
7. Start app: `pm2 start server.js --name ecommerce-api`
8. Setup Nginx as reverse proxy
9. Configure SSL with Let's Encrypt

#### Option 3: DigitalOcean App Platform

1. Connect GitHub repository
2. Configure build command: `npm install && npm run build`
3. Configure start command: `npm start -w server`
4. Set environment variables
5. Deploy

### Frontend Deployment

#### Option 1: Vercel

```bash
npm install -g vercel
vercel
```

- Select React as framework
- Set `VITE_API_URL` in environment variables
- Deploy

#### Option 2: Netlify

1. Build project: `npm run build -w client`
2. Connect GitHub repository to Netlify
3. Set build command: `npm run build -w client`
4. Set publish directory: `client/dist`
5. Add environment variable: `VITE_API_URL`

#### Option 3: AWS S3 + CloudFront

1. Build: `npm run build -w client`
2. Upload `dist` folder to S3 bucket
3. Create CloudFront distribution
4. Point domain to CloudFront

### Database Deployment

#### AWS RDS

1. Create RDS MySQL instance
2. Update `DB_HOST` to RDS endpoint
3. Create database and run schema
4. Update security groups to allow backend access

#### MySQL Managed Hosting

1. Create hosted MySQL instance
2. Download and run schema script
3. Configure DB credentials
4. Test connection

## Post-Deployment Checklist

- [ ] Database tables created successfully
- [ ] Admin account created (admin@store.com)
- [ ] Environment variables set correctly
- [ ] Frontend can reach backend API
- [ ] Login functionality works
- [ ] Admin pages accessible
- [ ] File uploads working
- [ ] SSL/HTTPS enabled
- [ ] CORS properly configured
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] Monitoring/alerts set up

## Scaling Considerations

### Database
- Add read replicas for high traffic
- Implement caching (Redis)
- Optimize queries with proper indexing
- Monitor slow queries

### Application
- Use load balancer (nginx, AWS ELB)
- Run multiple backend instances
- Implement session management
- Use CDN for static assets

### Files
- Move uploads to AWS S3/Azure Blob Storage
- Implement image resizing
- Use CloudFront for image delivery

## Monitoring & Maintenance

### Logs
- Use CloudWatch (AWS) or similar
- Monitor error rates
- Track API response times

### Backups
- Daily database backups
- Store backups in separate region
- Test restore procedures

### Updates
- Monitor security updates
- Update dependencies regularly
- Test updates in staging first

## Troubleshooting Deployment

### Database Connection Issues
```bash
# Test connection
mysql -h your_host -u user -p database_name
```

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

### Uploads Directory Not Found
```bash
# Create uploads directory
mkdir -p server/uploads
chmod 755 server/uploads
```

### Memory Issues
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

## Performance Optimization

1. Enable gzip compression
2. Implement database connection pooling
3. Use CDN for static assets
4. Implement caching headers
5. Optimize images before upload
6. Minify frontend assets
7. Use production-grade databases
8. Implement rate limiting

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Validate all inputs
- [ ] Sanitize database queries
- [ ] Implement rate limiting
- [ ] Use secure headers (helmet.js)
- [ ] Keep dependencies updated
- [ ] Regular security audits

For detailed information, see individual README files in `client/` and `server/` directories.
