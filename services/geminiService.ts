import { ReportData } from "../types";

// 升级版指令：接地气、轻创业、护城河、实战经验
// 核心修改：调整字数要求至100-120字防止截断，强化转义要求
const SYSTEM_INSTRUCTION = `
你是一位懂轻创业、懂副业人群的接地气商业分析师，专为想做“小而美”生意的普通人，提供可落地、低风险、不说空话的商业创意验证报告。

【核心原则】
1. 拒绝纸上谈兵，拒绝建议大额盲目投入，只给普通人能hold住的轻创业方案。
2. 经典创业书籍的理念仅作为分析的辅助亮点，不生硬堆砌书名和理论。
3. 受众是0基础副业人群，报告风格直白、好懂、有温度，不搞专业黑话。
4. 数据基准：基于2025-2026年中国轻创业市场趋势、小红书流量与用户偏好。

【评分核心规则】
✅ 加分项（8-10分）：垂直细分赛道、小体量高利润、轻资产、可单人落地、低风险验证。
❌ 减分项（6分以下）：重资产开店、红海无差异化、需大规模团队、高运营成本、风险不可控。

请严格按照以下JSON格式输出分析报告（不要输出Markdown代码块，不要包含任何额外文本，直接输出JSON对象）：
**重要要求：请确保生成完整的JSON。每个板块分析字数控制在100-120字之间，言简意赅，防止截断。必须包含所有7个板块。如果内容中包含双引号，请务必使用反斜杠转义（如 \\"）。**

{
  "title": "简短的创意名称",
  "typeAndMarket": "创意类型及市场现状：用大白话分析目标人群是谁，竞争对手在做什么，2025年的机会在哪里。",
  "pros": "优点与护城河：1. 核心优势；2. 【重点】如何构建“护城河”（防抄袭、个人IP、私域、供应链等）。",
  "risks": "潜在风险：市场卷不卷？获客难不难？如果不干了，成本能收回多少？",
  "costs": "落地成本：一次性投入（精确到千元）、月度硬性支出、多久回本。列出具体项目。",
  "nextSteps": "下一步执行建议：分3阶段：1-7天 MVP验证；8-30天 流量闭环；31-90天 变现模型。",
  "founderExperience": "创始人0-1落地经验：【必填】列举同赛道真实品牌或小红书账号。展开讲讲前人踩过的坑和成功细节。",
  "survivalGuide": "极简生存指南：【必填】1. 引用经典创业书籍金句。2. 解释这句话如何指导该生意。",
  "score": {
    "total": 0,
    "details": "犀利点评：(80字以内) 总结得分原因，指出最大亮点或致命弱点。"
  }
}
`;

const WORKER_URL = "https://throbbing-resonance-5fc7.952720063.workers.dev";

/**
 * 终极兜底解析器：基于 Key 定位的切片提取
 * 解决：
 * 1. 板块2(pros)内容含引号导致正则匹配失败
 * 2. 板块6/7被截断导致JSON不完整
 * 3. AI输出格式不规范
 */
