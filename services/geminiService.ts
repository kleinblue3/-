import { GoogleGenAI } from "@google/genai";
import { ReportData } from "../types";

// Initialize the Google GenAI client
// The API key is securely injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
你是一位专业的轻创业商业分析师，擅长为“小而美”的商业创意提供验证报告。
你的目标受众是副业人群，报告风格需要专业、客观但易懂。
数据基准：请基于2025-2026年的中国市场趋势、小红书热度趋势进行分析。

请严格按照以下JSON格式输出分析报告（不要输出Markdown代码块，直接输出JSON对象）：
{
  "title": "简短的创意名称",
  "typeAndMarket": "创意类型（产品型/服务型）及市场现状分析（目标人群、竞争格局、2025-2026趋势）",
  "pros": "优点亮点：贴合轻创业的核心优势（低门槛、易上手、变现清晰等）",
  "risks": "潜在风险：市场竞争、运营、成本、可持续性4类风险",
  "costs": "落地成本：一次性投入（金额区间+用途）、月度运营成本、首笔收入时间预估",
  "nextSteps": "下一步执行建议：分3阶段（1-7天 MVP验证、8-30天 流量闭环、31-90天 稳定变现）",
  "score": {
    "total": 0, // 0-10分，整数
    "details": "评分说明（维度：定位精准度、运营轻盈度、盈利可持续性、小红书适配度、个人启动门槛）"
  }
}
`;

export const generateBusinessReport = async (idea: string, token: string): Promise<ReportData> => {
  try {
    // Note: 'token' is kept in the signature for compatibility but not needed for direct SDK calls
    // strictly speaking, but we verify the user in the UI.

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `请分析这个商业创意：${idea}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json", 
        // We use responseMimeType to force JSON structure, eliminating parsing errors
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    let data: ReportData;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON", text);
        throw new Error("AI output format error");
    }

    // Basic validation
    if (!data.title || !data.score) {
        throw new Error("Incomplete report data");
    }

    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};