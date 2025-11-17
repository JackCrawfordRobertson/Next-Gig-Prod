import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";

// Enable debug logging
const DEBUG = process.env.NODE_ENV === "development";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("[Auth] authorize called with credentials:", credentials?.email ? "email provided" : "no email");

        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials - email:", !!credentials?.email, "password:", !!credentials?.password);
          return null;
        }

        try {
          const { db, collection, query, where, getDocs, updateDoc } = await import("@/lib/data/firebase");

          const emailToQuery = credentials.email.toLowerCase();
          console.log("[Auth] Looking up user:", emailToQuery);

          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", emailToQuery));
          const snapshot = await getDocs(q);

          console.log("[Auth] Query returned:", snapshot.empty ? "empty" : "found", snapshot.size, "docs");

          if (snapshot.empty) {
            console.log("[Auth] User not found:", emailToQuery);
            return null;
          }

          const userDoc = snapshot.docs[0];
          const userData = userDoc.data();

          console.log("[Auth] User found, checking password");

          if (!userData.password) {
            console.error("[Auth] User has no password set");
            return null;
          }

          // Check if password is hashed (bcrypt hash starts with $2a$, $2b$, or $2y$)
          const isHashedPassword = userData.password.startsWith('$2a$') ||
                                   userData.password.startsWith('$2b$') ||
                                   userData.password.startsWith('$2y$');

          let isValid = false;

          if (isHashedPassword) {
            // Password is hashed, use bcrypt compare
            console.log("[Auth] Comparing hashed passwords...");
            isValid = await compare(credentials.password, userData.password);
          } else {
            // Password is plain text (legacy), compare directly
            console.log("[Auth] Comparing plain text passwords (legacy)...");
            isValid = credentials.password === userData.password;

            // If plain text password matches, hash it and update in Firebase
            if (isValid) {
              console.log("[Auth] Plain text password matched. Auto-migrating to hashed password...");
              try {
                const hashedPassword = await hash(credentials.password, 12);
                await updateDoc(userDoc.ref, { password: hashedPassword });
                console.log("[Auth] Password successfully migrated to hashed format");
              } catch (updateError) {
                console.error("[Auth] Error updating password hash:", updateError.message);
                // Don't fail auth if we can't update, just log the error
              }
            }
          }

          console.log("[Auth] Password valid:", isValid);

          if (!isValid) {
            console.log("[Auth] Password mismatch for user:", emailToQuery);
            return null;
          }

          console.log("[Auth] User authenticated successfully:", emailToQuery);

          // Return minimal user data - NO PROFILE PICTURE
          return {
            id: userDoc.id,
            email: userData.email,
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          };
        } catch (error) {
          console.error("[Auth] Authentication error:", error.message);
          console.error("[Auth] Full error:", error);
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
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log("User signed in:", user.email);
    },
    async redirect({ url, baseUrl }) {
      // Return base url on login redirect
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };