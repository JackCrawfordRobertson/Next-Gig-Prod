// app/api/auth/[...nextauth]/route.js - Replace existing file
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { FirestoreAdapter } from "@next-auth/firebase-adapter";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { compare } from "bcryptjs";

export const authOptions = {
  adapter: FirestoreAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {
          // Find user by email
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", credentials.email.toLowerCase()));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            console.log(`No user found with email: ${credentials.email}`);
            return null;
          }
          
          const userDoc = snapshot.docs[0];
          const user = userDoc.data();
          
          // Verify password
          const isValid = await compare(credentials.password, user.password);
          
          if (!isValid) {
            console.log("Password validation failed");
            return null;
          }
          
          // Return user object for JWT
          return {
            id: userDoc.id,
            email: user.email,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            subscribed: user.subscribed,
            onTrial: user.onTrial,
            isTester: user.isTester
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.profilePicture = token.profilePicture;
        session.user.subscribed = token.subscribed;
        session.user.onTrial = token.onTrial;
        session.user.isTester = token.isTester;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.profilePicture = user.profilePicture;
        token.subscribed = user.subscribed;
        token.onTrial = user.onTrial;
        token.isTester = user.isTester;
      }
      return token;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };