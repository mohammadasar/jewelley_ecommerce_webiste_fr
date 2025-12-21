/**
 * ============================================
 * USER MANAGEMENT JAVASCRIPT
 * ============================================
 * Handles user list fetching, searching, and CRUD (Create, Read, Update, Delete)
 */

(function () {
    'use strict';

    // Configuration
    const API_BASE_URL = 'http://localhost:8080/api/admin';
    let allUsers = [];
    let searchTimeout;

    // Check if current user is actually an admin
    async function checkAdminStatus() {
        const token = localStorage.getItem('jewel_token');
        if (!token) return;
        try {
            const response = await fetch(`${API_BASE_URL}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('=== ADMIN AUTH VERIFICATION ===');
            console.log('Status /api/admin/stats:', response.status);
            if (response.status === 403) {
                console.warn('⚠️ YOUR TOKEN DOES NOT HAVE ADMIN PRIVILEGES (403)');
            } else if (response.ok) {
                console.log('✅ Admin authorization confirmed');
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        fetchUsers();
    });

    // Setup Event Listeners
    function setupEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', toggleDarkMode);
            applySavedDarkMode();
        }

        // Back to dashboard
        const backToDashboard = document.getElementById('backToDashboard');
        if (backToDashboard) {
            backToDashboard.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        }

        // Search input
        const searchInput = document.getElementById('userSearch');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        // Modal close
        const modal = document.getElementById('userDetailModal');
        const closeBtn = document.querySelector('.close-modal');
        if (closeBtn && modal) {
            closeBtn.onclick = () => modal.style.display = 'none';
            window.onclick = (event) => {
                if (event.target == modal) modal.style.display = 'none';
            };
        }

        // Form submission
        const userEditForm = document.getElementById('userEditForm');
        if (userEditForm) {
            console.log('Form submit listener attached to:', userEditForm);
            userEditForm.addEventListener('submit', handleFormSubmit);
        } else {
            console.error('userEditForm not found!');
        }

        // Profile menu toggle
        const profileMenuToggle = document.getElementById('profileMenuToggle');
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileMenuToggle && profileDropdown) {
            profileMenuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                profileDropdown.classList.remove('show');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }

    // Fetch Users from API
    async function fetchUsers() {
        const loadingState = document.getElementById('loadingState');
        const tableBody = document.getElementById('userTableBody');
        const token = localStorage.getItem('jewel_token');

        try {
            loadingState.style.display = 'block';
            tableBody.innerHTML = '';

            const response = await fetch(`${API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Access denied. Admin privileges required to view all users.');
                }
                throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
            }

            allUsers = await response.json();

            console.log('=== FETCHED USERS FROM API ===');
            console.log('Total users:', allUsers.length);
            console.log('Raw API response:', allUsers);

            // Log each user's roles
            allUsers.forEach((user, index) => {
                console.log(`User ${index + 1} (${user.username}):`, {
                    roles: user.roles,
                    rolesType: typeof user.roles,
                    rolesIsArray: Array.isArray(user.roles),
                    rolesLength: user.roles ? user.roles.length : 'null'
                });
            });

            if (!allUsers || allUsers.length === 0) {
                loadingState.innerHTML = '<p style="color: var(--color-text-muted);">No users found in the database.</p>';
                loadingState.style.display = 'block';
                return;
            }

            renderUsers(allUsers);
            checkAdminStatus(); // Verify admin status in background
        } catch (error) {
            console.error('Error fetching users:', error);
            tableBody.innerHTML = '';
            allUsers = [];
            loadingState.innerHTML = `<p style="color: #ef4444;">❌ ${error.message}</p><p style="color: var(--color-text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Please ensure the backend is running and you have admin privileges.</p>`;
            loadingState.style.display = 'block';
        } finally {
            if (allUsers && allUsers.length > 0) {
                loadingState.style.display = 'none';
            }
        }
    }

    // Render Users to Table
    function renderUsers(users) {
        const tableBody = document.getElementById('userTableBody');
        const noResults = document.getElementById('noResults');

        tableBody.innerHTML = '';

        if (users.length === 0) {
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';

        users.forEach(user => {
            // Extract role from array and remove ROLE_ prefix
            let roleDisplay = 'USER';
            if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
                roleDisplay = user.roles[0].replace('ROLE_', '');
            }

            // Use username as primary identifier since whatsappNumber can be null
            const userId = user.username || user.whatsappNumber || user.email;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.name || 'N/A'}</td>
                <td><span class="status-badge role-${roleDisplay.toLowerCase()}">${roleDisplay}</span></td>
                <td>${user.whatsappNumber || 'N/A'}</td>
                <td>${user.address || 'N/A'}</td>
                <td>${user.district || 'N/A'}</td>
                <td>${user.state || 'N/A'}</td>
                <td>
                    <button class="action-btn edit-user-btn" data-user-id="${userId}" title="Edit Role">✏️</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Add event listeners to all edit buttons
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const userId = this.getAttribute('data-user-id');
                editUser(userId);
            });
        });
    }

    // Handle Search (Server-side with Debounce)
    function handleSearch(e) {
        const searchTerm = e.target.value.trim();

        // Clear previous timeout
        if (searchTimeout) clearTimeout(searchTimeout);

        // If search is empty, reload all users
        if (!searchTerm) {
            fetchUsers();
            return;
        }

        // Debounce: Wait 300ms after last keystroke before calling API
        searchTimeout = setTimeout(async () => {
            const token = localStorage.getItem('jewel_token');
            const loadingState = document.getElementById('loadingState');
            const tableBody = document.getElementById('userTableBody');

            try {
                loadingState.style.display = 'block';
                const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchTerm)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Search failed');

                const searchResults = await response.json();
                renderUsers(searchResults);
            } catch (error) {
                console.error('Search error:', error);
                // Fallback to client-side filtering if server fails
                const filtered = allUsers.filter(user =>
                    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.state && user.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.district && user.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (user.address && user.address.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                renderUsers(filtered);
            } finally {
                loadingState.style.display = 'none';
            }
        }, 300);
    }

    // Edit User - Simple Dialog Approach
    window.editUser = async function (userId) {
        console.log('=== EDIT USER ===');
        console.log('Editing user with ID:', userId);

        const user = allUsers.find(u =>
            u.username === userId ||
            u.whatsappNumber === userId ||
            u.email === userId
        );

        if (!user) {
            alert('User not found!');
            return;
        }

        console.log('Found user:', user);

        // Extract current role
        let currentRole = 'USER';
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            currentRole = user.roles[0].replace('ROLE_', '');
        }

        // Show user info and ask for new role
        const newRole = prompt(
            ` USERID for: ${user.id || 'N/A'}\n` +
            `Edit Role for: ${user.username || user.name}\n` +
            `Email: ${user.email || 'N/A'}\n` +
            `Current Role: ${currentRole}\n\n` +
            `Enter new role (USER or ADMIN):`,
            currentRole
        );

        if (!newRole) {
            console.log('Edit cancelled');
            return;
        }

        const roleUpper = newRole.trim().toUpperCase();
        if (roleUpper !== 'USER' && roleUpper !== 'ADMIN') {
            alert('Invalid role! Please enter USER or ADMIN');
            return;
        }

        if (roleUpper === currentRole) {
            alert('No changes made - role is the same');
            return;
        }

        // Confirm the change
        if (!confirm(`Change ${user.username}'s role from ${currentRole} to ${roleUpper}?`)) {
            return;
        }

        // Update the role - Pass the full user object
        await updateUserRole(user, roleUpper);
    };


    // ✅ Update User Role Function (FIXED)
    async function updateUserRole(user, newRole) {

        // 🔥 MUST be MongoDB ID (from 'id' property)
        const userId = user.id;

        console.log('=== UPDATE USER ROLE ===');
        console.log('Mongo User ID:', userId);
        console.log('Username:', user.username);
        console.log('New Role:', newRole);

        const token = localStorage.getItem('jewel_token');

        if (!userId) {
            alert("❌ User ID missing");
            return;
        }

        const updatedUser = {
            username: user.username,
            email: user.email,
            roles: [`ROLE_${newRole}`]
        };

        console.log(
            'API URL:',
            `${API_BASE_URL}/users/${userId}`
        );

        try {
            const response = await fetch(
                `${API_BASE_URL}/users/${userId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedUser)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Update failed: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('Success Response:', responseData);

            alert(`✅ Role updated successfully!\n${user.username} is now ${newRole}`);
            fetchUsers(); // refresh list

        } catch (error) {
            console.error('Update Error:', error);
            alert('❌ Failed to update role: ' + error.message);
        }
    }


    // Handle Form Submit (Update Role Only)
    async function handleFormSubmit(e) {
        console.log('🔥 FORM SUBMIT TRIGGERED!');
        e.preventDefault();
        console.log('Form submission prevented, proceeding with API call...');

        const token = localStorage.getItem('jewel_token');
        const userId = document.getElementById('editUserId').value;
        const username = document.getElementById('editUsername').value;
        const selectedRole = document.getElementById('editRole').value;

        // Find full user data
        const user = allUsers.find(u => u.username === username || u.username === userId);

        console.log('=== UPDATE USER ROLE ===');
        console.log('User ID:', userId);
        console.log('Username:', username);
        console.log('Selected Role:', selectedRole);

        const updatedUser = {
            username: username,
            name: user ? user.name : '',
            email: user ? user.email : '',
            roles: ['ROLE_' + selectedRole]
        };

        console.log('Request Body (UserProfileDto):', updatedUser);
        console.log('API URL:', `${API_BASE_URL}/users/${userId}`);

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedUser)
            });

            console.log('Response Status:', response.status);
            console.log('Response OK:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error Response:', errorText);
                throw new Error(`Update failed: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('Success Response:', responseData);

            alert('User role updated successfully!');
            document.getElementById('userDetailModal').style.display = 'none';
            fetchUsers();
        } catch (error) {
            console.error('Update Error:', error);
            alert('Failed to update user role: ' + (error.message || 'Unknown error'));
        }
    }

    // Delete User
    window.deleteUser = async function (userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        const token = localStorage.getItem('jewel_token');

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Delete failed');

            alert('User deleted successfully!');
            fetchUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user: ' + (error.message || 'Unknown error'));
        }
    };

    // Dark Mode Helpers
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

    function applySavedDarkMode() {
        const savedDarkMode = localStorage.getItem('jewel_darkMode');
        if (savedDarkMode === 'true') {
            document.documentElement.setAttribute('data-theme', 'dark');
            const toggle = document.querySelector('#darkModeToggle .icon');
            if (toggle) toggle.textContent = '☀️';
        }
    }

    // Logout
    function handleLogout(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('jewel_token');
            localStorage.removeItem('jewel_user');
            window.location.href = 'index.html';
        }
    }

})();
