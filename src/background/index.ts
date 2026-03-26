// FocusRead AI — Background Service Worker
// Handles all Groq API calls and chrome.storage state management

const ANTHROPIC_API_KEY = import.meta.env.VITE_GROQ_API_KEY || 'your_api_key_here';
const MODEL = 'llama-3.3-70b-versatile';
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_TOKENS = 1024;
const MAX_TOKENS_ESSAY = 2048;

// ─── Distraction sites ───────────────────────────────────────────
const DISTRACTION_SITES = [
    'youtube.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'facebook.com',
    'reddit.com',
    'tiktok.com',
    'netflix.com',
    'twitch.tv',
];

// ─── Core API Call ───────────────────────────────────────────────
async function callClaude(system: string, userMsg: string): Promise<string> {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: userMsg }
            ],
        }),
    });

    if (!res.ok) {
        const err: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `API error ${res.status}`);
    }

    const data: { choices: { message: { content: string } }[] } = await res.json();
    return data.choices[0].message.content;
}

// ─── Summarise page ──────────────────────────────────────────────
async function summarizePage(pageText: string): Promise<string> {
    const truncated = pageText.slice(0, 6000);
    const system = `You are an expert academic study assistant. Create concise, structured summaries
    and exam questions for students. Always respond in EXACTLY the format specified.`;

    const user = `Analyze this webpage content and respond in EXACTLY this format — no extra text:

    SUMMARY:
    - [Point 1]
    - [Point 2]
    - [Point 3]
    - [Point 4]
    - [Point 5]

    EXAM QUESTIONS:
    1. [Question 1]?
    2. [Question 2]?
    3. [Question 3]?

    Webpage content:
    ${truncated}`;

    return callClaude(system, user);
}

// ─── Chat with AI ────────────────────────────────────────────────
async function chatWithAI(message: string, pageContent: string, lastSummary: string = '', history: { role: string, content: string }[] = []): Promise<string> {
    const pageContextTruncated = pageContent.slice(0, 4000);
    const summaryContextTruncated = lastSummary.slice(0, 2000);

    const system = `You are FocusRead AI, an intelligent study assistant embedded in the browser.

IMPORTANT LANGUAGE RULE:
- Always reply in the SAME language as the user's message.
- If the user writes in Marathi, reply ONLY in Marathi.
- If the user writes in Hindi, reply ONLY in Hindi.
- If the user writes in English, reply ONLY in English.
- Do NOT translate unless explicitly asked.
- Preserve the user's language strictly in every response.

PAGE CONTENT (what the user is currently reading):
${pageContextTruncated}

GENERATED SUMMARY (AI analysis already done on this page):
${summaryContextTruncated}

Use the above context to answer the student's questions accurately and specifically.
Never say you have no information — always use the summary and page content above.
If asked about a video, use the summary to give specific answers about that video.
Be concise, clear, and student-friendly. Max 150 words unless asked for more.`;

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            messages: [
                { role: 'system', content: system },
                ...history.map(h => ({ role: h.role, content: h.content })),
                { role: 'user', content: message }
            ],
        }),
    });

    if (!res.ok) {
        const err: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `API error ${res.status}`);
    }

    const data: { choices: { message: { content: string } }[] } = await res.json();
    return data.choices[0].message.content;
}

// ─── Generate Flashcard Explanation ─────────────────────────────
async function generateFlashcardBack(front: string, pageContent: string): Promise<string> {
    const truncated = pageContent.slice(0, 3000);
    const system = `You are a study assistant. Given a study point and some page context,
    write a clear, simple, 2-3 sentence explanation a student can use to remember this concept.
    Be concise and educational.`;

    const user = `Study point: "${front}"

    Page context:
    ${truncated}

    Write a 2-3 sentence explanation for the back of this flashcard:`;

    return callClaude(system, user);
}

// ─── Solve Study Problem ────────────────────────────────────────
async function solveProblem(problem: string): Promise<string> {
    const system = `You are an expert tutor. Solve the problem step by step. 
Format: SOLUTION: then numbered steps. 
End with KEY CONCEPT: one line summary.`;

    const user = `Student problem:\n${problem}`;

    return callClaude(system, user);
}

