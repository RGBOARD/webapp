export const formatDateTime = (datetimeString) => {
    if (!datetimeString) return '';
    
    // Parse the input datetime string as UTC
    const date = new Date(datetimeString + 'Z'); // Append 'Z' if your string doesn't already specify UTC
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Use the user's local timezone
    };
    
    return date.toLocaleString(undefined, options);
  };