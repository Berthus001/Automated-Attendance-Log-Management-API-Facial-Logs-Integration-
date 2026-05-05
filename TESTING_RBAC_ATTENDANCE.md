# 🧪 Quick Test Guide - Role-Based Attendance System

## ✅ Prerequisites

1. **Backend running**: `cd backend && npm start`
2. **Have test accounts**:
   - SuperAdmin account
   - Admin account
   - Student account
   - Teacher account

---

## 🚀 Quick Test Checklist

### ✅ Test 1: Student Logs Their Own Attendance

```bash
# 1. Login as student
POST http://localhost:5000/api/auth/login
{
  "email": "student@example.com",
  "password": "password123"
}

# Save the token from response

# 2. Log attendance
POST http://localhost:5000/api/logs/log-attendance
Authorization: Bearer <student-token>
{
  "course": "CS101",
  "status": "present"
}

# ✅ Expected: Success, attendance logged
```

---

### ✅ Test 2: Student Views Own History

```bash
GET http://localhost:5000/api/logs/my-attendance
Authorization: Bearer <student-token>

# ✅ Expected: Returns only this student's attendance
```

---

### ✅ Test 3: Student CANNOT View All Logs

```bash
GET http://localhost:5000/api/logs
Authorization: Bearer <student-token>

# ❌ Expected: 403 Forbidden
# Message: "Access denied. Required role(s): superadmin, admin"
```

---

### ✅ Test 4: Admin Views Only Their Users' Attendance

```bash
# 1. Login as admin
POST http://localhost:5000/api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}

# 2. View attendance logs
GET http://localhost:5000/api/logs
Authorization: Bearer <admin-token>

# ✅ Expected: Returns ONLY attendance for students/teachers created by this admin
# ✅ Check: Each log's createdBy field should match this admin's ID
```

---

### ✅ Test 5: Admin Views Statistics

```bash
GET http://localhost:5000/api/logs/summary
Authorization: Bearer <admin-token>

# ✅ Expected: Statistics for only their users
# ✅ Check: totalLogs, uniqueUsers should reflect only their created users
```

---

### ✅ Test 6: SuperAdmin Views ALL Attendance

```bash
# 1. Login as superadmin
POST http://localhost:5000/api/auth/login
{
  "email": "superadmin@example.com",
  "password": "password123"
}

# 2. View all logs
GET http://localhost:5000/api/logs
Authorization: Bearer <superadmin-token>

# ✅ Expected: Returns ALL attendance logs from ALL users
# ✅ Check: Should see logs from multiple admins' users
```

---

### ✅ Test 7: Teacher Logs Attendance

```bash
# 1. Login as teacher
POST http://localhost:5000/api/auth/login
{
  "email": "teacher@example.com",
  "password": "password123"
}

# 2. Log attendance
POST http://localhost:5000/api/logs/log-attendance
Authorization: Bearer <teacher-token>
{
  "course": "MATH201",
  "status": "present"
}

# ✅ Expected: Success, attendance logged with userRole: "teacher"
```

---

### ✅ Test 8: Teacher Views Own History

```bash
GET http://localhost:5000/api/logs/my-attendance
Authorization: Bearer <teacher-token>

# ✅ Expected: Returns only this teacher's attendance
```

---

### ✅ Test 9: Teacher CANNOT View Other Logs

```bash
GET http://localhost:5000/api/logs
Authorization: Bearer <teacher-token>

# ❌ Expected: 403 Forbidden
```

---

### ✅ Test 10: Prevent Duplicate Attendance (Within 1 Minute)

```bash
# 1. Log attendance
POST http://localhost:5000/api/logs/log-attendance
Authorization: Bearer <student-token>
{
  "course": "CS101",
  "status": "present"
}

# 2. Immediately try to log again
POST http://localhost:5000/api/logs/log-attendance
Authorization: Bearer <student-token>
{
  "course": "CS101",
  "status": "present"
}

# ❌ Expected: 409 Conflict
# Message: "Attendance already logged within the last minute"
```

---

### ✅ Test 11: Filter by User Role (Admin)

```bash
GET http://localhost:5000/api/logs?userRole=student
Authorization: Bearer <admin-token>

# ✅ Expected: Returns only student attendance (for users they created)
```

---

### ✅ Test 12: Date Range Filtering

```bash
GET http://localhost:5000/api/logs/my-attendance?startDate=2026-05-01&endDate=2026-05-04
Authorization: Bearer <student-token>

# ✅ Expected: Returns only attendance within date range
```

---

## 🔍 Verification Checklist

After all tests, verify:

- [ ] Students can log attendance and view only their history
- [ ] Teachers can log attendance and view only their history
- [ ] Students/Teachers get 403 when trying to access admin endpoints
- [ ] Admins see ONLY their users' attendance (not other admins' users)
- [ ] SuperAdmin sees ALL attendance logs
- [ ] Duplicate logging is prevented (1-minute cooldown)
- [ ] All endpoints require authentication (no public access)
- [ ] Role-based filtering works correctly
- [ ] Pagination works correctly
- [ ] Date filtering works correctly

---

## 🛠️ Using Postman

1. **Import Collection**: Create a new Postman collection
2. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:5000`
   - `superadminToken`: (set after login)
   - `adminToken`: (set after login)
   - `studentToken`: (set after login)
   - `teacherToken`: (set after login)

3. **Create Test Scripts**:
```javascript
// Save token after login
pm.environment.set("studentToken", pm.response.json().token);
```

---

## 📊 Expected Database State

After testing, your AttendanceLog collection should have:

```javascript
{
  "_id": ObjectId("..."),
  "userId": ObjectId("..."),        // Reference to User
  "userRole": "student",            // or "teacher", "admin"
  "course": "CS101",
  "timestamp": ISODate("..."),
  "status": "present",
  "createdBy": ObjectId("..."),     // Admin who created this user
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Not authorized to access this route"
**Solution:** Token expired or invalid. Login again to get new token.

### Issue 2: Admin sees no logs
**Solution:** Make sure the admin has created users first. If no users are created by this admin, they will see empty results.

### Issue 3: Student sees all logs
**Solution:** Check that routes have `allowRoles('superadmin', 'admin')` middleware. Students should get 403 Forbidden.

### Issue 4: "createdBy is null"
**Solution:** User was created before implementing this system. Update user document to include createdBy field.

---

## 🎯 Success Criteria

✅ **All tests pass**  
✅ **403 errors where expected**  
✅ **Role-based filtering working**  
✅ **No unauthorized access**  
✅ **Data isolation between admins**

---

**Ready to test?** Start with Test 1 (Student Logs Attendance) and work through sequentially!
