# Testing the Wishlist Integration

## Quick Start

### Step 1: Update Backend URL

Open `JS/wishlist-service.js` and update line 9:

```javascript
const API_BASE_URL = 'http://localhost:8080/api/wishlist'; // Change to your backend URL
```

### Step 2: Start Your Backend

Make sure your Spring Boot backend is running on the configured port.

### Step 3: Open the Website

Open `index.html` in your browser or use a local server:

```bash
# Using Python
python -m http.server 3000

# Using Node.js http-server
npx http-server -p 3000

# Using PHP
php -S localhost:3000
```

## Test Scenarios

### Scenario 1: Non-Authenticated User

**Steps:**
1. Open the website (not logged in)
2. Click the heart icon (♡) on any product
3. Open browser DevTools → Console
4. You should see: `User not logged in, using local wishlist`
5. Click the wishlist icon (❤️) in the header
6. Verify the product appears in the wishlist panel
7. Refresh the page
8. Verify the wishlist persists (from localStorage)

**Expected Behavior:**
- Wishlist is saved to localStorage only
- No API calls are made
- Data persists across page refreshes

---

### Scenario 2: Login and Sync

**Steps:**
1. Add 2-3 products to wishlist (while not logged in)
2. Click "Login / Signup" button
3. Login with your credentials
4. Open browser DevTools → Network tab
5. You should see API calls to `/api/wishlist/add`
6. Open Console tab
7. You should see: `Wishlist synced successfully`
8. Click the wishlist icon
9. Verify all your items are still there

**Expected Behavior:**
- Local wishlist items are synced to backend
- API calls are made to add each item
- No items are lost during login

---

### Scenario 3: Authenticated User Operations

**Steps:**
1. Make sure you're logged in
2. Click heart icon on a new product
3. Open DevTools → Network tab
4. You should see: `POST /api/wishlist/add?userId=...&productId=...`
5. Check the response - should return updated wishlist
6. Remove an item from wishlist
7. You should see: `POST /api/wishlist/remove?userId=...&productId=...`
8. Refresh the page
9. Verify wishlist loads from backend

**Expected Behavior:**
- All operations call backend API
- localStorage is synced with backend response
- Data persists across page refreshes

---

### Scenario 4: Offline Mode

**Steps:**
1. Login to the website
2. Add some items to wishlist
3. Open DevTools → Network tab
4. Set network to "Offline" (or stop your backend)
5. Try to add/remove wishlist items
6. Open Console tab
7. You should see error messages but operations still work
8. Verify items are added/removed in the UI
9. Restore network connection
10. Refresh the page
11. Verify wishlist loads correctly

**Expected Behavior:**
- Operations fall back to localStorage when offline
- No errors shown to user
- Data syncs when connection is restored

---

### Scenario 5: Multiple Devices

**Steps:**
1. Login on Device A (or Browser A)
2. Add products 1, 2, 3 to wishlist
3. Login on Device B (or Browser B) with same account
4. Verify products 1, 2, 3 appear in wishlist
5. Add product 4 on Device B
6. Refresh Device A
7. Verify product 4 now appears on Device A

**Expected Behavior:**
- Wishlist syncs across devices
- Backend is the source of truth
- All devices show the same wishlist

---

## Browser Console Testing

Open browser console and try these commands:

### Check Current Wishlist
```javascript
console.log('Current wishlist:', state.wishlist);
```

### Manually Add to Wishlist
```javascript
WishlistService.addToWishlist("5").then(success => {
    console.log('Added:', success);
});
```

### Manually Remove from Wishlist
```javascript
WishlistService.removeFromWishlist("5").then(success => {
    console.log('Removed:', success);
});
```

### Fetch Wishlist from Backend
```javascript
WishlistService.fetchWishlist().then(wishlist => {
    console.log('Backend wishlist:', wishlist);
});
```

### Check localStorage
```javascript
console.log('Local wishlist:', localStorage.getItem('jewel_wishlist'));
console.log('User:', localStorage.getItem('jewel_user'));
console.log('Token:', localStorage.getItem('jewel_token'));
```

### Sync Wishlist
```javascript
WishlistService.syncWishlistOnLogin().then(() => {
    console.log('Sync complete');
});
```

---

## Debugging Checklist

### ✅ Backend is Running
```bash
# Check if backend is accessible
curl http://localhost:8080/api/wishlist?userId=test
```

### ✅ CORS is Configured
Check browser console for CORS errors. If you see:
```
Access to fetch at 'http://localhost:8080/api/wishlist' from origin 'http://localhost:3000' has been blocked by CORS policy
```

Add CORS configuration to your backend:
```java
@CrossOrigin(origins = "http://localhost:3000")
```

