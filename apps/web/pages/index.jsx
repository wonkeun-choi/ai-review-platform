// apps/web/pages/index.jsx

import { useState } from 'react';
import Head from 'next/head';

// (중요) CSS 스타일을 여기에 직접 추가합니다.
const styles = `
  body { font-family: ui-sans-serif, system-ui, Arial; max-width: 980px; margin: 40px auto; padding: 0 16px; background: #fff; color: #111; }
  textarea { width: 100%; height: 180px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
  button { padding: 10px 14px; margin-right: 8px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
  button:hover { background: #005bb5; }
  .row { display:flex; gap:12px; }
  .col { flex:1; min-width: 0; }
  pre { background:#0f172a; color:#e2e8f0; padding:12px; border-radius:8px; overflow:auto; white-space:pre-wrap; word-break:break-word; }
  label { font-size: 14px; margin-right: 6px; }
  input, select { padding: 6px 8px; border: 1px solid #ccc; border-radius: 4px; }
  #status { margin-left: 8px; font-size: 14px; color: #16a34a; }
  #istatus { margin-left: 8px; color:#2563eb; }
`;

export default function Home() {
  const [code, setCode] = useState('def add(a,b): return a+b');
  const [level, setLevel] = useState('mix');
  const [n, setN] = useState(5);
  
  // 3개 페르소나 리뷰 결과
  const [reviews, setReviews] = useState({ ai: '', peer: '', mentor: '' });
  // 인터뷰 결과
  const [qa, setQa] = useState('');

  // 상태 메시지
  const [reviewStatus, setReviewStatus] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('');

  // 리뷰 호출 함수
  const handleReview = async () => {
    setReviewStatus('요청 중...');
    setReviews({ ai: '', peer: '', mentor: '' });
    try {
      // (중요) Nginx가 /api/로 보내도록 수정
      const res = await fetch('/api/review/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, personas: ['ai', 'peer', 'mentor'] })
      });
      const json = await res.json();
      if (json.status !== 'success') throw new Error(JSON.stringify(json.detail || json));
      
      setReviews(json.reviews);
      setReviewStatus('완료');
    } catch (e) {
      setReviewStatus('에러');
      setReviews(prev => ({ ...prev, ai: String(e) }));
    }
  };

  // 인터뷰 호출 함수
  const handleInterview = async () => {
    setInterviewStatus('질문 생성 중...');
    setQa('');
    try {
      // (중요) Nginx가 /api/로 보내도록 수정
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, level, n: parseInt(n, 10) })
      });
      const json = await res.json();
      if (json.status !== 'success') throw new Error(JSON.stringify(json.detail || json));
      
      setQa(json.qa || '');
      setInterviewStatus('완료');
    } catch (e) {
      setInterviewStatus('에러');
      setQa(String(e));
    }
  };

  return (
    <>
      <Head>
        <title>AI Code Review – Multi Persona (Next.js)</title>
        <meta charSet="utf-8" />
        {/* 스타일을 Head 태그 안에 삽입 */}
        <style>{styles}</style>
      </Head>
      
      <h2>AI Code Review (AI / Peer / Mentor) - Next.js UI</h2>
      <p>코드를 입력하고 <b>Review</b> 또는 <b>Interview</b> 버튼을 눌러보세요.</p>

      <textarea 
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <br />

      <div style={{ margin: '8px 0 16px 0' }}>
        <button id="btnReview" onClick={handleReview}>Review</button>
        <span id="status">{reviewStatus}</span>
      </div>

      <div style={{ margin: '8px 0 16px 0' }}>
        <label htmlFor="level">Level</label>
        <select 
          id="level" 
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="mix">mix</option>
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>
        <label htmlFor="count" style={{ marginLeft: '12px' }}>Questions</label>
        <input 
          id="count" 
          type="number" 
          min="1" max="10" 
          value={n}
          onChange={(e) => setN(e.target.value)}
          style={{ width: '70px' }} 
        />
        <button id="btnInterview" onClick={handleInterview} style={{ marginLeft: '12px' }}>Interview</button>
        <span id="istatus">{interviewStatus}</span>
      </div>

      <div className="row">
        <div className="col"><h3>AI</h3><pre id="ai">{reviews.ai}</pre></div>
        <div className="col"><h3>Peer</h3><pre id="peer">{reviews.peer}</pre></div>
        <div className="col"><h3>Mentor</h3><pre id="mentor">{reviews.mentor}</pre></div>
      </div>

      <h3 style={{ marginTop: '20px' }}>Interview Q/A</h3>
      <pre id="qa">{qa}</pre>
    </>
  );
}