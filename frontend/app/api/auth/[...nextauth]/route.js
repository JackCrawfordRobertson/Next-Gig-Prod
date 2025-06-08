import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { compare, hash } from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }
        
        try {
          // Find user by email
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", credentials.email.toLowerCase()));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            throw new Error("User not found");
          }
          
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          
          // Check if password exists (for new NextAuth users)
          if (!userData.password) {
            throw new Error("Please reset your password");
          }
          
          // Verify password
          const isValid = await compare(credentials.password, userData.password);
          
          if (!isValid) {
            throw new Error("Invalid password");
          }
          
          // Return user object with all necessary data
          return {
            id: userDoc.id,
            email: userData.email,
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            profilePicture: userData.profilePicture,
            subscribed: userData.subscribed || false,
            onTrial: userData.onTrial || false,
            isTester: userData.isTester || false,
            subscriptionId: userData.subscriptionId || null,
            trialEndDate: userData.trialEndDate || null
          };
        } catch (error) {
          console.error("Authorization error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          subscribed: user.subscribed,
          onTrial: user.onTrial,
          isTester: user.isTester,
          subscriptionId: user.subscriptionId,
          trialEndDate: user.trialEndDate
        };
      }
      
      // Update token if user data changes
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      
      // Return previous token if nothing has changed
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user = {
        ...session.user,
        id: token.id,
        firstName: token.firstName,
        lastName: token.lastName,
        profilePicture: token.profilePicture,
        subscribed: token.subscribed,
        onTrial: token.onTrial,
        isTester: token.isTester,
        subscriptionId: token.subscriptionId,
        trialEndDate: token.trialEndDate
      };
      
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };