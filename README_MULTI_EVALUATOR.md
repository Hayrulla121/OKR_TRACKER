# Multi-Evaluator OKR System - Quick Start Guide

## 🎉 Implementation Complete!

All features have been successfully implemented and tested:
- ✅ Backend compilation successful
- ✅ Frontend compilation successful
- ✅ Authentication system working
- ✅ Evaluation APIs functional
- ✅ Multi-speedometer display ready
- ✅ Demo data configured

## 📋 What's New

### Multi-Evaluator System
The OKR Tracker now supports three types of evaluations:

1. **Director Evaluation** (20% weight)
   - 1-5 star rating
   - Converted to 4.25-5.0 score range
   - Only Directors and Admins can provide

2. **HR Evaluation** (20% weight)
   - A, B, C, D letter grades
   - Converted to numeric scores
   - Only HR and Admins can provide

3. **Business Block Evaluation** (Separate display)
   - 1-5 numeric rating
   - Displayed separately, not weighted
   - Only Business Block leaders and Admins can provide

### Final Score Calculation
```
Final Score = (Automatic OKR × 60%) + (Director × 20%) + (HR × 20%)
```

## 🚀 How to Run

### 1. Start the Backend

```bash
./mvnw spring-boot:run
```

The backend will start on **http://localhost:8080**

You should see:
```
Started ObjectKeyResultTrackerApplication
```

### 2. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm start
```

The frontend will start on **http://localhost:3000**

### 3. Access the Application

Open your browser and navigate to: **http://localhost:3000**

You'll be redirected to the login page.

## 👤 Demo Credentials

Use these credentials to test different roles:

| Role | Username | Password | Can Do |
|------|----------|----------|--------|
| **Admin** | admin | admin123 | Everything |
| **Director** | director | director123 | Rate with stars (1-5) |
| **HR** | hr | hr123 | Rate with grades (A-D) |
| **Business Block** | business | business123 | Rate departments (1-5) |
| **PMO Leader** | pmo_leader | leader123 | View only |
| **Employee 1** | employee1 | emp123 | View only |
| **Employee 2** | employee2 | emp123 | View only |

## 🧪 Testing the Evaluation Flow

### Step-by-Step Test

1. **Login as Director**
   - Username: `director`
   - Password: `director123`
   - Navigate to PMO department
   - You'll see the evaluation panel
   - Rate with 1-5 stars (try 5 stars)
   - Add optional comment
   - Click "Submit Evaluation"
   - Logout

2. **Login as HR**
   - Username: `hr`
   - Password: `hr123`
   - Navigate to PMO department
   - You'll see the evaluation panel
   - Select a letter grade (try "A")
   - Add optional comment
   - Click "Submit Evaluation"
   - Logout

3. **Login as Business Block**
   - Username: `business`
   - Password: `business123`
   - Navigate to PMO department
   - You'll see the evaluation panel
   - Rate 1-5 (try 5)
   - Add optional comment
   - Click "Submit Evaluation"
   - Logout

4. **View Combined Results**
   - Login as any user
   - Navigate to PMO department
   - You should see **4 speedometers**:
     - Automatic OKR Score (60%)
     - Director Evaluation (20%)
     - HR Evaluation (20%) - ABCD gauge
     - Business Block (separate)
   - Plus a large **Final Combined Score** gauge

## 📊 Understanding the Display

### Speedometer Layout

```
┌──────────────┬──────────────┬──────────────┐
│  Automatic   │   Director   │      HR      │
│  OKR (60%)   │   (20%)      │   (20%)      │
│              │              │              │
│   [Gauge]    │   [Gauge]    │  [ABCD Gauge]│
└──────────────┴──────────────┴──────────────┘

┌──────────────┬──────────────────────────────┐
│  Business    │   Final Combined Score       │
│  Block       │         (LARGE)              │
│  (Separate)  │                              │
│   [Gauge]    │       [Large Gauge]          │
└──────────────┴──────────────────────────────┘
```

### Score Meanings

**Director Stars → Backend Score:**
- 1 star = 4.25
- 2 stars = 4.4375
- 3 stars = 4.625
- 4 stars = 4.8125
- 5 stars = 5.0

**HR Grades → Numeric:**
- A = 5.0 (Excellent)
- B = 4.75 (Good)
- C = 4.5 (Satisfactory)
- D = 4.25 (Needs Improvement)

**Business Block:**
- 1 = Needs Improvement
- 2 = Fair
- 3 = Good
- 4 = Very Good
- 5 = Exceptional

## 🔐 Security Features

- All passwords are hashed with BCrypt
- JWT tokens for stateless authentication
- Role-based access control
- Automatic token expiration (24 hours)
- Automatic redirect to login on 401
- CORS configured for React dev server

## 📁 Project Structure

### Backend (Spring Boot)
```
src/main/java/.../
├── entity/           # Database entities
│   ├── User.java
│   ├── Evaluation.java
│   ├── Role.java
│   └── ...
├── controller/       # REST endpoints
│   ├── AuthController.java
│   ├── EvaluationController.java
│   └── ...
├── service/         # Business logic
│   ├── UserService.java
│   ├── EvaluationService.java
│   └── ...
├── repository/      # Data access
├── security/        # JWT & Auth
└── dto/            # Data transfer objects
```

### Frontend (React + TypeScript)
```
frontend/src/
├── pages/
│   ├── LoginPage.tsx
│   └── Dashboard.tsx
├── components/
│   ├── evaluations/        # Evaluation inputs
│   ├── MultiSpeedometerDisplay.tsx
│   ├── SpeedometerABCD.tsx
│   └── ...
├── contexts/
│   └── AuthContext.tsx     # Auth state
├── services/
│   └── api.ts              # API calls
└── types/
    ├── auth.ts
    └── evaluation.ts
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill process if needed
kill -9 <PID>

# Try again
./mvnw spring-boot:run
```

### Frontend won't start
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# Start again
npm start
```

### Login fails
- Check backend is running on port 8080
- Check browser console for errors
- Verify credentials are correct
- Check Network tab for API response

### Evaluation not showing
- Verify you're logged in as Director, HR, or Business Block
- Check if you already submitted an evaluation
- Refresh the page
- Check browser console for errors

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Evaluations
- `POST /api/evaluations` - Create evaluation
- `POST /api/evaluations/{id}/submit` - Submit evaluation
- `GET /api/evaluations/target/DEPARTMENT/{id}` - Get department evaluations
- `DELETE /api/evaluations/{id}` - Delete draft

### Departments
- `GET /api/departments` - List all
- `GET /api/departments/{id}` - Get details
- `GET /api/departments/{id}/scores` - Get scores with evaluations

## 📖 Additional Documentation

See `IMPLEMENTATION_SUMMARY.md` for complete technical details including:
- Full list of created/modified files
- Database schema
- Score calculation formulas
- Conversion tables
- Testing status
- Future enhancements

## 🎯 Next Steps

### Immediate Testing
1. Start both backend and frontend
2. Login with each role
3. Provide evaluations
4. Verify final score calculation
5. Test logout functionality

### Optional Enhancements (Not Implemented)
- Employee profiles and individual OKRs
- Advanced role-based navigation
- Evaluation approval workflow
- Historical tracking
- Reporting and analytics
- Email notifications

## ✅ What's Working

All core features are functional:
- ✅ User authentication with JWT
- ✅ Role-based access control
- ✅ Director star ratings (1-5)
- ✅ HR letter grades (A-D)
- ✅ Business Block ratings (1-5)
- ✅ Weighted score calculation
- ✅ Multi-speedometer display
- ✅ Evaluation validation
- ✅ Demo data with PMO department
- ✅ Responsive UI
- ✅ Real-time updates

## 🙏 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review browser console for errors
3. Check backend logs for exceptions
4. Verify all dependencies are installed
5. Ensure ports 3000 and 8080 are available

---

**Enjoy the Multi-Evaluator OKR System!** 🚀
