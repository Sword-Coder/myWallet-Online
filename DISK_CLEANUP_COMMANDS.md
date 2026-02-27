# Step-by-Step Disk Cleanup for Your Droplet

SSH into your droplet, then run these commands ONE AT A TIME:

## Step 1: Clean up Docker (run this first)

```bash
docker system prune -a --volumes
```

Type `y` when asked to confirm.

## Step 2: Remove unused HTML debug files

```bash
rm -f /var/www/html/myWallet/*.html
```

## Step 3: Check disk space

```bash
df -h
```

## Step 4: Start CouchDB (if not running)

```bash
docker start couchdb
```

## Step 5: Test delete again in your app

---

If you still don't have space after Step 2, try these additional commands:

```bash
# Clean apt cache
apt-get clean

# Remove old logs
rm -rf /var/log/*.gz
rm -rf /var/log/apache2/*
```

```bash
# Check what's using space
du -sh /var/*
```
