import { describe, it, expect } from "vitest";
import { generateTelegramHTML } from "./exporter";

describe("Exporter Utilities", () => {
  describe("generateTelegramHTML", () => {
    it("should generate valid HTML document", () => {
      const html = generateTelegramHTML({
        chatName: "Test Chat",
        messages: [],
        participants: [],
      });

      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
    });

    it("should include chat name in header", () => {
      const html = generateTelegramHTML({
        chatName: "My Chat",
        messages: [],
        participants: [],
      });

      expect(html).toContain("My Chat");
      expect(html).toContain("page_header");
    });

    it("should include CSS styling", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [],
        participants: [],
      });

      expect(html).toContain("<style");
      expect(html).toContain("</style>");
      expect(html).toContain(".history");
      expect(html).toContain(".message");
    });

    it("should include JavaScript", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [],
        participants: [],
      });

      expect(html).toContain("<script");
      expect(html).toContain("</script>");
    });

    it("should include page header with chat name", () => {
      const html = generateTelegramHTML({
        chatName: "Group Chat",
        messages: [],
        participants: [],
      });

      expect(html).toContain("page_header");
      expect(html).toContain("Group Chat");
    });

    it("should render regular messages with sender name", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [
          {
            id: 1,
            chatId: 1,
            participantId: 1,
            text: "Hello",
            timestamp: new Date("2026-01-15T10:00:00").getTime(),
            isServiceMessage: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            participant: {
              id: 1,
              chatId: 1,
              name: "Alice",
              initials: "A",
              avatarColor: "userpic1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        participants: [],
      });

      expect(html).toContain("Alice");
      expect(html).toContain("from_name");
      expect(html).toContain("message default");
    });

    it("should render service messages with date separator", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [
          {
            id: 1,
            chatId: 1,
            participantId: null,
            text: "January 15, 2026",
            timestamp: new Date("2026-01-15").getTime(),
            isServiceMessage: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            participant: null,
          },
        ],
        participants: [],
      });

      expect(html).toContain("service");
      expect(html).toContain("January 15, 2026");
    });

    it("should include avatar colors", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [],
        participants: [],
      });

      expect(html).toContain("userpic1");
      expect(html).toContain("userpic2");
      expect(html).toContain("userpic3");
      expect(html).toContain("userpic4");
      expect(html).toContain("userpic5");
    });

    it("should handle multiple messages", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [
          {
            id: 1,
            chatId: 1,
            participantId: 1,
            text: "Message 1",
            timestamp: new Date("2026-01-15T10:00:00").getTime(),
            isServiceMessage: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            participant: {
              id: 1,
              chatId: 1,
              name: "Alice",
              initials: "A",
              avatarColor: "userpic1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          {
            id: 2,
            chatId: 1,
            participantId: 2,
            text: "Message 2",
            timestamp: new Date("2026-01-15T10:05:00").getTime(),
            isServiceMessage: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            participant: {
              id: 2,
              chatId: 1,
              name: "Bob",
              initials: "B",
              avatarColor: "userpic2",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        participants: [],
      });

      expect(html).toContain("Alice");
      expect(html).toContain("Bob");
      expect(html).toContain("message default");
    });

    it("should have proper HTML structure", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [],
        participants: [],
      });

      expect(html).toContain("<head>");
      expect(html).toContain("</head>");
      expect(html).toContain("<body");
      expect(html).toContain("</body>");
      expect(html).toContain("page_body");
      expect(html).toContain(".history");
    });

    it("should escape HTML special characters in messages", () => {
      const html = generateTelegramHTML({
        chatName: "Test",
        messages: [
          {
            id: 1,
            chatId: 1,
            participantId: 1,
            text: "Hello <script>alert('xss')</script>",
            timestamp: new Date().getTime(),
            isServiceMessage: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            participant: {
              id: 1,
              chatId: 1,
              name: "Alice",
              initials: "A",
              avatarColor: "userpic1",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        participants: [],
      });

      expect(html).toContain("Hello");
      expect(html).toContain("Alice");
      expect(html).not.toContain("<script>");
    });
  });
});
