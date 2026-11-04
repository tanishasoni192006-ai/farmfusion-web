/**
 * FarmFusion Web – Crop Disease Knowledge Base Logic
 * Filtering, searching, and detailed diagnostic modal views.
 */

let allDiseasesData = [];

document.addEventListener('DOMContentLoaded', () => {
    const cropFilter = document.getElementById('diseaseCropFilter');
    const severityFilter = document.getElementById('diseaseSeverityFilter');
    const searchInput = document.getElementById('diseaseSearchInput');
    const clearBtn = document.getElementById('btnClearSearch');

    loadDiseases();

    if (cropFilter) cropFilter.addEventListener('change', loadDiseases);
    if (severityFilter) severityFilter.addEventListener('change', loadDiseases);
    
    // Debounced search input
    let searchTimeout = null;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(loadDiseases, 300);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            loadDiseases();
        });
    }
});

async function loadDiseases() {
    const crop = document.getElementById('diseaseCropFilter').value;
    const severity = document.getElementById('diseaseSeverityFilter').value;
    const search = document.getElementById('diseaseSearchInput').value.trim();

    const container = document.getElementById('diseasesContainer');
    container.innerHTML = `
        <div class="col-12 text-center text-muted py-5">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-2">Filtering disease database...</p>
        </div>
    `;

    try {
        let url = `/api/diseases?crop=${encodeURIComponent(crop)}&severity=${encodeURIComponent(severity)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.success) {
            allDiseasesData = data.diseases || [];
            renderDiseaseCards(allDiseasesData);
        } else {
            container.innerHTML = `<div class="col-12 text-center text-danger py-4">Error loading diseases.</div>`;
        }
    } catch (err) {
        console.error('Disease load error:', err);
        container.innerHTML = `<div class="col-12 text-center text-danger py-4">Server communication error.</div>`;
    }
}

function renderDiseaseCards(diseases) {
    const container = document.getElementById('diseasesContainer');
    container.innerHTML = '';

    if (!diseases || diseases.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-shield-check text-success fs-1 d-block mb-2"></i>
                <h5>No Diseases Match Your Filter</h5>
                <p class="small">Try resetting your crop selection or search query.</p>
            </div>
        `;
        return;
    }

    diseases.forEach(item => {
        const severityBadge = item.severity === 'Critical' ? 'bg-danger text-white' :
                              item.severity === 'High' ? 'bg-warning text-dark' : 'bg-info text-dark';

        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4';

        col.innerHTML = `
            <div class="farm-card h-100 d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge bg-success-subtle text-success fs-6 fw-bold">
                        <i class="bi bi-flower1"></i> ${escapeHtml(item.crop_name)}
                    </span>
                    <span class="badge ${severityBadge} rounded-pill">
                        ${escapeHtml(item.severity)}
                    </span>
                </div>

                <h5 class="fw-bold text-dark mt-2 mb-1">${escapeHtml(item.disease_name)}</h5>
                <small class="text-muted d-block mb-3">
                    <i class="bi bi-bug"></i> ${escapeHtml(item.pathogen_type)}
                </small>

                <div class="mb-3 small">
                    <strong class="text-dark d-block mb-1">Visual Symptoms:</strong>
                    <p class="text-muted mb-0 line-clamp-3" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                        ${escapeHtml(item.symptoms)}
                    </p>
                </div>

                <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                    <span class="small text-muted"><i class="bi bi-book"></i> Curated Guide</span>
                    <button class="btn btn-sm btn-farm-primary" onclick="openDiseaseDetail(${item.id})">
                        <i class="bi bi-eye"></i> View Protocol
                    </button>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function openDiseaseDetail(id) {
    const item = allDiseasesData.find(d => d.id === id);
    if (!item) return;

    document.getElementById('diseaseModalTitle').innerHTML = `
        <i class="bi bi-shield-exclamation me-2"></i> ${escapeHtml(item.disease_name)} (${escapeHtml(item.crop_name)})
    `;

    const body = document.getElementById('diseaseModalBody');
    body.innerHTML = `
        <div class="row g-3 mb-3">
            <div class="col-sm-6">
                <div class="p-2 border rounded bg-light">
                    <small class="text-muted d-block">Target Crop:</small>
                    <strong class="text-success">${escapeHtml(item.crop_name)}</strong>
                </div>
            </div>
            <div class="col-sm-6">
                <div class="p-2 border rounded bg-light">
                    <small class="text-muted d-block">Causal Organism / Pathogen:</small>
                    <strong>${escapeHtml(item.pathogen_type)}</strong>
                </div>
            </div>
        </div>

        <div class="mb-3">
            <h6 class="fw-bold text-danger border-bottom pb-1"><i class="bi bi-exclamation-circle"></i> Diagnostic Symptoms</h6>
            <p class="small text-dark mb-0">${escapeHtml(item.symptoms)}</p>
        </div>

        ${item.favorable_conditions ? `
            <div class="mb-3">
                <h6 class="fw-bold text-warning text-dark border-bottom pb-1"><i class="bi bi-cloud-haze"></i> Favorable Environmental Conditions</h6>
                <p class="small text-muted mb-0">${escapeHtml(item.favorable_conditions)}</p>
            </div>
        ` : ''}

        <div class="mb-3">
            <h6 class="fw-bold text-success border-bottom pb-1"><i class="bi bi-shield-check"></i> Cultural & Preventive Measures</h6>
            <p class="small text-muted mb-0">${escapeHtml(item.prevention)}</p>
        </div>

        <div class="p-3 bg-light rounded-3 border">
            <h6 class="fw-bold text-primary mb-1"><i class="bi bi-prescription2"></i> Recommended Treatment & Remedies</h6>
            <p class="small text-dark mb-0">${escapeHtml(item.treatment)}</p>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('diseaseDetailModal'));
    modal.show();
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
