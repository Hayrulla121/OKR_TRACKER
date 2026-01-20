# Login Issue - Debugging Guide

## ❌ **Current Issue: Login Failed**

### Root Cause
**The backend server is NOT running on port 8080**

---

## ✅ **Solution: Start the Backend**

### Step 1: Start Backend Server

Open a terminal and run:
```bash
cd /Users/spencer/.claude-worktrees/ObjectKeyResultTracker/goofy-hopper
./mvnw spring-boot:run
```

**Wait for this message:**
```
Started ObjectKeyResultTrackerApplication in X.XXX seconds (process running on PID)
```

### Step 2: Verify Backend is Running

Open a new terminal and test:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "user": {
    "id": "...",
    "username": "admin",
    "role": "ADMIN",
    ...
  }
}
```

### Step 3: Start Frontend (if not running)

Open another terminal:
```bash
cd /Users/spencer/.claude-worktrees/ObjectKeyResultTracker/goofy-hopper/frontend
npm start
```

### Step 4: Test Login

1. Open browser to `http://localhost:3000`
2. You'll be redirected to `/login`
3. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
4. Click "Login"

---

## 🔍 **Troubleshooting Checklist**

### Problem 1: Backend won't start

**Error: "Port 8080 already in use"**
```bash
# Find what's using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Try starting again
./mvnw spring-boot:run
```

**Error: "Could not find or load main class"**
```bash
# Clean and rebuild
./mvnw clean install -DskipTests
./mvnw spring-boot:run
```

---

### Problem 2: Login fails with specific error

**Frontend shows: "Network Error" or "ERR_CONNECTION_REFUSED"**
- ❌ Backend is not running
- ✅ Start backend with `./mvnw spring-boot:run`

**Frontend shows: "401 Unauthorized" or "403 Forbidden"**
- ❌ Wrong username/password
- ✅ Use correct credentials (see below)

**Frontend shows: "CORS error"**
- ❌ Backend CORS not configured correctly
- ✅ Already configured in SecurityConfig.java for localhost:3000 and localhost:5173

**Frontend shows: "Timeout" or takes forever**
- ❌ Backend is slow to start or database issue
- ✅ Check backend console for errors

---

### Problem 3: Database issues

**Error: "User not found" even with correct password**
- The database might be empty or demo data didn't load
- Solution: Load demo data

**To load demo data manually:**

1. Start backend
2. Run this curl command:
```bash
curl -X POST http://localhost:8080/api/demo/load
```

Or login to H2 console:
- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/okrdb`
- Username: `sa`
- Password: (leave empty)

Check if users exist:
```sql
SELECT * FROM USERS;
```

---

## 📝 **Demo Credentials**

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| director | director123 | DIRECTOR |
| hr | hr123 | HR |
| business | business123 | BUSINESS_BLOCK |
| pmo_leader | leader123 | DEPARTMENT_LEADER |
| employee1 | emp123 | EMPLOYEE |
| employee2 | emp123 | EMPLOYEE |

---

## 🔬 **Detailed Debugging Steps**

### Check 1: Verify Backend Logs

When you start the backend, look for these messages:

✅ **Good signs:**
```
Loading demo data...
Created demo users:
  - admin (ADMIN)
  - director (DIRECTOR)
  ...
Started ObjectKeyResultTrackerApplication
```

❌ **Bad signs:**
```
Error creating bean...
Failed to configure a DataSource...
Address already in use...
```

### Check 2: Verify Frontend API Configuration

The frontend is configured to connect to:
```
http://localhost:8080/api
```

You can verify this in:
```
frontend/src/services/api.ts
Line 5: const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
```

### Check 3: Browser DevTools

Open browser DevTools (F12), go to:

**Console Tab:**
- Look for errors like "Failed to fetch" or "Network error"

**Network Tab:**
- Filter by "login"
- Click on the login request
- Check:
  - Request URL: Should be `http://localhost:8080/api/auth/login`
  - Request Method: Should be `POST`
  - Status Code: Should be `200` (success) or `401` (wrong credentials)
  - Response: Check the error message

**Application Tab:**
- Look at Local Storage
- Check if `token` and `user` are stored after successful login

---

## 🧪 **Manual Testing Steps**

### Test 1: Backend API Directly

```bash
# Test login endpoint
curl -v -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected: 200 OK with JWT token
```

### Test 2: Frontend to Backend

1. Open browser to `http://localhost:3000/login`
2. Open DevTools (F12) → Network tab
3. Enter username: `admin`, password: `admin123`
4. Click Login
5. Check Network tab for the request details

---

## 🚨 **Common Mistakes**

1. ❌ **Forgot to start backend**
   - Login fails with "Network Error"
   - Solution: `./mvnw spring-boot:run`

2. ❌ **Wrong credentials**
   - Password is case-sensitive
   - Username is case-sensitive
   - Solution: Use exact credentials from table above

3. ❌ **Backend started in wrong directory**
   - Backend must be started from project root
   - Solution: `cd /Users/spencer/.claude-worktrees/ObjectKeyResultTracker/goofy-hopper`

4. ❌ **Database file doesn't exist**
   - Demo data didn't load
   - Solution: Delete `data/` folder and restart backend

5. ❌ **Port conflict**
   - Another app using port 8080
   - Solution: Kill that process or change port

---

## 📞 **Quick Diagnosis Commands**

```bash
# Is backend running?
curl -s http://localhost:8080/actuator/health || echo "NOT RUNNING"

# Is frontend running?
curl -s http://localhost:3000 | head -1 || echo "NOT RUNNING"

# What's on port 8080?
lsof -i :8080

# What's on port 3000?
lsof -i :3000

# Test login API
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq .
```

---

## ✅ **Success Indicators**

When everything works, you should see:

1. **Backend console:**
```
Started ObjectKeyResultTrackerApplication in 3.456 seconds
```

2. **Login test:**
```bash
$ curl -X POST http://localhost:8080/api/auth/login ...
{
  "token": "eyJhbGci...",
  "type": "Bearer",
  "user": { ... }
}
```

3. **Browser:**
- Login page loads
- Enter credentials
- Redirected to dashboard
- Departments visible

---

## 🎯 **Next Steps After Login Works**

1. Test different user roles
2. Navigate to departments
3. Provide evaluations
4. View multi-speedometer display

---

**Still having issues? Check:**
- Backend console for error messages
- Browser console for JavaScript errors
- Network tab for failed requests
- Database in H2 console for missing data
