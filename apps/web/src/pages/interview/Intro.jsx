export default function Intro() {
  return (
    <div className="bg-app min-h-screen flex items-center justify-center p-6">
      <div className="gcard max-w-xl w-full">
        <div className="ginner glass-sheen">
          <div className="gheader">AI Interview</div>
          <div className="p-6 space-y-4">
            <p className="text-slate-300">
              5개의 질문(기술+인성 랜덤), 문항당 60초입니다. 준비되면 시작하세요.
            </p>
            <a href="/interview/session" className="btn-neon block text-center">
              면접 시작
            </a>
            <a href="/" className="block text-center text-slate-400 text-sm">홈으로</a>
          </div>
        </div>
      </div>
    </div>
  );
}
