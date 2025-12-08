# NEW FEATURES INTEGRATION GUIDE

## Overview
This document explains the new features added to your Guru Jewellery e-commerce website:

1. **User Profile Menu** (Desktop + Mobile)
2. **Admin Panel** (Frontend UI)
3. **Updated Signup Popup** (40-second delay)
4. **Authentication State Management**

---

## 📋 Files Added/Modified

### New Files Created:
1. `admin.html` - Admin panel page
2. `CSS/admin-panel.css` - Admin panel styles
3. `JS/admin-panel.js` - Admin panel logic
4. `JS/auth-state.js` - Authentication state manager

### Modified Files:
1. `JS/signup-popup.js` - Updated delay to 40 seconds + JWT check
2. `index.html` - **NEEDS MANUAL UPDATE** (see instructions below)

---

## 🔧 REQUIRED: Manual Updates to index.html

### Step 1: Add CSS Link
In the `<head>` section, add the admin-panel.css stylesheet:

```html
<head>
    ...
    <link rel="stylesheet" href="./CSS/styles.css">
    <link rel="stylesheet" href="./CSS/signup-popup.css">
    <link rel="stylesheet" href="./CSS/admin-panel.css">  <!-- ADD THIS LINE -->
</head>
```

### Step 2: Add Profile Menu to Navbar
Replace the `nav__actions` div (around line 34-49) with this code:

```html
<!-- Navigation Actions -->
<div class="nav__actions">
    <button class="nav__action" id="darkModeToggle" aria-label="Toggle dark mode" title="Toggle dark mode">
        <span class="icon">🌙</span>
    </button>

    <button class="nav__action" id="wishlistToggle" aria-label="Wishlist" title="View wishlist">
        <span class="icon">❤️</span>
        <span class="badge" id="wishlistBadge" aria-live="polite">0</span>
    </button>

    <button class="nav__action" id="cartToggle" aria-label="Shopping cart" title="View cart">
        <span class="icon">🛍️</span>
        <span class="badge" id="cartBadge" aria-live="polite">0</span>
    </button>

    <!-- Profile Menu (Desktop) / Login Button -->
    <div class="profile-menu-container" id="profileMenuContainer">
        <!-- Logged In: Profile Menu -->
        <button class="nav__action" id="profileMenuToggle" aria-label="Profile menu" title="Profile" style="display: none;">
            <span class="icon">👤</span>
        </button>
        <div class="profile-dropdown" id="profileDropdown">
            <a href="#" class="profile-dropdown__item" id="myProfile">
                <span class="icon">👤</span> My Profile
            </a>
            <a href="#" class="profile-dropdown__item" id="myOrders">
                <span class="icon">📦</span> My Orders
            </a>
            <a href="admin.html" class="profile-dropdown__item admin-only" id="adminPanel" style="display: none;">
                <span class="icon">⚙️</span> Admin Panel
            </a>
            <hr class="profile-dropdown__divider">
            <a href="#" class="profile-dropdown__item" id="logoutBtn">
                <span class="icon">🚪</span> Logout
            </a>
        </div>

        <!-- Not Logged In: Login/Signup Button -->
        <a href="login.html" class="btn-login" id="loginSignupBtn" style="display: none;">
            Login / Signup
        </a>
    </div>
</div>
```

### Step 3: Add JavaScript Files
Before the closing `</body>` tag, add the auth-state.js script:

```html
    <script src="./JS/app.js"></script>
    <script src="./JS/signup-popup.js"></script>
    <script src="./JS/auth-state.js"></script>  <!-- ADD THIS LINE -->

</body>
</html>
```

### Step 4: Add Login Button Styles
Add this CSS to your `CSS/styles.css` or `CSS/admin-panel.css`:

```css
/* Login/Signup Button */
.btn-login {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.btn-login:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
```

---

## ✨ Features Explanation

### 1. User Profile Menu

**Desktop Behavior:**
- When logged in: Shows profile icon (👤) in navbar
- Clicking icon opens dropdown with:
  - My Profile
  - My Orders
  - Admin Panel (only if user role = "ADMIN")
  - Logout

**When NOT logged in:**
- Shows "Login / Signup" button instead of profile icon

**Mobile Behavior:**
- Same as desktop (dropdown menu)
- You can customize to show in hamburger menu if needed

### 2. Admin Panel

**Access:**
- URL: `admin.html`
- Only accessible if user has `role: "ADMIN"` in localStorage
- Automatically redirects non-admin users to index.html

**Dashboard Sections:**
1. **Reports** - View sales reports and analytics
2. **Sales** - Track revenue and transactions
3. **Stock** - Manage inventory levels
4. **User Details** - View customer accounts
5. **Invoice** - Generate and manage invoices
6. **Product Management** - CRUD operations for products

