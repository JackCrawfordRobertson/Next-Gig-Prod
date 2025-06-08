// app/api/confirm-reset/route.js
import { db } from "@/lib/data/firebase";
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { hash } from "bcryptjs";

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find token
    const tokensRef = collection(db, "verification_tokens");
    const q = query(tokensRef, where("token", "==", token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return Response.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const tokenDoc = snapshot.docs[0];
    const tokenData = tokenDoc.data();

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires)) {
      await deleteDoc(tokenDoc.ref);
      return Response.json({ error: "Token has expired" }, { status: 400 });
    }

    // Find user
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", tokenData.identifier));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Update password
    const userDoc = userSnapshot.docs[0];
    const hashedPassword = await hash(password, 12);

    await updateDoc(doc(db, "users", userDoc.id), {
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    // Delete token
    await deleteDoc(tokenDoc.ref);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Password reset confirmation error:", error);
    return Response.json({ error: "Failed to reset password" }, { status: 500 });
  }
}