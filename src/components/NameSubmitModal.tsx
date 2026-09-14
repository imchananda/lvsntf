import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

// Removed POPUP_IMAGE imports temporarily

const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeaXviBxppiD5K51IDN0jX4DhHZo3MwB1neww31xduCrQEnfw/formResponse';
const ENTRY_ID = 'entry.1238898876';
const SUBMITTED_KEY = 'social-tracker-credits-submitted-v1';
const NICKNAME_KEY = 'social-tracker-credits-nickname-v1';

export function hasSubmittedCredits(): boolean {
    try { return localStorage.getItem(SUBMITTED_KEY) === 'true'; } catch { return false; }
}
export function getSavedNickname(): string {
    try { return localStorage.getItem(NICKNAME_KEY) || ''; } catch { return ''; }
}

// Confetti for celebration
const CelebrationEffects = () => {
    const [confetti] = useState(() =>
        Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 3 + Math.random() * 2,
            color: ['#E00034', '#122D55', '#E5A93C', '#8DA4C4', '#F4ECE1'][Math.floor(Math.random() * 5)],
            size: 5 + Math.random() * 5,
            rotation: Math.random() * 360,
            swingAmplitude: 15 + Math.random() * 25,
        }))
    );
    const [sparkles] = useState(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: 5 + Math.random() * 90,
            top: 5 + Math.random() * 70,
            delay: Math.random() * 3,
            duration: 1 + Math.random() * 1,
            size: 2 + Math.random() * 3,
        }))
    );
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            {confetti.map((p) => (
                <div key={p.id} className="absolute animate-confetti-enhanced"
                    style={{ left: `${p.left}%`, top: '-10px', animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, '--swing': `${p.swingAmplitude}px` } as React.CSSProperties}>
                    <div style={{ width: p.size, height: p.size * 1.5, backgroundColor: p.color, transform: `rotate(${p.rotation}deg)`, borderRadius: '1px' }} />
                </div>
            ))}
            {sparkles.map((s) => (
                <div key={s.id} className="absolute animate-sparkle"
                    style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }}>
                    <div className="bg-prada-gold rounded-full opacity-60"
                        style={{ width: s.size, height: s.size, boxShadow: `0 0 ${s.size * 3}px ${s.size}px rgba(184,152,110,0.4)` }} />
                </div>
            ))}
        </div>
    );
};

interface NameSubmitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitted: () => void;
    onViewCredits: () => void;
    completedCount: number;
    totalCount: number;
}

