# How to Prevent CouchDB Loss & Disk Space Issues

## 1. Regular Backups (IMPORTANT!)

### Create automatic backups:

```bash
# Create a backup script
nano /root/backup_couchdb.sh
```

Add this content:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
curl -X GET http://root:Sharpest2Mind@localhost:5984/mywallet_db/_all_docs > /root/couchdb_backup_$DATE.json
echo "Backup saved: /root/couchdb_backup_$DATE.json"
```

Make it executable:

```bash
chmod +x /root/backup_couchdb.sh
```

Run it manually:

```bash
/root/backup_couchdb.sh
```

### Schedule automatic backups (daily):

```bash
crontab -e
```

Add this line:

```
0 2 * * * /root/backup_couchdb.sh
```

---

## 2. Monitor Disk Space

Add this to your monitoring:

```bash
# Check disk space
df -h

# Check Docker space
docker system df
```

Set up alerts or check weekly!

---

## 3. Clean Docker Regularly

Run this weekly or when space is low:

```bash
docker system prune -a --volumes
```

---

## 4. Don't Delete Debug Files Without Checking

Before deleting any files, check what's using space:

```bash
du -sh /var/*
```

---

## 5. Keep Snapshots Enabled

- In DigitalOcean, enable **automatic backups**
- Or create manual snapshots monthly

---

## Summary:

1. ✅ Run weekly Docker cleanup
2. ✅ Monitor disk space (df -h)
3. ✅ Create regular CouchDB backups
4. ✅ Keep DigitalOcean snapshots enabled
5. ✅ Don't run `docker system prune` without knowing what it does
