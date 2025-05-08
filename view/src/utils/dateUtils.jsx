// Your original formatter - works well for basic date formats
export const formatDateTime = (datetimeString) => {
  if (!datetimeString || datetimeString === '+010000-01-01T03:59:59.999Z') return 'N/A';
 
  try {
    // Parse the date string properly
    const date = new Date(datetimeString);
   
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
   
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
   
    return date.toLocaleString(undefined, options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Date error';
  }
};

// Your original date picker formatter
export const formatDateForPicker = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatISODateTime = (isoString, showSeconds = false) => {
  if (!isoString) return 'N/A';
 
  try {
    let date;
   
    // Handle different UTC formats from server
    if (isoString.includes('Z')) {
      // Already has UTC indicator - parse normally
      date = new Date(isoString);
    } else if (isoString.includes('+')) {
      if (isoString.includes(' ')) {
        date = new Date(isoString.replace(' ', 'T'));
      } else {
        date = new Date(isoString);
      }
    } else if (isoString.includes('T')) {
      // Has T separator but no timezone - interpret as UTC by adding Z
      date = new Date(isoString + 'Z');
    } else if (isoString.includes(' ')) {
      // Has space separator but no timezone - interpret as UTC by adding Z
      date = new Date(isoString.replace(' ', 'T') + 'Z');
    } else {
      // Fallback - parse as-is
      date = new Date(isoString);
    }
   
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
   
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Local timezone
    };

    if (showSeconds) {
      options.second = '2-digit';
    }
   
    const formattedDate = date.toLocaleString(undefined, options);
    return formattedDate;
  } catch (error) {
    console.error('ISO date formatting error:', error);
    return 'Date error';
  }
};