/**
 * ADMIN SALES MANAGEMENT
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    loadSalesData();
});

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

async function loadSalesData() {
    const totalElement = document.getElementById('totalSalesAmount');
    const tableContainer = document.getElementById('ordersTableContainer');

    try {
        // 1. Load Total Sales
        const totalSales = await OrderService.getSalesReport();
        totalElement.textContent = `₹${(totalSales || 0).toLocaleString()}`;

        // 2. Load Orders
        const orders = await OrderService.getAllOrders();
        window.currentOrders = orders; // Store globally for access
        renderOrdersTable(orders, tableContainer);

    } catch (error) {
        console.error('Error loading sales data:', error);
        showToast('Error loading data: ' + error.message);
    }
}

function renderOrdersTable(orders, container) {
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center;">No orders found.</div>';
        return;
    }

    // Sort by date desc
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const html = `
        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--color-bg); text-align: left; border-bottom: 2px solid var(--color-border);">
                    <th style="padding: 1rem;">Order ID</th>
                    <th style="padding: 1rem;">Date</th>
                    <th style="padding: 1rem;">Customer</th>
                    <th style="padding: 1rem;">Amount</th>
                    <th style="padding: 1rem;">Status</th>
                    <th style="padding: 1rem;">Payment</th>
                    <th style="padding: 1rem;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr style="border-bottom: 1px solid var(--color-border);">
                        <td style="padding: 1rem; font-family: monospace;">#${(order.orderId || order.id).toString().slice(-6)}</td>
                        <td style="padding: 1rem;">${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td style="padding: 1rem;">
                            <div style="font-weight: bold;">${order.name || 'Guest'}</div>
                            <div style="font-size: 0.85em; color: var(--color-text-muted);">${order.whatsappNumber}</div>
                        </td>
                        <td style="padding: 1rem; font-weight: bold;">₹${order.totalAmount}</td>
                        <td style="padding: 1rem;">
                            <span class="status-badge ${order.status.toLowerCase()}" 
                                  style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">
                                ${order.status}
                            </span>
                        </td>
                         <td style="padding: 1rem;">
                            <div style="font-size: 0.9em;">${order.paymentMode || '-'}</div>
                            ${order.paymentRefId ? `<div style="font-size: 0.8em; color: var(--color-text-muted);">Ref: ${order.paymentRefId}</div>` : ''}
                        </td>
                        <td style="padding: 1rem;">
                            <div style="display: flex; gap: 0.5rem;">
                                ${order.status === 'PENDING' ? `
                                    <button onclick="handleConfirmPayment('${order.id}')" class="btn-confirm" title="Confirm Payment">
                                        Confirm
                                    </button>
                                ` : ''}
                                <button onclick="window.open('https://wa.me/${order.whatsappNumber}', '_blank')" 
                                        class="btn btn--secondary" style="padding: 4px 8px; font-size: 1.2em;" title="Chat on WhatsApp">
                                    💬
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

window.handleConfirmPayment = async function (orderId) {
    const paymentRefId = prompt("Enter Payment Reference ID (e.g., UPI Transaction ID):");

    if (paymentRefId === null) return; // Cancelled
    if (!paymentRefId.trim()) {
        alert("Payment Reference ID is required to confirm payment.");
        return;
    }

    try {
        // 1. Find the order details
        const order = window.currentOrders.find(o => o.id === orderId || o.orderId === orderId);
        if (!order) {
            throw new Error("Order details not found locally. Please refresh.");
        }

        // 2. Deduct Stock
        // Note: We need to map the order object to match PlaceOrderRequestDto if structure differs.
        // Assuming 'order' has 'items' populated correctly.
        console.log("Deducting stock for order:", order);
        await InventoryService.deductStockAfterOrder(order);

        // 3. Confirm Payment
        await OrderService.confirmPayment(orderId, 'UPI', paymentRefId); // Default to UPI as per request

        showToast("Payment Confirmed & Stock Updated Successfully!");
        loadSalesData(); // Refresh
    } catch (error) {
        console.error(error);
        alert("Failed to confirm payment: " + error.message);
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
