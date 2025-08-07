#!/bin/bash

# Autoparts Project Deployment Script for Hetzner
# Run this script on your Hetzner server

set -e

PROJECT_NAME="autoparts"
DOMAIN="your-domain.com"  # Change this to your domain
NODE_VERSION="18"

echo "🚀 Starting deployment of Autoparts project..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install required packages
sudo apt install -y nginx certbot python3-certbot-nginx git

# Create project directory
sudo mkdir -p /var/www/${PROJECT_NAME}
sudo chown $USER:$USER /var/www/${PROJECT_NAME}

# Clone your project (you'll need to replace with your actual repo)
cd /var/www/${PROJECT_NAME}
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Install dependencies
npm install

# Build the project
npm run build

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/${PROJECT_NAME} > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    root /var/www/${PROJECT_NAME}/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_comp_level 9;
    
    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/${PROJECT_NAME} /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate
sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}

# Create deployment script for updates
cat > /var/www/${PROJECT_NAME}/update.sh << 'EOF'
#!/bin/bash
cd /var/www/autoparts
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
echo "✅ Deployment updated!"
EOF

chmod +x /var/www/${PROJECT_NAME}/update.sh

echo "✅ Deployment complete!"
echo "📝 Next steps:"
echo "1. Update DOMAIN variable in this script"
echo "2. Replace git clone URL with your actual repository"
echo "3. Configure your Supabase environment"
echo "4. Run: ./update.sh to update the site"