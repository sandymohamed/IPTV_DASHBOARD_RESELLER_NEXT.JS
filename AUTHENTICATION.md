# Authentication Setup

## Overview

The app now has complete JWT-based authentication with protected routes.

## Features

✅ **Login Page** - `/auth/login`  
✅ **Protected Routes** - All dashboard routes require authentication  
✅ **Auto-redirect** - Unauthenticated users redirected to login  
✅ **Token Management** - JWT tokens stored and validated  
✅ **Auto-logout** - Token expiration handled automatically  
✅ **User Context** - User data available throughout the app  

## How It Works

### 1. Authentication Flow

1. User visits app → AuthProvider checks for valid token
2. If no token/invalid → Redirect to `/auth/login`
3. User logs in → Token stored in localStorage
4. User redirected to dashboard
5. All API requests include token in Authorization header

### 2. Protected Routes

All routes under `/dashboard/*` are protected by `AuthGuard`:
- Checks if user is authenticated
- Shows loading while checking
- Redirects to login if not authenticated

### 3. Login Page

- Protected by `GuestGuard` (redirects to dashboard if already logged in)
- Form validation with Yup
- Error handling
- Loading states

## API Configuration

Set your API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/
```

## API Endpoints Used

- `POST /auth/login` - Login
- `GET /auth/my_account` - Get current user
- `GET /main/dashbord` - Dashboard statistics
- `GET /user/list` - Get users
- `GET /mags/list` - Get mags
- `GET /enigmas/list` - Get enigmas
- `GET /tickets` - Get tickets
- `GET /codes/list` - Get codes
- And more...

## Pages with Data Fetching

All dashboard pages now fetch real data from the API:

- ✅ Dashboard Home - Statistics cards with real data
- ✅ Users List - Fetches users from API
- ✅ Mags List - Fetches mags from API
- ✅ Enigmas List - Fetches enigmas from API
- ✅ Tickets - Fetches tickets from API
- ✅ Client Connections - Fetches active connections
- ✅ Payments - Fetches payments
- ✅ Codes - Fetches codes
- ✅ Templates - Fetches templates
- ✅ Sub-resellers - Fetches sub-resellers
- ✅ Account - Shows logged-in user data

## Testing

1. Start the app: `npm run dev`
2. Visit http://localhost:3030
3. You'll be redirected to `/auth/login`
4. Enter your credentials
5. After login, you'll see the dashboard with real data

## Troubleshooting

### "Failed to load dashboard data"

- Check if backend API is running
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for API errors
- Verify token is being sent in requests

### "Login failed"

- Check API endpoint is correct
- Verify credentials
- Check backend logs for errors
- Ensure CORS is configured on backend

### Pages show "No data found"

- This is normal if there's no data in the database
- Check API endpoints are returning correct format
- Verify API response structure matches expected format
