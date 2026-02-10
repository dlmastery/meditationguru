/**
 * Firestore persistence service for cross-session data.
 *
 * Provides typed CRUD operations for:
 * - Guru session memories (Feature 7)
 * - Dream journal entries (Feature 4)
 * - Wellness metrics / analytics (Feature 10)
 * - Study sessions (Feature 9)
 * - Group sessions (Feature 8)
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  DocId,
  SessionMemory,
  DreamEntry,
  DreamPatternAnalysis,
  WellnessMetrics,
  StudySession,
  GroupSession,
  GuruContext,
} from '@/types/features';

// ---------------------------------------------------------------------------
// Collection names
// ---------------------------------------------------------------------------

const COLLECTIONS = {
  SESSION_MEMORIES: 'sessionMemories',
  DREAM_ENTRIES: 'dreamEntries',
  DREAM_ANALYSES: 'dreamAnalyses',
  WELLNESS_METRICS: 'wellnessMetrics',
  STUDY_SESSIONS: 'studySessions',
  GROUP_SESSIONS: 'groupSessions',
} as const;

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

/**
 * Convert a Firestore document to a typed object, converting Timestamps to ISO strings.
 */
function fromFirestore<T>(data: DocumentData, id: string): T {
  const result: Record<string, unknown> = { id, ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate().toISOString();
    }
  }
  return result as T;
}

/**
 * Query documents from a collection with filters and ordering.
 */
async function queryCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[],
): Promise<T[]> {
  const ref = collection(db, collectionName);
  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => fromFirestore<T>(d.data(), d.id));
}

// ---------------------------------------------------------------------------
// Session Memories (Feature 7 – Guru Memory)
// ---------------------------------------------------------------------------

export async function saveSessionMemory(memory: Omit<SessionMemory, 'id'>): Promise<DocId> {
  const ref = collection(db, COLLECTIONS.SESSION_MEMORIES);
  const docRef = await addDoc(ref, {
    ...memory,
    createdAt: memory.createdAt ?? new Date().toISOString(),
  });
  return docRef.id;
}

export async function getSessionMemories(
  userId: DocId,
  maxCount = 20,
): Promise<SessionMemory[]> {
  return queryCollection<SessionMemory>(COLLECTIONS.SESSION_MEMORIES, [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxCount),
  ]);
}

/**
 * Build a guru context object from persisted session memories.
 * This is injected into the Gemini system prompt for personalized guidance.
 */
export async function buildGuruContext(
  userId: DocId,
  userGoals: string[],
  experienceLevel: string,
): Promise<GuruContext> {
  const memories = await getSessionMemories(userId, 15);

  const totalSessions = memories.length;
  const emotionCounts: Record<string, number> = {};
  const milestones: string[] = [];

  for (const m of memories) {
    emotionCounts[m.emotionAfter] = (emotionCounts[m.emotionAfter] ?? 0) + 1;
  }

  if (totalSessions >= 7) milestones.push('Completed one week of practice');
  if (totalSessions >= 30) milestones.push('Completed one month of practice');
  if (totalSessions >= 100) milestones.push('Century milestone: 100 sessions');

  const dominantEmotion = Object.entries(emotionCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? 'neutral';

  const greeting =
    totalSessions === 0
      ? 'Welcome to your first session. I am here to guide you.'
      : `Welcome back. This is session ${totalSessions + 1}. ` +
        `Last time we focused on ${memories[0]?.summary ?? 'meditation'}.`;

  return {
    userId,
    totalSessions,
    recentMemories: memories.slice(0, 5),
    userGoals,
    experienceLevel,
    emotionalTrend: `Your recent sessions tend toward feeling ${dominantEmotion}.`,
    milestones,
    personalizedGreeting: greeting,
  };
}

// ---------------------------------------------------------------------------
// Dream Journal (Feature 4)
// ---------------------------------------------------------------------------

export async function saveDreamEntry(entry: Omit<DreamEntry, 'id'>): Promise<DocId> {
  const ref = collection(db, COLLECTIONS.DREAM_ENTRIES);
  const docRef = await addDoc(ref, {
    ...entry,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  });
  return docRef.id;
}

export async function getDreamEntries(
  userId: DocId,
  maxCount = 50,
): Promise<DreamEntry[]> {
  return queryCollection<DreamEntry>(COLLECTIONS.DREAM_ENTRIES, [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxCount),
  ]);
}

