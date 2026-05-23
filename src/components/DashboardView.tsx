import React, { useState, useMemo } from "react";
import { useApp } from "../AppContext";
import { Posting } from "../types";
import { BarChart3, Search, MapPin, Calendar, Heart } from "lucide-react";

export const DashboardView: React.FC = () => {
  const { postings, toggleBookmark, bookmarkedIds, setActiveTab } = useApp();

  const [typeFilter, setTypeFilter] = useState<'all' | 'supply' | 'demand'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | '现货' | '期货' | '在途' | 'expired'>('all');
  const [gpuFilter, setGpuFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();

  // Extract unique GPU models from postings
  const gpuOptions = useMemo(() => {
    const gpus = new Set<string>();
    postings.forEach(p => {
      if (p.cpu) {
        const match = p.architecture?.match(/(H\d+|B\d+|A\d+|GH\d+|L40S|MI\d+|V\d+)/i);
        if (match) gpus.add(match[1].toUpperCase());
      }
    });
    // Also extract from architecture field
    postings.forEach(p => {
      const match = p.architecture?.match(/(H800|H100|B300|B200|A100|A800|GH200|L40S|MI300X|V100)/i);
      if (match) gpus.add(match[1].toUpperCase());
    });
    return Array.from(gpus).sort();
  }, [postings]);

  // Stats
  const stats = useMemo(() => {
    const active = postings.filter(p => !p.expiresAt || new Date(p.expiresAt) > now);
    const expired = postings.filter(p => p.expiresAt && new Date(p.expiresAt) <= now);
    const supplyCount = active.filter(p => p.type === 'supply').length;
    const demandCount = active.filter(p => p.type === 'demand').length;
    const expirySoon = active.filter(p => {
      if (!p.expiresAt) return false;
      const daysLeft = (new Date(p.expiresAt).getTime() - now.getTime()) / 86400000;
      return daysLeft > 0 && daysLeft <= 7;
    }).length;
    return {
      total: active.length,
      supply: supplyCount,
      demand: demandCount,
      expired: expired.length,
      expirySoon,
    };
  }, [postings]);

  // Filtered postings (include both active and expired for dashboard)
  const filteredPostings = useMemo(() => {
    return postings.filter(p => {
      const isExpired = p.expiresAt && new Date(p.expiresAt) <= now;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (statusFilter === 'expired') {
        if (!isExpired) return false;
      } else if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      if (statusFilter === 'all' && isExpired) return true; // Show expired in "all" mode
      if (gpuFilter !== 'all') {
        const archMatch = p.architecture?.toUpperCase().includes(gpuFilter);
        if (!archMatch) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${p.title} ${p.architecture} ${p.location} ${p.cpu || ''} ${p.gpu || ''} ${p.qty}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [postings, typeFilter, statusFilter, gpuFilter, searchQuery, now]);

  const isExpired = (post: Posting) => post.expiresAt && new Date(post.expiresAt) <= now;

  const handleCardClick = (post: Posting) => {
    window.history.pushState({}, '', `?posting=${post.id}`);
    setActiveTab('lobby');
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-[#e1e0f7] pb-10">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {([
          { label: '在线发布', value: stats.total, color: '#00F0FF' },
          { label: '算力供应', value: stats.supply, color: '#00F0FF' },
          { label: '算力需求', value: stats.demand, color: '#ff5500' },
          { label: '即将过期', value: stats.expirySoon, color: '#ffaa00' },
          { label: '已过期', value: stats.expired, color: '#ff3333' },
        ] as const).map(s => (
          <div key={s.label} className="bg-[#0D0E12] border border-[#323344] p-3 rounded-sm flex flex-col items-center gap-1">
            <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px] text-[#8a8a9e] font-mono tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0D0E12] border border-[#323344] p-3 rounded-sm">
        {/* Type filter */}
        <div className="flex gap-1">
          {(['all', 'supply', 'demand'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`h-8 px-3 font-mono text-xs rounded-xs transition-all cursor-pointer border ${
                typeFilter === t
                  ? 'bg-[#ff5500]/15 text-[#ff5500] border-[#ff5500]/50'
                  : 'bg-[#13141c] text-[#8a8a9e] border-[#323344] hover:border-[#ff5500]/40'
              }`}
            >
              {t === 'all' ? '全部' : t === 'supply' ? '供应' : '需求'}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-8 px-2 bg-[#13141c] border border-[#323344] rounded-xs text-xs text-[#8a8a9e] font-mono focus:border-[#00F0FF] outline-none"
        >
          <option value="all">全部状态</option>
          <option value="现货">现货</option>
          <option value="期货">期货</option>
          <option value="在途">在途</option>
          <option value="expired">已过期</option>
        </select>

        {/* GPU filter */}
        {gpuOptions.length > 0 && (
          <select
            value={gpuFilter}
            onChange={(e) => setGpuFilter(e.target.value)}
            className="h-8 px-2 bg-[#13141c] border border-[#323344] rounded-xs text-xs text-[#8a8a9e] font-mono focus:border-[#00F0FF] outline-none"
          >
            <option value="all">全部GPU</option>
            {gpuOptions.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#8a8a9e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索标题/型号/地点..."
            className="w-full h-8 pl-8 pr-3 bg-[#13141c] border border-[#323344] rounded-xs text-xs text-[#e1e0f7] placeholder-[#8a8a9e]/40 focus:border-[#00F0FF] outline-none font-mono"
          />
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPostings.length === 0 ? (
          <div className="col-span-full border border-[#323344] bg-[#13141c]/50 p-10 text-center rounded-sm">
            <BarChart3 className="w-10 h-10 text-[#ff5500] mx-auto mb-3 opacity-60" />
            <p className="text-gray-400 text-sm tracking-wide">没有匹配的算力条目</p>
            <p className="text-xs text-gray-600 mt-1">调整筛选条件查看其他发布</p>
          </div>
        ) : (
          filteredPostings.map(post => {
            const isBookmarked = bookmarkedIds.includes(post.id);
            const expired = isExpired(post);
            const expirySoon = post.expiresAt && !expired && (new Date(post.expiresAt).getTime() - now.getTime()) / 86400000 <= 7;

            return (
              <article
                key={post.id}
                onClick={() => handleCardClick(post)}
                className={`bg-[#0D0E12] border border-[#323344]/60 rounded-sm flex flex-col overflow-hidden group hover:border-[#00F0FF]/40 transition-all duration-300 shadow-lg cursor-pointer ${expired ? 'opacity-50' : ''}`}
              >
                <div className="p-3">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0">
                      <h3 className="font-sans text-sm font-bold text-white truncate">{post.title}</h3>
                      <p className="font-mono text-[10px] text-[#8a8a9e] truncate">{post.architecture}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(post.id); }}
                        className={`p-1 rounded-xs hover:bg-[#323344]/40 transition-colors cursor-pointer ${isBookmarked ? 'text-[#ff5500]' : 'text-gray-500'}`}
                      >
                        <Heart className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
                      </button>
                      <div className={`flex items-center gap-1 bg-[#13141c] px-1.5 py-0.5 border rounded-xs text-[9px] font-mono font-bold ${
                        expired ? 'border-red-500/40 text-red-400' : 'border-[#323344]/40 text-[#8a8a9e]'
                      }`}>
                        {expired ? '已过期' : (expirySoon ? `${Math.ceil((new Date(post.expiresAt!).getTime() - now.getTime()) / 86400000)}天后过期` : post.status)}
                      </div>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-3 text-[10px] text-[#8a8a9e] mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#ff5500]/70" />
                      {post.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#ff5500]/70" />
                      {new Date(post.timestamp).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit" })}
                    </span>
                    <span className={`font-semibold ${post.type === 'supply' ? 'text-[#00F0FF]' : 'text-[#ff5500]'}`}>
                      {post.type === 'supply' ? '货源' : '需求'}
                    </span>
                  </div>

                  {/* Data grid */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs mb-2">
                    <span className="text-[#8a8a9e]">数量: <span className="text-white">{post.qty}</span></span>
                    <span className="text-[#8a8a9e]">内存: <span className="text-white truncate">{post.memory || '-'}</span></span>
                  </div>

                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="border-t border-[#323344]/30 pt-2 mt-1 max-h-24 overflow-y-auto">
                      {post.comments.map(c => (
                        <div key={c.id} className="text-[10px] text-[#8a8a9e] leading-relaxed mb-1 flex gap-1.5">
                          <span className="text-[#00F0FF] shrink-0 font-mono">{c.authorName}:</span>
                          <span className="text-gray-400">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Publisher */}
                  <div className="flex justify-between items-center pt-2 border-t border-[#323344]/20">
                    <span className="text-[9px] text-gray-500 font-mono">发布者: {post.authorName || '-'}</span>
                    <span className="text-[9px] text-[#00F0FF] font-mono opacity-0 group-hover:opacity-100 transition-opacity">点击查看 →</span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

    </div>
  );
};
