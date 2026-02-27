# Clean Up Disk Space NOW

Run these commands ONE AT A TIME on your droplet:

## Step 1: Clean Docker (biggest space saver)

```bash
docker system prune -a --volumes
```

Type `y` when asked.

## Step 2: Remove debug HTML files in /var/www/html

```bash
ls /var/www/html/
```

If you see .html files (like test*\*.html, debug*\*.html), delete them:

```bash
rm -f /var/www/html/*.html
```

## Step 3: Check what's using space

```bash
du -sh /var/*
```

## Step 4: Check disk space again

```bash
df -h
```

## Step 5: If still full, try these:

### Clean apt cache

```bash
apt-get clean
apt-get autoremove -y
```

### Remove old logs

```bash
rm -rf /var/log/*.gz
rm -rf /var/log/apache2/*
```

### Remove Node modules if not needed

```bash
rm -rf /var/www/html/myWallet/node_modules
```

---

After cleanup, check `df -h` again. Try to keep usage below 70%!
