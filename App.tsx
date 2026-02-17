import React, { useState } from 'react';
import { UserIcon, SparklesIcon, LightBulbIcon } from './components/Icons';
import { generateBusinessReport } from './services/geminiService';
import { AppState, ReportData } from './types';
import { ReportDisplay } from './components/ReportDisplay';

// Admin code for testing (Client-side validation)
const TEST_CODE = '3388';

export default function App() {
  const [idea, setIdea] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = () => {
      if (!verificationCode) {
          setErrorMsg('请输入验证码');
          return;
      }
      if (verificationCode === TEST_CODE) {
          setIsVerified(true);
          setErrorMsg(null);
      } else {
          setErrorMsg('验证码无效');
      }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setErrorMsg('请输入您的创意描述');
      return;
    }

    if (idea.length < 5) {
      setErrorMsg('创意描述太短了，请多写几个字');
      return;
    }

    setAppState(AppState.LOADING);
    setErrorMsg(null);
    setReportData(null);

    // Timeout logic (45s to allow for worker cold starts)
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 45000)
    );

    try {
      // Pass the verification code as the token (or JWT placeholder)
      const data = await Promise.race([
        generateBusinessReport(idea, verificationCode),
        timeoutPromise
      ]) as ReportData;

      setReportData(data);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      if (err.message === 'TIMEOUT') {
        setErrorMsg('生成超时，请重试');
      } else if (err.message?.includes('401') || err.message?.includes('403')) {
         setErrorMsg('验证失效，请刷新页面重新输入验证码');
      } else {
        setErrorMsg('AI 服务暂时不可用，请稍后重试');
      }
      console.error(err);
    }
  };

  // Verification Screen
  if (!isVerified) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] text-slate-800 p-4">
             <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                <div className="mb-6 flex justify-center">
                    <div className="p-3 bg-pink-50 rounded-full">
                        <SparklesIcon />
                    </div>
                </div>
                <h1 className="text-2xl font-black mb-2 tracking-tight text-slate-800">
                    小而美商业思维测试站
                </h1>
                <p className="text-slate-500 text-sm mb-8">
                    请输入验证码开启您的创意验证之旅
                </p>

                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="请输入4位验证码" 
                        maxLength={4}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-2xl font-mono tracking-widest py-3 border-b-2 border-slate-200 focus:border-pink-400 outline-none transition-colors placeholder:text-slate-300 placeholder:text-lg placeholder:font-sans placeholder:tracking-normal"
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                    />
                    
                    {errorMsg && (
                        <div className="text-red-500 text-sm animate-pulse">
                            {errorMsg}
                        </div>
                    )}

                    <button 
                        onClick={handleVerify}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-200 transition-all transform active:scale-95 mt-4"
                    >
                        开启验证
                    </button>
                </div>
             </div>
        </div>
    );
  }

  // Main App Screen
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#fafafa] text-slate-800 selection:bg-pink-100 selection:text-pink-600">
      
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <SparklesIcon />
                <span className="font-bold text-slate-700 tracking-tight hidden md:inline">小而美商业思维测试站</span>
                <span className="font-bold text-slate-700 tracking-tight md:hidden">思维测试站</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <UserIcon />
                <span className="text-xs font-medium">VIP / {verificationCode.slice(0,2)}**</span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl px-4 pt-10 pb-20 flex flex-col items-center">
        
        {/* Branding Hero */}
        <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter">
                <span className="gradient-text">输入一个Idea</span>
                <br />
                <span className="text-slate-800">生成一份商业报告</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">
                基于2025-2026市场趋势的结构化分析
            </p>
        </div>

        {/* Input Area */}
        <div className="w-full bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 mb-6 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-100/50">
            <div className="px-4 py-4">
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">您的创意</label>
                <textarea 
                    className="w-full h-40 resize-none outline-none text-base md:text-lg text-slate-700 placeholder-slate-300 bg-transparent"
                    placeholder="例如：在大学城开一家主打自习空间的猫咖，目标客户是大学生，提供按小时计费的座位和免费的速溶咖啡..."
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    maxLength={200}
                ></textarea>
                <div className="flex justify-end pt-2">
                    <span className="text-xs text-slate-300 font-mono">{idea.length} / 200</span>
                </div>
            </div>
        </div>

        {/* Action Button */}
        <button 
            onClick={handleGenerate}
            disabled={appState === AppState.LOADING}
            className="w-full bg-pink-400 hover:bg-pink-500 active:bg-pink-600 disabled:bg-pink-200 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-pink-200 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0"
        >
            {appState === AppState.LOADING ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AI正在分析市场数据...
                </span>
            ) : '生成分析报告'}
        </button>

        {/* Hints / Errors */}
        <div className="mt-6 text-center w-full">
            {errorMsg ? (
                <div className="bg-red-50 text-red-500 text-sm py-2 px-4 rounded-lg inline-block animate-bounce">
                    {errorMsg}
                </div>
            ) : (
                <p className="text-slate-400 text-xs flex items-center justify-center">
                    <LightBulbIcon />
                    提示：描述越详细，分析结果越准确
                </p>
            )}
        </div>

        {/* Results Area */}
        {appState === AppState.SUCCESS && reportData && (
            <ReportDisplay data={reportData} />
        )}

      </main>
    </div>
  );
}
