/**
 * Stable date formatting utilities to prevent hydration mismatches.
 * Standard toLocaleDateString() is dangerous in SSR because the server 
 * locale might differ from the client locale.
 */

/** Formats YYYY-MM-DD to "MMM D, YYYY" (e.g., "Oct 12, 2026") */
export function formatShortDate(iso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${months[m - 1]} ${d}, ${y}`;
}

/** Formats YYYY-MM-DD to "Month D, YYYY" (e.g., "October 12, 2026") */
export function formatFullDate(iso: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const [y, m, d] = iso.split("-").map(Number);
  return `${months[m - 1]} ${d}, ${y}`;
}

/** Formats YYYY-MM-DD to "Weekday, MMM D" (e.g., "Mon, Oct 12") */
export function formatDayDate(iso: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = days[date.getDay()];
  const monthName = months[m - 1];
  
  return `${dayName}, ${monthName} ${d}`;
}

/** Formats a range of two YYYY-MM-DD strings */
export function formatWeekRange(startIso: string, endIso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  
  const smName = months[sm - 1];
  const emName = months[em - 1];
  
  if (sm === em) {
    return `${smName} ${sd}–${ed}`;
  }
  return `${smName} ${sd} – ${emName} ${ed}`;
}
