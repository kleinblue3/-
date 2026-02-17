import React, { useState } from 'react';
import { ReportData } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

interface ReportDisplayProps {
  data: ReportData;
}

const Section = ({ title, content, colorClass = "bg-white" }: { title: string, content: string, colorClass?: string }) => (
  <div className={`p-6 rounded-2xl shadow-sm border border-slate-100 ${colorClass} mb-4 transition-all hover:shadow-md`}>
    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
      <span className="w-2 h-6 bg-gradient-to-b from-pink-400 to-purple-500 rounded-full mr-3 shadow-sm"></span>
      {title}
    </h3>
    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
      {content}
    </div>
  </div>
);

// Helper to determine score color
const getScoreTheme = (score: number) => {
    if (score >= 8) return "from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-200"; // High score
    if (score >= 6) return "from-indigo-400 via-purple-500 to-pink-500 shadow-purple-200"; // Medium score
    return "from-orange-400 via-amber-500 to-yellow-500 shadow-orange-200"; // Low score
};

const getScoreComment = (score: number) => {
    if (score >= 8) return "潜力无限 · 值得尝试";
    if (score >= 6) return "良玉需雕 · 谨慎入局";
    return "风险较高 · 建议重构";
};

export const ReportDisplay: React.FC<ReportDisplayProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `
【${data.title}】 - 小而美商业创意分析报告
    
1. 类型与市场：
${data.typeAndMarket}
    
2. 优点亮点：
${data.pros}
    
3. 潜在风险：
${data.risks}
    
4. 落地成本：
${data.costs}
    
5. 执行建议：
${data.nextSteps}
    
6. 综合评分：${data.score.total}/10
点评：${data.score.details}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const scoreTheme = getScoreTheme(data.score.total);
  const scoreBadge = getScoreComment(data.score.total);

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center mb-6 px-1">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">分析报告生成完毕</h2>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 text-xs md:text-sm text-slate-500 hover:text-pink-600 transition-colors bg-white px-3 py-2 rounded-full border border-slate-200 shadow-sm hover:shadow-md active:scale-95 transform"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? '已复制' : '复制全文'}</span>
        </button>
      </div>

      {/* Score Card - Refined Layout */}
      <div className={`bg-gradient-to-r ${scoreTheme} rounded-3xl p-1 text-white mb-8 shadow-xl relative overflow-hidden group`}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-700"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-black opacity-5 rounded-full blur-3xl"></div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-[20px] p-6 md:p-8 h-full border border-white/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left: Score */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-[140px]">
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">综合可行性评分</div>
                    <div className="relative">
                        <span className="text-6xl md:text-7xl font-black tracking-tighter leading-none drop-shadow-sm">
                            {data.score.total}
                        </span>
                        <span className="text-2xl opacity-60 font-medium ml-1">/10</span>
                    </div>
                    <div className="mt-3 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
                        {scoreBadge}
                    </div>
                </div>

                {/* Divider (Desktop only) */}
                <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-white/30 to-transparent mx-2"></div>
                
                {/* Divider (Mobile only) */}
                <div className="md:hidden w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

                {/* Right: Details */}
                <div className="flex-1">
                     <div className="flex items-center gap-2 mb-2 opacity-90">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold">AI 犀利点评</span>
                     </div>
                     <p className="text-sm md:text-base leading-relaxed opacity-95 whitespace-pre-wrap font-medium">
                        {data.score.details}
                     </p>
                </div>
            </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <Section title="1. 创意类型判定与市场现状" content={data.typeAndMarket} />
        <Section title="2. 优点亮点" content={data.pros} />
        <Section title="3. 潜在风险" content={data.risks} colorClass="bg-red-50/50 border-red-100" />
        <Section title="4. 落地成本估算" content={data.costs} />
        <Section title="5. 下一步执行建议 (MVP)" content={data.nextSteps} colorClass="bg-blue-50/50 border-blue-100" />
      </div>

      <div className="text-center mt-12 mb-8">
         <p className="text-slate-400 text-xs">本测试结果基于AI模型生成，仅供娱乐参考，投资需谨慎。</p>
      </div>
    </div>
  );
};