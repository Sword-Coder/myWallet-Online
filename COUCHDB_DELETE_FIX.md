# CouchDB internal_server_error Fix Guide

The `internal_server_error` is a server-side issue. Here's how to fix it on your Docker droplet:

## Step 1: Check CouchDB Logs

Run this on your droplet to see what's causing the error:

```bash
docker logs couchdb
```

Or if your container has a different name:

```bash
docker ps  # to find the container name
docker logs <container_name>
```

## Step 2: Common Fixes

### A. Restart CouchDB Container

```bash
docker restart couchdb
```

### B. Fix Permissions

```bash
docker exec -it couchdb chown -R couchdb:couchdb /opt/couchdb/data
```

### C. Check Disk Space

```bash
docker exec -it couchdb df -h
```

If disk is full, clean up:

```bash
docker system prune -a
```

### D. Repair the Database via curl:

```bash
curl -X POST http://root:Sharpest2Mind@localhost:5984/mywallet_db/_repair -H "Content-Type: application/json"
```

## Step 3: If Above Doesn't Work - Recreate Database

Backup first:

```bash
curl -X GET http://root:Sharpest2Mind@localhost:5984/mywallet_db/_all_docs > /root/backup.json
```

Delete the database:

```bash
curl -X DELETE http://root:Sharpest2Mind@localhost:5984/mywallet_db
```

Recreate it:

```bash
curl -X PUT http://root:Sharpest2Mind@localhost:5984/mywallet_db
```

---

Run the Docker log command first and share what error you see - that will help identify the exact cause!
