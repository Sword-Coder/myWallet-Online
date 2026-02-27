# How to Find Your Backup

Run this command on your droplet:

```bash
find / -name "*backup*" -o -name "*.json" 2>/dev/null | head -20
```

Or try these common backup locations:

```bash
ls /root/
```

```bash
ls /var/www/html/
```

```bash
ls /home/
```

---

Tell me what you see when you run these commands, and I'll help you restore the backup!