export default function NameSubmitModal({
    isOpen, onClose, onSubmitted, onViewCredits, completedCount, totalCount
}: NameSubmitModalProps) {
    const { language } = useLanguage();
    const [nickname, setNickname] = useState('');
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const [showConfetti, setShowConfetti] = useState(false);
    const alreadySubmitted = hasSubmittedCredits();
    const savedName = getSavedNickname();

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const t = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        const name = nickname.trim();
        if (!name) return;
        setSubmitStatus('loading');
        try {
            const body = new FormData();
            body.append(ENTRY_ID, name);
            await fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body });
        } catch { /* no-cors fetch throws but submission succeeds */ }
        localStorage.setItem(SUBMITTED_KEY, 'true');
        localStorage.setItem(NICKNAME_KEY, name);
        setSubmitStatus('success');
        setTimeout(() => onSubmitted(), 1200);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-prada-charcoal/70 backdrop-blur-md" />
            {showConfetti && <CelebrationEffects />}

            <div
                className="relative w-full max-w-md max-h-[90vh] flex flex-col animate-popup"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-gradient-to-b from-prada-offwhite to-prada-cream rounded-3xl border border-prada-gold/30 shadow-2xl shadow-prada-gold/10 overflow-y-auto flex-1">
                    <div className="absolute -inset-1 bg-gradient-to-r from-prada-gold via-prada-warm to-prada-darkgold rounded-3xl blur-xl opacity-20 animate-pulse pointer-events-none" />

                    <div className="relative p-8 pt-12 pb-6 flex flex-col items-center text-center">
                        {/* Close */}
                        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-prada-charcoal/10 hover:bg-prada-charcoal/20 flex items-center justify-center text-prada-charcoal/50 hover:text-prada-charcoal/80 transition-colors">✕</button>

                        {/* Awesome Trophy Header */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-prada-gold blur-2xl opacity-40 animate-pulse rounded-full"></div>
                            <div className="text-8xl relative z-10 drop-shadow-2xl hover:scale-110 transition-transform duration-500 cursor-default">🏆</div>
                            <div className="absolute -top-4 -right-6 text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
                            <div className="absolute -bottom-2 -left-6 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</div>
                        </div>

                        <h2 className="text-2xl font-display font-bold text-prada-charcoal mb-2">
                            Fashion Week Champion!
                        </h2>
                        <p className="text-prada-charcoal/60 text-sm mb-6">
                            {language === 'th'
                                ? `ทำ Mission ครบ ${completedCount}/${totalCount} รายการแล้ว! 🎉`
                                : `Completed ${completedCount}/${totalCount} missions! 🎉`}
                        </p>

                        <div className="w-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex-1 h-px bg-prada-gold/30" />
                                <span className="text-prada-gold text-[10px] tracking-widest uppercase font-bold">End Credits</span>
                                <div className="flex-1 h-px bg-prada-gold/30" />
                            </div>

                            {/* Credits section */}
                            {alreadySubmitted ? (
                                // Already submitted
                                <div className="text-center space-y-2">
                                    <p className="text-prada-charcoal/60 text-xs">
                                        {language === 'th'
                                            ? `"${savedName}" อยู่ใน Credits แล้ว 💖`
                                            : `"${savedName}" is in the Credits 💖`}
                                    </p>
                                    <button onClick={onViewCredits}
                                        className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-prada-gold hover:opacity-90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 border border-prada-gold/30 text-sm">
                                        <span>🎞️</span>
                                        <span>{language === 'th' ? 'ดู End Credits' : 'Watch End Credits'}</span>
                                    </button>
                                </div>
                            ) : submitStatus === 'success' ? (
                                // Success state
                                <div className="text-center py-2">
                                    <div className="text-3xl mb-1 animate-bounce">🌟</div>
                                    <p className="text-prada-charcoal font-bold text-sm">
                                        {language === 'th' ? `"${nickname}" อยู่ใน Credits แล้ว!` : `"${nickname}" added to Credits!`}
                                    </p>
                                </div>
                            ) : (
                                // Name input
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                        placeholder={language === 'th' ? 'กรอกชื่อ / Nickname เช่น NamtanFan01' : 'Your Name / Nickname'}
                                        maxLength={30}
                                        className="w-full bg-white border border-prada-warm/50 rounded-xl px-4 py-2.5 text-prada-charcoal placeholder-prada-taupe text-sm focus:outline-none focus:border-prada-gold/60 transition-all"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!nickname.trim() || submitStatus === 'loading'}
                                        className="w-full py-2.5 rounded-xl font-semibold bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-prada-gold disabled:opacity-40 transition-all hover:opacity-90 hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2 border border-prada-gold/30 text-sm"
                                    >
                                        {submitStatus === 'loading'
                                            ? <span className="w-4 h-4 border-2 border-prada-gold border-t-transparent rounded-full animate-spin" />
                                            : <span>✨</span>}
                                        <span>{language === 'th' ? 'ลงชื่อใน End Credits!' : 'Add My Name to Credits!'}</span>
                                    </button>
                                    <button onClick={onViewCredits}
                                        className="w-full py-2 text-prada-taupe text-xs hover:text-prada-charcoal transition-colors">
                                        {language === 'th' ? 'ดู Credits ก่อน →' : 'View Credits first →'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