// ─── Write Essay ────────────────────────────────────────────────
async function writeEssay(topic: string, essayType: string, wordCount: string): Promise<string> {
    const wordMap: { [key: string]: number } = {
        '250': 250,
        '500': 500,
        '1000': 1000,
    };
    const words = wordMap[wordCount] || 500;
    
    const system = `You are an expert essay writer. Write a well-structured, engaging ${essayType.toLowerCase()} essay.
Use proper grammar, clear paragraphs, and compelling arguments. The essay should be approximately ${words} words.`;

    const user = `Write a ${essayType} essay on the topic: "${topic}"`;

    // Use higher token limit for essays
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: MAX_TOKENS_ESSAY,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ],
        }),
    });

    if (!res.ok) {
        const err: { error?: { message?: string } } = await res.json().catch(() => ({}));
        throw new Error(err.error?.message ?? `API error ${res.status}`);
    }

    const data: { choices: { message: { content: string } }[] } = await res.json();
    return data.choices[0].message.content;
}

// ─── Detect AI-Generated Text ───────────────────────────────────
async function detectAI(text: string): Promise<string> {
    const system = `Analyze the following text and determine if it was written by AI or a human.
Look for: repetitive patterns, lack of personal voice, overly perfect structure,
generic phrasing, no spelling errors, unnaturally balanced arguments.
Respond in EXACTLY this format:
VERDICT: [AI-Generated / Human-Written / Mixed]
CONFIDENCE: [percentage]%
REASONS:
- [reason 1]
- [reason 2]
- [reason 3]`;

    const user = `Text to analyze:\n${text}`;

    return callClaude(system, user);
}

// ─── Translate Text ────────────────────────────────────────────
async function translateText(text: string, targetLanguage: string): Promise<string> {
    const system = `You are a professional translator. Translate the given text to ${targetLanguage}.
Maintain the original tone, style, and meaning. Provide only the translation, nothing else.`;

    const user = `Translate this text to ${targetLanguage}:\n${text}`;

    return callClaude(system, user);
}

// ─── Search Enhance (Answer search queries) ────────────────────
async function searchEnhance(query: string): Promise<string> {
    const system = `You are a helpful study assistant. Answer the search query clearly and concisely in 3-5 sentences. 
Focus on educational value. End with LEARN MORE: one suggested follow-up question.`;

    const user = `Query: ${query}`;

    return callClaude(system, user);
}

// ─── Fetch YouTube Captions from API ───────────────────────────
async function fetchYouTubeCaption(videoId: string): Promise<string> {
    try {
        // Fetch the video page to get ytInitialPlayerResponse
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        if (!response.ok) return '';

        const html = await response.text();
        const match = html.match(/"captionTracks":\[(.*?)\]/);
        if (!match) return '';

        // Extract caption track URL
        const captionTrackMatch = html.match(/"baseUrl":"([^"]+)/);
        if (!captionTrackMatch) return '';

        const captionUrl = captionTrackMatch[1]
            .replace(/\\u0026/g, '&')
            .replace(/\\\//g, '/');

        // Fetch caption XML
        const captionResponse = await fetch(captionUrl);
        if (!captionResponse.ok) return '';

        const xml = await captionResponse.text();
        // Parse XML and extract text
        const textMatches = xml.match(/<text[^>]*>([^<]+)<\/text>/g) || [];
        const captions = textMatches
            .map(t => t.replace(/<[^>]+>/g, '').trim())
            .filter(Boolean)
            .join(' ');

        return captions.slice(0, 6000);
    } catch {
        return '';
    }
}

// ─── YouTube Summarize ──────────────────────────────────────────
async function summarizeYouTube(transcript: string, youtubeData?: { title: string; channel: string; description: string; duration: string; chapters: string[] }): Promise<{
    videoTitle: string;
    videoSummary: string;
    keyPoints: string[];
    bestMoments: string[];
}> {
    const truncated = transcript.slice(0, 8000);
    
    // Build rich context from YouTube metadata
    const videoTitle = youtubeData?.title || 'YouTube Video';
    const channel = youtubeData?.channel || 'Unknown Channel';
    const duration = youtubeData?.duration || 'Unknown';
    const description = youtubeData?.description?.slice(0, 500) || 'No description';
    const chapters = youtubeData?.chapters?.slice(0, 8).join(', ') || 'No chapters';

    const system = `You are a YouTube video study assistant. Based on video metadata and available transcript, generate a detailed, specific summary with real information from the video.`;

    const user = `Video Details:
Title: ${videoTitle}
Channel: ${channel}
Duration: ${duration}
Description: ${description}
Chapters: ${chapters}

Transcript (if available):
${truncated}

Based on ALL the information above, generate a detailed study summary in this EXACT format:

VIDEO SUMMARY:
- (specific point 1 from this video)
- (specific point 2 from this video)
- (specific point 3 from this video)
- (specific point 4 from this video)
- (specific point 5 from this video)

KEY CONCEPTS:
1. (real concept from this specific video)
2. (real concept from this specific video)
3. (real concept from this specific video)

STUDY QUESTIONS:
1. (question based on actual video content)?
2. (question based on actual video content)?
3. (question based on actual video content)?

IMPORTANT: Never use placeholder text like 'Point 1' or 'Concept one'. Use specific, real information from the video title, description, chapters, and transcript provided. If transcript is empty, make intelligent inferences based on the video title and description.`;

    const response = await callClaude(system, user);

    // Parse the response
    const summaryMatch = response.match(/VIDEO SUMMARY:(.+?)(?=KEY CONCEPTS:|$)/s);
    const conceptsMatch = response.match(/KEY CONCEPTS:(.+?)(?=STUDY QUESTIONS:|$)/s);
    const questionsMatch = response.match(/STUDY QUESTIONS:(.+?)$/s);

    const summaryText = summaryMatch ? summaryMatch[1].trim() : response.slice(0, 200);
    const conceptsText = conceptsMatch ? conceptsMatch[1].trim() : '';
    const questionsText = questionsMatch ? questionsMatch[1].trim() : '';

    const keyPoints = conceptsText
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./)) 
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);

    const bestMoments = questionsText
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./)) 
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);

    return {
        videoTitle: videoTitle,
        videoSummary: summaryText,
        keyPoints: keyPoints.slice(0, 5),
        bestMoments: bestMoments.slice(0, 3),
    };
}

// ─── Generate Mind Map ──────────────────────────────────────────
async function generateMindMap(pageText: string): Promise<{
    center: string;
    branches: Array<{ label: string; children: string[] }>;
}> {
    const truncated = pageText.slice(0, 5000);
    const system = `Analyze this content and return ONLY a JSON object (no markdown, no explanation) in this exact format:
{
  "center": "Main Topic",
  "branches": [
    { "label": "Branch 1", "children": ["subtopic1", "subtopic2", "subtopic3"] },
    { "label": "Branch 2", "children": ["subtopic1", "subtopic2", "subtopic3"] },
    { "label": "Branch 3", "children": ["subtopic1", "subtopic2", "subtopic3"] },
    { "label": "Branch 4", "children": ["subtopic1", "subtopic2"] },
    { "label": "Branch 5", "children": ["subtopic1", "subtopic2"] }
  ]
}`;

    const user = `Content:\n${truncated}`;

    const response = await callClaude(system, user);

    try {
        return JSON.parse(response);
    } catch {
        // Fallback structure
        return {
            center: 'Topic',
            branches: [
                { label: 'Overview', children: ['Introduction', 'Main Ideas', 'Concepts'] },
                { label: 'Details', children: ['Point A', 'Point B', 'Point C'] },
                { label: 'Examples', children: ['Example 1', 'Example 2'] },
                { label: 'Applications', children: ['Use Case 1', 'Use Case 2'] },
                { label: 'Summary', children: ['Key Takeaway', 'Next Steps'] },
            ],
        };
    }
}

