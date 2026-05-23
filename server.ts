import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const CHAT_MODEL = "deepseek-chat";

const getSystemInstruction = (operatorId: string) => {
  const baseRules = `你是「硅堆(Silicon Pile)」算力交易平台的GUIDUI客服。

## 平台功能范围
硅堆是一个GPU算力供需对接平台，提供以下功能：
- 大厅(Lobby)：浏览和搜索GPU算力货源/需求，可按供应/需求切换
- 发布(Publish)：用户可发布GPU算力货源或需求信息，填写标题、GPU型号、数量、地点、交付期等规格
- 消息(Messages)：与平台客服对话、与其他用户进行商务接洽
- 终端(Terminal)：查看个人资料、我的发布、我的收藏、修改密码、退出登录
- 发布/需求卡片支持收藏、评论、发起询价/接洽沟通

## 核心规则（必须严格遵守）
1. **严禁编造任何数据**：不要编造或猜测任何数字、统计、数据。包括但不限于：用户数量、交易量、GPU价格、报价、库存、营收、增长率、市场份额等。**当用户询问任何涉及具体数字/数据的问题时，一律回答"抱歉，我无法提供这类数据。如需了解具体货源和报价，请前往大厅浏览或直接联系发布方。"**
2. **只回答平台操作问题**：你只负责解答"怎么用"的问题（如何发布、如何询价、如何收藏等），不回答"有多少/是什么/多少钱"的事实性问题。涉及具体商务条款请引导用户通过大厅的「发起询价」功能联系发布方。
3. **回复简洁**：2-4句话，直接给答案，不寒暄、不延伸、不举例。
4. **不虚构功能**：只介绍上述列出的实际功能，不编造任何不存在的功能（如API、数据导出、自动匹配、用户排行榜等）。
5. **不知道就说不知道**：对于你无法确定的问题，直接说"抱歉，我无法回答这个问题。请前往大厅查看或联系平台技术支持。"不要猜测、推断或编造。
6. **使用中文**。

## 常见问题参考
- 如何发布货源：进入「发布」页面，选择「发布货源」，填写GPU规格信息后点击确认发布
- 如何询价：在大厅找到感兴趣的货源卡片，点击「发起询价」按钮，输入询盘信息即可与发布方建立对话
- 如何收藏：点击卡片上的心形图标即可收藏/取消收藏
- 如何修改密码：进入「终端」页面，点击「修改密码」
- 如何联系发布方：在大厅点击货源卡片的「发起询价」或需求卡片的「接洽沟通」`;

  if (operatorId && operatorId.startsWith("thread-")) {
    const cleanName = decodeURIComponent(operatorId.substring(7));
    return `你是「硅堆」平台客服，正在协助用户与【${cleanName}】进行商务接洽。规则：1.不要替任何一方做承诺、报价或编造数据。2.只协助推进沟通流程。3.对方未明确说明的信息一律说"请直接向对方确认"。`;
  }

  return baseRules;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { operatorId, message, history } = req.body;
      const apiKey = process.env.DEEPSEEK_API_KEY;

      if (!apiKey || apiKey === "MY_DEEPSEEK_API_KEY" || apiKey.trim() === "") {
        console.warn("DEEPSEEK_API_KEY is not set. Using fallback mock responses.");

        let text = "";
        if (operatorId && operatorId.startsWith("thread-")) {
          const cleanName = decodeURIComponent(operatorId.substring(7));
          text = `[系统提示: 未检测到API_KEY] \n\n【GUIDUI客服】: 已收到您与【${cleanName}】的商务接洽请求。平台建议双方在托管框架下签署正式合同并确认交割细节。如有平台使用问题，请随时咨询。`;
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
          model: CHAT_MODEL,
          messages,
          temperature: 0.3,
          top_p: 0.85,
          max_tokens: 512,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("DeepSeek Chat Error:", response.status, errBody);
        throw new Error(`QWEN API returned ${response.status}`);
      }

      const result = await response.json();
      const replyText = result.choices?.[0]?.message?.content || "【重发信号】: 系统通信错误，请重新输入。";

      res.json({ text: replyText });
    } catch (err: any) {
      console.error("Chat API Error:", err);
      res.status(500).json({
        error: "Failed to query AI API",
        message: err.message || String(err),
        fallbackText: "【信息中断】: 系统与核心算力基建发生连接中断。正在重试..."
      });
    }
  });

  // OCR endpoint — extract GPU spec fields from uploaded image via Gemini vision
  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageBase64, fileName } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "缺少图片数据" });
        return;
      }

      if (!apiKey || apiKey.trim() === "") {
        console.warn("GEMINI_API_KEY missing — returning mock OCR result");
        res.json({
          fields: {},
          mock: true,
          note: "API Key 未配置，无法进行AI识别。请在 .env.local 中设置 GEMINI_API_KEY。"
        });
        return;
      }

      const extractionPrompt = `仔细查看这张图片中的所有文字内容。图片可能是GPU服务器规格表截图、报价单、聊天记录或配置清单。

请从中提取GPU算力相关的规格信息，填入以下JSON字段。必须只返回一个合法JSON对象，不要包含任何其他文字或markdown格式。

字段：
- title: GPU集群/服务器名称
- gpu: GPU型号（如H800、B300、A100、H100、GH200等）
- cpu: CPU型号
- memory: 内存容量
- storage: 存储容量
- network: 网络架构（如InfiniBand、NVLink等）
- qty: 数量或规模
- moq: 起订量
- delivery: 交付期
- location: 地点/城市

只返回JSON，不要任何解释。示例：{"title":"NVIDIA H800","gpu":"H800","cpu":"","memory":"","storage":"","network":"","qty":"8台","moq":"","delivery":"现货","location":"深圳"}`;

      // Strip data URL prefix if present to get raw base64
      let rawBase64 = imageBase64;
      let mimeType = "image/png";
      if (imageBase64.startsWith("data:")) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          rawBase64 = match[2];
        }
      }

      const proxyUrl = `https://morning-haze-244c.415758624.workers.dev/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: rawBase64 } },
                { text: extractionPrompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("Gemini OCR Error:", response.status, errBody.slice(0, 300));
        res.status(502).json({ error: `Gemini API returned ${response.status}` });
        return;
      }

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let jsonStr = rawText.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }

      let fields: Record<string, string> = {};
      try {
        fields = JSON.parse(jsonStr);
      } catch {
        console.warn("Failed to parse OCR JSON, raw:", rawText);
        res.json({ fields: {}, raw: rawText, error: "JSON解析失败" });
        return;
      }

      res.json({ fields });
    } catch (err: any) {
      console.error("Gemini OCR Error:", err);
      res.status(500).json({ error: "OCR识别服务异常", message: err.message });
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
