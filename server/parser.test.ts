import { describe, it, expect } from "vitest";
import { parseTelegramExport, getInitials, getAvatarColor } from "./parser";

describe("Parser Utilities", () => {
  describe("getInitials", () => {
    it("should extract initials from a name", () => {
      expect(getInitials("John Doe")).toBe("JD");
      expect(getInitials("Alice")).toBe("A");
      expect(getInitials("Bob Smith Johnson")).toBe("BJ");
    });

    it("should handle single word names", () => {
      expect(getInitials("Alice")).toBe("A");
      expect(getInitials("Bob")).toBe("B");
    });

    it("should handle names with extra spaces", () => {
      expect(getInitials("John  Doe")).toBe("JD");
    });

    it("should handle empty strings", () => {
      expect(getInitials("")).toBe("");
      expect(getInitials("   ")).toBe("");
    });
  });

  describe("getAvatarColor", () => {
    it("should return consistent color for same name", () => {
      const color1 = getAvatarColor("John");
      const color2 = getAvatarColor("John");
      expect(color1).toBe(color2);
    });

    it("should return one of the valid colors", () => {
      const validColors = ["userpic1", "userpic2", "userpic3", "userpic4", "userpic5"];
      const color = getAvatarColor("Alice");
      expect(validColors).toContain(color);
    });

    it("should distribute colors across different names", () => {
      const colors = new Set();
      for (let i = 0; i < 50; i++) {
        colors.add(getAvatarColor(`User${i}`));
      }
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  describe("parseTelegramExport", () => {
    it("should parse a simple HTML export", () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Exported Data</title></head>
        <body>
          <div class="page_header">
            <div class="content">
              <div class="text bold">Test Chat</div>
            </div>
          </div>
          <div class="history">
            <div class="message default">
              <div class="from_name">Alice</div>
              <div class="text">Hello World</div>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = parseTelegramExport(html);
      expect(result.chatName).toBe("Test Chat");
      expect(result.participants.size).toBeGreaterThan(0);
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it("should extract chat name from header", () => {
      const html = `
        <div class="page_header">
          <div class="content">
            <div class="text bold">My Group Chat</div>
          </div>
        </div>
        <div class="history"></div>
      `;

      const result = parseTelegramExport(html);
      expect(result.chatName).toBe("My Group Chat");
    });

    it("should extract multiple participants", () => {
      const html = `
        <div class="page_header">
          <div class="content">
            <div class="text bold">Chat</div>
          </div>
        </div>
        <div class="history">
          <div class="message default">
            <div class="from_name">Alice</div>
            <div class="text">Message 1</div>
          </div>
          <div class="message default">
            <div class="from_name">Bob</div>
            <div class="text">Message 2</div>
          </div>
        </div>
      `;

      const result = parseTelegramExport(html);
      expect(result.participants.has("Alice")).toBe(true);
      expect(result.participants.has("Bob")).toBe(true);
      expect(result.participants.size).toBe(2);
    });

    it("should handle empty history", () => {
      const html = `
        <div class="page_header">
          <div class="content">
            <div class="text bold">Empty Chat</div>
          </div>
        </div>
        <div class="history"></div>
      `;

      const result = parseTelegramExport(html);
      expect(result.chatName).toBe("Empty Chat");
      expect(result.messages.length).toBe(0);
    });

    it("should extract message text", () => {
      const html = `
        <div class="page_header">
          <div class="content">
            <div class="text bold">Chat</div>
          </div>
        </div>
        <div class="history">
          <div class="message default">
            <div class="from_name">Alice</div>
            <div class="text">Hello World</div>
          </div>
        </div>
      `;

      const result = parseTelegramExport(html);
      expect(result.messages[0]?.text).toBe("Hello World");
    });

    it("should handle messages without text", () => {
      const html = `
        <div class="page_header">
          <div class="content">
            <div class="text bold">Chat</div>
          </div>
        </div>
        <div class="history">
          <div class="message default">
            <div class="from_name">Alice</div>
          </div>
        </div>
      `;

      const result = parseTelegramExport(html);
      expect(result.messages[0]?.text).toBeUndefined();
    });
  });
});
