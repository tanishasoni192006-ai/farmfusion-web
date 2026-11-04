/**
 * FarmFusion Web – Expense Tracker & Chart Analytics
 * Full CRUD, Chart.js visualizations, and CSV export.
 */

let allExpensesData = [];
let doughnutChartInstance = null;
let barChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load
    loadExpenses();

    // 2. Set default date to today
    const expDateInput = document.getElementById('expDate');
    if (expDateInput) {
        expDateInput.value = new Date().toISOString().split('T')[0];
    }

    // 3. Filter Controls
    const btnFilter = document.getElementById('btnFilterExpenses');
    const btnReset = document.getElementById('btnResetFilters');

    if (btnFilter) {
        btnFilter.addEventListener('click', loadExpenses);
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            document.getElementById('expenseCategoryFilter').value = 'All';
            document.getElementById('expStartDate').value = '';
            document.getElementById('expEndDate').value = '';
            loadExpenses();
        });
    }

    // 4. Modal Open Reset
    const btnOpenAdd = document.getElementById('btnOpenAddExpense');
    if (btnOpenAdd) {
        btnOpenAdd.addEventListener('click', () => {
            document.getElementById('expenseForm').reset();
            document.getElementById('expenseEditId').value = '';
            document.getElementById('expenseModalTitle').innerHTML = '<i class="bi bi-wallet2 me-2"></i> Log Cultivation Expense';
            document.getElementById('expDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('expPaymentMethod').value = 'Cash';
        });
    }

    // 5. Form Submit (Create or Update)
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleSaveExpense);
    }

    // 6. CSV Export Trigger
    const btnExport = document.getElementById('btnExportCsv');
    if (btnExport) {
        btnExport.addEventListener('click', exportExpensesToCsv);
    }
});

async function loadExpenses() {
    const category = document.getElementById('expenseCategoryFilter').value;
    const startDate = document.getElementById('expStartDate').value;
    const endDate = document.getElementById('expEndDate').value;

    let url = '/api/expenses?';
    if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 401) window.location.href = '/login.html';
            return;
        }

        const data = await res.json();
        allExpensesData = data.expenses || [];

        // Update Summary Cards
        const total = data.totalExpense || 0;
        document.getElementById('expTotalAmount').textContent = formatCurrency(total);
        document.getElementById('expRecordCount').textContent = data.count || 0;

        // Find Top Category
        const summary = data.categorySummary || {};
        let topCat = 'None';
        let maxVal = 0;
        for (const [cat, val] of Object.entries(summary)) {
            if (val > maxVal) {
                maxVal = val;
                topCat = cat;
            }
        }
        document.getElementById('expTopCategory').textContent = topCat;

        // Render Table & Charts
        renderExpensesTable(allExpensesData);
        updateDoughnutChart(summary);
        await loadAndRenderMonthlyTrends();
    } catch (err) {
        console.error('Error loading expenses:', err);
        showToast('error', 'Could not load expense records.');
    }
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expensesTableBody');
    tbody.innerHTML = '';

    if (!expenses || expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-5">
                    <i class="bi bi-receipt text-success fs-1 d-block mb-2"></i>
                    <h5>No Expense Records Found</h5>
                    <p class="small">Click "Record Expense" to log your seed, fertilizer, or labor costs.</p>
                </td>
            </tr>
        `;
        return;
    }

    expenses.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="fw-semibold">${formatDate(item.expense_date)}</div>
            </td>
            <td>
                <span class="badge bg-light text-dark border px-2 py-1">
                    ${escapeHtml(item.category)}
                </span>
            </td>
            <td>
                <div class="text-dark">${escapeHtml(item.description || 'Farm operational cost')}</div>
            </td>
            <td>
                <span class="small text-muted"><i class="bi bi-credit-card"></i> ${escapeHtml(item.payment_method || 'Cash')}</span>
            </td>
            <td>
                <strong class="text-success">${formatCurrency(item.amount)}</strong>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editExpense(${item.id})" title="Edit Expense">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteExpense(${item.id})" title="Delete Expense">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateDoughnutChart(categorySummary) {
    const ctx = document.getElementById('expenseDoughnutChart');
    if (!ctx) return;

    const labels = Object.keys(categorySummary);
    const dataValues = Object.values(categorySummary);

    // Color palette for agricultural categories
    const colors = [
        '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2',
        '#b07d62', '#d4a373', '#0284c7', '#38bdf8', '#eab308'
    ];

    if (doughnutChartInstance) {
        doughnutChartInstance.destroy();
    }

    if (labels.length === 0) {
        doughnutChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['No Data'],
                datasets: [{ data: [1], backgroundColor: ['#e5e7eb'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }

    doughnutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 12, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ` ${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

async function loadAndRenderMonthlyTrends() {
    const ctx = document.getElementById('expenseBarChart');
    if (!ctx) return;

    try {
        const res = await fetch('/api/expenses/analytics');
        if (!res.ok) return;

        const data = await res.json();
        const monthly = data.monthlyBreakdown || {};

        const months = Object.keys(monthly);
        const amounts = Object.values(monthly);

        if (barChartInstance) {
            barChartInstance.destroy();
        }

        barChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.length > 0 ? months : ['Current Period'],
                datasets: [{
                    label: 'Cultivation Cost (₹)',
                    data: amounts.length > 0 ? amounts : [0],
                    backgroundColor: '#40916c',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (val) { return '₹ ' + val; }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) { return ` Expense: ${formatCurrency(ctx.raw)}`; }
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.error('Monthly trends chart error:', e);
    }
}

async function handleSaveExpense(e) {
    e.preventDefault();

    const editId = document.getElementById('expenseEditId').value;
    const category = document.getElementById('expCategory').value;
    const amount = parseFloat(document.getElementById('expAmount').value);
    const expense_date = document.getElementById('expDate').value;
    const payment_method = document.getElementById('expPaymentMethod').value;
    const description = document.getElementById('expDescription').value.trim();

    if (!category || isNaN(amount) || amount <= 0 || !expense_date) {
        showToast('error', 'Please fill in category, valid amount, and date.');
        return;
    }

    const payload = {
        category,
        amount,
        expense_date,
        payment_method,
        description
    };

    const isEdit = Boolean(editId);
    const url = isEdit ? `/api/expenses/${editId}` : '/api/expenses';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast('success', isEdit ? 'Expense updated!' : 'Expense recorded successfully!');

            // Close modal
            const modalEl = document.getElementById('expenseModal');
            const bsModal = bootstrap.Modal.getInstance(modalEl);
            if (bsModal) bsModal.hide();

            loadExpenses();
        } else {
            showToast('error', data.message || 'Error saving expense.');
        }
    } catch (err) {
        console.error('Save expense error:', err);
        showToast('error', 'Server error saving expense.');
    }
}

function editExpense(id) {
    const item = allExpensesData.find(e => e.id === id);
    if (!item) return;

    document.getElementById('expenseEditId').value = item.id;
    document.getElementById('expCategory').value = item.category;
    document.getElementById('expAmount').value = item.amount;
    document.getElementById('expDate').value = item.expense_date ? item.expense_date.split('T')[0] : '';
    document.getElementById('expPaymentMethod').value = item.payment_method || 'Cash';
    document.getElementById('expDescription').value = item.description || '';

    document.getElementById('expenseModalTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i> Edit Cultivation Expense';

    const modal = new bootstrap.Modal(document.getElementById('expenseModal'));
    modal.show();
}

async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense record?')) return;

    try {
        const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('success', 'Expense record deleted.');
            loadExpenses();
        } else {
            showToast('error', data.message || 'Could not delete expense.');
        }
    } catch (err) {
        showToast('error', 'Server error deleting expense.');
    }
}

/**
 * CSV Export for Farm Ledger
 */
function exportExpensesToCsv() {
    if (!allExpensesData || allExpensesData.length === 0) {
        showToast('warning', 'No expenses available to export.');
        return;
    }

    const headers = ['ID', 'Date', 'Category', 'Description', 'Payment Method', 'Amount (INR)'];
    const rows = allExpensesData.map(e => [
        e.id,
        `"${e.expense_date ? e.expense_date.split('T')[0] : ''}"`,
        `"${e.category}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${e.payment_method || 'Cash'}"`,
        e.amount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `farmfusion_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('success', 'Farm expenses CSV exported successfully!');
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
