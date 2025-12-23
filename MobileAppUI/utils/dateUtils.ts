export const formatDateForFilename = (dateString?: string) => {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '');
};

export default formatDateForFilename;
