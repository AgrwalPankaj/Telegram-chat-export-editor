import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { chats, participants, messages, media, Chat, Participant, Message, Media, InsertChat, InsertParticipant, InsertMessage, InsertMedia } from "../drizzle/schema";

/**
 * Create a new chat
 */
export async function createChat(userId: number, name: string, description?: string): Promise<Chat> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(chats).values({
    userId,
    name,
    description,
  });

  const chatId = result[0].insertId as number;
  const created = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  return created[0];
}

/**
 * Get chat by ID
 */
export async function getChatById(chatId: number): Promise<Chat | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  return result[0];
}

/**
 * Get all chats for a user
 */
export async function getUserChats(userId: number): Promise<Chat[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(chats).where(eq(chats.userId, userId));
}

/**
 * Update chat
 */
export async function updateChat(chatId: number, updates: Partial<Omit<Chat, "id" | "createdAt" | "updatedAt">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as any;

  if (Object.keys(cleanUpdates).length > 0) {
    await db.update(chats).set(cleanUpdates).where(eq(chats.id, chatId));
  }
}

/**
 * Get chat messages with media
 */
export async function getChatMessages(chatId: number): Promise<(Message & { media?: Media[] })[]> {
  const db = await getDb();
  if (!db) return [];

  const msgs = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.messageIndex);

  // Fetch media for each message
  const result = await Promise.all(
    msgs.map(async (msg) => {
      const mediaList = await db.select().from(media).where(eq(media.messageId, msg.id));
      return { ...msg, media: mediaList };
    })
  );

  return result;
}

/**
 * Add message to chat
 */
export async function addMessage(chatId: number, participantId: number, text: string | null, timestamp: number, messageIndex?: number, isServiceMessage: boolean = false): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use provided messageIndex or get next one
  let nextIndex = messageIndex;
  if (nextIndex === undefined) {
    const lastMsg = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.messageIndex))
      .limit(1);

    nextIndex = (lastMsg[0]?.messageIndex ?? 0) + 1;
  }

  const result = await db.insert(messages).values({
    chatId,
    participantId: isServiceMessage ? null : participantId,
    text,
    timestamp,
    messageIndex: nextIndex,
    isServiceMessage,
  });

  const msgId = result[0].insertId as number;
  const created = await db.select().from(messages).where(eq(messages.id, msgId)).limit(1);
  return created[0];
}

/**
 * Update message
 */
export async function updateMessage(messageId: number, updates: Partial<Omit<Message, "id" | "chatId" | "messageIndex" | "createdAt" | "updatedAt">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as any;

  if (Object.keys(cleanUpdates).length > 0) {
    await db.update(messages).set(cleanUpdates).where(eq(messages.id, messageId));
  }
}

/**
 * Delete message and its media, plus orphaned date separators
 */
export async function deleteMessage(messageId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the message to find its chat
  const msg = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!msg.length) return;

  const chatId = msg[0].chatId;

  // Delete media
  await db.delete(media).where(eq(media.messageId, messageId));

  // Delete message
  await db.delete(messages).where(eq(messages.id, messageId));

  // Get all remaining messages in this chat
  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.messageIndex);

  // Find and delete orphaned service messages (date separators)
  // A separator is orphaned if its date group has no regular messages
  const toDelete: number[] = [];

  for (let i = 0; i < allMessages.length; i++) {
    const currentMsg = allMessages[i];
    if (currentMsg.isServiceMessage) {
      // Check if there are any regular messages immediately after this separator
      // until we hit another separator or end of list
      let hasRegularInGroup = false;
      for (let j = i + 1; j < allMessages.length; j++) {
        if (allMessages[j].isServiceMessage) {
          // Hit next separator, stop checking
          break;
        }
        // Found a regular message in this date group
        hasRegularInGroup = true;
        break;
      }

      // If this date group has no regular messages, mark separator for deletion
      if (!hasRegularInGroup) {
        toDelete.push(currentMsg.id);
      }
    }
  }

  // Delete all orphaned service messages
  for (const id of toDelete) {
    await db.delete(messages).where(eq(messages.id, id));
  }
}

/**
 * Add media to a message
 */
export async function addMedia(messageId: number, type: string, storageKey: string, fileName?: string, mimeType?: string): Promise<Media> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(media).values({
    messageId,
    type: type as "photo" | "video" | "gif" | "sticker" | "document",
    storageKey,
    fileName,
    mimeType,
  });

  const mediaId = result[0].insertId as number;
  const created = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  return created[0];
}

/**
 * Get media for a message
 */
export async function getMessageMedia(messageId: number): Promise<Media[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(media).where(eq(media.messageId, messageId));
}

/**
 * Delete media
 */
export async function deleteMedia(mediaId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(media).where(eq(media.id, mediaId));
}

/**
 * Create participant
 */
export async function createParticipant(chatId: number, name: string, initials?: string, avatarColor?: string): Promise<Participant> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(participants).values({
    chatId,
    name,
    initials,
    avatarColor,
  });

  const participantId = result[0].insertId as number;
  const created = await db.select().from(participants).where(eq(participants.id, participantId)).limit(1);
  return created[0];
}

/**
 * Get chat participants
 */
export async function getChatParticipants(chatId: number): Promise<Participant[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(participants).where(eq(participants.chatId, chatId));
}

/**
 * Update participant
 */
export async function updateParticipant(participantId: number, updates: Partial<Omit<Participant, "id" | "chatId" | "createdAt" | "updatedAt">>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as any;

  if (Object.keys(cleanUpdates).length > 0) {
    await db.update(participants).set(cleanUpdates).where(eq(participants.id, participantId));
  }
}

/**
 * Delete participant
 */
export async function deleteParticipant(participantId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(participants).where(eq(participants.id, participantId));
}

/**
 * Delete chat
 */
export async function deleteChat(chatId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete all messages and their media
  const chatMessages = await db.select().from(messages).where(eq(messages.chatId, chatId));
  for (const msg of chatMessages) {
    await db.delete(media).where(eq(media.messageId, msg.id));
  }
  await db.delete(messages).where(eq(messages.chatId, chatId));

  // Delete all participants
  await db.delete(participants).where(eq(participants.chatId, chatId));

  // Delete chat
  await db.delete(chats).where(eq(chats.id, chatId));
}

/**
 * Alias for addMessage - for backward compatibility
 */
export const createMessage = addMessage;
