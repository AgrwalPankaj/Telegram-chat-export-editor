/**
 * Timestamp randomizer for creating believable message distributions
 */

/**
 * Generate random timestamps within a date range with realistic distribution
 */
export function generateRandomTimestamps(
  startDate: Date,
  endDate: Date,
  count: number,
  options?: {
    preferredHours?: number[];
    avoidHours?: number[];
    clusteringFactor?: number;
  }
): number[] {
  const timestamps: number[] = [];
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const totalDuration = endTime - startTime;

  const preferredHours = options?.preferredHours || [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const avoidHours = options?.avoidHours || [2, 3, 4, 5];
  const clusteringFactor = options?.clusteringFactor || 0.3;

  for (let i = 0; i < count; i++) {
    let timestamp: number;

    if (i > 0 && Math.random() < clusteringFactor) {
      const previousTime = timestamps[i - 1];
      const clusterRange = 1000 * 60 * 30;
      timestamp = previousTime + Math.random() * clusterRange;
    } else {
      timestamp = startTime + Math.random() * totalDuration;
    }

    const date = new Date(timestamp);
    const hour = date.getHours();

    if (avoidHours.includes(hour)) {
      const randomPreferredHour = preferredHours[Math.floor(Math.random() * preferredHours.length)];
      date.setHours(randomPreferredHour);
      timestamp = date.getTime();
    }

    timestamps.push(Math.max(startTime, Math.min(endTime, timestamp)));
  }

  return timestamps.sort((a, b) => a - b);
}

/**
 * Generate a random date within a range
 */
export function getRandomDateInRange(startDate: Date, endDate: Date): Date {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

/**
 * Generate random timestamps with realistic conversation patterns
 */
export function generateConversationTimestamps(
  startDate: Date,
  endDate: Date,
  messageCount: number
): number[] {
  const timestamps: number[] = [];
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const totalDuration = endTime - startTime;

  const clusterCount = Math.max(1, Math.floor(messageCount / 10));
  const messagesPerCluster = Math.ceil(messageCount / clusterCount);

  for (let cluster = 0; cluster < clusterCount; cluster++) {
    const clusterStart = startTime + Math.random() * totalDuration;
    const clusterDuration = 1000 * 60 * 30;

    const messagesInThisCluster = Math.min(
      messagesPerCluster,
      messageCount - timestamps.length
    );

    for (let i = 0; i < messagesInThisCluster; i++) {
      const messageTime = clusterStart + Math.random() * clusterDuration;
      timestamps.push(Math.max(startTime, Math.min(endTime, messageTime)));
    }
  }

  return timestamps
    .sort((a, b) => a - b)
    .slice(0, messageCount);
}

/**
 * Randomize existing timestamps while maintaining order
 */
export function randomizeTimestamps(
  timestamps: number[],
  variance: number = 0.1
): number[] {
  return timestamps.map((ts, index) => {
    const varianceMs = (timestamps[index + 1] || ts) - ts * variance;
    const randomVariance = (Math.random() - 0.5) * 2 * varianceMs;
    return Math.max(
      index === 0 ? timestamps[0] : timestamps[index - 1],
      Math.min(
        index === timestamps.length - 1 ? timestamps[index] : timestamps[index + 1],
        ts + randomVariance
      )
    );
  });
}

/**
 * Generate timestamps for a specific time period with realistic density
 */
export function generateTimestampsForPeriod(
  startDate: Date,
  endDate: Date,
  messagesPerDay: number
): number[] {
  const timestamps: number[] = [];
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalMessages = dayCount * messagesPerDay;

  for (let day = 0; day < dayCount; day++) {
    const dayStart = new Date(startDate);
    dayStart.setDate(dayStart.getDate() + day);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const messagesThisDay = Math.floor(messagesPerDay * (0.5 + Math.random()));

    for (let i = 0; i < messagesThisDay; i++) {
      const randomTime = dayStart.getTime() + Math.random() * (dayEnd.getTime() - dayStart.getTime());
      timestamps.push(randomTime);
    }
  }

  return timestamps.sort((a, b) => a - b);
}
