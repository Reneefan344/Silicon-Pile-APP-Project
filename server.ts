import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin123";
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

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

const AGENT_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>硅堆 - 人工客服工作台</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:monospace;background:#0c0d1c;color:#e1e0f7;padding:20px;min-height:100vh}
    h1{color:#00dbe9;font-size:20px;margin-bottom:8px;letter-spacing:2px}
    .subtitle{color:#8a8a9e;font-size:11px;margin-bottom:24px}
    .login-box{background:#1d1e2e;border:1px solid #323344;padding:20px;max-width:400px;margin:40px auto;border-radius:4px}
    .login-box input{width:100%;padding:10px 12px;background:#0c0d1c;border:1px solid #323344;color:#e1e0f7;font-family:monospace;font-size:13px;border-radius:2px;margin-bottom:12px;outline:none}
    .login-box input:focus{border-color:#00dbe9}
    .login-box button{width:100%;padding:10px;background:#00dbe9;color:#0c0d1c;border:none;font-family:monospace;font-size:13px;font-weight:bold;cursor:pointer;border-radius:2px}
    .login-box button:hover{background:#00eefc}
    .error{color:#ff5500;font-size:12px;margin-top:8px;display:none}
    .main{display:none;max-width:900px;margin:0 auto}
    .ticket{border:1px solid #323344;background:#1d1e2e;margin-bottom:12px;border-radius:4px;overflow:hidden}
    .ticket-header{padding:12px 16px;background:#13141c;display:flex;justify-content:space-between;align-items:center;cursor:pointer;border-bottom:1px solid #323344}
    .ticket-header:hover{background:#1a1b2a}
    .ticket-id{color:#00dbe9;font-size:11px;font-weight:bold}
    .ticket-status{font-size:10px;padding:2px 8px;border-radius:2px;font-weight:bold}
    .status-pending{background:#ff5500/20;color:#ff5500;border:1px solid #ff5500/40}
    .status-replied{background:#00dbe9/20;color:#00dbe9;border:1px solid #00dbe9/40}
    .status-closed{background:#8a8a9e/20;color:#8a8a9e}
    .ticket-body{display:none;padding:16px;max-height:400px;overflow-y:auto}
    .ticket-body.open{display:block}
    .msg{margin-bottom:10px;padding:8px 12px;border-radius:2px;font-size:12px;line-height:1.6;max-width:85%}
    .msg.user{align-self:flex-end;background:#ff5500/10;border:1px solid #ff5500/30;color:#ffdbcf;margin-left:auto}
    .msg.operator{align-self:flex-start;background:#13141c;border:1px solid #323344;color:#e1e0f7}
    .msg-label{font-size:10px;color:#8a8a9e;margin-bottom:4px}
    .reply-form{display:flex;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #323344}
    .reply-form textarea{flex:1;padding:8px 10px;background:#0c0d1c;border:1px solid #323344;color:#e1e0f7;font-family:monospace;font-size:12px;resize:vertical;min-height:60px;border-radius:2px;outline:none}
    .reply-form textarea:focus{border-color:#00dbe9}
    .reply-form button{padding:8px 16px;background:#ff5500;color:#fff;border:none;font-family:monospace;font-size:12px;font-weight:bold;cursor:pointer;border-radius:2px;white-space:nowrap}
    .reply-form button:hover{background:#ff6a20}
    .close-btn{padding:6px 12px;background:transparent;color:#8a8a9e;border:1px solid #323344;font-family:monospace;font-size:11px;cursor:pointer;border-radius:2px;margin-right:8px}
    .close-btn:hover{color:#fff;border-color:#8a8a9e}
    .empty-state{text-align:center;padding:40px;color:#8a8a9e;font-size:13px}
    .refresh{color:#00dbe9;font-size:11px;cursor:pointer;text-decoration:underline;margin-bottom:16px;display:inline-block}
    .timestamp{font-size:9px;color:#8a8a9e;margin-top:4px}
  </style>
</head>
<body>
  <div class="login-box" id="loginBox">
    <h1>硅堆 · 客服工作台</h1>
    <p class="subtitle">输入 ADMIN_TOKEN 以查看待处理工单</p>
    <form onsubmit="event.preventDefault();login()">
    <input id="tokenInput" type="password" placeholder="ADMIN_TOKEN">
    <button type="submit">登录</button>
    </form>
    <div class="error" id="loginError">错误 TOKEN</div>
  </div>

  <div class="main" id="mainPanel">
    <h1>硅堆 · 客服工作台</h1>
    <p class="subtitle">人工客服工单处理</p>
    <span class="refresh" onclick="loadEscalations()">刷新列表</span>
    <div id="ticketList"></div>
  </div>

  <script>
    let token = "";
    const ADMIN_TOKEN = "${ADMIN_TOKEN}";

    function login() {
      const inp = document.getElementById("tokenInput").value.trim();
      if (!inp) { document.getElementById("loginError").style.display = "block"; document.getElementById("loginError").textContent = "请输入密码"; return; }
      token = inp;
      if (token !== ADMIN_TOKEN) {
        document.getElementById("loginError").style.display = "block";
        document.getElementById("loginError").textContent = "TOKEN 无效，输入: " + token.length + " 字符";
        return;
      }
      document.getElementById("loginBox").style.display = "none";
      document.getElementById("mainPanel").style.display = "block";
      loadEscalations();
    }

    async function loadEscalations() {
      try {
        const res = await fetch("/api/agent/escalations?token=" + encodeURIComponent(token));
        if (res.status === 401) { alert("TOKEN过期，请刷新页面重新登录"); return; }
        const data = await res.json();
        renderTickets(data);
      } catch (e) {
        console.error(e);
      }
    }

    function renderTickets(escalations) {
      const el2 = document.getElementById("ticketList");
      if (!escalations || escalations.length === 0) {
        el2.innerHTML = '<div class="empty-state">暂无待处理工单</div>';
        return;
      }
      var html = '';
      for (var i = 0; i < escalations.length; i++) {
        var esc = escalations[i];
        var statusClass = esc.status === "pending" ? "status-pending" : esc.status === "replied" ? "status-replied" : "status-closed";
        var statusText = esc.status === "pending" ? "待处理" : esc.status === "replied" ? "已回复" : "已关闭";
        var msgs = esc.messages || [];
        var msgsHtml = '';
        for (var j = 0; j < msgs.length; j++) {
          var m = msgs[j];
          var cls = m.sender === "user" ? "user" : "operator";
          var label = m.sender === "user" ? "用户" : "客服/AI";
          var ts = m.created_at ? new Date(m.created_at).toLocaleString("zh-CN") : "";
          msgsHtml += '<div class="msg '+cls+'"><div class="msg-label">'+label+'</div>'+escHtml(m.text)+'<div class="timestamp">'+ts+'</div></div>';
        }
        var isOpen = esc.status === "pending" ? " open" : "";
        html += '<div class="ticket">';
        html += '<div class="ticket-header" onclick="toggleTicket(this)"><span class="ticket-id">#'+escHtml(esc.thread_id)+'</span><span class="ticket-status '+statusClass+'">'+statusText+'</span></div>';
        html += '<div class="ticket-body'+isOpen+'">';
        if (esc.context) html += '<div style="color:#8a8a9e;font-size:11px;margin-bottom:8px;padding:8px;background:#0c0d1c;border-radius:2px">'+escHtml(esc.context)+'</div>';
        html += '<div style="margin-bottom:8px">'+msgsHtml+'</div>';
        if (esc.status !== "closed") {
          html += '<div class="reply-form">';
          html += '<textarea id="reply-'+i+'" placeholder="输入回复..."></textarea>';
          html += '<button data-action="reply" data-escid="'+escHtml(esc.id)+'" data-threadid="'+escHtml(esc.thread_id)+'" data-userid="'+escHtml(esc.user_id||"")+'" data-idx="'+i+'">发送回复</button>';
          if (esc.status === "pending") html += '<button class="close-btn" data-action="close" data-escid="'+escHtml(esc.id)+'" data-threadid="'+escHtml(esc.thread_id)+'" data-userid="'+escHtml(esc.user_id||"")+'">关闭工单</button>';
          html += '</div>';
        } else {
          html += '<div style="color:#8a8a9e;font-size:11px;text-align:center;padding:8px">此工单已关闭</div>';
        }
        html += '</div></div>';
      }
      el2.innerHTML = html;
      // Event delegation
      el2.querySelectorAll("button[data-action]").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var action = this.getAttribute("data-action");
          var escId = this.getAttribute("data-escid");
          var threadId = this.getAttribute("data-threadid");
          var userId = this.getAttribute("data-userid");
          if (action === "reply") {
            var idx = this.getAttribute("data-idx");
            var textarea = document.getElementById("reply-" + idx);
            var replyText = textarea ? textarea.value.trim() : "";
            if (!replyText) return;
            sendReply(escId, threadId, userId, replyText).then(function() {
              if (textarea) textarea.value = "";
            });
          } else if (action === "close") {
            closeTicket(escId, threadId, userId);
          }
        });
      });
    }

    function escHtml(text) {
      return (text || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/'/g,"&#39;").replace(/\\n/g,"<br>");
    }

    function toggleTicket(header) {
      const body = header.nextElementSibling;
      body.classList.toggle("open");
    }

    async function sendReply(escId, threadId, userId, replyText) {
      try {
        var res = await fetch("/api/agent/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ escalationId: escId, threadId: threadId, userId: userId, replyText: replyText, token: token })
        });
        var data = await res.json();
        if (data.success) {
          loadEscalations();
        } else {
          alert("发送失败: " + (data.error || "未知错误"));
        }
      } catch (e) {
        alert("网络错误");
      }
    }

    async function closeTicket(escId, threadId, userId) {
      if (!confirm("确认关闭此工单？")) return;
      try {
        var res = await fetch("/api/agent/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
          body: JSON.stringify({ escalationId: escId, threadId: threadId, userId: userId, replyText: "[系统] 此工单已被客服关闭。", token: token, closeTicket: true })
        });
        var data = await res.json();
        if (data.success) {
          loadEscalations();
        } else {
          alert("关闭失败: " + (data.error || "未知错误"));
        }
      } catch (e) {
        alert("网络错误");
      }
    }
  </script>
</body>
</html>`;

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

  // OCR endpoint — extract GPU spec fields from uploaded image via ZhipuAI GLM-4V
  app.post("/api/ocr", async (req, res) => {
    try {
      const { imageBase64, fileName } = req.body;
      const apiKey = process.env.ZHIPU_API_KEY;

      if (!imageBase64 || typeof imageBase64 !== "string") {
        res.status(400).json({ error: "缺少图片数据" });
        return;
      }

      if (!apiKey || apiKey.trim() === "") {
        console.warn("ZHIPU_API_KEY missing — returning mock OCR result");
        res.json({
          fields: {},
          mock: true,
          note: "API Key 未配置，无法进行AI识别。请在 .env.local 中设置 ZHIPU_API_KEY。"
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

      const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4v",
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: imageBase64 } },
                { type: "text", text: extractionPrompt },
              ],
            },
          ],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("Zhipu OCR Error:", response.status, errBody.slice(0, 300));
        res.status(502).json({ error: `GLM-4V API returned ${response.status}` });
        return;
      }

      const result = await response.json();
      const rawText = result.choices?.[0]?.message?.content || "";

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
      console.error("Zhipu OCR Error:", err);
      res.status(500).json({ error: "OCR识别服务异常", message: err.message });
    }
  });

  // Escalate to human agent
  app.post("/api/escalate", async (req, res) => {
    try {
      const { threadId, originalThreadId, context, userId } = req.body;
      if (!threadId) {
        res.status(400).json({ error: "缺少 threadId" });
        return;
      }

      if (!supabaseAdmin) {
        res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY 未配置" });
        return;
      }

      const { error } = await supabaseAdmin.from("escalations").insert({
        thread_id: threadId,
        user_id: userId || null,
        original_thread_id: originalThreadId || null,
        context: context || "",
        status: "pending",
      });

      if (error) {
        console.error("escalate insert error:", error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("Escalate API Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Agent: list pending escalations
  app.get("/api/agent/escalations", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token;
      if (token !== ADMIN_TOKEN) {
        res.status(401).json({ error: "未授权：ADMIN_TOKEN 无效" });
        return;
      }

      if (!supabaseAdmin) {
        res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY 未配置" });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("escalations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      // Fetch thread messages for each escalation
      const result = await Promise.all(
        (data || []).map(async (esc: any) => {
          const { data: msgs } = await supabaseAdmin!
            .from("chat_messages")
            .select("*")
            .eq("thread_id", esc.thread_id)
            .order("created_at", { ascending: true });
          return { ...esc, messages: msgs || [] };
        })
      );

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Agent: reply to an escalation
  app.post("/api/agent/reply", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "") || req.body.token;
      if (token !== ADMIN_TOKEN) {
        res.status(401).json({ error: "未授权：ADMIN_TOKEN 无效" });
        return;
      }

      const { escalationId, threadId, userId, replyText, closeTicket } = req.body;
      if (!escalationId || !threadId || !userId || !replyText) {
        res.status(400).json({ error: "缺少必填字段" });
        return;
      }

      if (!supabaseAdmin) {
        res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY 未配置" });
        return;
      }

      // Insert reply as operator message
      const msgId = crypto.randomUUID();
      const { error: msgError } = await supabaseAdmin.from("chat_messages").insert({
        id: msgId,
        thread_id: threadId,
        user_id: userId,
        sender: "operator",
        text: replyText,
      });

      if (msgError) {
        res.status(500).json({ error: msgError.message });
        return;
      }

      // Update thread last_message
      await supabaseAdmin
        .from("chat_threads")
        .update({ last_message: replyText, unread_count: 0 })
        .eq("id", threadId)
        .eq("user_id", userId);

      // Update escalation status
      const newStatus = closeTicket ? "closed" : "replied";
      await supabaseAdmin
        .from("escalations")
        .update({ status: newStatus, agent_reply: replyText })
        .eq("id", escalationId);

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve agent workspace page
  app.get("/agent", (_req, res) => {
    res.send(AGENT_HTML);
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
