import React, { useEffect, useState } from "react";
import { useApp } from "../AppContext";
import "../animations.css";
import { AlertTriangle, Check, Info } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { systemLogs } = useApp();
  const [visible, setVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<{ title: string; description: string; status: string } | null>(null);
  const prevCountRef = React.useRef(systemLogs.length);

  useEffect(() => {
    if (systemLogs.length > prevCountRef.current && systemLogs.length > 0) {
      const latest = systemLogs[0];
      setCurrentLog({ title: latest.title, description: latest.description, status: latest.status });
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2500);
      prevCountRef.current = systemLogs.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = systemLogs.length;
  }, [systemLogs]);

  const icon = currentLog?.status === 'critical' || currentLog?.status === 'alert'
    ? <AlertTriangle className="w-4 h-4 text-[#ff5500]" />
    : currentLog?.status === 'success'
    ? <Check className="w-4 h-4 text-[#00F0FF]" />
    : <Info className="w-4 h-4 text-[#00F0FF]" />;

  const borderColor = currentLog?.status === 'success' ? 'border-[#00F0FF]/40' :
    currentLog?.status === 'critical' ? 'border-[#ff5500]/60' :
    currentLog?.status === 'alert' ? 'border-[#ffaa00]/60' : 'border-[#00F0FF]/40';

  return (
    <div>
      {visible && currentLog && (
        <div
          className={`fixed top-4 right-4 z-[100] max-w-sm bg-[#0D0E12]/95 border ${borderColor} backdrop-blur-md p-4 rounded-sm shadow-lg flex items-start gap-3 animate-fade-in`}
        >
          <div className="shrink-0 mt-0.5">{icon}</div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-mono text-xs text-[#00F0FF] font-bold truncate">{currentLog.title}</span>
            <span className="text-[11px] text-[#8a8a9e] leading-relaxed line-clamp-2">{currentLog.description}</span>
          </div>
        </div>
      )}
    </div>
  );
};
