import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  
  // ------------------------------------------------------------------
  // ✅ 로컬 개발 서버 설정 (프록시 포함)
  // ------------------------------------------------------------------
  server: {
    port: 3000, // 프런트엔드는 3000번 포트에서 실행
    proxy: {
      // '/api/coding'으로 시작하는 요청은 8000번 포트(coding-service)로 전달
      '/api/coding': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      
      // '/api/review'으로 시작하는 요청은 8002번 포트(review-service)로 전달
      '/api/review': {
        target: 'http://localhost:8002', 
        changeOrigin: true,
      },
      
      // '/api/interview'으로 시작하는 요청은 8001번 포트(interview-service)로 전달
      '/api/interview': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      }
    }
  }
})