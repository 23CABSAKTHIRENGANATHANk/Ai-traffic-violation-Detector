const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.resolve(__dirname, '..', 'backend');
const serverPort = 3000;
const healthUrl = `http://127.0.0.1:${serverPort}/health`;
const authUrl = `http://127.0.0.1:${serverPort}/api/auth/login`;
const recordUrl = `http://127.0.0.1:${serverPort}/api/violations/internal/record`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForBackend() {
    for (let i = 0; i < 20; i += 1) {
        try {
            const response = await fetch(healthUrl);
            if (response.ok) {
                return;
            }
        } catch (_) {
            // ignore until ready
        }
        await sleep(500);
    }
    throw new Error('Backend did not start within the expected time');
}

async function run() {
    console.log('Starting backend server...');
    const server = spawn('node', ['src/index.js'], {
        cwd: backendDir,
        env: { ...process.env, PORT: String(serverPort) },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    server.stdout.on('data', (chunk) => process.stdout.write(`[backend] ${chunk}`));
    server.stderr.on('data', (chunk) => process.stderr.write(`[backend ERR] ${chunk}`));

    try {
        await waitForBackend();
        console.log('Backend is ready. Logging in...');

        const loginResponse = await fetch(authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} ${await loginResponse.text()}`);
        }

        const { token } = await loginResponse.json();
        console.log('Received admin token. Recording a test violation...');

        const recordResponse = await fetch(recordUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                video_id: 'smoke_test_video_01',
                violation_type: 'OVERSPEEDING',
                timestamp: new Date().toISOString(),
                confidence: 0.97,
                speed: 88,
                vehicle_number: 'KA01AB1234',
                evidence_image: 'smoke_test_evidence.png',
                vehicle_type: 'MOTORCYCLE'
            })
        });

        if (!recordResponse.ok) {
            throw new Error(`Violation record failed: ${recordResponse.status} ${await recordResponse.text()}`);
        }

        const recorded = await recordResponse.json();
        console.log('Violation recorded:', recorded);

        console.log('Requesting generated challan PDF...');
        const challanResponse = await fetch(`${recordUrl.replace('/internal/record', '')}/${recorded.id}/challan`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!challanResponse.ok) {
            throw new Error(`Challan request failed: ${challanResponse.status} ${await challanResponse.text()}`);
        }

        const buffer = Buffer.from(await challanResponse.arrayBuffer());
        const outputFile = path.join(backendDir, 'uploads', `SmokeTest_Challan_${recorded.id}.pdf`);
        fs.writeFileSync(outputFile, buffer);
        console.log(`Smoke test challan saved: ${outputFile}`);
        console.log(`Challan size: ${buffer.length} bytes`);

        if (buffer.length < 1000) {
            throw new Error('Generated PDF appears too small and may be invalid');
        }

        console.log('Smoke test completed successfully. The backend route and PDF output are both working.');
    } catch (error) {
        console.error('Smoke test failed:', error);
        process.exitCode = 1;
    } finally {
        console.log('Shutting down backend server...');
        server.kill('SIGTERM');
    }
}

run();
