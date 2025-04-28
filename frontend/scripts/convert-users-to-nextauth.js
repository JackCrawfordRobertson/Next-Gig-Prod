// scripts/convert-users-to-nextauth.js - New script
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { hash } = require('bcryptjs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../service-account.json');
const serviceAccount = require(serviceAccountPath);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function convertUsers() {
  try {
    console.log("Starting user conversion...");
    
    // Get all existing users
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log("No users found to convert");
      return 0;
    }
    
    let convertedCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      try {
        const userData = doc.data();
        const userId = doc.id;
        
        // Skip if no email
        if (!userData.email) {
          console.log(`Skipping user ${userId} - no email found`);
          continue;
        }
        
        // Create temporary password (user can reset later)
        // In production, you might want to notify users that they need to reset their password
        const tempPassword = `NextGig${Math.random().toString(36).substring(2, 8)}!`;
        const hashedPassword = await hash(tempPassword, 12);
        
        // Prepare user data in NextAuth format
        const nextAuthUser = {
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          email: userData.email.toLowerCase(),
          emailVerified: new Date().toISOString(),
          password: hashedPassword,
          image: userData.profilePicture || "/av.svg",
          // Preserve existing fields
          ...userData,
          // Don't include any Firebase Auth specific fields
          uid: undefined,
          providerData: undefined,
        };
        
        // Update user document
        await usersRef.doc(userId).set(nextAuthUser);
        
        // Log temporary password - in real scenario, you'd email users
        console.log(`✅ Converted user ${userId} (${userData.email}) - Temp password: ${tempPassword}`);
        convertedCount++;
      } catch (err) {
        console.error(`Error converting user ${doc.id}:`, err);
        errorCount++;
      }
    }
    
    console.log(`Conversion complete!`);
    console.log(`- Successfully converted: ${convertedCount} users`);
    console.log(`- Errors: ${errorCount} users`);
    
    return convertedCount;
  } catch (error) {
    console.error("Error during user conversion:", error);
    throw error;
  }
}

// Run the conversion
convertUsers()
  .then(count => {
    console.log(`Conversion process finished. Converted ${count} users.`);
    process.exit(0);
  })
  .catch(err => {
    console.error("Fatal error during conversion:", err);
    process.exit(1);
  });