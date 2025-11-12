import { useEffect, useRef, useState } from "react";

/**
 * MediaRecorder 래퍼
 * props:
 *  - running: boolean (true면 자동 녹음 시작, false면 정지)
 *  - onStop: ({blob, durationSec}) => void  (정지 시 콜백)
 */
export default function MicRecorder({ running, onStop }) {
  const [recording, setRecording] = useState(false);
  const mrRef = useRef(null);
  const chunksRef = useRef([]);
  const startAtRef = useRef(0);

  useEffect(() => {
    if (running && !recording) start();
    if (!running && recording) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const durationSec = Math.round((performance.now() - startAtRef.current) / 1000);
      onStop?.({ blob, durationSec });
      stream.getTracks().forEach((t) => t.stop());
    };
    mrRef.current = mr;
    startAtRef.current = performance.now();
    mr.start();
    setRecording(true);
  }

  function stop() {
    if (mrRef.current?.state === "recording") mrRef.current.stop();
    setRecording(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-3 h-3 rounded-full ${recording ? "bg-red-500 animate-pulse" : "bg-slate-500"}`}
        title={recording ? "Recording" : "Idle"}
      />
      <span className="text-xs text-slate-300">{recording ? "Recording..." : "Idle"}</span>
    </div>
  );
}
