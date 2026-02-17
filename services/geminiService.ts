import { ReportData } from "../types";

// 结构化分析指令（保持和你原有逻辑一致）
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

// 你的 Worker 地址（已确认正确）
const WORKER_URL = "https://throbbing-resonance-5fc7.952720063.workers.dev";

/**
 * 生成商业分析报告（保留原有函数名/参数/返回值，前端无感知）
 * @param idea 商业创意描述
 * @param token 验证码（兼容原有参数，无实际用途）
 * @returns 结构化的分析报告
 */
export const generateBusinessReport = async (idea: string, token: string): Promise<ReportData> => {
  try {
    // 1. 校验 Worker 地址
    if (!WORKER_URL) {
      throw new Error("Missing Worker URL");
    }

    // 2. 构造请求体（传给智谱 AI）
    const requestBody = {
      model: "glm-4-air",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: `请分析这个商业创意：${idea}` }
      ]
    };

    // 3. 实现 30 秒超时（修复原生 fetch 不支持 timeout 的问题）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // 4. 调用 Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal, // 绑定超时信号
    });
    clearTimeout(timeoutId); // 请求成功后清除超时定时器

    // 5. 校验 Worker 响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker 请求失败: ${response.status} - ${errorText}`);
    }

    // 6. 解析 Worker 返回的 AI 结果
    const aiResponse = await response.json();
    
    // 7. 空值校验（避免解构报错）
    if (!aiResponse?.choices || aiResponse.choices.length === 0) {
      throw new Error("AI返回格式异常，无choices字段");
    }
    let text = aiResponse.choices[0]?.message?.content || "";
    if (!text) {
      throw new Error("No response from AI");
    }

    // 8. 核心修复：过滤 AI 返回的多余文字，只保留纯 JSON（解决解析错误）
    // 去掉开头到第一个 { 之前的所有内容 + 去掉最后一个 } 之后的所有内容
    text = text.replace(/^[\s\S]*?\{/, "{").replace(/\}[\s\S]*$/, "}");

    // 9. 解析 JSON 为前端需要的 ReportData 类型
    let data: ReportData;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON 解析失败，AI 返回的原始内容：", text);
      throw new Error("AI output format error");
    }

    // 10. 校验报告核心字段（确保前端渲染不崩溃）
    if (!data.title || !data.score) {
      throw new Error("Incomplete report data");
    }

    return data;

  } catch (error) {
    console.error("AI API 完整错误信息：", error);
    throw error; // 抛出错误让前端捕获
  }
};
