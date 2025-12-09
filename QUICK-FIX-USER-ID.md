# Quick Fix: User ID Not Found Issue

## Problem
You're logged in but seeing: `"User not logged in, using local wishlist"`

## Solution

### Step 1: Check Your User Object

Open your browser console (F12) and run:

```javascript
WishlistService.debugAuth()
```

This will show you:
- Whether you're logged in
- What your user object looks like
- What user ID was found
- Recommendations to fix the issue

### Step 2: Check What Your Backend Returns

When you login, your backend should return a response like this:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",           // ← IMPORTANT: Must have an "id" field
    "username": "john",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

### Step 3: Fix Your Backend Login Response

If your backend doesn't return a user object with an `id` field, you need to update it.

#### Option 1: Update Your Backend to Return User ID

In your `AuthController` or login endpoint:

```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    // ... authentication logic ...
    
    String token = jwtUtils.generateToken(user);
    
    // Create response with user data
    Map<String, Object> response = new HashMap<>();
    response.put("token", token);
    
    // IMPORTANT: Include user object with id
    Map<String, Object> userData = new HashMap<>();
    userData.put("id", user.getId());           // ← Add this
    userData.put("username", user.getUsername());
    userData.put("email", user.getEmail());
    userData.put("role", user.getRole());
    
    response.put("user", userData);
    
    return ResponseEntity.ok(response);
}
```

#### Option 2: Use Username as User ID (Temporary Fix)

The updated `wishlist-service.js` now automatically falls back to using `username` if `id` is not found. So if your user object has a `username` field, it will work!

### Step 4: Test Again

1. **Logout** (if logged in)
2. **Clear localStorage**:
   ```javascript
   localStorage.clear()
   ```
3. **Login again**
4. **Check the debug info**:
   ```javascript
   WishlistService.debugAuth()
   ```
5. **Try adding to wishlist** - it should now make backend calls!

### Step 5: Verify Backend Calls

1. Open DevTools → Network tab
2. Click a heart icon on a product
3. You should see a POST request to `/api/wishlist/add`
4. Check the request URL - it should include `userId` parameter

## Quick Checks

### Check if you're logged in:
```javascript
console.log('Token:', localStorage.getItem('jewel_token'));
console.log('User:', localStorage.getItem('jewel_user'));
```

### Check what user ID is being used:
```javascript
const userStr = localStorage.getItem('jewel_user');
const user = JSON.parse(userStr);
console.log('User object:', user);
console.log('User ID:', user.id || user.userId || user._id || user.username);
```

### Manually test API call:
```javascript
// This will show you exactly what's happening
WishlistService.addToWishlist("1").then(success => {
    console.log('Success:', success);
});
```

## Expected Console Output (When Working)

When you click the heart icon, you should see:

```
User ID from localStorage: user123
POST http://localhost:8080/api/wishlist/add?userId=user123&productId=1
```

NOT:
```
User not logged in, using local wishlist
```

## Still Not Working?

### Check Your User Object Structure

Run this in console:
```javascript
const user = JSON.parse(localStorage.getItem('jewel_user'));
console.log('User object keys:', Object.keys(user));
console.log('Full user object:', user);
```

If you see the user object but it doesn't have `id`, `userId`, `_id`, or `username`, you need to update your backend to include one of these fields.

### Temporary Workaround

If you can't update the backend right now, you can manually add an ID to the user object:

```javascript
// Get current user
const userStr = localStorage.getItem('jewel_user');
const user = JSON.parse(userStr);

// Add an id field (use whatever unique identifier you have)
user.id = user.username; // or user.email, or any unique field

// Save it back
localStorage.setItem('jewel_user', JSON.stringify(user));

// Refresh the page
location.reload();
```

## Summary

The issue is that your user object doesn't have an `id` field. The fix:

1. **Best solution**: Update your backend to return `id` in the user object
2. **Quick fix**: The code now uses `username` as fallback
3. **Temporary**: Manually add `id` to localStorage (shown above)

After fixing, run `WishlistService.debugAuth()` to verify everything is working!