export async function saveDreamAnalysis(
  analysis: DreamPatternAnalysis,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.DREAM_ANALYSES, analysis.userId);
  await setDoc(ref, analysis);
}

export async function getDreamAnalysis(
  userId: DocId,
): Promise<DreamPatternAnalysis | null> {
  const ref = doc(db, COLLECTIONS.DREAM_ANALYSES, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromFirestore<DreamPatternAnalysis>(snap.data(), snap.id);
}

// ---------------------------------------------------------------------------
// Wellness Metrics (Feature 10)
// ---------------------------------------------------------------------------

export async function saveWellnessMetrics(metrics: WellnessMetrics): Promise<void> {
  const docId = `${metrics.userId}_${metrics.periodStart}_${metrics.periodEnd}`;
  const ref = doc(db, COLLECTIONS.WELLNESS_METRICS, docId);
  await setDoc(ref, metrics);
}

export async function getWellnessMetrics(
  userId: DocId,
  maxPeriods = 12,
): Promise<WellnessMetrics[]> {
  return queryCollection<WellnessMetrics>(COLLECTIONS.WELLNESS_METRICS, [
    where('userId', '==', userId),
    orderBy('periodEnd', 'desc'),
    limit(maxPeriods),
  ]);
}

// ---------------------------------------------------------------------------
// Study Sessions (Feature 9)
// ---------------------------------------------------------------------------

export async function saveStudySession(
  session: Omit<StudySession, 'id'>,
): Promise<DocId> {
  const ref = collection(db, COLLECTIONS.STUDY_SESSIONS);
  const docRef = await addDoc(ref, {
    ...session,
    createdAt: session.createdAt ?? new Date().toISOString(),
  });
  return docRef.id;
}

export async function getStudySessions(
  userId: DocId,
  textId?: string,
  maxCount = 20,
): Promise<StudySession[]> {
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxCount),
  ];
  if (textId) {
    constraints.splice(1, 0, where('textId', '==', textId));
  }
  return queryCollection<StudySession>(COLLECTIONS.STUDY_SESSIONS, constraints);
}

// ---------------------------------------------------------------------------
// Group Sessions (Feature 8)
// ---------------------------------------------------------------------------

export async function createGroupSession(
  session: Omit<GroupSession, 'id'>,
): Promise<DocId> {
  const ref = collection(db, COLLECTIONS.GROUP_SESSIONS);
  const docRef = await addDoc(ref, {
    ...session,
    createdAt: session.createdAt ?? new Date().toISOString(),
  });
  return docRef.id;
}

export async function getGroupSession(
  sessionId: DocId,
): Promise<GroupSession | null> {
  const ref = doc(db, COLLECTIONS.GROUP_SESSIONS, sessionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return fromFirestore<GroupSession>(snap.data(), snap.id);
}

export async function getGroupSessionByInvite(
  inviteCode: string,
): Promise<GroupSession | null> {
  const results = await queryCollection<GroupSession>(
    COLLECTIONS.GROUP_SESSIONS,
    [where('inviteCode', '==', inviteCode), where('isActive', '==', true), limit(1)],
  );
  return results[0] ?? null;
}

export async function updateGroupSession(
  sessionId: DocId,
  updates: Partial<GroupSession>,
): Promise<void> {
  const ref = doc(db, COLLECTIONS.GROUP_SESSIONS, sessionId);
  await updateDoc(ref, updates as Record<string, unknown>);
}

export async function deleteGroupSession(sessionId: DocId): Promise<void> {
  const ref = doc(db, COLLECTIONS.GROUP_SESSIONS, sessionId);
  await deleteDoc(ref);
}
