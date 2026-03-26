import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, RotateCcw, BookmarkPlus } from 'lucide-react';

interface QuizQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

export default function QuizTab() {
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<number[]>([]);
    const [quizState, setQuizState] = useState<'idle' | 'loading' | 'question' | 'results'>('idle');
    const [error, setError] = useState('');

    const startQuiz = async () => {
        setLoading(true);
        setError('');
        setQuizState('loading');

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tabs[0]?.id) throw new Error('No active tab');

            // Get page text
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'getPageText' },
                (response) => {
                    if (chrome.runtime.lastError || !response?.text) {
                        setError('Could not extract page content.');
                        setQuizState('idle');
                        setLoading(false);
                        return;
                    }

                    // Generate quiz
                    chrome.runtime.sendMessage(
                        { action: 'generateQuiz', pageText: response.text },
                        (quizResponse) => {
                            if (chrome.runtime.lastError || !quizResponse?.success) {
                                setError('Failed to generate quiz.');
                                setQuizState('idle');
                                setLoading(false);
                                return;
                            }

                            setQuestions(quizResponse.data);
                            setAnswers([]);
                            setCurrentQuestion(0);
                            setQuizState('question');
                            setLoading(false);
                        }
                    );
                }
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setQuizState('idle');
            setLoading(false);
        }
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
        setQuizState('idle');
        setQuestions([]);
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
                    {loading ? 'Generating Questions...' : 'Start Quiz'}
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
                    Generating Questions...
                </p>
            </div>
        );
    }

    // ── QUESTION STATE ──────────────────────────────────────────
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

    // ── RESULTS STATE ──────────────────────────────────────────
    if (quizState === 'results') {
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
