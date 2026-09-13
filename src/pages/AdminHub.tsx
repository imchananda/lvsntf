import { useState, useEffect } from 'react';
import AdminDataManagement from './AdminDataManagement';
import AdminCalculator from './AdminCalculator';
import { FaDatabase, FaCalculator, FaSignOutAlt, FaHome, FaCog, FaSync } from 'react-icons/fa';

interface AdminHubProps {
  initialTab?: 'data' | 'calc';
  onLogout?: () => void;
}

export default function AdminHub({ initialTab = 'data', onLogout }: AdminHubProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'calc'>(() => {
    if (window.location.hash.includes('calc')) return 'calc';
    if (window.location.hash.includes('data')) return 'data';
    return initialTab;
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [privateAccessEnabled, setPrivateAccessEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ntf_private_access_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const [showPhaseFilter, setShowPhaseFilter] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ntf_show_phase_filter') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash.includes('calc')) setActiveTab('calc');
      else if (window.location.hash.includes('data')) setActiveTab('data');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const handleAccessMode = (e: any) => {
      if (e.detail?.privateEnabled !== undefined) {
        setPrivateAccessEnabled(e.detail.privateEnabled);
      }
    };
    const handlePhaseFilter = (e: any) => {
      if (e.detail?.showPhaseFilter !== undefined) {
        setShowPhaseFilter(e.detail.showPhaseFilter);
      }
    };

    window.addEventListener('ntf_access_mode_changed', handleAccessMode);
    window.addEventListener('ntf_phase_filter_changed', handlePhaseFilter);

    return () => {
      window.removeEventListener('ntf_access_mode_changed', handleAccessMode);
      window.removeEventListener('ntf_phase_filter_changed', handlePhaseFilter);
    };
  }, []);

  const handleTabChange = (tab: 'data' | 'calc') => {
    setActiveTab(tab);
    window.location.hash = tab === 'calc' ? '#/admin-calc' : '#/admin-data';
  };

  const handleOpenConfigModal = () => {
    // If we're not on data tab, switch to it first
    if (activeTab !== 'data') {
      handleTabChange('data');
    }
    // Dispatch event to open config modal in AdminDataManagement
    window.dispatchEvent(new CustomEvent('ntf_open_config_modal'));
  };

  const handleTriggerRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('ntf_trigger_fetch_data'));
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans">
      {/* ── Sub Navigation Header for Admin ── */}
      <div className="bg-[#0B192C] text-white border-b border-[#1E3E62] px-3 sm:px-4 py-2 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Tab switch */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <span className="text-[11px] font-bold text-sky-300 uppercase tracking-widest mr-1 hidden lg:inline">
              Admin Hub:
            </span>

            <button
              onClick={() => handleTabChange('data')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'data'
                  ? 'bg-[#E00034] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaDatabase className="text-xs shrink-0" />
              <span className="hidden xs:inline">จัดการข้อมูล (Data)</span>
              <span className="xs:hidden">Data</span>
            </button>

            <button
              onClick={() => handleTabChange('calc')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'calc'
                  ? 'bg-[#E00034] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FaCalculator className="text-xs shrink-0" />
              <span className="hidden xs:inline">สรุปภาพรวม (Dashboard)</span>
              <span className="xs:hidden">Dashboard</span>
            </button>
          </div>

          {/* Right: Status badges + Icon Action Buttons + Home + Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Status Badges: Fan Site & Phase */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* Fan Site Status */}
              <span
                className={`text-[10px] px-2 py-1 rounded-md font-bold border flex items-center gap-1 transition-all ${
                  !privateAccessEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
                title={privateAccessEnabled ? 'Fan Site: โหมด Private (ต้องใส่รหัส)' : 'Fan Site: โหมด Public (เปิดเสรี)'}
              >
                <span>{privateAccessEnabled ? '🔒 Fan: Private' : '🌐 Fan: Public'}</span>
              </span>

              {/* Phase Status */}
              <span
                className={`text-[10px] px-2 py-1 rounded-md font-bold border flex items-center gap-1 transition-all ${
                  showPhaseFilter
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-700/60 text-slate-300 border-slate-600'
                }`}
                title={showPhaseFilter ? 'Phase Filter: เปิดแสดง 5 ช่วงเวลา' : 'Phase Filter: ปิดซ่อน 5 ช่วงเวลา'}
              >
                <span>{showPhaseFilter ? '📅 Phase: ON' : '📅 Phase: OFF'}</span>
              </span>
            </div>

            {/* Minimal Icon Button 1: Campaign Config */}
            <button
              onClick={handleOpenConfigModal}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white flex items-center justify-center transition-all active:scale-95"
              title="ตั้งค่าแคมเปญ (Official Hashtags, Fan Site Mode, Phase Filter)"
              aria-label="ตั้งค่าแคมเปญ"
            >
              <FaCog className="text-xs sm:text-sm" />
            </button>

            {/* Minimal Icon Button 2: Refresh Data */}
            <button
              onClick={handleTriggerRefresh}
              disabled={isRefreshing}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              title="รีเฟรชข้อมูลจาก Google Sheet"
              aria-label="รีเฟรชข้อมูล"
            >
              <FaSync className={`text-xs sm:text-sm ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <div className="w-px h-5 bg-white/20 mx-0.5 hidden xs:block" />

            {/* Back to Home Page Button */}
            <a
              href="#/"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              title="กลับไปหน้าหลัก"
            >
              <FaHome className="text-xs" />
              <span className="hidden md:inline font-medium">หน้าหลัก</span>
            </a>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
                title="ออกจากระบบแอดมิน"
              >
                <FaSignOutAlt className="text-xs" />
                <span className="hidden md:inline font-medium">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Admin Section ── */}
      <div className="flex-1">
        {activeTab === 'data' ? (
          <AdminDataManagement onBackToApp={() => { window.location.hash = '#/'; }} />
        ) : (
          <AdminCalculator />
        )}
      </div>
    </div>
  );
}
