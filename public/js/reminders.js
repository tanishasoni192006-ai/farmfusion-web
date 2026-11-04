/**
 * FarmFusion Web – Reminders Module Logic
 * Complete CRUD operations with Express API backend.
 */

let allRemindersData = [];
let currentFilterStatus = 'All';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Load
    loadReminders();

    // 2. Set default date in modal to today
    const remDateInput = document.getElementById('remDate');
    if (remDateInput) {
        remDateInput.value = new Date().toISOString().split('T')[0];
    }

    // 3. Status Tabs Switcher
    const tabs = document.querySelectorAll('#reminderStatusTabs .nav-link');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilterStatus = tab.dataset.status;
            filterAndRenderReminders();
        });
    });

    // 4. Category Filter Change
    const catFilter = document.getElementById('reminderCategoryFilter');
    if (catFilter) {
        catFilter.addEventListener('change', filterAndRenderReminders);
    }

    // 5. Reset Modal on Open
    const btnOpenAdd = document.getElementById('btnOpenAddReminder');
    if (btnOpenAdd) {
        btnOpenAdd.addEventListener('click', () => {
            document.getElementById('reminderForm').reset();
            document.getElementById('reminderEditId').value = '';
            document.getElementById('reminderModalTitle').innerHTML = '<i class="bi bi-alarm-fill me-2"></i> Add Farm Reminder';
            document.getElementById('remDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('remTime').value = '07:00';
            document.getElementById('remPriority').value = 'Medium';
            document.getElementById('remStatus').value = 'Pending';
        });
    }

    // 6. Reminder Form Submit (Create or Update)
    const reminderForm = document.getElementById('reminderForm');
    if (reminderForm) {
        reminderForm.addEventListener('submit', handleSaveReminder);
    }
});

async function loadReminders() {
    try {
        const res = await fetch('/api/reminders');
        if (!res.ok) {
            if (res.status === 401) window.location.href = '/login.html';
            return;
        }

        const data = await res.json();
        allRemindersData = data.reminders || [];

        updateReminderCounts(allRemindersData);
        filterAndRenderReminders();
    } catch (err) {
        console.error('Error loading reminders:', err);
        showToast('error', 'Could not load reminders.');
    }
}

function updateReminderCounts(reminders) {
    const pending = reminders.filter(r => r.status === 'Pending').length;
    const completed = reminders.filter(r => r.status === 'Completed').length;

    document.getElementById('remPendingCount').textContent = pending;
    document.getElementById('remCompletedCount').textContent = completed;
    document.getElementById('remTotalCount').textContent = reminders.length;
}

