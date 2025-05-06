export const formatDateTime = (datetimeString) => {
  if (!datetimeString || datetimeString === '+010000-01-01T03:59:59.999Z')
    return 'N/A';

  let iso = datetimeString.trim().replace(' ', 'T');
  if (!iso.endsWith('Z')) iso += 'Z';

  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return 'Invalid date';

    const day = date.getDate();
    const month = date.toLocaleString(undefined, { month: 'short' });
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;  // converts 0→12 and 13→1, etc.

    return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
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
};
