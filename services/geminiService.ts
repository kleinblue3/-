import { ReportData } from "../types";

// 保持你最初能成功调用AI的指令（仅精简格式要求）
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

// 你确认过的正确Worker地址
const WORKER_URL = "https://throbbing-resonance-5fc7.952720063.workers.dev";

// 回归最初能成功调用AI的核心逻辑
export const generateBusinessReport = async (idea: string, token: string): Promise<ReportData> => {
  try {
    // 1. 基础校验
    if (!WORKER_URL) {
      throw new Error("Missing Worker URL");
    }

    // 2. 构造请求体（和你调用成功时的结构一致）
    const requestBody = {
      model: "glm-4-air",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: `请分析这个商业创意：${idea}` }
      ]
    };

    // 3. 调用Worker（仅保留核心fetch逻辑，去掉多余配置）
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // 4. 响应状态校验
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker 请求失败: ${response.status} - ${errorText}`);
    }

    // 5. 解析AI返回结果（和你调用成功时一致）
    const aiResponse = await response.json();
    let text = aiResponse.choices?.[0]?.message?.content || "";
    if (!text) {
      throw new Error("No response from AI");
    }

    // 6. 仅做必要的JSON清理（解决解析问题，不额外改动）
    // 提取最外层JSON + 去掉换行符（核心修复，不做多余操作）
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1).replace(/\n/g, " ").replace(/\r/g, " ");
    }

    // 7. 解析JSON（保留基础解析，去掉复杂容错）
    const data: ReportData = JSON.parse(text);

    // 8. 基础字段校验（保证返回合法）
    if (!data.title || !data.score) {
      throw new Error("Incomplete report data");
    }

    return data;

  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};
