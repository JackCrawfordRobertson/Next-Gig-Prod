// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Simplified version without Firebase adapter for now
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // For development mode with mock data
        if (process.env.NODE_ENV === "development" && 
          credentials.email === "jack@ya-ya.co.uk" && 
          credentials.password === "password") {
          return { id: "OS6veyhaPARd9KeCnXU11re06Dq2", email: "jack@ya-ya.co.uk" };
        }
        
        // Regular production path
        try {
          console.log(`Authenticating user: ${credentials.email}`);
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          // Log successful authentication with user ID
          console.log(`Authentication successful for ${credentials.email}, Firebase UID: ${userCredential.user.uid}`);
          
          return { 
            id: userCredential.user.uid, 
            email: userCredential.user.email,
            emailVerified: userCredential.user.emailVerified || false,
            loginTimestamp: Date.now()
          };
        } catch (error) {
          console.error(`Firebase Auth Error for ${credentials.email}:`, error);
          throw new Error("Invalid credentials.");
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Always ensure user object exists in session
      if (!session.user) session.user = {};
      
      // CRITICAL: Add Firebase UID to session from token
      session.user.id = token.sub;
      
      // Store auth timestamp to track session freshness
      session.authTimestamp = token.authTimestamp || Date.now();
      
      // Log session creation for debugging
      console.log(`Creating session for user ID: ${token.sub}, email: ${session.user.email}`);
      
      // Fetch user information from Firestore directly
      try {
        const userDoc = await getDoc(doc(db, "users", token.sub));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Log user data retrieval
          console.log(`Retrieved user data for ${token.sub}`);
          
          // Add user profile data to the session
          session.user.firstName = userData.firstName || '';
          session.user.lastName = userData.lastName || '';
          
          // Add subscription data to the session
          session.user.subscribed = !!userData.subscribed;
          session.user.onTrial = !!userData.onTrial;
          session.user.subscriptionPlan = userData.subscriptionPlan;
          session.user.subscriptionId = userData.subscriptionId;
          session.user.subscriptionActive = userData.subscriptionActive || 
                                          userData.subscribed || 
                                          userData.onTrial || 
                                          false;
          
          session.user.profilePicture = userData.profilePicture || '';
          
          // Add trial information
          if (userData.trialEndDate) {
            session.user.trialEndDate = userData.trialEndDate;
            
            try {
              // Calculate if trial is still active based on the end date
              const trialEndDate = new Date(userData.trialEndDate);
              const now = new Date();
              session.user.trialActive = trialEndDate > now;
              
              // Add remaining days information for UI display
              const msPerDay = 1000 * 60 * 60 * 24;
              const daysRemaining = Math.max(0, Math.ceil((trialEndDate - now) / msPerDay));
              session.user.trialDaysRemaining = daysRemaining;
            } catch (error) {
              console.warn(`Error calculating trial status for user ${token.sub}:`, error);
              session.user.trialActive = false;
              session.user.trialDaysRemaining = 0;
            }
          }
          
          // Additional helpful information for the frontend
          if (userData.subscriptionStartDate) {
            session.user.subscriptionStartDate = userData.subscriptionStartDate;
          }
          
          if (userData.hadPreviousSubscription) {
            session.user.hadPreviousSubscription = !!userData.hadPreviousSubscription;
          }
          
          // Add isTester flag if present
          if (userData.isTester) {
            session.user.isTester = userData.isTester;
          }
        } else {
          console.warn(`No user document found for ID: ${token.sub}`);
        }
      } catch (error) {
        console.error(`Error fetching user data for ${token.sub}:`, error);
        // Add error flag to session to help client identify problems
        session.dataError = true;
      }
      
      return session;
    },
    
    async jwt({ token, user }) {
      if (user) {
        // When user signs in, update token with user data
        console.log(`Setting JWT token for user ID: ${user.id}, email: ${user.email}`);
        token.sub = user.id;
        token.email = user.email;
        token.authTimestamp = Date.now();
      }
      
      return token;
    }
  },
  pages: {
    signIn: '/login',
    signOut: '/login', 
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day in seconds
    updateAge: 2 * 60 * 60, // 2 hours
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "your-development-secret",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };