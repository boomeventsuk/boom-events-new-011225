/**
 * Check if an event has passed based on its end time or start time
 * @param event - Event object with start/end fields or eventCode for date extraction
 * @returns true if the event has passed
 */
export const isEventPassed = (event: {
  end?: string;
  start?: string;
  eventCode?: string;
}): boolean => {
  const now = new Date();
  
  // Prefer end time if available (event is over when end time passes)
  if (event.end) {
    const endDate = new Date(event.end);
    return now > endDate;
  }
  
  // Fall back to start time if no end time
  if (event.start) {
    const startDate = new Date(event.start);
    // Add a buffer (e.g., 4 hours for typical event duration)
    startDate.setHours(startDate.getHours() + 4);
    return now > startDate;
  }
  
  // Fall back to extracting date from eventCode (DDMMYY format)
  if (event.eventCode) {
    const dateStr = event.eventCode.split('-')[0];
    if (dateStr && dateStr.length === 6) {
      const day = parseInt(dateStr.slice(0, 2), 10);
      const month = parseInt(dateStr.slice(2, 4), 10) - 1; // JS months are 0-indexed
      const year = 2000 + parseInt(dateStr.slice(4, 6), 10);
      
      // Set to end of that day (23:59:59)
      const eventDate = new Date(year, month, day, 23, 59, 59);
      return now > eventDate;
    }
  }
  
  return false;
};
