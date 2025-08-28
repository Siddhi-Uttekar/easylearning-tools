import { format } from "date-fns";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BatchEntry } from "@/types/certificates";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return format(date, "MMMM dd, yyyy");
}

export function assignMedalType(
  rank: number
): "gold" | "silver" | "bronze" | "participation" {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "participation";
}

export function parseBatchData(text: string): BatchEntry[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [rank, name, tests] = line.split(",").map((item) => item.trim());
      return {
        rank: parseInt(rank, 10),
        studentName: name,
        testsAttempted: parseInt(tests, 10),
      };
    });
}
