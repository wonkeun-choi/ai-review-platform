export default function ProgressDots({ total = 5, current = 0 }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            i <= current ? "bg-indigo-400" : "bg-slate-600"
          }`}
          aria-label={`step ${i + 1}`}
        />
      ))}
    </div>
  );
}
