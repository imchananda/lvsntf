import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaWeibo,
  FaTiktok,
  FaSearch,
  FaSync,
  FaStar,
  FaExternalLinkAlt,
  FaFilter,
  FaUserFriends,
  FaChartBar,
  FaEdit,
  FaTimes,
  FaSave,
  FaUsers,
  FaSpinner,
} from 'react-icons/fa';
import { FaXTwitter, FaThreads } from 'react-icons/fa6';
import { SiXiaohongshu } from 'react-icons/si';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminSheetTask {
  id: string;
  mark: boolean;
  platform: string;
  media: string;
  title: string;
  url: string;
  artist: string;
  boost: string;
  target: string;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  views: number;
  saves: number;
  image?: string;
  source?: 'local' | 'sheet';
}

interface FollowerData {
  before: number;
  after: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseAbbreviatedNumber = (val: string): number => {
  if (!val) return 0;
  const s = val.toString().toLowerCase().trim().replace(/,/g, '');
  if (!s) return 0;
  let mul = 1;
  let num = s;
  if (s.endsWith('k')) { mul = 1000; num = s.slice(0, -1); }
  else if (s.endsWith('m')) { mul = 1000000; num = s.slice(0, -1); }
  const r = parseFloat(num) * mul;
  return isNaN(r) ? 0 : Math.round(r);
};

const fmt = (n: number) => n.toLocaleString('en-US');

// ─── CSV Parser ───────────────────────────────────────────────────────────────
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

// ─── Default Follower benchmarks ─────────────────────────────────────────────
const DEFAULT_NAMTAN_FOLLOWERS: FollowerData = {
  before: 2817680,
  after: 2828997,
};

const DEFAULT_FILM_FOLLOWERS: FollowerData = {
  before: 1520000,
  after: 1535400,
};

export default function AdminCalculator() {
  const [tasks, setTasks] = useState<AdminSheetTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Follower State
  const [namtanFollowers, setNamtanFollowers] = useState<FollowerData>(() => {
    try {
      const saved = localStorage.getItem('ntf_followers_namtan');
      return saved ? JSON.parse(saved) : DEFAULT_NAMTAN_FOLLOWERS;
    } catch {
      return DEFAULT_NAMTAN_FOLLOWERS;
    }
  });

  const [filmFollowers, setFilmFollowers] = useState<FollowerData>(() => {
    try {
      const saved = localStorage.getItem('ntf_followers_film');
      return saved ? JSON.parse(saved) : DEFAULT_FILM_FOLLOWERS;
    } catch {
      return DEFAULT_FILM_FOLLOWERS;
    }
  });

  const [showEditFollowersModal, setShowEditFollowersModal] = useState(false);
  const [editNamtanForm, setEditNamtanForm] = useState<FollowerData>(namtanFollowers);
  const [editFilmForm, setEditFilmForm] = useState<FollowerData>(filmFollowers);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterArtist, setFilterArtist] = useState<string>('all');
  const [filterBoost, setFilterBoost] = useState<'all' | 'boost' | 'marked'>('all');

  const [isSavingFollowers, setIsSavingFollowers] = useState(false);

