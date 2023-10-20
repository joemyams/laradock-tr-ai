import {
  isToday,
  isYesterday,
  subDays,
  subMonths,
  startOfYear,
} from "date-fns";

export function sortThreadsByDateCategory(threads) {
  const threadDateCategory = [
    {
      label: "Today",
      threads: [],
    },
    {
      label: "Yesterday",
      threads: [],
    },
    {
      label: "Previous 7 Days",
      threads: [],
    },
    {
      label: "Previous 30 Days",
      threads: [],
    },
    {
      label: "This Year",
      threads: [],
    },
  ];

  const today = new Date();

  threads.forEach((thread) => {
    const threadDate = new Date(thread.id);

    if (isToday(threadDate)) {
      threadDateCategory[0].threads.push(thread);
    } else if (isYesterday(threadDate)) {
      threadDateCategory[1].threads.push(thread);
    } else if (threadDate > subDays(today, 7)) {
      threadDateCategory[2].threads.push(thread);
    } else if (threadDate > subMonths(today, 1)) {
      threadDateCategory[3].threads.push(thread);
    } else if (threadDate > startOfYear(today)) {
      threadDateCategory[4].threads.push(thread);
    }
  });

  const sortedThreadsByDate = threadDateCategory.filter(
    (sortedThreads) => sortedThreads.threads.length > 0
  );

  return sortedThreadsByDate;
}
