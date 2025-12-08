# Quick Integration Guide

## For Your index.html

Your index.html file seems to have gotten corrupted during the automated edits. Here's what you need to add:

### Step 1: Add CSS Link (in `<head>` section)

Find this line in your index.html:
```html
<link rel="stylesheet" href="./CSS/styles.css">
```

Add this line right after it:
```html
<link rel="stylesheet" href="./CSS/signup-popup.css">
```

### Step 2: Add JavaScript (before `</body>` tag)

Find this line near the end of your index.html:
```html
<script src="./JS/app.js"></script>
```

Add this line right after it:
```html
<script src="./JS/signup-popup.js"></script>
```

### Complete Example

Your `<head>` section should look like:
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="...">
    <title>Guru Jewellery - Exquisite Handcrafted Jewelry</title>
    <link rel="stylesheet" href="./CSS/styles.css">
    <link rel="stylesheet" href="./CSS/signup-popup.css">  <!-- ADD THIS -->
</head>
```

Your closing `</body>` section should look like:
```html
    <script src="./JS/app.js"></script>
    <script src="./JS/signup-popup.js"></script>  <!-- ADD THIS -->
</body>
</html>
```

## Testing

1. Open `popup-demo.html` in your browser to test the popup
2. Click "Show Popup Now" to see it immediately
3. Or wait 2 minutes for it to appear automatically
4. Test all the features

## That's It!

Once you add those two lines to your index.html, the popup will work automatically!

## Need Help?

- Check `README-POPUP.md` for full documentation
- Open `popup-demo.html` for a working example
- The popup files are:
  - `CSS/signup-popup.css` (styles)
  - `JS/signup-popup.js` (functionality)
