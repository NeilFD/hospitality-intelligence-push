import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency with £ symbol and two decimal places
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined) return "£0.00";
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format percentage with one decimal place
export function formatPercentage(value: number | undefined): string {
  if (value === undefined) return "0.0%";
  return new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
