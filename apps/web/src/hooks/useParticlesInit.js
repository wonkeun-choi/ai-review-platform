// src/hooks/useParticlesInit.js
import { useEffect, useState } from "react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadAll } from "@tsparticles/all";

/**
 * tsparticles 엔진을 비동기적으로 초기화하는 커스텀 훅입니다.
 * Home.jsx와 Review.jsx의 중복 로직을 처리합니다.
 * @returns {boolean} - 파티클 엔진 초기화 완료 여부
 */
export function useParticlesInit() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    // particles.js에서 v2를 사용하고 있으므로
    // initParticlesEngine을 사용합니다.
    initParticlesEngine(async (engine) => {
      // loadFull(v2) -> loadAll(v3)로 변경
      // Home.jsx와 Review.jsx에서 이미 loadAll을 사용 중입니다.
      await loadAll(engine);
    }).then(() => {
      setInit(true); // 로딩 완료
    });
  }, []);

  return init;
}