### ✅ User Object Has ID
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('jewel_user'));
console.log('User ID:', user?.id);
```

If `user.id` is undefined, your backend needs to return user object with `id` field.

### ✅ JWT Token is Valid
```javascript
// In browser console
const token = localStorage.getItem('jewel_token');
console.log('Token:', token);
console.log('Token exists:', !!token);
```

### ✅ API Calls are Being Made
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Perform wishlist operations
4. Check for API calls to `/api/wishlist`

### ✅ Responses are Correct
Click on an API call in Network tab and check:
- Status: Should be 200 OK
- Response: Should be JSON with `productIds` array
- Headers: Should include CORS headers

---

## Common Errors and Solutions

### Error: "User not logged in, using local wishlist"
**Cause:** User is not authenticated
**Solution:** This is expected behavior. Login to use backend sync.

### Error: "Error fetching wishlist from backend: TypeError: Failed to fetch"
**Cause:** Backend is not running or URL is incorrect
**Solution:** 
1. Check if backend is running
2. Verify API_BASE_URL in wishlist-service.js
3. Check CORS configuration

### Error: "HTTP error! status: 401"
**Cause:** JWT token is invalid or expired
**Solution:**
1. Logout and login again
2. Check token in localStorage
3. Verify backend JWT validation

### Error: "Cannot read properties of null (reading 'id')"
**Cause:** User object doesn't have `id` field
**Solution:** Update backend to return user object with `id`:
```java
// In your AuthController
return ResponseEntity.ok(new LoginResponse(
    token,
    new UserDTO(user.getId(), user.getUsername(), user.getRole())
));
```

### Error: Products not syncing across devices
**Cause:** localStorage is being used instead of backend
**Solution:**
1. Verify user is logged in
2. Check if API calls are being made
3. Clear localStorage and login again

---

## Performance Testing

### Test Load Time
```javascript
console.time('Wishlist Load');
WishlistService.fetchWishlist().then(() => {
    console.timeEnd('Wishlist Load');
});
```

### Test Add Performance
```javascript
console.time('Add to Wishlist');
WishlistService.addToWishlist("10").then(() => {
    console.timeEnd('Add to Wishlist');
});
```

### Test Sync Performance
```javascript
console.time('Wishlist Sync');
WishlistService.syncWishlistOnLogin().then(() => {
    console.timeEnd('Wishlist Sync');
});
```

---

## Automated Testing (Optional)

If you want to add automated tests, here's a basic example:

```javascript
// test-wishlist.js
async function testWishlist() {
    console.log('Starting wishlist tests...');
    
    // Test 1: Add to wishlist
    console.log('Test 1: Adding product to wishlist');
    const added = await WishlistService.addToWishlist("999");
    console.assert(added === true, 'Failed to add product');
    
    // Test 2: Fetch wishlist
    console.log('Test 2: Fetching wishlist');
    const wishlist = await WishlistService.fetchWishlist();
    console.assert(wishlist.includes("999"), 'Product not in wishlist');
    
    // Test 3: Remove from wishlist
    console.log('Test 3: Removing product from wishlist');
    const removed = await WishlistService.removeFromWishlist("999");
    console.assert(removed === true, 'Failed to remove product');
    
    // Test 4: Verify removal
    console.log('Test 4: Verifying removal');
    const updatedWishlist = await WishlistService.fetchWishlist();
    console.assert(!updatedWishlist.includes("999"), 'Product still in wishlist');
    
    console.log('All tests passed! ✅');
}

// Run tests
testWishlist();
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Update API_BASE_URL to production URL
- [ ] Test with production backend
- [ ] Verify CORS configuration for production domain
- [ ] Test HTTPS connections
- [ ] Test with real user accounts
- [ ] Verify error handling works correctly
- [ ] Test offline functionality
- [ ] Check performance with large wishlists
- [ ] Verify data persistence
- [ ] Test cross-device sync
- [ ] Monitor API response times
- [ ] Set up error logging/monitoring

---

## Support

If you encounter issues:

1. **Check Documentation:**
   - `WISHLIST-INTEGRATION-GUIDE.md` - Comprehensive guide
   - `WISHLIST-API-REFERENCE.md` - API endpoints reference
   - `WISHLIST-ARCHITECTURE.md` - System architecture

2. **Check Browser Console:**
   - Look for error messages
   - Check network requests
   - Verify API responses

3. **Check Backend Logs:**
   - Look for exceptions
   - Verify requests are received
   - Check database operations

4. **Common Solutions:**
   - Clear browser cache and localStorage
   - Logout and login again
   - Restart backend server
   - Check CORS configuration
   - Verify API URL is correct
