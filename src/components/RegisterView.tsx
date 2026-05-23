import React, { useState } from "react";
import { useApp } from "../AppContext";
import { User, Smartphone, Mail, MapPin, ArrowRight, Key, ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const RegisterView: React.FC = () => {
  const { register: supabaseRegister, setWelcomeEntered, setRegistered } = useApp();

  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [needEmailConfirm, setNeedEmailConfirm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    setNeedEmailConfirm(false);

    if (!nickname.trim()) {
      setErrorText("请填写角色昵称");
      return;
    }
    if (!phone.trim() || !/^1[3-9]\d{9}$/.test(phone)) {
      setErrorText("请输入合法的11位手机号码");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorText("请输入合法的联系人邮箱地址");
      return;
    }
    if (!password.trim()) {
      setErrorText("请设定登录密码");
      return;
    }
    if (password.length < 6) {
      setErrorText("安全协议要求：登录密码至少包含 6 个字符");
      return;
    }
    if (password !== confirmPassword) {
      setErrorText("确认密码不匹配，请重新输入");
      return;
    }
    if (!location.trim()) {
      setErrorText("请填写您的物理所在地 (如: 深圳市)");
      return;
    }

    setIsVerifying(true);

    const result = await supabaseRegister(
      email.trim(),
      password,
      nickname.trim(),
      phone.trim(),
      location.trim()
    );

    setIsVerifying(false);

    if (result.error) {
      setErrorText(result.error);
    } else if (result.needEmailConfirm) {
      setNeedEmailConfirm(true);
      setSuccessText("注册验证邮件已发送至您的邮箱，请查收并点击确认链接后返回登录。");
    } else {
      setSuccessText("终端核实注册成功，正在跳转接入云端...");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0D0E12] text-[#e5e7eb] font-sans relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[#ffaa00] opacity-2 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,14,18,0)_95%,rgba(0,240,255,0.03)_95%)] bg-[size:100%_20px] pointer-events-none" />

      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#00F0FF] opacity-[0.03] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-45 -right-45 w-96 h-96 rounded-full bg-[#ff5500] opacity-[0.03] blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0D0E12] border border-[#323344] p-6 rounded-xs relative z-10 shadow-2xl backdrop-blur-md">

        <div className="flex justify-between items-center border-b border-[#323344] pb-4 mb-5">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-[#ff5500] font-bold tracking-[0.2em] uppercase">
              SECURE DEPLOYMENT PROTOCOL
            </span>
            <h1 className="text-xl font-bold text-white tracking-widest uppercase mt-0.5 font-sans">
              建立主控身份
            </h1>
          </div>
          <div className="w-2.5 h-2.5 bg-[#ff5500] rounded-sm shadow-[0_0_8px_#ff5500] animate-pulse" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#ff5500]" />
              角色昵称
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="例如：韩梅梅 / 艾伦老板"
                className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2 px-3 text-sm text-white tracking-wider outline-none font-sans placeholder-gray-600 transition-colors"
                maxLength={20}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#ff5500]" />
              手机号码
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入11位中国手机号"
              className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2 px-3 text-sm text-white tracking-wider outline-none font-mono placeholder-gray-600 transition-colors"
              maxLength={11}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#ff5500]" />
              注册邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2 px-3 text-sm text-white tracking-wider outline-none font-mono placeholder-gray-600 transition-colors"
              maxLength={50}
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
              placeholder="请设定不少于6位的账户密码"
              className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2 px-3 text-sm text-white tracking-wider outline-none font-mono placeholder-gray-600 transition-colors"
              maxLength={32}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#ff5500]" />
              确认登录密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次确认您的登录密码"
              className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2 px-3 text-sm text-white tracking-wider outline-none font-mono placeholder-gray-600 transition-colors"
              maxLength={32}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#ff5500]" />
              所在地
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: 深圳市 / 广州市 / 上海市"
              className="w-full bg-[#0c0d1c] border border-[#323344] focus:border-[#ff5500] focus:ring-1 focus:ring-[#ff5500]/50 rounded-xs py-2 px-3 text-sm text-white tracking-wider outline-none font-sans placeholder-gray-600 transition-colors"
              maxLength={30}
              required
            />
          </div>

          <AnimatePresence>
            {errorText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-[#ff5500]/10 border border-[#ff5500]/30 rounded-xs text-[#ff5500] text-xs flex gap-2 items-center"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorText}</span>
              </motion.div>
            )}

            {successText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3"
              >
                <div className="p-3 bg-[#3efc00]/10 border border-[#3efc00]/30 rounded-xs text-[#3efc00] text-xs flex gap-2 items-center">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successText}</span>
                </div>
                {needEmailConfirm && (
                  <button
                    type="button"
                    onClick={() => {
                      setWelcomeEntered(false);
                      setRegistered(false);
                    }}
                    className="w-full text-center text-xs text-[#ff5500] hover:text-white border border-[#ff5500]/30 hover:bg-[#ff5500]/10 py-2 rounded-xs transition-colors cursor-pointer"
                  >
                    返回登录页面
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full group relative flex items-center justify-center border border-[#ff5500]/60 bg-[#0c0d12] hover:bg-[#ff5500]/15 disabled:bg-transparent text-[#ff5500] font-bold py-3.5 px-6 transition-all duration-300 cursor-pointer overflow-hidden rounded-xs mt-3 h-12"
          >
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#ff5500]" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#ff5500]" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#ff5500]" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#ff5500]" />

            <span className="tracking-[0.25em] mr-2 text-sm group-hover:text-white transition-colors">
              {isVerifying ? "正在注册接入云端..." : "验证并完成注册"}
            </span>

            <ArrowRight className="w-4 h-4 text-[#ff5500] group-hover:text-white group-hover:translate-x-1 transition-all" />
          </button>

        </form>
      </div>
    </div>
  );
};
