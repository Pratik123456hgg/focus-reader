import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    BookOpen,
    MessageCircle,
    Layers,
    Target,
    PlayCircle,
    Network,
    BrainCircuit,
    Lightbulb,
    PenLine,
    ScanSearch,
    Languages,
    Settings2,
    Info,
    Moon,
    Sun,
    Brain,
} from 'lucide-react';
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

interface TabConfig {
    id: TabId;
    label: string;
    Icon: React.ComponentType<{ size: number }>;
    group: 'study' | 'tools' | 'create' | 'system';
}

const TABS: TabConfig[] = [
    // Group 1: Study Core
    { id: 'home', label: 'Home', Icon: Home, group: 'study' },
    { id: 'notes', label: 'Notes', Icon: BookOpen, group: 'study' },
    { id: 'chat', label: 'Chat AI', Icon: MessageCircle, group: 'study' },
    { id: 'flashcards', label: 'Flashcards', Icon: Layers, group: 'study' },

    // Group 2: Learning Tools
    { id: 'focus', label: 'Focus', Icon: Target, group: 'tools' },
    { id: 'youtube', label: 'YouTube', Icon: PlayCircle, group: 'tools' },
    { id: 'mindmap', label: 'Mind Map', Icon: Network, group: 'tools' },
    { id: 'quiz', label: 'Quiz', Icon: BrainCircuit, group: 'tools' },

    // Group 3: Create
    { id: 'solve', label: 'Solve', Icon: Lightbulb, group: 'create' },
    { id: 'essay', label: 'Essay', Icon: PenLine, group: 'create' },
    { id: 'detector', label: 'AI Detect', Icon: ScanSearch, group: 'create' },
    { id: 'translate', label: 'Translate', Icon: Languages, group: 'create' },
];

const SYSTEM_TABS: TabConfig[] = [
    { id: 'home', label: 'Settings', Icon: Settings2, group: 'system' },
    { id: 'home', label: 'Info', Icon: Info, group: 'system' },
];

