import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Query Firestore for existing user with this email
    const usersRef = collection(db, "users");
    const emailQuery = query(usersRef, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(emailQuery);

    const exists = !snapshot.empty;

    return Response.json({
      exists,
      message: exists ? "Email already registered" : "Email available"
    });
  } catch (error) {
    console.error("Email check error:", error);
    return Response.json(
      { error: "Failed to check email" },
      { status: 500 }
    );
  }
}