function filterAndRenderReminders() {
    const selectedCat = document.getElementById('reminderCategoryFilter').value;
    const tbody = document.getElementById('remindersTableBody');
    tbody.innerHTML = '';

    let filtered = allRemindersData;

    // Filter by status
    if (currentFilterStatus !== 'All') {
        filtered = filtered.filter(r => r.status === currentFilterStatus);
    }

    // Filter by category
    if (selectedCat !== 'All') {
        filtered = filtered.filter(r => r.category === selectedCat);
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-5">
                    <i class="bi bi-check2-circle text-success fs-1 d-block mb-2"></i>
                    <h5>No Reminders Found</h5>
                    <p class="small">Click "Add New Reminder" to schedule an irrigation or farm task.</p>
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(item => {
        const isDone = item.status === 'Completed';
        const priorityBadge = item.priority === 'High' ? 'badge bg-danger' :
                              item.priority === 'Medium' ? 'badge bg-warning text-dark' : 'badge bg-secondary';
        const categoryBadge = `badge badge-${item.category.toLowerCase()}`;

        const tr = document.createElement('tr');
        if (isDone) tr.className = 'opacity-75 bg-light';

        tr.innerHTML = `
            <td>
                <button class="btn btn-sm ${isDone ? 'btn-success' : 'btn-outline-secondary'} rounded-circle p-1" style="width: 28px; height: 28px;" onclick="toggleReminder(${item.id}, '${isDone ? 'Pending' : 'Completed'}')" title="${isDone ? 'Mark as Pending' : 'Mark as Done'}">
                    <i class="bi bi-check-lg" style="font-size: 14px;"></i>
                </button>
            </td>
            <td>
                <div class="fw-bold ${isDone ? 'text-decoration-line-through text-muted' : ''}">${escapeHtml(item.title)}</div>
                ${item.description ? `<small class="text-muted d-block text-truncate" style="max-width: 250px;">${escapeHtml(item.description)}</small>` : ''}
            </td>
            <td><span class="badge bg-light text-dark border">${escapeHtml(item.crop_name || 'General')}</span></td>
            <td><span class="${categoryBadge}">${escapeHtml(item.category)}</span></td>
            <td>
                <div>${formatDate(item.reminder_date)}</div>
                <small class="text-muted">${item.reminder_time ? item.reminder_time.substring(0, 5) : ''}</small>
            </td>
            <td><span class="${priorityBadge}">${escapeHtml(item.priority)}</span></td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editReminder(${item.id})" title="Edit Reminder">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteReminder(${item.id})" title="Delete Reminder">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function handleSaveReminder(e) {
    e.preventDefault();

    const editId = document.getElementById('reminderEditId').value;
    const title = document.getElementById('remTitle').value.trim();
    const crop_name = document.getElementById('remCrop').value.trim() || 'General';
    const category = document.getElementById('remCategory').value;
    const reminder_date = document.getElementById('remDate').value;
    const reminder_time = document.getElementById('remTime').value;
    const priority = document.getElementById('remPriority').value;
    const status = document.getElementById('remStatus').value;
    const description = document.getElementById('remDescription').value.trim();

    if (!title || !reminder_date) {
        showToast('error', 'Title and date are required.');
        return;
    }

    const payload = {
        title,
        crop_name,
        category,
        reminder_date,
        reminder_time,
        priority,
        status,
        description
    };

    const isEdit = Boolean(editId);
    const url = isEdit ? `/api/reminders/${editId}` : '/api/reminders';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast('success', isEdit ? 'Reminder updated!' : 'Reminder added successfully!');
            
            // Close modal
            const modalEl = document.getElementById('reminderModal');
            const bsModal = bootstrap.Modal.getInstance(modalEl);
            if (bsModal) bsModal.hide();

            loadReminders();
        } else {
            showToast('error', data.message || 'Error saving reminder.');
        }
    } catch (err) {
        console.error('Save reminder error:', err);
        showToast('error', 'Server error while saving reminder.');
    }
}

function editReminder(id) {
    const item = allRemindersData.find(r => r.id === id);
    if (!item) return;

    document.getElementById('reminderEditId').value = item.id;
    document.getElementById('remTitle').value = item.title;
    document.getElementById('remCrop').value = item.crop_name || 'General';
    document.getElementById('remCategory').value = item.category;
    document.getElementById('remDate').value = item.reminder_date ? item.reminder_date.split('T')[0] : '';
    document.getElementById('remTime').value = item.reminder_time ? item.reminder_time.substring(0, 5) : '07:00';
    document.getElementById('remPriority').value = item.priority;
    document.getElementById('remStatus').value = item.status;
    document.getElementById('remDescription').value = item.description || '';

    document.getElementById('reminderModalTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i> Edit Farm Reminder';

    const modal = new bootstrap.Modal(document.getElementById('reminderModal'));
    modal.show();
}

async function toggleReminder(id, newStatus) {
    try {
        const res = await fetch(`/api/reminders/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('success', `Task marked as ${newStatus}.`);
            loadReminders();
        } else {
            showToast('error', data.message || 'Could not update status.');
        }
    } catch (err) {
        showToast('error', 'Server error updating reminder.');
    }
}

async function deleteReminder(id) {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
        const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('success', 'Reminder removed.');
            loadReminders();
        } else {
            showToast('error', data.message || 'Could not delete reminder.');
        }
    } catch (err) {
        showToast('error', 'Server error deleting reminder.');
    }
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
