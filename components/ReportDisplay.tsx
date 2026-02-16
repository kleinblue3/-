import React, { useState } from 'react';
import { ReportData } from '../types';
import { CopyIcon, CheckIcon } from './Icons';

interface ReportDisplayProps {
  data: ReportData;
}

const Section = ({ title, content, colorClass = "bg-white" }: { title: string, content: string, colorClass?: string }) => (
  <div className={`p-6 rounded-2xl shadow-sm border border-slate-100 ${colorClass} mb-4`}>
    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
      <span className="w-2 h-6 bg-gradient-to-b from-pink-400 to-purple-500 rounded-full mr-3"></span>
      {title}
    </h3>
    <div className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
      {content}
    </div>
  </div>
);

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
${data.score.details}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-800">分析报告生成完毕</h2>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 text-sm text-slate-500 hover:text-pink-600 transition-colors bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? '已复制' : '复制全文'}</span>
        </button>
      </div>

      {/* Score Card */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white mb-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
                <div className="text-sm opacity-90 mb-1">创意综合评分</div>
                <div className="text-5xl font-black tracking-tighter">{data.score.total}<span className="text-2xl opacity-80">/10</span></div>
            </div>
            <div className="md:w-2/3 md:pl-6 text-sm md:text-base opacity-95 leading-relaxed">
                {data.score.details}
            </div>
        </div>
      </div>

      {/* Sections */}
      <Section title="1. 创意类型判定与市场现状" content={data.typeAndMarket} />
      <Section title="2. 优点亮点" content={data.pros} />
      <Section title="3. 潜在风险" content={data.risks} colorClass="bg-red-50/50 border-red-100" />
      <Section title="4. 落地成本估算" content={data.costs} />
      <Section title="5. 下一步执行建议 (MVP)" content={data.nextSteps} colorClass="bg-blue-50/50 border-blue-100" />

      <div className="text-center mt-12 mb-20">
         <p className="text-slate-400 text-xs">本测试结果仅供娱乐参考，不构成任何专业建议哦～</p>
      </div>
    </div>
  );
};