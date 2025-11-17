# CouchDB HTTPS Setup Guide

Since you control your CouchDB server at `147.182.253.3`, here's how to set up HTTPS to fix the mixed content error.

## Prerequisites

- Root access to the server `147.182.253.3`
- Domain name (optional but recommended for Let's Encrypt)
- Firewall access to port 443 (HTTPS)

## Option 1: Let's Encrypt SSL Certificate (Recommended - Free)

### Step 1: Install Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot
```

### Step 2: Get SSL Certificate

```bash
# If you have a domain pointing to 147.182.253.3
sudo certbot certonly --standalone -d yourdomain.com

# If using IP address (less secure, not recommended for production)
sudo certbot certonly --standalone --register-unsafely-without-domain -d 147.182.253.3
```

### Step 3: Configure CouchDB for HTTPS

Edit CouchDB configuration file (`/opt/couchdb/etc/local.ini` or `/etc/couchdb/local.ini`):

```ini
[ssl]
enable = true
port = 5984
cert_file = /etc/letsencrypt/live/yourdomain.com/fullchain.pem
key_file = /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

Restart CouchDB:

```bash
sudo systemctl restart couchdb
```

### Step 4: Update Your App

Update `src/composables/useDatabase.js`:

```javascript
const remoteDB = new PouchDB('https://147.182.253.3:5984/mywallet_db', {
  auth: { username: 'root', password: 'Sharpest2Mind' },
})
```

## Option 2: Self-Signed Certificate (Development/Testing)

### Step 1: Generate Self-Signed Certificate

```bash
sudo mkdir -p /opt/couchdb/ssl
cd /opt/couchdb/ssl

# Generate private key
sudo openssl genrsa -out couchdb.key 2048

# Generate certificate signing request
sudo openssl req -new -key couchdb.key -out couchdb.csr

# Generate self-signed certificate (valid for 1 year)
sudo openssl x509 -req -days 365 -in couchdb.csr -signkey couchdb.key -out couchdb.crt
```

### Step 2: Configure CouchDB

Edit `/opt/couchdb/etc/local.ini`:

```ini
[ssl]
enable = true
port = 5984
cert_file = /opt/couchdb/ssl/couchdb.crt
key_file = /opt/couchdb/ssl/couchdb.key

# Add bind_address if needed
[chttpd]
bind_address = 0.0.0.0
```

Restart CouchDB:

```bash
sudo systemctl restart couchdb
```

### Step 3: Update Your App

Same as Option 1, Step 4.

## Option 3: Reverse Proxy with Nginx (Recommended for Production)

### Step 1: Install Nginx

```bash
sudo apt install nginx
```

### Step 2: Configure Nginx

Create `/etc/nginx/sites-available/couchdb`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # Your domain name

    location / {
        proxy_pass http://127.0.0.1:5984;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

sample
server {
    server_name mywallet.themission.site;

    root /var/www/html/myWallet/spa;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optional: Proxy API calls if needed
    location /api/ {
        proxy_pass http://127.0.0.1:3000;  # Adjust if your API is on a different port
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
}

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/mywallet.themission.site/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/mywallet.themission.site/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = mywallet.themission.site) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name mywallet.themission.site;
    return 404; # managed by Certbot


}


```

### Step 3: Enable SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Step 4: Update Your App

```javascript
// Use your domain instead of IP
const remoteDB = new PouchDB('https://server.themission.site/mywallet_db', {
  auth: { username: 'root', password: 'Sharpest2Mind' },
})
```

## Testing HTTPS Connection

Test your HTTPS connection:

```bash
curl -k https://147.182.253.3:5984/
```

Or visit `https://147.182.253.3:5984/` in your browser.

## Firewall Configuration

Ensure your firewall allows HTTPS traffic:

```bash
# UFW (Ubuntu)
sudo ufw allow 443/tcp

# iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## Environment Variables Setup

After setting up HTTPS, update your `.env` file:

```bash
VITE_COUCHDB_URL=https://147.182.253.3:5984
VITE_COUCHDB_DB_NAME=mywallet_db
VITE_COUCHDB_USERNAME=root
VITE_COUCHDB_PASSWORD=Sharpest2Mind
```

Update `src/composables/useDatabase.js` to use environment variables:

```javascript
const couchDBUrl = import.meta.env.VITE_COUCHDB_URL || 'https://147.182.253.3:5984'
const dbName = import.meta.env.VITE_COUCHDB_DB_NAME || 'mywallet_db'
const dbUsername = import.meta.env.VITE_COUCHDB_USERNAME || 'root'
const dbPassword = import.meta.env.VITE_COUCHDB_PASSWORD || 'Sharpest2Mind'

const remoteDB = new PouchDB(`${couchDBUrl}/${dbName}`, {
  auth: { username: dbUsername, password: dbPassword },
})
```

## SSL Certificate Renewal

For Let's Encrypt certificates:

```bash
sudo certbot renew
```

Set up automatic renewal:

```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

This setup will eliminate the mixed content error and secure your database communication.