**Backend Integration:**
- Each section has placeholder API endpoints documented
- Replace placeholders with actual API calls to your backend
- API base URL: `http://localhost:8080/api/admin`

### 3. Signup Popup

**Updated Behavior:**
- Shows after **40 seconds** (changed from 60 seconds)
- Does NOT show if:
  - User is logged in (JWT token exists in localStorage)
  - User has closed the popup before
  - User has signed up

**localStorage Keys:**
- `jewel_token` - JWT authentication token
- `user_signed_up` - Marks if user has signed up
- `popup_closed` - Marks if user closed the popup

### 4. Authentication State Management

**How It Works:**
- `auth-state.js` checks for `jewel_token` in localStorage
- Updates navbar to show profile menu OR login button
- Checks user role to show/hide Admin Panel link

**User Object Structure:**
```javascript
{
  "username": "john_doe",
  "email": "john@example.com",
  "role": "ADMIN" // or "USER"
}
```

---

## 🔐 Backend Integration

### Login/Signup Flow:
When user logs in successfully, your backend should return:

```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "ADMIN" // or "USER"
  }
}
```

The existing `auth.js` already handles this and stores:
- `jewel_token` → JWT token
- `jewel_user` → User object (JSON string)

### Admin API Endpoints:
Your backend should implement these endpoints:

```
GET  /api/admin/reports    - Get sales reports
GET  /api/admin/sales      - Get sales data
GET  /api/admin/stock      - Get stock levels
GET  /api/admin/users      - Get user list
GET  /api/admin/invoices   - Get invoices
GET  /api/admin/products   - List products
POST /api/admin/products   - Create product
PUT  /api/admin/products/:id - Update product
DELETE /api/admin/products/:id - Delete product
```

All requests should include the JWT token in headers:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('jewel_token')}`
}
```

---

## 🎨 Styling Notes

### Profile Dropdown:
- Uses existing CSS variables from your theme
- Supports dark mode automatically
- Responsive design included

### Admin Panel:
- Modern card-based layout
- Gradient buttons matching your brand
- Fully responsive (mobile, tablet, desktop)

### Login Button:
- Gradient background matching your theme
- Hover animations
- Responsive sizing

---

## 🧪 Testing

### Test Profile Menu:
1. **Not Logged In:**
   - Should see "Login / Signup" button
   - No profile icon visible

2. **Logged In as USER:**
   - Should see profile icon (👤)
   - Dropdown shows: My Profile, My Orders, Logout
   - No "Admin Panel" option

3. **Logged In as ADMIN:**
   - Should see profile icon (👤)
   - Dropdown shows: My Profile, My Orders, **Admin Panel**, Logout

### Test Admin Panel:
1. Try accessing `admin.html` without login → Redirects to login.html
2. Login as USER → Redirects to index.html
3. Login as ADMIN → Shows admin dashboard

### Test Signup Popup:
1. Clear localStorage
2. Visit index.html
3. Wait 40 seconds → Popup appears
4. Close popup → Never shows again
5. Login → Popup never shows

---

## 📱 Mobile Considerations

The profile menu works on mobile, but you may want to add it to the hamburger menu instead. To do this:

1. Add the profile menu items inside your mobile menu
2. Hide the desktop profile dropdown on mobile
3. Use CSS media queries to control visibility

Example:
```css
@media (max-width: 768px) {
  .profile-menu-container {
    /* Customize for mobile */
  }
}
```

---

## 🐛 Troubleshooting

### Profile menu not showing:
- Check if `auth-state.js` is loaded
- Check browser console for errors
- Verify `jewel_token` exists in localStorage

### Admin panel redirecting:
- Check user role in localStorage: `localStorage.getItem('jewel_user')`
- Ensure role is exactly "ADMIN" (case-sensitive)

### Popup not appearing:
- Clear localStorage
- Check console for errors
- Verify 40 seconds have passed

---

## 📝 Summary

**What's Working:**
✅ Admin panel page created
✅ Profile menu dropdown styled
✅ Signup popup updated to 40 seconds
✅ JWT-based authentication state management
✅ Role-based access control (ADMIN vs USER)

**What You Need to Do:**
1. Manually update `index.html` (3 simple changes)
2. Add login button CSS
3. Connect backend API endpoints
4. Test with real user data

---

## 🚀 Next Steps

1. Update `index.html` with the code snippets above
2. Test the profile menu with mock data
3. Implement backend API endpoints
4. Test admin panel with real data
5. Customize mobile menu (optional)

---

**Need Help?**
- Check browser console for errors
- Verify localStorage values
- Ensure all script files are loaded in correct order
