import { greetingForHour } from '@/utils/date';

export function buildGreeting(displayName: string, hour?: number): string {
  const name = displayName.trim() || 'você';
  return `${greetingForHour(hour)}, ${name}.`;
}
