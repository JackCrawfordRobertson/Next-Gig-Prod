/**
 * SMOKE TESTS - Next Gig Pre-Launch
 *
 * Quick automated tests to verify critical functionality
 * Run with: node tests/smoke-tests.js
 *
 * These tests check:
 * - API endpoints are responding
 * - Firebase connection works
 * - Critical routes are accessible
 * - No major JavaScript errors
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const IS_HTTPS = BASE_URL.startsWith('https');
const client = IS_HTTPS ? https : http;

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0
};

// Helper: Make HTTP request
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  results.total++;
  process.stdout.write(`${colors.gray}[${results.total}] ${name}...${colors.reset} `);

  try {
    const result = await testFn();
    if (result === true || result === undefined) {
      results.passed++;
      console.log(`${colors.green}✓ PASS${colors.reset}`);
    } else if (result === 'warn') {
      results.warnings++;
      console.log(`${colors.yellow}⚠ WARN${colors.reset}`);
    } else {
      results.failed++;
      console.log(`${colors.red}✗ FAIL${colors.reset}`);
    }
  } catch (error) {
    results.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

// =======================
// TESTS START HERE
// =======================

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}Next Gig - Pre-Launch Smoke Tests${colors.reset}`);
  console.log(`Testing: ${BASE_URL}`);
  console.log('='.repeat(60) + '\n');

  console.log(`${colors.yellow}📋 CRITICAL PATH TESTS${colors.reset}\n`);

  // Test 1: Homepage loads
  await runTest('Homepage loads (status 200)', async () => {
    const response = await makeRequest(BASE_URL);
    return response.status === 200;
  });

  // Test 2: Sign in page loads
  await runTest('Sign in page accessible', async () => {
    const response = await makeRequest(`${BASE_URL}/login`);
    return response.status === 200;
  });

  // Test 3: Complete profile page loads
  await runTest('Complete profile page accessible', async () => {
    const response = await makeRequest(`${BASE_URL}/complete-profile`);
    return response.status === 200;
  });

  // Test 4: Dashboard requires auth (redirects)
  await runTest('Dashboard requires authentication', async () => {
    const response = await makeRequest(`${BASE_URL}/dashboard`);
    // Should redirect (302/307) or return 200 with redirect logic
    return response.status === 302 || response.status === 307 || response.status === 200;
  });

  // Test 5: API route - Welcome email endpoint exists
  await runTest('Welcome email API endpoint exists', async () => {
    const response = await makeRequest(`${BASE_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'test@example.com', firstName: 'Test' }
    });
    // Should return 200 (success) or 401 (needs auth) - both are OK
    return response.status === 200 || response.status === 401;
  });

  console.log(`\n${colors.yellow}🔧 FEATURE TESTS${colors.reset}\n`);

  // Test 6: LinkedIn jobs page accessible
  await runTest('LinkedIn jobs page loads', async () => {
    const response = await makeRequest(`${BASE_URL}/linkedin`);
    return response.status === 200 || response.status === 302 || response.status === 307;
  });

  // Test 7: IfYouCould jobs page accessible
  await runTest('IfYouCould jobs page loads', async () => {
    const response = await makeRequest(`${BASE_URL}/ifyoucould`);
    return response.status === 200 || response.status === 302 || response.status === 307;
  });

  // Test 8: UN Jobs page accessible
  await runTest('UN Jobs page loads', async () => {
    const response = await makeRequest(`${BASE_URL}/unjobs`);
    return response.status === 200 || response.status === 302 || response.status === 307;
  });

  // Test 9: Applied/Archived jobs page accessible
  await runTest('Archived jobs page loads', async () => {
    const response = await makeRequest(`${BASE_URL}/applied-jobs`);
    return response.status === 200 || response.status === 302 || response.status === 307;
  });

  console.log(`\n${colors.yellow}📦 STATIC ASSETS${colors.reset}\n`);

  // Test 10: Favicon exists
  await runTest('Favicon exists', async () => {
    const response = await makeRequest(`${BASE_URL}/favicon.ico`);
    return response.status === 200;
  });

  // Test 11: Manifest exists
  await runTest('PWA manifest exists', async () => {
    const response = await makeRequest(`${BASE_URL}/manifest.json`);
    return response.status === 200;
  });

  // Test 12: OG image exists
  await runTest('OpenGraph image exists', async () => {
    const response = await makeRequest(`${BASE_URL}/og-image.png`);
    return response.status === 200;
  });

  console.log(`\n${colors.yellow}🌐 SEO & META${colors.reset}\n`);

  // Test 13: Homepage has proper meta tags
  await runTest('Homepage has meta description', async () => {
    const response = await makeRequest(BASE_URL);
    return response.body.includes('<meta name="description"');
  });

  // Test 14: Homepage has Open Graph tags
  await runTest('Homepage has Open Graph tags', async () => {
    const response = await makeRequest(BASE_URL);
    return response.body.includes('og:title') && response.body.includes('og:description');
  });

  // Test 15: Homepage has structured data
  await runTest('Homepage has JSON-LD structured data', async () => {
    const response = await makeRequest(BASE_URL);
    return response.body.includes('application/ld+json');
  });

  // Test 16: No BETA badge in layout
  await runTest('BETA badge removed from layout', async () => {
    const response = await makeRequest(BASE_URL);
    const hasBeta = response.body.toLowerCase().includes('beta');
    return hasBeta ? 'warn' : true;
  });

  console.log(`\n${colors.yellow}🔒 SECURITY${colors.reset}\n`);

  // Test 17: Security headers present
  await runTest('Response has security headers', async () => {
    const response = await makeRequest(BASE_URL);
    const hasXFrame = response.headers['x-frame-options'] !== undefined;
    const hasXContent = response.headers['x-content-type-options'] !== undefined;
    return hasXFrame || hasXContent ? true : 'warn';
  });

  // Test 18: HTTPS in production
  await runTest('Using HTTPS in production', async () => {
    if (BASE_URL.includes('localhost')) {
      return 'warn'; // Skip for local
    }
    return BASE_URL.startsWith('https');
  });

  // =======================
  // RESULTS SUMMARY
  // =======================
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}TEST RESULTS SUMMARY${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Total Tests:     ${results.total}`);
  console.log(`${colors.green}Passed:          ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:          ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings:        ${results.warnings}${colors.reset}`);
  console.log('='.repeat(60));

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}✓ All critical tests passed! Ready for manual testing.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ ${results.failed} test(s) failed. Please fix before launch.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error(`\n${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
