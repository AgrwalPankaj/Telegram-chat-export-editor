import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface MediaUploadProps {
  onMediaSelect: (file: File, type: "photo" | "video" | "gif" | "sticker" | "document") => void;
  disabled?: boolean;
}

export function MediaUpload({ onMediaSelect, disabled }: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    const type = getMediaType(file.type, file.name);
    if (!type) {
      toast.error("Unsupported file type. Please upload an image, video, GIF, sticker, or document.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    onMediaSelect(file, type);
  };

  const getMediaType = (mimeType: string, fileName: string): "photo" | "video" | "gif" | "sticker" | "document" | null => {
    if (mimeType.startsWith("image/")) {
      if (mimeType === "image/gif" || fileName.toLowerCase().endsWith(".gif")) {
        return "gif";
      }
      if (fileName.toLowerCase().includes("sticker")) {
        return "sticker";
      }
      return "photo";
    }
    if (mimeType.startsWith("video/")) {
      return "video";
    }
    if (mimeType === "application/pdf" || mimeType.startsWith("application/")) {
      return "document";
    }
    return null;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
      <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop media here</p>
      <p className="text-xs text-gray-500 mb-3">or click to browse</p>

      <Input
        type="file"
        onChange={handleFileChange}
        disabled={disabled}
        accept="image/*,video/*,.gif,.pdf,application/*"
        className="hidden"
        id="media-upload"
      />

      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => document.getElementById("media-upload")?.click()}
      >
        <Upload className="w-4 h-4 mr-2" />
        Choose File
      </Button>

      <p className="text-xs text-gray-500 mt-3">
        Supported: Images, Videos, GIFs, Stickers, Documents (max 50MB)
      </p>
    </div>
  );
}
