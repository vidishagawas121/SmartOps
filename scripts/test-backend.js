const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

async function testBackend() {
  console.log('[TEST] Starting backend server process...');
  const serverProcess = spawn('node', ['dist/server.js'], {
    cwd: path.resolve(__dirname, '../backend'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: '5000' }
  });

  serverProcess.stdout.on('data', (data) => {
    process.stdout.write(`[SERVER OUT] ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    process.stderr.write(`[SERVER ERR] ${data}`);
  });

  // Helper for requests
  function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, headers: res.headers, data: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, headers: res.headers, data: body });
          }
        });
      });
      req.on('error', reject);
      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    });
  }

  // Poll for health check up to 90 seconds (allowing in-memory Mongo initialization)
  console.log('[TEST] Waiting for server health endpoint...');
  let healthy = false;
  for (let i = 0; i < 90; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/health',
        method: 'GET'
      });
      if (res.statusCode === 200 && res.data.status === 'healthy') {
        console.log('[TEST] Server is healthy!', res.data);
        healthy = true;
        break;
      }
    } catch (e) {
      // not yet up
    }
  }

  if (!healthy) {
    console.error('[TEST ERROR] Server did not become healthy within 45 seconds.');
    serverProcess.kill('SIGKILL');
    process.exit(1);
  }

  // Test Logins for all 4 roles
  const testRoles = [
    { role: 'Owner', identifier: 'owner@smartops.com', password: 'password123' },
    { role: 'Supervisor', identifier: 'supervisor@smartops.com', password: 'password123' },
    { role: 'Driver', identifier: 'driver@smartops.com', password: 'password123' },
    { role: 'Worker', identifier: 'worker@smartops.com', password: 'password123' },
  ];

  console.log('\n[TEST] Testing Authentication for all 4 roles...');
  const tokens = {};
  for (const cred of testRoles) {
    try {
      const loginPayload = JSON.stringify({ email: cred.identifier, identifier: cred.identifier, password: cred.password });
      const res = await makeRequest({
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginPayload)
        }
      }, loginPayload);

      tokens[cred.role] = res.data.token;
      console.log(`[AUTH RESULT ${cred.role}] Status: ${res.statusCode}`, {
        success: res.data.success,
        tokenReceived: !!(res.data.token || res.data.accessToken),
        userRole: res.data.user?.role,
        userName: res.data.user?.name || res.data.user?.fullName
      });

      if (res.statusCode !== 200 || !res.data.success) {
        console.error(`[TEST ERROR] Login failed for ${cred.role}:`, res.data);
      }
    } catch (err) {
      console.error(`[TEST ERROR] Request error during ${cred.role} login:`, err);
    }
  }

  console.log('\n[TEST] Testing Cross-Dashboard API Endpoints...');
  
  // 1. Supervisor reads tasks
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['Supervisor']}` }
    });
    console.log('[API TEST] Supervisor GET /api/tasks:', {
      status: res.statusCode,
      success: res.data?.success,
      taskCount: res.data?.data?.length || res.data?.count || 0,
      firstTask: res.data?.data?.[0]?.title
    });
  } catch (e) {
    console.error('[API TEST ERROR] Supervisor GET /api/tasks:', e.message);
  }

  // 2. Worker reads their tasks
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/tasks/my-tasks',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['Worker']}` }
    });
    console.log('[API TEST] Worker GET /api/tasks/my-tasks:', {
      status: res.statusCode,
      success: res.data?.success,
      taskCount: res.data?.data?.length || res.data?.count || 0,
      firstTask: res.data?.data?.[0]?.title
    });
  } catch (e) {
    console.error('[API TEST ERROR] Worker GET /api/tasks/my-tasks:', e.message);
  }

  // 3. Supervisor reads worker directory
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/workers',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['Supervisor']}` }
    });
    console.log('[API TEST] Supervisor GET /api/workers:', {
      status: res.statusCode,
      success: res.data?.success,
      workerCount: res.data?.data?.length || res.data?.count || 0,
      firstWorker: res.data?.data?.[0]?.name
    });
  } catch (e) {
    console.error('[API TEST ERROR] Supervisor GET /api/workers:', e.message);
  }

  // 4. Worker checks personal attendance
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/attendance/my-attendance',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['Worker']}` }
    });
    console.log('[API TEST] Worker GET /api/attendance/my-attendance:', {
      status: res.statusCode,
      success: res.data?.success,
      recordCount: res.data?.data?.length || 0
    });
  } catch (e) {
    console.error('[API TEST ERROR] Worker GET /api/attendance/my-attendance:', e.message);
  }

  // 5. Driver reads assigned trips
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/trips',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['Driver']}` }
    });
    console.log('[API TEST] Driver GET /api/trips:', {
      status: res.statusCode,
      tripCount: Array.isArray(res.data) ? res.data.length : (res.data?.data?.length || 0),
      firstTrip: Array.isArray(res.data) ? res.data[0]?.tripNumber : res.data?.data?.[0]?.tripNumber
    });
  } catch (e) {
    console.error('[API TEST ERROR] Driver GET /api/trips:', e.message);
  }

  // 6. Owner reads fleet
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/fleet',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${tokens['Owner']}` }
    });
    console.log('[API TEST] Owner GET /api/fleet:', {
      status: res.statusCode,
      vehicleCount: Array.isArray(res.data) ? res.data.length : (res.data?.data?.length || 0),
      firstVehicle: Array.isArray(res.data) ? res.data[0]?.vehicleNumber : res.data?.data?.[0]?.vehicleNumber
    });
  } catch (e) {
    console.error('[API TEST ERROR] Owner GET /api/fleet:', e.message);
  }

  console.log('\n[TEST] Gracefully stopping test server process...');
  serverProcess.kill('SIGTERM');
  await new Promise(r => setTimeout(r, 2000));
  console.log('[TEST] Test script completed successfully.');
  process.exit(0);
}

testBackend().catch(err => {
  console.error('[TEST FATAL]', err);
  process.exit(1);
});


