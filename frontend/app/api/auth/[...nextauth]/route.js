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
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          return { id: userCredential.user.uid, email: userCredential.user.email };
        } catch (error) {
          console.error("Firebase Auth Error:", error);
          throw new Error("Invalid credentials.");
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Always ensure user object exists in session
      if (!session.user) session.user = {};
      
      // Add Firebase UID to session
      session.user.id = token.sub;
      
      // Store auth timestamp to track session freshness
      session.authTimestamp = token.authTimestamp || Date.now();
      
      // Fetch subscription information from Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", token.sub));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
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
                // We would ideally update the user document here, but for
                // session callbacks it's better to avoid writes
              }
            } catch (error) {
              console.warn("Invalid trial end date format:", userData.trialEndDate);
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
              console.warn("Error calculating trial status:", error);
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
        }
      } catch (error) {
        console.error("Error fetching user subscription data:", error);
        // Add error flag to session to help client identify problems
        session.dataError = true;
      }
      
      return session;
    },
    
    async jwt({ token, user }) {
      if (user) {
        // When user signs in, update token with user data and timestamp
        token.sub = user.id;
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
    maxAge: 14 * 24 * 60 * 60, // 14 days in seconds
    updateAge: 24 * 60 * 60, // Refresh the JWT once per day
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
        maxAge: 14 * 24 * 60 * 60, // 14 days in seconds - match session maxAge
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
        maxAge: 14 * 24 * 60 * 60, // 14 days in seconds
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
  // Add explicit secret to enhance security
  secret: process.env.NEXTAUTH_SECRET || "your-development-secret",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };