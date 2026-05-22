import { format } from "date-fns";
import { Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TelegramMessageProps {
  id: number;
  senderName: string;
  senderInitials: string;
  avatarColor: string;
  text?: string;
  timestamp: number;
  isServiceMessage?: boolean;
  media?: Array<{
    id: number;
    type: "photo" | "video" | "gif" | "sticker" | "document";
    storageKey: string;
    fileName?: string;
    mimeType?: string;
  }>;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const AVATAR_COLORS: Record<string, string> = {
  userpic1: "bg-[#e17076]",
  userpic2: "bg-[#7bc862]",
  userpic3: "bg-[#faa774]",
  userpic4: "bg-[#6ec9cb]",
  userpic5: "bg-[#65aadd]",
  userpic6: "bg-[#a695e7]",
  userpic7: "bg-[#ee7aae]",
  userpic8: "bg-[#6ad19d]",
};

export function TelegramMessage({
  id,
  senderName,
  senderInitials,
  avatarColor,
  text,
  timestamp,
  isServiceMessage,
  media,
  onEdit,
  onDelete,
}: TelegramMessageProps) {
  const timeStr = format(new Date(timestamp), "HH:mm");
  const fullDateStr = format(new Date(timestamp), "dd.MM.yyyy HH:mm:ss");
  const bgColor = AVATAR_COLORS[avatarColor] || AVATAR_COLORS.userpic1;

  if (isServiceMessage) {
    return (
      <div className="flex justify-center py-3">
        <div className="text-xs text-gray-500 font-medium">{text || senderName}</div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-1 px-4 hover:bg-black/5 group transition-colors">
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white text-sm font-semibold shadow-sm mt-1`}>
        {senderInitials}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          {/* Sender Name */}
          <div className="font-semibold text-[13px] text-[#5288c1] mb-0.5">{senderName}</div>
          
          {/* Timestamp */}
          <div className="text-[11px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" title={fullDateStr}>
            {timeStr}
          </div>
        </div>

        {/* Message Text */}
        {text && (
          <div className="text-[13px] leading-[1.4] text-white break-words">
            {text}
          </div>
        )}

        {/* Media Display */}
        {media && media.length > 0 && (
          <div className="mt-2 space-y-2">
            {media.map((m) => (
              <div key={m.id}>
                {m.type === "photo" && (
                  <img
                    src={m.storageKey.startsWith('http') || m.storageKey.startsWith('data:') ? m.storageKey : `/manus-storage/${m.storageKey}`}
                    alt="Photo"
                    className="max-w-xs rounded-lg border border-gray-200 shadow-sm"
                  />
                )}
                {m.type === "video" && (
                  <video
                    src={m.storageKey.startsWith('http') || m.storageKey.startsWith('data:') ? m.storageKey : `/manus-storage/${m.storageKey}`}
                    className="max-w-xs rounded-lg border border-gray-200 shadow-sm"
                    controls
                  />
                )}
                {m.type === "gif" && (
                  <img
                    src={m.storageKey.startsWith('http') || m.storageKey.startsWith('data:') ? m.storageKey : `/manus-storage/${m.storageKey}`}
                    alt="GIF"
                    className="max-w-xs rounded-lg border border-gray-200 shadow-sm"
                  />
                )}
                {m.type === "sticker" && (
                  <img
                    src={m.storageKey.startsWith('http') || m.storageKey.startsWith('data:') ? m.storageKey : `/manus-storage/${m.storageKey}`}
                    alt="Sticker"
                    className="w-32 h-32 object-contain"
                  />
                )}
                {m.type === "document" && (
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg max-w-xs">
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 012-2h6a1 1 0 00-.707.293l-5.414 5.414A1 1 0 004 10.414V4zm2 2v5.172L10.172 4H6z" />
                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm13 4H9v2h6v-2z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{m.fileName || "Document"}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onEdit(id)}
            title="Edit message"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(id)}
            title="Delete message"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
