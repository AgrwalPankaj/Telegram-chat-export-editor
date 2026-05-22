import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const uploadMutation = trpc.chat.uploadMessageMedia.useMutation();

  const uploadMedia = async (
    messageId: number,
    file: File,
    mediaType: "photo" | "video" | "gif" | "sticker" | "document"
  ) => {
    setIsUploading(true);
    try {
      // Read file as base64
      const buffer = await file.arrayBuffer();
      const blob = new Blob([buffer]);
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = (reader.result as string).split(",")[1] || "";

            // Upload via tRPC
            const result = await uploadMutation.mutateAsync({
              messageId,
              fileData: base64Data,
              fileName: file.name,
              mimeType: file.type,
              mediaType,
            });

            toast.success(`${mediaType} uploaded successfully`);
            setIsUploading(false);
            resolve(result);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Upload failed";
            toast.error(message);
            setIsUploading(false);
            reject(error);
          }
        };

        reader.onerror = () => {
          const message = "Failed to read file";
          toast.error(message);
          setIsUploading(false);
          reject(new Error(message));
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      setIsUploading(false);
      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
      throw error;
    }
  };

  return {
    uploadMedia,
    isUploading,
  };
}
