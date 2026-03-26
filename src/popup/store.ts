import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    pageTitle: string;
    createdAt: number;
    backLoading?: boolean;
}

export interface VivaAnswer {
    question: string;
    answer: string;
    score: number;
    feedback: string;
    verdict: string;
    modelAnswer: string;
}

// ─── Store interface ─────────────────────────────────────────────
interface StoreState {
    // Page context
    pageText: string;
    pageTitle: string;
    setPageContext: (text: string, title: string) => void;

    // Chat
    messages: Message[];
    addMessage: (msg: Message) => void;
    clearMessages: () => void;

    // Flashcards
    flashcards: Flashcard[];
    addFlashcard: (card: Flashcard) => void;
    updateFlashcardBack: (id: string, back: string) => void;
    deleteFlashcard: (id: string) => void;

    // Focus mode
    focusMode: boolean;
    setFocusMode: (enabled: boolean) => void;

    // Notes cache
    lastNotes: string;
    setLastNotes: (notes: string) => void;

    // Summary cache (for chat access)
    lastSummary: string;
    setLastSummary: (summary: string) => void;

    // Page content cache (for chat context)
    pageContent: string;
    setPageContent: (content: string) => void;

    // Study streak
    streak: number;
    lastStudyDate: string;
    bumpStreak: () => void;

    // Dark mode
    darkMode: boolean;
    toggleDark: () => void;

    // Settings
    searchEnhance: boolean;
    autoSummarize: boolean;
    showTips: boolean;
    defaultLanguage: string;
    selectedVoiceLang: string;
    setSearchEnhance: (enabled: boolean) => void;
    setAutoSummarize: (enabled: boolean) => void;
    setShowTips: (enabled: boolean) => void;
    setDefaultLanguage: (lang: string) => void;
    setSelectedVoiceLang: (lang: string) => void;

    // Viva mode
    vivaQuestions: string[];
    vivaAnswers: VivaAnswer[];
    setVivaQuestions: (questions: string[]) => void;
    setVivaAnswers: (answers: VivaAnswer[]) => void;
    addVivaAnswer: (answer: VivaAnswer) => void;
    clearViva: () => void;

    // Hydrated from chrome.storage
    hydrated: boolean;
    hydrate: () => void;
}

// ─── Zustand Store ───────────────────────────────────────────────
export const useStore = create<StoreState>((set, get) => ({
    pageText: '',
    pageTitle: '',
    setPageContext: (text, title) => set({ pageText: text, pageTitle: title }),

    messages: [],
    addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
    clearMessages: () => set({ messages: [] }),

    flashcards: [],
    addFlashcard: (card) => {
        set((s) => {
            const updated = [...s.flashcards, card];
            chrome.storage.local.set({ flashcards: updated });
            return { flashcards: updated };
        });
    },
    updateFlashcardBack: (id, back) => {
        set((s) => {
            const updated = s.flashcards.map((c) =>
                c.id === id ? { ...c, back, backLoading: false } : c,
            );
            chrome.storage.local.set({ flashcards: updated });
            return { flashcards: updated };
        });
    },
    deleteFlashcard: (id) => {
        set((s) => {
            const updated = s.flashcards.filter((c) => c.id !== id);
            chrome.storage.local.set({ flashcards: updated });
            return { flashcards: updated };
        });
    },

    focusMode: false,
    setFocusMode: (enabled) => {
        chrome.runtime.sendMessage({ action: 'setFocusMode', enabled });
        set({ focusMode: enabled });
    },

    lastNotes: '',
    setLastNotes: (notes) => {
        chrome.storage.local.set({ lastNotes: notes });
        set({ lastNotes: notes });
    },

    lastSummary: '',
    setLastSummary: (summary) => {
        chrome.storage.local.set({ lastSummary: summary });
        set({ lastSummary: summary });
    },

    pageContent: '',
    setPageContent: (content) => {
        chrome.storage.local.set({ pageContent: content });
        set({ pageContent: content });
    },

    streak: 0,
    lastStudyDate: '',
    bumpStreak: () => {
        const today = new Date().toDateString();
        const { lastStudyDate, streak } = get();
        if (lastStudyDate === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastStudyDate === yesterday ? streak + 1 : 1;
        chrome.storage.local.set({ streak: newStreak, lastStudyDate: today });
        set({ streak: newStreak, lastStudyDate: today });
    },

    darkMode: false,
    toggleDark: () => {
        const next = !get().darkMode;
        document.documentElement.classList.toggle('dark', next);
        chrome.storage.local.set({ darkMode: next });
        set({ darkMode: next });
    },

    // ─── Settings ────────────────────────────────────────────────
    searchEnhance: true,
    autoSummarize: false,
    showTips: true,
    defaultLanguage: 'Hindi',

    setSearchEnhance: (enabled: boolean) => {
        chrome.storage.local.set({ searchEnhance: enabled });
        set({ searchEnhance: enabled });
    },

    setAutoSummarize: (enabled: boolean) => {
        chrome.storage.local.set({ autoSummarize: enabled });
        set({ autoSummarize: enabled });
    },

    setShowTips: (enabled: boolean) => {
        chrome.storage.local.set({ showTips: enabled });
        set({ showTips: enabled });
    },

    setDefaultLanguage: (lang: string) => {
        chrome.storage.local.set({ defaultLanguage: lang });
        set({ defaultLanguage: lang });
    },

    selectedVoiceLang: 'auto',
    setSelectedVoiceLang: (lang: string) => {
        chrome.storage.local.set({ selectedVoiceLang: lang });
        set({ selectedVoiceLang: lang });
    },

    // ─── Viva Mode ───────────────────────────────────────────────
    vivaQuestions: [],
    vivaAnswers: [],
    setVivaQuestions: (questions: string[]) => {
        set({ vivaQuestions: questions });
    },
    setVivaAnswers: (answers: VivaAnswer[]) => {
        set({ vivaAnswers: answers });
    },
    addVivaAnswer: (answer: VivaAnswer) => {
        set((s) => ({ vivaAnswers: [...s.vivaAnswers, answer] }));
    },
    clearViva: () => {
        set({ vivaQuestions: [], vivaAnswers: [] });
    },

    hydrated: false,
    hydrate: () => {
        if (get().hydrated) return;
        chrome.storage.local.get(
            ['flashcards', 'focusMode', 'streak', 'lastStudyDate', 'darkMode', 'searchEnhance', 'autoSummarize', 'showTips', 'defaultLanguage', 'lastNotes', 'lastSummary', 'pageContent', 'selectedVoiceLang'],
            (result) => {
                const dark = !!result.darkMode;
                document.documentElement.classList.toggle('dark', dark);
                set({
                    flashcards: result.flashcards ?? [],
                    focusMode: !!result.focusMode,
                    streak: result.streak ?? 0,
                    lastStudyDate: result.lastStudyDate ?? '',
                    darkMode: dark,
                    searchEnhance: result.searchEnhance ?? true,
                    autoSummarize: result.autoSummarize ?? false,
                    showTips: result.showTips ?? true,
                    defaultLanguage: result.defaultLanguage ?? 'Hindi',
                    lastNotes: result.lastNotes ?? '',
                    lastSummary: result.lastSummary ?? '',
                    pageContent: result.pageContent ?? '',
                    selectedVoiceLang: result.selectedVoiceLang ?? 'auto',
                    hydrated: true,
                });
            },
        );
    },
}));
