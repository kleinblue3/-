import { ReportData } from "../types";

// 移除 JSON 模板中的注释，防止 AI 生成带注释的非法 JSON
const SYSTEM_INSTRUCTION = `
你是一位专业的轻创业商业分析师，擅长为“小而美”的商业创意提供验证报告。
你的目标受众是副业人群，报告风格需要专业、客观但易懂。
数据基准：请基于2025-2026年的中国市场趋势、小红书热度趋势进行分析。

请严格按照以下JSON格式输出分析报告（不要输出Markdown代码块，直接输出JSON对象）：
{
  "title": "简短的创意名称",
  "typeAndMarket": "创意类型（产品型/服务型）及市场现状分析（目标人群、竞争格局、2025-2026趋势）",
  "pros": "优点亮点：贴合轻创业的核心优势",
  "risks": "潜在风险：市场竞争、运营、成本、可持续性4类风险",
  "costs": "落地成本：一次性投入（金额区间+用途）、月度运营成本、首笔收入时间预估",
  "nextSteps": "下一步执行建议：分3阶段（1-7天 MVP验证、8-30天 流量闭环、31-90天 稳定变现）",
  "score": {
    "total": 0, // 0-10的整数
    "details": "犀利点评：请用一段简练的话（80字以内）总结得分原因，直接指出该创意的最大亮点或最致命的弱点，无需列举维度。"
  }
}
`;

const WORKER_URL = "https://throbbing-resonance-5fc7.952720063.workers.dev";

export const generateBusinessReport = async (idea: string, token: string): Promise<ReportData> => {
  try {
    if (!WORKER_URL) {
      throw new Error("Missing Worker URL");
    }

    const requestBody = {
      model: "glm-4-air",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: `请分析这个商业创意：${idea}` }
      ]
    };

    // 设置超时控制器 (60秒)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker 请求失败: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    
    // 兼容可能的数据结构
    const choices = aiResponse.choices || (aiResponse.data && aiResponse.data.choices);
    if (!choices || choices.length === 0) {
      console.error("AI Response missing choices:", aiResponse);
      throw new Error("AI返回数据格式异常");
    }

    let text = choices[0]?.message?.content || "";
    if (!text) {
      throw new Error("No response content from AI");
    }

    console.log("Raw AI Output:", text);

    let data: ReportData;
    
    // --- 修复后的 JSON 提取逻辑 (包含 Markdown 清理和容错) ---
    try {
      // 1. 移除 Markdown 代码块标记
      let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

      // 2. 提取最外层的大括号（确保去除前言和后语）
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      } else {
        throw new Error("未找到有效的 JSON 结构 ({...})");
      }

      // 3. 尝试解析
      try {
          data = JSON.parse(cleaned);
      } catch (firstPassError) {
          console.warn("初次解析失败，尝试清理特殊字符...", firstPassError);
          // 降级处理：有时候 AI 会输出非法的控制字符，清理它们
          const sanitized = cleaned.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "");
          data = JSON.parse(sanitized);
      }

    } catch (e) {
      console.error("Final JSON Parse Error:", e);
      console.error("Text attempting to parse:", text);
      throw new Error("无法解析AI生成的报告，请重试");
    }

    // 数据完整性校验
    if (!data.title || typeof data.score?.total !== 'number') {
      throw new Error("报告数据字段不完整");
    }

    return data;

  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};