  // Fetch Follower Data from separate sheet tab 'followers'
  const fetchFollowers = useCallback(async () => {
    try {
      // 1. Try reading via GAS admin-sheet
      const res = await fetch('/api/admin-sheet?action=readAll&sheetName=followers');
      if (res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const row = json.data.find((r: any) => r.id === 'followers_summary' || r.id === 'global_settings') || json.data[0];
            if (row) {
              const nb = parseAbbreviatedNumber(row.namtan_followers_before || row.namtan_before);
              const na = parseAbbreviatedNumber(row.namtan_followers_after || row.namtan_after);
              const fb = parseAbbreviatedNumber(row.film_followers_before || row.film_before);
              const fa = parseAbbreviatedNumber(row.film_followers_after || row.film_after);

              if (nb > 0 && na > 0) {
                const nData = { before: nb, after: na };
                setNamtanFollowers(nData);
                localStorage.setItem('ntf_followers_namtan', JSON.stringify(nData));
              }
              if (fb > 0 && fa > 0) {
                const fData = { before: fb, after: fa };
                setFilmFollowers(fData);
                localStorage.setItem('ntf_followers_film', JSON.stringify(fData));
              }
              return;
            }
          }
        } catch { /* JSON parse fallback */ }
      }

      // 2. Fallback CSV fetch from sheetName=followers
      const fallbackRes = await fetch('/api/sheet?sheetName=followers');
      if (fallbackRes.ok) {
        const csv = await fallbackRes.text();
        const rows = parseCSV(csv.replace(/^\uFEFF/, ''));
        if (rows.length > 1) {
          const headers = rows[0].map(h => h.toLowerCase().trim());
          const getVal = (r: string[], h: string) => {
            const idx = headers.indexOf(h.toLowerCase().trim());
            return idx !== -1 ? (r[idx] || '') : '';
          };
          const row = rows.find(r => getVal(r, 'id') === 'followers_summary' || getVal(r, 'id') === 'global_settings') || rows[1];
          if (row) {
            const nb = parseAbbreviatedNumber(getVal(row, 'namtan_followers_before') || getVal(row, 'namtan_before'));
            const na = parseAbbreviatedNumber(getVal(row, 'namtan_followers_after') || getVal(row, 'namtan_after'));
            const fb = parseAbbreviatedNumber(getVal(row, 'film_followers_before') || getVal(row, 'film_before'));
            const fa = parseAbbreviatedNumber(getVal(row, 'film_followers_after') || getVal(row, 'film_after'));

            if (nb > 0 && na > 0) {
              const nData = { before: nb, after: na };
              setNamtanFollowers(nData);
              localStorage.setItem('ntf_followers_namtan', JSON.stringify(nData));
            }
            if (fb > 0 && fa > 0) {
              const fData = { before: fb, after: fa };
              setFilmFollowers(fData);
              localStorage.setItem('ntf_followers_film', JSON.stringify(fData));
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch followers from separate sheet:', err);
    }
  }, []);

  // Fetch Sheet Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    fetchFollowers();
    try {
      let res = await fetch('/api/admin-sheet?action=readAll&sheetGID=0');
      let isProxySuccess = false;

      if (res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            isProxySuccess = true;

            const parsed: AdminSheetTask[] = json.data
              .filter((r: any) => r.id && r.id !== 'global_settings')
              .map((r: any) => {
                let rawPlatform = (r.platform || 'x').toLowerCase().trim();
                if (['ig', 'instagram', 'insta'].includes(rawPlatform)) rawPlatform = 'instagram';
                else if (['fb', 'facebook'].includes(rawPlatform)) rawPlatform = 'facebook';
                else if (['tt', 'tiktok'].includes(rawPlatform)) rawPlatform = 'tiktok';
                else if (['yt', 'youtube'].includes(rawPlatform)) rawPlatform = 'youtube';
                else if (['threads', 'thread', 'th'].includes(rawPlatform)) rawPlatform = 'threads';

                const markVal = (r.mark || '').toString().toLowerCase().trim();
                const focusVal = (r.focus || '').toString().toLowerCase().trim();
                const isMarked = markVal === '1' || markVal === 'true' || markVal === 'yes' || focusVal === '1' || focusVal === 'hot' || focusVal === '2';

                let artistVal = (r.artist || '').toString().toLowerCase().trim();
                if (!artistVal) {
                  const t = ((r.title || '') + ' ' + (r.media || '')).toLowerCase();
                  if (t.includes('namtanfilm') || (t.includes('namtan') && t.includes('film'))) artistVal = 'both';
                  else if (t.includes('namtan') || t.includes('tipnaree')) artistVal = 'namtan';
                  else if (t.includes('film') || t.includes('rachanun')) artistVal = 'film';
                  else artistVal = 'both';
                }

                return {
                  id: r.id,
                  mark: isMarked,
                  platform: rawPlatform,
                  media: r.media || '',
                  title: r.title || r.note || '',
                  url: r.url || '',
                  artist: artistVal,
                  boost: r.boost || '',
                  target: r.target || '',
                  likes: parseAbbreviatedNumber(r.likes || r.like),
                  comments: parseAbbreviatedNumber(r.comments || r.comment),
                  shares: parseAbbreviatedNumber(r.shares || r.share),
                  reposts: parseAbbreviatedNumber(r.reposts || r.repost),
                  views: parseAbbreviatedNumber(r.views || r.view),
                  saves: parseAbbreviatedNumber(r.saves || r.save),
                  image: r.image || '',
                  source: 'sheet',
                };
              });

            setTasks(parsed);
          }
        } catch {
          // JSON parse fail fallback to CSV
        }
      }

      if (!isProxySuccess) {
        const fallbackRes = await fetch('/api/sheet?gid=0');
        if (fallbackRes.ok) {
          const csv = await fallbackRes.text();
          const rows = parseCSV(csv.replace(/^\uFEFF/, ''));
          if (rows.length > 0) {
            const headers = rows[0].map(h => h.toLowerCase().trim());
            const getVal = (r: string[], h: string) => {
              const idx = headers.indexOf(h.toLowerCase().trim());
              return idx !== -1 ? (r[idx] || '') : '';
            };

            const parsed: AdminSheetTask[] = [];
            for (let i = 1; i < rows.length; i++) {
              const r = rows[i];
              const id = getVal(r, 'id');
              if (!id || id === 'global_settings') continue;
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
                else artistVal = 'both';
              }

              parsed.push({
                id,
                mark: isMarked,
                platform: rawPlatform,
                media: getVal(r, 'media'),
                title: getVal(r, 'title') || getVal(r, 'note'),
                url,
                artist: artistVal,
                boost: getVal(r, 'boost'),
                target: getVal(r, 'target'),
                likes: parseAbbreviatedNumber(getVal(r, 'likes') || getVal(r, 'like')),
                comments: parseAbbreviatedNumber(getVal(r, 'comments') || getVal(r, 'comment')),
                shares: parseAbbreviatedNumber(getVal(r, 'shares') || getVal(r, 'share')),
                reposts: parseAbbreviatedNumber(getVal(r, 'reposts') || getVal(r, 'repost')),
                views: parseAbbreviatedNumber(getVal(r, 'views') || getVal(r, 'view')),
                saves: parseAbbreviatedNumber(getVal(r, 'saves') || getVal(r, 'save')),
                image: getVal(r, 'image'),
                source: 'sheet',
              });
            }
            setTasks(parsed);
          }
        }
      }

