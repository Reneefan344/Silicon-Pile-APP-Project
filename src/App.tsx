/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from "react";
import { AppProvider, useApp } from "./AppContext";
import { WelcomeView } from "./components/WelcomeView";
import { RegisterView } from "./components/RegisterView";
import { ToastContainer } from "./components/ToastContainer";
import { Layers, PlusSquare, Terminal, User, Grid2X2, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LobbyView = React.lazy(() => import("./components/LobbyView").then(m => ({ default: m.LobbyView })));
const PublishView = React.lazy(() => import("./components/PublishView").then(m => ({ default: m.PublishView })));
const MessagesView = React.lazy(() => import("./components/MessagesView").then(m => ({ default: m.MessagesView })));
const TerminalView = React.lazy(() => import("./components/TerminalView").then(m => ({ default: m.TerminalView })));
const DashboardView = React.lazy(() => import("./components/DashboardView").then(m => ({ default: m.DashboardView })));

const PageFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-2 h-2 bg-[#ff5500] rounded-sm shadow-[0_0_12px_#ff5500] animate-pulse" />
  </div>
);

function AppContent() {
  const {
    activeTab,
    setActiveTab,
    welcomeEntered,
    registered,
    activeLobbySubTab,
    setActiveLobbySubTab,
    chats,
    isAuthLoading
  } = useApp();

  // Show loading while checking auth session
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0D0E12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-3 h-3 bg-[#ff5500] rounded-sm shadow-[0_0_12px_#ff5500] animate-pulse" />
          <span className="font-mono text-xs text-[#8a8a9e] tracking-widest uppercase">正在初始化安全链路...</span>
        </div>
      </div>
    );
  }

  // If we haven't entered the system yet, render the landing page.
  if (!welcomeEntered) {
    return <WelcomeView />;
  }

  // If we entered but haven't registered yet, render the user registration page.
  if (!registered) {
    return <RegisterView />;
  }

  // Calculate unread threads totals
  const totalUnread = chats.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="min-h-screen bg-[#0D0E12] text-[#e1e0f7] pb-24 font-sans select-none selection:bg-[#ff5500]/30 selection:text-[#ffdbcf] antialiased">
      
      {/* Top persistent cyberpunk Header */}
      <header className="bg-[#0D0E12]/90 backdrop-blur-md border-b-[0.5px] border-[#323344] fixed top-0 w-full z-40">
        <div className="flex justify-between items-center w-full px-5 h-16 max-w-2xl mx-auto">
          <div 
            onClick={() => {
              // Clicking Title resets welcome entered if they want
              if (window.confirm("是否重置终端接驳、清除注册状态并退回到欢迎页？")) {
                localStorage.removeItem("sp_welcome_entered");
                localStorage.removeItem("sp_registered");
                localStorage.removeItem("sp_user_profile");
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 cursor-pointer select-none group"
            title="回到系统欢迎页"
          >
            {/* Logo Icon Layer Container */}
            <div className="relative flex items-center justify-center w-7 h-7 rounded bg-[#ff5500]/10 border border-[#ff5500]/30 group-hover:border-[#00dbe9]/50 group-hover:bg-[#00dbe9]/10 transition-all duration-300">
              <div className="absolute -top-[1.5px] -left-[1.5px] w-1 h-1 bg-[#ff5500] group-hover:bg-[#00dbe9] transition-colors" />
              <div className="absolute -bottom-[1.5px] -right-[1.5px] w-1 h-1 bg-[#ff5500] group-hover:bg-[#00dbe9] transition-colors" />
              <Layers className="w-3.5 h-3.5 text-[#ff5500] group-hover:text-[#00dbe9] transition-colors" />
            </div>
            
            <span className="font-sans text-lg font-black tracking-widest text-white flex items-center gap-1.5">
              硅堆
              <span className="text-[#ff5500] group-hover:text-[#00dbe9] transition-all font-mono text-sm tracking-normal opacity-85">
                //
              </span>
            </span>
          </div>
          
          <button className="text-[#8a8a9e] hover:bg-[#323344]/40 hover:text-[#00F0FF] transition-all p-2 rounded-xs border border-transparent hover:border-[#00F0FF]/25 flex items-center justify-center cursor-pointer">
            <Grid2X2 className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic header sub-tabs: Displays ONLY when Tab is Lobby */}
        {activeTab === 'lobby' && (
          <div className="flex w-full items-end border-t-[0.5px] border-[#323344] bg-[#0c0d1c]/80 select-none">
            <div className="flex w-full max-w-2xl mx-auto h-12">
              <button
                onClick={() => setActiveLobbySubTab('supply')}
                className="relative flex-1 pb-3 text-center group cursor-pointer h-full flex items-end justify-center"
              >
                <span className={`font-sans text-sm tracking-widest uppercase transition-all duration-300 ${
                  activeLobbySubTab === 'supply'
                    ? "text-[#ff5500] font-bold drop-shadow-[0_0_8px_rgba(255,85,0,0.5)]"
                    : "text-[#8a8a9e] group-hover:text-white"
                }`}>
                  货源
                </span>
                {activeLobbySubTab === 'supply' && (
                  <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
                )}
              </button>
              
              <button
                onClick={() => setActiveLobbySubTab('demand')}
                className="relative flex-1 pb-3 text-center group cursor-pointer h-full flex items-end justify-center"
              >
                <span className={`font-sans text-sm tracking-widest uppercase transition-all duration-300 ${
                  activeLobbySubTab === 'demand'
                    ? "text-[#ff5500] font-bold drop-shadow-[0_0_8px_rgba(255,85,0,0.5)]"
                    : "text-[#8a8a9e] group-hover:text-white"
                }`}>
                  需求
                </span>
                {activeLobbySubTab === 'demand' && (
                  <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main viewport area, with fluid container layout */}
      <main className={`pt-20 px-4 max-w-2xl mx-auto w-full flex flex-col ${activeTab === 'lobby' ? 'pt-32' : 'pt-20'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex-1"
          >
            <Suspense fallback={<PageFallback />}>
              {activeTab === 'lobby' && <LobbyView />}
              {activeTab === 'publish' && <PublishView />}
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'messages' && <MessagesView />}
              {activeTab === 'terminal' && <TerminalView />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky footer tab persistent bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 bg-[#0D0E12] border-t border-[#323344] select-none h-16 shrink-0 shadow-2xl">
        <div className="flex justify-around items-center h-full max-w-2xl mx-auto px-1">

          {/* Tab 1: Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full border-t-2 cursor-pointer transition-all ${
              activeTab === 'dashboard'
                ? "border-[#00F0FF] text-[#00F0FF] scale-100 font-bold"
                : "border-transparent text-[#8a8a9e] hover:bg-[#323344]/30"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-sans text-[10px] mt-1 tracking-wider uppercase">看板</span>
          </button>

          {/* Tab 2: Lobby */}
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex flex-col items-center justify-center flex-1 h-full border-t-2 cursor-pointer transition-all ${
              activeTab === 'lobby'
                ? "border-[#00F0FF] text-[#00F0FF] scale-100 font-bold"
                : "border-transparent text-[#8a8a9e] hover:bg-[#323344]/30"
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="font-sans text-[10px] mt-1 tracking-wider uppercase">大厅</span>
          </button>

          {/* Tab 3: Publish */}
          <button
            onClick={() => setActiveTab('publish')}
            className={`flex flex-col items-center justify-center flex-1 h-full border-t-2 cursor-pointer transition-all ${
              activeTab === 'publish'
                ? "border-[#00F0FF] text-[#00F0FF] scale-100 font-bold bg-[#323344]/20"
                : "border-transparent text-[#8a8a9e] hover:bg-[#323344]/30"
            }`}
          >
            <PlusSquare className="w-5 h-5" />
            <span className="font-sans text-[10px] mt-1 tracking-wider uppercase">发布</span>
          </button>

          {/* Tab 4: Messages */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center justify-center flex-1 h-full border-t-2 cursor-pointer transition-all relative ${
              activeTab === 'messages'
                ? "border-[#00F0FF] text-[#00F0FF] scale-100 font-bold"
                : "border-transparent text-[#8a8a9e] hover:bg-[#323344]/30"
            }`}
          >
            <Terminal className="w-5 h-5" />
            <span className="font-sans text-[10px] mt-1 tracking-wider uppercase">消息</span>

            {/* Blinking notification led */}
            {totalUnread > 0 && (
              <span className="absolute top-2.5 right-6 w-2 h-2 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500] animate-pulse" />
            )}
          </button>

          {/* Tab 5: Terminal profile */}
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex flex-col items-center justify-center flex-1 h-full border-t-2 cursor-pointer transition-all ${
              activeTab === 'terminal'
                ? "border-[#00F0FF] text-[#00F0FF] scale-100 font-bold"
                : "border-transparent text-[#8a8a9e] hover:bg-[#323344]/30"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-sans text-[10px] mt-1 tracking-wider uppercase">终端</span>
          </button>

        </div>
      </nav>

      <ToastContainer />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
