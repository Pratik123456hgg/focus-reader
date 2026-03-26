import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, BookOpen, ShieldOff, Flame } from 'lucide-react';
import { useStore } from '../store';

// ─── Blocked sites list ────────────────────────────────────────────
const BLOCKED_SITES = [
    { name: 'YouTube', icon: '▶️' },
    { name: 'Instagram', icon: '📸' },
    { name: 'Twitter/X', icon: '𝕏' },
    { name: 'Facebook', icon: '👤' },
    { name: 'Reddit', icon: '🤖' },
    { name: 'TikTok', icon: '🎵' },
    { name: 'Netflix', icon: '🎬' },
    { name: 'Twitch', icon: '🟣' },
];

// ─── Pomodoro hook ─────────────────────────────────────────────────
type TimerMode = 'study' | 'break';

function usePomodoro() {
    const [mode, setMode] = useState<TimerMode>('study');
    const [seconds, setSeconds] = useState(25 * 60);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const STUDY_SECS = 25 * 60;
    const BREAK_SECS = 5 * 60;
    const total = mode === 'study' ? STUDY_SECS : BREAK_SECS;

    const clearTimer = useCallback(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    }, []);

    const tick = useCallback(() => {
        setSeconds((s) => {
            if (s <= 1) {
                clearTimer();
                setRunning(false);
                setMode((m) => {
                    const next: TimerMode = m === 'study' ? 'break' : 'study';
                    setSeconds(next === 'study' ? STUDY_SECS : BREAK_SECS);
                    if (m === 'study') setSessions((n) => n + 1);
                    return next;
                });
                return 0;
            }
            return s - 1;
        });
    }, [clearTimer]);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(tick, 1000);
        } else {
            clearTimer();
        }
        return clearTimer;
    }, [running, tick, clearTimer]);

    const toggle = () => setRunning((r) => !r);
    const reset = () => {
        clearTimer();
        setRunning(false);
        setMode('study');
        setSeconds(STUDY_SECS);
    };
    const switchMode = (m: TimerMode) => {
        clearTimer();
        setRunning(false);
        setMode(m);
        setSeconds(m === 'study' ? STUDY_SECS : BREAK_SECS);
    };

    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    const progress = 1 - seconds / total;

    return { mode, running, toggle, reset, switchMode, mins, secs, progress, sessions };
}

// ─── SVG Timer Ring ────────────────────────────────────────────────
function TimerRing({ progress, mode, mins, secs }: {
    progress: number; mode: TimerMode; mins: string; secs: string;
}) {
    const R = 54;
    const CIRC = 2 * Math.PI * R;
    const color = mode === 'study' ? '#6C63FF' : '#4ECDC4';

    return (
        <div className="relative w-[130px] h-[130px]">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r={R} fill="none" stroke="#e9e8ff" strokeWidth="8" />
                <circle
                    cx="60" cy="60" r={R} fill="none"
                    stroke={color} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - progress)}
                    className="transition-all duration-1000 linear"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold tabular-nums text-gray-800 dark:text-gray-100">
                    {mins}:{secs}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                    style={{ color: mode === 'study' ? '#6C63FF' : '#4ECDC4' }}>
                    {mode === 'study' ? 'Study' : 'Break'}
                </span>
            </div>
        </div>
    );
}

// ─── Toggle Switch ────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="relative"
        >
            <div className={`toggle-track ${checked ? '' : ''}`} style={{
                background: checked ? 'linear-gradient(135deg, #6C63FF, #4ECDC4)' : '#d1d5db'
            }}>
                <div className={`toggle-thumb ${checked ? 'translate-x-[22px]' : ''} transition-transform duration-300`} />
            </div>
        </button>
    );
}

// ─── Main Component ───────────────────────────────────────────────
export default function FocusTab() {
    const { focusMode, setFocusMode, streak } = useStore();
    const [readingMode, setReadingMode] = useState(false);
    const pomo = usePomodoro();

    const handleReadingMode = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) return;
            const action = readingMode ? 'disableReadingMode' : 'enableReadingMode';
            chrome.tabs.sendMessage(tabs[0].id, { action }, () => {
                if (chrome.runtime.lastError) return;
                setReadingMode((r) => !r);
            });
        });
    };

    return (
        <div className="p-4 flex flex-col gap-3">

            {/* Streak banner */}
            {streak > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20
            border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-2.5"
                >
                    <Flame size={16} className="text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                        {streak} day study streak! Keep it up 🔥
                    </span>
                </motion.div>
            )}

            {/* Pomodoro Timer */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-base">⏱️</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Pomodoro Timer
                    </span>
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                        {pomo.sessions} session{pomo.sessions !== 1 ? 's' : ''} today
                    </span>
                </div>

                {/* Mode selector */}
                <div className="flex gap-2 mb-4">
                    {(['study', 'break'] as const).map((m) => (
                        <button
                            key={m}
                            onClick={() => pomo.switchMode(m)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${pomo.mode === m
                                    ? m === 'study'
                                        ? 'bg-purple-500 text-white shadow-sm'
                                        : 'bg-teal-400 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            {m === 'study' ? '📚 Study (25m)' : '☕ Break (5m)'}
                        </button>
                    ))}
                </div>

                {/* Ring */}
                <div className="flex flex-col items-center gap-4">
                    <TimerRing
                        progress={pomo.progress}
                        mode={pomo.mode}
                        mins={pomo.mins}
                        secs={pomo.secs}
                    />

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={pomo.reset}
                            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400
                hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={pomo.toggle}
                            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-shadow ${pomo.mode === 'study'
                                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/30 hover:shadow-purple-500/50'
                                    : 'bg-gradient-to-br from-teal-400 to-teal-500 shadow-teal-400/30 hover:shadow-teal-400/50'
                                }`}
                        >
                            {pomo.running ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
                        </motion.button>
                        <div className="w-9" />
                    </div>
                </div>
            </div>

            {/* Distraction Blocker */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ShieldOff size={16} className={focusMode ? 'text-purple-500' : 'text-gray-400'} />
                        <div>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Distraction Blocker</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {focusMode ? 'Blocking distracting sites' : 'Off — all sites allowed'}
                            </p>
                        </div>
                    </div>
                    <ToggleSwitch checked={focusMode} onChange={setFocusMode} />
                </div>

                {/* Status */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold mb-3 ${focusMode
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${focusMode ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-gray-400'
                        }`} />
                    {focusMode ? '🔒 Focus Mode is ON — Stay locked in!' : 'Focus Mode is OFF'}
                </div>

                {/* Blocked sites chips */}
                <div className="flex flex-wrap gap-1.5">
                    {BLOCKED_SITES.map(({ name, icon }) => (
                        <span
                            key={name}
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors ${focusMode
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            {icon} {name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Reading Mode */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-teal-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={16} className="text-teal-500" />
                    <div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Reading Mode</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Strip ads and clutter for clean, distraction-free reading.
                        </p>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReadingMode}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${readingMode
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
                            : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow-teal-400/25 hover:shadow-teal-400/40'
                        }`}
                >
                    <BookOpen size={15} />
                    {readingMode ? '✕ Exit Reading Mode' : '📖 Enable Reading Mode'}
                </motion.button>
            </div>
        </div>
    );
}
