import { ReportData } from "../types";

const SYSTEM_INSTRUCTION = `
你是一位专业的轻创业商业分析师，擅长为“小而美”的商业创意提供验证报告。
你的目标受众是副业人群，报告风格需要专业、客观但易懂。
数据基准：请基于2025-2026年的中国市场趋势、小红书热度趋势进行分析。

请严格按照以下JSON格式输出分析报告（不要输出Markdown代码块，直接输出JSON对象）：
{
  "title": "简短的创意名称",
  "typeAndMarket": "创意类型及市场现状分析",
  "pros": "优点亮点",
  "risks": "潜在风险",
  "costs": "落地成本",
  "nextSteps": "下一步执行建议",
  "score": {
    "total": 0,
    "details": "评分说明"
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

    // 核心调用逻辑（和你成功时一致）
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker 请求失败: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    let text = aiResponse.choices?.[0]?.message?.content || "";
    if (!text) {
      throw new Error("No response from AI");
    }

    // ========== 关键修复：解决JSON语法错误 ==========
    // 1. 提取最外层JSON
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
    // 2. 修复JSON语法错误：转义字段值里的未转义双引号、清理特殊字符
    text = text
      .replace(/([^\\])"/g, '$1\\"') // 转义未转义的双引号
      .replace(/\n/g, " ") // 去掉换行
      .replace(/\r/g, " ") // 去掉回车
      .replace(/\t/g, " ") // 去掉制表符
      .replace(/,\s*}/g, "}") // 修复逗号后直接跟}的错误
      .replace(/,\s*]/g, "]"); // 修复逗号后直接跟]的错误

    // 解析JSON（现在语法无错）
    const data: ReportData = JSON.parse(text);

    if (!data.title || !data.score) {
      throw new Error("Incomplete report data");
    }

    return data;

  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};
