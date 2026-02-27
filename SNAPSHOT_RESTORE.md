# How to Restore Your Snapshot

**Yes, restoring the snapshot WILL restore your CouchDB data!**

## Steps to Restore:

1. **Go to DigitalOcean Dashboard**
   - Log into your DigitalOcean account

2. **Find Snapshots**
   - Click on "Backups & Snapshots" in the left menu
   - Or go to your Droplet → "Snapshots" tab

3. **Restore the Snapshot**
   - Find "My-Database 2026-02-15"
   - Click on it
   - Click "Restore Droplet"

4. **What happens:**
   - A new droplet will be created from the snapshot
   - OR you can restore to your existing droplet (will replace current state)
   - All your CouchDB data will be back!

5. **After restore:**
   - Your database will work again
   - Delete operations should work fine

---

**Important:** The snapshot from Feb 15 is before the disk space issue, so your database should be working properly!
