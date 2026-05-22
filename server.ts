import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const getSystemInstruction = (operatorId: string) => {
  const baseRules = `你是「硅堆(Silicon Pile)」算力交易平台的AI助手。请遵守以下原则：
1. 直接正面回答用户问题，用简洁明了的语言，不要绕弯子。
2. 回复控制在2-4句话以内，点到为止。
3. 涉及具体数据时给出准确数字，不确定时明确告知。
4. 保持专业、冷峻的语气，但不要为了营造氛围而回避实质问题。`;

  switch (operatorId) {
    case "kaelen":
      return `${baseRules} 你的身份是【操作员 Kaelen】，负责算力资产配置、集群调度和销售咨询。用户问你什么就答什么，简洁直接。`;
    case "vane":
      return `${baseRules} 你的身份是【技术员 Vane】，资深系统工程师，负责硬件运维和IDC机房技术。用户问你什么就答什么，可以提及冷却系统、NVLink带宽、HBM内存等硬件参数。`;
    case "reyes":
      return `${baseRules} 你的身份是【指挥官 Reyes】，负责交易安全合规、合同审核和资金托管。用户问你什么就答什么，言简意赅。`;
    default: {
      const cleanName = operatorId.startsWith("thread-") ? decodeURIComponent(operatorId.substring(7)) : operatorId;
      return `${baseRules} 你的身份是算力交易节点【${cleanName}】代表，正在与用户进行一对一商务接洽。请直接回应用户的询价或交付问题，推进交易落地。`;
    }
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API router for DeepSeek AI Chats
  app.post("/api/chat", async (req, res) => {
    try {
      const { operatorId, message, history } = req.body;
      const apiKey = process.env.DEEPSEEK_API_KEY;

      if (!apiKey || apiKey === "MY_DEEPSEEK_API_KEY" || apiKey.trim() === "") {
        console.warn("DEEPSEEK_API_KEY is not defined or is a placeholder. Using intelligent fallback mock responses.");

        let text = "";
        if (operatorId && operatorId.startsWith("thread-")) {
          const cleanName = decodeURIComponent(operatorId.substring(7));
          text = `[系统提示: 未检测到DEEPSEEK_API_KEY，已启动本地算力助手] \n\n【${cleanName}】: 收到关于这笔算力交易的专属询单接洽。正如我们发布的项目细节所示，目前算力节点可以随时启动物理拉载调试。为确保双方的交割安全，建议我们可在托管平台框架下多签出具正式租赁合同，并确认所需的外部带宽和首期托管押金周期。期待在通信中轨中锁定具体交接配置。`;
        } else {
          const mockResponses: { [key: string]: string[] } = {
            kaelen: [
              `[系统提示: 未检测到DEEPSEEK_API_KEY，已启动本地算力助手] \n\n【Kaelen】: 收到关于算力资产的查询。B300集群（Blackwell 架构）目前在深圳机房有 64 台物理节点，带宽 NVLink 5.0 可用。请问您需要立即预留还是调配？`,
              `【Kaelen】: H800（Hopper架构 SXM5）在香港机房有最新 128 台期货储备，预计Q3交付，最低起订量（MOQ）为 8 台。算力担保协议已准备完毕。`,
              `【Kaelen】: 数据接收。目前全球算力紧张，正在为您监控新的GPU集群资源（如A100-80G、H100 NVLink）。您可以点击顶部的【发布】自主创建需求。`
            ],
            vane: [
              `[系统提示: 未检测到DEEPSEEK_API_KEY，已启动本地硬件助手] \n\n【Vane】: 正在分析你发送的遥测指令。目前 A100/H800/B300 节点工作参数平稳。冷却液流量 4.2L/min，温度 52.1°C。需要进行歧管压力二次诊断吗？`,
              `【Vane】: Mellanox QM9700 交换机端口在途，64路400Gb/s NDR 正在上海清关中。如果网络架构需要 IB 互连，随时可以向我调配接口配置文件。`,
              `【Vane】: 歧管压降状态：已排除 7G 扇区局部故障，隔离程序已重置。一切参数回归指标极限。`
            ],
            reyes: [
              `[系统提示: 未检测到DEEPSEEK_API_KEY，已启动本地安全助手] \n\n【Reyes】: 算力大厅安全状态升级至 2 级。我们拦截了针对 MAC 地址 00:1E:8C 的未经授权握手，防火墙已重载。请提交标准合规租赁合同。`,
              `【Reyes】: 平台资金托管交易由平台担保。任何算力大宗划转均需要 01 类标准多签合同。若需确认交易流程清单，请立即答复授权。`,
              `【Reyes】: 指令确认。系统已进入安全守卫模式，所有流量已通过备用中继进行重新定向，延迟波动范围 +14ms 属可控区间。`
            ]
          };

          const list = mockResponses[operatorId] || mockResponses["kaelen"];
          const randomIndex = Math.floor(Math.random() * list.length);
          text = list[randomIndex];
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        res.json({ text });
        return;
      }

      const sysInstruction = getSystemInstruction(operatorId || "kaelen");

      // Build messages in OpenAI-compatible format
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: sysInstruction },
      ];

      if (history && Array.isArray(history)) {
        for (const msg of history) {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.text,
          });
        }
      }
      messages.push({ role: "user", content: message });

      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          temperature: 0.8,
          top_p: 0.9,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("DeepSeek API Error:", response.status, errBody);
        throw new Error(`DeepSeek API returned ${response.status}`);
      }

      const result = await response.json();
      const replyText = result.choices?.[0]?.message?.content || "【重发信号】: 系统通信错误，请重新输入。";

      res.json({ text: replyText });
    } catch (err: any) {
      console.error("DeepSeek API Error in server:", err);
      res.status(500).json({
        error: "Failed to query DeepSeek API",
        message: err.message || String(err),
        fallbackText: "【信息中断】: 系统与核心算力基建发生连接中断。正在重试..."
      });
    }
  });

  // Serve static assets or use development Vite server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[硅堆] Server listening on port ${PORT}`);
  });
}

startServer();
