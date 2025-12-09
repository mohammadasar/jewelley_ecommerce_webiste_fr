# Wishlist Backend Integration Guide

This guide explains how the wishlist feature has been integrated with your backend API.

## Overview

The wishlist functionality now syncs with your backend MongoDB database while maintaining localStorage as a fallback for offline/non-authenticated users.

## Backend Requirements

### Wishlist Entity
```java
@Document(collection = "wishlists")
public class Wishlist {
    @Id
    private String id;
    private String userId;
    private List<String> productIds = new ArrayList<>();
}
```

### API Endpoints
Your backend should have these endpoints:

1. **GET** `/api/wishlist?userId={userId}` - Get user's wishlist
2. **POST** `/api/wishlist/add?userId={userId}&productId={productId}` - Add product to wishlist
3. **POST** `/api/wishlist/remove?userId={userId}&productId={productId}` - Remove product from wishlist

## Frontend Implementation

### Files Modified/Created

1. **`JS/wishlist-service.js`** (NEW)
   - Handles all API calls to the backend
   - Provides fallback to localStorage for offline/non-authenticated users
   - Syncs local wishlist with backend on login

2. **`JS/app.js`** (MODIFIED)
   - Updated `toggleWishlistItem()` to use WishlistService
   - Updated `removeFromWishlist()` to use WishlistService
   - Added `loadWishlistFromBackend()` function
   - Modified initialization to load wishlist from backend

3. **`JS/auth.js`** (MODIFIED)
   - Added wishlist sync after successful login
   - Added wishlist sync after successful signup

4. **`index.html`, `login.html`, `signup.html`** (MODIFIED)
   - Added `<script src="./JS/wishlist-service.js"></script>`

## Configuration

### Update Backend URL

In `JS/wishlist-service.js`, update the API base URL to match your backend:

```javascript
const API_BASE_URL = 'http://localhost:8080/api/wishlist';
```

Change this to your actual backend URL (e.g., `https://api.yoursite.com/api/wishlist`).

## How It Works

### For Authenticated Users

1. **On Page Load:**
   - Wishlist is fetched from backend API
   - Local state is updated with backend data
   - UI is refreshed to show correct wishlist items

2. **Adding to Wishlist:**
   - API call to `/api/wishlist/add` is made
   - If successful, local state is updated
   - localStorage is synced for offline access
   - UI is updated

3. **Removing from Wishlist:**
   - API call to `/api/wishlist/remove` is made
   - If successful, local state is updated
   - localStorage is synced
   - UI is updated

4. **On Login/Signup:**
   - Local wishlist items are synced with backend
   - Any items in localStorage are added to backend
   - Backend becomes the source of truth

### For Non-Authenticated Users

- All wishlist operations use localStorage only
- When user logs in, local wishlist is synced to backend
- No data is lost during the transition

## User ID Mapping

The system uses the user ID from the authenticated user object stored in localStorage:

```javascript
const user = JSON.parse(localStorage.getItem('jewel_user'));
const userId = user.id;
```

Make sure your backend authentication returns a user object with an `id` field.

## Backend Response Format

The backend should return a `Wishlist` object in this format:

```json
{
  "id": "wishlist123",
  "userId": "user456",
  "productIds": ["1", "2", "3"]
}
```

The frontend extracts the `productIds` array and uses it to update the UI.

## Error Handling

The implementation includes comprehensive error handling:

- Network failures fall back to localStorage
- Invalid responses are logged and gracefully handled
- User experience is maintained even if backend is unavailable

## Testing

### Test Scenarios

1. **Non-authenticated user:**
   - Add items to wishlist → Should save to localStorage
   - Refresh page → Items should persist
   - Login → Items should sync to backend

2. **Authenticated user:**
   - Add items to wishlist → Should save to backend
   - Refresh page → Items should load from backend
   - Logout and login → Items should persist

3. **Offline mode:**
   - Disconnect from backend
   - Add/remove items → Should work with localStorage
   - Reconnect → Should sync on next login

## CORS Configuration

Make sure your backend allows CORS requests from your frontend domain:

```java
@CrossOrigin(origins = "http://localhost:3000") // or your frontend URL
@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {
    // ...
}
```

## Security Considerations

1. **Authentication:** All API calls include the JWT token in the Authorization header
2. **User Validation:** Backend should validate that the userId matches the authenticated user
3. **Input Validation:** Backend should validate productId format and existence

## Troubleshooting

### Wishlist not syncing

1. Check browser console for errors
2. Verify backend URL in `wishlist-service.js`
3. Check CORS configuration
4. Verify user object has `id` field

### Items disappearing

1. Check localStorage for `jewel_wishlist` key
2. Verify backend is returning correct data
3. Check network tab for API responses

### Duplicate items

1. Backend should prevent duplicate productIds
2. Frontend checks before adding to local state

## Future Enhancements

Potential improvements:

1. Batch sync operations
2. Optimistic UI updates
3. Conflict resolution for concurrent edits
4. Real-time sync with WebSockets
5. Wishlist sharing features
