/**
 * ============================================
 * ADMIN PANEL JAVASCRIPT
 * ============================================
 * Handles admin dashboard functionality and API calls
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:8080/api/admin';

    // Check if user is logged in and is admin
    function checkAdminAccess() {
        const token = localStorage.getItem('jewel_token');
        const userStr = localStorage.getItem('jewel_user');

        if (!token || !userStr) {
            alert('Please login to access the admin panel');
            window.location.href = 'login.html';
            return false;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'ADMIN') {
                alert('Access denied. Admin privileges required.');
                window.location.href = 'index.html';
                return false;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            window.location.href = 'login.html';
            return false;
        }

        return true;
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        // Check admin access
        if (!checkAdminAccess()) return;

        // Setup event listeners
        setupEventListeners();

        // Load user info
        loadUserInfo();
    });

    // Setup Event Listeners
    function setupEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', toggleDarkMode);
            // Apply saved dark mode preference
            const savedDarkMode = localStorage.getItem('jewel_darkMode');
            if (savedDarkMode === 'true') {
                document.documentElement.setAttribute('data-theme', 'dark');
                darkModeToggle.querySelector('.icon').textContent = '☀️';
            }
        }

        // Back to home
        const backToHome = document.getElementById('backToHome');
        if (backToHome) {
            backToHome.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }

        // Profile menu toggle
        const profileMenuToggle = document.getElementById('profileMenuToggle');
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileMenuToggle && profileDropdown) {
            profileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileMenuToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                    profileDropdown.classList.remove('show');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        // Profile and Orders links
        const myProfile = document.getElementById('myProfile');
        const myOrders = document.getElementById('myOrders');

        if (myProfile) {
            myProfile.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Profile page - Coming soon!');
            });
        }

        if (myOrders) {
            myOrders.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Orders page - Coming soon!');
            });
        }
    }

    // Load User Info
    function loadUserInfo() {
        const userStr = localStorage.getItem('jewel_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                console.log('Logged in as:', user.username, '(Admin)');
            } catch (error) {
                console.error('Error loading user info:', error);
            }
        }
    }

    // Toggle Dark Mode
    function toggleDarkMode() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('jewel_darkMode', 'false');
            document.querySelector('#darkModeToggle .icon').textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('jewel_darkMode', 'true');
            document.querySelector('#darkModeToggle .icon').textContent = '☀️';
        }
    }

    // Handle Logout
    function handleLogout(e) {
        e.preventDefault();

        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('jewel_token');
            localStorage.removeItem('jewel_user');
            window.location.href = 'index.html';
        }
    }

    // Load Section (Placeholder for API calls)
    window.loadSection = function (section) {
        // Redirect to product management page for products section
        if (section === 'products') {
            window.location.href = 'product-management.html';
            return;
        }

        const adminContent = document.getElementById('adminContent');
        const contentTitle = document.getElementById('contentTitle');
        const contentBody = document.getElementById('contentBody');

        // Show content section
        adminContent.style.display = 'block';

        // Scroll to content
        adminContent.scrollIntoView({ behavior: 'smooth' });

        // Update title based on section
        const titles = {
            reports: 'Reports & Analytics',
            sales: 'Sales Management',
            stock: 'Stock Management',
            users: 'User Management',
            invoices: 'Invoice Management',
            products: 'Product Management (CRUD)'
        };

        contentTitle.textContent = titles[section] || 'Section';

        // Show loading state
        contentBody.innerHTML = '<div class="loading">Loading...</div>';

        // Simulate API call (replace with actual API endpoint)
        setTimeout(() => {
            loadSectionContent(section, contentBody);
        }, 500);
    };

    // Close Section
    window.closeSection = function () {
        const adminContent = document.getElementById('adminContent');
        adminContent.style.display = 'none';

        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Load Section Content (Placeholder - Replace with actual API calls)
    function loadSectionContent(section, container) {
        const token = localStorage.getItem('jewel_token');

        // Placeholder content for each section
        const placeholders = {
            reports: `
                <div class="section-placeholder">
                    <h3>📊 Reports Dashboard</h3>
                    <p>API Endpoint: <code>GET ${API_BASE_URL}/reports</code></p>
                    <p>This section will display sales reports, analytics, and performance metrics.</p>
                    <div class="api-info">
                        <strong>Expected Response:</strong>
                        <pre>{
  "totalSales": 125000,
  "totalOrders": 450,
  "averageOrderValue": 278,
  "topProducts": [...]
}</pre>
                    </div>
                </div>
            `,
            sales: async (container) => {
                container.innerHTML = '<div class="loading">Loading Sales...</div>';
                try {
                    const orders = await OrderService.getAllOrders();

                    if (!orders || orders.length === 0) {
                        container.innerHTML = '<p>No orders found.</p>';
                        return;
                    }

                    const tableHtml = `
                        <div style="overflow-x: auto;">
                            <table class="admin-table" style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                                <thead>
                                    <tr style="background: var(--color-bg); text-align: left;">
                                        <th style="padding: 1rem;">Order ID</th>
                                        <th style="padding: 1rem;">Date</th>
                                        <th style="padding: 1rem;">Customer</th>
                                        <th style="padding: 1rem;">Items</th>
                                        <th style="padding: 1rem;">Amount</th>
                                        <th style="padding: 1rem;">Status</th>
                                        <th style="padding: 1rem;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${orders.map(order => `
                                        <tr style="border-bottom: 1px solid var(--color-border);">
                                            <td style="padding: 1rem;">${order.orderId || order.id}</td>
                                            <td style="padding: 1rem;">${new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td style="padding: 1rem;">
                                                <div>${order.whatsappNumber}</div>
                                                <div style="font-size: 0.8em; color: gray;">${order.district}, ${order.state}</div>
                                            </td>
                                            <td style="padding: 1rem;">
                                                ${order.items.map(i => `<div>${i.quantity}x ${i.title || i.productName}</div>`).join('')}
                                            </td>
                                            <td style="padding: 1rem; font-weight: bold;">₹${order.totalAmount}</td>
                                            <td style="padding: 1rem;">
                                                <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                                            </td>
                                            <td style="padding: 1rem;">
                                                <button onclick="window.location.href='https://wa.me/${order.whatsappNumber}'" class="btn-icon">💬</button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                    container.innerHTML = tableHtml;
                } catch (error) {
                    console.error(error);
                    container.innerHTML = '<p style="color: red;">Error loading orders: ' + error.message + '</p>';
                }
            },
            stock: `
                <div class="section-placeholder">
                    <h3>📦 Stock Management</h3>
                    <p>API Endpoint: <code>GET ${API_BASE_URL}/stock</code></p>
                    <p>Manage inventory, stock levels, and product availability.</p>
                    <div class="api-info">
                        <strong>Expected Response:</strong>
                        <pre>{
  "products": [
    {
      "id": 1,
      "name": "Diamond Ring",
      "stock": 15,
      "lowStock": false
    }
  ]
}</pre>
                    </div>
                </div>
            `,
            users: `
                <div class="section-placeholder">
                    <h3>👥 User Management</h3>
                    <p>API Endpoint: <code>GET ${API_BASE_URL}/users</code></p>
                    <p>View and manage customer accounts and information.</p>
                    <div class="api-info">
                        <strong>Expected Response:</strong>
                        <pre>{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "USER"
    }
  ]
}</pre>
                    </div>
                </div>
            `,
            invoices: `
                <div class="section-placeholder">
                    <h3>🧾 Invoice Management</h3>
                    <p>API Endpoint: <code>GET ${API_BASE_URL}/invoices</code></p>
                    <p>Generate and manage customer invoices.</p>
                    <div class="api-info">
                        <strong>Expected Response:</strong>
                        <pre>{
  "invoices": [
    {
      "id": 1,
      "orderId": 123,
      "amount": 2500,
      "date": "2025-12-08"
    }
  ]
}</pre>
                    </div>
                </div>
            `,
            products: `
                <div class="section-placeholder">
                    <h3>💎 Product Management (CRUD)</h3>
                    <p>API Endpoints:</p>
                    <ul>
                        <li><code>GET ${API_BASE_URL}/products</code> - List all products</li>
                        <li><code>POST ${API_BASE_URL}/products</code> - Create product</li>
                        <li><code>PUT ${API_BASE_URL}/products/:id</code> - Update product</li>
                        <li><code>DELETE ${API_BASE_URL}/products/:id</code> - Delete product</li>
                    </ul>
                    <p>Create, update, and delete products.</p>
                    <div class="api-info">
                        <strong>Example Product Object:</strong>
                        <pre>{
  "id": 1,
  "title": "Diamond Ring",
  "description": "18K gold ring",
  "price": 2500,
  "category": "rings",
  "stock": 15
}</pre>
                    </div>
                </div>
            `
        };

        if (typeof placeholders[section] === 'function') {
            placeholders[section](container);
        } else {
            container.innerHTML = placeholders[section] || '<p>Section content not found</p>';
        }

        // Add some basic styling for placeholders
        const style = `
            <style>
                .section-placeholder {
                    padding: 2rem;
                }
                .section-placeholder h3 {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: var(--color-text);
                }
                .section-placeholder p {
                    margin-bottom: 1rem;
                    color: var(--color-text-muted);
                }
                .section-placeholder code {
                    background: var(--color-bg);
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: monospace;
                    color: var(--color-primary);
                }
                .section-placeholder ul {
                    margin-left: 2rem;
                    margin-bottom: 1rem;
                }
                .section-placeholder ul li {
                    margin-bottom: 0.5rem;
                    color: var(--color-text-muted);
                }
                .api-info {
                    background: var(--color-bg);
                    padding: 1rem;
                    border-radius: 0.5rem;
                    margin-top: 1rem;
                }
                .api-info pre {
                    background: var(--color-surface);
                    padding: 1rem;
                    border-radius: 0.25rem;
                    overflow-x: auto;
                    font-family: monospace;
                    font-size: 0.875rem;
                    color: var(--color-text);
                    margin-top: 0.5rem;
                }
                .loading {
                    text-align: center;
                    padding: 3rem;
                    font-size: 1.25rem;
                    color: var(--color-text-muted);
                }
            </style>
        `;

        if (!document.getElementById('admin-placeholder-styles')) {
            const styleEl = document.createElement('div');
            styleEl.id = 'admin-placeholder-styles';
            styleEl.innerHTML = style;
            document.head.appendChild(styleEl);
        }
    }

})();
