/**
 * Formats a time string from "HH:MM:SS" to "HH:MM"
 * @param timeString Time string in the format "HH:MM:SS" or "HH:MM"
 * @returns Formatted time in "HH:MM" format
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  // If timeString already has the right format, return it
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // Parse the time string from "HH:MM:SS" to "HH:MM"
  try {
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};
