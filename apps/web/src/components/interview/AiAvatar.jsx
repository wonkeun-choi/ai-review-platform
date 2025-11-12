export default function AiAvatar({ text, title = "AI Interviewer" }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md animate-pulse" />
      <div className="flex-1">
        <div className="text-xs text-slate-400">{title}</div>
        <div className="mt-1 rounded-2xl px-4 py-3 bg-slate-800/70 border border-slate-700 text-slate-100 whitespace-pre-wrap">
          {text}
        </div>
      </div>
    </div>
  );
}
