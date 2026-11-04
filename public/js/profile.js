/**
 * FarmFusion Web – Farmer Profile Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadProfileData();

    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', handleUpdateProfile);
    }
});

async function loadProfileData() {
    try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
            if (res.status === 401) window.location.href = '/login.html';
            return;
        }

        const data = await res.json();
        const user = data.user || {};
        const profile = data.profile || {};

        document.getElementById('profName').value = user.full_name || '';
        document.getElementById('profEmail').value = user.email || '';
        document.getElementById('profPhone').value = user.phone || '';

        document.getElementById('profState').value = profile.state || 'Punjab';
        document.getElementById('profDistrict').value = profile.district || 'Ludhiana';
        document.getElementById('profVillage').value = profile.village || '';
        document.getElementById('profLandArea').value = profile.land_area || 5;
        document.getElementById('profSoilType').value = profile.primary_soil_type || 'Alluvial';
        document.getElementById('profWaterSource').value = profile.water_source || 'Tube-well / Borewell';
        document.getElementById('profPreferredCrops').value = profile.preferred_crops || 'Wheat, Rice';
    } catch (err) {
        console.error('Error loading profile:', err);
        showToast('error', 'Could not load profile settings.');
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();

    const fullName = document.getElementById('profName').value.trim();
    const phone = document.getElementById('profPhone').value.trim();
    const state = document.getElementById('profState').value;
    const district = document.getElementById('profDistrict').value.trim();
    const village = document.getElementById('profVillage').value.trim();
    const landArea = parseFloat(document.getElementById('profLandArea').value);
    const soilType = document.getElementById('profSoilType').value;
    const waterSource = document.getElementById('profWaterSource').value;
    const preferredCrops = document.getElementById('profPreferredCrops').value.trim();

    if (!fullName || !phone || !district || isNaN(landArea)) {
        showToast('error', 'Please fill in all mandatory fields.');
        return;
    }

    const payload = {
        full_name: fullName,
        phone,
        state,
        district,
        village,
        land_area: landArea,
        land_unit: 'Acres',
        primary_soil_type: soilType,
        water_source: waterSource,
        preferred_crops: preferredCrops
    };

    try {
        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
            showToast('success', 'Profile and farm settings updated successfully!');
            // Update UI elements across header/sidebar
            document.querySelectorAll('.farmer-name-display').forEach(el => el.textContent = fullName);
            document.querySelectorAll('.farmer-location-display').forEach(el => el.textContent = `${district}, ${state}`);
        } else {
            showToast('error', data.message || 'Error updating profile.');
        }
    } catch (err) {
        console.error('Update profile error:', err);
        showToast('error', 'Server error updating profile.');
    }
}
