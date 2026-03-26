import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, RotateCcw, BookmarkPlus, Mic, MicOff, ChevronDown } from 'lucide-react';
import { useStore } from '../store';

interface QuizQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

interface VivaEvaluation {
    score: number;
    verdict: string;
    feedback: string;
    modelAnswer: string;
}

interface VivaAnswer {
    question: string;
    answer: string;
    evaluation: VivaEvaluation;
}

export default function QuizTab() {
    const { pageText: storePageText, pageContent: storePageContent, lastSummary: storeLastSummary } = useStore();
    const [mode, setMode] = useState<'mcq' | 'viva'>('mcq');
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [vivaQuestions, setVivaQuestions] = useState<string[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [vivaAnswers, setVivaAnswers] = useState<VivaAnswer[]>([]);
    const [quizState, setQuizState] = useState<'idle' | 'loading' | 'question' | 'results' | 'viva-question' | 'viva-evaluating' | 'viva-results'>('idle');
    const [error, setError] = useState('');
    const [pageText, setPageText] = useState('');
    const [pageContent, setPageContent] = useState('');
    const [lastSummary, setLastSummary] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [currentVivaAnswer, setCurrentVivaAnswer] = useState('');
    const [showModelAnswer, setShowModelAnswer] = useState(false);

    const vivaAnswerRef = useRef<HTMLTextAreaElement>(null);

    const fetchPageContext = async () => {
        return new Promise<{ text: string; content: string; summary: string }>((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (!tabs[0]?.id) {
                    // Use store values as fallback
                    resolve({ text: storePageText, content: storePageContent, summary: storeLastSummary });
                    return;
                }

                // Get page text from content script
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageText' }, (textRes) => {
                    const text = textRes?.text || storePageText;
                    // Use store values for content and summary
                    const content = storePageContent || text;
                    const summary = storeLastSummary;
                    resolve({ text, content, summary });
                });
            });
        });
    };

    const startQuiz = async () => {
        setLoading(true);
        setError('');
        setQuizState('loading');

        try {
            const context = await fetchPageContext();
            setPageText(context.text);
            setPageContent(context.content);
            setLastSummary(context.summary);

            if (!context.text) {
                throw new Error('Could not extract page content.');
            }

            // Generate quiz based on mode
            if (mode === 'viva') {
                chrome.runtime.sendMessage(
                    { action: 'generateViva', pageText: context.text, summary: context.summary },
                    (res) => {
                        if (!res?.success || !res?.data) {
                            setError('Failed to generate viva questions.');
                            setQuizState('idle');
                            setLoading(false);
                            return;
                        }
                        setVivaQuestions(res.data);
                        setVivaAnswers([]);
                        setCurrentQuestion(0);
                        setCurrentVivaAnswer('');
                        setQuizState('viva-question');
                        setLoading(false);
                    },
                );
            } else {
                chrome.runtime.sendMessage(
                    { action: 'generateQuiz', pageText: context.text },
                    (res) => {
                        if (!res?.success || !res?.data) {
                            setError('Failed to generate quiz.');
                            setQuizState('idle');
                            setLoading(false);
                            return;
                        }
                        setQuestions(res.data);
                        setAnswers([]);
                        setCurrentQuestion(0);
                        setQuizState('question');
                        setLoading(false);
                    },
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setQuizState('idle');
            setLoading(false);
        }
    };

    const handleVoiceInput = () => {
        if (isListening) {
            setIsListening(false);
            return;
        }

        setIsListening(true);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                setIsListening(false);
                alert('No active tab found. Navigate to a webpage.');
                return;
            }

            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'startVoiceRecognition', lang: '' },
                (response: { transcript?: string; error?: string }) => {
                    setIsListening(false);

                    if (response?.error) {
                        alert(`Voice Error: ${response.error}`);
                        return;
                    }

                    if (response?.transcript) {
                        setCurrentVivaAnswer(response.transcript);
                        if (vivaAnswerRef.current) {
                            vivaAnswerRef.current.value = response.transcript;
                        }
                    }
                },
            );
        });
    };

    const submitVivaAnswer = async () => {
        if (!currentVivaAnswer.trim()) {
            alert('Please provide an answer.');
            return;
        }

        setQuizState('viva-evaluating');

        chrome.runtime.sendMessage(
            {
                action: 'evaluateViva',
                question: vivaQuestions[currentQuestion],
                userAnswer: currentVivaAnswer,
                pageContent: pageContent || pageText,
            },
            (res) => {
                if (!res?.success || !res?.data) {
                    alert('Failed to evaluate answer.');
                    setQuizState('viva-question');
                    return;
                }

                const evaluation: VivaEvaluation = res.data;
                const newAnswer: VivaAnswer = {
                    question: vivaQuestions[currentQuestion],
                    answer: currentVivaAnswer,
                    evaluation,
                };

                setVivaAnswers([...vivaAnswers, newAnswer]);

                if (currentQuestion < vivaQuestions.length - 1) {
                    setTimeout(() => {
                        setCurrentQuestion(currentQuestion + 1);
                        setCurrentVivaAnswer('');
                        setShowModelAnswer(false);
                        setQuizState('viva-question');
                    }, 2000);
                } else {
                    setTimeout(() => {
                        setQuizState('viva-results');
                    }, 2000);
                }
            },
        );
    };

    const handleAnswer = (optionIndex: number) => {
        const newAnswers = [...answers, optionIndex];
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setTimeout(() => setCurrentQuestion(currentQuestion + 1), 1500);
        } else {
            setTimeout(() => setQuizState('results'), 1500);
        }
    };

    const restartQuiz = () => {
        setCurrentQuestion(0);
        setAnswers([]);
        setVivaAnswers([]);
        setCurrentVivaAnswer('');
        setQuizState('idle');
        setQuestions([]);
        setVivaQuestions([]);
        setShowModelAnswer(false);
    };

    const saveWrongAnswers = () => {
        const wrongQs = questions
            .map((q, idx) => ({
                question: q.question,
                userAnswer: q.options[answers[idx]],
                correctAnswer: q.options[q.correct],
                explanation: q.explanation,
            }))
            .filter((_, idx) => answers[idx] !== questions[idx].correct);

        wrongQs.forEach((wq) => {
            const flashcardText = `Q: ${wq.question}\nCorrect: ${wq.correctAnswer}\nExplanation: ${wq.explanation}`;
            chrome.runtime.sendMessage({
                action: 'addHighlightFlashcard',
                text: flashcardText,
            });
        });
    };

    // ── IDLE STATE ──────────────────────────────────────────
    if (quizState === 'idle') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-purple-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-lg">
                <div className="text-6xl mb-4">🧠</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                    Quiz Me!
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 max-w-xs">
                    Test your knowledge with AI-generated questions from the current page.
                </p>

                {/* ─── Mode Toggle ─── */}
                <div className="flex gap-2 mb-6 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('mcq')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                            mode === 'mcq'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        📋 MCQ Mode
                    </button>
                    <button
                        onClick={() => setMode('viva')}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                            mode === 'viva'
                                ? 'bg-teal-600 text-white shadow-lg'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        🎤 Viva Mode
                    </button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mb-4"
                    >
                        <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                    </motion.div>
                )}

                <motion.button
                    onClick={startQuiz}
                    disabled={loading}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-teal-500 text-white font-bold
                    hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {loading ? 'Generating Questions...' : `Start ${mode === 'viva' ? 'Viva' : 'MCQ'} Quiz`}
                </motion.button>
            </div>
        );
    }

    // ── LOADING STATE ──────────────────────────────────────────
    if (quizState === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-6xl mb-4"
                >
                    ⚙️
                </motion.div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Generating {mode === 'viva' ? 'Viva' : 'MCQ'} Questions...
                </p>
            </div>
        );
    }

    // ── MCQ QUESTION STATE ──────────────────────────────────────────
    if (quizState === 'question' && questions.length > 0) {
        const question = questions[currentQuestion];
        const userAnswered = answers.length > currentQuestion;
        const userAnswer = userAnswered ? answers[currentQuestion] : -1;
        const isCorrect = userAnswer === question.correct;

        return (
            <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                    {/* ── Progress Bar ──────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                Question {currentQuestion + 1} of {questions.length}
                            </span>
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-600 to-teal-500"
                                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>

                    {/* ── Question ──────────────────────────────────────── */}
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                            {question.question}
                        </h3>

                        {/* ── Options ──────────────────────────────────────── */}
                        <div className="space-y-3">
                            {question.options.map((option, idx) => {
                                let bgColor = 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600';
                                let textColor = 'text-gray-900 dark:text-gray-100';

                                if (userAnswered) {
                                    if (idx === question.correct) {
                                        bgColor = 'bg-green-100 dark:bg-green-950 border-2 border-green-500';
                                        textColor = 'text-green-900 dark:text-green-100 font-semibold';
                                    } else if (idx === userAnswer && !isCorrect) {
                                        bgColor = 'bg-red-100 dark:bg-red-950 border-2 border-red-500';
                                        textColor = 'text-red-900 dark:text-red-100 font-semibold';
                                    }
                                }

                                return (
                                    <motion.button
                                        key={idx}
                                        onClick={() => !userAnswered && handleAnswer(idx)}
                                        disabled={userAnswered}
                                        className={`w-full p-4 rounded-lg border-2 border-transparent flex items-center gap-3
                                        transition-all disabled:cursor-not-allowed ${bgColor} ${textColor}`}
                                        whileHover={!userAnswered ? { scale: 1.02 } : {}}
                                        whileTap={!userAnswered ? { scale: 0.98 } : {}}
                                    >
                                        <span className="text-lg font-bold w-8 text-center">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 text-left">{option}</span>
                                        {userAnswered && idx === question.correct && (
                                            <span className="text-lg">✓</span>
                                        )}
                                        {userAnswered && idx === userAnswer && !isCorrect && (
                                            <span className="text-lg">✗</span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* ── Explanation ──────────────────────────────────────── */}
                        <AnimatePresence>
                            {userAnswered && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                                >
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                        {isCorrect ? '✓ Correct!' : '✗ Incorrect!'}
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                        {question.explanation}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* ── Next Button ──────────────────────────────────────── */}
                    <AnimatePresence>
                        {userAnswered && currentQuestion < questions.length - 1 && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-teal-500 text-white font-semibold
                                hover:shadow-lg transition-all"
                                whileTap={{ scale: 0.98 }}
                            >
                                Next Question →
                            </motion.button>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        );
    }

    // ── VIVA QUESTION STATE ──────────────────────────────────────────
    if (quizState === 'viva-question' && vivaQuestions.length > 0) {
        const question = vivaQuestions[currentQuestion];
        const hasAnswered = vivaAnswers.length > currentQuestion;

        return (
            <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                    {/* ── Progress Bar ──────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                Question {currentQuestion + 1} of {vivaQuestions.length}
                            </span>
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                                {Math.round(((currentQuestion + 1) / vivaQuestions.length) * 100)}%
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-teal-600 to-purple-500"
                                animate={{ width: `${((currentQuestion + 1) / vivaQuestions.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>

                    {/* ── Question Card ──────────────────────────────────────── */}
                    <motion.div
                        key={currentQuestion}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
                            {question}
                        </h3>

                        {/* ── Voice Input Section ──────────────────────────────────────── */}
                        {!hasAnswered && (
                            <div className="space-y-4 mb-6">
                                <motion.button
                                    onClick={handleVoiceInput}
                                    className={`w-full py-4 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all ${
                                        isListening
                                            ? 'bg-red-500 text-white animate-pulse'
                                            : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-lg'
                                    }`}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                    {isListening ? 'Stop Recording...' : '🎤 Speak Answer'}
                                </motion.button>

                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {isListening ? 'Listening...' : 'Or type your answer below'}
                                </p>
                            </div>
                        )}

                        {/* ── Answer Text Area ──────────────────────────────────────── */}
                        <div className="space-y-3 mb-6">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                Your Answer
                            </label>
                            <textarea
                                ref={vivaAnswerRef}
                                value={currentVivaAnswer}
                                onChange={(e) => setCurrentVivaAnswer(e.target.value)}
                                disabled={hasAnswered}
                                placeholder="Type or speak your answer here..."
                                className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                                rows={6}
                            />
                        </div>

                        {/* ── Evaluation Display ──────────────────────────────────────── */}
                        {hasAnswered && vivaAnswers[currentQuestion] && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 mb-6"
                            >
                                {/* ── Score Badge ──────────────────────────────────────── */}
                                <div className={`p-4 rounded-lg text-white text-center ${
                                    vivaAnswers[currentQuestion].evaluation.score >= 8
                                        ? 'bg-green-600'
                                        : vivaAnswers[currentQuestion].evaluation.score >= 5
                                            ? 'bg-yellow-600'
                                            : 'bg-red-600'
                                }`}>
                                    <p className="text-3xl font-bold">
                                        {vivaAnswers[currentQuestion].evaluation.score}/10
                                    </p>
                                    <p className="text-sm font-semibold">
                                        {vivaAnswers[currentQuestion].evaluation.verdict}
                                    </p>
                                </div>

                                {/* ── Feedback ──────────────────────────────────────── */}
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                        Feedback
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        {vivaAnswers[currentQuestion].evaluation.feedback}
                                    </p>
                                </div>

                                {/* ── Model Answer Collapsible ──────────────────────────────────────── */}
                                <motion.button
                                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                                    className="w-full py-3 px-4 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold flex items-center justify-between text-sm"
                                >
                                    View Model Answer
                                    <ChevronDown size={18} className={`transition-transform ${showModelAnswer ? 'rotate-180' : ''}`} />
                                </motion.button>

                                <AnimatePresence>
                                    {showModelAnswer && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                                        >
                                            <p className="text-xs font-semibold text-purple-900 dark:text-purple-300 mb-2">
                                                Ideal Answer
                                            </p>
                                            <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                                                {vivaAnswers[currentQuestion].evaluation.modelAnswer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* ── Submit / Next Buttons ──────────────────────────────────────── */}
                    <div className="space-y-3">
                        {!hasAnswered && (
                            <motion.button
                                onClick={submitVivaAnswer}
                                disabled={!currentVivaAnswer.trim()}
                                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-teal-600 to-purple-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                                whileTap={{ scale: 0.98 }}
                            >
                                Submit Answer
                            </motion.button>
                        )}

                        {hasAnswered && currentQuestion < vivaQuestions.length - 1 && (
                            <motion.button
                                onClick={() => {
                                    setCurrentQuestion(currentQuestion + 1);
                                    setCurrentVivaAnswer('');
                                    setShowModelAnswer(false);
                                }}
                                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-teal-600 to-purple-500 text-white font-semibold hover:shadow-lg transition-all"
                                whileTap={{ scale: 0.98 }}
                            >
                                Next Question →
                            </motion.button>
                        )}
                    </div>

                </div>
            </div>
        );
    }

    // ── VIVA EVALUATING STATE ──────────────────────────────────────────
    if (quizState === 'viva-evaluating') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-6xl mb-4"
                >
                    ⚙️
                </motion.div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Evaluating Your Answer...
                </p>
            </div>
        );
    }

    // ── VIVA RESULTS STATE ──────────────────────────────────────────
    if (quizState === 'viva-results' && vivaAnswers.length > 0) {
        const totalScore = vivaAnswers.reduce((sum, a) => sum + a.evaluation.score, 0);
        const percentage = Math.round((totalScore / (vivaAnswers.length * 10)) * 100);

        let resultEmoji = '📚';
        let resultMessage = 'Keep Practicing!';
        if (percentage >= 80) {
            resultEmoji = '🏆';
            resultMessage = 'Excellent Performance!';
        } else if (percentage >= 60) {
            resultEmoji = '👍';
            resultMessage = 'Good Effort!';
        }

        return (
            <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                    {/* ── Score Card ──────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-teal-500 to-purple-500 rounded-xl p-8 text-white text-center"
                    >
                        <div className="text-6xl mb-4">{resultEmoji}</div>
                        <h2 className="text-3xl font-bold mb-2">{totalScore}/{vivaAnswers.length * 10}</h2>
                        <p className="text-xl font-semibold mb-4">{resultMessage}</p>
                        <p className="text-sm opacity-90">{percentage}% Performance</p>
                    </motion.div>

                    {/* ── Performance Breakdown ──────────────────────────────────────── */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Performance Breakdown
                        </h3>
                        {vivaAnswers.map((answer, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`p-4 rounded-lg border-l-4 ${
                                    answer.evaluation.score >= 8
                                        ? 'bg-green-50 dark:bg-green-950/20 border-green-500'
                                        : answer.evaluation.score >= 5
                                            ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500'
                                            : 'bg-red-50 dark:bg-red-950/20 border-red-500'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        Question {idx + 1}
                                    </p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {answer.evaluation.score}/10
                                    </p>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {answer.question}
                                </p>
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {answer.evaluation.verdict}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* ── Buttons ──────────────────────────────────────── */}
                    <div className="space-y-3 pt-4">
                        <motion.button
                            onClick={restartQuiz}
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-teal-600 to-purple-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                            whileTap={{ scale: 0.98 }}
                        >
                            <RotateCcw size={18} />
                            Retake Viva
                        </motion.button>

                        <motion.button
                            onClick={() => {
                                setMode('mcq');
                                restartQuiz();
                            }}
                            className="w-full py-3 px-4 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold hover:shadow-lg transition-all"
                            whileTap={{ scale: 0.98 }}
                        >
                            Back to MCQ Mode
                        </motion.button>
                    </div>

                </div>
            </div>
        );
    }

    // ── MCQ RESULTS STATE ──────────────────────────────────────────
    if (quizState === 'results' && questions.length > 0) {
        const score = answers.filter((a, idx) => a === questions[idx].correct).length;
        const total = questions.length;
        const percentage = Math.round((score / total) * 100);

        let scoreEmoji = '📚';
        let scoreMessage = 'Keep Studying!';
        if (score === 5) {
            scoreEmoji = '🏆';
            scoreMessage = 'Perfect Score!';
        } else if (score === 4) {
            scoreEmoji = '🌟';
            scoreMessage = 'Excellent!';
        } else if (score === 3) {
            scoreEmoji = '👍';
            scoreMessage = 'Good Job!';
        }

        return (
            <div className="flex flex-col h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">

                    {/* ── Score Card ──────────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-purple-500 to-teal-500 rounded-xl p-8 text-white text-center"
                    >
                        <div className="text-6xl mb-4">{scoreEmoji}</div>
                        <h2 className="text-3xl font-bold mb-2">{score}/{total}</h2>
                        <p className="text-xl font-semibold mb-4">{scoreMessage}</p>
                        <p className="text-sm opacity-90">{percentage}% Correct</p>
                    </motion.div>

                    {/* ── Review ──────────────────────────────────────── */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                            Review Your Answers
                        </h3>
                        {questions.map((q, idx) => {
                            const isCorrect = answers[idx] === q.correct;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-4 rounded-lg border-l-4 ${
                                        isCorrect
                                            ? 'bg-green-50 dark:bg-green-950/20 border-green-500'
                                            : 'bg-red-50 dark:bg-red-950/20 border-red-500'
                                    }`}
                                >
                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                                        Question {idx + 1}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        {q.question}
                                    </p>
                                    <p className={`text-xs ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                        Your answer: {q.options[answers[idx]]}
                                    </p>
                                    {!isCorrect && (
                                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                            Correct: {q.options[q.correct]}
                                        </p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* ── Buttons ──────────────────────────────────────── */}
                    <div className="space-y-3 pt-4">
                        <motion.button
                            onClick={saveWrongAnswers}
                            disabled={score === 5}
                            className="w-full py-3 px-4 rounded-lg bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                            text-white font-semibold flex items-center justify-center gap-2 transition-all"
                            whileTap={{ scale: 0.98 }}
                        >
                            <BookmarkPlus size={18} />
                            Save Wrong Answers as Flashcards
                        </motion.button>

                        <motion.button
                            onClick={restartQuiz}
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-teal-500 text-white font-semibold
                            flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                            whileTap={{ scale: 0.98 }}
                        >
                            <RotateCcw size={18} />
                            Try Again
                        </motion.button>
                    </div>

                </div>
            </div>
        );
    }

    return null;
}
