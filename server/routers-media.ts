import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { addMedia, getMessageMedia } from "./db-chat";
import { storagePut } from "./storage";

export const mediaRouter = router({
  uploadMedia: protectedProcedure
    .input(
      z.object({
        messageId: z.number(),
        fileData: z.instanceof(Buffer),
        fileName: z.string(),
        mimeType: z.string(),
        mediaType: z.enum(["photo", "video", "gif", "sticker", "document"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Upload file to storage
        const fileKey = `media/${Date.now()}-${input.fileName}`;
        const { url, key } = await storagePut(fileKey, input.fileData, input.mimeType || "application/octet-stream");

        // Save media reference to database
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

  getMessageMedia: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .query(async ({ input }) => {
      return await getMessageMedia(input.messageId);
    }),
});
