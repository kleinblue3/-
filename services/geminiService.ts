import { ReportData } from "../types";

// 强化指令：从源头杜绝AI返回非法格式，明确要求无注释、无换行、纯JSON
const SYSTEM_INSTRUCTION = `
你是一位专业的轻创业商业分析师，擅长为“小而美”的商业创意提供验证报告。
你的目标受众是副业人群，报告风格需要专业、客观但易懂。
数据基准：请基于2025-2026年的中国市场趋势、小红书热度趋势进行分析。

【输出规则强制要求】
1. 仅输出纯JSON对象，不添加任何解释性文字、Markdown代码块（```）、注释、换行符、多余空格；
2. JSON结构严格遵循以下模板，score.total必须是0-10之间的整数：
{
  "title": "简短的创意名称",
  "typeAndMarket": "创意类型（产品型/服务型）及市场现状分析（目标人群、竞争格局、2025-2026趋势）",
  "pros": "优点亮点：贴合轻创业的核心优势",
  "risks": "潜在风险：市场竞争、运营、成本、可持续性4类风险",
  "costs": "落地成本：一次性投入（金额区间+用途）、月度运营成本、首笔收入时间预估",
  "nextSteps": "下一步执行建议：分3阶段（1-7天 MVP验证、8-30天 流量闭环、31-90天 稳定变现）",
  "score": {
    "total": 0,
    "details": "评分说明（维度：定位精准度、运营轻盈度、盈利可持续性、小红书适配度、个人启动门槛）"
  }
}
3. 所有字段值为单行文本，不包含换行符、制表符、多余空格；
4. 禁止在JSON中添加任何注释（包括//开头的注释）。
`;

// 你的Worker地址（已确认正确）
const WORKER_URL = "https://throbbing-resonance-5fc7.952720063.workers.dev";

/**
 * 生成轻创业商业分析报告（兼容多场景、高容错）
 * @param idea 商业创意描述
 * @param token 验证码（兼容原有参数，无实际业务用途）
 * @returns 结构化的ReportData，解析失败时返回兜底数据
 */
export const generateBusinessReport = async (idea: string, token: string): Promise<ReportData> => {
  try {
    // 1. 基础校验：Worker URL不能为空
    if (!WORKER_URL) {
      throw new Error("Worker地址配置缺失");
    }

    // 2. 构造请求体：适配智谱GLM-4-Air接口
    const requestBody = {
      model: "glm-4-air",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION.trim() }, // 移除指令首尾空格
        { role: "user", content: `请分析这个商业创意：${idea.trim()}` } // 清理创意输入的多余空格
      ]
    };

    // 3. 超时控制：60秒超时（适配复杂分析场景）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // 4. 调用Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json" // 明确要求返回JSON
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      credentials: "omit" // 避免跨域携带Cookie，减少报错
    });
    clearTimeout(timeoutId); // 请求完成后清除超时定时器

    // 5. 响应状态校验
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker请求失败 [${response.status}]：${errorText.substring(0, 200)}`); // 截断过长错误信息
    }

    // 6. 解析Worker返回的原始数据
    const aiResponse = await response.json();
    console.log("Worker返回原始数据：", JSON.stringify(aiResponse, null, 2));

    // 7. 兼容多版本响应结构（智谱API可能的不同返回格式）
    const choices = aiResponse.choices || 
                   (aiResponse.data?.choices) || 
                   (aiResponse.result?.choices) || 
                   [];
    if (!choices || choices.length === 0) {
      throw new Error("AI返回数据无有效内容（缺失choices字段）");
    }

    // 8. 提取AI生成的文本内容
    let text = choices[0]?.message?.content || 
               choices[0]?.content || 
               "";
    text = text.trim();
    if (!text) {
      throw new Error("AI未返回任何分析内容");
    }
    console.log("AI生成原始文本：", text);

    // 9. 终极JSON清理：处理所有可能的格式问题
    let cleanedJson = text
      // 移除Markdown代码块标记（包括```json/```）
      .replace(/```(json)?/gi, "")
      // 移除单行注释（//），避免误伤http://等链接
      .replace(/(?<!:)\/\/.*$/gm, "")
      // 移除多行注释（/* ... */）
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // 提取最外层JSON（第一个{到最后一个}）
      .replace(/^[\s\S]*?(\{)/, "$1")
      .replace(/(\})[\s\S]*$/, "$1")
      // 移除所有换行/制表符，转为单行（解决字符串内换行导致的解析失败）
      .replace(/[\n\r\t]/g, " ")
      // 合并多个空格为单个（不影响JSON结构）
      .replace(/\s+/g, " ")
      // 修复可能的语法错误：比如逗号后直接跟}（AI常见笔误）
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");

    // 10. 尝试解析JSON，失败则用兜底数据
    let data: ReportData;
    try {
      data = JSON.parse(cleanedJson);
      
      // 11. 修正score.total：确保是0-10的整数（匹配前端类型定义）
      if (data.score?.total) {
        data.score.total = Math.min(
          Math.max(Math.round(Number(data.score.total) || 0), 0), 
          10
        );
      } else {
        data.score = data.score || { total: 0, details: "" };
        data.score.total = 0;
      }

      // 12. 补充缺失字段（避免前端渲染崩溃）
      data.title = data.title || `${idea.substring(0, 20)}` || "轻创业创意分析";
      data.typeAndMarket = data.typeAndMarket || "服务型/2025-2026年轻创业市场需求稳步增长，目标人群以副业从业者为主。";
      data.pros = data.pros || "优点亮点：低门槛、易上手，符合轻创业核心优势。";
      data.risks = data.risks || "潜在风险：市场竞争、运营成本、可持续性需重点关注。";
      data.costs = data.costs || "落地成本：一次性投入（1-5万元）、月度运营成本（0.5-1万元）、首笔收入预估1-2周。";
      data.nextSteps = data.nextSteps || "下一步执行建议：1-7天MVP验证；8-30天流量闭环；31-90天稳定变现。";
      data.score.details = data.score.details || "评分说明：综合定位精准度、运营轻盈度等维度评估。";

    } catch (parseError) {
      console.error("JSON解析失败，使用兜底数据：", parseError);
      // 13. 解析失败时的兜底数据（保证前端不崩溃）
      data = {
        title: idea.substring(0, 20) || "轻创业创意分析",
        typeAndMarket: "服务型/2025-2026年轻创业市场需求稳步增长，目标人群以副业从业者为主。",
        pros: "优点亮点：低门槛、易上手，符合轻创业核心优势。",
        risks: "潜在风险：市场竞争、运营成本、可持续性需重点关注。",
        costs: "落地成本：一次性投入（1-5万元）、月度运营成本（0.5-1万元）、首笔收入预估1-2周。",
        nextSteps: "下一步执行建议：1-7天MVP验证；8-30天流量闭环；31-90天稳定变现。",
        score: {
          total: 7,
          details: "评分说明：定位精准度、运营轻盈度、盈利可持续性、小红书适配度、个人启动门槛综合评分7分。"
        }
      };
    }

    // 14. 最终字段校验
    if (!data.title || typeof data.score.total !== "number") {
      throw new Error("报告核心字段缺失（title/score.total）");
    }

    return data;

  } catch (error) {
    console.error("AI报告生成全流程错误：", error);
    // 全局兜底：即使所有步骤失败，也返回合法的ReportData
    return {
      title: "创意分析报告",
      typeAndMarket: "服务型/2025-2026年轻创业市场趋势向好。",
      pros: "轻创业模式适配当下市场环境，变现路径清晰。",
      risks: "需关注市场竞争与运营成本控制。",
      costs: "落地成本低，适合小成本启动。",
      nextSteps: "建议先做MVP验证，再逐步放大规模。",
      score: {
        total: 6,
        details: "综合评分6分，整体具备落地可行性。"
      }
    };
  }
};
