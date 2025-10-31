const express = require('express');
const app = express();
app.get('/healthz', (_, res) => res.json({ ok: true }));
app.get('/questions', (_, res) =>
  res.json({ questions: ["이 함수의 시간복잡도는?", "에러 처리를 어떻게 했나요?"] })
);
app.listen(8001, () => console.log("interview-gen on 8001"));