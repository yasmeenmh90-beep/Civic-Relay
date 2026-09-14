export function formatDate(dateString?: string | Date): string {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '—';
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString?: string | Date): string {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '—';
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatShortDateTime(dateString?: string | Date): string {
  if (!dateString) return '—';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '—';
  
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${month} ${day} · ${time}`;
}

export function calculateSLARemaining(
  expectedResponseDate?: string | Date,
  totalHours = 72
): {
  remainingSeconds: number;
  isExpired: boolean;
  formatted: string;
  percentElapsed: number;
} {
  if (!expectedResponseDate) {
    return {
      remainingSeconds: 0,
      isExpired: false,
      formatted: '—',
      percentElapsed: 0,
    };
  }

  const deadline = typeof expectedResponseDate === 'string' ? new Date(expectedResponseDate) : expectedResponseDate;
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const remainingSeconds = Math.floor(diffMs / 1000);
  
  const totalSeconds = totalHours * 3600;
  const elapsedSeconds = Math.max(0, totalSeconds - remainingSeconds);
  const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalSeconds) * 100)));

  if (remainingSeconds <= 0) {
    return {
      remainingSeconds: 0,
      isExpired: true,
      formatted: 'SLA Expired',
      percentElapsed: 100,
    };
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${seconds}s`;
  } else {
    formatted = `${seconds}s`;
  }

  return {
    remainingSeconds,
    isExpired: false,
    formatted: `${formatted} remaining`,
    percentElapsed,
  };
}