export default function App() {
    const [activeTab, setActiveTab] = useState<TabId>('home');
    const [hoveredTab, setHoveredTab] = useState<string | null>(null);
    const [tooltipDir, setTooltipDir] = useState<'above' | 'below'>('below');
    const { hydrate, darkMode, toggleDark, setPageContext, bumpStreak } = useStore();

    useEffect(() => {
        hydrate();
    }, [hydrate]);

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
        alert('FocusRead AI v2.0.0\n\nYour Intelligent Study Companion\n\n© 2026 - Built with React + Groq API');
    };

    const handleMouseEnter = (tabId: string) => {
        setHoveredTab(tabId);
        // Determine tooltip direction based on position in list
        const tabIndex = TABS.findIndex(t => t.id === tabId);
        setTooltipDir(tabIndex < 6 ? 'below' : 'above');
    };

    return (
        <div style={{ width: '380px', height: '100vh' }} className="flex flex-col bg-bg-base text-text-primary overflow-hidden">

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── HEADER (56px, fixed top) ──────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            <header
                style={{
                    background: 'linear-gradient(135deg, #0D1117 0%, #161B22 50%, #0D1117 100%)',
                    borderBottom: '1px solid ' + getComputedStyle(document.documentElement).getPropertyValue('--border'),
                }}
                className="shrink-0 h-14 flex items-center justify-between px-4"
            >
                {/* Left: Logo + Title */}
                <div className="flex items-center gap-3">
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                            boxShadow: '0 0 20px rgba(108,99,255,0.3)',
                        }}
                        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                    >
                        <Brain size={16} color="white" strokeWidth={1.75} />
                    </div>
                    <div>
                        <h1 className="text-xs font-bold text-text-primary leading-tight tracking-tighter">
                            FocusRead AI
                        </h1>
                        <p className="text-[10px] text-text-muted font-normal">
                            Study Companion
                        </p>
                    </div>
                </div>

                {/* Right: Pin + Close buttons (if needed) */}
                <div className="flex gap-1">
                    {/* Placeholder for future pin/close actions */}
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* ── MAIN CONTAINER ────────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════════ */}

            <div className="flex flex-1 overflow-hidden">

                {/* ─────────────────────────────────────────────────────────────── */}
                {/* ─ ICON RAIL (52px, fixed left) ───────────────────────────── */}
                {/* ─────────────────────────────────────────────────────────────── */}

                <aside
                    style={{ background: 'var(--bg-base)' }}
                    className="w-[52px] flex flex-col items-center py-2 border-r border-border overflow-y-auto relative z-10"
                >

                    {/* ── GROUP 1: STUDY CORE ──── */}
                    <div className="flex flex-col items-center gap-1 w-full">
                        {TABS.filter(t => t.group === 'study').map(({ id, label, Icon }) => (
                            <IconButton
                                key={id}
                                tabId={id}
                                label={label}
                                Icon={Icon}
                                isActive={activeTab === id}
                                onClick={() => setActiveTab(id)}
                                onMouseEnter={() => handleMouseEnter(id)}
                                onMouseLeave={() => setHoveredTab(null)}
                                isHovered={hoveredTab === id}
                                tooltipDir={tooltipDir}
                            />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-[80%] my-1.5 border-t border-border" />

                    {/* ── GROUP 2: LEARNING TOOLS ──── */}
                    <div className="flex flex-col items-center gap-1 w-full">
                        {TABS.filter(t => t.group === 'tools').map(({ id, label, Icon }) => (
                            <IconButton
                                key={id}
                                tabId={id}
                                label={label}
                                Icon={Icon}
                                isActive={activeTab === id}
                                onClick={() => setActiveTab(id)}
                                onMouseEnter={() => handleMouseEnter(id)}
                                onMouseLeave={() => setHoveredTab(null)}
                                isHovered={hoveredTab === id}
                                tooltipDir={tooltipDir}
                            />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-[80%] my-1.5 border-t border-border" />

                    {/* ── GROUP 3: CREATE ──── */}
                    <div className="flex flex-col items-center gap-1 w-full">
                        {TABS.filter(t => t.group === 'create').map(({ id, label, Icon }) => (
                            <IconButton
                                key={id}
                                tabId={id}
                                label={label}
                                Icon={Icon}
                                isActive={activeTab === id}
                                onClick={() => setActiveTab(id)}
                                onMouseEnter={() => handleMouseEnter(id)}
                                onMouseLeave={() => setHoveredTab(null)}
                                isHovered={hoveredTab === id}
                                tooltipDir={tooltipDir}
                            />
                        ))}
                    </div>

                    {/* Spacer — Push system group to bottom */}
                    <div className="flex-1" />

                    {/* Divider */}
                    <div className="w-[80%] mb-1.5 border-t border-border" />

                    {/* ── GROUP 4: SYSTEM (bottom) ──── */}
                    <div className="flex flex-col items-center gap-1 w-full pb-2">
                        {/* Settings */}
                        <motion.button
                            onMouseEnter={() => handleMouseEnter('settings')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={openSettings}
                            className="relative w-10 h-10 rounded-md flex items-center justify-center transition-all"
                            style={{
                                color: hoveredTab === 'settings' ? 'var(--text-secondary)' : 'var(--text-muted)',
                                background: hoveredTab === 'settings' ? 'var(--bg-elevated)' : 'transparent',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Settings2 size={20} strokeWidth={1.75} />
                            {hoveredTab === 'settings' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        marginLeft: '8px',
                                        background: 'var(--bg-overlay)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        padding: '4px 10px',
                                        borderRadius: '9999px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: 'var(--shadow-md)',
                                    }}
                                    className="z-50"
                                >
                                    Settings
                                </motion.div>
                            )}
                        </motion.button>

                        {/* Info */}
                        <motion.button
                            onMouseEnter={() => handleMouseEnter('info')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={openAbout}
                            className="relative w-10 h-10 rounded-md flex items-center justify-center transition-all"
                            style={{
                                color: hoveredTab === 'info' ? 'var(--text-secondary)' : 'var(--text-muted)',
                                background: hoveredTab === 'info' ? 'var(--bg-elevated)' : 'transparent',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Info size={20} strokeWidth={1.75} />
                            {hoveredTab === 'info' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        marginLeft: '8px',
                                        background: 'var(--bg-overlay)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        padding: '4px 10px',
                                        borderRadius: '9999px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: 'var(--shadow-md)',
                                    }}
                                    className="z-50"
                                >
                                    Info
                                </motion.div>
                            )}
                        </motion.button>

                        {/* Theme Toggle */}
                        <motion.button
                            onMouseEnter={() => handleMouseEnter('theme')}
                            onMouseLeave={() => setHoveredTab(null)}
                            onClick={toggleDark}
                            className="relative w-10 h-10 rounded-md flex items-center justify-center transition-all"
                            style={{
                                color: hoveredTab === 'theme' ? 'var(--warning)' : 'var(--text-muted)',
                                background: hoveredTab === 'theme' ? 'var(--bg-elevated)' : 'transparent',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {darkMode ? (
                                <Sun size={20} strokeWidth={1.75} />
                            ) : (
                                <Moon size={20} strokeWidth={1.75} />
                            )}
                            {hoveredTab === 'theme' && (
                                <motion.div
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -6 }}
                                    transition={{ duration: 0.15 }}
                                    style={{
                                        position: 'absolute',
                                        left: '100%',
                                        marginLeft: '8px',
                                        background: 'var(--bg-overlay)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        padding: '4px 10px',
                                        borderRadius: '9999px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: 'var(--shadow-md)',
                                    }}
                                    className="z-50"
                                >
                                    Theme
                                </motion.div>
                            )}
                        </motion.button>
                    </div>

                </aside>

                {/* ─────────────────────────────────────────────────────────────── */}
                {/* ─ CONTENT AREA (328px, scrollable) ───────────────────────────── */}
                {/* ─────────────────────────────────────────────────────────────── */}

                <main className="flex-1 overflow-hidden relative flex flex-col">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="absolute inset-0 overflow-y-auto flex flex-col"
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

                    {/* ── Footer (40px, fixed bottom) ────────────────────────── */}
                </main>

            </div>
        </div>
    );
}

/**
 * Reusable Icon Button Component with Tooltip
 */
interface IconButtonProps {
    tabId: string;
    label: string;
    Icon: React.ComponentType<{ size: number }>;
    isActive: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    isHovered: boolean;
    tooltipDir: 'above' | 'below';
}

function IconButton({
    tabId,
    label,
    Icon,
    isActive,
    onClick,
    onMouseEnter,
    onMouseLeave,
    isHovered,
    tooltipDir,
}: IconButtonProps) {
    return (
        <motion.button
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            className="relative w-10 h-10 rounded-md flex items-center justify-center transition-all group"
            style={{
                background: isActive ? 'rgba(108,99,255,0.12)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            {/* Left accent bar for active state */}
            {isActive && (
                <motion.div
                    layoutId="activeIndicator"
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: '3px',
                        height: '24px',
                        background: 'var(--primary)',
                        borderRadius: '0 9999px 9999px 0',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: '3px' }}
                    transition={{ duration: 0.15 }}
                />
            )}

            {/* Icon */}
            <Icon size={20} strokeWidth={1.75} />

            {/* Tooltip */}
            {isHovered && (
                <motion.div
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15, delay: 0.4 }}
                    style={{
                        position: 'absolute',
                        left: '100%',
                        marginLeft: '8px',
                        background: 'var(--bg-overlay)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: '500',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        whiteSpace: 'nowrap',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 9999,
                    }}
                >
                    {label}
                </motion.div>
            )}
        </motion.button>
    );
}
