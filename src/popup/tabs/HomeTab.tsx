import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, MessageCircle, CheckSquare, Zap, Flame, TrendingUp } from 'lucide-react';
import { useStore } from '../store';

interface HomeTabProps {
    onTabChange: (tab: 'notes' | 'chat' | 'solve' | 'detector' | 'flashcards') => void;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
    const { streak, pageText } = useStore();
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning! 🌅');
        else if (hour < 18) setGreeting('Good afternoon! ☀️');
        else setGreeting('Good evening! 🌙');
    }, []);

    const quickActions = [
        {
            icon: BookOpen,
            label: 'Summarize',
            color: 'from-blue-500 to-blue-600',
            action: () => onTabChange('notes'),
            desc: 'Get instant page summary'
        },
        {
            icon: MessageCircle,
            label: 'Ask AI',
            color: 'from-purple-500 to-purple-600',
            action: () => onTabChange('chat'),
            desc: 'Chat with AI about this page'
        },
        {
            icon: CheckSquare,
            label: 'Quiz Me',
            color: 'from-green-500 to-green-600',
            action: () => onTabChange('flashcards'),
            desc: 'Create study flashcards'
        },
        {
            icon: Zap,
            label: 'Check AI',
            color: 'from-red-500 to-red-600',
            action: () => onTabChange('detector'),
            desc: 'Detect AI-written text'
        },
    ];

    return (
        <div className="h-full flex flex-col overflow-y-auto">
            {/* ── Welcome Section ──────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-950/40 dark:to-teal-950/40"
            >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {greeting}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ready to learn something new today?
                </p>
            </motion.div>

            {/* ── Quick Actions Grid ──────────────────────────────────────── */}
            <div className="p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                    Quick Actions
                </p>

                <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={action.action}
                                className={`p-3 rounded-xl text-white font-semibold text-sm
                                bg-gradient-to-br ${action.color} hover:shadow-lg transition-all
                                flex flex-col items-center justify-center gap-1.5 h-28`}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Icon size={24} />
                                <div className="text-center">
                                    <div>{action.label}</div>
                                    <div className="text-[10px] font-normal opacity-90">{action.desc}</div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* ── Stats Section ──────────────────────────────────────────– */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-800"
            >
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                    Your Stats
                </p>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl font-bold text-white">
                            🔥
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Study Streak</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {streak}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        Keep it up! You're doing amazing. 🚀
                    </p>
                </div>
            </motion.div>

            {/* ── Tips Section ──────────────────────────────────────────– */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 space-y-3 border-t border-gray-200 dark:border-gray-800 flex-1"
            >
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                    Study Tips
                </p>

                <div className="space-y-2">
                    {[
                        { emoji: '🎯', tip: 'Use Focus Mode to block distracting websites' },
                        { emoji: '📝', tip: 'Create flashcards to test your knowledge' },
                        { emoji: '🧠', tip: 'Let AI analyze text to confirm its authenticity' },
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                        >
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                                <span className="mr-2">{item.emoji}</span>
                                {item.tip}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
