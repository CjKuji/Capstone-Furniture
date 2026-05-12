// components/chat/utils/chatDate.ts

export const toSafeDate = (input: string | number | Date) => {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);

  if (
    typeof input === "string" &&
    (input.includes("Z") || input.includes("+"))
  ) {
    return new Date(input);
  }

  return new Date(String(input) + "Z");
};

export const formatPHTime = (date: string | number | Date) => {
  return toSafeDate(date).toLocaleTimeString("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getDateLabel = (date: string) => {
  const target = toSafeDate(date);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const targetDate = target.toDateString();
  const todayDate = today.toDateString();
  const yesterdayDate = yesterday.toDateString();

  if (targetDate === todayDate) return "Today";
  if (targetDate === yesterdayDate) return "Yesterday";

  return target.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};