import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

export default function HeartsTimer() {
  const { user, fetchMe } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.hearts >= 5 || !user.lastActiveDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const lastActive = new Date(user.lastActiveDate!).getTime();
      const msSince = Date.now() - lastActive;
      const blocksPassed = Math.floor(msSince / (8 * 60 * 60 * 1000));
      const nextRecovery = lastActive + (blocksPassed + 1) * 8 * 60 * 60 * 1000;
      return nextRecovery - Date.now();
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (remaining <= 0) {
        fetchMe(); // fetch fresh hearts from server
      } else {
        setTimeLeft(remaining);
      }
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, [user, fetchMe]);

  if (!user || user.hearts >= 5 || timeLeft === null) return null;

  if (timeLeft <= 0) {
    return (
      <div className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
        <span>⏰</span>
        <span>Buka app untuk klaim nyawa!</span>
      </div>
    );
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
      <span>⏰</span>
      <span>Nyawa berikutnya dalam {hours}j {minutes}m</span>
    </div>
  );
}
