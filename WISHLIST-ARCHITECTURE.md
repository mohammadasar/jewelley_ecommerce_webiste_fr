# Wishlist Integration Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (app.js)                           │
│  • toggleWishlistItem()                                          │
│  • removeFromWishlist()                                          │
│  • renderWishlist()                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WishlistService (wishlist-service.js)           │
│                                                                   │
│  ┌──────────────────────┐         ┌──────────────────────┐      │
│  │  Authenticated User  │         │ Non-Authenticated    │      │
│  │                      │         │ User                 │      │
│  │  • fetchWishlist()   │         │                      │      │
│  │  • addToWishlist()   │         │ • getLocalWishlist() │      │
│  │  • removeFromWishlist│         │ • addToLocal...()    │      │
│  │                      │         │ • removeFromLocal..()│      │
│  └──────────────────────┘         └──────────────────────┘      │
│           │                                    │                 │
└───────────┼────────────────────────────────────┼─────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│   Backend API           │         │   localStorage          │
│   (MongoDB)             │         │   (Browser)             │
│                         │         │                         │
│ GET  /api/wishlist     │         │ jewel_wishlist          │
│ POST /api/wishlist/add │         │ (JSON array)            │
│ POST /api/wishlist/remove│        │                         │
└─────────────────────────┘         └─────────────────────────┘
```

## Authentication Flow

```
┌──────────────┐
│ User Visits  │
│   Website    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Check Authentication │
│ (localStorage token) │
└──────┬───────────────┘
       │
       ├─── Not Logged In ──────────────┐
       │                                 │
       │                                 ▼
       │                    ┌────────────────────────┐
       │                    │ Use localStorage Only  │
       │                    │ for Wishlist           │
       │                    └────────────────────────┘
       │
       └─── Logged In ─────────────────┐
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │ Load Wishlist from       │
                         │ Backend API              │
                         └──────────────────────────┘
                                        │
                                        ▼
                         ┌──────────────────────────┐
                         │ Sync localStorage with   │
                         │ Backend Data             │
                         └──────────────────────────┘
```

## Login/Signup Sync Flow

```
┌──────────────┐
│ User Logs In │
│ or Signs Up  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ Authentication Success  │
│ (Token + User Data)     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ syncWishlistOnLogin()           │
│                                 │
│ 1. Get local wishlist items     │
│ 2. Fetch backend wishlist       │
│ 3. Merge: Add local items       │
│    to backend if missing        │
└──────┬──────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│ Redirect to index.html          │
│ (Wishlist fully synced)         │
└─────────────────────────────────┘
```

## Add to Wishlist Flow

```
┌──────────────────┐
│ User Clicks ♡    │
│ on Product Card  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│ toggleWishlistItem()   │
│ (app.js)               │
└────────┬───────────────┘
         │
         ▼
┌────────────────────────────────┐
│ WishlistService.addToWishlist()│
└────────┬───────────────────────┘
         │
         ├─── Authenticated ──────────┐
         │                             │
         │                             ▼
         │              ┌──────────────────────────┐
         │              │ POST /api/wishlist/add   │
         │              │ userId={id}&productId={} │
         │              └──────────┬───────────────┘
         │                         │
         │                         ▼
         │              ┌──────────────────────────┐
         │              │ Backend Updates MongoDB  │
         │              │ Returns updated wishlist │
         │              └──────────┬───────────────┘
         │                         │
         │                         ▼
         │              ┌──────────────────────────┐
         │              │ Update localStorage      │
         │              │ (for offline access)     │
         │              └──────────┬───────────────┘
         │                         │
         └─── Not Authenticated ───┤
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │ Update localStorage Only │
                    └──────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────────┐
                    │ Update UI                │
                    │ • Change ♡ to ❤️         │
                    │ • Update badge count     │
                    │ • Show toast message     │
                    └──────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────┐
│ API Call to Backend  │
└──────┬───────────────┘
       │
       ├─── Success ────────────┐
       │                        │
       │                        ▼
       │         ┌──────────────────────┐
       │         │ Update State         │
       │         │ Update localStorage  │
       │         │ Update UI            │
       │         └──────────────────────┘
       │
       └─── Error ─────────────┐
                                │
                                ▼
                 ┌──────────────────────────┐
                 │ Log Error to Console     │
                 └──────┬───────────────────┘
                        │
                        ▼
                 ┌──────────────────────────┐
                 │ Fallback to localStorage │
                 │ (Graceful Degradation)   │
                 └──────┬───────────────────┘
                        │
                        ▼
                 ┌──────────────────────────┐
                 │ Update UI                │
                 │ (User experience intact) │
                 └──────────────────────────┘
```

## Data Structure

### Frontend State (app.js)
```javascript
state = {
    wishlist: [1, 2, 3, 5, 8],  // Array of product IDs
    // ... other state
}
```

### localStorage
```javascript
{
    "jewel_wishlist": "[1,2,3,5,8]",
    "jewel_token": "eyJhbGc...",
    "jewel_user": "{\"id\":\"user123\",\"username\":\"john\"}"
}
```

### Backend (MongoDB)
```javascript
{
    "_id": "wishlist123",
    "userId": "user456",
    "productIds": ["1", "2", "3", "5", "8"]
}
```

## Key Components

### 1. WishlistService (wishlist-service.js)
- **Purpose**: API abstraction layer
- **Responsibilities**: 
  - Make HTTP requests to backend
  - Handle authentication
  - Manage fallback to localStorage
  - Sync data on login

### 2. App State (app.js)
- **Purpose**: Application state management
- **Responsibilities**:
  - Maintain wishlist state
  - Render UI
  - Handle user interactions
  - Call WishlistService for data operations

### 3. Auth Integration (auth.js)
- **Purpose**: Authentication flow
- **Responsibilities**:
  - Handle login/signup
  - Trigger wishlist sync
  - Store user data

## Security Considerations

```
┌─────────────────────────────────────────┐
│ Every API Request Includes:             │
│                                          │
│ Headers: {                               │
│   'Content-Type': 'application/json',   │
│   'Authorization': 'Bearer <JWT_TOKEN>' │
│ }                                        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Backend Validates:                       │
│ • Token is valid                         │
│ • Token not expired                      │
│ • userId matches authenticated user      │
│ • User has permission to access resource │
└─────────────────────────────────────────┘
```
