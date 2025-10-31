export default function Home() {
  return (
    <main style={{fontFamily:"sans-serif", padding:24}}>
      <h1>AI 코드 리뷰 플랫폼 (Hello, Docker on Windows)</h1>
      <p>Gateway → Web → API 프록시 동작 테스트 링크:</p>
      <ul>
        <li><a href="/api/review">/api/review</a> (리뷰엔진 프록시)</li>
        <li><a href="/api/interview">/api/interview</a> (면접질문 프록시)</li>
      </ul>
    </main>
  );
}
