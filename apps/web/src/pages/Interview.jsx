// src/pages/Interview.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowLeft, IconSend, IconUser, IconBrain } from "@tabler/icons-react";
import { sendChatRequest } from '../api/interviewService';

// 채팅 메시지를 표시하는 컴포넌트
const ChatBubble = ({ role, text }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start gap-3 max-w-xl ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`grid place-items-center w-10 h-10 rounded-full flex-shrink-0 ${isUser ? 'bg-blue-600' : 'bg-gray-700'}`}>
          {isUser ? <IconUser size={20} /> : <IconBrain size={20} />}
        </div>
        <div className={`p-4 rounded-lg shadow-md ${isUser ? 'bg-blue-700/80' : 'bg-gray-700/80'}`}>
          {/* AI 응답 텍스트 포맷팅 (간단 버전) */}
          <p className="text-white whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
};

export default function Interview() {
  const [topic, setTopic] = useState("React"); // 면접 주제
  const [history, setHistory] = useState([]); // 대화 기록
  const [userMessage, setUserMessage] = useState(""); // 현재 입력
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 면접 시작 (첫 질문 받기)
  const handleStartInterview = async () => {
    setIsLoading(true);
    setError(null);
    setHistory([]); // 대화 기록 초기화
    
    try {
      // "start" 메시지를 보내 AI의 첫 질문을 유도
      const aiResponse = await sendChatRequest(topic, [], "start");
      setHistory([{ role: "model", text: aiResponse }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 전송 (답변 제출 및 다음 질문 받기)
  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!userMessage || isLoading) return;

    setIsLoading(true);
    setError(null);
    
    // 1. 사용자 메시지를 히스토리에 추가
    const newHistory = [...history, { role: "user", text: userMessage }];
    setHistory(newHistory);
    setUserMessage("");

    try {
      // 2. AI에게 (주제, 전체 히스토리, 현재 메시지) 전송
      const aiResponse = await sendChatRequest(topic, history, userMessage);
      
      // 3. AI 응답을 히스토리에 추가
      setHistory([...newHistory, { role: "model", text: aiResponse }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white p-8">
      {/* --- 헤더 --- */}
      <header className="flex items-center justify-between mb-8 z-10 relative">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-400 hover:text-blue-300 transition-colors duration-300
                     group rounded-full p-2 hover:bg-white/5"
        >
          <IconArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Home</span>
        </Link>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text 
                       bg-[linear-gradient(180deg,#f8faff_0%,#e8ecff_70%)]
                       drop-shadow-[0_4px_20px_rgba(120,160,255,0.3)]">
          AI Interview
        </h1>
        <div className="w-32"></div>
      </header>

      {/* --- 메인 채팅 UI --- */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
        
        {/* 면접 시작/설정 영역 */}
        <div className="mb-6 p-4 bg-[#0e111c]/80 rounded-lg border border-blue-900/50 shadow-xl flex items-center gap-4">
          <label className="font-semibold">면접 주제:</label>
          <select 
            className="p-2 bg-gray-700 rounded"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="React">React</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Data Structures">Data Structures</option>
            <option value="System Design">System Design</option>
          </select>
          <button
            onClick={handleStartInterview}
            disabled={isLoading}
            className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition
                       disabled:bg-gray-700 disabled:opacity-50"
          >
            {history.length > 0 ? "면접 다시 시작" : "면접 시작"}
          </button>
        </div>

        {/* 채팅 메시지 영역 */}
        <div className="flex-1 p-6 bg-[#0e111c]/80 rounded-lg border border-blue-900/50 shadow-xl overflow-y-auto mb-6">
          {history.length === 0 && !isLoading && (
            <p className="text-gray-400 text-center">면접 주제를 선택하고 '면접 시작' 버튼을 눌러주세요.</p>
          )}
          {isLoading && history.length === 0 && (
            <p className="text-gray-400 text-center animate-pulse">AI 면접관이 첫 질문을 생성 중입니다...</p>
          )}

          {history.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} text={msg.text} />
          ))}

          {isLoading && history.length > 0 && (
             <div className="flex justify-start mb-4">
               <div className="flex items-start gap-3 max-w-xl">
                 <div className="grid place-items-center w-10 h-10 rounded-full flex-shrink-0 bg-gray-700">
                   <IconBrain size={20} />
                 </div>
                 <div className="p-4 rounded-lg shadow-md bg-gray-700/80 animate-pulse">
                   <div className="h-4 bg-gray-600 rounded w-24"></div>
                 </div>
               </div>
             </div>
          )}
          
          {error && (
            <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
              <h3 className="font-bold">오류</h3>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* 메시지 입력 폼 */}
        <form onSubmit={handleSubmitMessage} className="flex gap-4">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder={history.length > 0 ? "답변을 입력하세요..." : "면접을 먼저 시작해주세요."}
            disabled={isLoading || history.length === 0}
            className="flex-1 p-4 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                       disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || history.length === 0 || !userMessage}
            className="w-16 h-16 grid place-items-center bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition
                       disabled:bg-gray-700 disabled:opacity-50"
          >
            <IconSend size={24} />
          </button>
        </form>

      </div>
    </div>
  );
}