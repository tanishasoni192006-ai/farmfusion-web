/**
 * FarmFusion Web – Dashboard Logic
 * Coordinates profile data, dynamic weather fetching, reminder summaries,
 * and cultivation cost previews.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Format Header Date and Cropping Season
    updateHeaderDate();

    // 2. Fetch User Profile & Data
    await loadDashboardProfile();

    // 3. Fetch Reminders
    await loadDashboardReminders();

    // 4. Fetch Expenses
    await loadDashboardExpenses();
});

function updateHeaderDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-IN', options);

    // Determine current Indian agricultural cropping season
    const month = now.getMonth() + 1; // 1-12
    let season = 'Rabi Season (Winter Crops)';
    if (month >= 6 && month <= 10) {
        season = 'Kharif Season (Monsoon Crops)';
    } else if (month >= 3 && month <= 5) {
        season = 'Zaid Season (Summer Crops)';
    }

    const headerEl = document.getElementById('headerDateString');
    if (headerEl) {
        headerEl.innerHTML = `${dateStr} &bull; <span class="text-success fw-bold">${season}</span>`;
    }
}

async function loadDashboardProfile() {
    try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Failed to load profile');
        }

        const data = await res.json();
        const user = data.user;
        const profile = data.profile || {};

        // Update DOM elements
        document.querySelectorAll('.farmer-name-display').forEach(el => el.textContent = user.full_name);
        document.querySelectorAll('.farmer-location-display').forEach(el => {
            el.textContent = `${profile.district || 'Ludhiana'}, ${profile.state || 'Punjab'}`;
        });
        document.querySelectorAll('.farmer-avatar-initials').forEach(el => {
            el.textContent = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'F';
        });

        document.getElementById('dashLandArea').textContent = `${profile.land_area || 5} ${profile.land_unit || 'Acres'}`;
        document.getElementById('dashDistrictState').textContent = `${profile.district || 'Ludhiana'}, ${profile.state || 'Punjab'}`;
        document.getElementById('dashVillage').textContent = profile.village || 'N/A';
        document.getElementById('dashSoilType').textContent = profile.primary_soil_type || 'Alluvial';
        document.getElementById('dashWaterSource').textContent = profile.water_source || 'Tube-well / Borewell';
        document.getElementById('dashPreferredCrops').textContent = profile.preferred_crops || 'Wheat, Rice';

        // Load Weather for farmer's location
        loadDashboardWeather(profile.district || 'Ludhiana', profile.state || 'Punjab');
    } catch (err) {
        console.error('Dashboard profile error:', err);
    }
}

async function loadDashboardWeather(city, state) {
    try {
        const res = await fetch(`/api/weather/forecast?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}`);
        if (!res.ok) throw new Error('Weather API unreachable');

        const data = await res.json();
        if (data.success && data.current) {
            const temp = Math.round(data.current.temperature);
            document.getElementById('dashTemp').textContent = `${temp}°C`;
            document.getElementById('dashWeatherText').textContent = data.current.condition;
            document.getElementById('dashWeatherTempBig').textContent = `${temp}°C`;
            document.getElementById('dashWeatherDesc').textContent = `${data.current.condition} in ${city}`;

            document.getElementById('dashHumidity').textContent = `${data.current.humidity}%`;
            document.getElementById('dashWind').textContent = `${data.current.windSpeed} km/h`;
            document.getElementById('dashRain').textContent = `${data.current.precipitation || 0} mm`;

            // Weather icon update
            const weatherIcon = document.getElementById('dashWeatherIcon');
            const weatherBigIcon = document.getElementById('dashWeatherBigIcon');
            if (data.current.icon) {
                weatherIcon.className = `bi ${data.current.icon}`;
                weatherBigIcon.className = `bi ${data.current.icon}`;
            }

            // Advisory alert callout
            if (data.advisories && data.advisories.length > 0) {
                const adv = data.advisories[0];
                const alertBox = document.getElementById('dashWeatherAlertBox');
                const alertText = document.getElementById('dashWeatherAlertText');
                alertBox.className = `alert alert-${adv.level} d-flex align-items-center gap-2 mb-0 py-2`;
                alertText.innerHTML = `<strong>${adv.title}:</strong> ${adv.message}`;
            }
        }
    } catch (err) {
        console.warn('Dashboard weather error:', err);
        document.getElementById('dashWeatherText').textContent = 'Live Weather Offline';
    }
}

async function loadDashboardReminders() {
    try {
        const res = await fetch('/api/reminders?status=Pending');
        if (!res.ok) return;

        const data = await res.json();
        const reminders = data.reminders || [];

        document.getElementById('dashPendingReminders').textContent = reminders.length;

        const tbody = document.getElementById('dashRemindersTableBody');
        tbody.innerHTML = '';

        if (reminders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="bi bi-check2-circle text-success fs-3 d-block mb-1"></i>
                        No pending farming tasks. All scheduled activities completed!
                    </td>
                </tr>
            `;
            return;
        }

        // Show first 4 upcoming reminders
        const preview = reminders.slice(0, 4);
        preview.forEach(item => {
            const priorityBadge = item.priority === 'High' ? 'badge bg-danger' :
                                 item.priority === 'Medium' ? 'badge bg-warning text-dark' : 'badge bg-secondary';

            const categoryBadge = `badge badge-${item.category.toLowerCase()}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${escapeHtml(item.title)}</div>
                    <small class="text-muted"><i class="bi bi-tag"></i> ${escapeHtml(item.crop_name)}</small>
                </td>
                <td><span class="${categoryBadge}">${escapeHtml(item.category)}</span></td>
                <td>
                    <div>${formatDate(item.reminder_date)}</div>
                    <small class="text-muted">${item.reminder_time ? item.reminder_time.substring(0, 5) : ''}</small>
                </td>
                <td><span class="${priorityBadge}">${escapeHtml(item.priority)}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-success py-1 px-2" onclick="quickCompleteReminder(${item.id})" title="Mark Done">
                        <i class="bi bi-check-lg"></i> Done
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Dashboard reminders error:', err);
    }
}

async function quickCompleteReminder(id) {
    try {
        const res = await fetch(`/api/reminders/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Completed' })
        });
        const data = await res.json();
        if (data.success) {
            showToast('success', 'Task marked as completed!');
            loadDashboardReminders();
        }
    } catch (err) {
        showToast('error', 'Could not update task.');
    }
}

async function loadDashboardExpenses() {
    try {
        const res = await fetch('/api/expenses');
        if (!res.ok) return;

        const data = await res.json();
        const total = data.totalExpense || 0;
        const summary = data.categorySummary || {};

        document.getElementById('dashTotalExpenses').textContent = formatCurrency(total);
        document.getElementById('dashExpenseSummaryTotal').textContent = formatCurrency(total);

        const listEl = document.getElementById('dashExpenseBreakdownList');
        listEl.innerHTML = '';

        const categories = Object.keys(summary);
        if (categories.length === 0) {
            listEl.innerHTML = '<div class="text-center text-muted py-3">No expenses recorded yet.</div>';
            return;
        }

        // Display top 4 categories
        const sortedCats = categories.sort((a, b) => summary[b] - summary[a]).slice(0, 4);

        sortedCats.forEach(cat => {
            const amt = summary[cat];
            const pct = total > 0 ? Math.round((amt / total) * 100) : 0;

            const div = document.createElement('div');
            div.className = 'p-2 border rounded bg-white';
            div.innerHTML = `
                <div class="d-flex justify-content-between small mb-1">
                    <span class="fw-semibold">${escapeHtml(cat)}</span>
                    <span class="fw-bold">${formatCurrency(amt)} (${pct}%)</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${pct}%"></div>
                </div>
            `;
            listEl.appendChild(div);
        });
    } catch (err) {
        console.error('Dashboard expenses error:', err);
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