      setLastUpdated(new Date().toLocaleTimeString('th-TH'));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFollowers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save Followers to State, LocalStorage & Separate Sheet Tab 'followers'
  const handleSaveFollowers = async () => {
    setIsSavingFollowers(true);
    setNamtanFollowers(editNamtanForm);
    setFilmFollowers(editFilmForm);
    localStorage.setItem('ntf_followers_namtan', JSON.stringify(editNamtanForm));
    localStorage.setItem('ntf_followers_film', JSON.stringify(editFilmForm));

    const followerPayload = {
      id: 'followers_summary',
      namtan_followers_before: String(editNamtanForm.before),
      namtan_followers_after: String(editNamtanForm.after),
      film_followers_before: String(editFilmForm.before),
      film_followers_after: String(editFilmForm.after),
      namtan_before: String(editNamtanForm.before),
      namtan_after: String(editNamtanForm.after),
      film_before: String(editFilmForm.before),
      film_after: String(editFilmForm.after),
    };

    try {
      // 1. Save to separate sheet tab 'followers' via updateRow
      const res = await fetch('/api/admin-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRow',
          sheetName: 'followers',
          sheetGID: 'followers',
          data: followerPayload,
        }),
      });

      const json = await res.json().catch(() => null);

      // 2. If row was not found (e.g. newly created sheet tab without data row), use addRow to insert
      if (!res.ok || !json?.ok || json?.data?.ok === false || json?.data?.error === 'Row not found to update' || json?.error === 'Row not found to update') {
        await fetch('/api/admin-sheet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'addRow',
            sheetName: 'followers',
            sheetGID: 'followers',
            data: followerPayload,
          }),
        });
      }

      // 3. Also save to global_settings in main sheet as fallback
      await fetch('/api/admin-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRow',
          sheetName: 'data',
          sheetGID: '0',
          data: {
            ...followerPayload,
            id: 'global_settings',
          },
        }),
      }).catch(() => null);

      setShowEditFollowersModal(false);
      fetchData();
    } catch (err) {
      console.warn('Could not persist followers to sheet:', err);
      setShowEditFollowersModal(false);
    } finally {
      setIsSavingFollowers(false);
    }
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchMedia = (task.media || '').toLowerCase().includes(q);
        const matchTitle = (task.title || '').toLowerCase().includes(q);
        const matchUrl = (task.url || '').toLowerCase().includes(q);
        if (!matchMedia && !matchTitle && !matchUrl) return false;
      }

      // Platform
      if (filterPlatform !== 'all' && task.platform !== filterPlatform) {
        return false;
      }

      // Artist
      if (filterArtist !== 'all' && task.artist !== filterArtist) {
        return false;
      }

      // Boost / Star
      if (filterBoost === 'boost' && (!task.boost || task.boost === '0')) return false;
      if (filterBoost === 'marked' && !task.mark) return false;

      return true;
    });
  }, [tasks, searchQuery, filterPlatform, filterArtist, filterBoost]);

  // Calculated Metrics
  const metrics = useMemo(() => {
    let likes = 0;
    let comments = 0;
    let shares = 0;
    let reposts = 0;
    let views = 0;
    let saves = 0;

    filteredTasks.forEach(t => {
      likes += t.likes || 0;
      comments += t.comments || 0;
      shares += t.shares || 0;
      reposts += t.reposts || 0;
      views += t.views || 0;
      saves += t.saves || 0;
    });

    const totalEngagement = likes + comments + shares + reposts + views + saves;

    return {
      likes,
      comments,
      shares,
      reposts,
      views,
      saves,
      totalEngagement,
      count: filteredTasks.length,
    };
  }, [filteredTasks]);

  // Artist Breakdown
  const artistBreakdown = useMemo(() => {
    const categories = [
      { id: 'both', label: 'น้ำตาล & ฟิล์ม (คู่)', color: 'bg-[#E00034]' },
      { id: 'namtan', label: 'น้ำตาล (เดี่ยว)', color: 'bg-amber-500' },
      { id: 'film', label: 'ฟิล์ม (เดี่ยว)', color: 'bg-[#122D55]' },
    ];

    return categories.map(cat => {
      const catTasks = filteredTasks.filter(t => t.artist === cat.id);
      let catTotal = 0;
      catTasks.forEach(t => {
        catTotal += (t.likes || 0) + (t.comments || 0) + (t.shares || 0) + (t.reposts || 0) + (t.views || 0) + (t.saves || 0);
      });
      const pct = metrics.totalEngagement > 0 ? (catTotal / metrics.totalEngagement) * 100 : 0;
      return {
        ...cat,
        count: catTasks.length,
        total: catTotal,
        pct,
      };
    });
  }, [filteredTasks, metrics.totalEngagement]);

  // Platform Breakdown
  const platformBreakdown = useMemo(() => {
    const platformsList = [
      { id: 'instagram', label: 'Instagram', icon: <FaInstagram className="text-pink-600" /> },
      { id: 'x', label: 'X (Twitter)', icon: <FaXTwitter className="text-gray-800" /> },
      { id: 'tiktok', label: 'TikTok', icon: <FaTiktok className="text-gray-800" /> },
      { id: 'facebook', label: 'Facebook', icon: <FaFacebook className="text-blue-600" /> },
      { id: 'youtube', label: 'YouTube', icon: <FaYoutube className="text-red-600" /> },
      { id: 'threads', label: 'Threads', icon: <FaThreads className="text-gray-800" /> },
      { id: 'weibo', label: 'Weibo', icon: <FaWeibo className="text-red-500" /> },
      { id: 'red', label: 'RED (小红书)', icon: <SiXiaohongshu className="text-red-500" /> },
    ];

    return platformsList.map(p => {
      const pTasks = filteredTasks.filter(t => t.platform === p.id);
      let pTotal = 0;
      pTasks.forEach(t => {
        pTotal += (t.likes || 0) + (t.comments || 0) + (t.shares || 0) + (t.reposts || 0) + (t.views || 0) + (t.saves || 0);
      });
      const pct = metrics.totalEngagement > 0 ? (pTotal / metrics.totalEngagement) * 100 : 0;
      return {
        ...p,
        count: pTasks.length,
        total: pTotal,
        pct,
      };
    }).filter(p => p.count > 0);
  }, [filteredTasks, metrics.totalEngagement]);

  const namtanGain = namtanFollowers.after - namtanFollowers.before;
  const namtanPct = (namtanGain / namtanFollowers.before) * 100;

  const filmGain = filmFollowers.after - filmFollowers.before;
  const filmPct = (filmGain / filmFollowers.before) * 100;

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-gray-800 font-sans pb-16">
      {/* ── Top Header Banner (Levi's Inspired Bright Red & Denim Navy) ── */}
      <div className="bg-gradient-to-r from-[#122D55] via-[#1E3E62] to-[#122D55] text-white shadow-md border-b-4 border-[#E00034]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#E00034] flex items-center justify-center text-white text-xl shadow-md shrink-0">
              👖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-wide leading-none">
                  NamtanFilm × Levi’s
                </h1>
                <span className="bg-[#E00034] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                  Summary Dashboard
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-1 font-medium">
                สรุปภาพรวมสถิติ Engagement และผู้ติดตามโซเชียลมีเดีย
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {lastUpdated && (
              <span className="text-[11px] text-sky-200/70 font-medium hidden sm:inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                อัปเดต: {lastUpdated}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow-xs cursor-pointer"
              title="ดึงข้อมูลล่าสุดจาก Google Sheets"
            >
              <FaSync className={`text-xs ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรช</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── Section 1: Follower Growth (Namtan & Film) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#122D55] uppercase tracking-wider flex items-center gap-2">
              <FaUsers className="text-[#E00034]" />
              <span>ยอดผู้ติดตาม Instagram (ก่อน vs หลัง อีเวนต์)</span>
            </h2>
            <button
              onClick={() => {
                setEditNamtanForm(namtanFollowers);
                setEditFilmForm(filmFollowers);
                setShowEditFollowersModal(true);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 border border-blue-200 cursor-pointer"
            >
              <FaEdit className="text-[11px]" />
              <span>แก้ไขยอดฟอล</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Namtan Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5 shadow-xs">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-pink-600 font-black text-sm">
                      N
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#122D55] text-base leading-none">น้ำตาล (Namtan)</h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">@namtan.tipnaree</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                  Instagram
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">ก่อนอีเวนต์</div>
                  <div className="text-base sm:text-lg font-black text-gray-600 tabular-nums">{fmt(namtanFollowers.before)}</div>
                </div>
                <div className="border-x border-slate-200">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">หลังอีเวนต์ (ปัจจุบัน)</div>
                  <div className="text-base sm:text-lg font-black text-[#122D55] tabular-nums">{fmt(namtanFollowers.after)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">เพิ่มขึ้น</div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 tabular-nums">
                    +{fmt(namtanGain)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500">
                    (+{namtanPct.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Film Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 via-indigo-600 to-purple-600 p-0.5 shadow-xs">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-blue-600 font-black text-sm">
                      F
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#122D55] text-base leading-none">ฟิล์ม (Film)</h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-0.5">@film.rchanun</p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Instagram
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">ก่อนอีเวนต์</div>
                  <div className="text-base sm:text-lg font-black text-gray-600 tabular-nums">{fmt(filmFollowers.before)}</div>
                </div>
                <div className="border-x border-slate-200">
                  <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">หลังอีเวนต์ (ปัจจุบัน)</div>
                  <div className="text-base sm:text-lg font-black text-[#122D55] tabular-nums">{fmt(filmFollowers.after)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">เพิ่มขึ้น</div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 tabular-nums">
                    +{fmt(filmGain)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500">
                    (+{filmPct.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Filters Bar ── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-[#122D55] uppercase tracking-wider flex items-center gap-1.5">
              <FaFilter className="text-[#E00034]" />
              <span>ตัวกรองสรุปข้อมูล (Interactive Dashboard Filters)</span>
            </h2>
            <span className="text-xs font-bold text-[#122D55] bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              พบ {filteredTasks.length} รายการ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อสื่อ / ข้อความ..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#122D55]/30 focus:border-[#122D55]"
              />
            </div>

            {/* Platform */}
            <div>
              <select
                value={filterPlatform}
                onChange={e => setFilterPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#122D55]/30 focus:border-[#122D55]"
              >
                <option value="all">🌐 แพลตฟอร์ม: ทั้งหมด</option>
                <option value="instagram">📸 Instagram</option>
                <option value="x">🐦 X (Twitter)</option>
                <option value="tiktok">🎵 TikTok</option>
                <option value="facebook">👥 Facebook</option>
                <option value="youtube">▶️ YouTube</option>
                <option value="threads">🧵 Threads</option>
                <option value="weibo">🔴 Weibo</option>
                <option value="red">📕 RED (小红书)</option>
              </select>
            </div>

            {/* Artist Category */}
            <div>
              <select
                value={filterArtist}
                onChange={e => setFilterArtist(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#122D55]/30 focus:border-[#122D55]"
              >
                <option value="all">🎭 ศิลปิน: ทั้งหมด</option>
                <option value="both">👥 น้ำตาลฟิล์มคู่</option>
                <option value="namtan">👩 น้ำตาลเดี่ยว</option>
                <option value="film">👩‍🦰 ฟิล์มเดี่ยว</option>
              </select>
            </div>

            {/* Boost / Star */}
            <div>
              <select
                value={filterBoost}
                onChange={e => setFilterBoost(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#122D55]/30 focus:border-[#122D55]"
              >
                <option value="all">⭐ สถานะพิเศษ: ทั้งหมด</option>
                <option value="boost">🚀 ติด Boost / สื่อสำคัญ</option>
                <option value="marked">⭐ เฉพาะติดดาว</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 3: Engagement Metrics Summary (Hero Card + 6 Metric Grid) ── */}
        <div className="space-y-4">
          {/* Total Hero Card */}
          <div className="bg-gradient-to-r from-[#122D55] via-[#1E3E62] to-[#122D55] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E00034] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                    Total Engagement Summary
                  </span>
                  <span className="text-xs text-sky-200 font-medium">
                    (จาก {metrics.count} โพสต์ที่เลือก)
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-black mt-2 tracking-tight tabular-nums">
                  {fmt(metrics.totalEngagement)}
                </div>
                <p className="text-xs text-sky-200/80 mt-1 font-medium">
                  ยอดการมีส่วนร่วมรวมทั้งหมด (Likes + Comments + Shares + Reposts + Views + Saves)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 border border-white/15 text-center min-w-[100px]">
                  <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">จำนวนโพสต์</div>
                  <div className="text-xl font-black text-white tabular-nums">{fmt(metrics.count)}</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 border border-white/15 text-center min-w-[120px]">
                  <div className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">เฉลี่ยต่อโพสต์</div>
                  <div className="text-xl font-black text-emerald-300 tabular-nums">
                    {metrics.count > 0 ? fmt(Math.round(metrics.totalEngagement / metrics.count)) : 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Metric Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Likes */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-pink-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-600">Likes</span>
                <span className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center text-xs font-bold">❤️</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#122D55] tabular-nums">{fmt(metrics.likes)}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                  {metrics.totalEngagement > 0 ? ((metrics.likes / metrics.totalEngagement) * 100).toFixed(1) : 0}% ของทั้งหมด
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-600">Comments</span>
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold">💬</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#122D55] tabular-nums">{fmt(metrics.comments)}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                  {metrics.totalEngagement > 0 ? ((metrics.comments / metrics.totalEngagement) * 100).toFixed(1) : 0}% ของทั้งหมด
                </div>
              </div>
            </div>

            {/* Shares */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-600">Shares</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">📤</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#122D55] tabular-nums">{fmt(metrics.shares)}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                  {metrics.totalEngagement > 0 ? ((metrics.shares / metrics.totalEngagement) * 100).toFixed(1) : 0}% ของทั้งหมด
                </div>
              </div>
            </div>

            {/* Reposts */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-600">Reposts</span>
                <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold">🔁</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#122D55] tabular-nums">{fmt(metrics.reposts)}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                  {metrics.totalEngagement > 0 ? ((metrics.reposts / metrics.totalEngagement) * 100).toFixed(1) : 0}% ของทั้งหมด
                </div>
              </div>
            </div>

            {/* Views */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-600">Views</span>
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">👁️</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#122D55] tabular-nums">{fmt(metrics.views)}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                  {metrics.totalEngagement > 0 ? ((metrics.views / metrics.totalEngagement) * 100).toFixed(1) : 0}% ของทั้งหมด
                </div>
              </div>
            </div>

            {/* Saves */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-gray-600">Saves</span>
                <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold">🔖</span>
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-[#122D55] tabular-nums">{fmt(metrics.saves)}</div>
                <div className="text-[10px] font-bold text-gray-400 mt-0.5">
                  {metrics.totalEngagement > 0 ? ((metrics.saves / metrics.totalEngagement) * 100).toFixed(1) : 0}% ของทั้งหมด
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Breakdown by Artist & Platform ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Artist Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-[#122D55] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FaUserFriends className="text-[#E00034]" />
                <span>สรุปแยกตามหมวดหมู่ศิลปิน</span>
              </span>
              <span className="text-[10px] font-bold text-gray-400">Share of Total</span>
            </h3>

            <div className="space-y-3">
              {artistBreakdown.map(cat => (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#122D55] flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                      <span>{cat.label}</span>
                      <span className="text-[10px] font-normal text-gray-400">({cat.count} โพสต์)</span>
                    </span>
                    <span className="text-[#122D55] font-black">{fmt(cat.total)} ({cat.pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`${cat.color} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, cat.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-[#122D55] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FaChartBar className="text-[#1D4ED8]" />
                <span>สรุปแยกตามแพลตฟอร์ม</span>
              </span>
              <span className="text-[10px] font-bold text-gray-400">Share of Total</span>
            </h3>

            <div className="space-y-3">
              {platformBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">ไม่มีข้อมูลแพลตฟอร์มตามตัวกรองปัจจุบัน</p>
              ) : (
                platformBreakdown.map(p => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#122D55] flex items-center gap-1.5">
                        {p.icon}
                        <span>{p.label}</span>
                        <span className="text-[10px] font-normal text-gray-400">({p.count} โพสต์)</span>
                      </span>
                      <span className="text-[#122D55] font-black">{fmt(p.total)} ({p.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#122D55] h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, p.pct)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Section 5: Filtered Posts Table List ── */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[#122D55] uppercase tracking-wider flex items-center gap-1.5">
              <span>📜</span> รายการโพสต์ในชุดข้อมูล ({filteredTasks.length} รายการ)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#122D55] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">ดาว</th>
                  <th className="py-3 px-3 w-14 text-center">Platform</th>
                  <th className="py-3 px-3">สื่อ</th>
                  <th className="py-3 px-3 text-right">Likes</th>
                  <th className="py-3 px-3 text-right">Comments</th>
                  <th className="py-3 px-3 text-right">Shares/Reposts</th>
                  <th className="py-3 px-3 text-right">Views</th>
                  <th className="py-3 px-3 text-right">Total Eng</th>
                  <th className="py-3 px-3 text-center w-16">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      ไม่พบรายการโพสต์ที่ตรงกับตัวกรอง
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t, idx) => {
                    const rowTotal = (t.likes || 0) + (t.comments || 0) + (t.shares || 0) + (t.reposts || 0) + (t.views || 0) + (t.saves || 0);
                    return (
                      <tr key={t.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          {t.mark ? <FaStar className="text-amber-500 text-xs inline" /> : <span className="text-gray-300 text-xs">☆</span>}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-50 border border-slate-200">
                            {getPlatformIcon(t.platform)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-800">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#122D55]">{t.media || 'ไม่มีชื่อสื่อ'}</span>
                            {t.boost && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] bg-amber-500/15 text-amber-700 border border-amber-500/30" title="Boost">
                                🚀
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{t.likes ? fmt(t.likes) : '-'}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{t.comments ? fmt(t.comments) : '-'}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{t.shares || t.reposts ? fmt((t.shares || 0) + (t.reposts || 0)) : '-'}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">{t.views ? fmt(t.views) : '-'}</td>
                        <td className="py-2.5 px-3 text-right font-black text-[#122D55] tabular-nums">{fmt(rowTotal)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all inline-flex items-center justify-center"
                            title={t.url}
                          >
                            <FaExternalLinkAlt className="text-xs" />
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Edit Follower Modal ── */}
      {showEditFollowersModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-[#122D55] text-base flex items-center gap-2">
                <FaUsers className="text-[#E00034]" />
                <span>แก้ไขยอดผู้ติดตาม (Follower Numbers)</span>
              </h3>
              <button
                onClick={() => setShowEditFollowersModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Namtan inputs */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-extrabold text-pink-700 flex items-center gap-1.5">
                  <span>📸</span> น้ำตาล (@namtan.tipnaree)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">ก่อนอีเวนต์</label>
                    <input
                      type="number"
                      value={editNamtanForm.before}
                      onChange={e => setEditNamtanForm({ ...editNamtanForm, before: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">หลังอีเวนต์ (ปัจจุบัน)</label>
                    <input
                      type="number"
                      value={editNamtanForm.after}
                      onChange={e => setEditNamtanForm({ ...editNamtanForm, after: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Film inputs */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">
                  <span>📸</span> ฟิล์ม (@film.rchanun)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">ก่อนอีเวนต์</label>
                    <input
                      type="number"
                      value={editFilmForm.before}
                      onChange={e => setEditFilmForm({ ...editFilmForm, before: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">หลังอีเวนต์ (ปัจจุบัน)</label>
                    <input
                      type="number"
                      value={editFilmForm.after}
                      onChange={e => setEditFilmForm({ ...editFilmForm, after: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-gray-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowEditFollowersModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveFollowers}
                disabled={isSavingFollowers}
                className="px-4 py-2 rounded-xl bg-[#122D55] hover:bg-[#1E3E62] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingFollowers ? (
                  <FaSpinner className="text-xs animate-spin" />
                ) : (
                  <FaSave className="text-xs" />
                )}
                <span>{isSavingFollowers ? 'กำลังบันทึกลง Google Sheet...' : 'บันทึกข้อมูล'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
