/**
 * FarmFusion Web – Crop Advisory Logic
 * Rule-based evaluation using predefined agricultural parameters.
 */

document.addEventListener('DOMContentLoaded', () => {
    const advisoryForm = document.getElementById('advisoryForm');
    const autoFillBtn = document.getElementById('btnAutoFillProfile');

    // Auto-fill from logged-in farmer profile
    if (autoFillBtn) {
        autoFillBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/profile');
                if (res.ok) {
                    const data = await res.json();
                    const profile = data.profile;
                    if (profile) {
                        if (profile.primary_soil_type) document.getElementById('advSoilType').value = profile.primary_soil_type;
                        if (profile.land_area) document.getElementById('advLandArea').value = profile.land_area;
                        if (profile.state) document.getElementById('advState').value = profile.state;
                        
                        // Map water source to water availability level
                        if (profile.water_source) {
                            if (profile.water_source.includes('Canal') || profile.water_source.includes('River')) {
                                document.getElementById('advWater').value = 'High';
                            } else if (profile.water_source.includes('Rainfed')) {
                                document.getElementById('advWater').value = 'Low';
                            } else {
                                document.getElementById('advWater').value = 'Medium';
                            }
                        }

                        showToast('info', 'Farm parameters populated from your farmer profile!');
                    }
                }
            } catch (e) {
                console.error('Autofill error:', e);
            }
        });
    }

    // Form submit calculation
    if (advisoryForm) {
        advisoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const soilType = document.getElementById('advSoilType').value;
            const landArea = parseFloat(document.getElementById('advLandArea').value) || 1.0;
            const season = document.getElementById('advSeason').value;
            const water = document.getElementById('advWater').value;
            const state = document.getElementById('advState').value;

            const spinner = document.getElementById('advSpinner');
            const submitBtn = document.getElementById('btnCalculateAdvisory');
            submitBtn.disabled = true;
            spinner.classList.remove('d-none');

            try {
                const res = await fetch('/api/advisory/recommend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        soil_type: soilType,
                        land_area: landArea,
                        season,
                        water_availability: water,
                        state
                    })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    renderAdvisoryResults(data.recommendations, landArea);
                    document.getElementById('advisoryPlaceholder').classList.add('d-none');
                    document.getElementById('advisoryResultsSection').classList.remove('d-none');
                    document.getElementById('advResultsCount').textContent = `${data.resultsCount} Crops Evaluated`;
                    document.getElementById('advisoryResultsSection').scrollIntoView({ behavior: 'smooth' });
                } else {
                    showToast('error', data.message || 'Could not compute advisory.');
                }
            } catch (err) {
                console.error('Advisory computation error:', err);
                showToast('error', 'Server error while calculating advisory.');
            } finally {
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
            }
        });
    }
});

