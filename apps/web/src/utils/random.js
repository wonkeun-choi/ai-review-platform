/** 배열 셔플 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 기술 + 인성 질문 샘플링 */
export function sampleFive(TECH, BEH) {
  const techQs = shuffle(TECH).slice(0, 3).map((t) => ({ type: "tech", text: t }));
  const behQs = shuffle(BEH).slice(0, 2).map((t) => ({ type: "beh", text: t }));
  return shuffle([...techQs, ...behQs]);
}
