export function formatMessageTime(date) {
  if (!date) return "";
  
  const messageDate = new Date(date);
  const now = new Date();
  
  // Check if it's today
  if (isSameDay(messageDate, now)) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(messageDate, yesterday)) {
    return "Yesterday";
  }
  
  // Check if it's within the last week
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  if (messageDate >= oneWeekAgo) {
    return messageDate.toLocaleDateString("en-US", { weekday: 'short' });
  }
  
  // Otherwise return the date
  return messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDetailedMessageTime(date) {
  if (!date) return "";
  
  const messageDate = new Date(date);
  const formattedTime = messageDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const formattedDate = messageDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  return `${formattedTime} · ${formattedDate}`;
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
