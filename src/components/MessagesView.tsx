import React, { useState, useEffect, useRef, useMemo } from "react";
import { useApp } from "../AppContext";
import { SystemLog, ChatThread, ChatMessage } from "../types";
import { Terminal, Send, Server, Info, ShieldAlert, Cpu, Orbit, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const MessagesView: React.FC = () => {
  const {
    chats,
    systemLogs,
    activeMessageSubTab,
    setActiveMessageSubTab,
    activeChatThreadId,
    setActiveChatThreadId,
    sendChatMessage,
    isLoadingChat,
    clearUnreads,
    userProfile
  } = useApp();

  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = systemLogs;

  // Handle active active chat thread messages
  const activeThread = useMemo(() => {
    return chats.find(c => c.id === activeChatThreadId) || null;
  }, [chats, activeChatThreadId]);

  // Scroll to bottom of chat log
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThread?.messages, isLoadingChat]);

  // Click handler for threads
  const handleSelectThread = (threadId: string) => {
    setActiveChatThreadId(threadId);
    clearUnreads(threadId);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatThreadId) return;

    const text = chatInput;
    setChatInput("");
    await sendChatMessage(activeChatThreadId, text);
  };

  const handleSendPhone = async () => {
    if (!activeChatThreadId || !userProfile?.phone) return;
    await sendChatMessage(activeChatThreadId, `我的手机号：${userProfile.phone}`);
  };

  return (
    <div className="flex flex-col h-full font-sans text-[#e1e0f7]">
      
      {/* Sub-tabs toggler bar */}
      <div className="flex w-full bg-[#111221] border-b border-[#323344] shrink-0 relative z-30 mb-4 h-12">
        <button
          onClick={() => {
            setActiveMessageSubTab('system');
            setActiveChatThreadId(null);
          }}
          className={`flex-1 py-3 font-mono text-[11px] font-bold tracking-[0.15em] transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMessageSubTab === 'system'
              ? "text-[#00dbe9] border-b-2 border-[#00dbe9] bg-[#1d1e2e]/40 font-bold"
              : "text-[#8a8a9e] border-b-2 border-transparent hover:text-white"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          系统消息
        </button>
        <button
          onClick={() => {
            setActiveMessageSubTab('chat');
            // Select first operator by default if none active
            if (chats.length > 0 && !activeChatThreadId) {
              handleSelectThread(chats[0].id);
            }
          }}
          className={`flex-1 py-3 font-mono text-[11px] font-bold tracking-[0.15em] transition-all uppercase flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMessageSubTab === 'chat'
              ? "text-[#00dbe9] border-b-2 border-[#00dbe9] bg-[#1d1e2e]/40 font-bold"
              : "text-[#8a8a9e] border-b-2 border-transparent hover:text-white"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          通讯消息
        </button>
      </div>

      {/* Main logs canvas */}
      <div className="flex-1 min-h-0">
        
        {/* VIEW 1 // SYSTEM LOGS */}
        {activeMessageSubTab === 'system' && (
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            
            {/* List logs entries */}
            <div className="flex flex-col gap-2.5 bg-[#111221]" id="view-system">
              {filteredLogs.map((log) => {
                const isCrit = log.status === 'critical';
                
                return (
                  <div
                    key={log.id}
                    className="bg-[#1d1e2e] border border-[#323344]/50 p-4 flex flex-col gap-3 relative overflow-hidden rounded-xs"
                  >
                    {/* Header bar within log card */}
                    <div className="flex items-center justify-between border-b border-[#323344]/40 pb-2">
                      <span className="font-mono text-[10px] font-medium tracking-widest text-[#00dbe9]">
                        {log.timestamp}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      {/* Pulse indicators depending on log levels */}
                      {isCrit ? (
                        <div className="w-2 h-2 mt-1.5 shrink-0 bg-[#ff5500] rounded-xs shadow-[0_0_8px_#ff5500] animation-pulse" />
                      ) : (
                        <div className="w-2 h-2 mt-1.5 shrink-0 bg-[#00dbe9] rounded-xs shadow-[0_0_8px_#00dbe9]" />
                      )}

                      <div className="flex-1">
                        <div className={`font-mono text-xs font-bold tracking-widest mb-1 uppercase ${
                          isCrit ? 'text-[#ff5500]' : 'text-[#00dbe9]'
                        }`}>
                          {log.title}
                        </div>
                        <div className="font-sans text-xs text-gray-300 leading-relaxed font-normal">
                          {log.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2 // SECURE OPERATORS CHATS */}
        {activeMessageSubTab === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-220px)] bg-[#111221] overflow-hidden rounded-xs border border-[#323344]/40 relative">
            
            <AnimatePresence mode="wait">
              {activeThread ? (
                // Thread detailing chat log view
                <motion.div
                  key="thread-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full bg-[#111221]"
                >
                  {/* Active Operator header bar */}
                  <div className="bg-[#1d1e2e] border-b border-[#323344]/60 p-3 shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveChatThreadId(null)}
                        className="p-1 px-1.5 hover:bg-[#323344] rounded-xs text-[#8a8a9e] hover:text-white mr-1 flex items-center cursor-pointer transition-colors border border-transparent hover:border-[#8a8a9e]/20"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      
                      {/* Face hexagon avatar */}
                      <div className="relative shrink-0 w-9 h-9">
                        <div className="absolute inset-0 bg-[#00dbe9] hex-clip scale-105" />
                        <div className="absolute inset-[1px] bg-[#111221] hex-clip z-10 flex items-center justify-center overflow-hidden">
                          <img
                            alt={activeThread.name}
                            className="w-full h-full object-cover opacity-80 grayscale hover:grayscale-0 transition-all"
                            src={activeThread.avatar}
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white tracking-wider font-sans leading-none">
                          {activeThread.name}
                        </h4>
                        <span className="text-[10px] text-[#00dbe9] tracking-widest uppercase mt-1 inline-block font-mono">
                          {activeThread.statusText}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 py-1 px-2.5 bg-[#0c0d1c] border border-[#323344] text-[10px] font-mono text-[#00dbe9] uppercase tracking-wider">
                      <Orbit className="w-3.5 h-3.5 animate-spin mr-1.5 inline" />
                      SECURE CHAT LINKED
                    </div>
                  </div>

                  {/* Message scroll logs */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[radial-gradient(ellipse_at_bottom,rgba(29,30,46,0.3)_0%,transparent_80%)]">
                    {activeThread.messages.length === 0 ? (
                      <p className="text-center font-mono text-[11px] text-gray-500 mt-10">
                        -- 接驳成功，等待初始遥测参数发送。 --
                      </p>
                    ) : (
                      activeThread.messages.map((m) => {
                        const isUser = m.sender === 'user';
                        
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col max-w-[85%] ${
                              isUser ? "self-end items-end" : "self-start items-start"
                            }`}
                          >
                            <div className={`p-3 text-xs leading-relaxed ${
                              isUser
                                ? "bg-[#ff5500]/10 border border-[#ff5500]/50 text-[#ffdbcf] rounded-xs"
                                : "bg-[#1d1e2e] border border-[#323344] text-white rounded-xs"
                            } whitespace-pre-wrap`}>
                              {m.text}
                            </div>
                            <span className="font-mono text-[9px] text-[#8a8a9e] mt-1 tracking-widest uppercase">
                              {m.timestamp} // {isUser ? "USER" : "NODE"}
                            </span>
                          </div>
                        );
                      })
                    )}

                    {/* Chatbot typing loading delay loader */}
                    {isLoadingChat && (
                      <div className="self-start flex items-center gap-2 bg-[#1d1e2e]/50 border border-[#323344]/50 p-3 py-2 rounded-xs max-w-[85%]">
                        <RefreshCw className="w-3.5 h-3.5 text-[#00dbe9] animate-spin shrink-0" />
                        <span className="font-mono text-[10px] text-white/75 tracking-wider uppercase animate-pulse">
                          核心算力正组织遥测回复并编译...
                        </span>
                      </div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input dialog actions text entry */}
                  <form onSubmit={handleSendChat} className="bg-[#1d1e2e]/80 border-t border-[#323344] p-3 shrink-0 flex gap-2.5 items-center">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={isLoadingChat}
                      className="flex-1 bg-[#0c0d1c] border border-[#323344] focus:border-[#00dbe9] transition-all rounded-xs focus:ring-0 text-sm h-10 px-3.5 text-[#e1e0f7] focus:outline-none font-mono placeholder-[#8a8a9e]/30"
                      placeholder="发送控制或技术查询指令..."
                      type="text"
                    />
                    <button
                      type="button"
                      onClick={handleSendPhone}
                      disabled={isLoadingChat || !userProfile?.phone}
                      className="text-[10px] font-mono text-[#8a8a9e] hover:text-[#ff5500] border border-[#323344] hover:border-[#ff5500]/40 px-2 py-1 rounded-xs transition-colors cursor-pointer shrink-0"
                      title="发送我的手机号"
                    >
                      发送手机号
                    </button>
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isLoadingChat}
                      className="bg-[#00dbe9] hover:bg-[#00eefc] disabled:bg-[#323344] disabled:text-[#8a8a9e] text-[#111221] rounded-xs transition-colors cursor-pointer shrink-0 h-10 w-10 flex items-center justify-center"
                      title="发送"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              ) : (
                // Threads index selector view
                <motion.div
                  key="list-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full overflow-y-auto"
                >
                  {chats.map((thread) => {
                    const latestMsg = thread.messages.slice(-1)[0];
                    const stampText = latestMsg ? latestMsg.timestamp : "10分钟";
                    
                    return (
                      <div
                        key={thread.id}
                        onClick={() => handleSelectThread(thread.id)}
                        className="bg-[#1d1e2e] border-b border-[#323344]/50 p-4.5 flex items-center gap-4 hover:bg-[#282939]/60 cursor-pointer transition-all active:bg-[#0c0d1c] group relative"
                      >
                        {/* Selected overlay neon line on card */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-[#00dbe9] transition-all" />

                        {/* Hex-clipped profiling image */}
                        <div className="relative shrink-0 w-13 h-13">
                          <div className="absolute inset-0 bg-[#00dbe9] hex-clip scale-105 group-hover:bg-[#ff5500] transition-colors" />
                          <div className="absolute inset-[1.5px] bg-[#1d1e2e] hex-clip z-10 flex items-center justify-center overflow-hidden">
                            <img
                              alt={thread.name}
                              className="w-full h-full object-cover opacity-75 grayscale hover:grayscale-0 transition-all"
                              src={thread.avatar}
                            />
                          </div>
                        </div>

                        {/* Details parameters */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-sans text-sm font-bold text-white group-hover:text-[#00dbe9] transition-colors uppercase tracking-wider">
                              {thread.name}
                            </h3>
                            <span className="font-mono text-[10px] text-[#00dbe9] tracking-wider font-semibold">
                              {stampText}
                            </span>
                          </div>
                          
                          <p className="font-mono text-xs text-[#8a8a9e] truncate leading-normal">
                            {thread.lastMessage}
                          </p>
                        </div>

                        {/* Blinking unread notifications count badge */}
                        {thread.unreadCount > 0 && (
                          <div className="shrink-0 bg-[#ff5500] text-[#111221] font-mono text-[10px] font-bold h-5 px-1.5 flex items-center justify-center min-w-[20px] rounded-xs shadow-[0_0_8px_#ff5500] tracking-tighter shrink-0 select-none animate-pulse">
                            {thread.unreadCount}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};
