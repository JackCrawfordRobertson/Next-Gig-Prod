// scripts/manageTester.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Check if service account file exists
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: service-account.json file not found!');
  console.error('Please download your Firebase service account key and save it as service-account.json in the project root');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require(serviceAccountPath);
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function addTester(email, notes = "") {
  if (!email) {
    console.error('Error: Email is required');
    return;
  }
  
  try {
    // Check if tester already exists
    const testersRef = db.collection('testers');
    const snapshot = await testersRef.where('email', '==', email.toLowerCase()).get();
    
    if (!snapshot.empty) {
      console.log(`User ${email} is already a tester`);
      return;
    }
    
    // Add new tester
    await testersRef.add({
      email: email.toLowerCase(),
      addedOn: new Date().toISOString(),
      notes: notes
    });
    
    console.log(`✅ Added new tester: ${email}`);
  } catch (error) {
    console.error('Error adding tester:', error);
  }
}

async function removeTester(email) {
  if (!email) {
    console.error('Error: Email is required');
    return;
  }
  
  try {
    const testersRef = db.collection('testers');
    const snapshot = await testersRef.where('email', '==', email.toLowerCase()).get();
    
    if (snapshot.empty) {
      console.log(`No tester found with email: ${email}`);
      return;
    }
    
    // Delete the tester document
    await snapshot.docs[0].ref.delete();
    console.log(`✅ Removed tester: ${email}`);
  } catch (error) {
    console.error('Error removing tester:', error);
  }
}

async function listTesters() {
  try {
    const testersRef = db.collection('testers');
    const snapshot = await testersRef.get();
    
    if (snapshot.empty) {
      console.log('No testers found');
      return;
    }
    
    console.log('\nCurrent Testers:');
    console.log('----------------');
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.email} (Added: ${new Date(data.addedOn).toLocaleDateString()})`);
      if (data.notes) console.log(`  Notes: ${data.notes}`);
    });
    
    console.log(`\nTotal: ${snapshot.docs.length} testers`);
  } catch (error) {
    console.error('Error listing testers:', error);
  }
}

async function importTesters(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const emails = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    console.log(`Found ${emails.length} emails to import`);
    
    for (const email of emails) {
      await addTester(email);
    }
    
    console.log('Import completed');
  } catch (error) {
    console.error('Error importing testers:', error);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('Usage:');
  console.log('  node manageTester.js add <email> [notes]    - Add a new tester');
  console.log('  node manageTester.js remove <email>         - Remove a tester');
  console.log('  node manageTester.js list                   - List all testers');
  console.log('  node manageTester.js import <file>          - Import testers from file (one email per line)');
  process.exit(0);
}

(async () => {
  try {
    if (command === 'add') {
      const email = args[1];
      const notes = args.slice(2).join(' ');
      await addTester(email, notes);
    } else if (command === 'remove') {
      const email = args[1];
      await removeTester(email);
    } else if (command === 'list') {
      await listTesters();
    } else if (command === 'import') {
      const filePath = args[1];
      await importTesters(filePath);
    } else {
      console.error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
})();