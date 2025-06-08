import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

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
          return null;
        }
        
        try {
          const { db, collection, query, where, getDocs } = await import("@/lib/data/firebase");
          
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", credentials.email.toLowerCase()));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            return null;
          }
          
          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();
          
          const isValid = await compare(credentials.password, userData.password);
          
          if (!isValid) {
            return null;
          }
          
          // Return minimal user data - NO PROFILE PICTURE
          return {
            id: userDoc.id,
            email: userData.email,
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };