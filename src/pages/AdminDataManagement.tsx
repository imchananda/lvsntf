import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaWeibo,
  FaTiktok,
  FaSearch,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaStar,
  FaTrash,
  FaPencilAlt,
  FaExternalLinkAlt,
  FaSync,
  FaCopy,
  FaCheck,
  FaCog,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRocket,
  FaBullseye,
  FaHeart,
  FaComment,
  FaRetweet,
  FaShareAlt,
  FaEye,
  FaBookmark,
  FaChevronDown,
  FaChartBar,
  FaImage,
  FaCloudUploadAlt,
  FaLink,
} from 'react-icons/fa';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';
import { SiXiaohongshu } from 'react-icons/si';
import { uploadImageToCatbox, normalizeImageUrl } from '../utils/imageUpload';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AdminSheetTask {
  id: string;
  mark: boolean;
  platform: string;
  media: string;
  title: string;
  url: string;
  hashtag: string;
  artist?: string; // 'both' | 'namtan' | 'film' | 'levis' | 'media'
  focus?: number;
  boost?: string;
  image?: string;
  likes?: string;
  target_likes?: string;
  comments?: string;
  target_comments?: string;
  shares?: string;
  target_shares?: string;
  reposts?: string;
  target_reposts?: string;
  views?: string;
  target_views?: string;
  saves?: string;
  target_saves?: string;
  target?: string;
  source?: 'sheet' | 'local';
}

export function parseAbbrNumber(val?: string | number): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim().toLowerCase().replace(/,/g, '');
  if (!s) return 0;
  if (s.endsWith('k')) {
    return (parseFloat(s.slice(0, -1)) || 0) * 1000;
  }
  if (s.endsWith('m')) {
    return (parseFloat(s.slice(0, -1)) || 0) * 1000000;
  }
  return parseFloat(s) || 0;
}

interface AdminDataManagementProps {
  onBackToApp?: () => void;
}

// ─── Config & Constants ───────────────────────────────────────────────────────
export const DEFAULT_LEVIS_HASHTAGS = `#NamtanFilmxLevis\n#LiveInLevis\n#LevisThailand\n#น้ำตาลฟิล์ม\n#NamtanFilm`;

const PLATFORM_OPTIONS = [
  { id: 'all', label: 'ทั้งหมด (All)', icon: null },
  { id: 'instagram', label: 'Instagram', icon: <FaInstagram className="text-pink-500" /> },
  { id: 'x', label: 'X (Twitter)', icon: <FaXTwitter className="text-gray-800" /> },
  { id: 'tiktok', label: 'TikTok', icon: <FaTiktok className="text-teal-600" /> },
  { id: 'facebook', label: 'Facebook', icon: <FaFacebook className="text-blue-600" /> },
  { id: 'youtube', label: 'YouTube', icon: <FaYoutube className="text-red-600" /> },
  { id: 'threads', label: 'Threads', icon: <FaThreads className="text-zinc-800" /> },
  { id: 'weibo', label: 'Weibo', icon: <FaWeibo className="text-yellow-600" /> },
  { id: 'red', label: 'RED (小红书)', icon: <SiXiaohongshu className="text-rose-600" /> },
];

export const ARTIST_CATEGORIES = [
  { id: 'both', label: '💖 คู่ NamtanFilm', badgeColor: 'bg-[#E00034] text-white' },
  { id: 'namtan', label: '🧡 Namtan เดี่ยว', badgeColor: 'bg-amber-500 text-white' },
  { id: 'film', label: '💙 Film เดี่ยว', badgeColor: 'bg-blue-600 text-white' },
];

export const ALL_KNOWN_ARTIST_BADGES: Record<string, { label: string; badgeColor: string }> = {
  both: { label: '💖 คู่ NamtanFilm', badgeColor: 'bg-[#E00034] text-white' },
  namtan: { label: '🧡 Namtan เดี่ยว', badgeColor: 'bg-amber-500 text-white' },
  film: { label: '💙 Film เดี่ยว', badgeColor: 'bg-blue-600 text-white' },
  levis: { label: '👖 Levi\'s Official', badgeColor: 'bg-[#122D55] text-white' },
  media: { label: '📰 สื่อ / นิตยสาร', badgeColor: 'bg-slate-600 text-white' },
};

const normalizeUrl = (u: string): string => {
  try {
    let clean = u.trim().toLowerCase();
    if (clean.endsWith('/')) clean = clean.slice(0, -1);
    return clean;
  } catch {
    return u.trim().toLowerCase();
  }
};

const detectPlatformFromUrl = (url: string): string => {
  const u = url.toLowerCase();
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('threads.net')) return 'threads';
  if (u.includes('weibo.com')) return 'weibo';
  if (u.includes('xiaohongshu.com')) return 'red';
  return 'x';
};

const renderDropdownMetricCard = (
  label: string,
  curr?: string,
  tgt?: string,
  theme: 'rose' | 'blue' | 'emerald' | 'purple' | 'amber' | 'teal' = 'rose'
) => {
  const currNum = parseAbbrNumber(curr);
  const tgtNum = parseAbbrNumber(tgt);
  const hasTarget = tgtNum > 0;
  const pct = hasTarget ? Math.min(Math.round((currNum / tgtNum) * 100), 100) : 0;
  const isDone = hasTarget && currNum >= tgtNum;
  const hasData = Boolean(curr || tgt);

  const themeClasses = {
    rose: { bg: 'bg-rose-50/50', border: 'border-rose-200/80', text: 'text-rose-700', bar: 'bg-rose-500' },
    blue: { bg: 'bg-blue-50/50', border: 'border-blue-200/80', text: 'text-blue-700', bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-50/50', border: 'border-emerald-200/80', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    purple: { bg: 'bg-purple-50/50', border: 'border-purple-200/80', text: 'text-purple-700', bar: 'bg-purple-500' },
    amber: { bg: 'bg-amber-50/50', border: 'border-amber-200/80', text: 'text-amber-800', bar: 'bg-amber-500' },
    teal: { bg: 'bg-teal-50/50', border: 'border-teal-200/80', text: 'text-teal-700', bar: 'bg-teal-500' },
  }[theme];

  return (
    <div className={`p-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.bg} flex flex-col justify-between gap-1 shadow-xs transition-all`}>
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-gray-700">{label}</span>
        {hasTarget ? (
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isDone ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
            {isDone ? '🎉 100%' : `${pct}%`}
          </span>
        ) : (
          <span className="text-[9px] text-gray-400 font-normal">ยังไม่ตั้งเป้า</span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mt-0.5">
        <span className={`text-xs font-bold ${themeClasses.text}`}>{curr || '0'}</span>
        {hasTarget && (
          <>
            <span className="text-gray-400 text-[10px] font-normal">/</span>
            <span className="text-gray-600 text-[11px] font-medium">{tgt}</span>
          </>
        )}
      </div>

      {hasTarget ? (
        <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : themeClasses.bar} transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <div className="text-[9px] text-gray-400 mt-1">
          {hasData ? 'ยอดปัจจุบัน' : 'ไม่มีข้อมูล'}
        </div>
      )}
    </div>
  );
};

// ─── Platform Icon Helper ─────────────────────────────────────────────────────
const getPlatformIcon = (platform: string) => {
  const p = (platform || '').toLowerCase().trim();
  if (p === 'instagram') return <FaInstagram className="text-pink-600 text-base" />;
  if (p === 'facebook') return <FaFacebook className="text-blue-600 text-base" />;
  if (p === 'youtube') return <FaYoutube className="text-red-600 text-base" />;
  if (p === 'tiktok') return <FaTiktok className="text-gray-800 text-base" />;
  if (p === 'x' || p === 'twitter') return <FaXTwitter className="text-gray-800 text-base" />;
  if (p === 'threads') return <FaThreads className="text-gray-800 text-base" />;
  if (p === 'weibo') return <FaWeibo className="text-red-500 text-base" />;
  if (p === 'xiaohongshu' || p === 'red') return <SiXiaohongshu className="text-red-500 text-base" />;
  return <span className="text-[10px] font-bold text-gray-600 uppercase">{platform}</span>;
};

// ─── CSV Parser Helper ────────────────────────────────────────────────────────
function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') { currentCell += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) rows.push(currentRow);
      currentRow = []; currentCell = '';
      if (char === '\r') i++;
    } else if (char === '\r' && !inQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) rows.push(currentRow);
      currentRow = []; currentCell = '';
    } else {
      currentCell += char;
    }
  }
  currentRow.push(currentCell.trim());
  if (currentRow.some(c => c !== '')) rows.push(currentRow);
  return rows;
}

export default function AdminDataManagement({ onBackToApp }: AdminDataManagementProps) {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<AdminSheetTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterArtist, setFilterArtist] = useState('all');
  const [filterBoost, setFilterBoost] = useState<'all' | 'boost' | 'media' | 'pinned' | 'marked'>('all');
  const [globalHashtags, setGlobalHashtags] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ntf_global_hashtags');
      if (saved) return saved;
    } catch { /* ignore */ }
    return DEFAULT_LEVIS_HASHTAGS;
  });
  const [syncToAllPosts, setSyncToAllPosts] = useState(false);

  // Hook for drag-to-scroll with mouse + horizontal mouse-wheel scrolling
  const attachScrollHandlers = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      hasMoved = false;
      startX = e.pageX - node.offsetLeft;
      scrollLeft = node.scrollLeft;
      node.style.cursor = 'grabbing';
      node.style.userSelect = 'none';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - node.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(x - startX) > 4) {
        hasMoved = true;
      }
      node.scrollLeft = scrollLeft - walk;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      node.style.cursor = 'grab';
      node.style.removeProperty('user-select');
      if (hasMoved) {
        const preventClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        node.addEventListener('click', preventClick, { capture: true, once: true });
      }
    };

    const onMouseLeave = () => {
      if (!isDown) return;
      isDown = false;
      node.style.cursor = 'grab';
      node.style.removeProperty('user-select');
    };

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        node.scrollLeft += e.deltaY;
      }
    };

    node.style.cursor = 'grab';
    node.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    node.addEventListener('mouseleave', onMouseLeave);
    node.addEventListener('wheel', onWheel, { passive: true });
  }, []);

  // Helper to detect if a task is using old/corrupted default hashtags
  const isOldDefaultHashtags = useCallback((text?: string): boolean => {
    if (!text) return true;
    const clean = text.trim();
    return (
      clean === DEFAULT_LEVIS_HASHTAGS.trim() ||
      clean.includes('???????????') ||
      (clean.includes('#NamtanFilmxLevis') && clean.includes('#LiveInLevis') && clean.includes('#LevisThailand'))
    );
  }, []);

  // Helper to get effective hashtags for a task (falling back to globalHashtags if default/empty)
  const getEffectiveHashtags = useCallback((task?: { hashtag?: string }): string => {
    if (!task?.hashtag || isOldDefaultHashtags(task.hashtag)) {
      return globalHashtags || task?.hashtag || '';
    }
    return task.hashtag;
  }, [globalHashtags, isOldDefaultHashtags]);

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
  const [defaultStartSection, setDefaultStartSection] = useState<'boost' | 'tasks' | 'important' | 'none'>(() => {
    try {
      const saved = localStorage.getItem('ntf_default_start_section');
      if (saved && ['boost', 'tasks', 'important', 'none'].includes(saved)) {
        return saved as 'boost' | 'tasks' | 'important' | 'none';
      }
    } catch { /* ignore */ }
    return 'boost';
  });
  const [showEndCreditsToggle, setShowEndCreditsToggle] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ntf_show_end_credits');
      if (saved !== null) return saved === 'true';
    } catch { /* ignore */ }
    return true;
  });

  // Track which task engagement dropdowns are currently open
  const [expandedEngagementIds, setExpandedEngagementIds] = useState<Set<string>>(new Set());

  const toggleEngagementDropdown = useCallback((id: string) => {
    setExpandedEngagementIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // App Script Config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gasUrl: string = (import.meta as any).env?.VITE_GAS_URL || '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sheetId: string = (import.meta as any).env?.SHEET_ID || '';

  // Connection diagnostics state
  const [connState, setConnState] = useState<{
    testing: boolean;
    sheetOk: boolean | null;
    gasOk: boolean | null;
    gasError: string | null;
    wordsOk: boolean | null;
    wordsCount: number;
  }>({
    testing: false,
    sheetOk: null,
    gasOk: null,
    gasError: null,
    wordsOk: null,
    wordsCount: 0,
  });

  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    mark: false,
    platform: 'instagram',
    media: '',
    title: '',
    url: '',
    hashtag: globalHashtags,
    artist: 'both',
    boost: '',
    image: '',
    likes: '',
    target_likes: '',
    comments: '',
    target_comments: '',
    shares: '',
    target_shares: '',
    reposts: '',
    target_reposts: '',
    views: '',
    target_views: '',
    saves: '',
    target_saves: '',
    target: '',
  });

  const resetForm = useCallback(() => {
    setFormData({
      mark: false,
      platform: 'instagram',
      media: '',
      title: '',
      url: '',
      hashtag: globalHashtags,
      artist: 'both',
      boost: '',
      image: '',
      likes: '',
      target_likes: '',
      comments: '',
      target_comments: '',
      shares: '',
      target_shares: '',
      reposts: '',
      target_reposts: '',
      views: '',
      target_views: '',
      saves: '',
      target_saves: '',
      target: '',
    });
    setEditingTaskId(null);
    setStatusMessage(null);
    setImageUploadError(null);
    setShowBoostSection(false);
    setShowEngagementSection(false);
  }, [globalHashtags]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Accordion / Toggle state for collapsible sections in Add/Edit modal
  const [showBoostSection, setShowBoostSection] = useState(false);
  const [showEngagementSection, setShowEngagementSection] = useState(false);

  // Image Upload & Preview State
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageLoadStatus, setImageLoadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageUploadError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (PNG, JPG, WebP, GIF)');
      return;
    }
    setIsUploadingImage(true);
    setImageUploadError(null);
    setImageLoadStatus('loading');
    try {
      const url = await uploadImageToCatbox(file);
      setFormData(prev => ({ ...prev, image: url }));
      setImageLoadStatus('success');
    } catch (err: any) {
      console.error('Image upload error:', err);
      setImageUploadError(err.message || 'อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setImageLoadStatus('error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Media name suggestions
  const uniqueMediaNames = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.media || t.title).filter(Boolean)));
  }, [tasks]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const mediaSuggestions = useMemo(() => {
    if (!formData.media) return uniqueMediaNames.slice(0, 6);
    return uniqueMediaNames
      .filter(name => name.toLowerCase().includes(formData.media.toLowerCase()) && name !== formData.media)
      .slice(0, 6);
  }, [formData.media, uniqueMediaNames]);

  // Duplicate URL Check
  const isUrlDuplicate = useMemo(() => {
    if (!formData.url) return false;
    const cleanInput = normalizeUrl(formData.url);
    return tasks.some(t => {
      if (editingTaskId && t.id === editingTaskId) return false;
      return normalizeUrl(t.url) === cleanInput;
    });
  }, [formData.url, tasks, editingTaskId]);

  // ─── Test Google Connections ────────────────────────────────────────────────
  const testGoogleConnections = useCallback(async () => {
    setConnState(prev => ({ ...prev, testing: true }));
    let sOk = false;
    let gOk = false;
    let gErr: string | null = null;
    let wOk: boolean | null = null;
    let wCount = 0;

    // 1. Check Campaign Sheet read
    try {
      const sRes = await fetch('/api/sheet?gid=0');
      if (sRes.ok) {
        const text = await sRes.text();
        sOk = text.includes('id') || text.includes('url') || text.includes('platform');
      }
    } catch {
      sOk = false;
    }

    // 2. Check Apps Script write
    try {
      const aRes = await fetch('/api/admin-sheet', { method: 'GET' });
      const aJson = await aRes.json().catch(() => null);
      if (aRes.ok && aJson?.ok) {
        gOk = true;
      } else if (aJson?.error === 'GOOGLE_PERMISSION_DENIED') {
        gOk = false;
        gErr = aJson.message || 'Google Apps Script ยังไม่ได้ตั้งค่าสิทธิ์เป็น "ทุกคน (Anyone)"';
      } else {
        gOk = false;
        gErr = aJson?.message || aJson?.error || `HTTP ${aRes.status}`;
      }
    } catch (err: any) {
      gOk = false;
      gErr = err.message || 'ไม่สามารถติดต่อ Google Apps Script ได้';
    }

    // 3. Check Word Randomizer (Positive Messages) from dedicated Message Sheet
    try {
      const msgRes = await fetch('/api/msg-sheet?gid=0');
      if (msgRes.ok) {
        const csv = await msgRes.text();
        const firstLine = (csv.split('\n')[0] || '').toLowerCase();
        // Check for "completed text" column (Column E in user's sheet)
        if (firstLine.includes('completed text') || firstLine.includes('completed_text') || firstLine.includes('message_th') || firstLine.includes('message_en')) {
          wOk = true;
          // Count data rows
          const lines = csv.split('\n').filter(l => l.trim().length > 0);
          wCount = Math.max(0, lines.length - 1); // minus header
        } else {
          wOk = false;
        }
      } else {
        wOk = false;
      }
    } catch {
      wOk = false;
    }

    setConnState({
      testing: false,
      sheetOk: sOk,
      gasOk: gOk,
      gasError: gErr,
      wordsOk: wOk ?? true,
      wordsCount: wCount,
    });
  }, []);

  // ─── Fetch Data from Sheet ──────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/sheet?gid=0&_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch from sheet proxy');
      const csv = await res.text();
      const rows = parseCSV(csv.replace(/^\uFEFF/, ''));
      if (rows.length === 0) {
        setTasks([]);
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().trim());
      const getVal = (r: string[], h: string) => {
        const idx = headers.indexOf(h.toLowerCase().trim());
        return idx !== -1 ? (r[idx] || '') : '';
      };

      const parsed: AdminSheetTask[] = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const id = getVal(r, 'id');
        if (id === 'global_settings' || id === 'toggle_settings') {
          const cfgTags = getVal(r, 'hashtags') || getVal(r, 'hashtag');
          if (cfgTags) {
            setGlobalHashtags(cfgTags);
            localStorage.setItem('ntf_global_hashtags', cfgTags);
          }
          const markVal = getVal(r, 'mark').toLowerCase().trim();
          const privVal = getVal(r, 'private_access').toLowerCase().trim();
          const isOff = privVal === '0' || privVal === 'false' || markVal === '0' || markVal === 'false';
          setPrivateAccessEnabled(!isOff);
          localStorage.setItem('ntf_private_access_enabled', !isOff ? 'true' : 'false');

          const phaseVal = (getVal(r, 'show_phase_filter') || getVal(r, 'phase_filter')).toLowerCase().trim();
          if (phaseVal) {
            const isPhaseOn = phaseVal === '1' || phaseVal === 'true' || phaseVal === 'yes';
            setShowPhaseFilter(isPhaseOn);
            localStorage.setItem('ntf_show_phase_filter', isPhaseOn ? 'true' : 'false');
          }
          const defSec = (getVal(r, 'default_section') || getVal(r, 'active_section')).toLowerCase().trim();
          if (defSec && ['boost', 'tasks', 'important', 'none'].includes(defSec)) {
            setDefaultStartSection(defSec as any);
            localStorage.setItem('ntf_default_start_section', defSec);
          }
          const endCreditsVal = (getVal(r, 'show_end_credits') || getVal(r, 'enable_end_credits') || getVal(r, 'end_credits')).toLowerCase().trim();
          if (endCreditsVal) {
            const isCreditsOn = endCreditsVal === '1' || endCreditsVal === 'true' || endCreditsVal === 'yes';
            setShowEndCreditsToggle(isCreditsOn);
            localStorage.setItem('ntf_show_end_credits', isCreditsOn ? 'true' : 'false');
          }
          continue;
        }

        const url = getVal(r, 'url');
        if (!url) continue;

        let rawPlatform = (getVal(r, 'platform') || 'x').toLowerCase().trim();
        if (['ig', 'instagram', 'insta'].includes(rawPlatform)) rawPlatform = 'instagram';
        else if (['fb', 'facebook'].includes(rawPlatform)) rawPlatform = 'facebook';
        else if (['tt', 'tiktok'].includes(rawPlatform)) rawPlatform = 'tiktok';
        else if (['yt', 'youtube'].includes(rawPlatform)) rawPlatform = 'youtube';
        else if (['threads', 'thread', 'th'].includes(rawPlatform)) rawPlatform = 'threads';

        const markVal = getVal(r, 'mark').toLowerCase().trim();
        const focusVal = getVal(r, 'focus').toLowerCase().trim();
        const isMarked = markVal === '1' || markVal === 'true' || markVal === 'yes' || focusVal === '1' || focusVal === 'hot' || focusVal === '2';

        let artistVal = getVal(r, 'artist').toLowerCase().trim();
        if (!artistVal) {
          const t = (getVal(r, 'title') || getVal(r, 'media')).toLowerCase();
          if (t.includes('namtanfilm') || (t.includes('namtan') && t.includes('film'))) artistVal = 'both';
          else if (t.includes('namtan') || t.includes('tipnaree')) artistVal = 'namtan';
          else if (t.includes('film') || t.includes('rachanun')) artistVal = 'film';
          else if (t.includes('levi')) artistVal = 'levis';
          else artistVal = 'media';
        }

        const taskId = id || url || String(i);
        const localImages = JSON.parse(localStorage.getItem('ntf_task_images') || '{}');
        const taskImage = getVal(r, 'image') || getVal(r, 'img') || getVal(r, 'picture') || localImages[taskId] || localImages[url] || '';

        parsed.push({
          id: taskId,
          mark: isMarked,
          platform: rawPlatform,
          media: getVal(r, 'media') || getVal(r, 'ชื่อสื่อ') || getVal(r, 'title') || '',
          title: getVal(r, 'title') || getVal(r, 'note') || '',
          url,
          hashtag: getVal(r, 'hashtag') || getVal(r, 'hashtags') || '',
          artist: artistVal,
          boost: getVal(r, 'boost'),
          image: taskImage,
          likes: getVal(r, 'likes'),
          target_likes: getVal(r, 'target_likes') || getVal(r, 'targetlikes') || '',
          comments: getVal(r, 'comments'),
          target_comments: getVal(r, 'target_comments') || getVal(r, 'targetcomments') || '',
          shares: getVal(r, 'shares'),
          target_shares: getVal(r, 'target_shares') || getVal(r, 'targetshares') || '',
          reposts: getVal(r, 'reposts'),
          target_reposts: getVal(r, 'target_reposts') || getVal(r, 'targetreposts') || '',
          views: getVal(r, 'views') || getVal(r, 'view'),
          target_views: getVal(r, 'target_views') || getVal(r, 'targetviews') || '',
          saves: getVal(r, 'saves') || getVal(r, 'save'),
          target_saves: getVal(r, 'target_saves') || getVal(r, 'targetsaves') || '',
          target: getVal(r, 'target') || getVal(r, 'goal'),
          source: 'sheet',
        });
      }

      setTasks(parsed.reverse());
    } catch (e) {
      console.error('Fetch error:', e);
      setStatusMessage({ type: 'error', text: 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้' });
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    testGoogleConnections();

    const handleOpenConfig = () => setShowConfigModal(true);
    const handleTriggerFetch = () => fetchData();
    window.addEventListener('ntf_open_config_modal', handleOpenConfig);
    window.addEventListener('ntf_trigger_fetch_data', handleTriggerFetch);

    return () => {
      window.removeEventListener('ntf_open_config_modal', handleOpenConfig);
      window.removeEventListener('ntf_trigger_fetch_data', handleTriggerFetch);
    };
  }, [fetchData, testGoogleConnections]);

  // ─── Filter & Search ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return tasks.filter(task => {
      const matchSearch =
        !q ||
        task.media.toLowerCase().includes(q) ||
        task.title.toLowerCase().includes(q) ||
        task.url.toLowerCase().includes(q) ||
        task.hashtag.toLowerCase().includes(q);

      const matchPlatform = filterPlatform === 'all' || task.platform === filterPlatform;
      const matchArtist = filterArtist === 'all' || task.artist === filterArtist;

      const isBoosted = Boolean(task.boost && (task.boost.includes('1') || task.boost.toLowerCase() === 'x' || task.boost.toLowerCase() === 'yes'));
      const isMedia = Boolean(task.boost && task.boost.includes('2'));
      const isPinned = Boolean(task.boost && (task.boost.includes('3') || task.boost.toLowerCase().includes('pin')));
      const matchBoost =
        filterBoost === 'all' ||
        (filterBoost === 'boost' && isBoosted) ||
        (filterBoost === 'media' && isMedia) ||
        (filterBoost === 'pinned' && isPinned) ||
        (filterBoost === 'marked' && task.mark);

      return matchSearch && matchPlatform && matchArtist && matchBoost;
    });
  }, [tasks, searchTerm, filterPlatform, filterArtist, filterBoost]);

  // ─── Submit Post to Sheet ───────────────────────────────────────────────────
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) return;

    if (isUrlDuplicate) {
      alert('⚠️ ไม่สามารถบันทึกได้: พบ URL นี้ในระบบแล้ว');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const payload = {
      action: editingTaskId ? 'updateRow' : 'addRow',
      sheetGID: '0',
      data: {
        id: editingTaskId || undefined,
        mark: formData.mark ? '1' : '0',
        platform: formData.platform,
        media: formData.media,
        title: formData.title || formData.media,
        url: formData.url,
        artist: formData.artist,
        hashtag: formData.hashtag,
        hashtags: formData.hashtag,
        focus: formData.mark ? '1' : '0',
        boost: formData.boost,
        image: formData.image,
        likes: formData.likes,
        target_likes: formData.target_likes,
        comments: formData.comments,
        target_comments: formData.target_comments,
        shares: formData.shares,
        target_shares: formData.target_shares,
        reposts: formData.reposts,
        target_reposts: formData.target_reposts,
        views: formData.views,
        target_views: formData.target_views,
        saves: formData.saves,
        target_saves: formData.target_saves,
        target: formData.target,
      },
    };

    try {
      let saved = false;
      let permissionError = false;
      let errorDetail = '';

      try {
        const res = await fetch('/api/admin-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const result = await res.json().catch(() => null);

        if (res.ok && result?.ok) {
          saved = true;
        } else if (result?.error === 'GOOGLE_PERMISSION_DENIED' || res.status === 403) {
          permissionError = true;
          errorDetail = result?.message || 'Google Apps Script สิทธิ์เข้าถึงยังเป็น "เฉพาะฉัน" (ต้องเป็น "ทุกคน / Anyone")';
        } else if (res.status === 404 && gasUrl) {
          // Fallback direct request if proxy not available
          await fetch(gasUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            mode: 'no-cors'
          });
          saved = true;
        } else {
          errorDetail = result?.message || result?.error || `HTTP ${res.status}`;
        }
      } catch (postErr: any) {
        if (gasUrl) {
          try {
            await fetch(gasUrl, {
              method: 'POST',
              body: JSON.stringify(payload),
              mode: 'no-cors'
            });
            saved = true;
          } catch (e: any) {
            errorDetail = e.message;
          }
        } else {
          errorDetail = postErr.message;
        }
      }

      if (permissionError) {
        setStatusMessage({
          type: 'error',
          text: '⚠️ บันทึกไม่สำเร็จ: Google Apps Script ติดสิทธิ์ (ต้องเปลี่ยนเป็น "ทุกคน / Anyone")'
        });
        setIsSubmitting(false);
        setShowPermissionGuide(true);
        return;
      }

      if (errorDetail && !saved) {
        setStatusMessage({
          type: 'error',
          text: `⚠️ เกิดข้อผิดพลาด: ${errorDetail}`
        });
        setIsSubmitting(false);
        return;
      }

      // Sync image to local cache for instant zero-latency rendering
      const localImages = JSON.parse(localStorage.getItem('ntf_task_images') || '{}');
      const imgKey = editingTaskId || formData.url;
      if (formData.image) {
        localImages[imgKey] = formData.image;
        if (formData.url) localImages[formData.url] = formData.image;
      } else {
        delete localImages[imgKey];
        if (formData.url) delete localImages[formData.url];
      }
      localStorage.setItem('ntf_task_images', JSON.stringify(localImages));
      window.dispatchEvent(new CustomEvent('ntf_task_images_changed'));

      if (editingTaskId) {
        setTasks(prev => prev.map(t => (t.id === editingTaskId ? { ...t, ...formData } : t)));
        setStatusMessage({ type: 'success', text: 'แก้ไขข้อมูลและบันทึกลง Google Sheet สำเร็จ!' });
      } else {
        const newTask: AdminSheetTask = {
          id: `post_${Date.now()}`,
          ...formData,
          source: 'local',
        };
        setTasks(prev => [newTask, ...prev]);
        setStatusMessage({ type: 'success', text: 'เพิ่มโพสต์และบันทึกลง Google Sheet สำเร็จ!' });
      }

      setTimeout(() => {
        setShowAddModal(false);
        resetForm();
      }, 700);

      fetchData(true);
      testGoogleConnections();
    } catch (err) {
      console.error('Submit error:', err);
      setStatusMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการส่งข้อมูลไปยังชีต' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete Post ────────────────────────────────────────────────────────────
  const handleDeletePost = async (taskId: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้ออกจากระบบ?')) return;

    try {
      const res = await fetch('/api/admin-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteRow',
          sheetGID: '0',
          data: { id: taskId },
        }),
      });

      const result = await res.json().catch(() => null);
      if (result?.error === 'GOOGLE_PERMISSION_DENIED' || res.status === 403) {
        alert('⚠️ ไม่สามารถลบจาก Google Sheet ได้: Google Apps Script สิทธิ์เป็น "เฉพาะฉัน" (กรุณาเปลี่ยนเป็น "ทุกคน / Anyone")');
        setShowPermissionGuide(true);
        return;
      }

      setTasks(prev => prev.filter(t => t.id !== taskId));
      fetchData(true);
      testGoogleConnections();
    } catch (err) {
      console.error('Delete error:', err);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // ─── Edit Button Click ──────────────────────────────────────────────────────
  const handleEditClick = (task: AdminSheetTask) => {
    setEditingTaskId(task.id);
    setFormData({
      mark: task.mark,
      platform: task.platform,
      media: task.media,
      title: task.title,
      url: task.url,
      hashtag: getEffectiveHashtags(task),
      artist: task.artist || 'both',
      boost: task.boost || '',
      image: task.image || '',
      likes: task.likes || '',
      target_likes: task.target_likes || '',
      comments: task.comments || '',
      target_comments: task.target_comments || '',
      shares: task.shares || '',
      target_shares: task.target_shares || '',
      reposts: task.reposts || '',
      target_reposts: task.target_reposts || '',
      views: task.views || '',
      target_views: task.target_views || '',
      saves: task.saves || '',
      target_saves: task.target_saves || '',
      target: task.target || '',
    });
    // If the post has boost, mark, or image, auto-open boost toggle
    if (task.boost || task.mark || task.image) {
      setShowBoostSection(true);
    } else {
      setShowBoostSection(false);
    }
    // If the post has engagement data, auto-open engagement toggle
    if (task.likes || task.comments || task.shares || task.reposts || task.views || task.saves || task.target) {
      setShowEngagementSection(true);
    } else {
      setShowEngagementSection(false);
    }
    setShowAddModal(true);
  };

  // ─── Copy Hashtags ──────────────────────────────────────────────────────────
  const handleCopyHashtags = (task: AdminSheetTask) => {
    const text = getEffectiveHashtags(task);
    navigator.clipboard.writeText(text);
    setCopiedId(task.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ─── Toggle Star / Mark Status Inline ───────────────────────────────────────
  const handleToggleMark = async (task: AdminSheetTask) => {
    const newMark = !task.mark;
    setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, mark: newMark } : t)));

    try {
      await fetch('/api/admin-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRow',
          sheetGID: '0',
          data: {
            id: task.id,
            url: task.url,
            mark: newMark ? '1' : '0',
            focus: newMark ? '1' : '0',
          },
        }),
      });
      fetchData(true);
    } catch (err) {
      console.error('Failed to toggle mark:', err);
      setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, mark: task.mark } : t)));
    }
  };

  // ─── Save Global Settings & Hashtags ────────────────────────────────────────
  const handleSaveGlobalHashtags = async () => {
    setIsSubmitting(true);
    localStorage.setItem('ntf_private_access_enabled', privateAccessEnabled ? 'true' : 'false');
    localStorage.setItem('ntf_show_phase_filter', showPhaseFilter ? 'true' : 'false');
    localStorage.setItem('ntf_default_start_section', defaultStartSection);
    localStorage.setItem('ntf_show_end_credits', showEndCreditsToggle ? 'true' : 'false');
    localStorage.setItem('ntf_global_hashtags', globalHashtags);
    if (privateAccessEnabled) {
      try { sessionStorage.removeItem('ntf_auth_token'); } catch { /* ignore */ }
    }
    window.dispatchEvent(new CustomEvent('ntf_access_mode_changed', { detail: { privateEnabled: privateAccessEnabled } }));
    window.dispatchEvent(new CustomEvent('ntf_phase_filter_changed', { detail: { showPhaseFilter } }));
    window.dispatchEvent(new CustomEvent('ntf_default_section_changed', { detail: { defaultSection: defaultStartSection } }));
    window.dispatchEvent(new CustomEvent('ntf_end_credits_changed', { detail: { showEndCredits: showEndCreditsToggle } }));
    window.dispatchEvent(new CustomEvent('ntf_hashtags_changed', { detail: { hashtags: globalHashtags } }));

    // Keep formData.hashtag up to date
    setFormData(prev => ({ ...prev, hashtag: globalHashtags }));

    try {
      // 1. Update global_settings row
      await fetch('/api/admin-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRow',
          sheetGID: '0',
          data: {
            id: 'global_settings',
            mark: privateAccessEnabled,
            private_access: privateAccessEnabled,
            hashtag: globalHashtags,
            hashtags: globalHashtags,
            show_phase_filter: showPhaseFilter ? '1' : '0',
            phase_filter: showPhaseFilter ? '1' : '0',
            default_section: defaultStartSection,
            active_section: defaultStartSection,
            show_end_credits: showEndCreditsToggle ? '1' : '0',
            enable_end_credits: showEndCreditsToggle ? '1' : '0',
          },
        }),
      });

      // 1.1 Update Toggle Setting sheet (GID 755512629 / sheetName "Toggle Setting")
      try {
        await fetch('/api/admin-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateRow',
            sheetName: 'Toggle Setting',
            sheetGID: '755512629',
            data: {
              id: 'toggle_settings',
              default_section: defaultStartSection,
              active_section: defaultStartSection,
              show_phase_filter: showPhaseFilter ? '1' : '0',
              private_access: privateAccessEnabled ? '1' : '0',
              show_end_credits: showEndCreditsToggle ? '1' : '0',
              enable_end_credits: showEndCreditsToggle ? '1' : '0',
              hashtags: globalHashtags,
            },
          }),
        });
      } catch (errToggle) {
        console.warn('Failed to save to Toggle Setting sheet:', errToggle);
      }

      // 2. If syncToAllPosts is selected, update all existing posts in state and in sheet
      if (syncToAllPosts && tasks.length > 0) {
        setTasks(prev => prev.map(t => ({ ...t, hashtag: globalHashtags })));
        for (const t of tasks) {
          try {
            await fetch('/api/admin-sheet', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'updateRow',
                sheetGID: '0',
                data: {
                  id: t.id,
                  url: t.url,
                  hashtag: globalHashtags,
                  hashtags: globalHashtags,
                },
              }),
            });
          } catch (postErr) {
            console.warn(`Could not sync hashtags for post ${t.id}:`, postErr);
          }
        }
      }

      setShowConfigModal(false);
      alert(
        syncToAllPosts
          ? 'บันทึกการตั้งค่าแคมเปญ และอัปเดต Official Hashtags ให้กับทุกโพสต์เรียบร้อยแล้ว'
          : 'บันทึกการตั้งค่าแคมเปญเรียบร้อยแล้ว'
      );
      fetchData(true);
    } catch {
      alert('บันทึกลงชีตไม่สำเร็จ แต่ค่าได้ถูกตั้งในระบบเรียบร้อย');
      setShowConfigModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans pb-16">
      {/* ── Top Header ── */}
      <header className="bg-[#122D55] text-white sticky top-0 z-30 shadow-md border-b border-[#E00034]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wide leading-none">
                NamtanFilm × Levi’s
              </h1>
              <p className="text-[10px] text-sky-300/80 leading-tight mt-1">
                จัดการและนำเข้าข้อมูลโพสต์โซเชียลมีเดีย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#E00034] hover:bg-[#B40F28] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#E00034]/25 transition-all active:scale-95 hover:scale-[1.02]"
            >
              <FaPlus className="text-xs sm:text-sm" />
              <span>เพิ่มโพสต์</span>
            </button>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="text-xs px-3 py-2 rounded-xl border border-white/20 hover:bg-white/10 text-white/90 font-semibold transition-all flex items-center gap-1.5"
              >
                <span>หน้าหลัก</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-6xl mx-auto px-4 pt-4">
        {/* ── Google Integration Diagnostics Bar (Compact & Responsive) ── */}
        <div className="mb-3.5 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 sm:px-3 py-2 border border-[#9BB6D6]/35 shadow-2xs flex items-center justify-between gap-2 text-xs">
          {/* Left: Title + Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            {/* Google label — icon only on mobile */}
            <div className="flex items-center gap-1 shrink-0 pr-0.5 sm:pr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-[#122D55] text-[11.5px] whitespace-nowrap">
                <span className="hidden sm:inline">📡 Google</span>
                <span className="sm:hidden text-[12px]">📡</span>
              </span>
            </div>

            <div className="h-3 w-px bg-slate-200 hidden sm:block shrink-0" />

            {/* Badges: Mobile = icon + dot only | Desktop = full labels */}
            <div className="flex items-center gap-1 sm:gap-1.5">

              {/* 1. Campaign Sheet Status */}
              <div
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
                  connState.testing
                    ? 'bg-amber-50/60 border-amber-200 text-amber-800'
                    : connState.sheetOk
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50/60 border-rose-200 text-rose-800'
                }`}
                title={`แคมเปญ: ${connState.testing ? 'กำลังตรวจ...' : connState.sheetOk ? 'เชื่อมต่อแล้ว' : 'ขัดข้อง'}${sheetId ? ` (${sheetId})` : ''}`}
              >
                <span className="text-[10px]">📊</span>
                {/* Desktop: full text */}
                <span className="hidden sm:inline text-slate-600 font-semibold">แคมเปญ</span>
                {connState.testing ? (
                  <FaSpinner className="animate-spin text-[9px] text-amber-600" />
                ) : connState.sheetOk ? (
                  <>
                    {/* Mobile: green dot only */}
                    <span className="sm:hidden w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {/* Desktop: full label */}
                    <span className="hidden sm:flex text-emerald-700 font-bold items-center gap-0.5">
                      <FaCheckCircle className="text-emerald-500 text-[10px]" /> เชื่อมต่อ
                    </span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    <span className="hidden sm:flex text-rose-600 font-bold items-center gap-0.5">
                      <FaExclamationTriangle className="text-rose-500 text-[10px]" /> ขัดข้อง
                    </span>
                  </>
                )}
              </div>

              {/* 2. Apps Script Write Status */}
              <div
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
                  connState.testing
                    ? 'bg-amber-50/60 border-amber-200 text-amber-800'
                    : connState.gasOk
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50/70 border-amber-300 text-amber-900'
                }`}
                title={`บันทึกชีต: ${connState.testing ? 'กำลังตรวจ...' : connState.gasOk ? 'พร้อมใช้งาน' : 'รอตั้งค่าสิทธิ์'}`}
              >
                <span className="text-[10px]">⚡</span>
                <span className="hidden sm:inline text-slate-600 font-semibold">บันทึกชีต</span>
                {connState.testing ? (
                  <FaSpinner className="animate-spin text-[9px] text-amber-600" />
                ) : connState.gasOk ? (
                  <>
                    <span className="sm:hidden w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="hidden sm:flex text-emerald-700 font-bold items-center gap-0.5">
                      <FaCheckCircle className="text-emerald-500 text-[10px]" /> พร้อม
                    </span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span className="hidden sm:flex text-amber-800 font-bold items-center gap-0.5">
                      <FaExclamationTriangle className="text-amber-600 text-[10px]" /> รอสิทธิ์
                    </span>
                  </>
                )}
              </div>

              {/* 3. Word Randomizer Status */}
              <div
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
                  connState.testing
                    ? 'bg-amber-50/60 border-amber-200 text-amber-800'
                    : connState.wordsOk
                    ? 'bg-purple-50/50 border-purple-200 text-purple-800'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
                title={
                  connState.wordsOk
                    ? `สุ่มคำ: เชื่อมต่อแล้ว (${connState.wordsCount} คำ)`
                    : 'สุ่มคำ: ยังไม่ได้เชื่อมต่อ'
                }
              >
                <span className="text-[10px]">🎲</span>
                <span className="hidden sm:inline text-slate-600 font-semibold">สุ่มคำ</span>
                {connState.testing ? (
                  <FaSpinner className="animate-spin text-[9px] text-amber-600" />
                ) : connState.wordsOk ? (
                  <>
                    <span className="sm:hidden w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="hidden sm:flex text-purple-700 font-bold items-center gap-0.5">
                      <FaCheckCircle className="text-purple-500 text-[10px]" /> เชื่อมต่อ{connState.wordsCount > 0 && <span className="text-purple-500 font-medium ml-0.5">({connState.wordsCount})</span>}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="sm:hidden w-2 h-2 rounded-full bg-rose-400 inline-block" />
                    <span className="hidden sm:flex text-slate-500 font-semibold items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" /> ยังไม่เชื่อม
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {connState.gasOk === false && (
              <button
                onClick={() => setShowPermissionGuide(true)}
                className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap"
              >
                <span className="hidden sm:inline">📖 แก้สิทธิ์</span>
                <span className="sm:hidden text-[12px]">📖</span>
              </button>
            )}
            <button
              onClick={() => {
                fetchData();
                testGoogleConnections();
              }}
              disabled={connState.testing}
              className="px-1.5 sm:px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center gap-1 transition-all shadow-2xs active:scale-95 disabled:opacity-50 whitespace-nowrap"
              title="ตรวจสอบสถานะการเชื่อมต่อใหม่"
            >
              <FaSync className={`text-[10px] text-slate-400 ${connState.testing ? 'animate-spin text-[#122D55]' : ''}`} />
              <span className="hidden sm:inline">ตรวจเช็ค</span>
            </button>
          </div>
        </div>

        {/* Warning Callout when GAS permission is restricted */}
        {connState.gasOk === false && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <div className="font-bold text-xs sm:text-sm text-amber-950">
                  ระบบหลังบ้านยังไม่สามารถบันทึกข้อมูลลง Google Sheet ได้ (ติดสิทธิ์การเข้าถึงของ Google)
                </div>
                <div className="text-[11px] sm:text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                  Google Apps Script ของคุณถูกตั้งสิทธิ์ไว้เป็น <strong>"เฉพาะฉัน" (Only myself)</strong> จึงต้องเปลี่ยนเป็น <strong>"ทุกคน" (Anyone)</strong> ข้อมูลจึงจะเขียนลงชีตได้
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPermissionGuide(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap shadow transition"
            >
              เปิดดูวิธีแก้ไข 3 สเต็ป
            </button>
          </div>
        )}


        {/* ── Search & Filter Controls ── */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-[#9BB6D6]/40 shadow-sm mb-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อสื่อ, หัวข้อโพสต์, URL หรือแฮชแท็ก..."
              className="w-full bg-[#F0F4F8]/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm outline-none border border-[#9BB6D6]/40 focus:border-[#122D55] text-[#122D55]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>

          {/* ── Mobile Filters (md:hidden) ── */}
          <div className="space-y-2 md:hidden">
            {/* Platform Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#122D55]">
                  <span>📱</span>
                  <span>แพลตฟอร์ม (Platform)</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  {filterPlatform === 'all'
                    ? `ทั้งหมด ${tasks.length} รายการ`
                    : `${tasks.filter(t => t.platform === filterPlatform).length} รายการ`}
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-sm">
                  {PLATFORM_OPTIONS.find(p => p.id === filterPlatform)?.icon || (
                    <span className="text-gray-400 text-xs">🌐</span>
                  )}
                </div>
                <select
                  value={filterPlatform}
                  onChange={e => setFilterPlatform(e.target.value)}
                  className="w-full appearance-none bg-[#F0F4F8] border border-[#9BB6D6]/40 rounded-xl pl-9 pr-9 py-2 text-xs font-bold text-[#122D55] outline-none focus:bg-white focus:border-[#122D55] focus:ring-1 focus:ring-[#122D55] transition-all shadow-xs"
                >
                  {PLATFORM_OPTIONS.map(p => {
                    const count = p.id === 'all' ? tasks.length : tasks.filter(t => t.platform === p.id).length;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.label} ({count})
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <FaChevronDown className="text-xs" />
                </div>
              </div>
            </div>

            {/* 2-Column Grid: Artist & Special Status on Mobile */}
            <div className="grid grid-cols-2 gap-2">
              {/* Artist Category Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[#122D55] truncate">
                    <span>🏷️</span>
                    <span>หมวดหมู่</span>
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={filterArtist}
                    onChange={e => setFilterArtist(e.target.value)}
                    className="w-full appearance-none bg-[#F0F4F8] border border-[#9BB6D6]/40 rounded-xl px-3 pr-7 py-2 text-xs font-bold text-[#122D55] outline-none focus:bg-white focus:border-[#122D55] focus:ring-1 focus:ring-[#122D55] transition-all shadow-xs truncate"
                  >
                    <option value="all">ทั้งหมด ({tasks.length})</option>
                    {ARTIST_CATEGORIES.map(cat => {
                      const count = tasks.filter(t => t.artist === cat.id).length;
                      return (
                        <option key={cat.id} value={cat.id}>
                          {cat.label} ({count})
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <FaChevronDown className="text-[10px]" />
                  </div>
                </div>
              </div>

              {/* Boost & Special Status Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[#122D55] truncate">
                    <span>⚡</span>
                    <span>สถานะพิเศษ</span>
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={filterBoost}
                    onChange={e => setFilterBoost(e.target.value as any)}
                    className="w-full appearance-none bg-[#F0F4F8] border border-[#9BB6D6]/40 rounded-xl px-3 pr-7 py-2 text-xs font-bold text-[#122D55] outline-none focus:bg-white focus:border-[#122D55] focus:ring-1 focus:ring-[#122D55] transition-all shadow-xs truncate"
                  >
                    <option value="all">ทั้งหมด ({tasks.length})</option>
                    <option value="boost">
                      🚀 เฉพาะ Boost ({tasks.filter(t => t.boost && (t.boost.includes('1') || t.boost.toLowerCase() === 'x' || t.boost.toLowerCase() === 'yes')).length})
                    </option>
                    <option value="media">
                      🎬 เฉพาะสื่อสำคัญ ({tasks.filter(t => t.boost && t.boost.includes('2')).length})
                    </option>
                    <option value="pinned">
                      📌 เฉพาะปักหมุด ({tasks.filter(t => t.boost && (t.boost.includes('3') || t.boost.toLowerCase().includes('pin'))).length})
                    </option>
                    <option value="marked">
                      ⭐ เฉพาะติดดาว ({tasks.filter(t => t.mark).length})
                    </option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <FaChevronDown className="text-[10px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Desktop Filter Pills (hidden md:block) ── */}
          <div className="hidden md:block space-y-2">
            {/* Platform filter pills */}
            <div ref={attachScrollHandlers} className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none cursor-grab active:cursor-grabbing">
              <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap mr-1">Platform:</span>
              <button
                onClick={() => setFilterPlatform('all')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  filterPlatform === 'all'
                    ? 'bg-[#122D55] text-white border-[#122D55] shadow-xs'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                ทั้งหมด ({tasks.length})
              </button>
              {PLATFORM_OPTIONS.filter(p => p.id !== 'all').map(p => {
                const count = tasks.filter(t => t.platform === p.id).length;
                const isActive = filterPlatform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setFilterPlatform(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      isActive
                        ? 'bg-[#122D55] text-white border-[#122D55] shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p.icon}
                    <span>{p.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Artist filter pills */}
            <div ref={attachScrollHandlers} className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-100 no-scrollbar select-none cursor-grab active:cursor-grabbing">
              <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap mr-1">หมวดหมู่:</span>
              <button
                onClick={() => setFilterArtist('all')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  filterArtist === 'all' ? 'bg-[#122D55] text-white border-[#122D55] shadow-xs' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                ทั้งหมด
              </button>
              {ARTIST_CATEGORIES.map(cat => {
                const count = tasks.filter(t => t.artist === cat.id).length;
                const isActive = filterArtist === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterArtist(cat.id)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      isActive ? `${cat.badgeColor} border-transparent shadow-xs` : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat.label}</span> ({count})
                  </button>
                );
              })}
            </div>

            {/* Boost & Priority filter pills */}
            <div ref={attachScrollHandlers} className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-gray-100 no-scrollbar select-none cursor-grab active:cursor-grabbing">
              <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap mr-1">สถานะพิเศษ:</span>
              <button
                onClick={() => setFilterBoost('all')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  filterBoost === 'all' ? 'bg-[#122D55] text-white border-[#122D55] shadow-xs' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterBoost('boost')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1 ${
                  filterBoost === 'boost' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/60'
                }`}
              >
                <FaRocket className="text-[10px]" />
                <span>เฉพาะ Boost ({tasks.filter(t => t.boost && (t.boost.includes('1') || t.boost.toLowerCase() === 'x' || t.boost.toLowerCase() === 'yes')).length})</span>
              </button>
              <button
                onClick={() => setFilterBoost('media')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1 ${
                  filterBoost === 'media' ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100/60'
                }`}
              >
                <span>🎬</span>
                <span>สื่อสำคัญ ({tasks.filter(t => t.boost && t.boost.includes('2')).length})</span>
              </button>
              <button
                onClick={() => setFilterBoost('pinned')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1 ${
                  filterBoost === 'pinned' ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/60'
                }`}
              >
                <span>📌</span>
                <span>ปักหมุด ({tasks.filter(t => t.boost && (t.boost.includes('3') || t.boost.toLowerCase().includes('pin'))).length})</span>
              </button>
              <button
                onClick={() => setFilterBoost('marked')}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1 ${
                  filterBoost === 'marked' ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <FaStar className="text-[10px] text-amber-500" />
                <span>เฉพาะติดดาว ({tasks.filter(t => t.mark).length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Table & Cards List ── */}
        {loading ? (
          <div className="text-center py-16">
            <FaSpinner className="animate-spin text-3xl text-[#122D55] mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">กำลังโหลดข้อมูลจาก Google Sheet...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm font-bold text-gray-700">ไม่พบรายการโพสต์ที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มโพสต์" เพื่อเริ่มนำเข้าข้อมูล</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#9BB6D6]/40 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F0F4F8] border-b border-gray-200 text-[#122D55] font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">ดาว</th>
                    <th className="py-3 px-3 w-14 text-center">Platform</th>
                    <th className="py-3 px-3">สื่อ</th>
                    <th className="py-3 px-3 w-28">ศิลปิน</th>
                    <th className="py-3 px-3 w-20 text-center">URL</th>
                    <th className="py-3 px-3 text-right w-28">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTasks.map((task, idx) => {
                    const artistBadge = (task.artist && ALL_KNOWN_ARTIST_BADGES[task.artist]) || ARTIST_CATEGORIES.find(c => c.id === task.artist) || ARTIST_CATEGORIES[0];
                    const isExpanded = expandedEngagementIds.has(task.id);
                    const hasEngagement = Boolean(
                      task.likes || task.target_likes || task.comments || task.target_comments ||
                      task.reposts || task.target_reposts || task.views || task.target_views ||
                      task.shares || task.target_shares || task.saves || task.target_saves
                    );

                    return (
                      <React.Fragment key={task.id || idx}>
                        <tr className={`hover:bg-sky-50/40 transition-colors group ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                          {/* Star Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleMark(task)}
                              className="p-1 rounded-md hover:bg-amber-100/60 transition-colors inline-flex items-center justify-center cursor-pointer"
                              title={task.mark ? 'คลิกเพื่อเอาดาวออก' : 'คลิกเพื่อติดดาวสนใจพิเศษ'}
                            >
                              {task.mark ? (
                                <FaStar className="text-amber-500 text-sm drop-shadow-xs" />
                              ) : (
                                <span className="text-gray-300 text-sm hover:text-amber-400 transition-colors">☆</span>
                              )}
                            </button>
                          </td>

                          {/* Platform Icon Only */}
                          <td className="py-3 px-3 text-center">
                            <span
                              title={task.platform}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-200/80 shadow-2xs"
                            >
                              {getPlatformIcon(task.platform)}
                            </span>
                          </td>

                          {/* Media / Title */}
                          <td className="py-3 px-3 font-medium text-gray-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#122D55]">{task.media || 'ไม่มีชื่อสื่อ'}</span>
                              {task.boost && (task.boost.includes('1') || task.boost.toLowerCase() === 'x' || task.boost.toLowerCase() === 'yes') && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-amber-500/15 text-amber-700 border border-amber-500/30" title="Boost Carousel">
                                  🚀
                                </span>
                              )}
                              {task.boost && task.boost.includes('2') && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-purple-500/15 text-purple-700 border border-purple-500/30" title="Media (สื่อสำคัญ)">
                                  🎬
                                </span>
                              )}
                              {task.boost && (task.boost.includes('3') || task.boost.toLowerCase().includes('pin')) && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-blue-500/15 text-blue-700 border border-blue-500/30" title="ปักหมุด (Pinned)">
                                  📌
                                </span>
                              )}
                              {task.image && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200" title="มีรูปภาพ">
                                  🖼️
                                </span>
                              )}
                              {task.target && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30" title={`เป้าหมาย: ${task.target}`}>
                                  🎯 {task.target}
                                </span>
                              )}

                              {/* Engagement Dropdown Trigger Button (Icon Only - No Text) */}
                              {hasEngagement && (
                                <button
                                  type="button"
                                  onClick={() => toggleEngagementDropdown(task.id)}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                    isExpanded
                                      ? 'bg-[#122D55] text-white border-[#122D55] shadow-xs'
                                      : 'bg-indigo-50/90 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
                                  }`}
                                  title={isExpanded ? 'ย่อซ่อนสถิติ Engagement' : 'ดูรายละเอียด Engagement และเป้าหมาย'}
                                >
                                  <FaChartBar className="text-[10px]" />
                                  <FaChevronDown className={`text-[8px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Artist Badge */}
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${artistBadge.badgeColor}`}>
                              {artistBadge.label.split(' ')[1] || artistBadge.label}
                            </span>
                          </td>

                          {/* URL + Copy (Icon Only) */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <a
                                href={task.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all inline-flex items-center justify-center"
                                title={task.url}
                              >
                                <FaExternalLinkAlt className="text-xs" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyHashtags(task)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all inline-flex items-center justify-center"
                                title="คัดลอกแฮชแท็ก"
                              >
                                {copiedId === task.id ? <FaCheck className="text-emerald-500 text-xs" /> : <FaCopy className="text-xs" />}
                              </button>
                            </div>
                          </td>

                          {/* Actions (Edit + Delete) */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditClick(task)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-[#122D55] hover:bg-gray-100 transition-all inline-flex items-center justify-center"
                                title="แก้ไขโพสต์"
                              >
                                <FaPencilAlt className="text-xs" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePost(task.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#E00034] hover:bg-red-50 transition-all inline-flex items-center justify-center"
                                title="ลบโพสต์"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Dropdown Engagement Details Row */}
                        {isExpanded && (
                          <tr key={`${task.id || idx}-engagement`} className="bg-gradient-to-r from-slate-50 via-indigo-50/20 to-slate-50 border-b border-indigo-100/70 animate-in fade-in slide-in-from-top-1 duration-200">
                            <td colSpan={6} className="py-3 px-4 sm:px-6">
                              <div className="bg-white/95 rounded-xl p-3.5 border border-indigo-100 shadow-xs space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-[#122D55] flex items-center gap-1.5">
                                      <FaChartBar className="text-[#E00034]" />
                                      <span>สถิติ Engagement & ความคืบหน้าเป้าหมาย</span>
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                      • {task.media || 'สื่อ'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleEngagementDropdown(task.id)}
                                    className="text-[10px] text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded-full hover:bg-gray-100 font-semibold transition-colors"
                                  >
                                    ✕ ย่อเก็บ
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-0.5">
                                  {renderDropdownMetricCard('❤️ ไลก์ (Likes)', task.likes, task.target_likes, 'rose')}
                                  {renderDropdownMetricCard('💬 คอมเมนต์', task.comments, task.target_comments, 'blue')}
                                  {renderDropdownMetricCard('🔄 รีโพสต์ / RT', task.reposts, task.target_reposts, 'emerald')}
                                  {renderDropdownMetricCard('👁️ ยอดวิว (Views)', task.views, task.target_views, 'purple')}
                                  {renderDropdownMetricCard('↗️ แชร์ (Shares)', task.shares, task.target_shares, 'amber')}
                                  {renderDropdownMetricCard('🔖 บันทึก (Saves)', task.saves, task.target_saves, 'teal')}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal: Add / Edit Post ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl max-h-[80dvh] sm:max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative">
            <div className="bg-[#122D55] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#E00034] text-white text-[10px] font-black tracking-wider">
                  LEVI'S
                </span>
                <h3 className="font-bold text-sm sm:text-base">
                  {editingTaskId ? 'แก้ไขโพสต์และสถิติ (Edit Post & Metrics)' : 'นำเข้าโพสต์ใหม่ (Add Mission)'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitPost} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* URL with Duplicate Check */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  URL ของโพสต์โซเชียล <span className="text-[#E00034]">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={e => {
                    const newUrl = e.target.value;
                    const detected = detectPlatformFromUrl(newUrl);
                    setFormData(prev => ({
                      ...prev,
                      url: newUrl,
                      platform: detected,
                    }));
                  }}
                  placeholder="https://x.com/username/status/... หรือ Instagram, TikTok"
                  className={`w-full bg-[#F0F4F8] rounded-xl px-3.5 py-2.5 text-xs outline-none border transition-all ${
                    isUrlDuplicate
                      ? 'border-[#E00034] ring-2 ring-[#E00034]/20'
                      : 'border-gray-200 focus:border-[#122D55]'
                  }`}
                />
                {isUrlDuplicate && (
                  <p className="text-[#E00034] text-[11px] font-bold mt-1">
                    ⚠️ ตรวจพบ URL ซ้ำในระบบ กรุณาตรวจสอบลิงก์อีกครั้ง
                  </p>
                )}
              </div>

              {/* Platform & Artist Category Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Platform</label>
                  <select
                    value={formData.platform}
                    onChange={e => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full bg-[#F0F4F8] rounded-xl px-3 py-2 text-xs outline-none border border-gray-200 focus:border-[#122D55]"
                  >
                    {PLATFORM_OPTIONS.filter(p => p.id !== 'all').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">หมวดหมู่ศิลปิน</label>
                  <select
                    value={formData.artist}
                    onChange={e => setFormData({ ...formData, artist: e.target.value })}
                    className="w-full bg-[#F0F4F8] rounded-xl px-3 py-2 text-xs outline-none border border-gray-200 focus:border-[#122D55]"
                  >
                    {ARTIST_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Media Name with Autosuggest */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อสื่อ / แหล่งที่มา (Media Name) <span className="text-[#E00034]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.media}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={e => setFormData({ ...formData, media: e.target.value })}
                  placeholder="เช่น Mint Magazine, ELLE Thailand, GMMTV, ข่าวสด..."
                  className="w-full bg-[#F0F4F8] rounded-xl px-3.5 py-2.5 text-xs outline-none border border-gray-200 focus:border-[#122D55]"
                />

                {/* Auto-suggest dropdown */}
                {showSuggestions && mediaSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                    <div className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400">
                      ชื่อสื่อที่เคยใช้บ่อย:
                    </div>
                    {mediaSuggestions.map((name, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => {
                          setFormData({ ...formData, media: name });
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-sky-50 text-gray-800 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags (Right after Media Name) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">แฮชแท็กที่ใช้ (Hashtags)</label>
                <textarea
                  rows={2}
                  value={formData.hashtag}
                  onChange={e => setFormData({ ...formData, hashtag: e.target.value })}
                  placeholder="#NamtanFilmxLevis #LiveInLevis"
                  className="w-full bg-[#F0F4F8] rounded-xl px-3.5 py-2 text-xs outline-none border border-gray-200 focus:border-[#122D55] font-mono leading-relaxed"
                />
              </div>

              {/* Primary Action Buttons (Right after Hashtags & Media Name) */}
              <div className="flex items-center justify-end gap-2 pt-1 pb-1 border-b border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUrlDuplicate || !formData.url.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#122D55] hover:bg-[#0B192C] text-white shadow transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin text-xs" />
                      กำลังบันทึก...
                    </>
                  ) : editingTaskId ? (
                    'อัปเดตข้อมูล'
                  ) : (
                    'บันทึกลงชีต'
                  )}
                </button>
              </div>

              {/* Status feedback */}
              {statusMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}

              {/* ── Toggle Section 1: Boost & Special Status ── */}
              <div className="rounded-2xl border border-amber-300/60 overflow-hidden bg-gradient-to-r from-amber-50/60 via-white to-indigo-50/40 shadow-2xs transition-all">
                {/* Header Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowBoostSection(!showBoostSection)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-amber-100/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600">
                      <FaRocket className="text-xs" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#122D55] flex items-center gap-2">
                        <span>การบูสแคมเปญ & สถานะพิเศษ (Boost & Status)</span>
                        {(formData.boost || formData.mark || formData.image) && (
                          <span className="text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                            เปิดใช้งาน
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        ตั้งค่า Boost Carousel, ติดแท็กสื่อสำคัญ, ภารกิจติดดาว และรูป Thumbnail
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <span className="text-[11px] font-semibold">
                      {showBoostSection ? 'ย่อเก็บ' : 'ตั้งค่า'}
                    </span>
                    <FaChevronDown className={`text-[10px] transition-transform duration-200 ${showBoostSection ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Collapsible Content */}
                {showBoostSection && (
                  <div className="p-4 pt-2 border-t border-amber-200/60 space-y-3.5 bg-white/70 animate-in fade-in duration-200">
                    {/* Interactive Checkmark Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {/* 1. Boost Carousel */}
                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          Boolean(formData.boost && (formData.boost.includes('1') || formData.boost.toLowerCase() === 'x' || formData.boost.toLowerCase() === 'yes'))
                            ? 'bg-amber-500/15 border-amber-400 text-amber-950 ring-1 ring-amber-400 shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 text-amber-600 rounded accent-amber-500 shrink-0"
                          checked={Boolean(formData.boost && (formData.boost.includes('1') || formData.boost.toLowerCase() === 'x' || formData.boost.toLowerCase() === 'yes'))}
                          onChange={e => {
                            const is1 = e.target.checked;
                            const is2 = Boolean(formData.boost && formData.boost.includes('2'));
                            const is3 = Boolean(formData.boost && (formData.boost.includes('3') || formData.boost.toLowerCase().includes('pin')));
                            const parts: string[] = [];
                            if (is1) parts.push('1');
                            if (is2) parts.push('2');
                            if (is3) parts.push('3');
                            setFormData({ ...formData, boost: parts.join(',') });
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>🚀</span>
                            <span>Boost Carousel</span>
                          </div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            แสดงการ์ดเด่นแถบสไลด์หน้าแรก
                          </div>
                        </div>
                      </label>

                      {/* 2. Important Media */}
                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          Boolean(formData.boost && formData.boost.includes('2'))
                            ? 'bg-purple-500/15 border-purple-400 text-purple-950 ring-1 ring-purple-400 shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 text-purple-600 rounded accent-purple-500 shrink-0"
                          checked={Boolean(formData.boost && formData.boost.includes('2'))}
                          onChange={e => {
                            const is1 = Boolean(formData.boost && (formData.boost.includes('1') || formData.boost.toLowerCase() === 'x' || formData.boost.toLowerCase() === 'yes'));
                            const is2 = e.target.checked;
                            const is3 = Boolean(formData.boost && (formData.boost.includes('3') || formData.boost.toLowerCase().includes('pin')));
                            const parts: string[] = [];
                            if (is1) parts.push('1');
                            if (is2) parts.push('2');
                            if (is3) parts.push('3');
                            setFormData({ ...formData, boost: parts.join(',') });
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>🎬</span>
                            <span>สื่อสำคัญ (Media)</span>
                          </div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            ติดแท็กสื่อไฮไลต์ของแคมเปญ
                          </div>
                        </div>
                      </label>

                      {/* 3. Star / Focus Mission */}
                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          formData.mark
                            ? 'bg-[#E00034]/10 border-[#E00034]/40 text-red-950 ring-1 ring-[#E00034]/30 shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 text-[#E00034] rounded accent-[#E00034] shrink-0"
                          checked={formData.mark}
                          onChange={e => setFormData({ ...formData, mark: e.target.checked })}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs flex items-center gap-1">
                            <FaStar className="text-amber-500 text-[11px]" />
                            <span>ภารกิจสำคัญ (Focus)</span>
                          </div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            ติดดาวโฟกัสอันดับต้นๆ
                          </div>
                        </div>
                      </label>

                      {/* 4. Pinned Post */}
                      <label
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                          Boolean(formData.boost && (formData.boost.includes('3') || formData.boost.toLowerCase().includes('pin')))
                            ? 'bg-blue-500/15 border-blue-400 text-blue-950 ring-1 ring-blue-400 shadow-2xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 text-blue-600 rounded accent-blue-500 shrink-0"
                          checked={Boolean(formData.boost && (formData.boost.includes('3') || formData.boost.toLowerCase().includes('pin')))}
                          onChange={e => {
                            const is1 = Boolean(formData.boost && (formData.boost.includes('1') || formData.boost.toLowerCase() === 'x' || formData.boost.toLowerCase() === 'yes'));
                            const is2 = Boolean(formData.boost && formData.boost.includes('2'));
                            const is3 = e.target.checked;
                            const parts: string[] = [];
                            if (is1) parts.push('1');
                            if (is2) parts.push('2');
                            if (is3) parts.push('3');
                            setFormData({ ...formData, boost: parts.join(',') });
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>📌</span>
                            <span>ปักหมุด (Pinned)</span>
                          </div>
                          <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                            แสดงหน้าภารกิจทั้งหมดแต่อยู่บนสุดเสมอ
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* ── Image Upload & Link Section ── */}
                    <div className="pt-3 border-t border-amber-200/50 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="block text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                          <FaImage className="text-indigo-600 text-xs" />
                          <span>รูปภาพหน้าปก / Thumbnail (สำหรับ Boost & สื่อสำคัญ)</span>
                        </label>
                        {/* Tabs: Upload / URL */}
                        <div className="flex bg-white rounded-lg p-0.5 border border-amber-300/60 text-[10px] font-bold shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setImageTab('upload')}
                            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                              imageTab === 'upload'
                                ? 'bg-[#122D55] text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <FaCloudUploadAlt className="text-xs" />
                            <span>อัปโหลดรูป (Catbox)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageTab('url')}
                            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                              imageTab === 'url'
                                ? 'bg-[#122D55] text-white shadow-xs'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <FaLink className="text-[10px]" />
                            <span>แปะลิงก์รูป (URL)</span>
                          </button>
                        </div>
                      </div>

                      {/* Tab 1: Upload */}
                      {imageTab === 'upload' && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) handleImageFileUpload(file);
                            }}
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleImageFileUpload(file);
                            }}
                            className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition-all ${
                              isUploadingImage
                                ? 'border-indigo-400 bg-indigo-50/70'
                                : 'border-amber-300/80 hover:border-[#122D55] bg-white hover:bg-amber-50/30 shadow-2xs'
                            }`}
                          >
                            {isUploadingImage ? (
                              <div className="flex flex-col items-center justify-center py-2 text-indigo-600 gap-1.5">
                                <FaSpinner className="animate-spin text-xl text-indigo-600" />
                                <span className="text-xs font-bold">กำลังบีบอัดและอัปโหลดขึ้น Catbox Cloud...</span>
                                <span className="text-[10px] text-gray-500">กรุณารอสักครู่ (ประมาณ 1-2 วินาที)</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-1 text-gray-600 gap-1">
                                <FaCloudUploadAlt className="text-2xl text-[#122D55]" />
                                <div className="text-[11.5px] font-bold text-[#122D55]">
                                  คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่
                                </div>
                                <div className="text-[9.5px] text-gray-500">
                                  รองรับ PNG, JPG, WebP (ระบบบีบอัดและอัปโหลดเข้า Catbox Cloud ให้อัตโนมัติ รูปขึ้น 100%)
                                </div>
                              </div>
                            )}
                          </div>
                          {imageUploadError && (
                            <div className="text-[10px] text-rose-600 font-bold mt-1.5 flex items-center gap-1 bg-rose-50 p-2 rounded-lg border border-rose-200">
                              <FaExclamationTriangle className="text-xs shrink-0" />
                              <span>{imageUploadError}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 2: Paste URL */}
                      {imageTab === 'url' && (
                        <div className="space-y-1">
                          <div className="relative">
                            <input
                              type="url"
                              value={formData.image}
                              onChange={e => {
                                const val = e.target.value;
                                setFormData({ ...formData, image: normalizeImageUrl(val) });
                                setImageLoadStatus('loading');
                              }}
                              placeholder="แปะลิงก์รูปภาพ เช่น https://files.catbox.moe/... หรือ https://...jpg"
                              className="w-full bg-white rounded-xl pl-8 pr-3 py-2 text-xs outline-none border border-amber-300/70 focus:border-[#122D55] text-gray-800 font-mono shadow-2xs"
                            />
                            <FaLink className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                          </div>
                          <p className="text-[9.5px] text-gray-500 leading-tight">
                            *รองรับ Direct Link (.jpg, .png, .webp) หรือลิงก์จาก Twitter/X, Instagram, Imgur, Pinterest
                          </p>
                        </div>
                      )}

                      {/* Live Image Preview & Validation Box */}
                      {formData.image && (
                        <div className="bg-white rounded-xl p-3 border border-amber-300/80 shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
                            <span className="font-bold text-gray-700 flex items-center gap-1.5">
                              <span>ตัวอย่างภาพ (Live Preview):</span>
                              {imageLoadStatus === 'success' && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <FaCheck className="text-[9px]" /> โหลดรูปได้สำเร็จ ✅
                                </span>
                              )}
                              {imageLoadStatus === 'error' && (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <FaTimes className="text-[9px]" /> ลิงก์รูปภาพไม่แสดงผล ⚠️
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, image: '' });
                                setImageLoadStatus('idle');
                              }}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 hover:underline"
                            >
                              <FaTrash className="text-[9px]" />
                              <span>ลบรูปภาพ</span>
                            </button>
                          </div>

                          <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-900/5 h-36 flex items-center justify-center group/prev">
                            <img
                              src={formData.image}
                              alt="Boost Preview"
                              className="w-full h-full object-cover object-top"
                              style={{ objectPosition: 'top center' }}
                              referrerPolicy="no-referrer"
                              onLoad={() => setImageLoadStatus('success')}
                              onError={() => setImageLoadStatus('error')}
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover/prev:opacity-100 transition-opacity">
                              <a
                                href={formData.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-black/75 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm backdrop-blur-xs"
                              >
                                <FaExternalLinkAlt className="text-[9px]" />
                                <span>ดูภาพขนาดเต็ม</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Section Internal Update Button */}
                    <div className="flex items-center justify-end pt-2 border-t border-amber-200/60">
                      <button
                        type="submit"
                        disabled={isSubmitting || isUrlDuplicate || !formData.url.trim()}
                        className="px-4 py-1.5 rounded-xl text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <>
                            <FaSpinner className="animate-spin text-xs" />
                            กำลังบันทึก...
                          </>
                        ) : (
                          <>
                            <FaCheck className="text-[10px]" />
                            <span>อัปเดตสถานะ Boost & สื่อ</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Toggle Section 2: Engagement Metrics & Individual Targets ── */}
              <div className="rounded-2xl border border-[#9BB6D6]/60 overflow-hidden bg-[#F0F4F8] shadow-2xs transition-all">
                {/* Header Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowEngagementSection(!showEngagementSection)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-50/70 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600">
                      <FaBullseye className="text-xs" />
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#122D55] flex items-center gap-2">
                        <span>กำหนดเป้าหมาย & สถิติ Engagement แต่ละข้อ</span>
                        {(formData.likes || formData.comments || formData.reposts || formData.shares || formData.views || formData.saves) && (
                          <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded-full">
                            มีข้อมูลสถิติ
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        กรอกยอดปัจจุบันและเป้าหมายแยกแต่ละข้อ (ไลก์, คอมเมนต์, รีโพสต์, แชร์, วิว, เซฟ)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#122D55]">
                    <span className="text-[11px] font-semibold">
                      {showEngagementSection ? 'ย่อเก็บ' : 'ตั้งค่า'}
                    </span>
                    <FaChevronDown className={`text-[10px] transition-transform duration-200 ${showEngagementSection ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Collapsible Content */}
                {showEngagementSection && (
                  <div className="p-4 pt-2 border-t border-[#9BB6D6]/40 space-y-3.5 bg-white/60 animate-in fade-in duration-200">
                    <p className="text-[11px] text-gray-600 leading-snug">
                      กำหนดเป้าหมายแยกแต่ละหัวข้อและอัพเดทยอดปัจจุบัน ระบบจะคำนวณ % ความคืบหน้าและแสดงหลอดความคืบหน้าให้แฟนคลับแบบ Real-time
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        {
                          key: 'likes' as const,
                          targetKey: 'target_likes' as const,
                          label: '❤️ ไลก์ (Likes)',
                          icon: <FaHeart className="text-rose-500" />,
                          placeholderCurr: 'เช่น 12.5k',
                          placeholderTgt: 'เช่น 50k',
                          borderColor: 'border-rose-200 hover:border-rose-300',
                          barColor: 'bg-rose-500',
                        },
                        {
                          key: 'comments' as const,
                          targetKey: 'target_comments' as const,
                          label: '💬 คอมเมนต์ (Comments)',
                          icon: <FaComment className="text-blue-500" />,
                          placeholderCurr: 'เช่น 350',
                          placeholderTgt: 'เช่น 2k',
                          borderColor: 'border-blue-200 hover:border-blue-300',
                          barColor: 'bg-blue-500',
                        },
                        {
                          key: 'reposts' as const,
                          targetKey: 'target_reposts' as const,
                          label: '🔄 รีโพสต์ / RT (Reposts)',
                          icon: <FaRetweet className="text-emerald-500" />,
                          placeholderCurr: 'เช่น 4.2k',
                          placeholderTgt: 'เช่น 10k',
                          borderColor: 'border-emerald-200 hover:border-emerald-300',
                          barColor: 'bg-emerald-500',
                        },
                        {
                          key: 'shares' as const,
                          targetKey: 'target_shares' as const,
                          label: '↗️ แชร์ (Shares)',
                          icon: <FaShareAlt className="text-amber-500" />,
                          placeholderCurr: 'เช่น 180',
                          placeholderTgt: 'เช่น 1k',
                          borderColor: 'border-amber-200 hover:border-amber-300',
                          barColor: 'bg-amber-500',
                        },
                        {
                          key: 'views' as const,
                          targetKey: 'target_views' as const,
                          label: '👁️ ยอดวิว (Views)',
                          icon: <FaEye className="text-purple-500" />,
                          placeholderCurr: 'เช่น 85k',
                          placeholderTgt: 'เช่น 200k',
                          borderColor: 'border-purple-200 hover:border-purple-300',
                          barColor: 'bg-purple-500',
                        },
                        {
                          key: 'saves' as const,
                          targetKey: 'target_saves' as const,
                          label: '🔖 บันทึก (Saves)',
                          icon: <FaBookmark className="text-teal-500" />,
                          placeholderCurr: 'เช่น 920',
                          placeholderTgt: 'เช่น 3k',
                          borderColor: 'border-teal-200 hover:border-teal-300',
                          barColor: 'bg-teal-500',
                        },
                      ].map(m => {
                        const currVal = (formData as any)[m.key] || '';
                        const tgtVal = (formData as any)[m.targetKey] || '';
                        const currNum = parseAbbrNumber(currVal);
                        const tgtNum = parseAbbrNumber(tgtVal);
                        const hasTarget = tgtNum > 0;
                        const pct = hasTarget ? Math.min(Math.round((currNum / tgtNum) * 100), 100) : 0;
                        const isDone = hasTarget && currNum >= tgtNum;
                        const remaining = hasTarget && tgtNum > currNum ? tgtNum - currNum : 0;

                        return (
                          <div
                            key={m.key}
                            className={`bg-white p-3 rounded-xl border ${m.borderColor} shadow-sm transition-all space-y-2`}
                          >
                            {/* Header with Title & Badge */}
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                                {m.icon}
                                <span>{m.label}</span>
                              </span>

                              {hasTarget ? (
                                isDone ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                    <span>🎉</span> ถึงเป้าแล้ว ({pct}%)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                                    ⚡ คืบหน้า {pct}%
                                  </span>
                                )
                              ) : (
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                  ยังไม่ตั้งเป้า
                                </span>
                              )}
                            </div>

                            {/* Dual Inputs */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                                  ยอดปัจจุบัน
                                </label>
                                <input
                                  type="text"
                                  value={currVal}
                                  onChange={e => setFormData({ ...formData, [m.key]: e.target.value })}
                                  placeholder={m.placeholderCurr}
                                  className="w-full bg-[#F0F4F8]/70 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-[#122D55] text-[#122D55] font-semibold border border-transparent focus:border-[#122D55]"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                                  🎯 เป้าหมายข้อนี้
                                </label>
                                <input
                                  type="text"
                                  value={tgtVal}
                                  onChange={e => setFormData({ ...formData, [m.targetKey]: e.target.value })}
                                  placeholder={m.placeholderTgt}
                                  className="w-full bg-amber-50/50 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-amber-500 text-amber-900 font-semibold border border-amber-200/60 focus:border-amber-500"
                                />
                              </div>
                            </div>

                            {/* Live Progress Bar & Info */}
                            {hasTarget ? (
                              <div className="pt-1 space-y-1">
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/60">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : m.barColor}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-gray-500">
                                  <span>
                                    ยอดถึง: <strong className="text-gray-800 font-bold">{currVal || '0'}</strong> / {tgtVal} ({pct}%)
                                  </span>
                                  {isDone ? (
                                    <span className="text-emerald-600 font-bold">สำเร็จเรียบร้อย! ✨</span>
                                  ) : remaining > 0 ? (
                                    <span className="text-amber-700 font-semibold">ขาดอีก ~{remaining >= 1000 ? `${(remaining/1000).toFixed(1)}k` : remaining}</span>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[9px] text-gray-400 pt-0.5 text-center">
                                💡 กำหนดเป้าหมายข้อนี้เพื่อแสดงแถบความคืบหน้า
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Section Internal Update Button */}
                    <div className="flex items-center justify-end pt-2 border-t border-[#9BB6D6]/40">
                      <button
                        type="submit"
                        disabled={isSubmitting || isUrlDuplicate || !formData.url.trim()}
                        className="px-4 py-1.5 rounded-xl text-[11px] font-bold bg-[#122D55] hover:bg-[#0B192C] text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <>
                            <FaSpinner className="animate-spin text-xs" />
                            กำลังบันทึก...
                          </>
                        ) : (
                          <>
                            <FaCheck className="text-[10px]" />
                            <span>อัปเดตสถิติ Engagement</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Global Hashtags Config ── */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md max-h-[80dvh] sm:max-h-[88vh] flex flex-col rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative">
            <div className="bg-[#122D55] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FaCog className="text-sky-300" />
                <h3 className="font-bold text-sm">ตั้งค่าแฮชแท็กหลักแคมเปญ</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className="text-xs text-gray-500 leading-relaxed">
                แฮชแท็กชุดนี้จะถูกใช้เป็นค่าเริ่มต้นเมื่อเพิ่มโพสต์ใหม่ และแสดงเป็นแฮชแท็กหลักของแคมเปญ
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Official Hashtags</label>
                <textarea
                  rows={4}
                  value={globalHashtags}
                  onChange={e => setGlobalHashtags(e.target.value)}
                  className="w-full bg-[#F0F4F8] rounded-xl px-3.5 py-2.5 text-xs outline-none border border-gray-200 focus:border-[#122D55] font-mono leading-relaxed"
                />
                <div className="mt-2.5 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                  <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-amber-950 select-none">
                    <input
                      type="checkbox"
                      checked={syncToAllPosts}
                      onChange={e => setSyncToAllPosts(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-[#E00034] accent-[#E00034] shrink-0"
                    />
                    <div>
                      <span>🔄 อัปเดต Official Hashtags นี้ให้กับทุกโพสต์ในระบบด้วย</span>
                      <p className="text-[10px] font-normal text-amber-800/80 mt-0.5">
                        หากเลือก โพสต์ทั้งหมดใน Google Sheet จะถูกแทนที่ด้วยชุดแฮชแท็กนี้ทันที
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Private Access Toggle Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  โหมดการเข้าถึงเว็บแฟนคลับ (Fan Portal Access)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrivateAccessEnabled(true)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      privateAccessEnabled
                        ? 'border-[#E00034] bg-red-50/50 text-[#122D55] ring-1 ring-[#E00034]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1">🔒 Private Mode</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">ต้องกรอกรหัสผ่านเพื่อเข้าใช้งาน</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivateAccessEnabled(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !privateAccessEnabled
                        ? 'border-emerald-500 bg-emerald-50/50 text-[#122D55] ring-1 ring-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-emerald-700">🌐 Public Mode</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">เปิดเสรี ทุกคนเข้าดูได้ทันที</div>
                  </button>
                </div>
              </div>

              {/* Campaign Phase Filter Toggle Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  แถบช่วงเวลาแคมเปญ (Campaign Phase Filter)
                </label>
                <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
                  เลือกแสดงหรือซ่อนแถบ 5 ปุ่ม (All, Teaser, Event, Campaign, After) ที่หน้าแรกของเว็บแฟนคลับ หากแคมเปญรวมอยู่ในแผ่นงานเดียว แนะนำให้เลือก "ซ่อน" เพื่อให้หน้าเว็บกระชับขึ้น
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhaseFilter(true)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      showPhaseFilter
                        ? 'border-blue-500 bg-blue-50/50 text-[#122D55] ring-1 ring-blue-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-blue-700">👁️ แสดง (Show)</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">แสดงแถบปุ่มช่วงเวลาที่หน้าแรก</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPhaseFilter(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !showPhaseFilter
                        ? 'border-slate-500 bg-slate-100 text-slate-900 ring-1 ring-slate-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-slate-700">🙈 ซ่อน (Hide)</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">ซ่อนแถบช่วงเวลา หน้าเว็บกระชับ</div>
                  </button>
                </div>
              </div>

              {/* Default Active Section Toggle */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  หน้าแรก: Toggle เริ่มต้นเมื่อเข้าเว็บ (Default Active Section)
                </label>
                <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
                  เลือกปุ่มการ์ดที่ต้องการให้เปิดกางออกเป็นอันแรกทันทีเมื่อแฟนคลับเข้ามาที่หน้าเว็บ (บันทึกลง Google Sheet `Toggle Setting`)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDefaultStartSection('boost')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      defaultStartSection === 'boost'
                        ? 'border-[#E00034] bg-rose-50 text-[#122D55] ring-1 ring-[#E00034]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-[#E00034]">🔥 Boost Posts</div>
                    <div className="text-[9.5px] text-gray-500 mt-0.5">เปิดส่วน Boost Engagement</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultStartSection('tasks')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      defaultStartSection === 'tasks'
                        ? 'border-[#E00034] bg-rose-50 text-[#122D55] ring-1 ring-[#E00034]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-[#E00034]">✧ Tasks List</div>
                    <div className="text-[9.5px] text-gray-500 mt-0.5">เปิดส่วนภารกิจงานปั่น</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultStartSection('important')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      defaultStartSection === 'important'
                        ? 'border-[#E00034] bg-rose-50 text-[#122D55] ring-1 ring-[#E00034]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-[#E00034]">⭐ Focused Media</div>
                    <div className="text-[9.5px] text-gray-500 mt-0.5">เปิดส่วนสื่อสำนักข่าวสำคัญ</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDefaultStartSection('none')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      defaultStartSection === 'none'
                        ? 'border-slate-500 bg-slate-100 text-slate-900 ring-1 ring-slate-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-slate-700">🚫 ไม่เปิดค้างไว้</div>
                    <div className="text-[9.5px] text-gray-500 mt-0.5">พับปิดทุกส่วน รอผู้ใช้กดเอง</div>
                  </button>
                </div>
              </div>

              {/* End Credits Feature Toggle */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ระบบลงชื่อ & End Credits (Task Completion Credits)
                </label>
                <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
                  เปิดหรือปิดระบบป๊อปอัปฉลองเมื่อทำภารกิจครบ 100% พร้อมระบบลงชื่อแฟนคลับในฉาก End Credits และปุ่มเครดิต
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEndCreditsToggle(true)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      showEndCreditsToggle
                        ? 'border-amber-500 bg-amber-50/50 text-[#122D55] ring-1 ring-amber-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-amber-700">🎬 เปิดใช้งาน (Enabled)</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">เด้งฉลอง & ปุ่มดู Credits ทำงานตามปกติ</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEndCreditsToggle(false)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      !showEndCreditsToggle
                        ? 'border-slate-500 bg-slate-100 text-slate-900 ring-1 ring-slate-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1 text-slate-700">🚫 ปิดใช้งาน (Disabled)</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">ซ่อนปุ่มเครดิตและป๊อปอัปฉลองทั้งหมด</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                ปิด
              </button>
              <button
                onClick={handleSaveGlobalHashtags}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#E00034] hover:bg-[#B40F28] text-white shadow transition-all"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Google Permission Guide Modal ── */}
      {showPermissionGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white w-full max-w-lg max-h-[80dvh] sm:max-h-[88vh] flex flex-col rounded-3xl shadow-2xl border border-gray-200 overflow-hidden relative animate-fade-in">
            <div className="bg-[#122D55] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FaInfoCircle className="text-amber-400 text-lg" />
                <h3 className="font-bold text-sm sm:text-base">วิธีเปิดสิทธิ์ Google Apps Script</h3>
              </div>
              <button
                onClick={() => setShowPermissionGuide(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-950 text-xs leading-relaxed">
                <strong>เหตุผลที่บันทึกข้อมูลไม่ได้:</strong> ในตอนแรก Google จะตั้งค่าความปลอดภัยให้เฉพาะเจ้าของบัญชีเท่านั้นที่เรียกใช้ได้ เพื่อให้ระบบหลังบ้านสามารถส่งข้อมูลเข้ามาได้ คุณต้องตั้งค่าเป็น <strong>"ทุกคน" (Anyone)</strong> ครับ
              </div>

              <div className="space-y-3 text-xs text-gray-700">
                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-6 h-6 rounded-full bg-[#122D55] text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">เปิด Google Apps Script</div>
                    <div className="text-gray-600 mt-0.5">
                      เปิดไฟล์ Google Sheet ของคุณ แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-6 h-6 rounded-full bg-[#122D55] text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">ไปที่ จัดการการทำให้ใช้งานได้</div>
                    <div className="text-gray-600 mt-0.5">
                      คลิกปุ่มสีน้ำเงินมุมขวาบน <strong>ทำให้ใช้งานได้ (Deploy)</strong> &gt; เลือก <strong>จัดการการทำให้ใช้งานได้ (Manage deployments)</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-6 h-6 rounded-full bg-[#E00034] text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-[#E00034]">เปลี่ยนสิทธิ์เข้าถึงเป็น "ทุกคน" (สำคัญที่สุด)</div>
                    <div className="text-gray-600 mt-0.5 leading-relaxed">
                      1. คลิกไอคอน <strong>รูปดินสอ ✏️ (แก้ไข / Edit)</strong> ด้านขวาบน<br/>
                      2. ตรงช่อง <strong>เวอร์ชัน (Version)</strong>: เลือก <em>เวอร์ชันใหม่ (New version)</em><br/>
                      3. ตรงช่อง <strong>ผู้ที่มีสิทธิ์เข้าถึง (Who has access)</strong>: เปลี่ยนจาก "เฉพาะฉัน" ให้เป็น <strong>"ทุกคน" (Anyone)</strong><br/>
                      4. คลิกปุ่มสีน้ำเงิน <strong>ทำให้ใช้งานได้ (Deploy)</strong>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs">
                    4
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">ตรวจเช็ค URL ใน .env</div>
                    <div className="text-gray-600 mt-0.5">
                      นำ URL เว็บแอป (ขึ้นต้นด้วย https://script.google.com/.../exec) มาอัปเดตในไฟล์ <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">.env</code> ตรงบรรทัด <code className="bg-gray-200 px-1 py-0.5 rounded text-[11px]">VITE_GAS_URL=...</code> (หาก URL ไม่เปลี่ยนแปลง ก็ไม่ต้องแก้ไข)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
              <button
                onClick={() => setShowPermissionGuide(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
              >
                ปิดหน้าต่างนี้
              </button>
              <button
                onClick={() => {
                  setShowPermissionGuide(false);
                  testGoogleConnections();
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#122D55] hover:bg-[#0B192C] text-white shadow transition-all flex items-center gap-1.5"
              >
                <FaSync />
                <span>ตั้งค่าเสร็จแล้ว ทดสอบเชื่อมต่อ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Lightbox Full Image Preview ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] bg-[#122D55] rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3.5 px-5 bg-black/40 flex items-center justify-between text-white border-b border-white/10">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <FaImage className="text-amber-400" />
                <span>รูปภาพหน้าปก / Thumbnail</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition"
                >
                  <FaExternalLinkAlt className="text-[10px]" />
                  <span>เปิดลิงก์เต็ม</span>
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/30 overflow-auto flex-1">
              <img
                src={lightboxImage}
                alt="Enlarged preview"
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
