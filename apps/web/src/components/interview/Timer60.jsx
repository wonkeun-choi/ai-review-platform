import { useEffect, useState } from "react";

/**
 * 60초 카운트다운 타이머
 * props:
 *  - running: boolean (true면 시작/재시작)
 *  - onTimeout: () => void (0초 도달 시 콜백)
 */
export default function Timer60({ running, onTimeout }) {
  const [sec, setSec] = useState(60);

  useEffect(() => {
    if (!running) return;
    setSec(60); // 시작할 때 항상 리셋
  }, [running]);

  useEffect(() => {
    if (!running) return;
    if (sec === 0) {
      onTimeout?.();
      return;
    }
    const id = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [sec, running, onTimeout]);

  return (
    <div className="text-2xl font-semibold tabular-nums tracking-wider text-slate-100">
      {sec}s
    </div>
  );
}
