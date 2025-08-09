// Time utility functions

/**
 * Gets the current timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Gets the current timestamp in milliseconds
 */
export function getCurrentTimestampMs(): number {
  return Date.now();
}

/**
 * Converts seconds timestamp to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Converts milliseconds timestamp to seconds
 */
export function msToSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / 1000);
}

/**
 * Adds days to a timestamp
 */
export function addDays(timestamp: number, days: number): number {
  return timestamp + (days * 24 * 60 * 60);
}

/**
 * Adds hours to a timestamp
 */
export function addHours(timestamp: number, hours: number): number {
  return timestamp + (hours * 60 * 60);
}

/**
 * Adds minutes to a timestamp
 */
export function addMinutes(timestamp: number, minutes: number): number {
  return timestamp + (minutes * 60);
}

/**
 * Gets the start of day timestamp
 */
export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  date.setHours(0, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Gets the end of day timestamp
 */
export function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  date.setHours(23, 59, 59, 999);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Checks if a timestamp is within the last N days
 */
export function isWithinLastDays(timestamp: number, days: number): boolean {
  const now = getCurrentTimestamp();
  const daysAgo = now - (days * 24 * 60 * 60);
  return timestamp >= daysAgo;
}

/**
 * Checks if a timestamp is within the last N hours
 */
export function isWithinLastHours(timestamp: number, hours: number): boolean {
  const now = getCurrentTimestamp();
  const hoursAgo = now - (hours * 60 * 60);
  return timestamp >= hoursAgo;
}

/**
 * Gets the difference between two timestamps in days
 */
export function getDaysDifference(timestamp1: number, timestamp2: number): number {
  return Math.abs(timestamp1 - timestamp2) / (24 * 60 * 60);
}

/**
 * Gets the difference between two timestamps in hours
 */
export function getHoursDifference(timestamp1: number, timestamp2: number): number {
  return Math.abs(timestamp1 - timestamp2) / (60 * 60);
}

/**
 * Formats a timestamp to ISO string
 */
export function formatToISO(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Formats a timestamp to human readable date
 */
export function formatToDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Formats a timestamp to human readable date and time
 */
export function formatToDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Gets the timestamp for N days ago
 */
export function getDaysAgo(days: number): number {
  return getCurrentTimestamp() - (days * 24 * 60 * 60);
}

/**
 * Gets the timestamp for N hours ago
 */
export function getHoursAgo(hours: number): number {
  return getCurrentTimestamp() - (hours * 60 * 60);
}

/**
 * Checks if a timestamp is expired
 */
export function isExpired(expirationTimestamp: number): boolean {
  return getCurrentTimestamp() > expirationTimestamp;
}

/**
 * Gets the time remaining until expiration in seconds
 */
export function getTimeUntilExpiration(expirationTimestamp: number): number {
  const remaining = expirationTimestamp - getCurrentTimestamp();
  return Math.max(0, remaining);
}

/**
 * Creates a timestamp for a specific number of seconds in the future
 */
export function getFutureTimestamp(secondsFromNow: number): number {
  return getCurrentTimestamp() + secondsFromNow;
}

/**
 * Rounds timestamp to nearest hour
 */
export function roundToNearestHour(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  date.setMinutes(0, 0, 0);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Rounds timestamp to nearest day
 */
export function roundToNearestDay(timestamp: number): number {
  return getStartOfDay(timestamp);
}