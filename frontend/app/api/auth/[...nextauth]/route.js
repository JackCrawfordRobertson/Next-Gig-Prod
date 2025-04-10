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
            credentials.email === "alice@example.com" && 
            credentials.password === "password") {
          return { id: "demo-user-id", email: "alice@example.com" };
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
      session.user.id = token.sub;
      
      // Fetch subscription information from Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", token.sub));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Add user profile data to the session
          session.user.firstName = userData.firstName || '';
          
          // Add subscription data to the session
          session.user.subscribed = userData.subscribed || false;
          session.user.onTrial = userData.onTrial || false;
          session.user.subscriptionPlan = userData.subscriptionPlan;
          session.user.subscriptionId = userData.subscriptionId;
          session.user.subscriptionActive = userData.subscriptionActive || false;
          session.user.profilePicture = userData.profilePicture || '';

          
          // Add trial information if relevant
          if (userData.trialEndDate) {
            session.user.trialEndDate = userData.trialEndDate;
            
            // Calculate if trial is still active based on the end date
            const trialEndDate = new Date(userData.trialEndDate);
            const now = new Date();
            session.user.trialActive = trialEndDate > now;
          }
        }
      } catch (error) {
        console.error("Error fetching user subscription data:", error);
        // Don't fail the session if we can't get subscription data
        // Just proceed with the basic user info
      }
      
      return session;
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
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
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };