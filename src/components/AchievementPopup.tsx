import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

// ⚙️ SETTINGS - เปลี่ยน URL รูปตรงนี้
const POPUP_IMAGE_TH = '/achievement-popup-th.png';
const POPUP_IMAGE_EN = '/achievement-popup-en.png';

interface AchievementPopupProps {
    isOpen: boolean;
    onClose: () => void;
    completedCount: number;
    totalCount: number;
    onCredits?: () => void;
    creditsSubmitted?: boolean;
}

// Elegant Celebration Effects — Gold & Cream luxury tones
const CelebrationEffects = () => {
    // Fewer confetti particles for a cleaner, editorial look
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

    // Subtle sparkles
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
            {/* Confetti */}
            {confetti.map((p) => (
                <div
                    key={`confetti-${p.id}`}
                    className="absolute animate-confetti-enhanced"
                    style={{
                        left: `${p.left}%`,
                        top: '-10px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        '--swing': `${p.swingAmplitude}px`,
                    } as React.CSSProperties}
                >
                    <div
                        style={{
                            width: p.size,
                            height: p.size * 1.5,
                            backgroundColor: p.color,
                            transform: `rotate(${p.rotation}deg)`,
                            borderRadius: '1px'
                        }}
                    />
                </div>
            ))}

            {/* Subtle Sparkles — golden glow */}
            {sparkles.map((s) => (
                <div
                    key={`sparkle-${s.id}`}
                    className="absolute animate-sparkle"
                    style={{
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        animationDelay: `${s.delay}s`,
                        animationDuration: `${s.duration}s`,
                    }}
                >
                    <div
                        className="bg-prada-gold rounded-full opacity-60"
                        style={{
                            width: s.size,
                            height: s.size,
                            boxShadow: `0 0 ${s.size * 3}px ${s.size}px rgba(184,152,110,0.4)`
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default function AchievementPopup({ isOpen, onClose, completedCount, totalCount, onCredits, creditsSubmitted }: AchievementPopupProps) {
    const { language } = useLanguage();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const shareText = language === 'th'
        ? `🏆 ขอแสดงความยินดี \"Fashion Week Champion\"!\n\n✨ ทำ Namtan x Prada Mission ครบ ${completedCount}/${totalCount} (100%)!\n\n#PRADAxNamtanTipnaree #NamtanTipnaree `
        : `🏆 Congratulations! \"Fashion Week Champion\"!\n\n✨ Completed Namtan x Prada Mission ${completedCount}/${totalCount} (100%)!\n\n#PRADAxNamtanTipnaree #NamtanTipnaree`;

    const handleShareToX = () => {
        const encodedText = encodeURIComponent(shareText);
        const xUrl = `https://x.com/intent/tweet?text=${encodedText}`;
        window.open(xUrl, '_blank');
    };

    const handleSaveImage = async () => {
        try {
            const popupImage = language === 'th' ? POPUP_IMAGE_TH : POPUP_IMAGE_EN;
            const response = await fetch(popupImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'namtan-prada-achievement.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-prada-charcoal/70 backdrop-blur-md" />

            {/* Confetti */}
            {showConfetti && <CelebrationEffects />}

            {/* Modal */}
            <div
                className="relative w-full max-w-md animate-popup"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-b from-prada-offwhite to-prada-cream backdrop-blur-xl rounded-3xl border border-prada-gold/30 shadow-2xl shadow-prada-gold/10 overflow-hidden">
                    {/* Glow effect — subtle gold */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-prada-gold via-prada-warm to-prada-darkgold rounded-3xl blur-xl opacity-20 animate-pulse" />

                    {/* Content */}
                    <div className="relative">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-prada-charcoal/50 hover:bg-prada-charcoal/70 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                        >
                            ✕
                        </button>

                        {/* Hero Achievement Image - FULL WIDTH */}
                        <div className="relative w-full aspect-square overflow-hidden">
                            {/* Fallback trophy design (shows behind image) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-prada-gold via-prada-warm to-prada-darkgold flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-8xl">🏆</div>
                                    <div className="text-prada-charcoal font-display font-bold text-xl mt-4">FASHION WEEK</div>
                                    <div className="text-prada-charcoal font-display font-bold text-xl">CHAMPION</div>
                                </div>
                            </div>
                            {/* Actual image on top */}
                            <img
                                src={language === 'th' ? POPUP_IMAGE_TH : POPUP_IMAGE_EN}
                                alt="Achievement Badge"
                                className="absolute inset-0 w-full h-full object-cover z-10"
                            />
                        </div>

                        {/* Info Section */}
                        <div className="p-5 text-center">
                            {/* Title */}
                            <h2 className="text-2xl font-display font-bold text-prada-charcoal mb-2">
                                {language === 'th' ? '🏆 Fashion Week Champion!' : '🏆 Fashion Week Champion!'}
                            </h2>

                            {/* Description */}
                            <p className="text-prada-charcoal/60 text-sm mb-4">
                                {language === 'th'
                                    ? `ขอแสดงความยินดี! คุณทำ Mission ครบ ${completedCount}/${totalCount} รายการ 🎉`
                                    : `Congratulations! You completed ${completedCount}/${totalCount} tasks 🎉`}
                            </p>

                            {/* Buttons */}
                            <div className="space-y-2">
                                {/* Save Image Button */}
                                <button
                                    onClick={handleSaveImage}
                                    className="w-full py-3 rounded-xl font-semibold bg-prada-charcoal hover:bg-prada-black text-prada-offwhite transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    <span>📥</span>
                                    <span>{language === 'th' ? 'บันทึกรูปไปแชร์' : 'Save Image to Share'}</span>
                                </button>

                                {/* Share to X Button */}
                                <button
                                    onClick={handleShareToX}
                                    className="w-full py-3 rounded-xl font-semibold bg-prada-cream hover:bg-prada-stone text-prada-charcoal transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 border border-prada-warm"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    <span>{language === 'th' ? 'แชร์ไป X' : 'Share to X'}</span>
                                </button>

                                {/* Credits Button */}
                                {onCredits && (
                                    <button
                                        onClick={onCredits}
                                        className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-[#1a1a2e] to-[#16213e] hover:opacity-90 text-prada-gold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 border border-prada-gold/30"
                                    >
                                        <span>{creditsSubmitted ? '🎞️' : '🎬'}</span>
                                        <span>{creditsSubmitted
                                            ? (language === 'th' ? 'ดู End Credits' : 'Watch End Credits')
                                            : (language === 'th' ? 'ลงชื่อใน Credits' : 'Add Me to Credits')
                                        }</span>
                                    </button>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Floating button component
export function AchievementFloatingButton({ onClick, isUnlocked }: { onClick: () => void; isUnlocked: boolean }) {
    if (!isUnlocked) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-prada-gold to-prada-darkgold shadow-lg shadow-prada-gold/30 flex items-center justify-center text-2xl hover:scale-110 transition-transform duration-300 border-2 border-prada-warm/50 animate-pulse hover:animate-none"
            title="View Achievement"
        >
            🏆
        </button>
    );
}
