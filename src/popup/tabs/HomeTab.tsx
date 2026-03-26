import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    MessageCircle,
    BrainCircuit,
    Clock,
    Zap,
    Flame,
    Target,
    PenLine,
    BookText,
} from 'lucide-react';

interface HomeTabProps {
    onTabChange: (tab: string) => void;
}

interface Stats {
    totalStudyMinutes: number;
    totalSessions: number;
    studyStreak: number;
    quizzesTaken: number;
    lastStudyDate: string;
}

interface Achievement {
    id: string;
    label: string;
    icon: React.ComponentType<{ size: number }>;
    color: string;
    unlocked: boolean;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
    const [stats, setStats] = useState<Stats>({
        totalStudyMinutes: 0,
        totalSessions: 0,
        studyStreak: 0,
        quizzesTaken: 0,
        lastStudyDate: '',
    });
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    useEffect(() => {
        chrome.storage.local.get(
            ['totalStudyMinutes', 'totalSessions', 'studyStreak', 'quizzesTaken', 'lastStudyDate'],
            (result) => {
                const newStats = {
                    totalStudyMinutes: result.totalStudyMinutes || 0,
                    totalSessions: result.totalSessions || 0,
                    studyStreak: result.studyStreak || 0,
                    quizzesTaken: result.quizzesTaken || 0,
                    lastStudyDate: result.lastStudyDate || '',
                };
                setStats(newStats);

                // Build achievements based on stats
                const achievementDefs: Omit<Achievement, 'unlocked'>[] = [
                    {
                        id: 'first-summary',
                        label: 'First Step',
                        icon: Sparkles,
                        color: '#10B981',
                    },
                    {
                        id: 'five-sessions',
                        label: '5 Sessions',
                        icon: Zap,
                        color: '#A855F7',
                    },
                    {
                        id: 'three-day-streak',
                        label: '3-Day Streak',
                        icon: Flame,
                        color: '#EF4444',
                    },
                    {
                        id: 'quiz-master',
                        label: 'Quiz Expert',
                        icon: BrainCircuit,
                        color: '#F59E0B',
                    },
                    {
                        id: 'deep-reader',
                        label: 'Deep Learner',
                        icon: BookText,
                        color: '#3B82F6',
                    },
                ];

                const unlockedAchievements = achievementDefs
                    .map((def) => ({
                        ...def,
                        unlocked:
                            (def.id === 'first-summary' && newStats.totalSessions >= 1) ||
                            (def.id === 'five-sessions' && newStats.totalSessions >= 5) ||
                            (def.id === 'three-day-streak' && newStats.studyStreak >= 3) ||
                            (def.id === 'quiz-master' && newStats.quizzesTaken >= 10) ||
                            (def.id === 'deep-reader' && newStats.totalStudyMinutes >= 120),
                    }));

                setAchievements(unlockedAchievements);
            }
        );

        chrome.storage.local.get(['totalSessions'], (r) => {
            chrome.storage.local.set({
                totalSessions: (r.totalSessions || 0) + 1,
            });
        });
    }, []);

    const hoursStudied = (stats.totalStudyMinutes / 60).toFixed(1);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return { text: 'Good Morning', emoji: '☀️' };
        if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
        if (hour >= 17 && hour < 21) return { text: 'Good Evening', emoji: '🌙' };
        return { text: 'Good Night', emoji: '⭐' };
    };

    const greeting = getGreeting();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.35, ease: 'easeOut' },
        },
    };

    return (
        <motion.div
            className="flex flex-col overflow-y-auto bg-bg-base px-4 py-4"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* GREETING SECTION ──────────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            <motion.div variants={itemVariants} className="mb-6">
                <p className="text-sm font-medium text-text-muted">
                    {greeting.text} {greeting.emoji}
                </p>
                <h1 className="text-lg font-bold text-text-primary mt-1">
                    Welcome back!
                </h1>
                {stats.studyStreak > 0 && (
                    <p className="text-xs text-secondary mt-2 font-medium">
                        ➔ {stats.studyStreak}-day study streak 
                    </p>
                )}
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ACTION BUTTONS (Full Width) ────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            <motion.div variants={containerVariants} className="space-y-2 mb-6">
                {/* Primary: Summarize */}
                <motion.button
                    variants={itemVariants}
                    onClick={() => onTabChange('notes')}
                    className="btn-primary w-full"
                >
                    <Sparkles size={16} strokeWidth={1.75} />
                    Summarize This Page
                </motion.button>

                {/* Secondary: Chat */}
                <motion.button
                    variants={itemVariants}
                    onClick={() => onTabChange('chat')}
                    className="btn-secondary w-full"
                >
                    <MessageCircle size={16} strokeWidth={1.75} />
                    Chat About This Page
                </motion.button>

                {/* Secondary: Quiz */}
                <motion.button
                    variants={itemVariants}
                    onClick={() => onTabChange('quiz')}
                    className="btn-secondary w-full"
                >
                    <BrainCircuit size={16} strokeWidth={1.75} />
                    Start a Quiz
                </motion.button>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* STATS ROW (3 Equal Width) ─────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            <motion.div
                variants={containerVariants}
                className="grid grid-cols-3 gap-3 mb-6"
            >
                {/* Stat: Hours Studied */}
                <motion.div variants={itemVariants} className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} color="var(--primary)" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                        {hoursStudied}h
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        Hours Studied
                    </p>
                </motion.div>

                {/* Stat: Sessions */}
                <motion.div variants={itemVariants} className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <Zap size={16} color="var(--secondary)" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                        {stats.totalSessions}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        Sessions
                    </p>
                </motion.div>

                {/* Stat: Day Streak */}
                <motion.div variants={itemVariants} className="card">
                    <div className="flex items-center gap-2 mb-3">
                        <Flame size={16} color="var(--warning)" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">
                        {stats.studyStreak}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                        Day Streak
                    </p>
                </motion.div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ACHIEVEMENTS BADGES ────────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            <motion.div variants={itemVariants} className="mb-6">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
                    Achievements
                </p>
                <div
                    className="flex gap-2 overflow-x-auto pb-1"
                    style={{ scrollbarWidth: 'none' }}
                >
                    {achievements.map((badge) => (
                        <motion.div
                            key={badge.id}
                            className="badge"
                            style={{
                                background: badge.unlocked
                                    ? `rgba(108,99,255,0.15)`
                                    : 'rgba(72,79,88,0.2)',
                                borderColor: badge.unlocked
                                    ? badge.color
                                    : 'var(--border)',
                                color: badge.unlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                                opacity: badge.unlocked ? 1 : 0.5,
                                filter: badge.unlocked ? 'none' : 'grayscale(100%)',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                borderWidth: '1px',
                            }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <badge.icon size={13} strokeWidth={1.75} />
                            <span>{badge.label}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* STUDY TIPS ────────────────────────────────────────────────────── */}
            {/* ═════════════════════════════════════════════════════════════════════ */}

            <motion.div variants={itemVariants} className="mb-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
                    Study Tips
                </p>

                <motion.div
                    variants={containerVariants}
                    className="space-y-2"
                >
                    {[
                        {
                            icon: Target,
                            color: '#3B82F6',
                            text: 'Use Focus Mode to block distracting websites and maintain concentration.',
                        },
                        {
                            icon: PenLine,
                            color: '#4ECDC4',
                            text: 'Create flashcards from key concepts to practice spaced-repetition learning.',
                        },
                        {
                            icon: BookText,
                            color: '#A855F7',
                            text: 'Take quizzes regularly to test your knowledge and identify weak areas.',
                        },
                    ].map((tip, idx) => (
                        <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="card interactive"
                            style={{
                                borderLeftWidth: '3px',
                                borderLeftColor: tip.color,
                                paddingLeft: '12px',
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'flex-start',
                                paddingTop: '10px',
                                paddingBottom: '10px',
                            }}
                        >
                            <tip.icon
                                size={16}
                                strokeWidth={1.75}
                                color={tip.color}
                                style={{ flexShrink: 0, marginTop: '2px' }}
                            />
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {tip.text}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
