# Updated Login UI

Documentation for the admin login page (`AdminLoginPage.js`) and its face 2FA flow.

---

## Route

- Path: `/admin-login`
- Guard: `AdminLoginGuard` — redirects to `/dashboard` if already authenticated

---

## Login Flow

### Step 1: Email + Password

The login form collects:
- Email address
- Password

On submit ? `POST /api/auth/login`

```js
const response = await api.post("/auth/login", { email, password });
```

**Possible responses:**

| Status | Meaning |
|---|---|
| 200 | Login successful — full JWT returned |
| 200 + `requiresFaceVerify: true` | Face 2FA required (admin enrolled face) |
| 401 | Invalid credentials |
| 403 | Account deactivated |
| 409 | Already logged in from another session |

---

### Step 2: Session Conflict (409)

If a 409 is returned:
- UI shows a prompt: "You are already logged in from another device."
- User can click "Force Login" to re-authenticate
- Sends `{ email, password, forceLogin: true }` to the same endpoint

---

### Step 3: Face 2FA (if required)

If `requiresFaceVerify: true` is returned with a partial token:
- A webcam panel opens below the login form
- User centers their face in the webcam
- The page captures a screenshot automatically after 2 seconds
- `POST /api/auth/face-verify` with the image + partial token

```js
const image = webcamRef.current.getScreenshot();
const response = await api.post("/auth/face-verify", { image }, {
  headers: { Authorization: `Bearer ${partialToken}` }
});
```

**On success:** Full JWT returned ? stored in localStorage ? redirect to `/dashboard`

---

## State Variables

| State | Type | Description |
|---|---|---|
| `email` | string | Form email input |
| `password` | string | Form password input |
| `loading` | boolean | Disables button during API call |
| `error` | string | Error message to display |
| `requiresFaceVerify` | boolean | Toggles webcam panel |
| `partialToken` | string | JWT from step 1 (used for face-verify) |
| `showForceLogin` | boolean | Shows force-login prompt on 409 |

---

## Token Storage

On successful login:
```js
localStorage.setItem("token", response.data.token);
localStorage.setItem("user", JSON.stringify(response.data.user));
```

On logout:
```js
localStorage.removeItem("token");
localStorage.removeItem("user");
```

---

## Webcam Component

The face capture uses react-webcam:

```jsx
<Webcam
  ref={webcamRef}
  screenshotFormat="image/jpeg"
  screenshotQuality={0.8}
  videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
  mirrored={true}
/>
```

Screenshot is taken automatically after the face is detected, or manually via a "Capture" button.

---

## UI Design Notes

- Single-column card layout, centered on the page
- Shows "Attendance Management System" title
- Password field has show/hide toggle
- Error messages appear in a red alert box below the form
- Loading spinner replaces button text during API calls
- Face capture panel slides in below the form on 2FA step
- Webcam shows a countdown ("Capturing in 3...") before auto-capture
