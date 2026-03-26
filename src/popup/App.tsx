import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageCircle, Layers, Target, Moon, Sun, Lightbulb, Feather, Zap, Globe, Settings, Info, Home } from 'lucide-react';
import { useStore } from './store';
import NotesTab from './tabs/NotesTab';
import ChatTab from './tabs/ChatTab';
import FlashcardsTab from './tabs/FlashcardsTab';
import FocusTab from './tabs/FocusTab';
import SolveProblemTab from './tabs/SolveProblemTab';
import WriteEssayTab from './tabs/WriteEssayTab';
import AIDetectorTab from './tabs/AIDetectorTab';
import TranslateTab from './tabs/TranslateTab';
import HomeTab from './tabs/HomeTab';
import YouTubeTab from './tabs/YouTubeTab';
import MindMapTab from './tabs/MindMapTab';
import QuizTab from './tabs/QuizTab';

type TabId = 'home' | 'notes' | 'chat' | 'flashcards' | 'focus' | 'youtube' | 'mindmap' | 'quiz' | 'solve' | 'essay' | 'detector' | 'translate';

const TABS: { id: TabId; label: string; Icon: typeof BookOpen }[] = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'notes', label: 'Notes', Icon: BookOpen },
    { id: 'chat', label: 'Chat AI', Icon: MessageCircle },
    { id: 'flashcards', label: 'Cards', Icon: Layers },
    { id: 'focus', label: 'Focus', Icon: Target },
    { id: 'youtube', label: 'YouTube', Icon: (props) => <span className="text-lg">📺</span> as any },
    { id: 'mindmap', label: 'Mind Map', Icon: (props) => <span className="text-lg">🗺️</span> as any },
    { id: 'quiz', label: 'Quiz', Icon: (props) => <span className="text-lg">🧠</span> as any },
    { id: 'solve', label: 'Solve', Icon: Lightbulb },
    { id: 'essay', label: 'Essay', Icon: Feather },
    { id: 'detector', label: 'Detector', Icon: Zap },
    { id: 'translate', label: 'Translate', Icon: Globe },
];

export default function App() {
    const [activeTab, setActiveTab] = useState<TabId>('home');
    const { hydrate, darkMode, toggleDark, setPageContext, bumpStreak } = useStore();

    // Hydrate store from chrome.storage
    useEffect(() => {
        hydrate();
    }, [hydrate]);

    // Load page context from active tab on mount
    useEffect(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return;
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageText' }, (res) => {
                if (chrome.runtime.lastError || !res) return;
                setPageContext(res.text ?? '', res.title ?? 'Unknown Page');
            });
        });
        bumpStreak();
    }, [setPageContext, bumpStreak]);

    const openSettings = () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    };

    const openAbout = () => {
        alert('FocusRead AI v2.0.0\n\nYour AI Study Buddy\n\n© 2026 - Built with React + Groq API');
    };

    return (
        <div className="w-[380px] h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden">

            {/* ── Dark Header with Gradient ──────────────────────────────── */}
            <header className="relative overflow-hidden shrink-0 bg-gradient-to-br from-purple-600 to-teal-500">
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/[0.07]" />

                <div className="relative z-10 flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">
                            🧠
                        </div>
                        <div>
                            <h1 className="text-white font-extrabold text-lg leading-tight tracking-tight">
                                FocusRead AI
                            </h1>
                            <p className="text-white/75 text-xs font-medium mt-0.5">
                                Study Companion
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Container (Icon Rail + Content) ────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left Icon Rail (52px) ────────────────────── */}
                <aside className="w-[52px] bg-gray-900 dark:bg-black flex flex-col items-center gap-1 py-3 border-r border-gray-800 dark:border-gray-950 overflow-y-auto">
                    {TABS.map(({ id, Icon }) => {
                        const isActive = activeTab === id;
                        return (
                            <motion.button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`
                                    w-10 h-10 rounded-lg flex items-center justify-center transition-all
                                    ${isActive
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                                    }
                                `}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title={id.charAt(0).toUpperCase() + id.slice(1)}
                            >
                                <Icon size={20} />
                            </motion.button>
                        );
                    })}

                    {/* ── Spacer ──────────────────────────────────── */}
                    <div className="flex-1" />

                    {/* ── Footer Buttons ──────────────────────────────────– */}
                    <motion.button
                        onClick={openSettings}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Settings"
                    >
                        <Settings size={20} />
                    </motion.button>

                    <motion.button
                        onClick={openAbout}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="About"
                    >
                        <Info size={20} />
                    </motion.button>

                    <motion.button
                        onClick={toggleDark}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Toggle dark mode"
                    >
                        {darkMode
                            ? <Sun size={20} className="text-yellow-400" />
                            : <Moon size={20} />}
                    </motion.button>
                </aside>

                {/* ── Right Content Area (328px) ────────────────────── */}
                <main className="flex-1 overflow-hidden relative bg-gray-50 dark:bg-gray-900">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="absolute inset-0 overflow-y-auto"
                        >
                            {activeTab === 'home' && <HomeTab onTabChange={setActiveTab} />}
                            {activeTab === 'notes' && <NotesTab />}
                            {activeTab === 'chat' && <ChatTab />}
                            {activeTab === 'flashcards' && <FlashcardsTab />}
                            {activeTab === 'focus' && <FocusTab />}
                            {activeTab === 'youtube' && <YouTubeTab />}
                            {activeTab === 'mindmap' && <MindMapTab />}
                            {activeTab === 'quiz' && <QuizTab />}
                            {activeTab === 'solve' && <SolveProblemTab />}
                            {activeTab === 'essay' && <WriteEssayTab />}
                            {activeTab === 'detector' && <AIDetectorTab />}
                            {activeTab === 'translate' && <TranslateTab />}
                        </motion.div>
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
}
