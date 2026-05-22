import { format } from "date-fns";
import type { Message, Participant } from "../drizzle/schema";

export interface ExportData {
  chatName: string;
  messages: Array<Message & { participant?: Participant; mediaUrls?: string[] }>;
  participants: Participant[];
}

/**
 * Generate Telegram-style HTML export with dark theme
 */
export function generateTelegramHTML(data: ExportData): string {
  const cssContent = generateCSS();
  const jsContent = generateJS();
  const messagesHTML = generateMessagesHTML(data.messages, data.participants);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Exported Data</title>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <style>
${cssContent}
  </style>
  <script type="text/javascript">
${jsContent}
  </script>
</head>
<body onload="CheckLocation();">
  <div class="page_wrap">
    <div class="page_header">
      <div class="content">
        <div class="text bold">${escapeHTML(data.chatName)}</div>
      </div>
    </div>
    <div class="page_body chat_page">
      <div class="history">
${messagesHTML}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate messages HTML with proper media rendering
 */
function generateMessagesHTML(messages: ExportData["messages"], participants: Participant[]): string {
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  let currentDate = "";
  let html = "";
  let messageId = 1;

  for (const message of messages) {
    const participant = message.participant || (message.participantId ? participantMap.get(message.participantId) : undefined);
    const messageDate = format(new Date(message.timestamp), "d MMMM yyyy");

    // Add date separator if date changed
    if (messageDate !== currentDate && !message.isServiceMessage) {
      currentDate = messageDate;
      html += `        <div class="message service" id="message-${messageId}">
          <div class="body details">${escapeHTML(messageDate)}</div>
        </div>\n`;
      messageId++;
    }

    if (message.isServiceMessage) {
      // Service message (date separator, etc.)
      html += `        <div class="message service" id="message-${messageId}">
          <div class="body details">${escapeHTML(message.text || "")}</div>
        </div>\n`;
    } else if (participant && !message.isServiceMessage) {
      // Regular message
      const timeStr = format(new Date(message.timestamp), "HH:mm");
      const fullDateStr = format(new Date(message.timestamp), "dd.MM.yyyy HH:mm:ss");
      const initials = participant.initials || "?";
      const avatarClass = participant.avatarColor || "userpic1";

      html += `        <div class="message default clearfix" id="message${messageId}">
          <div class="pull_left userpic_wrap">
            <div class="userpic ${avatarClass}" style="width: 42px; height: 42px">
              <div class="initials" style="line-height: 42px">${escapeHTML(initials)}</div>
            </div>
          </div>
          <div class="body">
            <div class="pull_right date details" title="${escapeHTML(fullDateStr)} UTC+00:00">${escapeHTML(timeStr)}</div>
            <div class="from_name">${escapeHTML(participant.name)}</div>\n`;

      if (message.text) {
        html += `            <div class="text">${escapeHTML(message.text)}</div>\n`;
      }

      // Add media if present - render as images/stickers
      if ((message as any).mediaUrls && (message as any).mediaUrls.length > 0) {
        html += `            <div class="media_wrap">\n`;
        for (const mediaUrl of (message as any).mediaUrls) {
          // Determine media type from URL or filename
          const isSticker = mediaUrl.includes('sticker') || mediaUrl.endsWith('.webp');
          const mediaClass = isSticker ? 'sticker' : 'image';
          const maxWidth = isSticker ? '100px' : '300px';
          const finalUrl = mediaUrl.startsWith('http') || mediaUrl.startsWith('data:') ? mediaUrl : `/manus-storage/${mediaUrl}`;
          
          html += `              <div class="media ${mediaClass}">\n`;
          html += `                <img src="${escapeHTML(finalUrl)}" style="max-width: ${maxWidth}; border-radius: 8px; display: block;" alt="media" />\n`;
          html += `              </div>\n`;
        }
        html += `            </div>\n`;
      }

      html += `          </div>
        </div>\n`;
    }

    messageId++;
  }

  return html;
}

/**
 * Generate Telegram dark theme CSS
 */
function generateCSS(): string {
  return `* {
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: baseline;
}

html, body {
  height: 100%;
}

body {
  line-height: 1;
  background: #18222d;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px;
}

.page_wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page_header {
  background: #242f3d;
  border-bottom: 1px solid #1a232e;
  padding: 12px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.page_header .content {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px;
}

.page_header .text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.page_body {
  flex: 1;
  overflow-y: auto;
  background: #18222d;
}

.chat_page .history {
  max-width: 600px;
  margin: 0 auto;
  padding: 8px 0;
}

.message {
  display: flex;
  padding: 4px 16px;
  margin: 2px 0;
}

.message.default {
  padding: 4px 16px;
}

.message.service {
  justify-content: center;
  padding: 8px 16px;
}

.message .body {
  flex: 1;
  padding-left: 12px;
}

.message .body.details {
  text-align: center;
  color: #a0acba;
  font-size: 13px;
  padding: 4px 12px;
  background: rgba(36, 47, 61, 0.5);
  border-radius: 12px;
}

.message .pull_left {
  flex-shrink: 0;
}

.message .pull_right {
  float: right;
  margin-left: 8px;
}

.message .date {
  color: #a0acba;
  font-size: 12px;
}

.message .from_name {
  color: #5288c1;
  font-weight: 600;
  margin-bottom: 2px;
  font-size: 13px;
}

.message .text {
  color: #fff;
  word-wrap: break-word;
  margin-top: 2px;
  line-height: 1.4;
}

.userpic_wrap {
  margin-right: 8px;
  margin-top: 2px;
}

.userpic {
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 16px;
}

.userpic.userpic1 { background: #e17076; }
.userpic.userpic2 { background: #7bc862; }
.userpic.userpic3 { background: #faa774; }
.userpic.userpic4 { background: #6ec9cb; }
.userpic.userpic5 { background: #65aadd; }
.userpic.userpic6 { background: #a695e7; }
.userpic.userpic7 { background: #ee7aae; }
.userpic.userpic8 { background: #6ad19d; }

.media_wrap {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.media {
  display: inline-block;
}

.media img {
  max-width: 300px;
  border-radius: 8px;
  display: block;
}

.media.sticker img {
  max-width: 100px;
}

.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

.pull_left {
  float: left;
}

.pull_right {
  float: right;
}

.bold {
  font-weight: 600;
}`;
}

/**
 * Generate JavaScript for Telegram export
 */
function generateJS(): string {
  return `function CheckLocation() {
  // Placeholder for any dynamic functionality
}`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
