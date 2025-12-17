/**
 * ADMIN REPORTS & ANALYTICS
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAdminAccess();
    loadReportsData();
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

async function loadReportsData() {
    try {
        // Fetch all data in parallel
        const [totalRevenue, orders] = await Promise.all([
            OrderService.getSalesReport(),
            OrderService.getAllOrders()
        ]);

        updateMetrics(totalRevenue, orders);

    } catch (error) {
        console.error('Error loading reports:', error);
        alert('Failed to load reports data');
    }
}

function updateMetrics(revenue, orders) {
    // 1. Total Revenue
    animateValue(document.getElementById('totalRevenue'), revenue, '₹');

    // 2. Total Orders
    animateValue(document.getElementById('totalOrders'), orders.length);

    // 3. Pending Orders
    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    document.getElementById('pendingOrders').textContent = pendingCount;

    // 4. Avg Order Value (Revenue / Confirmed Orders count)
    const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED');
    const avgValue = confirmedOrders.length > 0 ? (revenue / confirmedOrders.length) : 0;
    document.getElementById('avgOrderValue').textContent = `₹${Math.round(avgValue).toLocaleString()}`;

    // 5. Status Breakdown
    const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {});

    const statusContainer = document.getElementById('statusBreakdown');
    statusContainer.innerHTML = Object.entries(statusCounts).map(([status, count]) => `
        <div class="status-row">
            <span style="text-transform: capitalize;">${status.toLowerCase()}</span>
            <span style="font-weight: bold;">${count}</span>
        </div>
        <div style="background: var(--color-bg); height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: var(--color-primary); width: ${(count / orders.length) * 100}%; height: 100%;"></div>
        </div>
    `).join('');
}

function animateValue(obj, end, prefix = '') {
    // Simple direct update for now
    obj.textContent = `${prefix}${end.toLocaleString()}`;
}
