/**
 * ADMIN INVENTORY MANAGEMENT
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    initializeInventory();
});

// State
let allInventory = [];
let lowStockInventory = [];
let currentFilter = 'all';

function checkAdminAccess() {
    const userStr = localStorage.getItem('jewel_user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'ADMIN') {
        alert('Access denied');
        window.location.href = 'index.html';
    }
}

async function initializeInventory() {
    setupEventListeners();
    await loadInventoryData();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('Filter clicked:', e.target.dataset.filter);
            // Remove active class from all
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked
            e.target.classList.add('active');

            currentFilter = e.target.dataset.filter;
            renderInventoryTable();
        });
    });

    // Search Input
    const searchInput = document.getElementById('inventorySearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderInventoryTable(e.target.value);
        });
    }

    // Modal Actions
    // Handled via inline onclick to ensure reliability
    /*
    const modal = document.getElementById('stockModal');
    const cancelBtn = document.getElementById('cancelStockBtn');
    const confirmBtn = document.getElementById('confirmStockBtn');
    // ... listeners removed ...
    */
}

async function loadInventoryData() {
    const container = document.getElementById('inventoryTableContainer');

    try {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--color-text-muted);">Loading inventory...</div>';

        // Fetch all data
        allInventory = await InventoryService.getAllInventories();

        // Fetch Low Stock
        try {
            lowStockInventory = await InventoryService.getLowStockAlerts();
        } catch (e) {
            console.warn('Error fetching low stock:', e);
            lowStockInventory = [];
        }

        // Update Stats
        updateStats();

        // Render Table
        renderInventoryTable();

    } catch (error) {
        console.error('Error loading inventory:', error);
        container.innerHTML = `<div style="padding: 2rem; text-align: center; color: red;">Error: ${error.message}</div>`;
        showToast('Error loading inventory data');
    }
}

function updateStats() {
    const totalEl = document.getElementById('totalProducts');
    const availableEl = document.getElementById('availableStock');
    const outOfStockEl = document.getElementById('outOfStock');
    const lowStockEl = document.getElementById('lowStockCount');

    if (!allInventory) return;

    totalEl.textContent = allInventory.length;
    availableEl.textContent = allInventory.filter(i => i.quantity > 0).length;
    outOfStockEl.textContent = allInventory.filter(i => i.quantity <= 0).length;
    if (lowStockEl) lowStockEl.textContent = lowStockInventory.length;
}

function renderInventoryTable(searchQuery = '') {
    const container = document.getElementById('inventoryTableContainer');
    const query = searchQuery.toLowerCase().trim();

    if (!allInventory || allInventory.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center;">No inventory records found.</div>';
        return;
    }

    // Filter Data
    let filteredData = allInventory.filter(item => {
        // Search Filter
        const matchesSearch = (item.productName || '').toLowerCase().includes(query) ||
            (item.sku || '').toLowerCase().includes(query);

        // Category/Status Filter
        let matchesStatus = true;
        if (currentFilter === 'available') {
            matchesStatus = item.quantity > 0;
        } else if (currentFilter === 'out-of-stock') {
            matchesStatus = item.quantity <= 0;
        } else if (currentFilter === 'low-stock') {
            matchesStatus = lowStockInventory.some(low => low.productId === item.productId);
        }

        return matchesSearch && matchesStatus;
    });

    if (filteredData.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center;">No products match your filter.</div>';
        return;
    }

    const html = `
        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--color-bg); text-align: left; border-bottom: 2px solid var(--color-border);">
                    <th style="padding: 1rem;">Product</th>
                    <th style="padding: 1rem;">SKU</th>
                    <th style="padding: 1rem;">Stock</th>
                    <th style="padding: 1rem;">Status</th>
                    <th style="padding: 1rem;">Last Updated</th>
                    <th style="padding: 1rem;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredData.map(item => `
                    <tr style="border-bottom: 1px solid var(--color-border);">
                        <td style="padding: 1rem;">
                            <div class="product-cell">
                                <div style="font-weight: 500;">${item.productName}</div>
                            </div>
                        </td>
                        <td style="padding: 1rem; font-family: monospace; color: var(--color-text-muted);">${item.sku || '-'}</td>
                        <td style="padding: 1rem; font-weight: bold;">
                            ${item.quantity}
                        </td>
                        <td style="padding: 1rem;">
                            <span class="status-badge ${item.quantity > 0 ? 'confirmed' : 'cancelled'}" 
                                  style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; background-color: ${item.quantity > 0 ? '#dbeafe' : '#fee2e2'}; color: ${item.quantity > 0 ? '#1e40af' : '#991b1b'};">
                                ${item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </td>
                        <td style="padding: 1rem; font-size: 0.9em; color: var(--color-text-muted);">
                            ${item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '-'}
                        </td>
                        <td style="padding: 1rem;">
                            <button onclick="openStockModal('${item.productId}', '${item.productName.replace(/'/g, "\\'")}', ${item.quantity})" 
                                    class="btn btn--primary btn-update">
                                Update Stock
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// Modal Logic
let currentEditProductId = null;

window.openStockModal = function (productId, productName, currentStock) {
    console.log('Opening modal for:', productId, productName, currentStock);
    currentEditProductId = productId;

    document.getElementById('modalProductName').textContent = `Product: ${productName}`;
    document.getElementById('newStockQuantity').value = currentStock;

    const modal = document.getElementById('stockModal');
    modal.classList.add('show');

    // Focus input
    setTimeout(() => document.getElementById('newStockQuantity').focus(), 100);
};

window.closeStockModal = function () {
    const modal = document.getElementById('stockModal');
    modal.classList.remove('show');
};

window.handleStockUpdateSubmit = async function () {
    console.log('Update func called');
    // alert('Update triggered'); // DEBUG: Uncomment if clicks are still not registering

    if (!currentEditProductId) {
        console.error('No product ID for edit');
        return;
    }

    const quantityInput = document.getElementById('newStockQuantity');
    const newQuantity = parseInt(quantityInput.value);

    if (isNaN(newQuantity) || newQuantity < 0) {
        alert('Please enter a valid non-negative quantity.');
        return;
    }

    const confirmBtn = document.getElementById('confirmStockBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Updating...';

    try {
        await InventoryService.updateStock(currentEditProductId, newQuantity);

        showToast('Stock updated successfully');
        window.closeStockModal();

        // Refresh Data
        await loadInventoryData();

    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update stock: ' + error.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Update Stock';
        currentEditProductId = null;
    }
};

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } else {
        alert(message);
    }
}
