import { useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface Task {
    id: string;
    phase: string;
    platform: string;
}

interface CompletedState {
    [taskId: string]: { completedAt: string };
}

interface StatsCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    completed: Record<string, CompletedState>;
    allTasks: Record<string, Task[]>;
    totalTasksCount: number;
}

const PLATFORM_EMOJI: Record<string, string> = {
    instagram: '📸',
    tiktok: '🎵',
    x: '🐦',
    facebook: '👥',
    youtube: '▶️',
    threads: '🧵',
};

const PLATFORM_NAME: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    x: 'X (Twitter)',
    facebook: 'Facebook',
    youtube: 'YouTube',
    threads: 'Threads',
};



function formatDate(isoStr: string, lang: string): string {
    const d = new Date(isoStr);
    return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function timeDiff(start: string, end: string, language: string): string {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return language === 'th' ? '0 วัน' : '0 Days';
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    if (days > 0) return language === 'th' ? `${days} วัน` : `${days} Days`;
    return language === 'th' ? `${hours} ชั่วโมง` : `${hours} Hours`;
}

export default function StatsCardModal({ isOpen, onClose, completed, allTasks, totalTasksCount }: StatsCardModalProps) {
    const { language } = useLanguage();

    const stats = useMemo(() => {
        // Collect all completed tasks with timestamps
        const completedTasks: Array<{ task: Task; completedAt: string }> = [];
        Object.entries(completed).forEach(([phase, phaseCompleted]) => {
            const phaseTasks = allTasks[phase] || [];
            phaseTasks.forEach(task => {
                if (phaseCompleted[task.id]) {
                    completedTasks.push({ task, completedAt: phaseCompleted[task.id].completedAt });
                }
            });
        });

        if (completedTasks.length === 0) return null;

        // Platform breakdown
        const platformCount: Record<string, number> = {};
        completedTasks.forEach(({ task }) => {
            platformCount[task.platform] = (platformCount[task.platform] || 0) + 1;
        });
        const topPlatform = Object.entries(platformCount).sort((a, b) => b[1] - a[1])[0];

        // Phase breakdown
        const phaseCount: Record<string, number> = {};
        completedTasks.forEach(({ task }) => {
            const p = task.phase === 'aftermath2' ? 'aftermath' : task.phase;
            phaseCount[p] = (phaseCount[p] || 0) + 1;
        });
        const topPhase = Object.entries(phaseCount).sort((a, b) => b[1] - a[1])[0];

        // Dates
        const sorted = [...completedTasks].sort((a, b) =>
            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
        const firstDate = sorted[0].completedAt;
        const lastDate = sorted[sorted.length - 1].completedAt;

        // Completion percentage — use floor so 99.8% shows as 99%, not 100%
        const pct = totalTasksCount > 0 ? Math.floor((completedTasks.length / totalTasksCount) * 100) : 0;

        // Average tasks per day
        const daysDiff = Math.max(1, Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000));
        const tasksPerDay = (completedTasks.length / daysDiff).toFixed(1);

        return {
            completedCount: completedTasks.length,
            totalCount: totalTasksCount,
            pct,
            topPlatform: topPlatform?.[0] || null,
            topPlatformCount: topPlatform?.[1] || 0,
            topPhase: topPhase?.[0] || null,
            topPhaseCount: topPhase?.[1] || 0,
            firstDate,
            lastDate,
            duration: timeDiff(firstDate, lastDate, language),
            tasksPerDay,
            platformCount,
            phaseCount,
        };
    }, [completed, allTasks, totalTasksCount, language]);

    if (!isOpen) return null;



    const shareText = stats
        ? language === 'th'
            ? `NamtanFilm × Levi’s 👖✨\n\n` +
            `สถิติของฉัน\n` +
            `✅ ทำแล้ว ${stats.completedCount}/${stats.totalCount} ภารกิจ (${stats.pct}%)\n` +
            `📸 Platform หลัก: ${PLATFORM_NAME[stats.topPlatform || ''] || stats.topPlatform}\n` +
            `⚡ เฉลี่ย ${stats.tasksPerDay} ภารกิจ/วัน\n` +
            `📅 เริ่มตั้งแต่: ${formatDate(stats.firstDate, 'th')} (${stats.duration})\n\n` +
            `#NamtanFilmxLevis #LiveInLevis #LevisThailand\n#น้ำตาลฟิล์ม #NamtanFilm`
            : `NamtanFilm × Levi’s 👖✨\n\n` +
            `My Stats\n` +
            `✅ Completed ${stats.completedCount}/${stats.totalCount} missions (${stats.pct}%)\n` +
            `📸 Top Platform: ${PLATFORM_NAME[stats.topPlatform || ''] || stats.topPlatform}\n` +
            `⚡ Avg ${stats.tasksPerDay} tasks/day\n` +
            `📅 Started: ${formatDate(stats.firstDate, 'en')} (${stats.duration})\n\n` +
            `#NamtanFilmxLevis #LiveInLevis #LevisThailand\n#NamtanFilm`
        : '';

    const handleShareX = () => {
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
        } catch { /* ignore */ }
    };



    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-prada-charcoal/70 backdrop-blur-md" />

            {/* Modal */}
            <div
                className="relative w-full max-w-md animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-gradient-to-b from-prada-offwhite to-prada-cream rounded-t-3xl sm:rounded-3xl border border-prada-warm/30 shadow-2xl shadow-prada-gold/10 overflow-hidden max-h-[90vh] overflow-y-auto">

                    {/* Gold glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-prada-gold via-transparent to-prada-gold/30 rounded-3xl blur-2xl opacity-20 pointer-events-none" />

                    <div className="relative p-5 pb-6">
                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-prada-charcoal/10 hover:bg-prada-charcoal/20 flex items-center justify-center text-prada-charcoal/50 hover:text-prada-charcoal transition-colors"
                        >
                            ✕
                        </button>

                        {/* Header */}
                        <div className="text-center mb-5">
                            <div className="text-4xl mb-2">📊</div>
                            <h2 className="text-xl font-bold text-prada-charcoal tracking-wider">
                                {language === 'th' ? 'สถิติของฉัน' : 'My Stats'}
                            </h2>
                            <p className="text-prada-charcoal/40 text-xs mt-1 uppercase tracking-widest">
                                NamtanFilm × Levi’s Mission
                            </p>
                        </div>

                        {!stats ? (
                            <div className="text-center py-8">
                                <div className="text-5xl mb-3">🎯</div>
                                <p className="text-prada-charcoal/50 text-sm">
                                    {language === 'th'
                                        ? 'เริ่มทำ mission แล้วค่อย\nกลับมาดูสถิตินะคะ! ✨'
                                        : 'Complete some missions first,\nthen check back here! ✨'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">

                                {/* Big progress circle */}
                                <div className="flex items-center justify-center gap-5 bg-prada-charcoal/5 rounded-2xl p-4 border border-prada-warm/20">
                                    <div className="relative w-20 h-20">
                                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2.5" />
                                            <circle
                                                cx="18" cy="18" r="15.9"
                                                fill="none"
                                                stroke="url(#statsGold)"
                                                strokeWidth="2.5"
                                                strokeDasharray={`${stats.pct} ${100 - stats.pct}`}
                                                strokeLinecap="round"
                                            />
                                            <defs>
                                                <linearGradient id="statsGold" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#B8986E" />
                                                    <stop offset="100%" stopColor="#D4C8B8" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-xl font-bold text-prada-charcoal leading-none">{stats.pct}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-prada-gold leading-none">{stats.completedCount}</div>
                                        <div className="text-prada-charcoal/40 text-xs mt-0.5">
                                            {language === 'th' ? `จาก ${stats.totalCount} ภารกิจ` : `of ${stats.totalCount} missions`}
                                        </div>
                                        <div className="text-prada-charcoal font-semibold text-sm mt-1">
                                            {stats.pct === 100
                                                ? '🏆 ' + (language === 'th' ? 'ครบ 100%!' : 'All done!')
                                                : stats.pct >= 50
                                                    ? '🔥 ' + (language === 'th' ? 'เยี่ยมมาก!' : 'Great job!')
                                                    : '💪 ' + (language === 'th' ? 'สู้ต่อไป!' : 'Keep going!')
                                            }
                                        </div>
                                    </div>
                                </div>


                                {/* Stats — compact elegant design */}
                                <div className="flex flex-col gap-2">

                                    {/* Platform — featured */}
                                    <div className="bg-prada-charcoal/5 rounded-2xl px-4 py-3 border border-prada-warm/20 flex items-center gap-3">
                                        <span className="text-xl shrink-0">{PLATFORM_EMOJI[stats.topPlatform || ''] || '📱'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-prada-charcoal/40 text-[9px] uppercase tracking-widest leading-none mb-0.5">
                                                {language === 'th' ? 'Platform หลัก' : 'Top Platform'}
                                            </p>
                                            <p className="text-prada-charcoal text-sm font-bold leading-tight truncate">
                                                {PLATFORM_NAME[stats.topPlatform || ''] || stats.topPlatform || '—'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-prada-gold text-xs font-semibold">{stats.topPlatformCount}</p>
                                            <p className="text-prada-charcoal/30 text-[9px]">{language === 'th' ? 'ภารกิจ' : 'tasks'}</p>
                                        </div>
                                    </div>

                                    {/* 3 compact row stats */}
                                    <div className="bg-prada-charcoal/5 rounded-2xl border border-prada-warm/20 divide-y divide-prada-warm/15">
                                        {/* Avg/day */}
                                        <div className="flex items-center gap-3 px-4 py-2.5">
                                            <span className="text-base shrink-0">⚡</span>
                                            <p className="flex-1 text-prada-charcoal/50 text-xs">
                                                {language === 'th' ? 'เฉลี่ย/วัน' : 'Avg per day'}
                                            </p>
                                            <p className="text-prada-charcoal text-sm font-bold">
                                                {stats.tasksPerDay}
                                                <span className="text-prada-charcoal/30 text-[10px] font-normal ml-1">
                                                    {language === 'th' ? 'ภารกิจ' : 'tasks'}
                                                </span>
                                            </p>
                                        </div>
                                        {/* Started */}
                                        <div className="flex items-center gap-3 px-4 py-2.5">
                                            <span className="text-base shrink-0">🚀</span>
                                            <p className="flex-1 text-prada-charcoal/50 text-xs">
                                                {language === 'th' ? 'เริ่มทำตั้งแต่' : 'Started'}
                                            </p>
                                            <p className="text-prada-charcoal text-xs font-semibold">
                                                {formatDate(stats.firstDate, language)}
                                            </p>
                                        </div>
                                        {/* Duration */}
                                        <div className="flex items-center gap-3 px-4 py-2.5">
                                            <span className="text-base shrink-0">⏱️</span>
                                            <p className="flex-1 text-prada-charcoal/50 text-xs">
                                                {language === 'th' ? 'ระยะเวลา' : 'Duration'}
                                            </p>
                                            <p className="text-prada-charcoal text-sm font-bold">{stats.duration}</p>
                                        </div>
                                    </div>

                                </div>

                                {/* Share Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleShareX}
                                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-prada-charcoal hover:bg-prada-black text-prada-offwhite transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        <span>{language === 'th' ? 'แชร์ไป X' : 'Share to X'}</span>
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-prada-gold to-prada-warm hover:opacity-90 text-prada-charcoal transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>📋</span>
                                        <span>{language === 'th' ? 'คัดลอก' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
