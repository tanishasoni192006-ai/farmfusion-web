/**
 * FarmFusion Web – Market & Mandi Rates Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const cropFilter = document.getElementById('marketCropFilter');
    const stateFilter = document.getElementById('marketStateFilter');
    const searchInput = document.getElementById('marketSearchInput');
    const clearBtn = document.getElementById('btnClearMarketSearch');

    loadMarketPrices();

    if (cropFilter) cropFilter.addEventListener('change', loadMarketPrices);
    if (stateFilter) stateFilter.addEventListener('change', loadMarketPrices);

    let searchTimeout = null;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(loadMarketPrices, 300);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            loadMarketPrices();
        });
    }
});

async function loadMarketPrices() {
    const crop = document.getElementById('marketCropFilter').value;
    const state = document.getElementById('marketStateFilter').value;
    const search = document.getElementById('marketSearchInput').value.trim();

    const tbody = document.getElementById('marketPricesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center text-muted py-5">
                <div class="spinner-border text-success" role="status"></div>
                <p class="mt-2">Querying benchmark Mandi database...</p>
            </td>
        </tr>
    `;

    try {
        let url = `/api/market?crop=${encodeURIComponent(crop)}&state=${encodeURIComponent(state)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success) {
            renderMarketTable(data.records || []);
        } else {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Error loading market records.</td></tr>`;
        }
    } catch (err) {
        console.error('Market prices error:', err);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Server communication error.</td></tr>`;
    }
}

function renderMarketTable(records) {
    const tbody = document.getElementById('marketPricesTableBody');
    tbody.innerHTML = '';

    if (!records || records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-5">
                    <i class="bi bi-search text-success fs-1 d-block mb-2"></i>
                    <h5>No Mandi Records Match Your Filter</h5>
                    <p class="small">Try adjusting your commodity, state, or search keywords.</p>
                </td>
            </tr>
        `;
        return;
    }

    records.forEach(item => {
        const trendBadge = item.price_trend === 'Up' ? '<span class="badge bg-success-subtle text-success"><i class="bi bi-arrow-up-right"></i> Up</span>' :
                           item.price_trend === 'Down' ? '<span class="badge bg-danger-subtle text-danger"><i class="bi bi-arrow-down-right"></i> Down</span>' :
                           '<span class="badge bg-secondary-subtle text-secondary"><i class="bi bi-dash"></i> Stable</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="fw-bold text-success">${escapeHtml(item.crop_name)}</div>
            </td>
            <td>
                <span class="small text-muted">${escapeHtml(item.variety || 'Standard')}</span>
            </td>
            <td>
                <strong class="text-dark">${escapeHtml(item.market_name)}</strong>
            </td>
            <td>
                <span class="small">${escapeHtml(item.district)}, ${escapeHtml(item.state)}</span>
            </td>
            <td>
                <span class="text-muted">${formatCurrency(item.min_price)}</span>
            </td>
            <td>
                <span class="text-muted">${formatCurrency(item.max_price)}</span>
            </td>
            <td>
                <strong class="text-success fs-6">${formatCurrency(item.modal_price)}</strong>
                <small class="text-muted d-block" style="font-size: 11px;">/ Quintal</small>
            </td>
            <td>
                ${trendBadge}
            </td>
            <td>
                <small class="text-muted">${escapeHtml(item.source)}</small>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
