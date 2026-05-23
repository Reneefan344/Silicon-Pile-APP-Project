import React, { useState, useMemo, useEffect, useRef } from "react";
import { useApp } from "../AppContext";
import { Posting } from "../types";
import { Search, SlidersHorizontal, MapPin, Zap, RefreshCw, Calendar, Tag, Info, Heart, Bookmark, AlertCircle, FileText, Download, MessageSquare, Send, Share2, Copy, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateQRCode } from "../utils/qrcode";

const CommentInputForm: React.FC<{ postId: string }> = ({ postId }) => {
  const { addComment } = useApp();
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addComment(postId, text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2 border-t border-[#323344]/30 pt-2.5 shrink-0">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="发表公开讨论或验证算力详情..."
        className="flex-1 bg-[#13141c] border border-[#323344] focus:border-[#00F0FF] text-xs text-[#e1e0f7] px-2.5 h-8 rounded-xs outline-none placeholder-[#8a8a9e]/30 font-sans"
        maxLength={200}
      />
      <button
        type="submit"
        className="bg-[#323344] hover:bg-[#00F0FF] text-[#8a8a9e] hover:text-black w-8 h-8 rounded-xs transition-colors cursor-pointer flex items-center justify-center"
        title="发表讨论"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};

export const LobbyView: React.FC = () => {
  const {
    postings,
    activeLobbySubTab,
    setActiveLobbySubTab,
    bookmarkedIds,
    toggleBookmark,
    submitInquiry,
    addLogMessage,
    deletePosting,
    session
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<Posting | null>(null);
  
  // Inquiry form in modal
  const [inquiryText, setInquiryText] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [isSuccessInquiry, setIsSuccessInquiry] = useState(false);

  // Share state
  const [sharePost, setSharePost] = useState<Posting | null>(null);
  const [shareQrDataUrl, setShareQrDataUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Filter listings based on subtab ('supply' = 货源, 'demand' = 需求) and search input
  const filteredPostings = useMemo(() => {
    return postings.filter((post) => {
      const matchType = post.type === activeLobbySubTab;
      const jsonStr = JSON.stringify(post).toLowerCase();
      const matchSearch = jsonStr.includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [postings, activeLobbySubTab, searchQuery]);

  // Open inquiry form handler
  const handleOpenDetail = (post: Posting) => {
    setSelectedPost(post);
    setInquiryText("");
    setIsSuccessInquiry(false);
  };

  const handleShare = async (post: Posting) => {
    setSharePost(post);
    setIsCopied(false);
    const shareUrl = `${window.location.origin}?posting=${post.id}`;
    try {
      const qrDataUrl = await generateQRCode(shareUrl, 200);
      setShareQrDataUrl(qrDataUrl);
    } catch {
      setShareQrDataUrl('');
    }
  };

  // Handle ?posting=xxx URL param — only once per mount
  const urlParamHandled = useRef(false);
  useEffect(() => {
    if (urlParamHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    const postingId = params.get('posting');
    if (postingId) {
      const target = postings.find(p => p.id === postingId);
      if (target) {
        handleOpenDetail(target);
        window.history.replaceState({}, '', '/');
        urlParamHandled.current = true;
      }
    }
  }, [postings]);

  const handleCopyLink = () => {
    if (!sharePost) return;
    const shareUrl = `${window.location.origin}?posting=${sharePost.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Submit inquiry handler
  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;

    setIsSubmittingInquiry(true);
    // Submit standard inquiry with custom placeholders suited to either supply or demand posts
    const msgNote = inquiryText.trim() || (selectedPost.type === "supply" 
      ? "收到！我对该批算力货源非常感兴趣，请问合同签署要点以及交割带宽限制是什么？期待即刻对接参数。" 
      : "收到！我们手头有充足的物理机位可立刻供给支持您的算力需求。请问托管细节与多签手续何时启动？");
      
    await submitInquiry(selectedPost, msgNote);

    setIsSubmittingInquiry(false);
    setIsSuccessInquiry(true);
  };

  const handleDownloadAttachment = (post: Posting) => {
    if (!post.attachmentName) return;

    let href = "";
    if (post.attachmentData) {
      href = post.attachmentData;
    } else {
      // Generate standard spec data for template/compiled posting items
      const mockContent = `================================================================================
亚太智算交易结算中心 - 资产附带规格说明书 (TECHNICAL SPECIFICATION)
GENERATED ON THE APEX COMPUTE LEDGER // BLOCKHEIGHT 784,912
================================================================================

[ASSET DETAILS // 资产基本条目]
Asset Item ID: ${post.id}
Asset Title  : ${post.title}
Architecture : ${post.architecture}
Supplier Ref : ${post.authorName || "系统自营"}
Publish Date : ${new Date(post.timestamp).toLocaleString("zh-CN")}

[HARDWARE QUANTITY & GEOLOCATION // 硬件体量与机房交割]
Deploy Qty   : ${post.qty}
Data Center  : ${post.location}
Status Tag   : ${post.status}

[TECHNICAL MATRIX // 技术规格规格]
- CPU Processor      : ${post.cpu || "Intel Xeon Platinum 8468 / AMD Epyc Gen 4"}
- RAM Memory Size    : ${post.memory || "2-4TB REG DDR5 ECC"}
- VRAM Core Spec     : ${post.vram || "192GB HBM3e / 80GB HBM3"}
- NVMe Storage       : ${post.storage || "7.68TB NVMe Enterprise Class SSD"}
- High Speed Network : ${post.network || "NVLink 5.0 High Speed Interconnect"}
- Network Topology   : ${post.networkArchitecture || "Dual Port InfiniBand NDR 400G"}

[COMPLIANCE CHECKLIST // 合规审核条目]
- Standard Contract  : ${post.requiresContract ? "REQUIRED (配合国企/上市公司主体签约审核)" : "OPTIONAL (无强制签署合同要求)"}
- Escrow Protection  : ${post.supportsGuaranty ? "SUPPORTED (现货交易，全款即时清算)" : "NOT SUPPORTED (非现货交易)"}

================================================================================
[COMPUTATIONAL INTEGRITY & CERTIFICATION // 算力真机校验签章]
SHA-256 SIGNATURE: ${Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("")}
VERIFICATION METHOD: Multi-Party MPC Cryptographic Signature
STATUS: VERIFIED SECURE & READY FOR DEPLOYMENT
================================================================================`;

      const blob = new Blob([mockContent], { type: "text/plain;charset=utf-8" });
      href = URL.createObjectURL(blob);
    }

    const link = document.createElement("a");
    link.href = href;
    let downloadName = post.attachmentName;
    if (!post.attachmentData && !downloadName.endsWith(".txt") && !downloadName.endsWith(".pdf")) {
      downloadName = downloadName + "_specs.txt";
    }
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLogMessage({
      logName: "下载",
      category: "security",
      title: "附件已下载",
      description: downloadName,
      status: "success"
    });
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-[#e1e0f7] pb-10">
      
      {/* Search and filter toolbar */}
      <div className="relative w-full group mt-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <Search className="w-4 h-4 text-[#8a8a9e]" />
        </div>
        <input
          className="w-full bg-[#13141c] border border-[#323344] text-[#e1e0f7] font-mono text-sm py-3 pl-10 pr-12 rounded-xs focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/40 transition-all placeholder-[#8a8a9e]/40 rounded-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="检索算力资产, 节点配置..."
          type="text"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button className="p-1 px-2 text-[#00F0FF] hover:bg-[#323344]/30 rounded-xs flex items-center cursor-pointer transition-colors border border-transparent hover:border-[#00F0FF]/30">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Listing feeds */}
      <div className="flex flex-col gap-3.5 mt-1">
        {filteredPostings.length === 0 ? (
          <div className="border border-[#323344] bg-[#13141c]/50 p-10 text-center rounded-sm">
            <AlertCircle className="w-10 h-10 text-[#ff5500] mx-auto mb-3 opacity-60" />
            <p className="text-gray-400 text-sm tracking-wide">目前没有找到匹配的算力集群条款</p>
            <p className="text-xs text-gray-600 mt-1">尝试输入不同的关键词，或者前往发布选项创建新的需求条目</p>
          </div>
        ) : (
          filteredPostings.map((post) => {
            const isBookmarked = bookmarkedIds.includes(post.id);

            // Left code indicators
            // Status LED colors: 现货 = Cyan, 期货 = Orange, 在途 = Grey/Vane
            let ledBg = "bg-[#323344]";
            let ledColorClass = "text-gray-400";
            let ledShadowClass = "";
            let leftBorderClass = "border-[#323344]/40";

            if (post.status === "现货") {
              ledBg = "bg-[#00F0FF]";
              ledColorClass = "text-[#00F0FF]";
              ledShadowClass = "shadow-[0_0_8px_#00F0FF] cyan-pulse";
              leftBorderClass = "border-[#00F0FF]/50";
            } else if (post.status === "期货") {
              ledBg = "bg-[#ff5500]";
              ledColorClass = "text-[#ff5500]";
              ledShadowClass = "shadow-[0_0_8px_#ff5500]";
              leftBorderClass = "border-[#ff5500]/50";
            }

            return (
              <article
                key={post.id}
                className={`bg-[#0D0E12] border-l-[3px] ${leftBorderClass} border-r border-t border-b border-[#323344]/60 rounded-sm flex flex-col relative overflow-hidden group hover:border-[#00F0FF]/40 transition-all duration-300 shadow-lg`}
              >
                {/* Decorative circuit line on hover */}
                <div className="absolute top-0 right-0 w-24 h-[1px] bg-gradient-to-l from-[#00F0FF]/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                <div className="p-4 pl-4.5">
                  <div className="flex justify-between items-start mb-2.5">
                    <div>
                      <h2 className="font-sans text-lg font-bold text-white tracking-widest uppercase flex items-center gap-2">
                        {post.title}
                      </h2>
                      <p className="font-mono text-xs text-[#8a8a9e] mt-0.5">{post.architecture}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Bookmark icon */}
                      <button
                        onClick={() => toggleBookmark(post.id)}
                        className={`p-1.5 rounded-sm hover:bg-[#323344]/40 transition-colors cursor-pointer ${
                          isBookmarked ? "text-[#ff5500]" : "text-gray-500"
                        }`}
                        title={isBookmarked ? "取消收藏" : "加入我的收藏"}
                      >
                        <Heart className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
                      </button>

                      {/* Delete button — only for own postings */}
                      {session?.user?.id && post.userId === session.user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('确认下架该发布？')) {
                              deletePosting(post.id);
                            }
                          }}
                          className="p-1.5 rounded-sm hover:bg-[#323344]/40 transition-colors cursor-pointer text-gray-500 hover:text-red-400"
                          title="下架发布"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Status indicator */}
                      <div className="flex items-center gap-1.5 bg-[#13141c] px-2 py-1 border border-[#323344]/40 rounded-xs">
                        <span className={`w-1.5 h-1.5 rounded-xs ${ledBg} ${ledShadowClass}`} />
                        <span className={`font-mono text-[10px] font-bold ${ledColorClass} uppercase tracking-widest`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Publisher Information and Timestamp bar */}
                  <div className="flex items-center justify-between text-[11px] text-[#8a8a9e] bg-[#13141c]/40 px-3 py-1.5 rounded-xs border border-[#323344]/30 mb-3.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]/80 shrink-0" />
                      <span className="truncate">发布用户: <strong className="text-white font-medium">{post.authorName || "系统自营算力仓"}</strong></span>
                      {post.expiresAt && (() => {
                        const daysLeft = Math.ceil((new Date(post.expiresAt).getTime() - Date.now()) / 86400000);
                        if (daysLeft <= 7 && daysLeft > 0) {
                          return <span className="text-[#ffaa00] font-mono text-[9px] ml-1">({daysLeft}天后过期)</span>;
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Calendar className="w-3 h-3 text-[#ff5500]/70" />
                      <span>{new Date(post.timestamp).toLocaleString("zh-CN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>

                  {/* Terminal Data Grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 border-t border-[#323344]/40 pt-3.5 pb-1">
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">数量 (QTY)</span>
                      <span className="font-sans text-sm text-[#e1e0f7] font-semibold mt-0.5">{post.qty}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">地点 (LOCATION)</span>
                      <span className="font-sans text-sm text-white mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#ff5500]/80 inline" />
                        {post.location}
                      </span>
                    </div>

                    {post.vram && (
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">显存 (VRAM)</span>
                        <span className="font-sans text-sm text-[#e1e0f7] mt-0.5">{post.vram}</span>
                      </div>
                    )}
                    
                    {post.network && (
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">网络 (NETWORK)</span>
                        <span className="font-sans text-sm text-[#e1e0f7] mt-0.5 font-mono">{post.network}</span>
                      </div>
                    )}

                    {post.estArrival && (
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-[#ff5500] uppercase tracking-wider">预计到货 (EST. ARRIVAL)</span>
                        <span className="font-sans text-sm text-white font-semibold mt-0.5">{post.estArrival}</span>
                      </div>
                    )}

                    {post.moq && (
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">起订量 (MOQ)</span>
                        <span className="font-sans text-sm text-[#e1e0f7] mt-0.5 font-semibold">{post.moq}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-2.5 pt-2.5 border-t border-[#323344]/20">
                    <button
                      onClick={() => handleShare(post)}
                      className="font-mono text-xs text-[#8a8a9e] hover:text-[#00F0FF] px-3 py-2 border border-[#323344] hover:border-[#00F0FF]/40 transition-all rounded-xs tracking-widest cursor-pointer flex items-center gap-1.5"
                      title="分享到微信"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenDetail(post)}
                      className="font-mono text-xs text-white bg-[#323344] hover:bg-black/40 px-4 py-2 border border-transparent hover:border-[#00F0FF]/40 transition-all rounded-xs tracking-widest cursor-pointer text-center"
                    >
                      私聊
                    </button>
                  </div>

                  {/* Public Discussion Comments Module */}
                  <div className="mt-3.5 pt-3.5 border-t border-[#323344]/40 flex flex-col gap-2 bg-[#13141c]/20 p-3 rounded-xs">
                    <div className="font-mono text-[10px] text-[#00F0FF] uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#ff5500]" />
                      <span>评论区 // COMMENTS ({post.comments?.length || 0})</span>
                    </div>

                    {/* Comments dynamic listing */}
                    {post.comments && post.comments.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1 mt-1 scrollbar-thin">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-xs bg-[#13141c]/50 p-2.5 rounded-xs border border-[#323344]/20 flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-[#00F0FF] font-semibold">{comment.authorName}</span>
                              <span className="text-gray-500 font-mono text-[9px]">
                                {new Date(comment.timestamp).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-gray-300 font-sans leading-relaxed text-[11px] whitespace-pre-wrap">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-600 font-mono italic mt-1 pl-1">暂无公开评论，请留下您的专业意见或询盘条件...</span>
                    )}

                    {/* Interactive input box using the Isolated Sub-component */}
                    <CommentInputForm postId={post.id} />
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Dynamic details dialog and inquiry modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D0E12] border border-[#00F0FF] w-full max-w-lg p-5 flex flex-col relative overflow-hidden rounded-sm max-h-[90vh]"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00F0FF]" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00F0FF]" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00F0FF]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00F0FF]" />

              {/* Title Section */}
              <div className="flex justify-between items-start mb-4 border-b border-[#323344] pb-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#00F0FF] tracking-widest uppercase">
                      DETAILS PANEL // 详情
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                      selectedPost.type === 'supply' ? 'bg-[#00F0FF]/10 text-[#00F0FF]' : 'bg-[#ff5500]/10 text-[#ff5500]'
                    }`}>
                      {selectedPost.type === "supply" ? "算力货源" : "算力需求"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-wider mt-1">{selectedPost.title}</h3>
                  <p className="font-mono text-xs text-[#8a8a9e]">{selectedPost.architecture}</p>
                </div>
                <div className="flex items-center gap-1">
                  {session?.user?.id && selectedPost.userId === session.user.id && (
                    <button
                      onClick={() => {
                        if (window.confirm('确认下架该发布？')) {
                          deletePosting(selectedPost.id);
                          setSelectedPost(null);
                          window.history.replaceState({}, '', '/');
                        }
                      }}
                      className="text-[#8a8a9e] hover:text-red-400 font-mono p-1 cursor-pointer"
                      title="下架发布"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => { setSelectedPost(null); window.history.replaceState({}, '', '/'); }}
                    className="text-[#8a8a9e] hover:text-[#ff5500] font-mono text-lg p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content section */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                
                {/* Description */}
                <div className="bg-[#13141c] p-3 text-sm text-[#e1e0f7] border border-[#323344]/50 leading-relaxed rounded-xs">
                  {selectedPost.description}
                </div>

                {/* Transaction Matrix */}
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-[#00F0FF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 inline text-[#ff5500]" />
                    {selectedPost.type === "supply" ? "TRANSACTION TERMS // 货源交割要素" : "DEMAND REQUIREMENT // 需求交付要素"}
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 bg-[#13141c] p-3.5 border border-[#323344] font-mono text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#8a8a9e] text-[10px]">
                        {selectedPost.type === "supply" ? "物理交割地" : "期望托管地"}
                      </span>
                      <span className="text-white truncate font-sans flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#ff5500]/80 inline shrink-0" />
                        {selectedPost.location || "港深地区机房"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#8a8a9e] text-[10px]">
                        {selectedPost.type === "supply" ? "货源规模" : "拟定需求租量"}
                      </span>
                      <span className="text-white truncate font-sans font-semibold">
                        {selectedPost.qty || "待定"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-t border-[#323344]/40 pt-2 mt-1">
                      <span className="text-[#8a8a9e] text-[10px]">
                        {selectedPost.type === "supply" ? "供货期状态" : "期望算力交付期"}
                      </span>
                      <span className="text-[#00F0FF] truncate font-sans font-semibold">
                        {selectedPost.status || "现货部署"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-t border-[#323344]/40 pt-2 mt-1">
                      <span className="text-[#8a8a9e] text-[10px]">
                        {selectedPost.type === "supply" ? "起订门槛 (MOQ)" : "接受起订门槛"}
                      </span>
                      <span className="text-white truncate font-sans font-semibold">
                        {selectedPost.moq || "无限制"}
                      </span>
                    </div>
                    <div className="col-span-2 text-[#8a8a9e] border-t border-[#323344]/40 pt-2 mt-1 text-[10px] leading-relaxed font-sans">
                      发布用户: <strong className="text-white font-medium">{selectedPost.authorName || "系统自营仓库"}</strong> · 
                      发布时间: <span className="text-gray-400 font-mono text-[9px]">{new Date(selectedPost.timestamp).toLocaleString("zh-CN", { hour12: false })}</span>
                    </div>
                  </div>
                </div>

                {/* Extended Tech Parameter Specs */}
                <div className="flex flex-col">
                  <span className="font-mono text-xs text-[#00F0FF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 inline text-[#ff5500]" />
                    TECHNICAL MATRIX // 技术规格核查
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2 bg-[#13141c] p-3.5 border border-[#323344] font-mono text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#8a8a9e] text-[10px]">CPU 处理器</span>
                      <span className="text-white truncate font-sans">{selectedPost.cpu || "N/A"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#8a8a9e] text-[10px]">运行内存 RAM</span>
                      <span className="text-white truncate font-sans">{selectedPost.memory || "N/A"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-t border-[#323344]/40 pt-2 mt-1">
                      <span className="text-[#8a8a9e] text-[10px]">VRAM 显存规格</span>
                      <span className="text-white truncate font-sans">{selectedPost.vram || "N/A"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-t border-[#323344]/40 pt-2 mt-1">
                      <span className="text-[#8a8a9e] text-[10px]">高速存储 SSD</span>
                      <span className="text-white truncate font-sans">{selectedPost.storage || "N/A"}</span>
                    </div>
                    <p className="col-span-2 text-[#8a8a9e] border-t border-[#323344]/40 pt-2 mt-1 text-[10px] leading-relaxed font-sans">
                      通信总线: <span className="text-white font-mono">{selectedPost.network || "NVLink高速总线"}</span> <br />
                      网络架构: <span className="text-white font-mono">{selectedPost.networkArchitecture || "InfiniBand极低延迟拓扑"}</span>
                    </p>
                  </div>
                </div>

                {/* Compliance info */}
                <div className="bg-[#13141c] p-3 border border-[#323344]/80 flex flex-col gap-2 rounded-xs">
                  <div className="flex items-center gap-2 text-xs">
                    <Info className="w-4 h-4 text-[#00F0FF]" />
                    <span className="font-semibold text-white tracking-wider">合规性与资金保障：</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 pl-6 font-sans text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedPost.requiresContract ? 'bg-[#00F0FF]' : 'bg-gray-600'}`} />
                      <span className={selectedPost.requiresContract ? 'text-[#e1e0f7]' : 'text-[#8a8a9e]'}>
                        {selectedPost.requiresContract ? "配合国企/上市公司主体签约审核" : "无需配合签约审核"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedPost.supportsGuaranty ? 'bg-[#00F0FF]' : 'bg-gray-600'}`} />
                      <span className={selectedPost.supportsGuaranty ? 'text-[#e1e0f7]' : 'text-[#8a8a9e]'}>
                        {selectedPost.supportsGuaranty ? "现货交易，全款即时清算" : "非现货交易"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedPost.payToInspect ? 'bg-[#00F0FF]' : 'bg-gray-600'}`} />
                      <span className={selectedPost.payToInspect ? 'text-[#e1e0f7]' : 'text-[#8a8a9e]'}>
                        {selectedPost.payToInspect ? "支持款项托管，付款看货" : "不支持款项托管"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${selectedPost.requiresDeposit ? 'bg-[#00F0FF]' : 'bg-gray-600'}`} />
                      <span className={selectedPost.requiresDeposit ? 'text-[#e1e0f7]' : 'text-[#8a8a9e]'}>
                        {selectedPost.requiresDeposit ? "算力排期锁定，须先行缴纳定金" : "无需缴纳定金"}
                      </span>
                    </div>
                    {selectedPost.attachmentName && selectedPost.attachmentVisibility !== 'chat_only' && (
                      <div className="flex items-center justify-between gap-3 bg-[#13141c]/80 border border-[#323344] p-2.5 rounded-sm mt-1.5 w-full">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-[#ff5500] shrink-0" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-[#00F0FF] text-[11px] font-mono font-semibold truncate max-w-[220px]" title={selectedPost.attachmentName}>
                              {selectedPost.attachmentName}
                            </span>
                            <span className="text-gray-500 text-[9px] font-mono">
                              {selectedPost.attachmentData ? "用户上传附件 (自存介质)" : "18.6 MB · 算力真机校验包"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(selectedPost)}
                          className="flex items-center gap-1 bg-[#323344] hover:bg-[#00F0FF]/15 text-[#00F0FF] hover:text-white px-2.5 py-1 rounded-xs border border-[#00F0FF]/30 hover:border-[#00F0FF] text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer h-7 shrink-0"
                          title="安全下载规格文件"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>下载</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit dialogue form */}
                {isSuccessInquiry ? (
                  <div className="bg-[#13141c] p-4 text-center border border-[#00F0FF] rounded-xs">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-[#00F0FF] font-bold tracking-widest text-sm flex flex-col gap-2"
                    >
                      <span>私聊发送成功</span>
                      <span className="text-gray-400 font-normal font-sans text-xs">请等待对方回复</span>
                    </motion.div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="flex flex-col gap-2 border-t border-[#323344] pt-3 shrink-0">
                    <label className="font-mono text-xs text-[#8a8a9e]">私聊</label>
                    <textarea
                      value={inquiryText}
                      onChange={(e) => setInquiryText(e.target.value)}
                      className="w-full bg-[#13141c] border border-[#323344] focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/50 min-h-[66px] p-2.5 font-sans text-xs text-[#e1e0f7] rounded-sm focus:outline-none placeholder-[#8a8a9e]/40"
                      placeholder="输入您的消息..."
                    />

                    <button
                      type="submit"
                      disabled={isSubmittingInquiry}
                      className="w-full h-10 flex items-center justify-center bg-[#ff5500] hover:bg-[#aa3600] text-white font-bold font-mono tracking-widest text-xs transition-colors rounded-xs cursor-pointer"
                    >
                      {isSubmittingInquiry ? "发送中..." : "发送私聊"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {sharePost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs" onClick={() => setSharePost(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0D0E12] border border-[#00F0FF] w-full max-w-sm p-5 flex flex-col items-center relative overflow-hidden rounded-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00F0FF]" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00F0FF]" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00F0FF]" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00F0FF]" />

              <div className="flex justify-between items-center w-full mb-4">
                <span className="font-mono text-sm text-[#00F0FF] tracking-widest uppercase">分享算力信息</span>
                <button onClick={() => setSharePost(null)} className="text-[#8a8a9e] hover:text-[#ff5500] font-mono text-lg cursor-pointer">✕</button>
              </div>

              <div className="text-sm text-white font-semibold mb-3 text-center">{sharePost.title}</div>

              {/* QR Code */}
              <div className="bg-white p-2 rounded-xs mb-3">
                {shareQrDataUrl ? (
                  <img src={shareQrDataUrl} alt="QR Code" className="w-[200px] h-[200px]" />
                ) : (
                  <div className="w-[200px] h-[200px] bg-[#13141c] flex items-center justify-center text-[#8a8a9e] text-xs font-mono">生成中...</div>
                )}
              </div>

              <p className="text-[10px] text-[#8a8a9e] font-mono mb-3 text-center">微信扫码查看发布详情</p>

              {/* Link copy row */}
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}?posting=${sharePost.id}`}
                  className="flex-1 h-9 px-3 bg-[#13141c] border border-[#323344] rounded-xs text-xs text-[#8a8a9e] font-mono outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`h-9 px-3 font-mono text-xs rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCopied
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]'
                      : 'bg-[#323344] text-white border border-transparent hover:border-[#00F0FF]/40'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? '已复制' : '复制'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
