/**
 * ADMIN INVOICES MANAGEMENT
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    loadConfirmedOrders();
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

async function loadConfirmedOrders() {
    const container = document.getElementById('ordersTableContainer');
    try {
        // Fetch all orders
        const orders = await OrderService.getAllOrders();

        // Filter for CONFIRMED orders only
        const confirmedOrders = orders.filter(order =>
            order.status === 'CONFIRMED' || order.status === 'DELIVERED' || order.status === 'SHIPPED'
        );

        if (confirmedOrders.length === 0) {
            container.innerHTML = '<div style="padding: 3rem; text-align: center;">No confirmed orders found to invoice.</div>';
            return;
        }

        // Sort by date desc
        confirmedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        renderTable(confirmedOrders, container);

    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<div style="padding: 2rem; color: red; text-align: center;">Error loading orders.</div>';
    }
}

/**
 * Render the table of orders.
 * Note: Ideally we should batch check for existing invoices to avoid N+1 requests,
 * but for this MVP we will check "on demand" or assume if it's confirmed we can generate/view.
 * To provide a better UX, let's try to fetch invoices for these orders if possible, 
 * or just provide a "View/Generate" smart button.
 */
async function renderTable(orders, container) {
    const html = `
        <table class="admin-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--color-bg); text-align: left; border-bottom: 2px solid var(--color-border);">
                    <th style="padding: 1rem;">Order ID</th>
                    <th style="padding: 1rem;">Date</th>
                    <th style="padding: 1rem;">Customer</th>
                    <th style="padding: 1rem;">Amount</th>
                    <th style="padding: 1rem;">Status</th>
                    <th style="padding: 1rem;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr style="border-bottom: 1px solid var(--color-border);">
                        <td style="padding: 1rem; font-family: monospace;">#${(order.orderId || order.id).toString().slice(-6)}</td>
                        <td style="padding: 1rem;">${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td style="padding: 1rem;">${order.name || 'Customer'}</td>
                        <td style="padding: 1rem;">₹${order.totalAmount}</td>
                        <td style="padding: 1rem;">
                            <span class="status-badge ${order.status.toLowerCase()}" 
                                  style="padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold;">
                                ${order.status}
                            </span>
                        </td>
                        <td style="padding: 1rem;">
                            <button onclick="handleInvoiceAction('${order.id}')" class="btn-view" id="btn-${order.id}">
                                Open Invoice
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

/**
 * Smart handler:
 * 1. Try to open invoice view directly.
 * 2. If it handles generation automatically or if we want to force check,
 *    we simply navigate to the preview page. The preview page can handle "Generate if not exists" 
 *    or show "Generate" button. 
 *    
 *    However, based on user requirements: "click invoice button open new page show invoice".
 *    The easiest flow is: Click -> Go to Preview Page -> Preview Page fetches invoice. 
 *    If 404, Preview Page says "Invoice not generated" and shows a "Generate Now" button.
 */
window.handleInvoiceAction = function (orderId) {
    window.location.href = `invoice-preview.html?orderId=${orderId}`;
};
