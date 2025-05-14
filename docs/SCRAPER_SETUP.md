# VPS Scraper Setup Guide

This guide explains how to set up and configure the VPS scraper to work with the News Dashboard.

## Overview

The scraper needs to be deployed on your VPS and should provide an API endpoint that returns the trending news data in the required format.

## 1. Required API Endpoint

Your VPS scraper should expose the following endpoint:

```
https://your-vps-domain.com/api/trends
```

## 2. Expected Response Format

The API should return JSON in the following format:

```json
{
  "wordCloudData": [
    {
      "text": "keyword1",
      "value": 45,
      "color": "#3B82F6"
    },
    {
      "text": "keyword2",
      "value": 38,
      "color": "#0EA5E9"
    },
    ...
  ],
  "topKeywords": [
    {
      "keyword": "keyword1",
      "count": 45
    },
    {
      "keyword": "keyword2",
      "count": 38
    },
    ...
  ],
  "categoryData": [
    {
      "category": "Technology",
      "count": 25
    },
    {
      "category": "Politics",
      "count": 18
    },
    ...
  ],
  "timestamp": "2023-05-15T14:30:00Z"
}
```

Notes:
- `wordCloudData`: Each item must have `text`, `value`, and `color` properties
- `topKeywords`: Each item must have `keyword` and `count` properties
- `categoryData`: Each item must have `category` and `count` properties
- `timestamp`: ISO 8601 datetime string when the data was collected

## 3. CORS Configuration

Make sure your VPS API allows cross-origin requests from your Netlify domains:

```
# Example CORS configuration for Express.js
app.use(cors({
  origin: [
    'https://your-netlify-site.netlify.app',
    'http://localhost:5173'  // For local development
  ]
}));
```

## 4. Deployment on VPS

1. SSH into your VPS:
   ```
   ssh username@your-vps-ip
   ```

2. Clone your scraper repository:
   ```
   git clone https://github.com/yourusername/your-scraper-repo.git
   ```

3. Install dependencies:
   ```
   cd your-scraper-repo
   npm install
   ```

4. Set up a process manager like PM2:
   ```
   npm install -g pm2
   pm2 start app.js --name "news-scraper"
   pm2 save
   pm2 startup
   ```

5. Configure Nginx as a reverse proxy:
   ```
   server {
     listen 80;
     server_name your-vps-domain.com;
     
     location /api/ {
       proxy_pass http://localhost:3000/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

6. Set up SSL with Let's Encrypt:
   ```
   sudo certbot --nginx -d your-vps-domain.com
   ```

## 5. Testing Your Scraper

Test your API endpoint with curl:

```
curl https://your-vps-domain.com/api/trends
```

## 6. Connecting to the Dashboard

1. Update your `.env.local` file with the VPS API URL:
   ```
   VITE_VPS_API_URL=https://your-vps-domain.com/api
   ```

2. For production, add the environment variable in the Netlify dashboard:
   - Site settings > Environment variables
   - Add `VITE_VPS_API_URL` with your VPS API URL

## 7. Scheduling Scraper Runs

You may want to set up cron jobs to run your scraper at regular intervals:

```
# Run the scraper every hour
0 * * * * cd /path/to/your/scraper && node scrape.js
```

This will keep your database updated with fresh data even if no one is actively using the dashboard. 