// ─── Generate Quiz ──────────────────────────────────────────────
async function generateQuiz(pageText: string): Promise<Array<{
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}>> {
    const truncated = pageText.slice(0, 5000);
    const system = `Generate exactly 5 multiple choice questions based on this content.
Return ONLY a JSON array (no markdown) in this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Why this answer is correct"
  }
]
The 'correct' field is the index (0-3) of the correct option.`;

    const user = `Content:\n${truncated}`;

    const response = await callClaude(system, user);

    try {
        return JSON.parse(response);
    } catch {
        // Fallback quiz
        return [
            {
                question: 'What is the main topic?',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correct: 0,
                explanation: 'Based on the content provided.',
            },
        ];
    }
}

// ─── Generate Viva Questions ────────────────────────────────────
async function generateViva(pageText: string, summary: string): Promise<string[]> {
    const truncated = pageText.slice(0, 5000);
    const summaryTruncated = summary.slice(0, 1500);

    const system = `You are a strict university examiner conducting a viva voce exam.
Based on the following page content and summary, generate exactly 5 viva-style questions.
These should test deep conceptual understanding, not just facts.
Mix question types: explain, compare, justify, apply, critique.
Return ONLY a JSON array of strings. Example:
["Explain the core concept of X in your own words.", "Compare X and Y with specific examples.", "How would you apply X to solve Y?"]`;

    const user = `Page Content:
${truncated}

Summary:
${summaryTruncated}

Generate 5 university-level viva voce questions based on the above content:`;

    const response = await callClaude(system, user);

    try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 5);
        }
        throw new Error('Invalid format');
    } catch {
        // Fallback questions
        return [
            'Explain the main concept from this content in your own words.',
            'What is the significance and real-world application of this topic?',
            'Can you compare this concept with a related idea you know?',
            'What are the limitations or criticisms of this approach?',
            'How would you teach this concept to someone else?',
        ];
    }
}

// ─── Evaluate Viva Answer ───────────────────────────────────────
async function evaluateViva(
    question: string,
    userAnswer: string,
    pageContent: string,
): Promise<{
    score: number;
    verdict: string;
    feedback: string;
    modelAnswer: string;
}> {
    const contentTruncated = pageContent.slice(0, 3000);

    const system = `You are a strict but fair university examiner. Evaluate this viva answer based on accuracy, depth of understanding, and clarity.
Return ONLY a JSON object with this exact format (no markdown):
{
  "score": <number 0-10>,
  "verdict": "Excellent" | "Good" | "Average" | "Needs Improvement" | "Incorrect",
  "feedback": "<2-3 sentences specific feedback>",
  "modelAnswer": "<ideal answer in 3-4 sentences>"
}`;

    const user = `Page Context:
${contentTruncated}

Viva Question:
${question}

Student's Answer:
${userAnswer}

Evaluate this answer strictly:`;

    const response = await callClaude(system, user);

    try {
        const parsed = JSON.parse(response);
        return {
            score: Math.min(10, Math.max(0, parsed.score ?? 5)),
            verdict: parsed.verdict ?? 'Average',
            feedback: parsed.feedback ?? 'Response provided.',
            modelAnswer: parsed.modelAnswer ?? 'A comprehensive answer should address the key concepts.',
        };
    } catch {
        // Fallback evaluation
        return {
            score: 5,
            verdict: 'Average',
            feedback: 'Your answer addresses the question. Consider providing more specific examples or theoretical depth.',
            modelAnswer: 'An ideal answer would demonstrate deep understanding with concrete examples and theoretical grounding.',
        };
    }
}

// ─── Explain Text ────────────────────────────────────────────────
async function explainText(text: string): Promise<string> {
    const system = `Explain this concept clearly in 2-3 sentences for a student. Then give one real-world example.
Format: EXPLANATION: [text] EXAMPLE: [text]`;

    const user = `Explain: ${text}`;

    return callClaude(system, user);
}

