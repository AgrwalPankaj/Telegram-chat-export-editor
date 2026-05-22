import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createChat,
  getChatById,
  getUserChats,
  updateChat,
  deleteChat,
  createParticipant,
  getChatParticipants,
  updateParticipant,
  deleteParticipant,
  createMessage,
  getChatMessages,
  updateMessage,
  deleteMessage,
  addMedia,
  getMessageMedia,
  deleteMedia,
} from "./db-chat";

import { parseTelegramExport, getInitials, getAvatarColor } from "./parser";
import { generateTelegramHTML } from "./exporter";
import { generateRandomTimestamps } from "./randomizer";
import { storagePut } from "./storage";

export const chatRouter = router({
  // Chat operations
  createChat: protectedProcedure
    .input(z.object({ name: z.string().min(1), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return createChat(ctx.user.id, input.name, input.description);
    }),

  getChatById: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input }) => {
      return getChatById(input.chatId);
    }),

  getUserChats: protectedProcedure.query(async ({ ctx }) => {
    return getUserChats(ctx.user.id);
  }),

  updateChat: protectedProcedure
    .input(z.object({ chatId: z.number(), name: z.string().optional(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateChat(input.chatId, {
        name: input.name,
        description: input.description,
      });
      return getChatById(input.chatId);
    }),

  deleteChat: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteChat(input.chatId);
      return { success: true };
    }),

  // Participant operations
  createParticipant: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        name: z.string().min(1),
        initials: z.string().optional(),
        avatarColor: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const initials = input.initials || getInitials(input.name);
      const participants = await getChatParticipants(input.chatId);
      const avatarColor = input.avatarColor || getAvatarColor(participants.length);

      return createParticipant(input.chatId, input.name, initials, avatarColor);
    }),

  getChatParticipants: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input }) => {
      return getChatParticipants(input.chatId);
    }),

  updateParticipant: protectedProcedure
    .input(
      z.object({
        participantId: z.number(),
        name: z.string().optional(),
        initials: z.string().optional(),
        avatarColor: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateParticipant(input.participantId, {
        name: input.name,
        initials: input.initials,
        avatarColor: input.avatarColor,
      });
      return { success: true };
    }),

  deleteParticipant: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteParticipant(input.participantId);
      return { success: true };
    }),

  // Message operations
  createMessage: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        participantId: z.number(),
        text: z.string().optional(),
        timestamp: z.number(),
        isServiceMessage: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const messages = await getChatMessages(input.chatId);
      const messageIndex = messages.length;

      return createMessage(
        input.chatId,
        input.participantId,
        input.text || null,
        input.timestamp,
        messageIndex,
        input.isServiceMessage || false
      );
    }),

  getChatMessages: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input }) => {
      return getChatMessages(input.chatId);
    }),

  updateMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        participantId: z.number().optional(),
        text: z.string().optional(),
        timestamp: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateMessage(input.messageId, {
        participantId: input.participantId,
        text: input.text,
        timestamp: input.timestamp,
      });
      return { success: true };
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMessage(input.messageId);
      return { success: true };
    }),

  // Media operations
  addMedia: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        type: z.enum(["photo", "video", "gif", "sticker", "document"]),
        storageKey: z.string(),
        thumbnailKey: z.string().optional(),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return addMedia(
        input.messageId,
        input.type,
        input.storageKey,
        input.fileName,
        input.mimeType
      );
    }),

  getMessageMedia: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .query(async ({ input }) => {
      return getMessageMedia(input.messageId);
    }),

  deleteMedia: protectedProcedure
    .input(z.object({ mediaId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteMedia(input.mediaId);
      return { success: true };
    }),

  uploadMessageMedia: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        fileData: z.string(), // base64 encoded
        fileName: z.string(),
        mimeType: z.string(),
        mediaType: z.enum(["photo", "video", "gif", "sticker", "document"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Convert base64 to Buffer
        const buffer = Buffer.from(input.fileData, "base64");
        const fileKey = `media/${Date.now()}-${input.fileName}`;
        const { url, key } = await storagePut(fileKey, buffer, input.mimeType || "application/octet-stream");

        const media = await addMedia(
          input.messageId,
          input.mediaType,
          key,
          undefined,
          input.fileName
        );

        return {
          success: true,
          media,
          url: url || `/manus-storage/${key}`,
        };
      } catch (error) {
        console.error("Media upload failed:", error);
        throw new Error("Failed to upload media");
      }
    }),

  // Export chat as HTML
  exportChat: protectedProcedure
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input }) => {
      const chat = await getChatById(input.chatId);
      if (!chat) throw new Error("Chat not found");

      const messages = await getChatMessages(input.chatId);
      const participants = await getChatParticipants(input.chatId);

      // Map messages with media URLs
      const messagesWithMedia = await Promise.all(messages.map(async (m) => {
        const mediaList = await getMessageMedia(m.id);
        return {
          ...m,
          participant: participants.find((p) => p.id === m.participantId),
          mediaUrls: mediaList.map((med) => med.storageKey),
        };
      }));

      const htmlContent = generateTelegramHTML({
        chatName: chat.name,
        messages: messagesWithMedia,
        participants,
      });

      return { htmlContent, fileName: `${chat.name}.html` };
    }),

  // Randomize message timestamps
  randomizeTimestamps: protectedProcedure
    .input(
      z.object({
        chatId: z.number(),
        startDate: z.number(),
        endDate: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const messages = await getChatMessages(input.chatId);
      const timestamps = generateRandomTimestamps(
        new Date(input.startDate),
        new Date(input.endDate),
        messages.length
      );

      for (let i = 0; i < messages.length; i++) {
        await updateMessage(messages[i].id, { timestamp: timestamps[i] });
      }

      return { success: true, count: messages.length };
    }),

  // Import from Telegram export
  importTelegramExport: protectedProcedure
    .input(z.object({ htmlContent: z.string(), chatName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const parsed = parseTelegramExport(input.htmlContent);
      const chatName = input.chatName || parsed.chatName;

      // Create chat
      const chat = await createChat(ctx.user.id, chatName);

      // Create participants
      const participantMap = new Map<string, number>();
      let index = 0;
      for (const name of Array.from(parsed.participants)) {
        const participant = await createParticipant(
          chat.id,
          name,
          getInitials(name),
          getAvatarColor(index)
        );
        participantMap.set(name, participant.id);
        index++;
      }

      // Create messages
      for (const msg of parsed.messages) {
        if (msg.isServiceMessage) {
          // Create service message (date separator)
          // Use first participant or create a system participant
          const firstParticipant = await getChatParticipants(chat.id);
          const serviceParticipantId = firstParticipant[0]?.id || 1;
          await createMessage(chat.id, serviceParticipantId, msg.date || null, 0, msg.messageIndex, true);
        } else if (msg.senderName) {
          const participantId = participantMap.get(msg.senderName) || 1;
          const message = await createMessage(
            chat.id,
            participantId,
            msg.text || null,
            msg.timestamp || Date.now(),
            msg.messageIndex,
            false
          );

          // Add media if present
          if (msg.mediaType && msg.mediaHref) {
            // For imported media, use the href if it's an absolute URL or data URL
            // Otherwise, it's likely a relative path from the export which we can't resolve easily
            // but we'll store it anyway in case the user provides the assets later or for reference
            const mediaUrl = msg.mediaHref;
            await addMedia(message.id, msg.mediaType, mediaUrl, undefined, msg.mediaTitle);
          }
        }
      }

      return chat;
    }),
});
