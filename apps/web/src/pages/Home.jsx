// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { IconCode, IconChecklist, IconUserScan } from "@tabler/icons-react";
import Particles from "@tsparticles/react";
import { particlesOptions, particlesVersion } from "@/config/particles";
import { useParticlesInit } from "../hooks/useParticlesInit";

const BRAND = "SkillBoost";
const items = [
  { title: "Coding Test", href: "/coding", icon: IconCode },
  { title: "Code Review", href: "/review", icon: IconChecklist },
  { title: "AI Interview", href: "/interview", icon: IconUserScan },
];

export default function Home() {
  const init = useParticlesInit();

  if (!init) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-white">
      <Particles
        id="tsparticles"
        options={particlesOptions}
        key={particlesVersion}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* --- 헤더 --- */}
      <header className="flex flex-col items-center justify-center pt-[18vh] text-center z-10 relative">
        <h1
          className={`font-extrabold tracking-tight select-none text-transparent bg-clip-text
          bg-[linear-gradient(180deg,#f8faff_0%,#e8ecff_35%,#cfd9ff_70%,#9fb7ff_100%)]
          text-[110px] md:text-[140px] leading-none drop-shadow-[0_18px_75px_rgba(120,160,255,0.45)]`}
          // 👈 (수정) opacity-0 animate-fadeInUp 제거
        >
          {BRAND}
        </h1>
      </header>

      {/* --- 메인 콘텐츠 --- */}
      <main className="flex-1 flex items-start justify-center z-10 mt-[120px] md:mt-[140px] px-6">
        <div className="w-full max-w-[1600px] mx-auto">
          <div
            className={`flex items-center justify-center whitespace-nowrap gap-x-[60px] md:gap-x-[90px] lg:gap-x-[110px]`}
            // 👈 (수정) opacity-0 animate-fadeInUp [animation-delay:0.2s] 제거
          >
            {items.map(({ title, href, icon: Icon }) => (
              <Link
                key={title}
                to={href}
                aria-label={title}
                className={`group relative inline-flex items-center rounded-full p-[8px]
                  bg-[linear-gradient(135deg,rgba(180,200,255,0.42),rgba(120,150,255,0.32),rgba(60,80,160,0.28))]
                  shadow-[0_18px_45px_rgba(20,30,70,0.45)]
                  transition-all duration-300 hover:-translate-y-[8px] hover:shadow-[0_22px_65px_rgba(100,150,255,0.55)]
                  isolation-isolate`}
              >
                <span
                  className={`inline-flex items-center rounded-full
                  py-[16px] md:py-[18px] gap-[12px]
                  pl-[28px] pr-[40px]
                  bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0.10))]
                  backdrop-blur-2xl
                  shadow-[inset_0 2px 2px_rgba(255,255,255,0.45),inset_0_-4px_10px_rgba(0,0,0,0.30)]
                  transition-colors duration-300 group-hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.24),rgba(255,255,255,0.14))]`}
                >
                  <span
                    className={`relative grid place-items-center
                    w-[60px] h-[60px] md:w-[70px] md:h-[70px] rounded-full
                    bg-[linear-gradient(180deg,rgba(255,255,255,.96),rgba(200,220,255,.58))]
                    text-[#1e275d]
                    shadow-[inset_0 1px 1px_rgba(255,255,255,.9),0_14px_32px_rgba(100,150,255,.45)]
                    transition-transform duration-300 group-hover:scale-105`}
                  >
                    <Icon className="w-[28px] h-[28px] md:w-[34px] md:h-[34px] opacity-90" />
                    <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 w-[44px] md:w-[54px] h-[10px] rounded-full bg-white/60 blur-[5px]" />
                  </span>
                  <span
                    className={`text-[28px] md:text-[34px] lg:text-[38px] font-semibold tracking-tight text-[#F1F4FF]
                    drop-shadow-[0_4px_16px_rgba(120,150,255,0.42)]
                    group-hover:text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]`}
                  >
                    {title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}