function renderAdvisoryResults(recommendations, landArea) {
    const grid = document.getElementById('advisoryCardsGrid');
    grid.innerHTML = '';

    if (!recommendations || recommendations.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-4">No matching crops found for selected parameters.</div>';
        return;
    }

    recommendations.forEach((item, index) => {
        const isTopPick = index === 0 && item.suitability_score >= 70;

        const col = document.createElement('div');
        col.className = 'col-lg-6';

        col.innerHTML = `
            <div class="farm-card h-100 ${isTopPick ? 'border-success shadow' : ''}">
                ${isTopPick ? '<div class="position-absolute top-0 end-0 bg-success text-white px-3 py-1 rounded-bottom-start fw-bold small"><i class="bi bi-star-fill text-warning"></i> Top Agronomic Match</div>' : ''}
                
                <div class="d-flex align-items-center gap-3 mb-3">
                    <div class="feature-icon-box mb-0" style="width: 50px; height: 50px; font-size: 1.5rem;">
                        <i class="bi ${item.icon || 'bi-flower1'}"></i>
                    </div>
                    <div>
                        <h4 class="fw-bold mb-0">${escapeHtml(item.crop_name)}</h4>
                        <small class="text-muted fst-italic">${escapeHtml(item.scientific_name || '')}</small>
                    </div>
                    <div class="ms-auto text-end">
                        <span class="badge ${item.badgeClass} fs-6 px-3 py-2 rounded-pill">
                            ${item.suitability_score}% Match
                        </span>
                        <div class="small fw-semibold text-muted mt-1">${item.recommendation_tier}</div>
                    </div>
                </div>

                <p class="text-muted small mb-3">${escapeHtml(item.description)}</p>

                <!-- Agronomic Specs Grid -->
                <div class="row g-2 mb-3 small">
                    <div class="col-6 col-sm-3">
                        <div class="p-2 border rounded bg-light text-center">
                            <span class="text-muted d-block">Season</span>
                            <strong>${escapeHtml(item.season)}</strong>
                        </div>
                    </div>
                    <div class="col-6 col-sm-3">
                        <div class="p-2 border rounded bg-light text-center">
                            <span class="text-muted d-block">Duration</span>
                            <strong>${escapeHtml(item.duration_days)}</strong>
                        </div>
                    </div>
                    <div class="col-6 col-sm-3">
                        <div class="p-2 border rounded bg-light text-center">
                            <span class="text-muted d-block">Water Need</span>
                            <strong>${escapeHtml(item.water_requirement)}</strong>
                        </div>
                    </div>
                    <div class="col-6 col-sm-3">
                        <div class="p-2 border rounded bg-light text-center">
                            <span class="text-muted d-block">Acre Yield</span>
                            <strong>${escapeHtml(item.expected_yield_per_acre)}</strong>
                        </div>
                    </div>
                </div>

                <!-- Financial Estimations Box -->
                <div class="p-3 bg-light rounded-3 mb-3 border">
                    <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1">
                        <span class="fw-bold text-success small"><i class="bi bi-calculator"></i> Financial Projections (${landArea} Acres)</span>
                        <span class="badge bg-secondary-subtle text-secondary">Estimates</span>
                    </div>
                    <div class="row text-center g-2 small">
                        <div class="col-4">
                            <span class="text-muted d-block">Est. Input Cost</span>
                            <strong class="text-danger">${formatCurrency(item.financials.estimatedCost)}</strong>
                        </div>
                        <div class="col-4">
                            <span class="text-muted d-block">Est. Gross Returns</span>
                            <strong class="text-primary">${formatCurrency(item.financials.estimatedRevenue)}</strong>
                        </div>
                        <div class="col-4">
                            <span class="text-muted d-block">Est. Net Profit</span>
                            <strong class="text-success">${formatCurrency(item.financials.estimatedProfit)}</strong>
                        </div>
                    </div>
                </div>

                <!-- Match Justifications -->
                <div class="mb-3 small">
                    <strong class="text-success d-block mb-1"><i class="bi bi-check-circle-fill"></i> Why This Fits:</strong>
                    <ul class="mb-0 ps-3 text-muted">
                        ${item.matchReasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
                    </ul>
                </div>

                ${item.alerts && item.alerts.length > 0 ? `
                    <div class="mb-3 small">
                        <strong class="text-warning text-dark d-block mb-1"><i class="bi bi-exclamation-triangle-fill text-warning"></i> Cautionary Notes:</strong>
                        <ul class="mb-0 ps-3 text-muted">
                            ${item.alerts.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Accordion: Fertilizer & Irrigation Guidance -->
                <div class="accordion accordion-flush border rounded-3 overflow-hidden" id="acc_${item.crop_id}">
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed py-2 small fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#soilGuidance_${item.crop_id}">
                                <i class="bi bi-droplet-half text-primary me-2"></i> Irrigation & Fertilizer Regimen
                            </button>
                        </h2>
                        <div id="soilGuidance_${item.crop_id}" class="accordion-collapse collapse" data-bs-parent="#acc_${item.crop_id}">
                            <div class="accordion-body small bg-light">
                                <div class="mb-2">
                                    <strong>Fertilizer Schedule:</strong><br>
                                    <span class="text-muted">${escapeHtml(item.fertilizer_guidance || 'Follow local agricultural guidelines.')}</span>
                                </div>
                                <div>
                                    <strong>Irrigation Management:</strong><br>
                                    <span class="text-muted">${escapeHtml(item.irrigation_guidance || 'Maintain optimal root-zone moisture.')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;

        grid.appendChild(col);
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
