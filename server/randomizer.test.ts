import { describe, it, expect } from "vitest";
import {
  generateRandomTimestamps,
  getRandomDateInRange,
  generateConversationTimestamps,
  generateTimestampsForPeriod,
} from "./randomizer";

describe("Randomizer Utilities", () => {
  describe("generateRandomTimestamps", () => {
    it("should generate correct number of timestamps", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const count = 10;

      const timestamps = generateRandomTimestamps(start, end, count);
      expect(timestamps.length).toBe(count);
    });

    it("should generate timestamps within range", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const startTime = start.getTime();
      const endTime = end.getTime();

      const timestamps = generateRandomTimestamps(start, end, 20);
      timestamps.forEach((ts) => {
        expect(ts).toBeGreaterThanOrEqual(startTime);
        expect(ts).toBeLessThanOrEqual(endTime);
      });
    });

    it("should generate sorted timestamps", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");

      const timestamps = generateRandomTimestamps(start, end, 20);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it("should respect preferred hours", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const preferredHours = [9, 10, 11];

      const timestamps = generateRandomTimestamps(start, end, 50, {
        preferredHours,
        avoidHours: [],
        clusteringFactor: 0,
      });

      const hours = timestamps.map((ts) => new Date(ts).getHours());
      const hasPreferredHours = hours.some((h) => preferredHours.includes(h));
      expect(hasPreferredHours).toBe(true);
    });

    it("should avoid specified hours", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const avoidHours = [2, 3, 4];

      const timestamps = generateRandomTimestamps(start, end, 50, {
        preferredHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        avoidHours,
        clusteringFactor: 0,
      });

      const hours = timestamps.map((ts) => new Date(ts).getHours());
      const hasAvoidedHours = hours.some((h) => avoidHours.includes(h));
      expect(hasAvoidedHours).toBe(false);
    });
  });

  describe("getRandomDateInRange", () => {
    it("should return a date within range", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");

      const randomDate = getRandomDateInRange(start, end);
      expect(randomDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(randomDate.getTime()).toBeLessThanOrEqual(end.getTime());
    });

    it("should return different dates on multiple calls", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-12-31");

      const dates = new Set();
      for (let i = 0; i < 10; i++) {
        dates.add(getRandomDateInRange(start, end).getTime());
      }

      expect(dates.size).toBeGreaterThan(1);
    });
  });

  describe("generateConversationTimestamps", () => {
    it("should generate correct number of timestamps", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const count = 50;

      const timestamps = generateConversationTimestamps(start, end, count);
      expect(timestamps.length).toBe(count);
    });

    it("should generate timestamps within range", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const startTime = start.getTime();
      const endTime = end.getTime();

      const timestamps = generateConversationTimestamps(start, end, 50);
      timestamps.forEach((ts) => {
        expect(ts).toBeGreaterThanOrEqual(startTime);
        expect(ts).toBeLessThanOrEqual(endTime);
      });
    });

    it("should generate sorted timestamps", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");

      const timestamps = generateConversationTimestamps(start, end, 50);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it("should create clusters of messages", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");

      const timestamps = generateConversationTimestamps(start, end, 100);

      let clusterCount = 0;
      let inCluster = false;
      const clusterGap = 1000 * 60 * 60;

      for (let i = 1; i < timestamps.length; i++) {
        const gap = timestamps[i] - timestamps[i - 1];
        if (gap < clusterGap) {
          if (!inCluster) {
            clusterCount++;
            inCluster = true;
          }
        } else {
          inCluster = false;
        }
      }

      expect(clusterCount).toBeGreaterThan(0);
    });
  });

  describe("generateTimestampsForPeriod", () => {
    it("should generate approximately correct number of timestamps", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const messagesPerDay = 5;

      const timestamps = generateTimestampsForPeriod(start, end, messagesPerDay);
      const expectedMin = 30 * messagesPerDay * 0.5;
      const expectedMax = 30 * messagesPerDay * 1.5;

      expect(timestamps.length).toBeGreaterThan(expectedMin);
      expect(timestamps.length).toBeLessThan(expectedMax);
    });

    it("should generate timestamps within range", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");
      const startTime = start.getTime();
      const endTime = end.getTime();

      const timestamps = generateTimestampsForPeriod(start, end, 5);
      timestamps.forEach((ts) => {
        expect(ts).toBeGreaterThanOrEqual(startTime);
        expect(ts).toBeLessThanOrEqual(endTime);
      });
    });

    it("should generate sorted timestamps", () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");

      const timestamps = generateTimestampsForPeriod(start, end, 5);
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });
  });
});
