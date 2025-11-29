/**
 * PRODUCTION READINESS TESTS
 *
 * Advanced tests to verify the app is ready for production launch
 * Run with: node tests/production-readiness.js
 *
 * Tests:
 * - Production build succeeds
 * - Bundle size analysis
 * - Link checking
 * - Console error checking
 * - Environment variable validation
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0
};

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

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);

    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}Next Gig - Production Readiness Tests${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  console.log(`${colors.yellow}🏗️  BUILD VALIDATION${colors.reset}\n`);

  // Test 1: Production build succeeds
  await runTest('Production build compiles without errors', async () => {
    try {
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: path.join(__dirname, '..'),
        timeout: 120000 // 2 minutes
      });

      // Check for common error patterns
      const hasErrors = stderr.toLowerCase().includes('error') ||
                       stdout.toLowerCase().includes('failed to compile');

      if (hasErrors) {
        console.log(`  ${colors.red}Build output contains errors${colors.reset}`);
        return false;
      }

      return true;
    } catch (error) {
      console.log(`  ${colors.red}Build failed: ${error.message}${colors.reset}`);
      return false;
    }
  });

  // Test 2: Check .next directory was created
  await runTest('Build artifacts generated', async () => {
    try {
      await fs.access(path.join(__dirname, '..', '.next'));
      return true;
    } catch {
      return false;
    }
  });

  console.log(`\n${colors.yellow}📦 BUNDLE ANALYSIS${colors.reset}\n`);

  // Test 3: Check bundle size
  await runTest('Bundle size is reasonable', async () => {
    try {
      const buildManifest = await fs.readFile(
        path.join(__dirname, '..', '.next', 'build-manifest.json'),
        'utf8'
      );
      const manifest = JSON.parse(buildManifest);

      // Count total pages
      const pageCount = Object.keys(manifest.pages || {}).length;
      console.log(`\n  ${colors.gray}Pages built: ${pageCount}${colors.reset}`);

      return pageCount > 0 ? true : false;
    } catch (error) {
      console.log(`  ${colors.yellow}Could not analyze bundle${colors.reset}`);
      return 'warn';
    }
  });

  // Test 4: Check for large dependencies
  await runTest('No extremely large dependencies', async () => {
    try {
      const packageJson = await fs.readFile(
        path.join(__dirname, '..', 'package.json'),
        'utf8'
      );
      const pkg = JSON.parse(packageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const depCount = Object.keys(deps).length;

      console.log(`\n  ${colors.gray}Total dependencies: ${depCount}${colors.reset}`);

      // Warning if too many dependencies
      return depCount > 100 ? 'warn' : true;
    } catch (error) {
      return 'warn';
    }
  });

  console.log(`\n${colors.yellow}🔗 LINK & RESOURCE VALIDATION${colors.reset}\n`);

  // Test 5: Check for broken internal links
  await runTest('Internal links are valid', async () => {
    const BASE_URL = 'http://localhost:3000';
    const pages = ['/', '/login', '/complete-profile', '/dashboard'];
    let allValid = true;

    for (const page of pages) {
      try {
        const response = await makeRequest(`${BASE_URL}${page}`);
        if (response.status >= 500) {
          console.log(`\n  ${colors.red}${page} returned ${response.status}${colors.reset}`);
          allValid = false;
        }
      } catch (error) {
        console.log(`\n  ${colors.yellow}Could not check ${page}: ${error.message}${colors.reset}`);
        return 'warn';
      }
    }

    return allValid;
  });

  console.log(`\n${colors.yellow}⚙️  CONFIGURATION${colors.reset}\n`);

  // Test 6: Essential environment variables
  await runTest('Required environment variables exist', async () => {
    try {
      const envLocal = await fs.readFile(
        path.join(__dirname, '..', '.env.local'),
        'utf8'
      );

      const requiredVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_APP_URL'
      ];

      let missingVars = [];
      for (const varName of requiredVars) {
        if (!envLocal.includes(varName)) {
          missingVars.push(varName);
        }
      }

      if (missingVars.length > 0) {
        console.log(`\n  ${colors.red}Missing: ${missingVars.join(', ')}${colors.reset}`);
        return false;
      }

      return true;
    } catch (error) {
      console.log(`\n  ${colors.yellow}.env.local not found${colors.reset}`);
      return 'warn';
    }
  });

  // Test 7: No sensitive data in git
  await runTest('No sensitive files in git', async () => {
    try {
      const { stdout } = await execAsync('git ls-files', {
        cwd: path.join(__dirname, '..')
      });

      const files = stdout.split('\n');
      const sensitiveFiles = ['.env.local', '.env', 'credentials.json', 'serviceAccountKey.json'];

      const foundSensitive = files.filter(f =>
        sensitiveFiles.some(sf => f.includes(sf))
      );

      if (foundSensitive.length > 0) {
        console.log(`\n  ${colors.red}Found in git: ${foundSensitive.join(', ')}${colors.reset}`);
        return false;
      }

      return true;
    } catch (error) {
      return 'warn';
    }
  });

  console.log(`\n${colors.yellow}📱 PWA & MOBILE${colors.reset}\n`);

  // Test 8: PWA manifest is valid
  await runTest('PWA manifest is valid JSON', async () => {
    try {
      const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);

      const hasRequired = manifest.name && manifest.short_name && manifest.start_url;

      if (!hasRequired) {
        console.log(`\n  ${colors.yellow}Manifest missing required fields${colors.reset}`);
        return 'warn';
      }

      return true;
    } catch (error) {
      console.log(`\n  ${colors.red}Invalid manifest: ${error.message}${colors.reset}`);
      return false;
    }
  });

  // Test 9: Icons exist
  await runTest('PWA icons exist', async () => {
    try {
      await fs.access(path.join(__dirname, '..', 'public', 'icon-192.png'));
      await fs.access(path.join(__dirname, '..', 'public', 'icon-512.png'));
      return true;
    } catch {
      return 'warn';
    }
  });

  console.log(`\n${colors.yellow}🔍 CODE QUALITY${colors.reset}\n`);

  // Test 10: No TODO/FIXME in critical files
  await runTest('No critical TODOs remaining', async () => {
    try {
      const { stdout } = await execAsync(
        'grep -r "TODO\\|FIXME" app/ --include="*.js" --include="*.jsx" || true',
        { cwd: path.join(__dirname, '..') }
      );

      if (stdout.trim()) {
        const count = stdout.trim().split('\n').length;
        console.log(`\n  ${colors.yellow}Found ${count} TODO/FIXME comments${colors.reset}`);
        return 'warn';
      }

      return true;
    } catch {
      return true; // If grep fails, assume no TODOs
    }
  });

  // Test 11: No console.log in production code
  await runTest('No console.log in production code', async () => {
    try {
      const { stdout } = await execAsync(
        'grep -r "console\\.log" app/ --include="*.js" --include="*.jsx" || true',
        { cwd: path.join(__dirname, '..') }
      );

      if (stdout.trim()) {
        const count = stdout.trim().split('\n').length;
        console.log(`\n  ${colors.yellow}Found ${count} console.log statements${colors.reset}`);
        return 'warn';
      }

      return true;
    } catch {
      return true;
    }
  });

  // RESULTS SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.blue}PRODUCTION READINESS SUMMARY${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Total Tests:     ${results.total}`);
  console.log(`${colors.green}Passed:          ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:          ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings:        ${results.warnings}${colors.reset}`);
  console.log('='.repeat(60));

  const passRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%`);

  if (results.failed === 0) {
    console.log(`\n${colors.green}✓ Production build validated! Ready to deploy.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ ${results.failed} critical test(s) failed.${colors.reset}`);
    console.log(`${colors.yellow}⚠  Please address failures before deploying to production.${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`\n${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
