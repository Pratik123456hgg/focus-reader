import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Brain, BookOpen, Lightbulb, Sun, Moon } from 'lucide-react';
import { useStore } from '../popup/store';

const LANGUAGES = ['Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Arabic'];

interface FeatureToggle {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    key: keyof ReturnType<typeof useStore>;
}

export default function SettingsApp() {
    const store = useStore();
    const [activeTab, setActiveTab] = useState<'general' | 'features'>('general');

    // Load settings from chrome.storage on mount
    useEffect(() => {
        store.hydrate();
    }, [store]);

    // Ensure store is updated for dark mode
    useEffect(() => {
        if (store.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [store.darkMode]);

    const handleThemeChange = (isDark: boolean) => {
        if (isDark !== store.darkMode) {
            store.toggleDark();
        }
    };

    const toggleFeature = (id: string) => {
        if (id === 'searchEnhance') store.setSearchEnhance(!store.searchEnhance);
        else if (id === 'focusMode') store.setFocusMode(!store.focusMode);
        else if (id === 'autoSummarize') store.setAutoSummarize(!store.autoSummarize);
        else if (id === 'showTips') store.setShowTips(!store.showTips);
    };

    const getFeatureValue = (id: string): boolean => {
        if (id === 'searchEnhance') return store.searchEnhance;
        if (id === 'focusMode') return store.focusMode;
        if (id === 'autoSummarize') return store.autoSummarize;
        if (id === 'showTips') return store.showTips;
        return false;
    };

    const features: FeatureToggle[] = [
        {
            id: 'searchEnhance',
            icon: <Eye className="w-5 h-5" />,
            title: 'Search Enhance',
            description: 'Show AI answers on Google search results',
            key: 'searchEnhance' as any,
        },
        {
            id: 'focusMode',
            icon: <Brain className="w-5 h-5" />,
            title: 'Focus Mode',
            description: 'Block distracting websites during study sessions',
            key: 'focusMode' as any,
        },
        {
            id: 'autoSummarize',
            icon: <BookOpen className="w-5 h-5" />,
            title: 'Auto-Summarize',
            description: 'Automatically summarize pages when you open the sidebar',
            key: 'autoSummarize' as any,
        },
        {
            id: 'showTips',
            icon: <Lightbulb className="w-5 h-5" />,
            title: 'Study Tips',
            description: 'Display helpful study tips and motivation on the home tab',
            key: 'showTips' as any,
        },
    ];

    return (
        <div className={`${store.darkMode ? 'dark' : ''} min-h-screen w-screen`}>
            <div className="min-h-screen w-screen flex bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-gray-100">

                {/* ── FIXED LEFT SIDEBAR (240px) ──────────────────────────────────── */}
                <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-900 dark:bg-[#1f2937] border-r border-gray-800 dark:border-gray-700 flex flex-col overflow-hidden">

                    {/* ── Sidebar Header ──────────────────────────────────────── */}
                    <div className="shrink-0 p-6 border-b border-gray-800 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span>⚙️</span>
                            <span>Settings</span>
                        </h2>
                        <p className="text-xs text-gray-400 mt-2">FocusRead AI</p>
                    </div>

                    {/* ── Sidebar Navigation ──────────────────────────────────────── */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {[
                            { id: 'general', label: 'General', icon: '⚙️' },
                            { id: 'features', label: 'Features', icon: '✨' },
                        ].map((item) => (
                            <motion.button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                    activeTab === item.id
                                        ? 'bg-gradient-to-r from-purple-600 to-teal-500 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 dark:hover:bg-gray-700'
                                }`}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </motion.button>
                        ))}
                    </nav>

                    {/* ── Sidebar Footer (Version) ──────────────────────────────────────── */}
                    <div className="shrink-0 p-4 border-t border-gray-800 dark:border-gray-700 text-center">
                        <p className="text-xs text-gray-500 font-mono">v2.0.0</p>
                    </div>

                </aside>

                {/* ── MAIN CONTENT AREA (flex-1, offset by sidebar) ──────────────────────────────────── */}
                <main className="flex-1 ml-60 flex flex-col overflow-hidden">

                    {/* ── Content Wrapper (scrollable) ──────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="px-10 py-8 max-w-6xl">

                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-8"
                            >

                                {/* ═══════════════════════════════════════════════════════════════════════
                                    ── GENERAL TAB ──
                                    ═══════════════════════════════════════════════════════════════════════ */}
                                {activeTab === 'general' && (
                                    <div className="space-y-8">

                                        {/* ── Page Title ──────────────────────────────────────── */}
                                        <div>
                                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                General Settings
                                            </h1>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Customize your FocusRead AI experience
                                            </p>
                                        </div>

                                        {/* ── APPEARANCE SECTION ──────────────────────────────────────── */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm"
                                        >
                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">🎨</span>
                                                    <span>Appearance</span>
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Choose your preferred theme
                                                </p>
                                            </div>

                                            <div className="flex gap-4">
                                                {[
                                                    { label: 'Light Mode', icon: Sun, value: false },
                                                    { label: 'Dark Mode', icon: Moon, value: true },
                                                ].map((theme) => {
                                                    const Icon = theme.icon;
                                                    const isActive = store.darkMode === theme.value;

                                                    return (
                                                        <motion.button
                                                            key={theme.label}
                                                            onClick={() => handleThemeChange(theme.value)}
                                                            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                                                isActive
                                                                    ? 'bg-gradient-to-r from-purple-600 to-teal-500 text-white shadow-lg shadow-purple-500/30'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                            }`}
                                                            whileHover={{ scale: 1.02 }}
                                                            whileTap={{ scale: 0.98 }}
                                                        >
                                                            <Icon size={20} />
                                                            {theme.label}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>

                                        {/* ── DEFAULT LANGUAGE SECTION ──────────────────────────────────────── */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm"
                                        >
                                            <div className="mb-6">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">🌍</span>
                                                    <span>Default Language</span>
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Select your preferred language for translations
                                                </p>
                                            </div>

                                            <select
                                                value={store.defaultLanguage}
                                                onChange={(e) => store.setDefaultLanguage(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 
                                                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium
                                                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500
                                                hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                                            >
                                                {LANGUAGES.map((lang) => (
                                                    <option key={lang} value={lang}>
                                                        {lang}
                                                    </option>
                                                ))}
                                            </select>
                                        </motion.div>

                                        {/* ── ABOUT SECTION ──────────────────────────────────────── */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="bg-gradient-to-br from-purple-50 to-teal-50 dark:from-purple-950/30 dark:to-teal-950/30 
                                            rounded-2xl p-8 border border-purple-200 dark:border-purple-900/50 shadow-sm"
                                        >
                                            <div className="mb-4">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                                    <span className="text-2xl">ℹ️</span>
                                                    <span>About FocusRead AI</span>
                                                </h3>
                                            </div>

                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                                <strong>FocusRead AI</strong> is your personal AI study buddy powered by 
                                                <a href="https://groq.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline ml-1">
                                                    Groq's
                                                </a> lightning-fast language model.
                                            </p>

                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                                Get instant summaries, AI-powered tutoring, flashcards, essay generation, AI text detection, live translation, and distraction-free focus sessions — all in one powerful sidebar extension.
                                            </p>

                                            <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
                                                        Version
                                                    </p>
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        v2.0.0
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        © 2026 Pratik
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>

                                    </div>
                                )}

                                {/* ═══════════════════════════════════════════════════════════════════════
                                    ── FEATURES TAB ──
                                    ═══════════════════════════════════════════════════════════════════════ */}
                                {activeTab === 'features' && (
                                    <div className="space-y-8">

                                        {/* ── Page Title ──────────────────────────────────────── */}
                                        <div>
                                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                                Feature Toggles
                                            </h1>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Enable or disable features to customize your study experience
                                            </p>
                                        </div>

                                        {/* ── FEATURE TOGGLES GRID ──────────────────────────────────────── */}
                                        <div className="grid gap-4">
                                            {features.map((feature, idx) => {
                                                const isEnabled = getFeatureValue(feature.id);

                                                return (
                                                    <motion.div
                                                        key={feature.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.08 }}
                                                        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 
                                                        hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-purple-500/10 transition-shadow flex items-center justify-between"
                                                    >

                                                        {/* ── Feature Info ──────────────────────────────────────── */}
                                                        <div className="flex items-center gap-4">
                                                            {/* ── Icon Container ──────────────────────────────────────── */}
                                                            <motion.div
                                                                className={`w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-lg ${
                                                                    feature.id === 'searchEnhance'
                                                                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                                        : feature.id === 'focusMode'
                                                                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                                            : feature.id === 'autoSummarize'
                                                                                ? 'bg-gradient-to-br from-green-500 to-green-600'
                                                                                : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                                                                }`}
                                                                whileHover={{ scale: 1.1 }}
                                                            >
                                                                {feature.icon}
                                                            </motion.div>

                                                            {/* ── Text ──────────────────────────────────────── */}
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                                                                    {feature.title}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                    {feature.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* ── Toggle Switch ──────────────────────────────────────── */}
                                                        <motion.button
                                                            onClick={() => toggleFeature(feature.id)}
                                                            className={`relative shrink-0 w-14 h-8 rounded-full transition-all ${
                                                                isEnabled
                                                                    ? 'bg-gradient-to-r from-purple-600 to-teal-500 shadow-lg shadow-purple-500/30'
                                                                    : 'bg-gray-300 dark:bg-gray-600'
                                                            }`}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <motion.div
                                                                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                                                                animate={{
                                                                    x: isEnabled ? 24 : 0,
                                                                }}
                                                                transition={{
                                                                    type: 'spring',
                                                                    stiffness: 700,
                                                                    damping: 30,
                                                                }}
                                                            />
                                                        </motion.button>

                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                    </div>
                                )}

                            </motion.div>

                        </div>
                    </div>

                </main>

            </div>
        </div>
    );
}
