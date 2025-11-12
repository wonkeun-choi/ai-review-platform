export default function QuestionBox({ type = "tech", text }) {
  const isTech = type === "tech";
  const badge = isTech ? "기술" : "인성";
  return (
    <div className="rounded-2xl p-6 bg-slate-800/60 border border-slate-700">
      <div
        className={`inline-flex items-center text-xs px-2 py-1 rounded-full mb-3
        ${isTech ? "bg-indigo-600/30 text-indigo-200" : "bg-emerald-600/30 text-emerald-200"}`}
      >
        {badge}
      </div>
      <div className="text-lg leading-relaxed text-slate-100">{text}</div>
    </div>
  );
}