// ─── Add Highlight Flashcard ────────────────────────────────────
async function addHighlightFlashcard(text: string): Promise<string> {
    const system = `Generate a concise AI explanation for this study concept. 1-2 sentences maximum.`;

    const user = `Concept: ${text}`;

    return callClaude(system, user);
}

// ─── Icon Click Handler (Open Sidebar) ──────────────────────────
chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    chrome.sidePanel.open({ tabId: tab.id });
});

// ─── Message Listener ────────────────────────────────────────────
chrome.runtime.onMessage.addListener(
    (
        request: { action: string; pageText?: string; pageContent?: string; message?: string; front?: string; enabled?: boolean; history?: { role: string; content: string }[]; problem?: string; topic?: string; essayType?: string; wordCount?: string; text?: string; targetLanguage?: string; query?: string; lastSummary?: string; detectedLanguage?: string; summary?: string; question?: string; userAnswer?: string },
        _sender,
        sendResponse: (r: { success: boolean; data?: string; enabled?: boolean; error?: string }) => void,
    ) => {
        if (request.action === 'summarize') {
            summarizePage(request.pageText ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'chat') {
            chatWithAI(request.message ?? '', request.pageContent ?? request.pageText ?? '', request.lastSummary ?? '', request.history ?? [])
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'generateFlashcardBack') {
            generateFlashcardBack(request.front ?? '', request.pageText ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'solveProblem') {
            solveProblem(request.problem ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'writeEssay') {
            writeEssay(request.topic ?? '', request.essayType ?? '', request.wordCount ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'detectAI') {
            detectAI(request.text ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'translate') {
            translateText(request.text ?? '', request.targetLanguage ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'translateToEnglish') {
            const detectedLang = request.detectedLanguage ?? 'Unknown Language';
            translateText(request.text ?? '', `English (from ${detectedLang})`)
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'searchEnhance') {
            searchEnhance(request.query ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'summarizeYouTube') {
            // Get YouTube data from content script first
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { action: 'getYouTubeData' },
                        (youtubeDataResponse: any) => {
                            const youtubeData = youtubeDataResponse?.data || {};
                            summarizeYouTube(request.pageText ?? '', youtubeData)
                                .then((data) => sendResponse({ success: true, data }))
                                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
                        },
                    );
                } else {
                    // Fallback if no active tab
                    summarizeYouTube(request.pageText ?? {})
                        .then((data) => sendResponse({ success: true, data }))
                        .catch((err: Error) => sendResponse({ success: false, error: err.message }));
                }
            });
            return true;
        }

        if (request.action === 'generateMindMap') {
            generateMindMap(request.pageText ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'generateQuiz') {
            generateQuiz(request.pageText ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'generateViva') {
            generateViva(request.pageText ?? '', request.summary ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'evaluateViva') {
            evaluateViva(request.question ?? '', request.userAnswer ?? '', request.pageContent ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'explainText') {
            explainText(request.text ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'addHighlightFlashcard') {
            addHighlightFlashcard(request.text ?? '')
                .then((data) => sendResponse({ success: true, data }))
                .catch((err: Error) => sendResponse({ success: false, error: err.message }));
            return true;
        }

        if (request.action === 'setFocusMode') {
            chrome.storage.local.set({ focusMode: request.enabled }, () => {
                sendResponse({ success: true });
            });
            return true;
        }

        if (request.action === 'getFocusMode') {
            chrome.storage.local.get('focusMode', (result) => {
                sendResponse({ success: true, enabled: !!result.focusMode });
            });
            return true;
        }
    },
);

// ─── Focus Mode Tab Watcher ──────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' || !tab.url) return;

    chrome.storage.local.get('focusMode', (result) => {
        if (!result.focusMode) return;

        const isDistraction = DISTRACTION_SITES.some((site) => tab.url!.includes(site));
        if (!isDistraction) return;

        chrome.scripting
            .executeScript({
                target: { tabId },
                func: () => {
                    window.dispatchEvent(new CustomEvent('focusread:block'));
                },
            })
            .catch(() => {/* tab may not be scriptable */ });
    });
});