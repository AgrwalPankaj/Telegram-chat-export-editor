import { JSDOM } from "jsdom";

export interface ParsedMessage {
  messageIndex: number;
  isServiceMessage: boolean;
  senderName?: string;
  text?: string;
  timestamp?: number;
  date?: string;
  mediaType?: "photo" | "video" | "gif" | "sticker" | "document";
  mediaHref?: string;
  mediaTitle?: string;
  mediaStatus?: string;
}

export interface ParsedChat {
  chatName: string;
  messages: ParsedMessage[];
  participants: Set<string>;
}

/**
 * Parse a Telegram HTML export file
 */
export function parseTelegramExport(htmlContent: string): ParsedChat {
  const dom = new JSDOM(htmlContent);
  const doc = dom.window.document;

  // Extract chat name from page header
  const headerText = doc.querySelector(".page_header .text.bold");
  const chatName = headerText?.textContent?.trim() || "Exported Chat";

  // Extract all messages
  const messageElements = doc.querySelectorAll(".history .message");
  const messages: ParsedMessage[] = [];
  const participants = new Set<string>();
  let messageIndex = 0;

  messageElements.forEach((element) => {
    const isServiceMessage = element.classList.contains("service");

    if (isServiceMessage) {
      // Service message (date separator, user joined, etc.)
      const bodyText = element.querySelector(".body.details")?.textContent?.trim();
      messages.push({
        messageIndex,
        isServiceMessage: true,
        date: bodyText,
      });
    } else {
      // Regular message
      const senderNameEl = element.querySelector(".from_name");
      const senderName = senderNameEl?.textContent?.trim() || "Unknown";
      participants.add(senderName);

      const dateEl = element.querySelector(".date.details");
      const dateTitle = dateEl?.getAttribute("title") || "";
      const timestamp = parseTimestamp(dateTitle);

      const textEl = element.querySelector(".text");
      const text = textEl?.textContent?.trim() || "";

      // Check for media
      const mediaEl = element.querySelector(".media_wrap .media, .media_wrap .animated_wrap, .media_wrap .photo, .media_wrap .video, .media_wrap .sticker");
      let mediaType: "photo" | "video" | "gif" | "sticker" | "document" | undefined;
      let mediaHref: string | undefined;
      let mediaTitle: string | undefined;
      let mediaStatus: string | undefined;

      if (mediaEl) {
        const href = mediaEl.getAttribute("href") || "";
        const imgEl = mediaEl.querySelector("img");
        const imgSrc = imgEl?.getAttribute("src") || "";
        mediaHref = href || imgSrc;

        if (mediaEl.classList.contains("animated_wrap") || mediaEl.classList.contains("gif")) {
          mediaType = "gif";
        } else if (mediaEl.classList.contains("media_photo") || mediaEl.classList.contains("photo")) {
          if (mediaHref.includes("sticker") || mediaEl.classList.contains("sticker")) {
            mediaType = "sticker";
          } else {
            mediaType = "photo";
          }
        } else if (mediaEl.classList.contains("video")) {
          mediaType = "video";
        } else if (mediaEl.classList.contains("sticker")) {
          mediaType = "sticker";
        }

        const titleEl = mediaEl.querySelector(".title.bold");
        mediaTitle = titleEl?.textContent?.trim();

        const statusEl = mediaEl.querySelector(".status.details");
        mediaStatus = statusEl?.textContent?.trim();
      }

      messages.push({
        messageIndex,
        isServiceMessage: false,
        senderName,
        text: text || undefined,
        timestamp,
        mediaType,
        mediaHref,
        mediaTitle,
        mediaStatus,
      });
    }

    messageIndex++;
  });

  return {
    chatName,
    messages,
    participants,
  };
}

/**
 * Parse timestamp from Telegram export format
 * Format: "03.12.2025 19:07:11 UTC+02:00"
 */
function parseTimestamp(dateString: string): number {
  if (!dateString) return Date.now();

  try {
    // Extract date and time parts
    const match = dateString.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return Date.now();

    const [, day, month, year, hours, minutes, seconds] = match;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );

    return date.getTime();
  } catch {
    return Date.now();
  }
}

/**
 * Extract initials from a name
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return "";
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || "";
  return ((parts[0][0] || "") + (parts[parts.length - 1][0] || "")).toUpperCase();
}

/**
 * Get avatar color class based on name hash
 */
export function getAvatarColor(nameOrIndex: string | number): string {
  const colors = ["userpic1", "userpic2", "userpic3", "userpic4", "userpic5"];
  
  if (typeof nameOrIndex === "number") {
    return colors[nameOrIndex % colors.length];
  }
  
  // Hash the name to get a consistent color
  let hash = 0;
  for (let i = 0; i < nameOrIndex.length; i++) {
    hash = ((hash << 5) - hash) + nameOrIndex.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}
