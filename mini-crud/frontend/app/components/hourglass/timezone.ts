export function getKstMinutesPassed(date: Date): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(date);
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minStr = parts.find((p) => p.type === 'minute')?.value ?? '00';

  const h = Number(hourStr);
  const m = Number(minStr);

  // 0~1439
  return ((h * 60 + m) % 1440 + 1440) % 1440;
}

export function minutesDelta(prev: number, next: number): number {
  // 하루를 원형(1440)으로 보고 앞으로 얼마나 이동했는지 (0~1439)
  const d = (next - prev + 1440) % 1440;
  return d;
}
