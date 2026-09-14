import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from './i18n/LanguageContext';
import StatsCardModal from './components/StatsCardModal';
import NameSubmitModal, { hasSubmittedCredits } from './components/NameSubmitModal';
import EndCreditsModal from './components/EndCreditsModal';


// Types
interface Task {
  id: string;
  phase: 'pre' | 'airport' | 'show' | 'aftermath' | 'aftermath2';
  platform: 'x' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'threads';
  url: string;
  hashtags: string;
  title: string;
  focus: 0 | 1 | 2; // 0 = none, 1 = focus (⭐), 2 = hot (🔥)
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  views?: number;
  saves?: number;
  target?: number; // total goal
  targetLikes?: number;
  targetComments?: number;
  targetShares?: number;
  targetReposts?: number;
  targetSaves?: number;
  targetViews?: number;
  image?: string;
  imageFileId?: string;
  boost?: number[]; // [] or [1]=boost, [2]=focus-media
}

interface CompletedState {
  [taskId: string]: {
    completedAt: string;
  };
}

// SVG Icons for social platforms
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644-.07-4.85-.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 192 192" fill="currentColor" className="w-5 h-5">
    <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.305C133.506 125.625 136.685 117.133 137.997 106.507C143.4 109.607 147.128 113.932 148.697 119.498C151.194 128.404 151.032 141.101 141.208 150.601C132.605 158.926 122.244 162.646 106.064 162.765C88.3396 162.632 74.5494 157.308 65.0463 146.951C56.0809 137.181 51.4292 122.671 51.2403 103.873C51.4292 85.0754 56.0809 70.5653 65.0463 60.7954C74.5494 50.4384 88.3396 45.1138 106.064 44.981C123.925 45.1146 137.936 50.4558 147.5 60.9508L159.19 50.2968C146.856 36.9943 129.815 30.1666 106.112 30.001C88.0218 30.1334 72.336 35.5658 60.5347 46.1069C49.6617 55.7681 43.5026 69.8135 42.7867 86.8346C42.7644 87.3604 42.7534 87.8871 42.7534 88.4142C42.7534 88.9429 42.7644 89.4696 42.7867 89.9953C43.5026 107.016 49.6617 121.062 60.5347 130.723C72.336 141.264 88.0218 146.696 106.112 146.829C106.205 146.829 106.298 146.83 106.391 146.83C124.214 146.83 138.932 141.708 149.157 132.012C161.688 120.088 161.537 104.407 157.76 95.3652C155.231 89.3717 149.459 83.8547 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z" />
  </svg>
);

// Platform configs — muted luxury tones
const platformConfig = {
  x: {
    name: 'X',
    icon: <XIcon />,
    color: 'from-slate-700 to-prada-charcoal',
    hoverColor: 'hover:from-slate-600 hover:to-prada-charcoal',
  },
  instagram: {
    name: 'IG',
    icon: <InstagramIcon />,
    color: 'from-rose-400 to-purple-500',
    hoverColor: 'hover:from-rose-300 hover:to-purple-400',
  },
  facebook: {
    name: 'FB',
    icon: <FacebookIcon />,
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:from-blue-400 hover:to-blue-500',
  },
  tiktok: {
    name: 'TT',
    icon: <TikTokIcon />,
    color: 'from-prada-charcoal to-slate-700',
    hoverColor: 'hover:from-slate-700 hover:to-prada-charcoal',
  },
  youtube: {
    name: 'YT',
    icon: <YouTubeIcon />,
    color: 'from-red-600 to-red-700',
    hoverColor: 'hover:from-red-500 hover:to-red-600',
  },
  threads: {
    name: 'Threads',
    icon: <ThreadsIcon />,
    color: 'from-zinc-800 to-black',
    hoverColor: 'hover:from-zinc-700 hover:to-zinc-900',
  },
};

// ===========================================
// ⚙️ SETTINGS - แก้ไขตรงนี้
// ===========================================
const SHEETS_CONFIG = [
  { phase: 'all', label: 'Levi\'s Campaign', gid: '0' },
  { phase: 'settings', label: 'Toggle Setting', gid: '755512629' },
];


/**
 * Parses numbers with abbreviations like 'k' or 'm' (e.g., "77.7k" -> 77700)
 */
const parseAbbreviatedNumber = (val: string): number => {
  if (!val) return 0;
  const cleanVal = val.toString().toLowerCase().trim().replace(/,/g, '');
  if (!cleanVal) return 0;

  let multiplier = 1;
  let numericPart = cleanVal;

  if (cleanVal.endsWith('k')) {
    multiplier = 1000;
    numericPart = cleanVal.slice(0, -1);
  } else if (cleanVal.endsWith('m')) {
    multiplier = 1000000;
    numericPart = cleanVal.slice(0, -1);
  }

  const result = parseFloat(numericPart) * multiplier;
  return isNaN(result) ? 0 : Math.round(result);
};

/**
 * Extracts a Google Drive file ID from a share link.
 * Supports: /file/d/ID/view and /open?id=ID formats.
 */
const extractGDriveId = (url: string): string => {
  if (!url) return '';
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return '';
};

/**
 * Returns the most reliable direct image URL for a Google Drive file.
 * In dev, routes through /api/gdrive proxy to bypass CORS.
 * In production, uses lh3 CDN directly.
 */
const gdriveImageUrl = (fileId: string): string =>
  fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : '';

const gdriveFallbackUrl = (fileId: string): string =>
  fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w600` : '';

const gdriveUcUrl = (fileId: string): string =>
  fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : '';
// ===========================================

function App() {
  const { language, setLanguage, t } = useLanguage();
  const [allTasks, setAllTasks] = useState<Record<string, Task[]>>(() => {
    try {
      const cached = localStorage.getItem('social-tracker-tasks-cache-v3');
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    return {};
  });
  const [loading, setLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('social-tracker-tasks-cache-v3');
      return !cached; // Show loading screen only if no cache
    } catch { return true; }
  });
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'message' | 'hashtags' | 'both' | null>(null);

  // Positive messages state — organized by language (Column E "completed text")
  const [msgPools, setMsgPools] = useState<Record<string, { complete: string[] }>>({
    en: { complete: [] },
    th: { complete: [] }
  });
  const [completed, setCompleted] = useState<Record<string, CompletedState>>(() => {
    try {
      const saved = localStorage.getItem('social-tracker-completed-v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved data:', e);
    }
    return {};
  });

  const [featuredFilterPlatform, setFeaturedFilterPlatform] = useState<string | null>(null);
  const [taskFilterPlatform, setTaskFilterPlatform] = useState<string | null>(null);

  // Ref for the main scrollable container
  const mainRef = useRef<HTMLElement>(null);

  // Phase and Stats State
  const [activePhase, setActivePhase] = useState<'all' | 'pre' | 'airport' | 'show' | 'aftermath'>('all');
  const [showPhaseFilter, setShowPhaseFilter] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ntf_show_phase_filter');
      if (saved !== null) return saved === 'true';
    } catch { /* ignore */ }
    return false;
  });

  useEffect(() => {
    const handlePhaseFilterChange = (e: any) => {
      if (typeof e.detail?.showPhaseFilter === 'boolean') {
        setShowPhaseFilter(e.detail.showPhaseFilter);
        if (!e.detail.showPhaseFilter) {
          setActivePhase('all');
        }
      }
    };
    window.addEventListener('ntf_phase_filter_changed', handlePhaseFilterChange);
    return () => window.removeEventListener('ntf_phase_filter_changed', handlePhaseFilterChange);
  }, []);

  const [globalHashtags, setGlobalHashtags] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ntf_global_hashtags');
      if (saved) return saved;
    } catch { /* ignore */ }
    return '#Levisxnamtanfilm\n#LevisTH\n#NamtanFilm';
  });

  useEffect(() => {
    const handleHashtagsChange = (e: any) => {
      if (typeof e.detail?.hashtags === 'string') {
        setGlobalHashtags(e.detail.hashtags);
      }
    };
    window.addEventListener('ntf_hashtags_changed', handleHashtagsChange);
    return () => window.removeEventListener('ntf_hashtags_changed', handleHashtagsChange);
  }, []);

  const [taskImagesVersion, setTaskImagesVersion] = useState(0);
  useEffect(() => {
    const handleImagesChange = () => {
      setTaskImagesVersion(v => v + 1);
    };
    window.addEventListener('ntf_task_images_changed', handleImagesChange);
    return () => window.removeEventListener('ntf_task_images_changed', handleImagesChange);
  }, []);

  const [statsPeriod] = useState<'emv' | 'miv'>('miv');
  const [summaryModalPeriod, setSummaryModalPeriod] = useState<'emv' | 'miv'>('miv');

  const [visibleCount, setVisibleCount] = useState(30);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPlatformSummaryModal, setShowPlatformSummaryModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'tasks' | 'boost' | 'important' | null>(() => {
    try {
      const saved = localStorage.getItem('ntf_default_start_section');
      if (saved === 'none' || saved === 'null') return null;
      if (saved === 'tasks' || saved === 'boost' || saved === 'important') return saved;
    } catch { /* ignore */ }
    return 'boost';
  });

  useEffect(() => {
    const handleDefaultSectionChange = (e: any) => {
      if (e.detail?.defaultSection) {
        const sec = e.detail.defaultSection;
        setActiveSection(sec === 'none' ? null : sec);
      }
    };
    window.addEventListener('ntf_default_section_changed', handleDefaultSectionChange);
    return () => window.removeEventListener('ntf_default_section_changed', handleDefaultSectionChange);
  }, []);

  const [showEndCreditsFeature, setShowEndCreditsFeature] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ntf_show_end_credits');
      if (saved !== null) return saved === 'true';
    } catch { /* ignore */ }
    return true;
  });

  useEffect(() => {
    const handleEndCreditsChange = (e: any) => {
      if (typeof e.detail?.showEndCredits === 'boolean') {
        setShowEndCreditsFeature(e.detail.showEndCredits);
        if (!e.detail.showEndCredits) {
          setShowNameSubmit(false);
          setShowEndCredits(false);
        }
      }
    };
    window.addEventListener('ntf_end_credits_changed', handleEndCreditsChange);
    return () => window.removeEventListener('ntf_end_credits_changed', handleEndCreditsChange);
  }, []);

  // New feature states
  const [showNameSubmit, setShowNameSubmit] = useState(false);
  const [showEndCredits, setShowEndCredits] = useState(false);
  const [showStatsCard, setShowStatsCard] = useState(false);
  const [creditsSubmitted, setCreditsSubmitted] = useState(() => hasSubmittedCredits());
  const [showMarkDone, setShowMarkDone] = useState(true);
  const [achievementUnlocked, setAchievementUnlocked] = useState(() => {
    try {
      const saved = localStorage.getItem('social-tracker-achievement-unlocked-v3');
      if (saved) return saved === 'true';
    } catch {
      return false;
    }
    return false;
  });

  const tasks = useMemo(() => {
    const all = Object.values(allTasks).flat();
    if (activePhase === 'all') {
      return all;
    }
    // Match task.phase or artist category
    const filtered = all.filter(t => {
      const p = (t.phase || '').toLowerCase();
      const a = ((t as any).artist || '').toLowerCase();
      return p === activePhase || a === activePhase;
    });
    return filtered.length > 0 ? filtered : all;
  }, [allTasks, activePhase]);

  const isTaskCompleted = useCallback((task?: Task) => {
    if (!task) return false;
    return !!(completed[task.phase] && completed[task.phase][task.id]);
  }, [completed]);

  // Create a flat list of all tasks for global calculations
  const totalTasksList = useMemo(() => Object.values(allTasks).flat(), [allTasks]);
  const totalCompletedCount = useMemo(() => {
    let count = 0;
    Object.entries(completed).forEach(([phase, sheetCompleted]) => {
      const sheetTasks = allTasks[phase] || [];
      sheetTasks.forEach(task => {
        if (sheetCompleted[task.id]) count++;
      });
    });
    return count;
  }, [completed, allTasks]);

  // Focus tasks = tasks with focus >= 1 (focus badge or hot badge)
  const allFocusTasks = useMemo(() => totalTasksList.filter(t => (t.focus ?? 0) >= 1), [totalTasksList]);
  const allFocusTasksDone = useMemo(() => {
    if (allFocusTasks.length === 0) return false;
    return allFocusTasks.every(task => !!(completed[task.phase] && completed[task.phase][task.id]));
  }, [allFocusTasks, completed]);

  // Auto-show Credits popup when all focus/hot tasks are completed
  useEffect(() => {
    if (!showEndCreditsFeature) return;
    if (loading) return;
    if (allFocusTasks.length === 0) return;
    if (!allFocusTasksDone) return;
    if (creditsSubmitted) return;
    // Small delay so the completion mark animation plays first
    const timer = setTimeout(() => setShowNameSubmit(true), 800);
    return () => clearTimeout(timer);
  }, [allFocusTasksDone, allFocusTasks.length, creditsSubmitted, loading, showEndCreditsFeature]);

  // Auto-close NameSubmitModal if user unchecks a focus task
  useEffect(() => {
    if (showNameSubmit && !allFocusTasksDone) {
      setShowNameSubmit(false);
    }
  }, [allFocusTasksDone, showNameSubmit]);


  // Calculate platform-specific engagement stats
  const getPlatformStats = useCallback((platform?: string, period: 'emv' | 'miv' = statsPeriod) => {
    // Filter by platform
    let pTasks = platform ? totalTasksList.filter(t => t.platform === platform) : totalTasksList;

    // Filter by period
    // MIV = all sheets; EMV = only airport + show + aftermath (excludes pre & aftermath2)
    if (period === 'emv') {
      pTasks = pTasks.filter(t => t.phase !== 'pre' && t.phase !== 'aftermath2');
    }

    return {
      likes: pTasks.reduce((s, t) => s + t.likes, 0),
      comments: pTasks.reduce((s, t) => s + t.comments, 0),
      shares: pTasks.reduce((s, t) => s + t.shares, 0),
      reposts: pTasks.reduce((s, t) => s + t.reposts, 0),
      views: pTasks.reduce((s, t) => s + (t.views || 0), 0),
      saves: pTasks.reduce((s, t) => s + (t.saves || 0), 0)
    };
  }, [totalTasksList, statsPeriod]);

  // Memoize global stats to prevent recalculation on every render (e.g. during scroll)
  const dashboardStats = useMemo(() => getPlatformStats(), [getPlatformStats]);

  // Memoize platform-specific stats for the modal
  const platformStatsMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof getPlatformStats>> = {};
    if (!showPlatformSummaryModal) return map;
    map['total'] = getPlatformStats();
    map['instagram'] = getPlatformStats('instagram');
    map['tiktok'] = getPlatformStats('tiktok');
    map['x'] = getPlatformStats('x');
    map['threads'] = getPlatformStats('threads');
    map['facebook'] = getPlatformStats('facebook');
    map['youtube'] = getPlatformStats('youtube');
    return map;
  }, [getPlatformStats, showPlatformSummaryModal]);

  const allTasksStats = useMemo(() => {
    return {
      likes: totalTasksList.reduce((s, t) => s + t.likes, 0),
      comments: totalTasksList.reduce((s, t) => s + t.comments, 0),
      shares: totalTasksList.reduce((s, t) => s + t.shares, 0),
      reposts: totalTasksList.reduce((s, t) => s + t.reposts, 0),
    };
  }, [totalTasksList]);

  // Mark as loaded after first render
  useEffect(() => {
    setHasLoaded(true);
  }, []);

  // Save completed state to localStorage
  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem('social-tracker-completed-v3', JSON.stringify(completed));
  }, [completed, hasLoaded]);

  // Check for 100% global achievement
  useEffect(() => {
    // Only check if we have loaded all sheets defined in config
    const loadedSheetCount = Object.keys(allTasks).length;
    if (!hasLoaded || loading || loadedSheetCount < SHEETS_CONFIG.length || totalTasksList.length === 0) return;

    // Strict logic: Check every task in every sheet specifically
    const allCompleted = SHEETS_CONFIG.every(sheet => {
      const sheetTasks = allTasks[sheet.phase] || [];
      if (sheetTasks.length === 0) return false;
      const sheetCompleted = completed[sheet.phase] || {};
      return sheetTasks.every(task => !!sheetCompleted[task.id]);
    });

    if (allCompleted && !achievementUnlocked) {
      setAchievementUnlocked(true);
      localStorage.setItem('social-tracker-achievement-unlocked-v3', 'true');
    } else if (!allCompleted && achievementUnlocked) {
      setAchievementUnlocked(false);
      localStorage.setItem('social-tracker-achievement-unlocked-v3', 'false');
    }
  }, [allTasks, totalTasksList, completed, hasLoaded, loading, achievementUnlocked]);

  // Parse entire CSV text handling quoted strings with newlines
  const parseCSV = useCallback((csvText: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ("") - add single quote to cell
          currentCell += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of cell
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        // End of row (handle both \n and \r\n)
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        if (char === '\r') i++; // Skip \n in \r\n
      } else if (char === '\r' && !inQuotes) {
        // Handle standalone \r as newline
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        // Regular character (including newlines inside quotes)
        currentCell += char;
      }
    }

    // Don't forget the last cell and row
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }

    return rows;
  }, []);

  // Fetch data from Google Sheets (Fetch all on mount)
  const fetchAllData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const results: Record<string, Task[]> = {};

      await Promise.all(SHEETS_CONFIG.map(async (sheet) => {
        try {
          const url = `/api/sheet?gid=${sheet.gid}&_t=${Date.now()}`;
          const response = await fetch(url, { cache: 'no-store' });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          let csvText = await response.text();
          csvText = csvText.replace(/^\uFEFF/, '');
          const rows = parseCSV(csvText);

          if (rows.length > 0) {
            const headers = rows[0].map(h => h.toLowerCase().trim());
            const parsedTasks: Task[] = [];
            for (let i = 1; i < rows.length; i++) {
              const values = rows[i];
              const getVal = (headerName: string) => {
                const idx = headers.indexOf(headerName.toLowerCase().trim());
                return idx !== -1 ? (values[idx] || '') : '';
              };

              const rowId = getVal('id');
              if (rowId === 'global_settings' || rowId === 'toggle_settings') {
                const tags = getVal('hashtags') || getVal('hashtag');
                if (tags) {
                  setGlobalHashtags(tags);
                  localStorage.setItem('ntf_global_hashtags', tags);
                }
                const phaseVal = (getVal('show_phase_filter') || getVal('phase_filter')).toLowerCase().trim();
                if (phaseVal) {
                  const isPhaseOn = phaseVal === '1' || phaseVal === 'true' || phaseVal === 'yes';
                  setShowPhaseFilter(isPhaseOn);
                  localStorage.setItem('ntf_show_phase_filter', isPhaseOn ? 'true' : 'false');
                }
                const defSec = (getVal('default_section') || getVal('active_section')).toLowerCase().trim();
                if (defSec && ['boost', 'tasks', 'important', 'none'].includes(defSec)) {
                  localStorage.setItem('ntf_default_start_section', defSec);
                  setActiveSection(defSec === 'none' ? null : (defSec as any));
                }
                const endCreditsVal = (getVal('show_end_credits') || getVal('enable_end_credits') || getVal('end_credits')).toLowerCase().trim();
                if (endCreditsVal) {
                  const isCreditsOn = endCreditsVal === '1' || endCreditsVal === 'true' || endCreditsVal === 'yes';
                  setShowEndCreditsFeature(isCreditsOn);
                  localStorage.setItem('ntf_show_end_credits', isCreditsOn ? 'true' : 'false');
                }
                continue;
              }

              const focusRaw = getVal('focus').toLowerCase().trim();
              let focusLevel: 0 | 1 | 2 = 0;
              if (focusRaw === 'hot' || focusRaw === '2') focusLevel = 2;
              else if (focusRaw === 'focus' || focusRaw === 'true' || focusRaw === '1' || focusRaw === 'yes') focusLevel = 1;

              let rawPlatform = (getVal('platform') || 'x').toLowerCase().trim();
              // Normalize common variations and handle typos
              if (['ig', 'instagram', 'insta'].includes(rawPlatform)) rawPlatform = 'instagram';
              else if (['fb', 'facebook'].includes(rawPlatform)) rawPlatform = 'facebook';
              else if (['tt', 'tiktok'].includes(rawPlatform)) rawPlatform = 'tiktok';
              else if (['yt', 'youtube'].includes(rawPlatform)) rawPlatform = 'youtube';
              else if (['threads', 'thread', 'th'].includes(rawPlatform)) rawPlatform = 'threads';
              else if (!['x', 'instagram', 'facebook', 'tiktok', 'youtube', 'threads'].includes(rawPlatform)) rawPlatform = 'x';

              const task: Task = {
                id: getVal('id') || getVal('url') || String(i),
                phase: sheet.phase as Task['phase'],
                platform: rawPlatform as Task['platform'],
                url: getVal('url') || '',
                hashtags: getVal('hashtags') || '',
                title: getVal('title') || getVal('note') || '',
                focus: focusLevel,
                likes: parseAbbreviatedNumber(getVal('likes')),
                comments: parseAbbreviatedNumber(getVal('comments')),
                shares: parseAbbreviatedNumber(getVal('shares')),
                reposts: parseAbbreviatedNumber(getVal('reposts')),
                views: parseAbbreviatedNumber(getVal('view') || getVal('views')),
                saves: parseAbbreviatedNumber(getVal('save') || getVal('saves')),
                target: parseAbbreviatedNumber(getVal('target') || getVal('goal') || '0'),
                targetLikes: parseAbbreviatedNumber(getVal('target_likes') || getVal('targetlikes') || '0'),
                targetComments: parseAbbreviatedNumber(getVal('target_comments') || getVal('targetcomments') || '0'),
                targetShares: parseAbbreviatedNumber(getVal('target_shares') || getVal('targetshares') || '0'),
                targetReposts: parseAbbreviatedNumber(getVal('target_reposts') || getVal('targetreposts') || '0'),
                targetSaves: parseAbbreviatedNumber(getVal('target_saves') || getVal('targetsaves') || '0'),
                targetViews: parseAbbreviatedNumber(getVal('target_views') || getVal('targetviews') || '0'),
                image: (() => {
                  let localImages: Record<string, string> = {};
                  try {
                    localImages = JSON.parse(localStorage.getItem('ntf_task_images') || '{}');
                  } catch { /* ignore */ }
                  const taskId = getVal('id');
                  const taskUrl = getVal('url');
                  const rawImg = getVal('image') || getVal('img') || getVal('picture') || localImages[taskId] || localImages[taskUrl] || '';
                  if (rawImg.includes('dropbox.com') || rawImg.includes('dropboxusercontent.com')) {
                    // Convert Dropbox share link to direct URL.
                    // Removed proxy because direct dl.dropboxusercontent.com works on Chrome mobile if crossOrigin="anonymous" is removed.
                    return rawImg
                      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                      .replace(/[?&]dl=\d/g, '')
                      .replace(/[?&]st=[^&]*/g, '')
                      .replace(/\?$/, '')
                      .replace(/&$/, '');
                  }
                  const fileId = extractGDriveId(rawImg);
                  return fileId ? gdriveImageUrl(fileId) : rawImg;
                })(),
                imageFileId: (() => {
                  let localImages: Record<string, string> = {};
                  try {
                    localImages = JSON.parse(localStorage.getItem('ntf_task_images') || '{}');
                  } catch { /* ignore */ }
                  const taskId = getVal('id');
                  const taskUrl = getVal('url');
                  const rawImg = getVal('image') || getVal('img') || getVal('picture') || localImages[taskId] || localImages[taskUrl] || '';
                  if (rawImg.includes('dropbox.com') || rawImg.includes('dropboxusercontent.com')) return '';
                  return extractGDriveId(rawImg);
                })(),
                boost: (() => {
                  const v = (getVal('boost') || getVal('featured') || getVal('highlight') || '').trim();
                  const result: number[] = [];
                  if (v.includes('1') || v.toLowerCase() === 'x' || v.toLowerCase() === 'yes' || v.toLowerCase() === 'true') result.push(1);
                  if (v.includes('2')) result.push(2);
                  return result;
                })(),
              };
              if (task.url) parsedTasks.push(task);
            }
            results[sheet.phase] = parsedTasks.reverse();
          }
        } catch (sheetErr) {
          console.error(`Failed to fetch sheet ${sheet.phase}:`, sheetErr);
        }
      }));

      // Fetch dedicated Toggle Setting sheet tab (GID 755512629 / sheetName "Toggle Setting")
      try {
        const toggleRes = await fetch('/api/sheet?sheetName=Toggle%20Setting&gid=755512629');
        if (toggleRes.ok) {
          const toggleCsv = await toggleRes.text();
          const toggleRows = parseCSV(toggleCsv.replace(/^\uFEFF/, ''));
          if (toggleRows.length > 0) {
            const toggleHeaders = toggleRows[0].map(h => h.toLowerCase().trim());
            for (let i = 1; i < toggleRows.length; i++) {
              const r = toggleRows[i];
              const getTVal = (hName: string) => {
                const idx = toggleHeaders.indexOf(hName.toLowerCase().trim());
                return idx !== -1 ? (r[idx] || '') : '';
              };
              const defSec = (getTVal('default_section') || getTVal('active_section')).toLowerCase().trim();
              if (defSec && ['boost', 'tasks', 'important', 'none'].includes(defSec)) {
                localStorage.setItem('ntf_default_start_section', defSec);
                setActiveSection(defSec === 'none' ? null : (defSec as any));
              }
              const phaseVal = (getTVal('show_phase_filter') || getTVal('phase_filter')).toLowerCase().trim();
              if (phaseVal) {
                const isPhaseOn = phaseVal === '1' || phaseVal === 'true' || phaseVal === 'yes';
                setShowPhaseFilter(isPhaseOn);
                localStorage.setItem('ntf_show_phase_filter', isPhaseOn ? 'true' : 'false');
              }
            }
          }
        }
      } catch (toggleErr) {
        console.warn('Failed to fetch Toggle Setting sheet:', toggleErr);
      }

      setAllTasks(results);
      setError(null);
      // Save to localStorage for offline support
      try {
        localStorage.setItem('social-tracker-tasks-cache-v3', JSON.stringify(results));
      } catch { /* quota exceeded, ignore */ }
    } catch (err) {
      // Try loading from offline cache
      try {
        const cached = localStorage.getItem('social-tracker-tasks-cache-v3');
        if (cached) {
          setAllTasks(JSON.parse(cached));
          setError(null);
          console.log('Loaded from offline cache');
        } else {
          setError(t('error'));
        }
      } catch {
        setError(t('error'));
      }
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parseCSV]);

  // Fetch positive messages from separate Word Randomizer Google Sheet
  // Sheet: VITE_MSG_SHEET_ID — Column E = "Completed Text"
  const fetchPositiveMessages = useCallback(async () => {
    try {
      const pools = {
        en: { complete: [] as string[] },
        th: { complete: [] as string[] }
      };

      // Fetch from the dedicated message sheet via /api/msg-sheet proxy
      try {
        const url = `/api/msg-sheet?gid=0`;
        const response = await fetch(url);
        if (response.ok) {
          let csvText = await response.text();
          csvText = csvText.replace(/^\uFEFF/, '');
          const rows = parseCSV(csvText);
          if (rows.length > 0) {
            const headers = rows[0].map(h => h.toLowerCase().trim());

            // Primary: "completed text" column (Column E in the user's sheet)
            const idxComplete = headers.findIndex(h =>
              h === 'completed text' || h === 'completed_text' || h === 'complete' || h === 'message'
            );

            // Also support language-specific columns
            const idx_en = headers.findIndex(h => h === 'message_en');
            const idx_th = headers.findIndex(h => h === 'message_th');

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;

              // Read "Completed Text" → put into both en and th complete pools
              if (idxComplete !== -1 && row[idxComplete]?.trim()) {
                const txt = row[idxComplete].trim();
                pools.en.complete.push(txt);
                pools.th.complete.push(txt); // Use same text for both languages
              }

              // Support language-specific columns if available
              if (idx_en !== -1 && row[idx_en]?.trim()) pools.en.complete.push(row[idx_en].trim());
              if (idx_th !== -1 && row[idx_th]?.trim()) pools.th.complete.push(row[idx_th].trim());
            }
          }
        }
      } catch (e) { console.error('Error fetching messages from msg-sheet:', e); }

      setMsgPools(pools);

      try {
        localStorage.setItem('social-tracker-messages-cache-v3', JSON.stringify({ pools }));
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Failed to fetch positive messages API, attempting to load from cache...', err);
      try {
        const cached = localStorage.getItem('social-tracker-messages-cache-v3');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.pools) setMsgPools(parsed.pools);
        }
      } catch (cacheErr) {
        console.error('Failed to parse message cache.', cacheErr);
      }
    }
  }, [parseCSV]);

  // Upgrade any old-format cached msgPools (missing 'complete' field) to prevent crashes
  useEffect(() => {
    try {
      const cached = localStorage.getItem('social-tracker-messages-cache-v3');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.pools) {
          const hasOldFormat =
            parsed.pools.en?.complete === undefined ||
            parsed.pools.th?.complete === undefined;
          if (hasOldFormat) {
            // Clear stale cache so fresh fetch runs
            localStorage.removeItem('social-tracker-messages-cache-v3');
          }
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchAllData();
    fetchPositiveMessages();
  }, [fetchAllData, fetchPositiveMessages, taskImagesVersion]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllData(true);
        fetchPositiveMessages();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchAllData, fetchPositiveMessages]);

  // Handle automatic scrolling top when Phase changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activePhase]);

  // Filter and sort tasks (Focus first, then maintain original newest-to-oldest order)
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (taskFilterPlatform) {
      result = result.filter(t => t.platform === taskFilterPlatform);
    }
    const pending = result.filter(t => !isTaskCompleted(t));
    const done = result.filter(t => isTaskCompleted(t));

    // Sort: HOT (2) first, then Focus (1), then normal (0). Stable within each tier.
    const sortTasks = (a: Task, b: Task) => {
      if (b.focus !== a.focus) return b.focus - a.focus;
      return 0;
    };

    const sortedPending = [...pending].sort(sortTasks);
    const sortedDone = [...done].sort(sortTasks);
    return [...sortedPending, ...sortedDone];
  }, [tasks, isTaskCompleted, taskFilterPlatform]);

  // Lazy load
  const visibleTasks = useMemo(() => {
    return filteredTasks.slice(0, visibleCount);
  }, [filteredTasks, visibleCount]);

  const pendingCount = tasks.filter(t => !isTaskCompleted(t)).length;


  // Helper to detect old/corrupted default hashtags
  const isOldDefaultHashtags = useCallback((text?: string): boolean => {
    if (!text) return true;
    const clean = text.trim();
    return clean.includes('???????????') || (clean.includes('#NamtanFilmxLevis') && clean.includes('#LiveInLevis') && clean.includes('#LevisThailand'));
  }, []);

  // Get hashtags for platform (falls back to Official Hashtags if empty or old default)
  const getCaption = useCallback((task: Task): string => {
    if (!task.hashtags || isOldDefaultHashtags(task.hashtags)) {
      return globalHashtags || task.hashtags || '';
    }
    return task.hashtags;
  }, [globalHashtags, isOldDefaultHashtags]);

  // Generate random positive message — pick directly from Column E ("completed text")
  const generateRandomMessage = useCallback(() => {
    const activePool = msgPools[language]?.complete?.length ? msgPools[language] : msgPools.en;
    if (!activePool || !activePool.complete || activePool.complete.length === 0) return;

    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const sentence = pick(activePool.complete);
    setGeneratedMessage(sentence);
    setCopiedType(null);
  }, [msgPools, language]);

  // Copy functions for 3 different options
  const handleCopyMessage = async () => {
    if (!generatedMessage) return;
    try {
      await navigator.clipboard.writeText(generatedMessage);
      setCopiedType('message');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleCopyHashtags = async (task: Task) => {
    const text = getCaption(task);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('hashtags');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleCopyBoth = async (task: Task) => {
    const hashtags = getCaption(task);
    const text = generatedMessage
      ? `${generatedMessage}\n\n${hashtags}`
      : hashtags;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('both');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Open the actual post URL
  const handleGoToPost = (task: Task) => {
    window.open(task.url, '_blank');
  };

  // Mark task as complete
  const handleMarkComplete = (task: Task) => {
    setCompleted(prev => ({
      ...prev,
      [task.phase]: {
        ...(prev[task.phase] || {}),
        [task.id]: { completedAt: new Date().toISOString() },
      },
    }));
    setSelectedTask(null);
  };

  // Unmark task
  const handleUnmarkComplete = (task: Task) => {
    setCompleted(prev => {
      const next = { ...prev };
      if (next[task.phase]) {
        const nextPhase = { ...next[task.phase] };
        delete nextPhase[task.id];
        next[task.phase] = nextPhase;
      }
      return next;
    });
    setSelectedTask(null);
    setGeneratedMessage(''); // Clear any caption message on uncheck
  };

  // Quick complete without modal
  const handleQuickComplete = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    handleMarkComplete(task);
  };

  // Load more on scroll
  const scrollTimeoutRef = useRef<number | null>(null);
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeoutRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      setVisibleCount(prev => Math.min(prev + 30, filteredTasks.length));
      scrollTimeoutRef.current = window.setTimeout(() => {
        scrollTimeoutRef.current = null;
      }, 100);
    }
  }, [filteredTasks.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-prada-offwhite flex items-center justify-center relative overflow-hidden">
        {/* Subtle background decorative element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-prada-cream opacity-20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="w-52 h-64 sm:w-64 sm:h-80 mb-6 relative group animate-in fade-in zoom-in duration-700">
            <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl group-hover:bg-white/40 transition-all duration-500 animate-pulse"></div>
            <img
              src="/ntf_header.png"
              alt="Namtan Tipnaree"
              className="w-full h-full object-contain relative z-10 drop-shadow-2xl animate-bounce [animation-duration:3s]"
            />
          </div>

          <div className="relative">
            <div className="w-10 h-1 border-t-2 border-prada-warm/40 mx-auto mb-4 scale-x-150 rounded-full animate-pulse"></div>
            <p className="text-prada-charcoal font-bold text-lg tracking-[0.2em] uppercase animate-pulse">
              {t('loading')}
            </p>
            <div className="w-10 h-1 border-b-2 border-prada-warm/40 mx-auto mt-4 scale-x-150 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-prada-offwhite overflow-hidden">
      {/* Responsive Fullscreen Background Images with smooth transition */}
      {/* Desktop BG */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-left bg-no-repeat opacity-0 lg:opacity-[0.10] transition-opacity duration-700 ease-in-out pointer-events-none"
        style={{ backgroundImage: `url('/BG.jpg')` }}
      />
      {/* Tablet BG */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-left bg-no-repeat opacity-0 md:opacity-[0.10] lg:opacity-0 transition-opacity duration-700 ease-in-out pointer-events-none"
        style={{ backgroundImage: `url('/tablet.jpg')` }}
      />
      {/* Mobile BG */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-left bg-no-repeat opacity-[0.10] md:opacity-0 transition-opacity duration-700 ease-in-out pointer-events-none"
        style={{ backgroundImage: `url('/moblie.jpg')` }}
      />



      {/* Subtle paper texture overlay */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23000000' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E")`
      }} />

      {/* Scrollable Middle Area (Contains Banner, Filters, Toggles, and Content) */}
      <main
        ref={mainRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0"
      >
        <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto flex flex-col gap-1 px-3 pt-2 pb-2">

          {/* Hero Editorial Banner Layout (Top Banner - Normal Scroll) */}
          <div className="relative w-full overflow-hidden bg-transparent mb-1 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[240px]">
            {/* Language Switcher (Top Right Absolute) */}
            <div className="absolute top-2 right-2 z-20 flex rounded-full overflow-hidden border border-[#011949]/30 bg-white/40 backdrop-blur-md shadow-sm">
              <button
                onClick={() => setLanguage('th')}
                className={`px-2.5 py-1 text-[10px] font-bold transition-all ${language === 'th'
                  ? 'bg-[#011949] text-white'
                  : 'text-[#011949]/70 hover:text-[#011949]'
                  }`}
              >
                TH
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-[10px] font-bold transition-all ${language === 'en'
                  ? 'bg-[#011949] text-white'
                  : 'text-[#011949]/70 hover:text-[#011949]'
                  }`}
              >
                EN
              </button>
            </div>

            {/* Center Portrait */}
            <div className="relative z-10 w-48 h-60 sm:w-60 sm:h-72 mb-3 drop-shadow-md transition-transform hover:scale-105 duration-300">
              <img
                src="/ntf_header.png"
                alt="Namtan Tipnaree"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Typography Title & Subtitle - Archivo Black Uniform Style */}
            <div className="relative z-10 text-center flex flex-col items-center">
              <h1 className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap drop-shadow-sm font-archivo text-2xl sm:text-4xl leading-none uppercase tracking-tight">
                <span className="text-[#C21734]">
                  LEVI'S ×
                </span>
                <span className="text-[#011949]">
                  namtanfilm
                </span>
              </h1>
              <p className="text-[11px] sm:text-[14px] font-bold tracking-wider text-[#C21734] mt-2 font-google">
                Levi’s® Women’s Experience for Every Original
              </p>
              {/* Levi's Logo */}
              <div className="mt-2.5 h-6 sm:h-8 flex items-center justify-center">
                <img
                  src="/logo levis.png"
                  alt="Levi's Logo"
                  className="h-full w-auto object-contain drop-shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Phase Filters - Transparent Deep Indigo Theme (Normal Scroll) */}
          {showPhaseFilter && (
            <div className="bg-transparent mb-2">
              <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-1 pt-1 pb-1 grid grid-cols-5 gap-1.5">
                {[
                  { id: 'all', icon: '✦', label: t('allLabel'), desc: t('sixteenDaysShort'), days: [] },
                  { id: 'pre', icon: '👖', label: t('preLabel'), desc: t('phasePreShort'), days: ['Teaser'] },
                  { id: 'airport', icon: '🎉', label: t('airportLabel'), desc: t('phaseAirportShort'), days: ['Event'] },
                  { id: 'show', icon: '✨', label: t('showLabel'), desc: t('phaseShowShort'), days: ['Campaign'] },
                  { id: 'aftermath', icon: '📸', label: t('aftermathLabel'), desc: t('phaseAftermathShort'), days: ['After'] },
                ].map(phase => {
                  const isActive = activePhase === phase.id;
                  return (
                    <button
                      key={phase.id}
                      onClick={() => {
                        setActivePhase(phase.id as any);
                        setVisibleCount(30);
                      }}
                      className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl border transition-all ${isActive
                        ? 'bg-[#011949] text-white border-[#011949] shadow-sm scale-105 z-10'
                        : 'bg-white/60 text-[#011949] border-[#011949]/20 hover:bg-white/80'
                        }`}
                    >
                      <div className="text-[12px] sm:text-[14px] leading-none mb-1">{phase.icon}</div>
                      <div className="text-[9px] sm:text-[10px] font-bold leading-none mb-0.5 whitespace-nowrap">{phase.label}</div>
                      <div className={`text-[7px] sm:text-[8px] tracking-tight whitespace-nowrap overflow-hidden text-ellipsis w-full px-0.5 text-center ${isActive ? 'text-white/90' : 'text-[#011949]/70'}`}>{phase.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Section Toggle Buttons (Sticky when scrolling down) */}
          <div className="sticky top-0 z-40 bg-transparent py-2 mb-2">
            <div className="flex flex-wrap justify-center gap-2 items-center">
              {totalTasksList.length > 0 && !loading && !error && (
                <>
                  <button
                    onClick={() => {
                      setActiveSection(prev => prev === 'tasks' ? null : 'tasks');
                      if (activeSection !== 'tasks') {
                        setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                      }
                    }}
                    className={`px-3 sm:px-4 h-8 rounded-full flex items-center gap-1.5 shadow-lg shadow-black/5 transition-all hover:scale-105 active:scale-95 group relative z-50 flex-shrink-0 border ${activeSection === 'tasks'
                      ? 'bg-[#C21734] text-white border-transparent shadow-[#C21734]/20'
                      : 'bg-white/90 backdrop-blur-md text-[#C21734] border-[#C21734]/40 shadow-sm hover:bg-white shadow-[#C21734]/10'
                      }`}
                  >
                    <span className={`text-[10px] ${activeSection === 'tasks' ? 'animate-pulse' : ''} transition-transform`}>
                      {activeSection === 'tasks' ? '✦' : '✧'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">{t('tasks') || 'Tasks'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection(prev => prev === 'boost' ? null : 'boost');
                      if (activeSection !== 'boost') {
                        setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                      }
                    }}
                    className={`px-3 sm:px-4 h-8 rounded-full flex items-center gap-1.5 shadow-lg shadow-black/5 transition-all hover:scale-105 active:scale-95 group relative z-50 flex-shrink-0 border ${activeSection === 'boost'
                      ? 'bg-[#C21734] text-white border-transparent shadow-[#C21734]/20'
                      : 'bg-white/90 backdrop-blur-md text-[#C21734] border-[#C21734]/40 shadow-sm hover:bg-white shadow-[#C21734]/10'
                      }`}
                  >
                    <span className={`text-[10px] ${activeSection === 'boost' ? 'animate-pulse' : ''} transition-transform`}>
                      {activeSection === 'boost' ? '✦' : '🔥'}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">{t('featuredEngagementToggle') || 'Engagement'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection(prev => prev === 'important' ? null : 'important');
                      if (activeSection !== 'important') {
                        setTimeout(() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
                      }
                    }}
                    className={`px-3 sm:px-4 h-8 rounded-full flex items-center gap-1.5 shadow-lg shadow-black/5 transition-all hover:scale-105 active:scale-95 group relative z-50 flex-shrink-0 border ${activeSection === 'important'
                      ? 'bg-[#C21734] text-white border-transparent shadow-[#C21734]/20'
                      : 'bg-white/90 backdrop-blur-md text-[#C21734] border-[#C21734]/40 shadow-sm hover:bg-white shadow-[#C21734]/10'
                      }`}
                  >
                    <span className={`text-[10px] ${activeSection === 'important' ? 'animate-pulse' : ''} transition-transform`}>
                      {activeSection === 'important' ? '✦' : '⭐'}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider`}>{t('importantMediaToggle') || 'Important'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Platform Engagement Card (Individual Featured Posts) */}
          {totalTasksList.length > 0 && !loading && !error && activeSection === 'boost' && (
            <div className="mb-2 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-white/80 rounded-[2rem] p-4 sm:p-5 mx-0 border border-prada-warm/30 shadow-2xl shadow-black/5 relative group">
                {/* Decorative glow */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-28 h-28 bg-prada-warm/25 rounded-full blur-2xl pointer-events-none" />
                </div>

                <div className="relative z-10 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex flex-col gap-2 w-full">
                    {/* Title Row */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-[#C21734] text-sm sm:text-base leading-none">✦</span>
                        <h3 className="text-[10px] sm:text-xs font-bold text-[#C21734] uppercase tracking-[0.15em] whitespace-nowrap">{t('featuredEngagementTitle') || 'Featured Engagement'}</h3>
                      </div>
                      {/* Minimize button — always visible top-right */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => setActiveSection(null)}
                          className="w-7 h-7 rounded-full bg-[#C21734]/10 text-[#C21734] border border-[#C21734]/20 shadow-sm hover:bg-[#C21734]/20 active:scale-95 flex items-center justify-center transition-colors"
                          title={t('minimize')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        <span className="text-[6px] font-bold text-[#C21734]/60 tracking-wider mt-0.5 whitespace-nowrap">
                          {t('tapToHide')}
                        </span>
                      </div>
                    </div>

                    {/* Filter Row — full width below title */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 mt-1">
                      <button
                        onClick={() => setFeaturedFilterPlatform(null)}
                        className={`px-3 h-7 rounded-full flex-shrink-0 text-[10px] font-bold border transition-colors flex items-center justify-center shadow-sm ${!featuredFilterPlatform
                          ? 'bg-[#C21734] border-transparent text-white'
                          : 'bg-white border-[#C21734]/30 text-[#C21734]/70 hover:bg-[#C21734]/10'
                          }`}
                      >
                        {t('allLabel') || 'All'}
                      </button>
                      {(['instagram', 'tiktok', 'x', 'facebook', 'youtube'] as const).map(p => {
                        const isActive = featuredFilterPlatform === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setFeaturedFilterPlatform(isActive ? null : p)}
                            className={`w-7 h-7 rounded-full flex-shrink-0 border transition-colors flex items-center justify-center shadow-sm ${isActive
                              ? 'bg-[#C21734] border-[#C21734] text-white'
                              : 'bg-white border-[#C21734]/30 text-[#C21734]/70 hover:border-[#C21734]/60 hover:text-[#C21734]'
                              }`}
                          >
                            <div className="w-4 h-4 text-current flex items-center justify-center">
                              {platformConfig[p].icon}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Featured Posts List */}
                  <div className="flex flex-col gap-3" key={`featured-list-${featuredFilterPlatform || 'all'}-${activePhase}`}>
                    {(() => {
                      // Get all posts marked as featured in the sheet (boost = 1)
                      const featuredPosts = totalTasksList.filter(t =>
                        t.boost?.includes(1) &&
                        (!featuredFilterPlatform || t.platform === featuredFilterPlatform) &&
                        (activePhase === 'all' || t.phase === activePhase || (activePhase === 'aftermath' && t.phase === 'aftermath2'))
                      ).sort((a, b) => {
                        const getSum = (t: typeof a) => t.likes + t.comments + t.shares + t.reposts + (t.saves || 0) + (t.views || 0);
                        const getTargetSum = (t: typeof a) => (t.targetLikes || 0) + (t.targetComments || 0) + (t.targetShares || 0) + (t.targetReposts || 0) + (t.targetSaves || 0) + (t.targetViews || 0);

                        const aTarget = getTargetSum(a) || a.target || 1;
                        const bTarget = getTargetSum(b) || b.target || 1;

                        const aDone = getSum(a) >= aTarget ? 1 : 0;
                        const bDone = getSum(b) >= bTarget ? 1 : 0;

                        return aDone - bDone;
                      }).slice(0, 100);

                      if (featuredPosts.length === 0) {
                        return <div className="text-center text-xs text-prada-taupe/60 italic py-4">{t('noBoostPosts')}</div>;
                      }

                      return (
                        <>
                          {/* Summary Bar */}
                          <div className="flex items-center justify-between px-1 pb-1 border-b border-[#C21734]/10 mb-1">
                            <span className="text-[10px] text-prada-taupe/60">
                              {t('missionCount')}
                            </span>
                            <span className="text-[11px] font-bold text-[#C21734]">
                              {featuredPosts.length} {t('missionCountUnit')}
                            </span>
                          </div>
                          {featuredPosts.map((post, idx) => {
                            const iconPlatform = platformConfig[post.platform as keyof typeof platformConfig];
                            const totalEngagement = post.likes + post.comments + post.shares + post.reposts + (post.saves ?? 0) + (post.views ?? 0);
                            const target = post.target || 1;
                            const pct = Math.min((totalEngagement / target) * 100, 100);

                            return (
                              <div
                                key={post.id || idx}
                                onClick={() => { setSelectedTask(post); setShowMarkDone(false); setGeneratedMessage(''); }}
                                className="flex shrink-0 bg-white rounded-2xl overflow-hidden border border-prada-warm/20 shadow-sm hover:shadow-lg hover:border-prada-gold/40 transition-all active:scale-[0.98] group/post cursor-pointer"
                              >
                                {/* Left: Thumbnail panel */}
                                <div className={`w-28 sm:w-36 shrink-0 flex flex-col items-center justify-center bg-gradient-to-br ${iconPlatform?.color || 'from-gray-400 to-gray-600'} relative overflow-hidden`}>
                                  {post.image ? (
                                    <img
                                      src={post.image}
                                      alt={post.title || post.platform}
                                      className="absolute inset-0 w-full h-full object-cover object-top"
                                      style={{ objectPosition: 'top center' }}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        const img = e.currentTarget as HTMLImageElement;
                                        const src = img.src;
                                        const id = post.imageFileId;
                                        if (!id) { img.style.display = 'none'; return; }
                                        const proxy = `/api/gdrive/d/${id}`;
                                        const thumb = gdriveFallbackUrl(id);
                                        const uc = gdriveUcUrl(id);
                                        if (!src.includes('/api/gdrive')) { img.src = proxy; }
                                        else if (!src.includes('thumbnail')) { img.src = thumb; }
                                        else if (!src.includes('uc?export')) { img.src = uc; }
                                        else { img.style.display = 'none'; }
                                      }}
                                    />
                                  ) : null}
                                  <div className="absolute inset-0 bg-black/10" />
                                  <div className={`relative z-10 text-white/80 text-3xl sm:text-4xl ${post.image ? 'opacity-0' : 'opacity-60'}`}>
                                    {iconPlatform?.icon || <span className="text-2xl font-bold">{post.platform[0]?.toUpperCase()}</span>}
                                  </div>
                                  {/* External link icon on hover */}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover/post:opacity-70 transition-opacity z-20">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3.5 h-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                  </div>
                                </div>

                                {/* Right: Info & Metrics panel */}
                                <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-2">
                                  {/* Post Header */}
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${iconPlatform?.color || 'from-gray-400 to-gray-600'} text-white shadow-sm`}>
                                      <div className="w-3.5 h-3.5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">{iconPlatform?.icon}</div>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[11px] font-bold text-prada-charcoal truncate leading-tight">
                                        {post.title || `${post.platform} Post`}
                                      </span>
                                      <span className="text-[9px] text-prada-taupe/70 uppercase tracking-widest leading-tight">
                                        {iconPlatform?.name || post.platform}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Per-Metric Rows */}
                                  <div className="flex flex-col gap-1.5">
                                    {([
                                      { key: 'likes', label: t('likes'), value: post.likes, targetVal: post.targetLikes, icon: '❤️' },
                                      { key: 'comments', label: t('comments'), value: post.comments, targetVal: post.targetComments, icon: '💬' },
                                      { key: 'shares', label: t('shares'), value: post.shares, targetVal: post.targetShares, icon: '🔗' },
                                      { key: 'reposts', label: t('reposts'), value: post.reposts, targetVal: post.targetReposts, icon: '🔁' },
                                      { key: 'saves', label: t('saves'), value: post.saves ?? 0, targetVal: post.targetSaves, icon: '🔖' },
                                      { key: 'views', label: t('views'), value: post.views ?? 0, targetVal: post.targetViews, icon: '👁️' },
                                    ] as const).filter(m => m.value > 0 || (m.targetVal ?? 0) > 0).map(metric => {
                                      const tgt = metric.targetVal ?? 0;
                                      const mPct = tgt > 0 ? Math.min((metric.value / tgt) * 100, 100) : 0;
                                      return (
                                        <div key={metric.key} className="flex flex-col gap-0.5">
                                          <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-[9px] text-prada-taupe/80">
                                              <span className="text-[10px]">{metric.icon}</span>
                                              <span>{metric.label}</span>
                                            </span>
                                            <div className="flex items-baseline gap-0.5">
                                              <span className="text-[11px] font-bold text-prada-charcoal tabular-nums">{metric.value.toLocaleString()}</span>
                                              {tgt > 0 && <span className="text-[9px] text-prada-taupe/50">/ {tgt.toLocaleString()}</span>}
                                            </div>
                                          </div>
                                          {tgt > 0 && (
                                            <div className="h-1 w-full bg-prada-warm/30 rounded-full overflow-hidden">
                                              <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${iconPlatform?.color || 'from-prada-charcoal to-prada-taupe'}`}
                                                style={{ width: `${mPct}%` }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Total Summary */}
                                  <div className="pt-1.5 border-t border-prada-warm/30 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-prada-charcoal/50 uppercase tracking-wider">{t('totalEngagementLabel')}</span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-sm font-bold text-[#C21734] tabular-nums">{totalEngagement.toLocaleString()}</span>
                                      {(post.target ?? 0) > 0 && (
                                        <span className={`text-[9px] font-bold ${pct >= 100 ? 'text-emerald-500' : 'text-prada-taupe/50'}`}>
                                          ({pct.toFixed(1)}%)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Important Media Card (boost = 2) */}
          {totalTasksList.length > 0 && !loading && !error && activeSection === 'important' && (
            <div className="mb-2 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] p-4 sm:p-5 mx-0 border border-prada-warm/30 shadow-2xl shadow-black/5 relative group">
                {/* Decorative glow */}
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-28 h-28 bg-prada-warm/25 rounded-full blur-2xl pointer-events-none" />
                </div>

                <div className="relative z-10 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex flex-col gap-2 w-full">
                    {/* Title Row */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <span className="text-[#C21734] text-sm sm:text-base leading-none">✦</span>
                        <h3 className="text-[10px] sm:text-xs font-bold text-[#C21734] uppercase tracking-[0.15em] whitespace-nowrap">{t('importantMediaTitle') || 'Important Media'}</h3>
                      </div>
                      {/* Minimize button — always visible top-right */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => setActiveSection(null)}
                          className="w-7 h-7 rounded-full bg-[#C21734]/10 text-[#C21734] border border-[#C21734]/20 shadow-sm hover:bg-[#C21734]/20 active:scale-95 flex items-center justify-center transition-colors"
                          title={t('minimize')}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        <span className="text-[6px] font-bold text-[#C21734]/60 tracking-wider mt-0.5 whitespace-nowrap">
                          {t('tapToHide')}
                        </span>
                      </div>
                    </div>

                    {/* Filter Row — full width below title */}
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
                      <button
                        onClick={() => setFeaturedFilterPlatform(null)}
                        className={`px-3 h-7 rounded-full flex-shrink-0 text-[10px] font-bold border transition-colors flex items-center justify-center shadow-sm ${!featuredFilterPlatform
                          ? 'bg-[#C21734] border-transparent text-white'
                          : 'bg-white border-[#C21734]/30 text-[#C21734]/70 hover:bg-[#C21734]/10'
                          }`}
                      >
                        {t('allLabel') || 'All'}
                      </button>
                      {(['instagram', 'tiktok', 'x', 'facebook', 'youtube'] as const).map(p => {
                        const isActive = featuredFilterPlatform === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setFeaturedFilterPlatform(isActive ? null : p)}
                            className={`w-7 h-7 rounded-full flex-shrink-0 text-[12px] border transition-colors flex items-center justify-center shadow-sm ${isActive
                              ? 'bg-[#C21734] border-[#C21734] text-white'
                              : 'bg-white border-[#C21734]/30 text-[#C21734]/70 hover:border-[#C21734]/60 hover:text-[#C21734]'
                              }`}
                          >
                            <div className="w-4 h-4 text-current flex items-center justify-center">
                              {platformConfig[p].icon}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Important Media Posts List */}
                  <div className="flex flex-col gap-3" key={`important-media-list-${featuredFilterPlatform || 'all'}`}>
                    {(() => {
                      // Get all posts marked as important media in the sheet (boost = 2)
                      let importantPosts = totalTasksList.filter(t =>
                        t.boost?.includes(2) &&
                        (!featuredFilterPlatform || t.platform === featuredFilterPlatform) &&
                        (activePhase === 'all' || t.phase === activePhase || (activePhase === 'aftermath' && t.phase === 'aftermath2'))
                      );

                      importantPosts = importantPosts.sort((a, b) => {
                        const getSum = (t: typeof a) => t.likes + t.comments + t.shares + t.reposts + (t.saves || 0) + (t.views || 0);
                        const getTargetSum = (t: typeof a) => (t.targetLikes || 0) + (t.targetComments || 0) + (t.targetShares || 0) + (t.targetReposts || 0) + (t.targetSaves || 0) + (t.targetViews || 0);

                        const aTarget = getTargetSum(a) || a.target || 1;
                        const bTarget = getTargetSum(b) || b.target || 1;

                        const aDone = getSum(a) >= aTarget ? 1 : 0;
                        const bDone = getSum(b) >= bTarget ? 1 : 0;

                        return aDone - bDone;
                      }).slice(0, 100);

                      if (importantPosts.length === 0) {
                        return <div className="text-center text-xs text-prada-taupe/60 italic py-4">{t('noBoostPosts')}</div>;
                      }

                      return (
                        <>

                          {/* Summary Bar */}
                          <div className="flex items-center justify-between px-1 pb-1 mb-1">
                            <span className="text-[10px] text-prada-taupe/60">
                              {t('missionCount')}
                            </span>
                            <span className="text-[11px] font-bold text-[#C53A4B]">
                              {importantPosts.length} {t('missionCountUnit')}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {importantPosts.map((post, idx) => {
                              const iconPlatform = platformConfig[post.platform as keyof typeof platformConfig];
                              const totalEngagement = post.likes + post.comments + post.shares + post.reposts + (post.saves ?? 0) + (post.views ?? 0);
                              const target = post.target || 1;
                              const pct = Math.min((totalEngagement / target) * 100, 100);

                              return (
                                <div
                                  key={post.id || idx}
                                  onClick={() => { setSelectedTask(post); setShowMarkDone(false); setGeneratedMessage(''); }}
                                  className="flex flex-col bg-white rounded-2xl p-2.5 sm:p-3 border border-[#C53A4B]/20 shadow-sm hover:shadow-md hover:border-[#C53A4B]/40 transition-all group/post relative overflow-hidden cursor-pointer"
                                >
                                  {/* Header: Platform Icon + Title */}
                                  <div className="flex items-center gap-2.5 mb-2.5 relative z-10 w-full overflow-hidden">
                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-gradient-to-br ${iconPlatform?.color || 'from-[#C53A4B] to-[#E35D6A]'} text-white shadow-sm relative group-hover/post:scale-105 transition-transform`}>
                                      <div className="w-4 h-4 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">{iconPlatform?.icon}</div>
                                      <div className="absolute inset-0 bg-white/0 group-hover/post:bg-white/10 transition-colors" />
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span className="text-[11px] font-bold text-[#C53A4B] leading-none uppercase tracking-wider truncate">
                                        {post.title || `PRADA`}
                                      </span>
                                      <span className="text-[8px] font-semibold text-prada-taupe/60 capitalize mt-[2px] leading-tight">
                                        {iconPlatform?.name || post.platform}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Metrics Grid */}
                                  <div className="grid grid-cols-1 gap-y-2 mb-2.5 relative z-10 w-full">
                                    {([
                                      { key: 'likes', label: t('likes') || 'Likes', value: post.likes, targetVal: post.targetLikes, icon: '❤️' },
                                      { key: 'comments', label: t('comments') || 'Comments', value: post.comments, targetVal: post.targetComments, icon: '💬' },
                                      { key: 'reposts', label: t('reposts') || 'Reposts', value: post.reposts, targetVal: post.targetReposts, icon: '🔁' },
                                      { key: 'saves', label: t('saves') || 'Saves', value: post.saves ?? 0, targetVal: post.targetSaves, icon: '🔖' },
                                      { key: 'views', label: t('views') || 'Views', value: post.views ?? 0, targetVal: post.targetViews, icon: '👁️' },
                                    ] as const).filter(m => m.value > 0 || (m.targetVal ?? 0) > 0).map(metric => {
                                      const tgt = metric.targetVal ?? 0;
                                      const mPct = tgt > 0 ? Math.min((metric.value / tgt) * 100, 100) : 0;
                                      return (
                                        <div key={metric.key} className="flex flex-col gap-[3px] w-full">
                                          <div className="flex items-center justify-between w-full leading-none">
                                            <span className="flex items-center gap-1 text-[9px] font-medium text-prada-taupe/80">
                                              <span>{metric.icon}</span>
                                              <span>{metric.label}</span>
                                            </span>
                                            <div className="flex items-baseline gap-1">
                                              <span className="text-[10px] font-bold text-[#C53A4B]">{metric.value.toLocaleString()}</span>
                                              {tgt > 0 && <span className="text-[8px] font-medium text-prada-taupe/40">/ {tgt.toLocaleString()}</span>}
                                            </div>
                                          </div>
                                          {tgt > 0 && (
                                            <div className="h-1 w-full bg-[#C53A4B]/10 rounded-full overflow-hidden">
                                              <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out bg-[#C53A4B]"
                                                style={{ width: `${mPct}%` }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Total Summary */}
                                  <div className="pt-2 mt-1 border-t border-prada-warm/50 flex items-center justify-between relative z-10 w-full leading-none">
                                    <span className="text-[9px] font-bold text-[#D09F93] uppercase tracking-widest">{t('totalEngagementLabel') || 'TOTAL'}</span>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-[11px] font-bold text-[#C53A4B]">{totalEngagement.toLocaleString()}</span>
                                      {(post.target ?? 0) > 0 && (
                                        <span className={`text-[9px] font-bold ${pct >= 100 ? 'text-emerald-500' : 'text-prada-taupe/40'}`}>
                                          ({pct.toFixed(1)}%)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div >

                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 my-2">
              {t('error')}
            </div>
          )}

          {/* Tasks List Header & Wrap */}
          {totalTasksList.length > 0 && !loading && !error && activeSection === 'tasks' && (
            <div className="mb-4 bg-white/80 backdrop-blur-md rounded-[24px] p-4 sm:p-5 border border-[#C21734]/20 shadow-2xl shadow-black/5 mt-2 animate-in fade-in zoom-in-95 duration-500">
              {/* Header with Title and Minimize */}
              <div className="flex flex-col gap-2 w-full mb-3">
                {/* Title Row */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-[#C21734] text-sm sm:text-base leading-none">✦</span>
                    <h3 className="text-[10px] sm:text-xs font-bold text-[#C21734] uppercase tracking-[0.15em] whitespace-nowrap">{t('tasks') || 'ALL MISSIONS'}</h3>
                  </div>
                  {/* Minimize button */}
                  <div className="flex flex-col items-center shrink-0">
                    <button
                      onClick={() => setActiveSection(null)}
                      className="w-7 h-7 rounded-full bg-[#C21734]/10 text-[#C21734] border border-[#C21734]/20 shadow-sm hover:bg-[#C21734]/20 active:scale-95 flex items-center justify-center transition-colors"
                      title={t('minimize')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <span className="text-[6px] font-bold text-[#C21734]/60 tracking-wider mt-0.5 whitespace-nowrap">
                      {t('tapToHide')}
                    </span>
                  </div>
                </div>

                {/* Filter Row — full width icon pills below title */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 mt-1">
                  <button
                    onClick={() => setTaskFilterPlatform(null)}
                    className={`px-3 h-7 rounded-full flex-shrink-0 text-[10px] font-bold border transition-colors flex items-center justify-center shadow-sm ${!taskFilterPlatform
                      ? 'bg-[#C21734] border-transparent text-white'
                      : 'bg-white border-[#C21734]/30 text-[#C21734]/70 hover:bg-[#C21734]/10'
                      }`}
                  >
                    {t('allLabel') || 'All'}
                  </button>
                  {(['instagram', 'tiktok', 'x', 'facebook', 'youtube'] as const).map(p => {
                    const isActive = taskFilterPlatform === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setTaskFilterPlatform(isActive ? null : p)}
                        className={`w-7 h-7 rounded-full flex-shrink-0 border transition-colors flex items-center justify-center shadow-sm ${isActive
                          ? 'bg-[#C21734] border-[#C21734] text-white'
                          : 'bg-white border-[#C21734]/30 text-[#C21734]/70 hover:border-[#C21734]/60 hover:text-[#C21734]'
                          }`}
                      >
                        <div className="w-4 h-4 text-current flex items-center justify-center">
                          {platformConfig[p].icon}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Task List mapping */}
              <div className="animate-in fade-in slide-in-from-top-4 duration-500" key={`task-list-${taskFilterPlatform || 'all'}`}>
                {visibleTasks.map((task, index) => {
                  const config = platformConfig[task.platform as keyof typeof platformConfig] || { color: 'from-slate-400 to-slate-500', icon: null, name: 'Unknown' };
                  return (
                    <div key={`${task.id}-${index}`}>
                      {(index === 0 || isTaskCompleted(task) !== isTaskCompleted(visibleTasks[index - 1])) && (
                        <div className="flex items-center gap-3 mb-2 mt-6 first:mt-2">
                          <h3 className="text-sm font-bold text-[#011949] uppercase tracking-widest pl-2">
                            {isTaskCompleted(task) ? t('done') : t('pending')}
                          </h3>
                          <div className="flex-1 h-px bg-[#011949]/20" />
                        </div>
                      )}

                      <div
                        onClick={() => { setSelectedTask(task); setShowMarkDone(true); setGeneratedMessage(''); }}
                        className={`flex items-center shrink-0 gap-2 rounded-2xl py-2.5 px-3 mb-1.5 border cursor-pointer hover:shadow-md transition-all group animate-in fade-in slide-in-from-bottom-4 duration-300 ${isTaskCompleted(task)
                          ? 'bg-slate-100 border-[#011949]/20 opacity-60 grayscale-[0.3]'
                          : task.focus === 2
                            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-[#C21734] shadow-md shadow-[#C21734]/10 relative overflow-hidden'
                            : task.focus === 1
                              ? 'bg-blue-50/50 border-[#011949]/30 shadow-sm relative overflow-hidden'
                              : 'bg-white border-[#011949]/15'
                          }`}
                        style={{ animationDelay: `${(index % 10) * 50}ms` }}
                      >
                        {/* Platform badge */}
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-sm flex-shrink-0 shadow-sm text-white`}>
                          {isTaskCompleted(task) ? '✓' : config.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-medium text-[#011949] truncate">
                              {task.title || t('noTitle')}
                            </span>
                            {task.focus === 2 && !isTaskCompleted(task) && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#C21734] text-white rounded-full flex-shrink-0 animate-pulse shadow-sm shadow-[#C21734]/30">
                                {t('hotBadge')}
                              </span>
                            )}
                            {task.focus === 1 && !isTaskCompleted(task) && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#011949] text-white rounded-full flex-shrink-0">
                                {t('focusBadge')}
                              </span>
                            )}
                          </div>
                          {/* Engagement Metrics */}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {(task.likes > 0 || (task.targetLikes ?? 0) > 0) && (
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px] text-[#C21734]"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                <span>{task.likes.toLocaleString()}</span>
                                {(task.targetLikes ?? 0) > 0 && <span className="opacity-60 text-[9px]">/ {(task.targetLikes ?? 0).toLocaleString()}</span>}
                              </span>
                            )}
                            {(task.comments > 0 || (task.targetComments ?? 0) > 0) && (
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px] text-[#011949]"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                                <span>{task.comments.toLocaleString()}</span>
                                {(task.targetComments ?? 0) > 0 && <span className="opacity-60 text-[9px]">/ {(task.targetComments ?? 0).toLocaleString()}</span>}
                              </span>
                            )}
                            {(task.shares > 0 || (task.targetShares ?? 0) > 0) && (
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px] text-amber-600"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>
                                <span>{task.shares.toLocaleString()}</span>
                                {(task.targetShares ?? 0) > 0 && <span className="opacity-60 text-[9px]">/ {(task.targetShares ?? 0).toLocaleString()}</span>}
                              </span>
                            )}
                            {(task.reposts > 0 || (task.targetReposts ?? 0) > 0) && (
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-[11px] h-[11px] text-[#011949]"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
                                <span>{task.reposts.toLocaleString()}</span>
                                {(task.targetReposts ?? 0) > 0 && <span className="opacity-60 text-[9px]">/ {(task.targetReposts ?? 0).toLocaleString()}</span>}
                              </span>
                            )}
                            {((task.views ?? 0) > 0 || (task.targetViews ?? 0) > 0) && (
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium">
                                <span className="text-[10px]">👁️</span>
                                <span>{(task.views ?? 0).toLocaleString()}</span>
                                {(task.targetViews ?? 0) > 0 && <span className="opacity-60 text-[9px]">/ {(task.targetViews ?? 0).toLocaleString()}</span>}
                              </span>
                            )}
                            {((task.saves ?? 0) > 0 || (task.targetSaves ?? 0) > 0) && (
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-600 font-medium">
                                <span className="text-[10px]">🔖</span>
                                <span>{(task.saves ?? 0).toLocaleString()}</span>
                                {(task.targetSaves ?? 0) > 0 && <span className="opacity-60 text-[9px]">/ {(task.targetSaves ?? 0).toLocaleString()}</span>}
                              </span>
                            )}
                            {task.likes === 0 && task.comments === 0 && task.shares === 0 && task.reposts === 0 && (task.views ?? 0) === 0 && (task.saves ?? 0) === 0 && (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {isTaskCompleted(task) ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnmarkComplete(task);
                            }}
                            className="text-slate-400 text-[11px] hover:text-[#011949] px-2 py-1 transition-colors"
                          >
                            ↩
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleQuickComplete(task, e)}
                            className="bg-[#C21734]/10 border border-[#C21734]/30 text-[#C21734] text-xs px-2.5 py-1 rounded-lg font-bold hover:bg-[#C21734] hover:text-white transition-colors"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Load more indicator */}
                {visibleCount < filteredTasks.length && (
                  <div className="text-center py-4 text-[#011949]/60 text-xs font-medium">
                    {t('scrollToLoad')} ({visibleCount}/{filteredTasks.length})
                  </div>
                )}

              </div>
            </div>
          )}

          {tasks.length === 0 && !error && !loading && (
            <div className="text-center py-12 text-prada-taupe">
              <p className="text-4xl mb-4">📭</p>
              <p>{t('noTasks')}</p>
            </div>
          )}

          {filteredTasks.length === 0 && tasks.length > 0 && (
            <div className="text-center py-12 text-prada-taupe animate-in fade-in zoom-in duration-700">
              <p className="text-4xl mb-4 grayscale opacity-40">🎉</p>
              <p className="font-bold tracking-widest uppercase text-xs opacity-60">{t('allDone')}</p>
            </div>
          )}
        </div>
      </main >

      {/* Bottom Bar Container (Fixed at bottom, transparent) */}
      < footer className="relative z-40 flex-shrink-0 bg-transparent pt-2 pb-2" >
        <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto relative px-4">
          {/* Stats Bar - Deep Indigo Theme */}
          <div className="bg-[#011949]/95 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center justify-between shadow-2xl border border-[#011949]/40 w-full shadow-[#011949]/30">
            <button
              onClick={() => setShowPlatformSummaryModal(true)}
              className="flex items-center gap-1.5 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <span className="text-[12px] font-bold text-white whitespace-nowrap">✦ {t('summary')}</span>
            </button>

            <div className="w-px h-6 bg-white/10" />

            <button
              onClick={() => setShowStatsCard(true)}
              className="flex flex-col items-center min-w-[45px] hover:opacity-70 transition-opacity"
            >
              <div className="text-[13px] font-bold text-white shadow-sm leading-none mb-0.5">
                📊
              </div>
              <div className="text-[7.5px] text-prada-cream/80 uppercase tracking-widest whitespace-nowrap leading-none">{language === 'th' ? 'สถิติของฉัน' : 'My Stats'}</div>
            </button>

            <div className="w-px h-6 bg-white/10" />

            <div className="flex flex-col items-center min-w-[45px]">
              <div className="text-[11px] font-bold text-prada-cream flex items-baseline leading-none mb-0.5 whitespace-nowrap">
                {pendingCount} <span className="text-[9px] font-normal opacity-60 ml-1">/ {totalTasksList.length}</span>
              </div>
              <div className="text-[7.5px] text-prada-cream/60 uppercase tracking-widest whitespace-nowrap leading-none">{t('pending')}</div>
            </div>

            <div className="w-px h-6 bg-white/10" />

            <div className="flex flex-col items-center min-w-[45px]">
              <div className="text-[13px] font-bold text-white leading-none mb-0.5">
                {totalTasksList.length
                  ? (totalCompletedCount === totalTasksList.length
                    ? 100
                    : Math.floor((totalCompletedCount / totalTasksList.length) * 100))
                  : 0}%
              </div>
              <div className="text-[7.5px] text-prada-cream/60 uppercase tracking-widest leading-none">{t('totalLabel')}</div>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Refresh Button */}
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className={`flex-shrink-0 p-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition-all ${refreshing ? 'animate-spin opacity-50' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5 text-white">
                <path d="M4 4v5h5M20 20v-5h-5M20 9A9 9 0 0 0 5.64 5.64L4 9M4 15a9 9 0 0 0 14.36 3.36L20 15" />
              </svg>
            </button>
          </div>
        </div>
      </footer >

      {/* Stats Bottom Sheet Modal */}
      {
        showStatsModal && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            onClick={() => setShowStatsModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-prada-charcoal/40 backdrop-blur-sm animate-in fade-in duration-200"></div>

            {/* Modal Content */}
            <div
              className="relative w-full max-w-md bg-prada-offwhite/98 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-prada-warm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 pb-safe"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle bar (mobile) */}
              <div className="w-12 h-1.5 bg-prada-warm rounded-full mx-auto mt-3 mb-2 sm:hidden" />

              {/* Header */}
              <div className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-prada-warm/50">
                <h3 className="text-lg font-display font-bold text-prada-charcoal flex items-center gap-2">
                  <span className="text-prada-gold font-serif">✦</span> {t('missionImpact')}
                </h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="w-8 h-8 rounded-full bg-prada-cream hover:bg-prada-stone flex items-center justify-center text-prada-charcoal/60 hover:text-prada-charcoal transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Stats Content */}
              <div className="p-5">
                <div className="flex flex-col gap-4">
                  <div className="bg-prada-cream/50 rounded-2xl p-4 border border-prada-warm flex items-center justify-between">
                    <span className="text-sm font-medium text-prada-charcoal/80 uppercase tracking-wider">{t('completedTasks')}</span>
                    <span className="text-lg font-bold text-prada-charcoal">
                      {totalCompletedCount} <span className="text-sm font-normal text-prada-taupe">/ {totalTasksList.length}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-2xl p-4 border border-prada-warm shadow-sm flex flex-col items-center justify-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-rose-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                      <span className="text-[10px] text-prada-taupe font-bold uppercase tracking-wider mt-1">{t('likes')}</span>
                      <span className="text-xl font-display font-bold text-prada-charcoal mt-0.5">
                        {allTasksStats.likes.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-prada-warm shadow-sm flex flex-col items-center justify-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-400"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                      <span className="text-[10px] text-prada-taupe font-bold uppercase tracking-wider mt-1">{t('comments')}</span>
                      <span className="text-xl font-display font-bold text-prada-charcoal mt-0.5">
                        {allTasksStats.comments.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-prada-warm shadow-sm flex flex-col items-center justify-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-prada-charcoal/70"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>
                      <span className="text-[10px] text-prada-taupe font-bold uppercase tracking-wider mt-1">{t('shares')}</span>
                      <span className="text-xl font-display font-bold text-prada-charcoal mt-0.5">
                        {allTasksStats.shares.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl p-4 border border-prada-warm shadow-sm flex flex-col items-center justify-center gap-1">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>
                      <span className="text-[10px] text-prada-taupe font-bold uppercase tracking-wider mt-1">{t('reposts')}</span>
                      <span className="text-xl font-display font-bold text-prada-charcoal mt-0.5">
                        {allTasksStats.reposts.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )
      }

      {/* Platform Summary Modal */}
      {
        showPlatformSummaryModal && (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            onClick={() => setShowPlatformSummaryModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-prada-charcoal/40 backdrop-blur-sm animate-in fade-in duration-200"></div>

            {/* Modal Content */}
            <div
              className="relative w-full max-w-md bg-prada-offwhite/98 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-prada-warm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 pb-safe"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle bar (mobile) */}
              <div className="w-12 h-1.5 bg-prada-warm rounded-full mx-auto mt-3 mb-2 sm:hidden" />

              {/* Header */}
              <div className="px-5 pt-3.5 pb-4 flex items-center justify-between bg-prada-charcoal shrink-0 shadow-md">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-white font-serif">✦</span> {t('summary')}
                </h3>
                <button
                  onClick={() => setShowPlatformSummaryModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors border border-white/20"
                >
                  ✕
                </button>
              </div>

              {/* Stats Content */}
              <div className="p-5 overflow-y-auto max-h-[70vh] sm:max-h-[80vh]">
                <div className="flex flex-col gap-4">

                  {/* Grand Total Overview */}
                  {(() => {
                    const totalAll = getPlatformStats(undefined, summaryModalPeriod);
                    return (
                      <div className="bg-gradient-to-br from-white to-prada-cream/30 backdrop-blur-xl rounded-[2rem] p-4 sm:p-5 shadow-xl shadow-black/5 border border-prada-warm/20 relative overflow-hidden mb-1 flex flex-col gap-3">
                        {/* Decorative subtle element */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/40 rounded-full blur-2xl"></div>

                        <div className="relative z-10 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-prada-charcoal font-serif text-lg">✦</span>
                            <h4 className="text-prada-charcoal font-bold text-[15px] tracking-wide">{t('totalStats')}</h4>
                          </div>

                          {/* MIV / EMV Toggle */}
                          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl shadow-sm border border-prada-warm/30">
                            <button
                              onClick={() => setSummaryModalPeriod('miv')}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-[0.15em] transition-all ${summaryModalPeriod === 'miv'
                                ? 'bg-prada-charcoal text-white shadow-md'
                                : 'text-prada-charcoal/60 hover:text-prada-charcoal'
                                }`}
                            >
                              MIV
                            </button>
                            <button
                              onClick={() => setSummaryModalPeriod('emv')}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-bold tracking-[0.15em] transition-all ${summaryModalPeriod === 'emv'
                                ? 'bg-prada-charcoal text-white shadow-md'
                                : 'text-prada-charcoal/60 hover:text-prada-charcoal'
                                }`}
                            >
                              EMV
                            </button>
                          </div>
                        </div>

                        <div className="relative z-10 flex flex-col gap-4">

                          {/* Highlighted Likes */}
                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-prada-warm/20 flex items-center justify-between shadow-sm">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 mb-1">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-prada-charcoal"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                <span className="text-prada-charcoal font-bold text-base uppercase tracking-wider">{t('totalLikesLabel')}</span>
                              </div>
                              <span className="text-prada-taupe/60 text-[10px] sm:text-[11px] font-medium leading-tight">{t('totalLikesDesc')}</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold text-prada-charcoal tracking-tight truncate max-w-[50%]" title={totalAll.likes.toLocaleString()}>{totalAll.likes.toLocaleString()}</span>
                          </div>

                          {/* Other Stats Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Comments */}
                            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-prada-warm/30 flex flex-col hover:border-prada-warm/50 transition-colors shadow-sm">
                              <div className="flex items-center justify-between mb-1.5 gap-2">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-prada-charcoal font-bold text-xs uppercase tracking-wider">{t('commentsLabel')}</span>
                                </div>
                                <span className="text-[13px] font-bold text-prada-charcoal truncate" title={totalAll.comments.toLocaleString()}>{totalAll.comments.toLocaleString()}</span>
                              </div>
                              <span className="text-prada-taupe/40 text-[9.5px] font-medium leading-tight line-clamp-1">{t('commentsDesc')}</span>
                            </div>

                            {/* Shares & Reposts */}
                            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-prada-warm/30 flex flex-col hover:border-prada-warm/50 transition-colors shadow-sm">
                              <div className="flex items-center justify-between mb-1.5 gap-2">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-prada-charcoal font-bold text-xs uppercase tracking-wider">{t('sharesLabel')}</span>
                                </div>
                                <span className="text-[13px] font-bold text-prada-charcoal truncate" title={(totalAll.shares + totalAll.reposts).toLocaleString()}>{(totalAll.shares + totalAll.reposts).toLocaleString()}</span>
                              </div>
                              <span className="text-prada-taupe/40 text-[9.5px] font-medium leading-tight line-clamp-1">{t('sharesDesc')}</span>
                            </div>

                            {/* Saves */}
                            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-prada-warm/30 flex flex-col hover:border-prada-warm/50 transition-colors shadow-sm">
                              <div className="flex items-center justify-between mb-1.5 gap-2">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-prada-charcoal font-bold text-xs uppercase tracking-wider">{t('savesLabel')}</span>
                                </div>
                                <span className="text-[13px] font-bold text-prada-charcoal truncate" title={totalAll.saves.toLocaleString()}>{totalAll.saves.toLocaleString()}</span>
                              </div>
                              <span className="text-prada-taupe/40 text-[9.5px] font-medium leading-tight line-clamp-1">{t('savesDesc')}</span>
                            </div>

                            {/* Views */}
                            <div className="bg-white/80 backdrop-blur-md rounded-xl p-3 border border-prada-warm/30 flex flex-col hover:border-prada-warm/50 transition-colors shadow-sm">
                              <div className="flex items-center justify-between mb-1.5 gap-2">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-prada-charcoal font-bold text-xs uppercase tracking-wider">{t('viewsLabel')}</span>
                                </div>
                                <span className="text-[13px] font-bold text-prada-charcoal truncate" title={totalAll.views.toLocaleString()}>{totalAll.views.toLocaleString()}</span>
                              </div>
                              <span className="text-prada-taupe/40 text-[9.5px] font-medium leading-tight line-clamp-1">{t('viewsDesc')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {[
                    { id: 'instagram', label: t('igLabel'), icon: <InstagramIcon />, color: 'from-rose-400 to-purple-500' },
                    { id: 'tiktok', label: t('ttLabel'), icon: <TikTokIcon />, color: 'from-prada-charcoal to-prada-black' },
                    { id: 'x', label: t('xLabel'), icon: <XIcon />, color: 'from-slate-700 to-slate-900' },
                    { id: 'threads', label: t('threadsLabel'), icon: <ThreadsIcon />, color: 'from-zinc-800 to-black' },
                    { id: 'facebook', label: t('fbLabel'), icon: <FacebookIcon />, color: 'from-blue-500 to-blue-700' },
                    { id: 'youtube', label: t('ytLabel'), icon: <YouTubeIcon />, color: 'from-red-500 to-red-700' },
                  ].map(p => {
                    const stats = platformStatsMap[p.id] || dashboardStats;

                    // Base Icons
                    const likeIcon = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-1"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
                    const commentIcon = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-1"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>;
                    const shareIcon = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-1"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>;
                    const repostIcon = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-1"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" /></svg>;
                    const viewIcon = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-1"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>;
                    const sendIcon = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-1"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>;
                    const saveIcon = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mb-1"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg>;

                    let metrics: { label: string, value: number, color: string, icon: any }[] = [];

                    if (p.id === 'instagram') {
                      metrics = [
                        { label: t('likes'), value: stats.likes, color: 'text-rose-400', icon: likeIcon },
                        { label: t('comments'), value: stats.comments, color: 'text-blue-400', icon: commentIcon },
                        { label: t('reposts'), value: stats.reposts, color: 'text-purple-400', icon: repostIcon },
                        { label: t('sends'), value: stats.shares, color: 'text-indigo-400', icon: sendIcon },
                        { label: t('view'), value: stats.views, color: 'text-emerald-500', icon: viewIcon },
                      ];
                    } else if (p.id === 'tiktok') {
                      metrics = [
                        { label: t('likes'), value: stats.likes, color: 'text-rose-400', icon: likeIcon },
                        { label: t('comments'), value: stats.comments, color: 'text-blue-400', icon: commentIcon },
                        { label: t('saves'), value: stats.saves, color: 'text-amber-500', icon: saveIcon },
                        { label: t('shares'), value: stats.shares, color: 'text-prada-charcoal/70', icon: shareIcon },
                      ];
                    } else if (p.id === 'x') {
                      metrics = [
                        { label: t('likes'), value: stats.likes, color: 'text-rose-400', icon: likeIcon },
                        { label: t('replies'), value: stats.comments, color: 'text-blue-400', icon: commentIcon },
                        { label: t('reposts'), value: stats.reposts, color: 'text-purple-400', icon: repostIcon },
                      ];
                    } else if (p.id === 'facebook') {
                      metrics = [
                        { label: t('likes'), value: stats.likes, color: 'text-blue-500', icon: likeIcon },
                        { label: t('comments'), value: stats.comments, color: 'text-blue-400', icon: commentIcon },
                        { label: t('shares'), value: stats.shares, color: 'text-prada-charcoal/70', icon: shareIcon },
                      ];
                    } else if (p.id === 'youtube') {
                      metrics = [
                        { label: t('likes'), value: stats.likes, color: 'text-rose-500', icon: likeIcon },
                        { label: t('comments'), value: stats.comments, color: 'text-blue-400', icon: commentIcon },
                        { label: t('view'), value: stats.views, color: 'text-emerald-500', icon: viewIcon },
                      ];
                    } else if (p.id === 'threads') {
                      metrics = [
                        { label: t('likes'), value: stats.likes, color: 'text-rose-400', icon: likeIcon },
                        { label: t('replies'), value: stats.comments, color: 'text-blue-400', icon: commentIcon },
                        { label: t('reposts'), value: stats.reposts, color: 'text-purple-400', icon: repostIcon },
                      ];
                    }

                    return (
                      <div key={p.id} className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-prada-warm/30 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center gap-2 border-b border-prada-warm/50 pb-2">
                          {p.icon && (
                            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${p.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                              <div className="scale-75">{p.icon}</div>
                            </div>
                          )}
                          <span className="font-bold text-prada-charcoal text-[13px]">{p.label}</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {metrics.map((m, idx) => (
                            <div key={idx} className={`flex flex-col items-center min-w-[56px] ${metrics.length === 4 ? 'w-[22%]' : 'w-[30%]'} overflow-hidden`}>
                              <span className={m.color}>{m.icon}</span>
                              <span className="text-[9px] uppercase font-bold text-prada-charcoal/50 mb-0.5 tracking-wider text-center whitespace-nowrap w-full truncate">{m.label}</span>
                              <span className="text-[11px] sm:text-xs font-bold text-prada-charcoal tabular-nums w-full text-center truncate" title={m.value.toLocaleString()}>{m.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Platform-Specific Task Modal */}
      {
        selectedTask && (() => {
          const platform = selectedTask.platform;
          const config = platformConfig[platform as keyof typeof platformConfig] || { color: 'from-slate-400 to-slate-500', icon: null, name: 'Unknown' };
          const isFacebook = platform === 'facebook';
          const effectiveHashtags = getCaption(selectedTask);
          const hasHashtags = !isFacebook && !!effectiveHashtags;
          const activePool = msgPools[language]?.complete?.length ? msgPools[language] : msgPools.en;
          const msgReady = (activePool?.complete?.length ?? 0) > 0;

          // Per-platform usage tips
          const tips: string[] = (() => {
            if (platform === 'instagram') return [t('igTip1'), t('igTip2'), t('igTip3')];
            if (platform === 'x') return [t('xTip1')];
            if (platform === 'tiktok') return [t('ttTip1'), t('ttTip2')];
            if (platform === 'youtube') return [t('ytTip1'), t('ytTip2')];
            if (platform === 'facebook') return [t('fbTip1')];
            return [];
          })();

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTask(null)}
            >
              <div className="absolute inset-0 bg-prada-charcoal/40 backdrop-blur-sm animate-in fade-in duration-200" />

              <div
                className="relative w-full max-w-[380px] bg-prada-offwhite rounded-[24px] shadow-2xl border border-prada-warm/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
              >

                {/* Header */}
                <div className="px-4 py-3 pb-2.5 flex items-center justify-between border-b border-prada-warm/60 bg-white/40">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                      {config.icon}
                    </div>
                    <p className="text-[14px] font-bold text-prada-charcoal truncate">{selectedTask.title || t('noTitle')}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="w-8 h-8 rounded-full bg-prada-cream/50 hover:bg-prada-warm flex items-center justify-center text-prada-taupe transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Image Banner if available */}
                {selectedTask.image && (
                  <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-black/5 shrink-0 border-b border-prada-warm/40">
                    <img
                      src={selectedTask.image}
                      alt={selectedTask.title || 'Task Image'}
                      className="w-full h-full object-cover object-top"
                      style={{ objectPosition: 'top center' }}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    {selectedTask.boost && selectedTask.boost.includes(1) && (
                      <span className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E00034] text-white shadow-sm flex items-center gap-1">
                        🚀 Featured Boost
                      </span>
                    )}
                  </div>
                )}

                {/* Body Content */}
                <div className="p-4 space-y-3.5 bg-prada-offwhite flex-1 overflow-y-auto max-h-[75vh]">

                  {/* 1. Hashtags */}
                  {hasHashtags && (
                    <div className="relative bg-white border border-prada-warm/60 rounded-[16px] p-3 pt-2.5 shadow-sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-prada-taupe/80 uppercase tracking-widest">{t('sectionHashtags')}</span>
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyHashtags(selectedTask)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm ${copiedType === 'hashtags'
                            ? 'text-white bg-emerald-500 border-emerald-600'
                            : 'text-prada-charcoal bg-prada-cream/40 border-prada-warm hover:bg-prada-cream hover:border-prada-taupe/40'
                            }`}
                        >
                          {copiedType === 'hashtags' ? (
                            t('copiedBtn')
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                              {t('copyTagsBtn')}
                            </>
                          )}
                        </button>
                      </div>
                      <div className="max-h-32 overflow-y-auto pr-1">
                        <p className="text-[12.5px] text-prada-charcoal/90 leading-relaxed font-medium whitespace-pre-wrap">{effectiveHashtags}</p>
                      </div>
                    </div>
                  )}

                  {/* 2. Generated Message */}
                  <div className="relative bg-white border border-prada-warm/60 rounded-[16px] p-3 pt-2.5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-prada-taupe/80 uppercase tracking-widest">{t('sectionMessage')}</span>
                      <div className="flex items-center gap-1.5">
                        {/* Regenerate Button */}
                        {generatedMessage && msgReady && (
                          <button
                            onClick={generateRandomMessage}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-prada-charcoal bg-prada-cream/40 border border-prada-warm hover:bg-prada-cream hover:border-prada-taupe/40 transition-all shadow-sm"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                            {t('regenerate')}
                          </button>
                        )}
                        {/* Copy Button */}
                        {generatedMessage && (
                          <button
                            onClick={handleCopyMessage}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm ${copiedType === 'message'
                              ? 'text-white bg-emerald-500 border-emerald-600'
                              : 'text-prada-charcoal bg-prada-cream/40 border-prada-warm hover:bg-prada-cream hover:border-prada-taupe/40'
                              }`}
                          >
                            {copiedType === 'message' ? (
                              t('copiedBtn')
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                {t('copyMsgBtn')}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {!generatedMessage ? (
                      <button
                        onClick={generateRandomMessage}
                        disabled={!msgReady}
                        className={`w-full py-4 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${msgReady
                          ? 'bg-prada-cream/80 hover:bg-prada-cream text-prada-charcoal border border-prada-warm'
                          : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          }`}
                      >
                        {msgReady ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-amber-500"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="m5 3 1 1" /><path d="m5 21 1-1" /><path d="m21 3-1 1" /><path d="m21 21-1-1" /></svg>
                            {t('generateCaption')}
                          </>
                        ) : t('noPositiveMessages')}
                      </button>
                    ) : (
                      <p className="text-[13px] text-prada-charcoal leading-relaxed">{generatedMessage}</p>
                    )}
                  </div>

                  {/* 3. Primary Actions */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    {!isFacebook && generatedMessage && hasHashtags && (
                      <button
                        onClick={() => handleCopyBoth(selectedTask)}
                        className={`w-full py-3 rounded-[14px] text-[12.5px] font-bold transition-all shadow-sm border flex items-center justify-center gap-1.5 ${copiedType === 'both'
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-prada-cream/60 hover:bg-prada-cream text-prada-charcoal border-prada-warm hover:border-prada-taupe/40'
                          }`}
                      >
                        {copiedType === 'both' ? (
                          t('copiedBtn')
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            {t('copyAllBtn')}
                          </>
                        )}
                      </button>
                    )}

                    {showMarkDone && (
                      <div className="flex gap-2.5">
                        <button
                          onClick={() => handleGoToPost(selectedTask)}
                          className={`flex-1 py-3.5 rounded-[14px] bg-gradient-to-r ${config.color} hover:opacity-90 text-[12.5px] font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1.5`}
                        >
                          {t('goPost')}
                        </button>

                        {isTaskCompleted(selectedTask) ? (
                          <button
                            onClick={() => handleUnmarkComplete(selectedTask)}
                            className="flex-1 py-3.5 rounded-[14px] bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 text-[12.5px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {t('done')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkComplete(selectedTask)}
                            className="flex-1 py-3.5 rounded-[14px] bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-[12.5px] font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1.5 border border-transparent"
                          >
                            {t('markDoneBtn')}
                          </button>
                        )}
                      </div>
                    )}
                    {!showMarkDone && (
                      <button
                        onClick={() => handleGoToPost(selectedTask)}
                        className={`w-full py-3.5 rounded-[14px] bg-gradient-to-r ${config.color} hover:opacity-90 text-[12.5px] font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1.5`}
                      >
                        {t('goPost')}
                      </button>
                    )}
                  </div>

                  {/* 4. Subtle Tips */}
                  {tips.length > 0 && (
                    <div className="text-center pt-2 space-y-1">
                      {tips.map((tip, i) => (
                        <p key={i} className="text-[10px] text-prada-taupe/60 italic leading-snug">{tip}</p>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })()
      }


      {/* 🎬 Credits Floating Button — visible only when feature enabled & all focus+hot tasks are done */}
      {showEndCreditsFeature && allFocusTasks.length > 0 && allFocusTasksDone && (
        <div className="fixed bottom-24 right-5 z-50">
          <div className="relative">
            {/* Glowing Ping Effect */}
            <div className="absolute inset-0 rounded-full bg-[#E35D6A] animate-ping opacity-60 duration-1000"></div>

            <button
              onClick={() => creditsSubmitted ? setShowEndCredits(true) : setShowNameSubmit(true)}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#E35D6A] to-[#C53A4B] border-[3px] border-white/50 shadow-xl shadow-[#C53A4B]/50 flex flex-col items-center justify-center gap-0.5 hover:scale-110 active:scale-95 transition-all group overflow-hidden"
              title={creditsSubmitted ? 'ดู End Credits' : 'ลงชื่อใน Credits'}
            >
              {/* Shine sweep effect on hover */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>

              <span className="text-2xl leading-none drop-shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-300">
                {creditsSubmitted ? '✨' : '🎟️'}
              </span>
              <span className="text-white text-[8px] font-black tracking-[0.15em] uppercase leading-none mt-1 drop-shadow-sm">
                {language === 'th' ? 'เครดิต' : 'Credits'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 🏅 Name Submit Modal (100% Complete — combined achievement + credits) */}
      <NameSubmitModal
        isOpen={showNameSubmit}
        onClose={() => setShowNameSubmit(false)}
        onSubmitted={() => {
          setCreditsSubmitted(true);
          setShowNameSubmit(false);
          setTimeout(() => setShowEndCredits(true), 500);
        }}
        onViewCredits={() => {
          setShowNameSubmit(false);
          setShowEndCredits(true);
        }}
        completedCount={totalCompletedCount}
        totalCount={totalTasksList.length}
      />

      {/* 🎬 End Credits Modal */}
      <EndCreditsModal
        isOpen={showEndCredits}
        onClose={() => setShowEndCredits(false)}
      />

      {/* 📊 Personal Stats Card Modal */}
      <StatsCardModal
        isOpen={showStatsCard}
        onClose={() => setShowStatsCard(false)}
        completed={completed}
        allTasks={allTasks}
        totalTasksCount={totalTasksList.length}
      />

    </div >
  );
}

export default App;
