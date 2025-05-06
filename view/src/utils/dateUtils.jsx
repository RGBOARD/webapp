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

export const formatDateForPicker = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}