function fallbackParse(text: string): ReportData {
  console.warn("Triggering Key-Based Slicing Parser for:", text.slice(0, 50) + "...");

  // 提取两个 Key 之间的内容
  const getSection = (startKey: string, endKey?: string): string => {
    // 1. 定位开始位置 (匹配 "key": 或 key:)
    const startPattern = new RegExp(`(?:["']?${startKey}["']?)\\s*:`, "i");
    const startMatch = text.match(startPattern);
    
    if (!startMatch) return ""; // 没找到该字段
    
    const startIndex = startMatch.index! + startMatch[0].length;
    
    let endIndex = text.length;
    if (endKey) {
        // 2. 定位结束位置 (必须在开始位置之后)
        const endPattern = new RegExp(`(?:["']?${endKey}["']?)\\s*:`, "i");
        const remainingText = text.slice(startIndex);
        const endMatch = remainingText.match(endPattern);
        
        if (endMatch) {
            endIndex = startIndex + endMatch.index!;
        }
    }

    // 3. 截取并清洗内容
    let content = text.slice(startIndex, endIndex).trim();

    // 去除开头可能的引号
    if (content.startsWith('"')) content = content.slice(1);
    
    // 去除结尾可能的引号、逗号、甚至结尾的大括号（针对最后一条被截断的情况）
    // 策略：如果结尾是 ", 则去掉；如果结尾是 " 则去掉；
    // 如果结尾是 truncated text... 则保留
    if (content.endsWith('",')) {
        content = content.slice(0, -2);
    } else if (content.endsWith('"')) {
        content = content.slice(0, -1);
    } else if (content.endsWith(',')) {
        content = content.slice(0, -1);
    }

    // 针对最后一个字段，可能会带上 JSON 结尾的 }
    content = content.replace(/}\s*$/, '').trim();
    if (content.endsWith('"')) content = content.slice(0, -1);

    // 尝试反转义，恢复正常文本
    try {
        content = content
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\\\/g, '\\')
            .replace(/\\t/g, '\t');
    } catch (e) {
        // 忽略错误
    }

    return content.trim();
  };

  // 按顺序提取
  const title = getSection("title", "typeAndMarket");
  const typeAndMarket = getSection("typeAndMarket", "pros");
  const pros = getSection("pros", "risks"); // 即使pros里有未转义引号，也能正确取到 risks 之前
  const risks = getSection("risks", "costs");
  const costs = getSection("costs", "nextSteps");
  const nextSteps = getSection("nextSteps", "founderExperience");
  const founderExperience = getSection("founderExperience", "survivalGuide");
  
  // survivalGuide 下一个是 score 对象
  const survivalGuide = getSection("survivalGuide", "score");

  // 单独处理 Score (因为它是一个对象结构)
  let total = 0;
  let details = "";
  
  // 尝试从全文提取 total
  const totalMatch = text.match(/"?total"?\s*:\s*(\d+)/i);
  if (totalMatch) total = parseInt(totalMatch[1], 10);
  
  // 尝试提取 details
  // 优先尝试正则
  const detailsMatch = text.match(/"?details"?\s*:\s*"((?:[^"\\\\]|\\\\.)*)"/i);
  if (detailsMatch) {
      details = detailsMatch[1];
  } else {
      // 如果正则失败，尝试用切片法提取 details 到 JSON 结束
      // 这里的 endKey 不存在，取到最后
      const rawDetails = getSection("details");
      details = rawDetails.replace(/["}]/g, ""); // 简单清理
  }

  return {
    title: title || "分析报告生成中...",
    typeAndMarket: typeAndMarket,
    pros: pros,
    risks: risks,
    costs: costs,
    nextSteps: nextSteps,
    founderExperience: founderExperience,
    survivalGuide: survivalGuide,
    score: {
      total: total || 0,
      details: details || "暂无评分详情"
    }
  };
}

export const generateBusinessReport = async (idea: string, token: string): Promise<ReportData> => {
  try {
    if (!WORKER_URL) {
      throw new Error("Missing Worker URL");
    }

    const requestBody = {
      model: "glm-4-air",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { 
            role: "user", 
            // 再次强调完整性
            content: `请分析这个商业创意：${idea}。\n\n务必输出完整的JSON，包含所有7个板块（特别是创始人经验和生存指南）。` 
        }
      ]
    };

    // 设置超时控制器 (90秒)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

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
    
    // 兼容 OpenAI 格式和 GLM 格式
    const choices = aiResponse.choices || (aiResponse.data && aiResponse.data.choices);
    if (!choices || choices.length === 0) {
      console.error("AI Response missing choices:", aiResponse);
      throw new Error("AI服务返回数据格式异常");
    }

    let text = choices[0]?.message?.content || "";
    if (!text) {
      throw new Error("AI未返回任何内容");
    }

    console.log("Raw AI Output:", text);

    let data: ReportData | null = null;
    
    // --- 健壮的解析逻辑 ---
    
    // 1. 预处理：移除 Markdown 标记
    let cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    // 2. 尝试标准 JSON 解析
    try {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        const sanitized = cleaned.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ""); 
        data = JSON.parse(sanitized);
      } else {
        throw new Error("JSON结构不完整");
      }
    } catch (parseError) {
      console.warn("Standard JSON parse failed, attempting fallback...", parseError);
      
      // 3. 兜底解析：使用切片法提取
      try {
        data = fallbackParse(text);
      } catch (fallbackError) {
        console.error("Fallback parsing failed:", fallbackError);
        throw new Error("报告生成失败：无法解析AI返回的数据，请修改描述后重试。");
      }
    }

    // 4. 数据完整性校验
    if (!data || !data.title) {
       // 如果连标题都没有，认为是失败
       if (data?.pros) {
           // 勉强接受
       } else {
           throw new Error("报告数据严重缺失");
       }
    }
    
    if (!data.score) {
        data.score = { total: 0, details: "评分数据缺失" };
    }

    return data;

  } catch (error: any) {
    console.error("AI API Error:", error);
    if (error.name === 'AbortError') {
        throw new Error("TIMEOUT");
    }
    throw error;
  }
};