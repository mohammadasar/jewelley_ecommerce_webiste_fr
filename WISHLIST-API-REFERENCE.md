# Wishlist API Quick Reference

## Configuration

Update this in `JS/wishlist-service.js`:
```javascript
const API_BASE_URL = 'http://localhost:8080/api/wishlist';
```

## API Endpoints

### 1. Get Wishlist
**Endpoint:** `GET /api/wishlist`

**Parameters:**
- `userId` (query parameter) - The user's ID

**Request:**
```http
GET /api/wishlist?userId=user123
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
  "id": "wishlist123",
  "userId": "user123",
  "productIds": ["1", "2", "3", "5"]
}
```

**Frontend Usage:**
```javascript
const wishlist = await WishlistService.fetchWishlist();
// Returns: ["1", "2", "3", "5"]
```

---

### 2. Add to Wishlist
**Endpoint:** `POST /api/wishlist/add`

**Parameters:**
- `userId` (query parameter) - The user's ID
- `productId` (query parameter) - The product ID to add

**Request:**
```http
POST /api/wishlist/add?userId=user123&productId=7
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
  "id": "wishlist123",
  "userId": "user123",
  "productIds": ["1", "2", "3", "5", "7"]
}
```

**Frontend Usage:**
```javascript
const success = await WishlistService.addToWishlist("7");
// Returns: true if successful
```

---

### 3. Remove from Wishlist
**Endpoint:** `POST /api/wishlist/remove`

**Parameters:**
- `userId` (query parameter) - The user's ID
- `productId` (query parameter) - The product ID to remove

**Request:**
```http
POST /api/wishlist/remove?userId=user123&productId=3
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
  "id": "wishlist123",
  "userId": "user123",
  "productIds": ["1", "2", "5", "7"]
}
```

**Frontend Usage:**
```javascript
const success = await WishlistService.removeFromWishlist("3");
// Returns: true if successful
```

---

## Backend Controller Reference

Your existing controller should look like this:

```java
@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*") // Configure appropriately for production
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<?> get(@RequestParam String userId) {
        return ResponseEntity.ok(wishlistService.getWishlist(userId));
    }

    @PostMapping("/add")
    public ResponseEntity<?> add(
        @RequestParam String userId, 
        @RequestParam String productId
    ) {
        return ResponseEntity.ok(wishlistService.add(userId, productId));
    }

    @PostMapping("/remove")
    public ResponseEntity<?> remove(
        @RequestParam String userId, 
        @RequestParam String productId
    ) {
        return ResponseEntity.ok(wishlistService.remove(userId, productId));
    }
}
```

## Backend Service Implementation

Your service should implement these methods:

```java
@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    public Wishlist getWishlist(String userId) {
        return wishlistRepository.findByUserId(userId)
            .orElseGet(() -> {
                Wishlist newWishlist = new Wishlist();
                newWishlist.setUserId(userId);
                newWishlist.setProductIds(new ArrayList<>());
                return wishlistRepository.save(newWishlist);
            });
    }

    public Wishlist add(String userId, String productId) {
        Wishlist wishlist = getWishlist(userId);
        if (!wishlist.getProductIds().contains(productId)) {
            wishlist.getProductIds().add(productId);
            return wishlistRepository.save(wishlist);
        }
        return wishlist;
    }

    public Wishlist remove(String userId, String productId) {
        Wishlist wishlist = getWishlist(userId);
        wishlist.getProductIds().remove(productId);
        return wishlistRepository.save(wishlist);
    }
}
```

## Repository Interface

```java
public interface WishlistRepository extends MongoRepository<Wishlist, String> {
    Optional<Wishlist> findByUserId(String userId);
}
```

## Frontend Service Methods

### Available Methods

```javascript
// Fetch wishlist from backend (or localStorage if offline)
WishlistService.fetchWishlist()
  .then(productIds => console.log(productIds));

// Add product to wishlist
WishlistService.addToWishlist(productId)
  .then(success => console.log('Added:', success));

// Remove product from wishlist
WishlistService.removeFromWishlist(productId)
  .then(success => console.log('Removed:', success));

// Sync local wishlist with backend (called on login)
WishlistService.syncWishlistOnLogin()
  .then(() => console.log('Synced'));

// Get local wishlist (fallback)
const localWishlist = WishlistService.getLocalWishlist();
```

## Error Handling

All API calls include try-catch blocks and fallback to localStorage:

```javascript
try {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Process response
} catch (error) {
    console.error('Error:', error);
    // Fallback to localStorage
    return fallbackMethod();
}
```

## Authentication

### User ID Extraction

```javascript
function getUserId() {
    const user = AuthState?.getCurrentUser();
    return user?.id || null;
}
```

### JWT Token

```javascript
const token = localStorage.getItem('jewel_token');
headers: {
    'Authorization': token ? `Bearer ${token}` : ''
}
```

## Testing with cURL

### Get Wishlist
```bash
curl -X GET "http://localhost:8080/api/wishlist?userId=user123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Add to Wishlist
```bash
curl -X POST "http://localhost:8080/api/wishlist/add?userId=user123&productId=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Remove from Wishlist
```bash
curl -X POST "http://localhost:8080/api/wishlist/remove?userId=user123&productId=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Common Issues

### CORS Error
**Problem:** Browser blocks request due to CORS policy

**Solution:** Add CORS configuration to backend:
```java
@CrossOrigin(origins = "http://localhost:3000")
```

### 401 Unauthorized
**Problem:** JWT token is missing or invalid

**Solution:** 
- Check if user is logged in
- Verify token in localStorage
- Check token expiration

### User ID Not Found
**Problem:** User object doesn't have `id` field

**Solution:** Ensure backend returns user object with `id`:
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "user123",
    "username": "john",
    "role": "USER"
  }
}
```

### Network Error
**Problem:** Cannot connect to backend

**Solution:**
- Verify backend is running
- Check API_BASE_URL in wishlist-service.js
- System automatically falls back to localStorage

## Production Checklist

- [ ] Update API_BASE_URL to production URL
- [ ] Configure CORS for production domain
- [ ] Enable HTTPS for API calls
- [ ] Implement rate limiting on backend
- [ ] Add request validation
- [ ] Set up error monitoring
- [ ] Test offline functionality
- [ ] Verify JWT token expiration handling
