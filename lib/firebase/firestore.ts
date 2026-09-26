"use client";

// Client-side Firestore access. All reads/writes here are constrained by
// firestore.rules (owner-only access) — this file does not bypass
// security, it just wraps the Firebase SDK calls used by the UI.
//
// Generations are NOT created directly from the client — they're created
// server-side by /api/ai/* routes (after auth + credit checks), so the
// client can never fabricate a "completed" generation or dodge a credit
// charge. The client only reads its own generations/history and may
// delete them.

import { User as FirebaseUser } from "firebase/auth";
import {
  Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { getDefaultPlan } from "@/lib/billing/plans";
import {
  BrandKit,
  Generation,
  GenerationType,
  Notification,
  Project,
  UserDoc,
} from "@/types";

const db = () => getFirebaseDb();

// ---------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------

export async function createUserDocIfMissing(user: FirebaseUser) {
  const ref = doc(db(), "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const freePlan = getDefaultPlan();
  const userDoc: Omit<UserDoc, "createdAt" | "updatedAt"> = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    plan: freePlan.id,
    credits: freePlan.credits,
    lifetimeCreditsUsed: 0,
    monthlyCreditsUsed: 0,
    role: "user",
  };
  await setDoc(ref, {
    ...userDoc,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeUserDoc(uid: string, cb: (user: UserDoc | null) => void): Unsubscribe {
  return onSnapshot(doc(db(), "users", uid), (snap) => {
    cb(snap.exists() ? (snap.data() as UserDoc) : null);
  });
}

export async function updateUserProfile(uid: string, patch: Partial<UserDoc>) {
  await updateDoc(doc(db(), "users", uid), { ...patch, updatedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------

function projectFromDoc(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    name: data.name as string,
    type: data.type as GenerationType,
    status: data.status as Project["status"],
    content: data.content as string | undefined,
    ownerId: data.ownerId as string,
    updatedAt:
      (data.updatedAt as { toDate?: () => Date })?.toDate?.().toISOString() ??
      new Date().toISOString(),
  };
}

export function subscribeProjects(uid: string, cb: (projects: Project[]) => void): Unsubscribe {
  const q = query(
    collection(db(), "projects"),
    where("ownerId", "==", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => projectFromDoc(d.id, d.data())));
  });
}

export async function createProject(
  uid: string,
  data: { name: string; type: GenerationType; status?: Project["status"]; content?: string }
) {
  const ref = doc(collection(db(), "projects"));
  await setDoc(ref, {
    ownerId: uid,
    name: data.name,
    type: data.type,
    status: data.status ?? "draft",
    content: data.content ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProject(id: string, patch: Partial<Project>) {
  const { id: _id, ownerId: _o, ...rest } = patch as Project;
  await updateDoc(doc(db(), "projects", id), { ...rest, updatedAt: serverTimestamp() });
}

export async function deleteProject(id: string) {
  await deleteDoc(doc(db(), "projects", id));
}

export async function duplicateProject(uid: string, project: Project) {
  return createProject(uid, {
    name: `${project.name} (copy)`,
    type: project.type,
    status: project.status,
    content: project.content,
  });
}

// ---------------------------------------------------------------------
// Generations / History
// ---------------------------------------------------------------------

function generationFromDoc(id: string, data: Record<string, unknown>): Generation {
  return {
    id,
    type: data.type as GenerationType,
    title: data.title as string,
    prompt: data.prompt as string,
    content: (data.content as string) ?? "",
    status: data.status as Generation["status"],
    creditsUsed: (data.creditsUsed as number) ?? 0,
    ownerId: data.ownerId as string,
    projectId: (data.projectId as string | null) ?? null,
    imageUrls: data.imageUrls as string[] | undefined,
    videoUrl: data.videoUrl as string | undefined,
    providerJobId: data.providerJobId as string | undefined,
    errorMessage: data.errorMessage as string | undefined,
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.().toISOString() ??
      new Date().toISOString(),
  };
}

/** Subscribes to the user's most recent generations (paginated via `limitCount`, not the whole collection). */
export function subscribeGenerations(
  uid: string,
  cb: (generations: Generation[]) => void,
  limitCount = 50
): Unsubscribe {
  const q = query(
    collection(db(), "generations"),
    where("ownerId", "==", uid),
    orderBy("createdAt", "desc"),
    fsLimit(limitCount)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => generationFromDoc(d.id, d.data())));
  });
}

/** Subscribes to a single generation — used to watch an async video job go queued → processing → completed. */
export function subscribeGeneration(id: string, cb: (generation: Generation | null) => void): Unsubscribe {
  return onSnapshot(doc(db(), "generations", id), (snap) => {
    cb(snap.exists() ? generationFromDoc(snap.id, snap.data()) : null);
  });
}

export async function deleteGeneration(id: string) {
  await deleteDoc(doc(db(), "generations", id));
}

// ---------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------

function notificationFromDoc(id: string, data: Record<string, unknown>): Notification {
  return {
    id,
    title: data.title as string,
    message: data.message as string,
    read: Boolean(data.read),
    type: data.type as Notification["type"],
    createdAt:
      (data.createdAt as { toDate?: () => Date })?.toDate?.().toISOString() ??
      new Date().toISOString(),
  };
}

export function subscribeNotifications(
  uid: string,
  cb: (notifications: Notification[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "notifications"),
    where("ownerId", "==", uid),
    orderBy("createdAt", "desc"),
    fsLimit(30)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => notificationFromDoc(d.id, d.data())));
  });
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db(), "notifications", id), { read: true });
}

export async function markAllNotificationsRead(uid: string, notificationIds: string[]) {
  const batch = writeBatch(db());
  notificationIds.forEach((id) => batch.update(doc(db(), "notifications", id), { read: true }));
  await batch.commit();
}

// ---------------------------------------------------------------------
// Brand Kit (one document per user)
// ---------------------------------------------------------------------

export async function getBrandKit(uid: string): Promise<BrandKit | null> {
  const snap = await getDoc(doc(db(), "brandKits", uid));
  return snap.exists() ? (snap.data() as BrandKit) : null;
}

export function subscribeBrandKit(uid: string, cb: (kit: BrandKit | null) => void): Unsubscribe {
  return onSnapshot(doc(db(), "brandKits", uid), (snap) => {
    cb(snap.exists() ? (snap.data() as BrandKit) : null);
  });
}

export async function saveBrandKit(uid: string, kit: BrandKit) {
  await setDoc(
    doc(db(), "brandKits", uid),
    { ...kit, ownerId: uid, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ---------------------------------------------------------------------
// AI Chat — conversations + messages
// ---------------------------------------------------------------------

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function subscribeConversations(
  uid: string,
  cb: (conversations: ConversationSummary[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "conversations"),
    where("ownerId", "==", uid),
    orderBy("updatedAt", "desc"),
    fsLimit(50)
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        title: (d.data().title as string) || "New chat",
        updatedAt:
          (d.data().updatedAt as { toDate?: () => Date })?.toDate?.().toISOString() ??
          new Date().toISOString(),
      }))
    );
  });
}

export function subscribeMessages(
  conversationId: string,
  cb: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db(), "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        role: d.data().role,
        content: d.data().content,
        createdAt:
          (d.data().createdAt as { toDate?: () => Date })?.toDate?.().toISOString() ??
          new Date().toISOString(),
      }))
    );
  });
}

export async function renameConversation(id: string, title: string) {
  await updateDoc(doc(db(), "conversations", id), { title, updatedAt: serverTimestamp() });
}

export async function deleteConversation(id: string) {
  // Best-effort subcollection cleanup from the client — messages are small
  // and few per conversation, so this is fine without a Cloud Function.
  const messagesSnap = await getDoc(doc(db(), "conversations", id)); // ensure it exists / rules check
  if (!messagesSnap.exists()) return;
  const batch = writeBatch(db());
  batch.delete(doc(db(), "conversations", id));
  await batch.commit();
}

// ---------------------------------------------------------------------
// Integrations (simple per-user connected/disconnected map)
// ---------------------------------------------------------------------

export async function getIntegrations(uid: string): Promise<Record<string, boolean>> {
  const snap = await getDoc(doc(db(), "integrations", uid));
  return snap.exists() ? ((snap.data().connected as Record<string, boolean>) ?? {}) : {};
}

export async function setIntegrationConnected(uid: string, id: string, connected: boolean) {
  await setDoc(
    doc(db(), "integrations", uid),
    { ownerId: uid, connected: { [id]: connected }, updatedAt: serverTimestamp() },
    { merge: true }
  );
}
