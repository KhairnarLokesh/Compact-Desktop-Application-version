import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

export const saveUserSettings = async (userId, settings) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const userRef = doc(db, "users", userId);

  await setDoc(
    userRef,
    {
      settings,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return true;
};

export const getUserSettings = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data().settings || null;
};