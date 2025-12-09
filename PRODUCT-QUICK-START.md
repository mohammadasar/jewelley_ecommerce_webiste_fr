# Product Management - Quick Start Guide

## 🚀 Getting Started

### Step 1: Access Product Management
1. Login to your admin account
2. Navigate to Admin Panel
3. Click **"Manage Products"** button
4. You'll be redirected to the Product Management page

### Step 2: Add Your First Product

**Fill in the form with product details:**

#### Basic Information
- Product Name: e.g., "Diamond Necklace"
- SKU: e.g., "JWL-NK-001"
- Brand: e.g., "Guru Jewellery"
- Description: Detailed product description

#### Category
- Select from dropdown (loaded from your database)
- Add sub-category if needed

#### Pricing
- Enter MRP (Maximum Retail Price)
- Enter Selling Price
- Discount % is **auto-calculated**!

#### Attributes
- Material: Alloy, Brass, Copper, etc.
- Color: Gold, Rose Gold, Silver, etc.
- Plating, Size, Occasion

#### Inventory
- Set quantity
- Check/uncheck "In Stock"

#### Images
- Enter image URLs (one per line)
- First image will be the main display image

**Click "Add Product" to save!**

---

## 📋 Product Grid Features

Each product card shows:
- Product image
- Product name
- Category
- Description (truncated)
- Price with discount badge
- Stock status
- SKU and quantity
- **Edit** (✏️) and **Delete** (🗑️) buttons

---

## 🔍 Search & Filter

**Search Box:**
- Type product name
- Results update in real-time

**Category Filter:**
- Select category from dropdown
- View only products in that category

**Statistics:**
- Total products count
- In-stock products count

---

## ✏️ Edit Product

1. Click the **edit icon** (✏️) on any product
2. Form will auto-fill with product data
3. Make your changes
4. Click **"Update Product"**
5. Product is updated in database!

---

## 🗑️ Delete Product

1. Click the **delete icon** (🗑️)
2. Confirm deletion in popup
3. Product is permanently removed

---

## 💡 Tips & Tricks

### Auto-Calculate Discount
- Just enter MRP and Selling Price
- Discount % calculates automatically!

### Multiple Images
- Add multiple image URLs (one per line)
- First image is the main product image
- Others can be viewed in product details

### Form Toggle
- Click "Hide Form" to collapse the form
- Useful when browsing products
- Click "Show Form" to expand again

### Reset Form
- Click "Reset Form" to clear all fields
- Useful when adding multiple products

### Search Tips
- Search works on product name
- Case-insensitive
- Real-time results

---

## 🔧 Configuration

### Update Backend URL

Edit `JS/product-service.js`:
```javascript
const API_BASE_URL = 'http://localhost:8080/api/products';
```

Change to your backend URL!

---

## ✅ Checklist Before Going Live

- [ ] Backend is running
- [ ] API URLs are configured correctly
- [ ] CORS is enabled on backend
- [ ] Categories are added to database
- [ ] Test add product
- [ ] Test edit product
- [ ] Test delete product
- [ ] Test search
- [ ] Test category filter
- [ ] Test on mobile device

---

## 🎯 Product Form Fields Reference

| Field | Required | Type | Example |
|-------|----------|------|---------|
| Product Name | ✅ | Text | "Diamond Necklace" |
| Description | ✅ | Textarea | "Beautiful 18K gold..." |
| Category | ✅ | Dropdown | Select from list |
| Sub Category | ❌ | Text | "Statement Necklace" |
| MRP | ✅ | Number | 5000 |
| Selling Price | ✅ | Number | 3500 |
| Discount % | Auto | Number | 30 (auto-calculated) |
| Material | ❌ | Dropdown | "Gold" |
| Color | ❌ | Dropdown | "Rose Gold" |
| Plating | ❌ | Dropdown | "1g gold plated" |
| Size | ❌ | Dropdown | "Free size" |
| Occasion | ❌ | Dropdown | "Bridal" |
| Quantity | ✅ | Number | 10 |
| In Stock | ✅ | Checkbox | Checked |
| SKU | ❌ | Text | "JWL-NK-001" |
| Brand | ❌ | Text | "Guru Jewellery" |
| Image URLs | ❌ | Textarea | One URL per line |

---

## 🐛 Common Issues

### "Products not loading"
- Check backend is running
- Verify API URL in `product-service.js`
- Check browser console for errors

### "Cannot add product"
- Fill all required fields (marked with *)
- Check authentication (must be admin)
- Verify backend is accessible

### "Images not showing"
- Use valid image URLs
- Check image URL is accessible
- Verify CORS for image host

---

## 📱 Mobile Support

- Fully responsive design
- Works on all devices
- Touch-friendly buttons
- Optimized for mobile browsing

---

## 🎨 Features Highlight

✨ **Modern UI** - Clean, professional interface
🔍 **Real-time Search** - Instant results
📊 **Auto-calculations** - Discount % calculated automatically
🎯 **Category Management** - Organized by categories
📱 **Responsive** - Works on all devices
🔒 **Secure** - Admin-only access
⚡ **Fast** - Optimized performance
💾 **Database Sync** - All changes saved to MongoDB

---

## 🚀 Next Steps

1. Add your categories to the database
2. Start adding products
3. Test all features
4. Share with your team
5. Go live!

---

**Need Help?** Check `PRODUCT-MANAGEMENT-GUIDE.md` for detailed documentation!
