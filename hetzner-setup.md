# Autoparts Project - Hetzner Deployment Guide

## 1. Create Hetzner Server
```bash
# Login to Hetzner Cloud Console
# Create new server:
# - Location: Choose closest to your users
# - Image: Ubuntu 22.04
# - Type: CX11 (cheapest option) or higher
# - Add your SSH key
```

## 2. Connect to Server
```bash
ssh root@YOUR_SERVER_IP
```

## 3. Download and Run Deployment Script
```bash
# Download the deployment script
wget https://your-lovable-app.lovable.app/deploy.sh
chmod +x deploy.sh

# Edit the script to set your domain
nano deploy.sh
# Change DOMAIN="your-domain.com" to your actual domain
# Change git clone URL to your GitHub repository

# Run deployment
./deploy.sh
```

## 4. Configure Domain (Do this while script runs)
In your domain registrar (GoDaddy, Namecheap, etc.):
```
A Record: @ → YOUR_SERVER_IP
A Record: www → YOUR_SERVER_IP
```

## 5. Update Supabase Configuration
After deployment, your site will use the Supabase project already configured:
- Project ID: diwryjzthqseboohfbmh
- All secrets are already set up
- No additional Supabase configuration needed

## 6. Test Your Site
Visit: https://your-domain.com

## 7. Update Site Later
```bash
ssh root@YOUR_SERVER_IP
cd /var/www/autoparts
./update.sh
```

## Troubleshooting

### If deployment fails:
```bash
# Check Nginx status
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart nginx
```

### If domain doesn't work:
```bash
# Check DNS propagation
nslookup your-domain.com
```

## Server Costs
- CX11: €3.29/month (1 vCPU, 2GB RAM)
- CX21: €5.83/month (2 vCPU, 4GB RAM)

That's it! Your autoparts project will be live with all functionality intact.