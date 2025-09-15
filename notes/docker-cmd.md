| Service           | Container Name         | Port  | Status     |
| ----------------- | ---------------------- | ----- | ---------- |
| **MySQL**         | minimeet-mysql         | 3306  | ✅ Running |
| **MongoDB**       | minimeet-mongo         | 27017 | ✅ Running |
| **Redis**         | minimeet-redis         | 6379  | ✅ Running |
| **ElasticSearch** | minimeet-elasticsearch | 9200  | ✅ Running |

### **Quick Verification Tests**

**Test services are responding**:

```bash
# Test MySQL connection
docker logs minimeet-mysql
# Should show "MySQL init process done. Ready for start up."

# Test ElasticSearch
curl http://localhost:9200
# Should return cluster information JSON

# Test Redis
docker logs minimeet-redis
# Should show "Ready to accept connections"
```

### Connect NestJS to MySQL

1. **Configure TypeORM** in NestJS app to connect to the MySQL container
2. **Create User entity**
3. **Test database connection** with CRUD operations
4. **Move to real-time features** (Socket.io, WebRTC)

## **Useful Commands for Development**

**Check container logs if needed**:

```bash
docker logs minimeet-mysql      # Database startup logs
docker logs minimeet-elasticsearch  # Search engine logs
```

**Stop when done developing**:

```bash
docker-compose down
```

**Restart next session**:

```bash
docker-compose up -d
```

## Test MySQL

```bash
docker exec -it minimeet-mysql mysql -u root -ppassword -e "SHOW DATABASES;"
```

```
# expected output

+--------------------+
| Database           |
+--------------------+
| information_schema |
| minimeet           |   ← database exists!
| mysql              |
| performance_schema |
| sys                |
+--------------------+
```
