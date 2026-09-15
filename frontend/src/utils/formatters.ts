import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTicketId(id?: string, fallback = 'CIV-1000'): string {
  if (!id) return fallback;
  if (id.startsWith('CIV-') || id.startsWith('CASE-')) return id;
  // If it's a uuid or mongo id, take short hash
  if (id.length > 8) {
    return `CIV-${id.slice(-5).toUpperCase()}`;
  }
  return `CIV-${id}`;
}

export function truncateText(text: string, maxLength = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  return `${num.toFixed(1)}%`;
}
