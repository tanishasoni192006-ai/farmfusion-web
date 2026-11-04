/**
 * Automated Verification Script for FarmFusion Web
 * Tests all Express REST API routes, session management, and CRUD capabilities.
 */
const http = require('http');

const PORT = 3000;
let sessionCookie = '';
let createdReminderId = null;
let createdExpenseId = null;

async function runTests() {
    console.log('========================================================');
    console.log('🧪 Starting FarmFusion Web Automated Verification Suite');
    console.log('========================================================\n');

    const app = require('../server');
    // Allow server 1 second to bind
    await new Promise(r => setTimeout(r, 1000));

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        process.stdout.write(`• Testing: ${name}... `);
        try {
            await fn();
            console.log('✅ PASS');
            passed++;
        } catch (err) {
            console.log(`❌ FAIL (${err.code || err.message || err})`);
            failed++;
        }
    }

    // Helper request function
    function apiRequest(path, method = 'GET', body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const reqHeaders = { ...headers };
            let bodyStr = '';
            if (body) {
                bodyStr = JSON.stringify(body);
                reqHeaders['Content-Type'] = 'application/json';
                reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
            }
            if (sessionCookie) {
                reqHeaders['Cookie'] = sessionCookie;
            }

            const req = http.request({
                hostname: '127.0.0.1',
                port: PORT,
                path,
                method,
                headers: reqHeaders
            }, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    // Capture Set-Cookie if any
                    const setCookie = res.headers['set-cookie'];
                    if (setCookie && setCookie.length > 0) {
                        sessionCookie = setCookie[0].split(';')[0];
                    }
                    try {
                        const json = JSON.parse(data);
                        resolve({ status: res.statusCode, headers: res.headers, data: json });
                    } catch (e) {
                        resolve({ status: res.statusCode, headers: res.headers, data });
                    }
                });
            });

            req.on('error', reject);
            if (bodyStr) req.write(bodyStr);
            req.end();
        });
    }

    // TEST 1: Health Check
    await test('GET /api/health', async () => {
        const res = await apiRequest('/api/health');
        if (res.status !== 200 || res.data.status !== 'online') {
            throw new Error(`Expected 200 and status 'online', got ${res.status}`);
        }
    });

    // TEST 2: Login with Demo Farmer Account
    await test('POST /api/auth/login', async () => {
        const res = await apiRequest('/api/auth/login', 'POST', {
            email: 'ramesh@farmfusion.in',
            password: 'farmer123'
        });
        if (res.status !== 200 || !res.data.success) {
            throw new Error(`Login failed with status ${res.status}: ${res.data.message}`);
        }
        if (!sessionCookie) {
            throw new Error('No session cookie returned');
        }
    });

    // TEST 3: Authenticated /api/auth/me
    await test('GET /api/auth/me (Session verification)', async () => {
        const res = await apiRequest('/api/auth/me');
        if (res.status !== 200 || !res.data.authenticated || !res.data.user) {
            throw new Error(`Expected authenticated user, got status ${res.status}`);
        }
    });

    // TEST 4: Farmer Profile
    await test('GET /api/profile', async () => {
        const res = await apiRequest('/api/profile');
        if (res.status !== 200 || !res.data.profile) {
            throw new Error(`Expected farmer profile, got status ${res.status}`);
        }
    });

    // TEST 5: Crop Advisory Computation
    await test('POST /api/advisory/recommend', async () => {
        const res = await apiRequest('/api/advisory/recommend', 'POST', {
            soil_type: 'Alluvial',
            land_area: 5,
            season: 'Rabi',
            water_availability: 'Medium',
            state: 'Punjab'
        });
        if (res.status !== 200 || !res.data.recommendations || res.data.recommendations.length === 0) {
            throw new Error(`Expected recommendations array, got ${res.status}`);
        }
    });

    // TEST 6: Disease Directory
    await test('GET /api/diseases', async () => {
        const res = await apiRequest('/api/diseases');
        if (res.status !== 200 || !res.data.diseases || res.data.diseases.length === 0) {
            throw new Error(`Expected diseases list, got ${res.status}`);
        }
    });

    // TEST 7: Market Prices
    await test('GET /api/market', async () => {
        const res = await apiRequest('/api/market');
        if (res.status !== 200 || !res.data.records || res.data.records.length === 0) {
            throw new Error(`Expected mandi records, got ${res.status}`);
        }
    });

    // TEST 8: Weather Preset Locations
    await test('GET /api/weather/locations', async () => {
        const res = await apiRequest('/api/weather/locations');
        if (res.status !== 200 || !res.data.locations || res.data.locations.length === 0) {
            throw new Error(`Expected locations list, got ${res.status}`);
        }
    });

    // TEST 9: Reminders List (Read)
    await test('GET /api/reminders', async () => {
        const res = await apiRequest('/api/reminders');
        if (res.status !== 200 || !Array.isArray(res.data.reminders)) {
            throw new Error(`Expected reminders array, got ${res.status}`);
        }
    });

    // TEST 10: Create Reminder (Create)
    await test('POST /api/reminders (Create task)', async () => {
        const res = await apiRequest('/api/reminders', 'POST', {
            title: 'Automated Test Irrigation',
            crop_name: 'Wheat',
            category: 'Irrigation',
            reminder_date: '2026-11-10',
            reminder_time: '06:00:00',
            priority: 'High',
            description: 'Automated test task creation verification'
        });
        if (res.status !== 201 || !res.data.reminderId) {
            throw new Error(`Expected 201 and reminderId, got ${res.status}`);
        }
        createdReminderId = res.data.reminderId;
    });

    // TEST 11: Toggle Reminder Status (Update)
    await test('PATCH /api/reminders/:id/toggle (Status toggle)', async () => {
        const res = await apiRequest(`/api/reminders/${createdReminderId}/toggle`, 'PATCH', {
            status: 'Completed'
        });
        if (res.status !== 200 || !res.data.success) {
            throw new Error(`Expected 200 success, got ${res.status}`);
        }
    });

    // TEST 12: Delete Reminder (Delete)
    await test('DELETE /api/reminders/:id (Delete task)', async () => {
        const res = await apiRequest(`/api/reminders/${createdReminderId}`, 'DELETE');
        if (res.status !== 200 || !res.data.success) {
            throw new Error(`Expected 200 success, got ${res.status}`);
        }
    });

    // TEST 13: Expenses List (Read)
    await test('GET /api/expenses', async () => {
        const res = await apiRequest('/api/expenses');
        if (res.status !== 200 || !Array.isArray(res.data.expenses)) {
            throw new Error(`Expected expenses array, got ${res.status}`);
        }
    });

    // TEST 14: Create Expense (Create)
    await test('POST /api/expenses (Record expense)', async () => {
        const res = await apiRequest('/api/expenses', 'POST', {
            category: 'Machinery & Fuel',
            amount: 2500.00,
            expense_date: '2026-11-04',
            payment_method: 'Cash',
            description: 'Automated test diesel expense'
        });
        if (res.status !== 201 || !res.data.expenseId) {
            throw new Error(`Expected 201 and expenseId, got ${res.status}`);
        }
        createdExpenseId = res.data.expenseId;
    });

    // TEST 15: Expense Analytics
    await test('GET /api/expenses/analytics', async () => {
        const res = await apiRequest('/api/expenses/analytics');
        if (res.status !== 200 || !res.data.categoryBreakdown) {
            throw new Error(`Expected category breakdown, got ${res.status}`);
        }
    });

    // TEST 16: Delete Expense (Delete)
    await test('DELETE /api/expenses/:id (Delete expense)', async () => {
        const res = await apiRequest(`/api/expenses/${createdExpenseId}`, 'DELETE');
        if (res.status !== 200 || !res.data.success) {
            throw new Error(`Expected 200 success, got ${res.status}`);
        }
    });

    // TEST 17: Logout
    await test('POST /api/auth/logout', async () => {
        const res = await apiRequest('/api/auth/logout', 'POST');
        if (res.status !== 200 || !res.data.success) {
            throw new Error(`Expected 200 success on logout, got ${res.status}`);
        }
    });

    console.log('\n========================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
