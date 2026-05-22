import React, { useState } from "react";
import { useApp } from "../AppContext";
import { Rocket, ArrowRight, Smartphone, Lock, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

export const WelcomeView: React.FC = () => {
  const { setWelcomeEntered, login, isAuthLoading } = useApp();

  const [showLogin, setShowLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!phone.trim() || !password.trim()) {
      setLoginError("请输入手机号和密码");
      return;
    }

    setIsLoggingIn(true);
    const result = await login(phone.trim(), password);
    setIsLoggingIn(false);

    if (result.error) {
      setLoginError(result.error);
    }
  };

  if (showLogin) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-4 bg-[#0D0E12] text-[#e5e7eb] font-sans relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,14,18,0)_95%,rgba(0,240,255,0.03)_95%)] bg-[size:100%_20px] pointer-events-none" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#00F0FF] opacity-[0.03] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-45 -right-45 w-96 h-96 rounded-full bg-[#ff5500] opacity-[0.03] blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm bg-[#0D0E12] border border-[#323344] p-6 rounded-xs relative z-10 shadow-2xl">
          <div className="flex justify-between items-center border-b border-[#323344] pb-4 mb-5">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#ff5500] font-bold tracking-[0.2em] uppercase">
                SECURE LOGIN PROTOCOL
              </span>
              <h1 className="text-xl font-bold text-white tracking-widest uppercase mt-0.5 font-sans">
                登录硅堆
              </h1>
            </div>
            <div className="w-2.5 h-2.5 bg-[#00F0FF] rounded-sm shadow-[0_0_8px_#00F0FF] animate-pulse" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#ff5500]" />
                注册手机号
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入注册时的手机号"
                className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2.5 px-3 text-sm text-white outline-none font-mono placeholder-gray-600 transition-colors"
                maxLength={11}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#ff5500]" />
                登录密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入登录密码"
                className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2.5 px-3 text-sm text-white outline-none font-mono placeholder-gray-600 transition-colors"
                required
              />
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-[#ff5500]/10 border border-[#ff5500]/30 rounded-xs text-[#ff5500] text-xs flex gap-2 items-center"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || isAuthLoading}
              className="w-full group relative flex items-center justify-center border border-[#ff5500]/60 bg-[#0c0d12] hover:bg-[#ff5500]/15 disabled:bg-transparent text-[#ff5500] font-bold py-3.5 px-6 transition-all duration-300 cursor-pointer overflow-hidden rounded-xs mt-2 h-12"
            >
              <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#ff5500]" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#ff5500]" />
              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#ff5500]" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#ff5500]" />
              <span className="tracking-[0.25em] mr-2 text-sm group-hover:text-white transition-colors">
                {isLoggingIn ? "验证身份中..." : "登录系统"}
              </span>
              <ArrowRight className="w-4 h-4 text-[#ff5500] group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>

            <button
              type="button"
              onClick={() => { setShowLogin(false); setLoginError(""); }}
              className="text-center text-xs text-[#8a8a9e] hover:text-white transition-colors mt-2 cursor-pointer"
            >
              返回欢迎页
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0D0E12] relative font-sans text-[#e5e7eb]">
      <section className="h-[55%] w-full relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0E12] z-10" />
        <img
          alt="Minimalist industrial server rack icon"
          className="absolute w-full h-full object-cover object-center opacity-85"
          referrerPolicy="no-referrer"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcH-8B9c_DYpCns57d2sOEX-SCu4lNIoMMw4fpM4TunIRFq7ETm1Gad1dYcEtdJo00gzYVC-Wvob-PPHd_h7Vi-hzzmcFdGibL2lgIOiKL_VeR7KTiAklp1op8Pkc0OWxTmRwe9SkdeOJxMhuS1eMp3xVqY0uHuTIfPmzyi06mQG7Kp6ZZEsOYJazYTKLtFpTsBUabU1oRdevrD9y6qnwsAyReTJNGWAbxTbBCzwBaxMHDlauRHnKT__AKbJ6hXZUjn_g_G02CdIxs"
        />
        <div className="absolute inset-0 bg-[#ffaa00] opacity-5 mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(13,14,18,0)_95%,rgba(0,240,255,0.05)_95%)] bg-[size:100%_24px] pointer-events-none" />
      </section>

      <section className="h-[45%] w-full bg-[#0D0E12] relative z-20 flex flex-col justify-between p-6 border-t-2 border-[#ff5500]/30 shadow-[0_-10px_35px_rgba(255,85,0,0.1)]">
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-[#ff5500]/40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-[#ff5500]/40" />

        <div className="flex flex-col items-center mt-6">
          <motion.h1
            animate={{ opacity: [0.7, 1, 0.7] }}
            className="text-4xl text-center font-bold text-[#ff5500] tracking-[0.25em] drop-shadow-[0_0_15px_rgba(255,85,0,0.6)] mb-4"
            transition={{ repeat: Infinity, duration: 4 }}
          >
            硅堆
          </motion.h1>

          <div className="w-full max-w-sm border border-[#ff5500]/20 bg-[#0d0d14]/80 p-4 text-center rounded-xs backdrop-blur-md">
            <h2 className="text-base font-semibold text-gray-200 tracking-wider">
              服务器算力大宗交易大厅
            </h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#ff5500]/30 to-transparent my-3" />
            <p className="text-xs text-gray-400 tracking-[0.15em] font-mono">
              货源、需求，高效对接
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto mb-6 flex flex-col gap-3">
          <button
            onClick={() => setWelcomeEntered(true)}
            className="w-full group relative flex items-center justify-center border border-[#ff5500]/60 bg-[#0c0d12] hover:bg-[#ff5500]/10 text-[#ff5500] font-medium py-3.5 px-6 transition-all duration-300 cursor-pointer overflow-hidden rounded-xs"
          >
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#ff5500]" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#ff5500]" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#ff5500]" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#ff5500]" />
            <span className="tracking-[0.3em] font-bold mr-2 group-hover:text-white transition-colors text-sm">
              进入系统
            </span>
            <ArrowRight className="w-4 h-4 text-[#ff5500] opacity-80 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
          </button>

          <button
            onClick={() => setShowLogin(true)}
            className="text-center text-xs text-[#8a8a9e] hover:text-white transition-colors cursor-pointer py-2"
          >
            已有账号？登录
          </button>
        </div>
      </section>
    </div>
  );
};
