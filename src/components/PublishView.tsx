import React, { useState, useRef } from "react";
import { useApp } from "../AppContext";
import { Posting } from "../types";
import { FileText, MapPin, MemoryStick, UploadCloud, Rocket, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export const PublishView: React.FC = () => {
  const {
    activePublishSubTab,
    setActivePublishSubTab,
    addPosting,
    addLogMessage,
    setActiveTab,
    setActiveLobbySubTab
  } = useApp();

  // Form states
  const [title, setTitle] = useState("");
  const [qty, setQty] = useState("");
  const [moq, setMoq] = useState("");
  const [delivery, setDelivery] = useState("");
  const [location, setLocation] = useState("");

  const [gpu, setGpu] = useState("");
  const [cpu, setCpu] = useState("");
  const [memory, setMemory] = useState("");
  const [storage, setStorage] = useState("");
  const [networkArch, setNetworkArch] = useState("");

  const [isStateOwned, setIsStateOwned] = useState(false);
  const [isSpotCash, setIsSpotCash] = useState(false);
  const [isPayToInspect, setIsPayToInspect] = useState(false);
  const [requiresDeposit, setRequiresDeposit] = useState(false);

  // File Upload states
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation state
  const [errorText, setErrorText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setDroppedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDroppedFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!title.trim()) {
      setErrorText("基本信息错误: 标题(例: NVIDIA H800服务器集群)不能为空");
      return;
    }
    if (!qty.trim()) {
      setErrorText("基本信息错误: 数量(节点数/服务器台数)不能为空");
      return;
    }
    if (!moq.trim()) {
      setErrorText("基本信息错误: 起订量不能为空");
      return;
    }
    if (!delivery.trim()) {
      setErrorText("基本信息错误: 交付期(如'现货'或'2周内交付')不能为空");
      return;
    }
    if (!location.trim()) {
      setErrorText("基本信息错误: 交割/交付地不能为空");
      return;
    }

    setIsPublishing(true);

    const architectureString = gpu.trim() 
      ? `${gpu} GPU Architecture · Custom Node` 
      : "Custom Computing Core Node";

    const tagsList = [];
    if (activePublishSubTab === "supply") {
      tagsList.push(delivery.includes("现货") ? "优质现货" : "期货资产");
    } else {
      tagsList.push("接受租赁");
    }
    if (gpu) tagsList.push("全新测试");

    const proceedWithPublish = (attachmentData?: string) => {
      // Construct and submit mapping parameters
      setTimeout(() => {
        addPosting({
          title,
          architecture: architectureString,
          description: `该发布由用户自主提交。GPU型号: ${gpu || "N/A"}，CPU型号: ${cpu || "N/A"}，物理内存: ${memory || "N/A"}。支持全方位算力定制开发。交付期约: ${delivery}。`,
          type: activePublishSubTab,
          status: delivery.includes("现货") ? "现货" : "期货",
          qty: `${qty} 台`,
          location,
          vram: gpu ? "192GB HBM3e" : "N/A",
          network: networkArch ? "NVLink/IB" : "N/A",
          tags: tagsList,
          cpu,
          memory,
          storage,
          networkArchitecture: networkArch,
          requiresContract: isStateOwned,
          supportsGuaranty: isSpotCash,
          attachmentName: droppedFile ? droppedFile.name : undefined,
          attachmentData,
          moq: moq.trim().endsWith("台") || moq.trim().endsWith("台起订") ? moq.trim() : `${moq.trim()} 台起订`
        });

        // Insert message to system logs immediately for interactive telemetry trace
        addLogMessage({
          logName: "发布指令.007",
          category: "system",
          title: activePublishSubTab === "supply" ? "算力货源已挂载" : "算力采购需求已上链",
          description: `用户成功向大厅提交了 ${title} 规格发布，台数 ${qty} 台，位于 ${location} 机房。多签托管验证安全模块${droppedFile ? `，已挂载附件 ${droppedFile.name}` : ""}。`,
          status: "success"
        });

        setIsPublishing(false);
        setIsSuccess(true);

        // Redirect user back to lobby to study their added item
        setTimeout(() => {
          setIsSuccess(false);
          setActiveLobbySubTab(activePublishSubTab);
          setActiveTab("lobby");

          // Clear forms
          setTitle("");
          setQty("");
          setMoq("");
          setDelivery("");
          setLocation("");
          setGpu("");
          setCpu("");
          setMemory("");
          setStorage("");
          setNetworkArch("");
          setDroppedFile(null);
          setIsStateOwned(false);
          setIsSpotCash(false);
          setIsPayToInspect(false);
          setRequiresDeposit(false);
        }, 1000);
      }, 1200);
    };

    if (droppedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        let resultUrl = reader.result as string;
        // Limit storage size to prevent localStorage overflow
        if (droppedFile.size > 1500000) {
          resultUrl = "data:text/plain;base64," + btoa(`[File size limit (1.5MB) exceeded. Showing Metadata]\nFilename: ${droppedFile.name}\nSize: ${droppedFile.size} bytes\nType: ${droppedFile.type}`);
        }
        proceedWithPublish(resultUrl);
      };
      reader.onerror = () => {
        proceedWithPublish();
      };
      reader.readAsDataURL(droppedFile);
    } else {
      proceedWithPublish();
    }
  };

  return (
    <div className="flex flex-col gap-5 font-sans text-[#e1e0f7] pb-32 max-w-2xl mx-auto w-full">
      {/* Toggle Segment */}
      <div className="flex w-full h-11 bg-[#0D0E12] border border-[#ff5500]/40 p-[2px] rounded-sm shrink-0">
        <button
          onClick={() => setActivePublishSubTab("supply")}
          className={`flex-1 font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center transition-all cursor-pointer rounded-xs ${
            activePublishSubTab === "supply"
              ? "bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/30"
              : "text-[#8a8a9e] bg-transparent hover:text-white"
          }`}
        >
          发布货源
        </button>
        <button
          onClick={() => setActivePublishSubTab("demand")}
          className={`flex-1 font-mono text-xs font-bold tracking-widest uppercase flex items-center justify-center transition-all cursor-pointer rounded-xs ${
            activePublishSubTab === "demand"
              ? "bg-[#ff5500]/15 text-[#ff5500] border border-[#ff5500]/30"
              : "text-[#8a8a9e] bg-transparent hover:text-white"
          }`}
        >
          发布需求
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
        
        {/* Error notification banner */}
        {errorText && (
          <div className="bg-[#511500] border border-[#ff5500] p-3 text-xs flex items-center gap-2 text-[#ffdbcf] rounded-xs animate-bounce font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#ff5500]" />
            <span>{errorText}</span>
          </div>
        )}

        {/* 1. Basic Info */}
        <section className="bg-[#0D0E12] border border-t-2 border-[#ff5500]/30 border-r-[#323344] border-b-[#323344] border-l-[#323344] flex flex-col rounded-sm shadow-md">
          <div className="bg-[#13141c]/50 px-4 py-2 flex items-center justify-between border-b border-[#323344]/50">
            <span className="font-mono text-xs font-bold tracking-widest text-[#00F0FF] uppercase">
              01 // 基本信息
            </span>
            <FileText className="w-3.5 h-3.5 text-gray-500" />
          </div>
          
          <div className="p-4 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">标题</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-10 px-3 bg-[#13141c] border border-[#323344] focus:border-[#00F0FF] transition-all rounded-xs focus:outline-none text-sm text-[#e1e0f7] placeholder-[#8a8a9e]/30 placeholder:text-xs"
                placeholder={activePublishSubTab === 'supply' ? "例: NVIDIA H800 8卡服务器高端托管集群" : "例: 急租 NVIDIA B300 节点 - 深圳本地交付"}
                type="text"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">数量</label>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full h-10 px-3 bg-[#13141c] border border-[#323344] focus:border-[#00F0FF] transition-all rounded-xs focus:outline-none text-sm text-[#e1e0f7] placeholder-[#8a8a9e]/30 placeholder:text-xs font-mono"
                  placeholder="台数 / 节点数量"
                  type="number"
                  min="1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">起订量</label>
                <input
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  className="w-full h-10 px-3 bg-[#13141c] border border-[#323344] focus:border-[#00F0FF] transition-all rounded-xs focus:outline-none text-sm text-[#e1e0f7] placeholder-[#8a8a9e]/30 placeholder:text-xs"
                  placeholder="例: 1台 / 8台起订"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">交付期</label>
                <input
                  value={delivery}
                  onChange={(e) => setDelivery(e.target.value)}
                  className="w-full h-10 px-3 bg-[#13141c] border border-[#323344] focus:border-[#00F0FF] transition-all rounded-xs focus:outline-none text-sm text-[#e1e0f7] placeholder-[#8a8a9e]/30 placeholder:text-xs"
                  placeholder="例: 现货 / 预订4周内"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-[#8a8a9e] uppercase tracking-wider">交割/交付地</label>
                <div className="relative">
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-10 pl-3 pr-10 bg-[#13141c] border border-[#323344] focus:border-[#00F0FF] transition-all rounded-xs focus:outline-none text-sm text-[#e1e0f7] placeholder-[#8a8a9e]/30 placeholder:text-xs"
                    placeholder="填写交付城市或者指定的交付机房"
                    type="text"
                  />
                  <MapPin className="absolute right-3.5 top-3 w-4 h-4 text-[#ff5500]/70" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Technical Matrix */}
        <section className="bg-[#0D0E12] border border-t-2 border-[#ff5500]/30 border-r-[#323344] border-b-[#323344] border-l-[#323344] flex flex-col rounded-sm shadow-md">
          <div className="bg-[#13141c]/50 px-4 py-2 flex items-center justify-between border-b border-[#323344]/50">
            <span className="font-mono text-xs font-bold tracking-widest text-[#00F0FF] uppercase">
              02 // 硬件配置
            </span>
            <MemoryStick className="w-3.5 h-3.5 text-gray-500" />
          </div>
          
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#13141c] border border-[#323344] p-3 rounded-xs flex flex-col gap-1 group focus-within:border-[#00F0FF]">
              <label className="font-mono text-[9px] text-[#00F0FF] uppercase tracking-widest font-bold">GPU ACCELERATOR</label>
              <input
                value={gpu}
                onChange={(e) => setGpu(e.target.value)}
                className="bg-transparent border-none text-[#e1e0f7] text-sm focus:ring-0 p-0 placeholder-[#8a8a9e]/30 placeholder:text-xs outline-none"
                placeholder="型号 e.g. B300 / H800"
                type="text"
              />
            </div>
            
            <div className="bg-[#13141c] border border-[#323344] p-3 rounded-xs flex flex-col gap-1 group focus-within:border-[#00F0FF]">
              <label className="font-mono text-[9px] text-[#00F0FF] uppercase tracking-widest font-bold">HOST CPU MODEL</label>
              <input
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                className="bg-transparent border-none text-[#e1e0f7] text-sm focus:ring-0 p-0 placeholder-[#8a8a9e]/30 placeholder:text-xs outline-none"
                placeholder="型号 e.g. Intel 8468 / AMD 9354"
                type="text"
              />
            </div>
            
            <div className="bg-[#13141c] border border-[#323344] p-3 rounded-xs flex flex-col gap-1 group focus-within:border-[#00F0FF]">
              <label className="font-mono text-[9px] text-[#00F0FF] uppercase tracking-widest font-bold">SYSTEM RAM MEMORY</label>
              <input
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                className="bg-transparent border-none text-[#e1e0f7] text-sm focus:ring-0 p-0 placeholder-[#8a8a9e]/30 placeholder:text-xs outline-none"
                placeholder="总容量 e.g. 2TB DDR5"
                type="text"
              />
            </div>
            
            <div className="bg-[#13141c] border border-[#323344] p-3 rounded-xs flex flex-col gap-1 group focus-within:border-[#00F0FF]">
              <label className="font-mono text-[9px] text-[#00F0FF] uppercase tracking-widest font-bold">SSD NVMe STORAGE</label>
              <input
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="bg-transparent border-none text-[#e1e0f7] text-sm focus:ring-0 p-0 placeholder-[#8a8a9e]/30 placeholder:text-xs outline-none"
                placeholder="容量 e.g. 7.68TB x4"
                type="text"
              />
            </div>
            
            <div className="bg-[#13141c] border border-[#323344] p-3 rounded-xs flex flex-col gap-1 sm:col-span-2 group focus-within:border-[#00F0FF]">
              <label className="font-mono text-[9px] text-[#00F0FF] uppercase tracking-widest font-bold">INTERCONNECT SWITCH / DPU NETWORK</label>
              <input
                value={networkArch}
                onChange={(e) => setNetworkArch(e.target.value)}
                className="bg-transparent border-none text-[#e1e0f7] text-sm focus:ring-0 p-0 placeholder-[#8a8a9e]/30 placeholder:text-xs outline-none"
                placeholder="网络拓扑架构 e.g. Mellanox InfiniBand NDR 400G 环网"
                type="text"
              />
            </div>
          </div>
        </section>

        {/* 3. Compliance & Workflow */}
        <section className="bg-[#0D0E12] border border-t-2 border-[#ff5500]/30 border-r-[#323344] border-b-[#323344] border-l-[#323344] flex flex-col rounded-sm shadow-md">
          <div className="bg-[#13141c]/50 px-4 py-2 flex items-center justify-between border-b border-[#323344]/50">
            <span className="font-mono text-xs font-bold tracking-widest text-[#00F0FF] uppercase">
              03 // 交易合规
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-gray-500" />
          </div>
          
          <div className="p-4 flex flex-col gap-3 font-sans">
            <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-[#13141c]/40 transition-colors rounded-xs">
              <input
                type="checkbox"
                checked={isStateOwned}
                onChange={(e) => setIsStateOwned(e.target.checked)}
                className="sr-only"
              />
              <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border border-[#323344] bg-[#13141c] group-hover:border-[#00F0FF] transition-colors rounded-xs">
                {isStateOwned && <Check className="w-3.5 h-3.5 text-[#00F0FF]" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">配合国企/上市公司主体签约审核</span>
                <span className="font-mono text-[10px] text-[#8a8a9e] mt-0.5">交易方可配合完成背景与企业级签约合规性审核</span>
              </div>
            </label>
            
            <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-[#13141c]/40 transition-colors rounded-xs">
              <input
                type="checkbox"
                checked={isSpotCash}
                onChange={(e) => setIsSpotCash(e.target.checked)}
                className="sr-only"
              />
              <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border border-[#323344] bg-[#13141c] group-hover:border-[#00F0FF] transition-colors rounded-xs">
                {isSpotCash && <Check className="w-3.5 h-3.5 text-[#00F0FF]" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">现货交易，全款即时清算</span>
                <span className="font-mono text-[10px] text-[#8a8a9e] mt-0.5">支持现货即时清盘划拨，现金结算模式</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-[#13141c]/40 transition-colors rounded-xs">
              <input
                type="checkbox"
                checked={isPayToInspect}
                onChange={(e) => setIsPayToInspect(e.target.checked)}
                className="sr-only"
              />
              <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border border-[#323344] bg-[#13141c] group-hover:border-[#00F0FF] transition-colors rounded-xs">
                {isPayToInspect && <Check className="w-3.5 h-3.5 text-[#00F0FF]" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">支持款项托管，付款看货</span>
                <span className="font-mono text-[10px] text-[#8a8a9e] mt-0.5">资金划转代管至托管账户后，可核验上机测试或现场看货</span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-[#13141c]/40 transition-colors rounded-xs">
              <input
                type="checkbox"
                checked={requiresDeposit}
                onChange={(e) => setRequiresDeposit(e.target.checked)}
                className="sr-only"
              />
              <div className="relative flex items-center justify-center w-5 h-5 mt-0.5 border border-[#323344] bg-[#13141c] group-hover:border-[#00F0FF] transition-colors rounded-xs">
                {requiresDeposit && <Check className="w-3.5 h-3.5 text-[#00F0FF]" />}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">算力排期锁定，须先行缴纳定金</span>
                <span className="font-mono text-[10px] text-[#8a8a9e] mt-0.5">物理锁定算力集群与机位需提前支付约定比例意向定金</span>
              </div>
            </label>
          </div>
        </section>

        {/* 4. Upload Box */}
        <section className="bg-[#0D0E12] border border-t-2 border-[#ff5500]/30 border-r-[#323344] border-b-[#323344] border-l-[#323344] flex flex-col rounded-sm shadow-md mb-6">
          <div className="bg-[#13141c]/50 px-4 py-2 flex items-center justify-between border-b border-[#323344]/50">
            <span className="font-mono text-xs font-bold tracking-widest text-[#00F0FF] uppercase">
              04 // 附件
            </span>
            <UploadCloud className="w-3.5 h-3.5 text-gray-500" />
          </div>
          
          <div className="p-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              className="hidden"
            />
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleUploadClick}
              className={`w-full min-h-[110px] border border-dashed rounded-xs flex flex-col items-center justify-center cursor-pointer gap-2 p-4 transition-all ${
                isDragOver
                  ? "border-[#00F0FF] bg-[#00F0FF]/10"
                  : "border-[#323344] bg-[#13141c]/50 hover:border-[#00F0FF] hover:bg-[#00F0FF]/5"
              }`}
            >
              <UploadCloud className={`w-7 h-7 ${droppedFile ? "text-[#00F0FF]" : "text-[#8a8a9e]"}`} />
              
              {droppedFile ? (
                <div className="text-center">
                  <p className="text-sm text-white font-semibold font-mono">{droppedFile.name}</p>
                  <p className="text-xs text-[#00F0FF] font-mono">
                    尺寸大小: {(droppedFile.size / (1024 * 1024)).toFixed(2)} MB // 修改附件
                  </p>
                </div>
              ) : (
                <div className="text-center font-sans">
                  <p className="text-sm font-semibold text-[#8a8a9e]">点击本框或拖拽上传文档/图片附件</p>
                  <p className="text-[10px] text-gray-600 font-mono mt-1">最大支持规格尺寸：20MB</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Floating Actions Submission box */}
        <div className="fixed bottom-16 left-0 w-full z-40 bg-[#0D0E12]/95 border-t border-[#323344] backdrop-blur-md">
          <div className="p-4 max-w-2xl mx-auto flex flex-col gap-2">
            
            {isSuccess ? (
              <div className="w-full h-12 bg-[#13141c] border border-[#00F0FF] text-[#00F0FF] font-bold text-sm flex items-center justify-center gap-2 rounded-xs">
                <Check className="w-4 h-4 shadow-[0_0_8px_#00F0FF]" />
                <span className="tracking-[0.2em] font-mono">PUBLISHED // 算力广播校验完成，正在排版。</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isPublishing}
                className="glow-button w-full h-12 flex items-center justify-center gap-2 bg-[#ff5500] hover:bg-[#aa3600] active:scale-95 transition-all text-white font-bold font-mono tracking-widest text-sm rounded-xs cursor-pointer select-none shadow-lg"
              >
                <Rocket className="w-4 h-4" />
                <span>{isPublishing ? "正在提交大集群广播数据..." : "确认发布"}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
