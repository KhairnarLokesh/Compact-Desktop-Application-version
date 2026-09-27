import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";

export const saveSecurityAudit = async (userId, auditData) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const auditsRef = collection(
    db,
    "users",
    userId,
    "securityAudits"
  );

  const audit = {
    ...auditData,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(auditsRef, audit);

  return docRef.id;
};

export const getSecurityAudits = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const auditsRef = collection(
    db,
    "users",
    userId,
    "securityAudits"
  );

  const q = query(
    auditsRef,
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};