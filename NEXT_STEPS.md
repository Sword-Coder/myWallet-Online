# Next Steps - Run These Commands

## Step 1: Check if CouchDB is running

```bash
docker ps
```

## Step 2: If not running, start it

```bash
docker start couchdb
```

## Step 3: Wait 10 seconds for CouchDB to start, then create the database

```bash
curl -X PUT http://root:Sharpest2Mind@localhost:5984/mywallet_db
```

## Step 4: Check disk space first (to make sure you have room)

```bash
df -h
```

## Step 5: Test deleting in your app now

---

If you get "no space left" error again, run this to clean Docker:

```bash
docker system prune -a --volumes
```
