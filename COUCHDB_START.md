# How to Start CouchDB

Run these commands on your droplet:

## Step 1: Check if CouchDB is running

```bash
docker ps
```

If you see "couchdb" in the list, it's running!

## Step 2: If NOT running, start it

```bash
docker start couchdb
```

Wait 10 seconds.

## Step 3: Check if it's working

```bash
curl http://root:Sharpest2Mind@localhost:5984/
```

You should see JSON response like:

```json
{ "couchdb": "Welcome", "version": "3.3.2", "git_sha": "5c21b41b4" }
```

## Step 4: Check if your database exists

```bash
curl http://root:Sharpest2Mind@localhost:5984/mywallet_db
```

If it exists, you'll see:

```json
{"db_name":"mywallet_db","doc_count":10,...}
```

## Step 5: If database doesn't exist, create it

```bash
curl -X PUT http://root:Sharpest2Mind@localhost:5984/mywallet_db
```
