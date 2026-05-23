import React, { useState, useRef } from "react";
import { useApp } from "../AppContext";
import { supabase } from "../supabaseClient";
import { Posting } from "../types";
import { ShieldAlert, BookOpen, ShieldCheck, Heart, Trash2, Key, Info, HelpCircle, ArrowRight, Server, Globe, Sparkles, Lock, LogOut, Headphones, MessageSquare, AlertCircle } from "lucide-react";
import "../animations.css";

export const TerminalView: React.FC = () => {
  const {
    postings,
    bookmarkedIds,
    toggleBookmark,
    userProfile,
    session,
    setUserProfile,
    addLogMessage,
    setRegistered,
    setWelcomeEntered,
    setActiveTab,
    setActiveChatThreadId,
    setActiveMessageSubTab
  } = useApp();

  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  // States for password modification
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuD1L8vQJJFzF8_yB5Zuqwa8Fsyo2WkYE0orm0BUm3fWQc1D-Q2IWxOZMqnV_p4JY5uwFmOzHfCsyqG5y67Osms8j021igUJuHzNyi6kfzmC4xV4oPD2vipeHcWmAp66q_4i6f39_YicIBV_rKTm2IQ_XnqezlS85dW9648AQSri5TFGFLJpn-ginsh33jXKGLR2Q1zqu6cOruwV6VAz0unSRSjaD-1xXb86CW0ZLxGbjWnrfN6e5z-GAbEVKOOSsRf3nvcc17h6QegR";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addLogMessage({ logName: "头像", category: "security", title: "上传失败", description: "请选择图片文件", status: "alert" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      addLogMessage({ logName: "头像", category: "security", title: "上传失败", description: "图片超过2MB", status: "alert" });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const base64 = await compressImage(file);
      const updatedProfile = { ...userProfile!, avatar: base64 };
      await setUserProfile(updatedProfile);
      addLogMessage({ logName: "头像", category: "security", title: "头像已更新", description: "", status: "success" });
    } catch (err) {
      addLogMessage({ logName: "头像", category: "security", title: "上传失败", description: "处理异常", status: "alert" });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 256;
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) { height *= maxSize / width; width = maxSize; }
          } else {
            if (height > maxSize) { width *= maxSize / height; height = maxSize; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("Canvas context failed")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });
  };

  // Filter bookmarked postings
  const bookmarkedPostings = React.useMemo(() => {
    return postings.filter(p => bookmarkedIds.includes(p.id));
  }, [postings, bookmarkedIds]);

  // User-submitted postings (only those published by current user)
  const userPostings = React.useMemo(() => {
    if (!session?.user?.id) return [];
    return postings.filter(p => p.userId === session.user.id);
  }, [postings, session]);

  // Toggle active dialog helper
  const handleOpenDialog = (id: string | null) => {
    setActiveDialog(id);
    // Reset password states upon opening/closing
    if (id === 'modify_password') {
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordError("");
      setPasswordSuccess("");
    }
  };

  const handleModifyPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword.trim()) {
      setPasswordError("新密码不能为空");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("新密码长度不能少于6位");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError("确认新密码与新密码不一致，请核对后重试");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess("密码修改成功。");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  };

  const { logout } = useApp();

  const handleLogout = () => {
    handleOpenDialog('logout_confirm');
  };

  const myTransmissionsCount = userPostings.length;
  const myBookmarksCount = bookmarkedIds.length;

  return (
    <div className="flex flex-col gap-6 font-sans text-[#e1e0f7] pb-24">
      
      {/* Profile Card */}
      <section className="bg-[#1d1e2e] border border-[#323344]/50 p-4.5 flex items-center gap-6 rounded-none relative overflow-hidden rounded-sm">
        {/* Technical decoration line */}
        <div className="absolute top-0 left-0 w-full h-[2.5px] bg-[#00dbe9] opacity-75 shadow-[0_0_8px_#00dbe9]" />
        
        {/* User avatar */}
        <div
          className="relative w-22 h-22 border border-[#00dbe9]/40 bg-[#0c0d1c] p-1 shrink-0 hex-clip flex items-center justify-center cursor-pointer group/avatar"
          onClick={handleAvatarClick}
          title="点击更换头像"
        >
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center hex-clip">
              <span className="text-[#00dbe9] text-[10px] font-mono animate-pulse">上传中</span>
            </div>
          )}
          <img
            alt="User Avatar"
            className="w-full h-full object-cover hex-clip opacity-80 group-hover/avatar:opacity-50 transition-opacity"
            src={userProfile?.avatar || DEFAULT_AVATAR}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity z-5">
            <span className="text-white font-mono text-[9px] tracking-wider bg-black/60 px-2 py-1 rounded-xs">更换</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFileChange}
        />

        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase font-sans">
            {userProfile?.nickname || "韩梅梅"}
          </h2>
          <div className="flex flex-col gap-1 border-t border-[#323344]/30 pt-1.5 mt-0.5">
            <span className="font-mono text-[10px] text-[#00dbe9] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#00dbe9] rounded-full animate-pulse shadow-[0_0_4px_#00dbe9]" />
              在线
            </span>
            <span className="font-mono text-[10px] text-[#8a8a9e] flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-gray-500" />
              {userProfile?.location || "深圳市"}
            </span>
          </div>
        </div>
      </section>

      {/* Grid Stats Counters */}
      <section className="grid grid-cols-2 gap-4">
        {/* Traasmissions tally */}
        <div
          onClick={() => handleOpenDialog('my_postings')}
          className="bg-[#1d1e2e] border border-[#323344]/50 p-4 flex flex-col gap-2 hover:bg-[#282939]/70 rounded-sm cursor-pointer transition-all active:bg-[#0c0d1c] group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[10px] text-[#8a8a9e] tracking-wider uppercase font-semibold">
              我的发布
            </span>
            <BookOpen className="w-4 h-4 text-[#8a8a9e]" />
          </div>
          <div className="text-3xl font-bold text-white group-hover:text-[#00dbe9] transition-colors font-sans">
            {myTransmissionsCount}
          </div>
          <div className="w-full h-[1px] bg-[#323344] mt-2 group-hover:bg-[#00dbe9]/50 transition-colors" />
        </div>

        {/* Bookmarks tally */}
        <div
          onClick={() => handleOpenDialog('my_bookmarks')}
          className="bg-[#1d1e2e] border border-[#323344]/50 p-4 flex flex-col gap-2 hover:bg-[#282939]/70 rounded-sm cursor-pointer transition-all active:bg-[#0c0d1c] group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-[10px] text-[#8a8a9e] tracking-wider uppercase font-semibold">
              我的收藏
            </span>
            <Heart className="w-4 h-4 text-[#8a8a9e]" />
          </div>
          <div className="text-3xl font-bold text-white group-hover:text-[#ff5500] transition-colors font-sans">
            {myBookmarksCount}
          </div>
          <div className="w-full h-[1px] bg-[#323344] mt-2 group-hover:bg-[#ff5500]/50 transition-colors" />
        </div>
      </section>

      {/* Slotted Settings menus */}
      <section className="bg-[#1d1e2e] border border-[#323344]/50 flex flex-col rounded-sm shadow-md">
        
        {/* Setting 1: Contact Customer Service */}
        <button
          onClick={() => handleOpenDialog('customer_service')}
          className="flex items-center justify-between w-full p-4 border-b border-[#323344]/40 hover:bg-[#282939]/60 transition-colors text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <Headphones className="w-4 h-4 text-[#8a8a9e] group-hover:text-[#00dbe9] transition-colors" />
            <span className="font-sans text-sm text-white group-hover:text-white font-medium uppercase tracking-wider">
              联系客服
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#00dbe9] transition-transform group-hover:translate-x-1" />
        </button>

        {/* Setting 3: Modify Password */}
        <button
          onClick={() => handleOpenDialog('modify_password')}
          className="flex items-center justify-between w-full p-4 border-b border-[#323344]/40 hover:bg-[#282939]/60 transition-colors text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <Lock className="w-4 h-4 text-[#8a8a9e] group-hover:text-[#00dbe9] transition-colors" />
            <span className="font-sans text-sm text-white group-hover:text-white font-medium uppercase tracking-wider">
              修改密码
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-[#00dbe9] transition-transform group-hover:translate-x-1" />
        </button>

        {/* Setting 4: Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-between w-full p-4 hover:bg-[#2e1c1c]/40 transition-colors text-left group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <LogOut className="w-4 h-4 text-[#ff5500] group-hover:text-red-400 transition-colors" />
            <span className="font-sans text-sm text-[#ff5500] group-hover:text-red-400 font-medium uppercase tracking-wider">
              退出登录
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-red-400 transition-transform group-hover:translate-x-1" />
        </button>
      </section>

      {/* Dialogue windows details overlay modals */}
      <div>
        {activeDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <div
              className="bg-[#111221] border border-[#00dbe9] w-full max-w-md p-5 flex flex-col relative rounded-sm max-h-[85vh] overflow-hidden animate-slide-up"
            >
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#00dbe9]" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#00dbe9]" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#00dbe9]" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#00dbe9]" />

              {/* Title strip */}
              <div className="flex justify-between items-center border-b border-[#323344] pb-3 shrink-0 mb-4">
                <span className="font-mono text-xs text-[#00dbe9] font-bold tracking-widest uppercase">
                  {activeDialog === 'credit' && "履约评分"}
                  {activeDialog === 'my_postings' && "我的发布清单"}
                  {activeDialog === 'my_bookmarks' && "收藏项目"}
                  {activeDialog === 'customer_service' && "专属智能算力客服"}
                  {activeDialog === 'modify_password' && "修改密码"}
                  {activeDialog === 'logout_confirm' && "安全登出"}
                </span>
                <button onClick={() => handleOpenDialog(null)} className="text-[#8a8a9e] hover:text-[#ff5500] font-mono text-base">
                  ✕
                </button>
              </div>

              {/* Scrollable interior details */}
              <div className="flex-1 overflow-y-auto font-sans text-xs flex flex-col gap-3 pr-1">
                
                {/* 1. Profile Credit Details */}
                {activeDialog === 'credit' && (
                  <div className="flex flex-col gap-3">
                    <div className="bg-[#1d1e2e] p-3 text-center border border-[#323344] rounded-xs">
                      <ShieldCheck className="w-12 h-12 text-[#00dbe9] mx-auto mb-2 shadow-[0_0_8px_rgba(0,240,255,0.4)]" />
                      <p className="text-sm font-bold text-white tracking-widest uppercase">韩梅梅 身份认证主体成功上链</p>
                      <p className="font-mono text-[9px] text-gray-500 mt-1">BLOCK HASH: 0x9B1E8CCD47321AA08E196FD</p>
                    </div>

                    <div className="flex flex-col gap-2 font-mono bg-[#0c0d1c] p-3 border border-[#323344]">
                      <div className="flex justify-between border-b border-[#323344]/30 pb-1.5 step">
                        <span className="text-[#8a8a9e]">标准算力合同多签通过率</span>
                        <span className="text-white font-bold">100.0%</span>
                      </div>
                      <div className="flex justify-between border-b border-[#323344]/30 pb-1.5 pt-1.5 step">
                        <span className="text-[#8a8a9e]">二级代管资品质押记录</span>
                        <span className="text-[#00dbe9] font-bold">优秀 (合格证已备)</span>
                      </div>
                      <div className="flex justify-between pt-1.5 step">
                        <span className="text-[#8a8a9e]">累计交割服务器集群规模</span>
                        <span className="text-white font-bold">1,864,000 FLOPs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. My postings registry */}
                {activeDialog === 'my_postings' && (
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-400 mb-2 leading-relaxed">您提交发布的实时GPU算力条款（共计 {userPostings.length} 条数据）：</p>
                    
                    {userPostings.map(post => (
                      <div key={post.id} className="bg-[#1d1e2e] p-3 border border-[#323344] rounded-xs flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white font-sans">{post.title}</span>
                          <span className={`text-[9px] font-mono px-1 py-0.5 rounded-xs ${
                            post.type === 'supply' ? 'bg-[#00dbe9]/10 text-[#00dbe9]' : 'bg-[#ff5500]/10 text-[#ff5500]'
                          }`}>
                            {post.type === 'supply' ? '货源广播分发' : '需求挂单分发'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px] leading-relaxed truncate font-sans">{post.description}</p>
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono border-t border-[#323344]/30 pt-1.5">
                          <span>交割地: {post.location}</span>
                          <span className="text-[#00dbe9]">{post.qty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. My bookmarks list dialog */}
                {activeDialog === 'my_bookmarks' && (
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-400 mb-2">您在硅堆大厅内关注收藏的精品算力板卡（共计 {bookmarkedPostings.length} 条数据）：</p>
                    
                    {bookmarkedPostings.length === 0 ? (
                      <div className="text-center p-6 text-gray-500 font-mono">
                        -- 目前收藏夹内为空 --
                      </div>
                    ) : (
                      bookmarkedPostings.map(post => (
                        <div key={post.id} className="bg-[#1d1e2e] p-3 border border-[#323344] rounded-xs flex justify-between items-center group">
                          <div>
                            <span className="font-bold text-white font-sans block">{post.title}</span>
                            <span className="font-mono text-[9px] text-[#8a8a9e] block mt-0.5">{post.architecture}</span>
                          </div>
                          <button
                            onClick={() => toggleBookmark(post.id)}
                            className="p-1 px-2 border border-transparent group-hover:border-[#ff5500]/30 hover:bg-[#ff5500]/10 text-[#ff5500] rounded-xs cursor-pointer text-xs flex items-center gap-1 transition-all"
                            title="取消收藏"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. Contact Customer Service */}
                {activeDialog === 'customer_service' && (
                  <div className="flex flex-col gap-3.5 font-sans pb-2 text-gray-300">
                    <div className="bg-[#ff5500]/10 border border-[#ff5500]/30 p-3 rounded-xs text-xs flex flex-col gap-1.5 leading-relaxed">
                      <p className="text-[#ff5500] font-bold font-sans flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        客服协助职能申明 (Support Notice)
                      </p>
                      <p className="text-gray-400 font-sans text-[11px]">
                        平台客服专属通道<span className="text-white font-semibold">仅协助有关此平台的使用帮助</span>、登录安全密钥重构及基本操作规则解答。如涉及<span className="text-[#00dbe9] font-semibold">具体的算力参数详情、起订与履约单价谈判、合同交割等消息内容</span>，请您通过大厅选择对应卡片并点击<span className="text-white">【发起询价】</span>或<span className="text-white">【接洽沟通】</span>，直接跨节点联系发布用户开启一对一商务谈判。
                      </p>
                    </div>

                    <p className="leading-relaxed text-[11px] text-gray-400">
                      若您在使用平台软件功能、查看大厅或重构密钥过程中遇到问题，可联系系统服务支持小组：
                    </p>

                    {/* Direct button to launch Kaelen Chat Thread */}
                    <div className="bg-[#1D1E2E] p-4.5 border border-[#323344]/80 rounded-xs flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-[#00dbe9]/40 bg-[#0c0d1c] rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            alt="GUIDUI客服 Avatar"
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNMDBJVKkftZmm9aoNQBapbCAyw3_tbNB-hFXij9G-zhC0BzC8AZmQoVrzsJWzQ4syqvkqF_kUqedKTFokVfMZjLvF3ID50wxkrAHVexu45JcKf8ObvIEPTnfW7UXRZjctf4NgmEOHwp3zkJ5zwG8qnoAwCIadS48ICn6Q4dWv0g1cvmImzKBU2yC-fNnJiZSAQOcMU5tN918WmetyYGt1LZNm5_d5u-gyjtJ4hyEaeR4wYzfC6FQ2swl_rDcmKVJgUUP7n7rUpUQl"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">GUIDUI客服</p>
                          <span className="text-[10px] text-[#00dbe9] border border-[#00dbe9]/30 bg-[#00dbe9]/5 px-1.5 py-0.5 rounded-full uppercase font-mono tracking-widest scale-90 inline-block mt-0.5">平台系统使用与解答</span>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenDialog(null);
                          setActiveMessageSubTab("chat");
                          setActiveChatThreadId("guidui");
                          setActiveTab("messages");
                        }}
                        className="w-full bg-[#00dbe9] hover:bg-[#00b0bd] text-black font-semibold text-xs py-2.5 px-4 rounded-xs font-mono tracking-widest transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase font-bold"
                      >
                        <MessageSquare className="w-4 h-4" />
                        拉起平台使用求助会话
                      </button>
                    </div>

                    <div className="bg-[#0c0d1c] border border-[#323344]/50 p-3.5 font-mono text-[11px] text-gray-500 flex flex-col gap-2 rounded-xs">
                      <p className="text-white text-xs font-bold font-sans">平台应急技术支援专线：</p>
                      <div className="flex justify-between items-center text-xs border-b border-[#323344]/40 pb-1.5 font-sans">
                        <span className="text-[#8a8a9e]">平台操作与软件异常解答</span>
                        <span className="text-[#00dbe9] font-bold">0755-7G9700-11</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-sans">
                        <span className="text-[#8a8a9e]">香港沙田网关访问绿色通道</span>
                        <span className="text-[#00dbe9] font-bold">00852-53SX-01</span>
                      </div>
                      <p className="text-[10px] text-gray-600 font-mono mt-1 pt-1 border-t border-[#323344]/30 leading-normal">
                        客服工作时间：全天候 7×24 小时高备灾系统运维控制中枢。
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. Modify Password Form */}
                {activeDialog === 'modify_password' && (
                  <form onSubmit={handleModifyPasswordSubmit} className="flex flex-col gap-3 font-sans pb-2">
                    <p className="text-gray-400 leading-relaxed mb-1">
                      请输入新密码（不少于6位）：
                    </p>

                    {/* New Password Slot */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">新密码</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-9 px-3 bg-[#0c0d1c] border border-[#323344] focus:border-[#00dbe9] transition-all rounded-xs focus:outline-none text-xs text-[#e1e0f7] placeholder-[#8a8a9e]/30"
                        placeholder="请输入至少6位的新密码"
                        required
                      />
                    </div>

                    {/* Confirm New Password Slot */}
                    <div className="flex flex-col gap-1">
                      <label className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">确认新密码</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full h-9 px-3 bg-[#0c0d1c] border border-[#323344] focus:border-[#00dbe9] transition-all rounded-xs focus:outline-none text-xs text-[#e1e0f7] placeholder-[#8a8a9e]/30"
                        placeholder="请再次输入新密码"
                        required
                      />
                    </div>

                    {/* Success/Error Feedbacks */}
                    {passwordError && (
                      <div className="p-2.5 bg-[#ff5500]/10 border border-[#ff5500]/30 rounded-xs text-[#ff5500] text-[11px] leading-snug">
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="p-2.5 bg-[#3efc00]/10 border border-[#3efc00]/30 rounded-xs text-[#3efc00] text-[11px] leading-snug">
                        {passwordSuccess}
                      </div>
                    )}

                    {/* Confirm modification button */}
                    <button
                      type="submit"
                      className="w-full bg-[#0c0d12] hover:bg-[#00dbe9]/10 border border-[#00dbe9]/50 text-[#00dbe9] font-mono text-xs tracking-widest font-bold py-2.5 rounded-xs transition-all uppercase cursor-pointer flex items-center justify-center gap-1 mt-1.5"
                    >
                      确认修改
                    </button>
                  </form>
                )}

                {/* 7. Logout Confirmation Dialog */}
                {activeDialog === 'logout_confirm' && (
                  <div className="flex flex-col gap-4 font-sans text-center py-4">
                    <div className="w-14 h-14 bg-red-950/40 border border-[#ff5500]/50 rounded-full flex items-center justify-center mx-auto text-[#ff5500] shadow-[0_0_12px_rgba(255,85,0,0.2)]">
                      <LogOut className="w-6 h-6 animate-pulse" />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <h3 className="text-sm font-bold text-white tracking-widest uppercase">系统安全登出提示</h3>
                      <p className="text-gray-400 leading-relaxed text-xs">
                        确定要退出主控系统身份验证并安全断开与交易大厅的连接吗？
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => handleOpenDialog(null)}
                        className="py-2.5 px-4 rounded-xs border border-[#323344] bg-[#1d1e2e] text-[#8a8a9e] text-xs font-mono tracking-widest hover:text-white hover:bg-black/20 transition-all cursor-pointer"
                      >
                        暂不退出
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenDialog(null);
                          logout();
                        }}
                        className="py-2.5 px-4 rounded-xs border border-[#ff5500]/50 bg-red-950/20 text-[#ff5500] text-xs font-mono tracking-widest hover:bg-[#ff5500]/20 hover:text-white transition-all cursor-pointer font-bold"
                      >
                        安全脱壳
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
