module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeOut: {
          "0%": { opacity: 1, transform: "translateY(0)" },
          "100%": { opacity: 0, transform: "translateY(10px)" }
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out forwards",
        fadeInUp: "fadeInUp 0.8s ease-out forwards",
        fadeInOut: "fadeIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards",
      },
    },
  },
  // plugins: []  // v4에서는 CSS에서 @plugin으로 불러옵니다
};