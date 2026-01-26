'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './hourglass.module.css';
import { getKstMinutesPassed, minutesDelta } from './timezone';

type Phase = 'idle' | 'falling';

const TOTAL_MIN = 1440;
const HOURS = 24;
// 애니메이션 시간(ms) — CSS와 반드시 동일하게
const FALL_MS = 950;

export default function HourglassClient({
  initialMinutesPassed,
}: {
  initialMinutesPassed: number;
}) {
  const [minutesPassed, setMinutesPassed] = useState(initialMinutesPassed);
  const [phase, setPhase] = useState<Phase>('idle');
  const [fallKey, setFallKey] = useState(0);

  const lastMinuteRef = useRef<number>(initialMinutesPassed);
  const timerRef = useRef<number | null>(null);

const minutesRemaining = (TOTAL_MIN - minutesPassed + TOTAL_MIN) % TOTAL_MIN;

// TOP(남은 시간): "남아있으면 1칸" 느낌이면 ceil
const topHours = Math.ceil(minutesRemaining / 60);

// BOTTOM(지난 시간): "완전히 지난 시간만"이면 floor
const bottomHours = Math.floor(minutesPassed / 60);

// 렌더링은 항상 24칸
const hourArr = useMemo(() => Array.from({ length: HOURS }), []);


  useEffect(() => {
    // 분 바뀜 감지: 1초마다 현재 KST 분 계산
    timerRef.current = window.setInterval(() => {
      const nowMinute = getKstMinutesPassed(new Date());
      const prevMinute = lastMinuteRef.current;

      if (nowMinute === prevMinute) return;

      const d = minutesDelta(prevMinute, nowMinute);

      // 기준값 갱신
      lastMinuteRef.current = nowMinute;

      if (d === 1) {
        // ✅ 1분 전진: falling 애니메이션 1회만
        if (phase !== 'idle') return; // 혹시 애니메이션 중이면 중복 방지
        setPhase('falling');
        setFallKey((k) => k + 1);

        window.setTimeout(() => {
          setMinutesPassed((prev) => (prev + 1) % TOTAL_MIN);
          setPhase('idle');
        }, FALL_MS);
      } else {
        // ✅ 여러 분 점프: 즉시 반영 (애니메이션 없음)
        setMinutesPassed(nowMinute);
        setPhase('idle');
      }
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [phase]);

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div className={styles.title}>24h Hourglass</div>
        <div className={styles.sub}>
          KST 기준 · {String(Math.floor(minutesPassed / 60)).padStart(2, '0')}:
          {String(minutesPassed % 60).padStart(2, '0')} 경과
        </div>
      </div>

      <div className={styles.hourglass}>
        {/* TOP */}
        <div className={styles.top}>
          <div className={styles.hourGrid}>
            {hourArr.map((_, i) => (
              <span key={i} className={
                i < topHours ? styles.hourFilledTop : styles.hourBase} />
            ))}
          </div>
        </div>

        {/* THROAT */}
        <div className={styles.throat}>
          {/* falling grain: 1개만 */}
          {phase === 'falling' && (
            <span key={fallKey} className={styles.falling} />
          )}
        </div>

        {/* BOTTOM */}
        <div className={styles.bottom}>
          <div className={styles.hourGrid}>
            {hourArr.map((_, i) => {
              const indexFromBottom = HOURS - 1 - i; // 아래부터 채우기
              const filled = indexFromBottom < bottomHours;

              return (
                <span
                  key={i}
                  className={filled ? styles.hourFilledBottom : styles.hourBase}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
