/**
 * Group session service for multi-participant meditation and yoga sessions.
 *
 * Handles invite code generation, session creation/joining, and building
 * group-aware system prompts for the Gemini guru.
 */

import type { GroupSession, GroupParticipant } from '@/types/features';
import {
  createGroupSession as persistGroupSession,
  getGroupSessionByInvite,
  updateGroupSession,
} from './persistence';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INVITE_CODE_LENGTH = 6;
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
const DEFAULT_MAX_PARTICIPANTS = 8;

// ---------------------------------------------------------------------------
// Invite code generation
// ---------------------------------------------------------------------------

/**
 * Generate a 6-character alphanumeric invite code.
 * Uses characters that avoid visual ambiguity (no 0/O/1/I).
 */
export function generateInviteCode(): string {
  const chars = INVITE_CODE_CHARS;
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ---------------------------------------------------------------------------
// Session creation
// ---------------------------------------------------------------------------

/**
 * Create and persist a new group session.
 *
 * @param hostId - Firebase user ID of the host
 * @param hostName - Display name of the host
 * @param title - Session title chosen by the host
 * @param sessionType - Type of session (meditation, yoga, or mixed)
 * @param maxParticipants - Maximum number of participants (default 8)
 * @returns The newly created GroupSession with its Firestore ID
 */
export async function createNewGroupSession(
  hostId: string,
  hostName: string,
  title: string,
  sessionType: 'meditation' | 'yoga' | 'mixed',
  maxParticipants: number = DEFAULT_MAX_PARTICIPANTS,
): Promise<GroupSession> {
  const inviteCode = generateInviteCode();
  const now = new Date().toISOString();

  const host: GroupParticipant = {
    userId: hostId,
    displayName: hostName,
    role: 'host',
    cameraEnabled: false,
    joinedAt: now,
  };

  const sessionData: Omit<GroupSession, 'id'> = {
    hostId,
    title,
    sessionType,
    participants: [host],
    maxParticipants,
    isActive: true,
    inviteCode,
    createdAt: now,
  };

  const docId = await persistGroupSession(sessionData);

  return { ...sessionData, id: docId };
}

// ---------------------------------------------------------------------------
// Joining a session
// ---------------------------------------------------------------------------

/**
 * Join an existing group session by invite code.
 *
 * Returns the updated session on success, or null if the code is invalid,
 * the session is full, or the session is no longer active.
 *
 * @param inviteCode - The 6-character invite code
 * @param userId - Firebase user ID of the joining participant
 * @param displayName - Display name of the joining participant
 * @returns Updated GroupSession or null if join failed
 */
export async function joinGroupSession(
  inviteCode: string,
  userId: string,
  displayName: string,
): Promise<GroupSession | null> {
  const session = await getGroupSessionByInvite(inviteCode.toUpperCase());

  if (!session) return null;
  if (!session.isActive) return null;
  if (session.participants.length >= session.maxParticipants) return null;

  // Already joined
  const alreadyJoined = session.participants.some((p) => p.userId === userId);
  if (alreadyJoined) return session;

  const newParticipant: GroupParticipant = {
    userId,
    displayName,
    role: 'participant',
    cameraEnabled: false,
    joinedAt: new Date().toISOString(),
  };

  const updatedParticipants = [...session.participants, newParticipant];

  await updateGroupSession(session.id, {
    participants: updatedParticipants,
  });

  return { ...session, participants: updatedParticipants };
}

// ---------------------------------------------------------------------------
// System prompt construction
// ---------------------------------------------------------------------------

/**
 * Format a list of participants into a human-readable string.
 *
 * @param participants - The participant list from a GroupSession
 * @returns A formatted multi-line string listing each participant and their role
 */
export function formatParticipantList(
  participants: readonly GroupParticipant[],
): string {
  return participants
    .map((p) => {
      const role = p.role === 'host' ? ' (host)' : '';
      return `- ${p.displayName}${role}`;
    })
    .join('\n');
}

/**
 * Build a system prompt extension for the Gemini guru that includes
 * awareness of all participants and their roles.
 *
 * This is injected as an `additionalSystemPrompt` into the
 * EnhancedGeminiLiveSession config.
 *
 * @param session - The active GroupSession
 * @returns A prompt string to append to the guru system prompt
 */
export function buildGroupSystemPrompt(session: GroupSession): string {
  const participantList = formatParticipantList(session.participants);
  const count = session.participants.length;

  return [
    'GROUP SESSION CONTEXT:',
    `This is a group ${session.sessionType} session titled "${session.title}".`,
    `There are ${count} participant${count !== 1 ? 's' : ''} present:\n${participantList}`,
    '',
    'GUIDELINES FOR GROUP SESSIONS:',
    '- Address the group collectively using inclusive language ("everyone", "together").',
    '- Occasionally address individual participants by name to maintain engagement.',
    '- Keep instructions clear and pace them for the whole group.',
    '- Encourage synchronization of breathing and movement across participants.',
    '- The host manages the session flow; defer to them for transitions.',
    `- The host is ${session.participants.find((p) => p.role === 'host')?.displayName ?? 'unknown'}.`,
    '- Maintain a warm, inclusive atmosphere that welcomes all experience levels.',
    '- When giving pose or breathing corrections, specify which participant you are addressing.',
  ].join('\n');
}
