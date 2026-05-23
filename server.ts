import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const getSystemInstruction = (operatorId: string) => {
  const baseRules = `你是「硅堆(Silicon Pile)」算力交易平台的GUIDUI客服。请遵守以下原则：
1. 直接正面回答用户问题，用简洁明了的语言，不要绕弯子。
2. 回复控制在2-4句话以内，点到为止。
3. 涉及具体数据时给出准确数字，不确定时明确告知。
4. 保持专业、亲切的语气，帮助用户解决平台使用问题。`;

  if (operatorId && operatorId.startsWith("thread-")) {
    const cleanName = decodeURIComponent(operatorId.substring(7));
    return `你是「硅堆」平台客服，正在协助用户与【${cleanName}】进行商务接洽。请直接回应用户的询价或交付问题，推进交易落地。`;
  }

  return baseRules;
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
          text = `[系统提示: 未检测到DEEPSEEK_API_KEY] \n\n【GUIDUI客服】: 已收到您与【${cleanName}】的商务接洽请求。平台建议双方在托管框架下签署正式合同并确认交割细节。如有平台使用问题，请随时咨询。`;
        } else {
          const guiduiResponses = [
            `【GUIDUI客服】: 您好，我是硅堆平台客服。请问在使用平台过程中遇到什么问题？我可以帮您解答发布算力、下单询价等相关操作。`,
            `【GUIDUI客服】: 收到您的消息。如需了解算力交易流程、合同签署或资金托管细节，请具体说明您的需求。`,
            `【GUIDUI客服】: 已记录您的反馈。平台目前支持GPU算力供求对接，您可以在大厅浏览货源或发布需求。需要进一步协助吗？`
          ];
          text = guiduiResponses[Math.floor(Math.random() * guiduiResponses.length)];
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        res.json({ text });
        return;
      }

      const sysInstruction = getSystemInstruction(operatorId || "guidui");

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
