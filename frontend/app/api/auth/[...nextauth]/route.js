import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

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
          
          // Log successful authentication with user ID for troubleshooting
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
      
      // Fetch subscription information from Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", token.sub));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Log user data retrieval
          console.log(`Retrieved user data for ${token.sub}`);
          
          // Add user profile data to the session
          session.user.firstName = userData.firstName || '';
          session.user.lastName = userData.lastName || '';
          
          // Add subscription data to the session with better handling
          session.user.subscribed = !!userData.subscribed;
          
          // Handle trial status with date checking
          let isOnTrial = !!userData.onTrial;
          if (isOnTrial && userData.trialEndDate) {
            try {
              const trialEndDate = new Date(userData.trialEndDate);
              const now = new Date();
              // If trial end date has passed, they're no longer on trial
              if (trialEndDate < now) {
                isOnTrial = false;
              }
            } catch (error) {
              console.warn(`Invalid trial end date format for user ${token.sub}:`, userData.trialEndDate);
              isOnTrial = false;
            }
          }
          
          session.user.onTrial = isOnTrial;
          session.user.subscriptionPlan = userData.subscriptionPlan;
          session.user.subscriptionId = userData.subscriptionId;
          
          // Ensure subscription active status is consistent with subscribed and trial status
          session.user.subscriptionActive = userData.subscriptionActive || 
                                            userData.subscribed || 
                                            isOnTrial || 
                                            false;
          
          session.user.profilePicture = userData.profilePicture || '';
          
          // Add trial information with safety checks
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
        // When user signs in, update token with user data and timestamp
        console.log(`Setting JWT token for user ID: ${user.id}, email: ${user.email}`);
        token.sub = user.id;
        token.email = user.email;
        token.authTimestamp = Date.now();
        token.loginTimestamp = user.loginTimestamp || Date.now();
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
    maxAge: 24 * 60 * 60, // Reduced from 14 days to 1 day
    updateAge: 2 * 60 * 60, // Refresh the JWT every 2 hours instead of daily
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 1 day in seconds - match session maxAge
        domain: process.env.NODE_ENV === "production" 
          ? 'next-gig.co.uk' 
          : undefined, // Only set domain in production
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 5, // 5 minutes - short-lived
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 1 day in seconds
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  // Add explicit secret to enhance security
  secret: process.env.NEXTAUTH_SECRET || "your-development-secret",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };