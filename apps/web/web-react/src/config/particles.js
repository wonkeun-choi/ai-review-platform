export const particlesOptions = {
  background: { color: { value: "#0A0D14" } },
  detectRetina: true,
  fpsLimit: 90,
  interactivity: {
    detectsOn: "window",
    events: {
      onHover: { enable: true, mode: ["grab", "slow"] },
      resize: true
    },
    modes: {
      grab: {
        distance: 220,
        links: { opacity: 0.6 }
      },
      slow: { factor: 3, radius: 180 }
    }
  },
  particles: {
    number: {
      value: 80,
      density: { enable: true, area: 900 }
    },
    color: { value: ["#BBD2FF", "#E6ECFF", "#9FB7FF"] },
    shape: { type: "circle" },
    opacity: {
      value: 0.9,
      animation: { enable: false }
    },
    size: {
      value: { min: 2, max: 4 }
    },
    links: {
      enable: true,
      color: { value: ["#AEC4FF", "#98B2FF"] },
      opacity: 0.35,
      distance: 140,
      width: 1.4
    },
    move: {
      enable: true,
      speed: 0.6,
      direction: "none",
      random: false,
      straight: false,
      outModes: { default: "out" }
    },
    twinkle: {
      particles: { enable: true, color: "#FFFFFF", frequency: 0.005, opacity: 0.6 },
      lines: { enable: true, color: "#E6ECFF", frequency: 0.003, opacity: 0.25 }
    }
  }
};

export const particlesVersion = "v2";