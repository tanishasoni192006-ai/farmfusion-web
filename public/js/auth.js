/**
 * FarmFusion Web – Authentication Logic
 * Handles client-side form validation, AJAX login, and registration requests.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Password Visibility Toggle
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const loginPassword = document.getElementById('loginPassword');
    if (togglePasswordBtn && loginPassword) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = loginPassword.type === 'password';
            loginPassword.type = isPassword ? 'text' : 'password';
            togglePasswordBtn.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
        });
    }

    // 2. Demo Credentials Quick Fill
    const fillDemoBtn = document.getElementById('fillDemoBtn');
    if (fillDemoBtn) {
        fillDemoBtn.addEventListener('click', () => {
            const emailInput = document.getElementById('loginEmail');
            const passInput = document.getElementById('loginPassword');
            if (emailInput && passInput) {
                emailInput.value = 'ramesh@farmfusion.in';
                passInput.value = 'farmer123';
            }
        });
    }

    // 3. Login Form Submit Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');
            const alertBox = document.getElementById('loginAlert');
            const submitBtn = document.getElementById('loginSubmitBtn');
            const spinner = document.getElementById('loginSpinner');

            // Reset alert and validation classes
            alertBox.classList.add('d-none');
            alertBox.textContent = '';
            loginForm.classList.remove('was-validated');

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || !password) {
                loginForm.classList.add('was-validated');
                return;
            }

            // Set loading state
            submitBtn.disabled = true;
            spinner.classList.remove('d-none');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Check URL params for redirect target
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectUrl = urlParams.get('redirect') || 'dashboard.html';
                    window.location.href = redirectUrl;
                } else {
                    alertBox.textContent = data.message || 'Login failed. Please check your credentials.';
                    alertBox.classList.remove('d-none');
                }
            } catch (err) {
                console.error('Login error:', err);
                alertBox.textContent = 'Server communication error. Please ensure the Express server is running.';
                alertBox.classList.remove('d-none');
            } finally {
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
            }
        });
    }

    // 4. Registration Form Submit Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const alertBox = document.getElementById('registerAlert');
            const submitBtn = document.getElementById('registerSubmitBtn');
            const spinner = document.getElementById('registerSpinner');

            alertBox.classList.add('d-none');
            alertBox.textContent = '';

            const fullName = document.getElementById('regFullName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const phone = document.getElementById('regPhone').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;

            const state = document.getElementById('regState').value;
            const district = document.getElementById('regDistrict').value.trim();
            const village = document.getElementById('regVillage').value.trim();
            const landArea = document.getElementById('regLandArea').value;
            const soilType = document.getElementById('regSoilType').value;
            const waterSource = document.getElementById('regWaterSource').value;
            const preferredCrops = document.getElementById('regPreferredCrops').value.trim();

            // Client-side Validation Checks
            if (!fullName || !email || !phone || !password || !district) {
                registerForm.classList.add('was-validated');
                alertBox.textContent = 'Please fill in all mandatory fields marked with an asterisk (*).';
                alertBox.classList.remove('d-none');
                return;
            }

            if (password !== confirmPassword) {
                alertBox.textContent = 'Passwords do not match. Please verify both password fields.';
                alertBox.classList.remove('d-none');
                return;
            }

            if (password.length < 6) {
                alertBox.textContent = 'Password must be at least 6 characters long.';
                alertBox.classList.remove('d-none');
                return;
            }

            submitBtn.disabled = true;
            spinner.classList.remove('d-none');

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        full_name: fullName,
                        email,
                        phone,
                        password,
                        confirm_password: confirmPassword,
                        state,
                        district,
                        village,
                        land_area: landArea,
                        land_unit: 'Acres',
                        primary_soil_type: soilType,
                        water_source: waterSource,
                        preferred_crops: preferredCrops
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    window.location.href = 'dashboard.html';
                } else {
                    alertBox.textContent = data.message || 'Registration failed.';
                    alertBox.classList.remove('d-none');
                }
            } catch (err) {
                console.error('Registration error:', err);
                alertBox.textContent = 'Server communication error. Please ensure the Express server is running.';
                alertBox.classList.remove('d-none');
            } finally {
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
            }
        });
    }
});
