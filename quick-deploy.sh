#!/bin/bash

# SUPER SIMPLE AUTOPARTS DEPLOYMENT
# Just run: bash quick-deploy.sh

echo "🎯 Quick Autoparts Deployment Starting..."

# Set your details here
read -p "Enter your domain (e.g., mysite.com): " DOMAIN
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter your repository name: " REPO_NAME

# One-command setup
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && \
sudo apt-get install -y nodejs nginx git certbot python3-certbot-nginx && \
sudo mkdir -p /var/www/autoparts && \
sudo chown $USER:$USER /var/www/autoparts && \
cd /var/www/autoparts && \
git clone https://github.com/${GITHUB_USER}/${REPO_NAME}.git . && \
npm install && \
npm run build

# Configure Nginx
sudo tee /etc/nginx/sites-available/autoparts > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    root /var/www/autoparts/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /assets {
        expires 1y;
        add_header Cache-Control "public";
    }
    
    gzip on;
    gzip_types text/css application/javascript;
}
EOF

sudo ln -sf /etc/nginx/sites-available/autoparts /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Get SSL
sudo certbot --nginx -d ${DOMAIN} --email admin@${DOMAIN} --agree-tos --non-interactive

echo "✅ DONE! Your autoparts site is live at https://${DOMAIN}"
echo "💡 To update later: cd /var/www/autoparts && git pull && npm run build && sudo systemctl reload nginx"