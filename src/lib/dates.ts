export function formatDate(date: string, dateOnly = false) {
  return date
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: dateOnly ? undefined : "short",
        timeZone: "Asia/Karachi",
      }).format(new Date(date)) + (dateOnly ? "" : " PKT")
    : "To be announced";
}
