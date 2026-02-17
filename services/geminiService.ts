import { ReportData } from "../types";

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
    "total": 0,
    "details": "评分说明（维度：定位精准度、运营轻盈度、盈利可持续性、小红书适配度、个人启动门槛）"
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
    
    if (!aiResponse?.choices || aiResponse.choices.length === 0) {
      throw new Error("AI返回格式异常，无choices字段");
    }
    let text = aiResponse.choices[0]?.message?.content || "";
    if (!text) {
      throw new Error("No response from AI");
    }

    // 第一步：过滤掉多余的前后缀，只保留 JSON 部分
    text = text.replace(/^[\s\S]*?\{/, "{").replace(/\}[\s\S]*$/, "}");
    // 第二步：清理 JSON 内部的换行符，解决多行字符串解析问题
    text = text.replace(/\n/g, " ").replace(/\r/g, " ");

    let data: ReportData;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON 解析失败，AI 返回的原始内容：", text);
      throw new Error("AI output format error");
    }

    if (!data.title || !data.score) {
      throw new Error("Incomplete report data");
    }

    return data;

  } catch (error) {
    console.error("AI API 完整错误信息：", error);
    throw error;
  }
};
