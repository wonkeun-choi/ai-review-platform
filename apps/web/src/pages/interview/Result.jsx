export default function Result() {
  return (
    <div className="bg-app min-h-screen flex items-center justify-center p-6">
      <div className="gcard max-w-xl w-full">
        <div className="ginner glass-sheen">
          <div className="gheader">수고하셨습니다!</div>
          <div className="p-6 space-y-4">
            <p className="text-slate-300">AI가 곧 요약과 점수를 보여줄 거예요.</p>
            <div className="flex gap-3">
              <a href="/interview" className="btn-neon">다시 면접</a>
              <a href="/" className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600">홈으로</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
