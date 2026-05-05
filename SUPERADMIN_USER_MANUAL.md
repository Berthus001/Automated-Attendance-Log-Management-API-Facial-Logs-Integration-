# Superadmin User Manual
## Automated Attendance Log Management System

---

## Table of Contents

1. [Overview](#1-overview)
2. [Accessing the System](#2-accessing-the-system)
3. [Logging In](#3-logging-in)
4. [Dashboard Overview Tab](#4-dashboard-overview-tab)
5. [Managing Administrators](#5-managing-administrators)
6. [Managing Teachers](#6-managing-teachers)
7. [Managing Students](#7-managing-students)
8. [Viewing and Managing All Users](#8-viewing-and-managing-all-users)
9. [Viewing Attendance Logs](#9-viewing-attendance-logs)
10. [Viewing Login Logs](#10-viewing-login-logs)
11. [Logging Out](#11-logging-out)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Overview

The **Superadmin** is the highest-privileged role in the system. As a Superadmin, you have full access to:

| Capability | Superadmin | Admin |
|---|---|---|
| Create Admin accounts | ✅ Yes | ❌ No |
| Create Teacher accounts | ✅ Yes | ✅ Yes |
| Create Student accounts | ✅ Yes | ✅ Yes |
| View ALL users | ✅ Yes | ❌ Only own users |
| Edit/Delete ANY user | ✅ Yes | ❌ Only own users |
| View ALL attendance logs | ✅ Yes | ❌ Only own users |
| View ALL login logs | ✅ Yes | ❌ Only own users |
| Create another Superadmin | ❌ No | ❌ No |

> **Note:** Only one Superadmin account exists in the system. It is created using the `create-superadmin.js` script run on the server.

---

## 2. Accessing the System

**Step 1.** Open a web browser (Google Chrome recommended).

**Step 2.** Navigate to the system URL:
- **Local:** `http://localhost:3001`
- **Production:** Your deployed Vercel frontend URL

**Step 3.** You will be redirected to the **Sign In Page**.

On the Sign In Page, you will see the following sections:

| Section | Description |
|---|---|
| Demo Credentials | Sample login credentials provided for testing and demonstration purposes |
| Admin Login | Login form for Superadmin and Admin accounts using email and password |
| Faculty Login | Login option for Teacher accounts using face recognition |
| Student Login | Login option for Student accounts using face recognition |

---

## 3. Logging In

The Superadmin logs in using the **Admin Login** section (email and password).

### Step-by-Step Login

**Step 1.** On the Sign In Page, locate and click the **"Admin Login"** tab.

**Step 2.** You may refer to the **Demo Credentials** section on the page if needed for testing.

**Step 3.** Enter your **Email Address** in the email field.

**Step 4.** Enter your **Password** in the password field.

**Step 5.** Click the **"Login"** button.

**Step 6.** Upon successful login, you will be taken to the **Superadmin Dashboard**.

### Already Logged In on Another Device?

If the system shows a message saying **"User already logged in from another session"**:
- A modal will appear with two choices
- Click **"Logout Previous Session"** to force-end the old session and log in here
- Click **"Cancel"** to go back

---

## 4. Dashboard Overview Tab

After login, the **Overview** tab is shown by default.

### What You See

**Statistics Cards** (top of the page):

| Card | What It Shows |
|---|---|
| Total Users | Total number of all accounts in the system |
| Students | Number of enrolled student accounts |
| Teachers | Number of registered teacher accounts |
| Administrators | Number of admin accounts (superadmin only) |

**Quick Actions** (below the statistics):

| Button | What It Does |
|---|---|
| Add New Admin | Opens the form to create a new Admin account |
| Add Teacher | Opens the form to register a new Teacher |
| Add Student | Opens the form to enroll a new Student |
| View All Users | Navigates to the All Users tab |

**Recently Added Users** (below quick actions):
- Shows the last 5 users added to the system
- Displays: name, email, and role badge

---

## 5. Managing Administrators

Only the Superadmin can create Admin accounts.

### 5.1 Creating a New Admin Account

**Step 1.** On the Overview tab, click the **"Add New Admin"** quick action card.

**Step 2.** The **Add New User** modal will open with the role pre-set to **Admin**.

**Step 3.** Fill in the required fields:

| Field | Instructions |
|---|---|
| Full Name | Enter the administrator's full name |
| Email Address | Enter a unique email address (this will be their login username) |
| Password | Set a secure password (minimum 6 characters) |
| Role | Automatically set to "Admin" — cannot be changed |
| Department | Select the admin's department from the dropdown (optional) |

**Step 4.** Capture a face photo (required for enrollment):
- A webcam preview will appear at the bottom of the form
- Ask the person to look directly at the camera
- Click **"Capture Face"**
- A green confirmation **"✓ Face captured successfully!"** will appear

**Step 5.** Click **"Create User"** to save the account.

**Step 6.** The modal will close and the new admin will appear in the user list.

> **Important:** The admin will use email + password to log in. They may also enroll their face for two-factor authentication.

---

## 6. Managing Teachers

### 6.1 Creating a New Teacher Account

**Step 1.** On the Overview tab, click the **"Add Teacher"** quick action card.  
*Alternatively: Go to the All Users tab → click the "Add" or use the Administrators tab.*

**Step 2.** The **Add New User** modal will open with the role pre-set to **Teacher**.

**Step 3.** Fill in the required fields:

| Field | Instructions |
|---|---|
| Full Name | Enter the teacher's full name |
| Email Address | Enter a unique email address |
| Password | Set a secure password (minimum 6 characters) |
| Role | Automatically set to "Teacher" |
| Department | Select the teacher's department (e.g., Computer Science, Engineering) |

**Step 4.** Capture a face photo:
- The webcam will activate at the bottom of the form
- Ask the teacher to face the camera directly with good lighting
- Click **"Capture Face"**
- Wait for **"✓ Face captured successfully!"**

**Step 5.** Click **"Create User"**.

> **How Teachers Log In:** Teachers use the **Face Login** tab on the login page — they do NOT use email/password.

> **Teacher Attendance (Same as Students):**
> - Teachers use the **Kiosk Scanner** for attendance **time-in and time-out**
> - The attendance flow for teachers is the same as students (first scan = time-in, second scan = time-out)

---

## 7. Managing Students

### 7.1 Enrolling a New Student

**Step 1.** On the Overview tab, click the **"Add Student"** quick action card.

**Step 2.** The **Add New User** modal will open with the role pre-set to **Student**.

**Step 3.** Fill in the required fields:

| Field | Instructions |
|---|---|
| Full Name | Enter the student's full name |
| Email Address | Enter a unique email address for the student |
| Password | Set a password (minimum 6 characters) |
| Role | Automatically set to "Student" |
| Department | Select the student's department/course |

**Step 4.** Capture the student's face:
- The webcam will appear at the bottom of the modal
- The student should sit directly in front of the camera
- Ensure good lighting — avoid backlighting or shadows on the face
- Click **"Capture Face"**
- Confirm **"✓ Face captured successfully!"**

**Step 5.** Click **"Create User"** to complete enrollment.

> **How Students Log In / Use Attendance Kiosk:**
> - Students use **Face Login** to log into the system
> - Students use the **Kiosk Scanner** for attendance time-in/time-out

### 7.2 Face Enrollment Tips

| Condition | Recommendation |
|---|---|
| Lighting | Bright, even light facing the person |
| Face position | Look directly at the camera, head straight |
| Background | Plain or simple background preferred |
| Glasses | Capture with and without if possible |
| Distance | About 50–80 cm from camera |

---

## 8. Viewing and Managing All Users

### 8.1 Navigating to All Users

**Step 1.** Click the **"All Users"** tab in the top navigation bar.

**Step 2.** A table will appear showing all users in the system.

### 8.2 Table Columns Explained

| Column | Description |
|---|---|
| Name | User's full name with avatar initial |
| Email | Login email address |
| Role | Color-coded badge: Superadmin / Admin / Teacher / Student |
| Status | Active (✓ green) or Inactive (✗ red) |
| Face Enrolled | Whether a face descriptor is stored (✓ Enrolled / ✗ No Face) |
| Created | Date the account was created |
| Actions | Edit (✏️) and Delete (🗑️) buttons |

### 8.3 Searching for a User

**Step 1.** In the **search bar** (top-right of the table), type the user's name or email.

**Step 2.** The table filters automatically as you type.

### 8.4 Filtering by Role

**Step 1.** Click the **role filter dropdown** next to the search bar.

**Step 2.** Select from: All Roles, Superadmin, Admin, Teacher, or Student.

**Step 3.** The table updates to show only that role.

### 8.5 Editing a User

**Step 1.** Locate the user in the table.

**Step 2.** Click the **Edit button (✏️)** in the Actions column.

**Step 3.** The Edit User modal opens. You can update:
- Full Name
- Password (leave blank to keep current password)
- Department
- Face photo (if re-capturing)

> **Note:** Email cannot be changed after account creation. Role can only be changed by the Superadmin.

**Step 4.** Click **"Update User"** to save changes.

### 8.6 Deleting a User

**Step 1.** Locate the user in the table.

**Step 2.** Click the **Delete button (🗑️)** in the Actions column.

**Step 3.** A confirmation dialog will appear:  
*"Are you sure you want to delete user [Name]? This action cannot be undone."*

**Step 4.** Click **OK** to confirm deletion, or **Cancel** to go back.

> **Warning:** Deletion is permanent and cannot be undone. All associated attendance records linked to that user will remain in the database but will lose the user reference.

> **Note:** You cannot delete your own superadmin account from the dashboard (the delete button will not appear for your own row).

---

## 9. Viewing Attendance Logs

The Superadmin can view ALL attendance logs from every user in the system.

Attendance is supported for **both students and teachers** using the same kiosk process.

### 9.1 Accessing Attendance Logs

> The attendance logs view may be available via a dedicated tab or API endpoint depending on the current frontend build. If an "Attendance" tab is visible in the top navigation, click it.

### 9.2 What the Logs Show

Each attendance log record contains:

| Field | Description |
|---|---|
| User | Name and email of the user who timed in/out |
| Role | Whether the user is a student or teacher |
| Department | User's department |
| Time In | Timestamp when the user tapped in at the kiosk |
| Time Out | Timestamp when the user tapped out (if completed) |
| Device | The kiosk device that recorded the attendance |

### 9.3 Filtering Attendance Logs

You can filter by:
- **Date Range** — Select a start and end date
- **User Role** — Filter by student or teacher
- **Specific User** — Filter by user ID

---

## 10. Viewing Login Logs

The Superadmin can view all admin/superadmin login history across the system.

### 10.1 What Login Logs Show

Each login log records:

| Field | Description |
|---|---|
| User | Name and email of the account that logged in |
| Role | Role of the account (admin, superadmin) |
| Login Time | Exact date and time of login |
| IP Address | IP address from which the login was made |
| Device/Browser | User-agent string of the browser used |

### 10.2 Login Statistics

The system also provides aggregated login statistics:
- Total logins per role
- Last login time per role

---

## 11. Logging Out

**Step 1.** Click the **"🚪 Logout"** button in the top-right corner of the dashboard header.

**Step 2.** You will be immediately returned to the Login Page.

**Step 3.** Your session token is removed from the browser. Your `isLoggedIn` status is updated to `false` in the database.

> **Security Tip:** Always log out when leaving your workstation, especially on shared computers.

---

## 12. Troubleshooting

### Problem: Cannot log in — "Invalid credentials"
- Double-check your email address (it is case-insensitive)
- Confirm your password is correct
- Contact system support if you cannot recover access

### Problem: Face verification keeps failing
- Make sure the room is well-lit
- Face the camera directly — avoid angles
- Remove glasses or face coverings if possible
- If still failing, contact support to re-enroll your face via `backend/fix-superadmin-role.js`

### Problem: "User already logged in" message
- Click **"Logout Previous Session"** to force-clear the old session
- This is safe to do if you are the account owner

### Problem: New user shows "✗ No Face"
- This means face enrollment failed during creation
- Delete the user and re-create them, ensuring a clear face photo is captured

### Problem: Cannot create admin — option not visible
- Verify your account role is **superadmin** (shown in the top-right badge)
- Admin accounts do not have the "Add New Admin" quick action

### Problem: Dashboard shows no users
- Check your internet connection
- Check that the backend server is running and reachable
- The session may have expired — log out and log in again

### Problem: Deleted user still shows in the list
- Click the browser refresh or navigate away and back to the Users tab to reload the list

---

## Role Privileges Quick Reference

| Action | Superadmin | Admin |
|---|---|---|
| Login with email + password | ✅ | ✅ |
| Face login | ❌ (admin panel only) | ❌ (admin panel only) |
| View dashboard | ✅ | ✅ |
| Create Admin | ✅ | ❌ |
| Create Teacher | ✅ | ✅ |
| Create Student | ✅ | ✅ |
| View ALL users | ✅ | ❌ (own only) |
| Edit ANY user | ✅ | ❌ (own only) |
| Delete ANY user | ✅ | ❌ (own only) |
| View ALL attendance logs | ✅ | ❌ (own only) |
| View ALL login logs | ✅ | ❌ (own only) |
| Use Kiosk attendance scanner | ❌ (blocked) | ❌ (blocked) |

---

*End of Superadmin User Manual — Group 4 Automated Attendance Log Management System*
