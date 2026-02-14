/**
 * Format currency in INR
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  /**
   * Format date to readable string
   */
  export const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  /**
   * Format short date (date only)
   */
  export const formatShortDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  /**
   * Format time only
   */
export const formatTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

/**
 * Convert HH:mm (24-hour) to hh:mm AM/PM
 */
export const formatClockTime = (time24: string): string => {
  if (!time24) return "N/A";
  const [h, m] = time24.split(":").map((part) => Number(part));
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;

  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
};

/**
 * Convert slot time range HH:mm-HH:mm into AM/PM range
 */
export const formatSlotRange = (startTime24: string, endTime24: string): string => {
  return `${formatClockTime(startTime24)} - ${formatClockTime(endTime24)}`;
};

/**
 * True when slot is current/future for the selected date.
 * For today's date, slot is shown only if end time is still in the future.
 */
export const isPresentOrFutureSlot = (
  selectedDate: string,
  startTime24: string,
  endTime24: string
): boolean => {
  if (!selectedDate || !startTime24 || !endTime24) return true;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (selectedDate > todayStr) return true;
  if (selectedDate < todayStr) return false;

  const [endHour, endMinute] = endTime24.split(":").map((p) => Number(p));
  if (Number.isNaN(endHour) || Number.isNaN(endMinute)) return true;

  const slotEnd = new Date(now);
  slotEnd.setHours(endHour, endMinute, 0, 0);
  return slotEnd.getTime() > now.getTime();
};
