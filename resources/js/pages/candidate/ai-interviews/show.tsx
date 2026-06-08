import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bot,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Hand,
    Headphones,
    HelpCircle,
    Info,
    ListChecks,
    Loader2,
    Mic,
    MicOff,
    Pause,
    PhoneOff,
    Play,
    Radio,
    RotateCcw,
    Send,
    ShieldCheck,
    Signal,
    SkipForward,
    Sparkles,
    Video,
    VideoOff,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import CandidateAiInterviewController from '@/actions/App/Http/Controllers/Candidate/CandidateAiInterviewController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { feedback, index, show } from '@/routes/candidate/ai-interviews';

type AiInterviewShowProps = {
    session: {
        id: number;
        application_id: number;
        job_title?: string | null;
        company?: string | null;
        candidate_name?: string | null;
        candidate_headline?: string | null;
        status: string;
        interview_mode?: string | null;
        interview_language?: 'id' | 'en' | null;
        scheduled_at?: string | null;
        duration_minutes?: number | null;
        meeting_url?: string | null;
        voice?: string | null;
        started_at?: string | null;
        completed_at?: string | null;
        candidate_confirmed_at?: string | null;
        declined_at?: string | null;
        reschedule_requested_at?: string | null;
        reschedule_proposed_at?: string | null;
        reschedule_reason?: string | null;
        reschedule_status?: string | null;
        reschedule_reviewed_at?: string | null;
        reschedule_rejected_reason?: string | null;
        ai_intro: {
            assistant_name: string;
            assistant_role: string;
            greeting: string;
            is_practice?: boolean;
        };
        reschedule_timeline?: Array<{
            action: string;
            actor_name?: string | null;
            scheduled_at?: string | null;
            reason?: string | null;
            created_at?: string | null;
        }>;
        client_secret_url: string;
        questions_preparing?: boolean;
        questions: Array<{
            id: number;
            question: string;
            category?: string | null;
            rubric?: string | null;
            weight?: number | null;
            allow_ai_followup?: boolean | null;
            question_type?: 'open' | 'multiple_choice' | null;
            options?: string[] | null;
            answer_text?: string | null;
            ai_score?: number | null;
            ai_analysis?: string | null;
        }>;
        analysis?: {
            fit_score?: number | null;
            recommendation?: string | null;
            summary?: string | null;
        } | null;
    };
};

type TranscriptItem = {
    speaker: 'AI' | 'Kandidat';
    text: string;
};

type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';
type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
type MicErrorKind =
    | 'not-allowed'
    | 'system-denied'
    | 'not-found'
    | 'security'
    | 'in-use'
    | 'unsupported'
    | 'unknown'
    | null;
type BrowserKind = 'brave' | 'chrome' | 'firefox' | 'safari' | 'edge' | 'other';
const TIMER_EXPIRED_REDIRECT_DELAY_MS = 30_000;

function detectBrowser(): BrowserKind {
    if (typeof window === 'undefined') {
        return 'other';
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const nav = window.navigator as Navigator & {
        brave?: { isBrave?: () => Promise<boolean> };
    };

    if (nav.brave && typeof nav.brave.isBrave === 'function') {
        return 'brave';
    }

    if (ua.includes('edg/')) {
        return 'edge';
    }

    if (ua.includes('firefox')) {
        return 'firefox';
    }

    if (ua.includes('chrome')) {
        return 'chrome';
    }

    if (ua.includes('safari')) {
        return 'safari';
    }

    return 'other';
}

function normalizeQuestionText(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const SIGNAL_RANK: Record<SignalQuality, number> = {
    offline: 0,
    poor: 1,
    fair: 2,
    good: 3,
    excellent: 4,
};

function worstSignal(
    ...candidates: Array<SignalQuality | null>
): SignalQuality {
    const filtered = candidates.filter((c): c is SignalQuality => c !== null);

    if (filtered.length === 0) {
        return 'good';
    }

    return filtered.reduce((worst, current) =>
        SIGNAL_RANK[current] < SIGNAL_RANK[worst] ? current : worst,
    );
}

function scoreFromRtt(rttMs: number | null): SignalQuality | null {
    if (rttMs === null) {
        return null;
    }

    if (rttMs < 140) {
        return 'excellent';
    }

    if (rttMs < 260) {
        return 'good';
    }

    if (rttMs < 500) {
        return 'fair';
    }

    return 'poor';
}

function scoreFromPacketLoss(lossPct: number | null): SignalQuality | null {
    if (lossPct === null) {
        return null;
    }

    // Audio glitches mulai terasa di ~2% packet loss; >5% sudah unusable.
    if (lossPct < 1) {
        return 'excellent';
    }

    if (lossPct < 2) {
        return 'good';
    }

    if (lossPct < 5) {
        return 'fair';
    }

    return 'poor';
}

function scoreFromJitter(jitterMs: number | null): SignalQuality | null {
    if (jitterMs === null) {
        return null;
    }

    // Jitter buffer di browser biasanya nyaman <30ms; >60ms artinya audio choppy.
    if (jitterMs < 15) {
        return 'excellent';
    }

    if (jitterMs < 30) {
        return 'good';
    }

    if (jitterMs < 60) {
        return 'fair';
    }

    return 'poor';
}

// Keep this list small. Browsers warn (and slow ICE discovery) when 5+ STUN/TURN
// servers are configured. Two entries cover redundancy without the penalty.
const ICE_SERVERS: RTCIceServer[] = [
    {
        urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
        ],
    },
    { urls: 'stun:stun.cloudflare.com:3478' },
];

export default function CandidateAiInterviewShow({
    session,
}: AiInterviewShowProps) {
    const { t, locale } = useTranslate();
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const cameraPreviewRef = useRef<HTMLVideoElement | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const micLevelFrameRef = useRef<number | null>(null);
    const statsIntervalRef = useRef<number | null>(null);
    const lastInboundAudioStatsRef = useRef<{
        packetsLost: number;
        packetsReceived: number;
        bytesReceived: number;
        timestamp: number;
    } | null>(null);
    // Timestamp saat AI selesai bicara. VAD speech_started dalam window pendek
    // setelah ini hampir pasti echo dari speaker laptop, BUKAN suara kandidat.
    // Tanpa filter ini, echo bisa men-trigger auto-advance lalu OpenAI generate
    // response baru → terasa seperti "AI mengulang Q1 sendiri".
    const lastResponseDoneAtRef = useRef<number>(0);
    const dataChannelRef = useRef<RTCDataChannel | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const prewarmedSecretRef = useRef<{
        secret: string;
        model: string;
        language: 'id' | 'en';
        expiresAt: number;
    } | null>(null);
    const prewarmInFlightRef = useRef<Promise<void> | null>(null);
    const [hasSentGreeting, setHasSentGreeting] = useState(false);
    const hasSentGreetingRef = useRef(false);
    const greetingPendingRef = useRef<boolean>(false);
    const [consented, setConsented] = useState(false);
    const [cameraStreamActive, setCameraStreamActive] = useState(false);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [interviewLanguage, setInterviewLanguage] = useState<'id' | 'en'>(
        () => {
            if (
                session.interview_language === 'en' ||
                session.interview_language === 'id'
            ) {
                return session.interview_language;
            }

            return locale === 'en' ? 'en' : 'id';
        },
    );
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [muted, setMuted] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [cameraDetected, setCameraDetected] = useState<boolean | null>(null);
    const [microphoneDetected, setMicrophoneDetected] = useState<
        boolean | null
    >(null);
    const [networkOnline, setNetworkOnline] = useState<boolean>(true);
    const [micPermission, setMicPermission] =
        useState<MicPermissionState>('unknown');
    const [micErrorKind, setMicErrorKind] = useState<MicErrorKind>(null);
    const [micRequesting, setMicRequesting] = useState(false);
    const [showMicHelp, setShowMicHelp] = useState(false);
    const [browser] = useState<BrowserKind>(() => detectBrowser());
    const [micLevel, setMicLevel] = useState(0);
    const [waveformData, setWaveformData] = useState<number[]>([]);
    const [signalQuality, setSignalQuality] = useState<SignalQuality>('good');
    const [connectionHealth, setConnectionHealth] = useState<{
        rtt: number | null;
        jitter: number | null;
        packetLoss: number | null;
        bitrate: number | null;
    }>({
        rtt: null,
        jitter: null,
        packetLoss: null,
        bitrate: null,
    });
    const [voiceFailureCount, setVoiceFailureCount] = useState(0);
    const [showFallbackOption, setShowFallbackOption] = useState(false);
    const [sessionBackupKey, setSessionBackupKey] = useState(`ai-interview-${session.id}`);
    const [isPaused, setIsPaused] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [speechAnalytics, setSpeechAnalytics] = useState<{
        totalSpeechDuration: number;
        averageSpeechSpeed: number; // words per minute
        pauseCount: number;
        fillerWordCount: number;
    }>({
        totalSpeechDuration: 0,
        averageSpeechSpeed: 0,
        pauseCount: 0,
        fillerWordCount: 0,
    });
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [hasQuestionStarted, setHasQuestionStarted] = useState(false);
    const [activeAiQuestionText, setActiveAiQuestionText] = useState<
        string | null
    >(null);
    const [timerExpiryNoticeVisible, setTimerExpiryNoticeVisible] =
        useState(false);
    const [turnState, setTurnState] = useState<
        | 'ai-talking'
        | 'user-turn'
        | 'user-answering'
        | 'user-paused'
        | 'ai-thinking'
    >('ai-talking');
    const [autoAdvanceRemaining, setAutoAdvanceRemaining] = useState<
        number | null
    >(null);
    const userMutedRef = useRef(false);
    const silenceTimerRef = useRef<number | null>(null);
    const countdownIntervalRef = useRef<number | null>(null);
    const lastValidQuestionIndexRef = useRef<number>(0);
    const speechStartedAtRef = useRef<number>(0);
    const recentShortSpeechCountRef = useRef<number>(0);
    const hasValidTranscriptRef = useRef<boolean>(false);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const speechStartTimeRef = useRef<number>(0);
    const totalSpeechDurationRef = useRef<number>(0);
    const wordCountRef = useRef<number>(0);
    const SILENCE_BEFORE_COUNTDOWN_MS = 5_000;
    const AUTO_ADVANCE_COUNTDOWN_S = 5;
    const MIN_SPEECH_DURATION_MS = 1500; // Abaikan suara < 1.5 detik (batuk, hem hem, noise)
    const form = useForm({
        answers: Object.fromEntries(
            session.questions.map((question) => [
                question.id,
                question.answer_text ?? '',
            ]),
        ) as Record<number, string>,
        live_transcript: '',
    });
    const rescheduleForm = useForm({
        proposed_at: '',
        reason: '',
    });
    const activeQuestion = session.questions[currentQuestion];
    const interviewDurationMinutes = Math.max(
        1,
        Number(session.duration_minutes ?? 30),
    );
    const interviewDurationSeconds = interviewDurationMinutes * 60;
    const remainingSeconds = Math.max(
        interviewDurationSeconds - elapsedSeconds,
        0,
    );
    const hasTimerExpired = remainingSeconds === 0;
    const hasAutoSubmittedRef = useRef(false);
    const autoSubmitTimeoutRef = useRef<number | null>(null);
    const submitInterviewRef = useRef<() => Promise<void>>(async () => {});
    const normalizedQuestionMap = useMemo(
        () =>
            session.questions.map((question, index) => ({
                index,
                normalized: normalizeQuestionText(question.question),
            })),
        [session.questions],
    );
    const isVoiceInterview = (session.interview_mode ?? 'voice') === 'voice';
    const isPractice = Boolean(session.ai_intro?.is_practice);
    const invitationPending =
        session.status === 'scheduled' &&
        !session.candidate_confirmed_at &&
        !session.started_at &&
        !session.declined_at;
    const questionsPreparing = Boolean(session.questions_preparing);

    // Voice AI uses OpenAI realtime over WebRTC. Only Chromium browsers
    // (Chrome/Edge/Brave) are verified to open the data channel reliably; Firefox
    // is confirmed broken and Safari/others are untested. Warn on any non-Chromium
    // browser so the candidate can switch or pick text mode before wasting time.
    useEffect(() => {
        if (!isVoiceInterview) {
            return;
        }

        const isChromium =
            browser === 'chrome' ||
            browser === 'edge' ||
            browser === 'brave';

        if (browser === 'firefox') {
            toast.warning(
                'Voice AI belum stabil di Firefox — sesi suara sering gagal terhubung. Buka di Google Chrome/Edge, atau gunakan mode teks.',
                { duration: 10000 },
            );
        } else if (!isChromium) {
            toast.warning(
                'Voice AI paling stabil di Google Chrome, Edge, atau Brave. Kalau sesi suara gagal terhubung, ganti ke salah satu browser itu atau gunakan mode teks.',
                { duration: 10000 },
            );
        }
    }, [isVoiceInterview, browser]);

    // Poll for AI question generation progress while preparing flag is on.
    useEffect(() => {
        if (!questionsPreparing) {
            return;
        }

        const interval = window.setInterval(() => {
            router.reload({ only: ['session'] });
        }, 2000);

        return () => window.clearInterval(interval);
    }, [questionsPreparing]);

    const startCameraPreview = useCallback(async () => {
        if (cameraStreamRef.current) {
            return;
        }

        setCameraError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            });
            cameraStreamRef.current = stream;
            setCameraStreamActive(true);
            setCameraStream(stream);
            setCameraDetected(true);

            if (cameraPreviewRef.current) {
                cameraPreviewRef.current.srcObject = stream;
            }
        } catch {
            setCameraStreamActive(false);
            setCameraStream(null);
            setCameraDetected(false);
            setCameraError(t('candidate.ai_interview_show.camera_unavailable'));
        }
    }, [t]);

    const stopCameraPreview = useCallback(() => {
        cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;

        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = null;
        }

        setCameraStreamActive(false);
        setCameraStream(null);
    }, []);

    const startMicPreview = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setMicErrorKind('unsupported');

            return;
        }

        setMicRequesting(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            setMicPermission('granted');
            setMicrophoneDetected(true);
            setMicErrorKind(null);

            stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
            const err = error as DOMException;
            const name = err?.name ?? '';
            const message = (err?.message ?? '').toLowerCase();

            if (name === 'NotAllowedError') {
                setMicPermission('denied');

                if (
                    message.includes('system') ||
                    message.includes('permission denied by system')
                ) {
                    setMicErrorKind('system-denied');
                } else {
                    setMicErrorKind('not-allowed');
                }
            } else if (name === 'SecurityError') {
                setMicPermission('denied');
                setMicErrorKind('security');
            } else if (
                name === 'NotFoundError' ||
                name === 'OverconstrainedError'
            ) {
                setMicrophoneDetected(false);
                setMicErrorKind('not-found');
            } else if (name === 'NotReadableError' || name === 'AbortError') {
                setMicErrorKind('in-use');
            } else {
                setMicErrorKind('unknown');
            }
        } finally {
            setMicRequesting(false);
        }
    }, []);

    const refreshDevices = useCallback(async () => {
        if (!navigator.mediaDevices?.enumerateDevices) {
            return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameraDetected(
            devices.some((device) => device.kind === 'videoinput'),
        );
        setMicrophoneDetected(
            devices.some((device) => device.kind === 'audioinput'),
        );
    }, []);

    const stopMicLevelMonitor = () => {
        if (micLevelFrameRef.current !== null) {
            cancelAnimationFrame(micLevelFrameRef.current);
            micLevelFrameRef.current = null;
        }

        if (audioContextRef.current) {
            void audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setMicLevel(0);
    };

    const startMicLevelMonitor = (stream: MediaStream) => {
        stopMicLevelMonitor();

        if (typeof window === 'undefined') {
            return;
        }

        const AudioContextClass =
            window.AudioContext ||
            // Safari fallback
            (
                window as typeof window & {
                    webkitAudioContext?: typeof AudioContext;
                }
            ).webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const samples = new Uint8Array(analyser.fftSize);
        const waveformBars = 32; // Number of bars in waveform

        const updateLevel = () => {
            analyser.getByteTimeDomainData(samples);

            let sumSquares = 0;

            for (let index = 0; index < samples.length; index += 1) {
                const normalized = (samples[index] - 128) / 128;
                sumSquares += normalized * normalized;
            }

            const rms = Math.sqrt(sumSquares / samples.length);
            setMicLevel(Math.min(100, Math.round(rms * 320)));

            // Generate waveform data for visualization
            const waveform = [];
            const step = Math.floor(samples.length / waveformBars);
            for (let i = 0; i < waveformBars; i++) {
                const start = i * step;
                let max = 0;
                for (let j = 0; j < step; j++) {
                    const value = Math.abs((samples[start + j] - 128) / 128);
                    if (value > max) max = value;
                }
                waveform.push(max);
            }
            setWaveformData(waveform);

            micLevelFrameRef.current = requestAnimationFrame(updateLevel);
        };

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        micLevelFrameRef.current = requestAnimationFrame(updateLevel);
    };

    const stopConnectionMonitor = () => {
        if (statsIntervalRef.current !== null) {
            window.clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
        }
    };

    const pickRecorderMimeType = (): string | undefined => {
        if (typeof MediaRecorder === 'undefined') {
            return undefined;
        }

        const candidates = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
        ];

        return candidates.find((type) => MediaRecorder.isTypeSupported(type));
    };

    const startRecording = () => {
        if (typeof MediaRecorder === 'undefined') {
            return;
        }

        if (mediaRecorderRef.current) {
            return;
        }

        const videoTrack = cameraStreamRef.current?.getVideoTracks()[0];
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];

        if (!videoTrack || !audioTrack) {
            return;
        }

        const combined = new MediaStream([videoTrack, audioTrack]);
        const mimeType = pickRecorderMimeType();

        try {
            const recorder = new MediaRecorder(combined, {
                mimeType,
                videoBitsPerSecond: 600_000,
                audioBitsPerSecond: 64_000,
            });

            recordingChunksRef.current = [];
            recordingStreamRef.current = combined;
            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordingChunksRef.current.push(event.data);
                }
            };
            recorder.start(2000);
            mediaRecorderRef.current = recorder;
        } catch {
            mediaRecorderRef.current = null;
            recordingStreamRef.current = null;
            recordingChunksRef.current = [];
        }
    };

    const finalizeRecording = (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const recorder = mediaRecorderRef.current;

            if (!recorder) {
                resolve(null);

                return;
            }

            const handleStop = () => {
                const chunks = recordingChunksRef.current;
                const mimeType = recorder.mimeType || 'video/webm';
                const blob =
                    chunks.length > 0
                        ? new Blob(chunks, { type: mimeType })
                        : null;
                recordingChunksRef.current = [];
                mediaRecorderRef.current = null;
                recordingStreamRef.current = null;
                resolve(blob);
            };

            if (recorder.state === 'inactive') {
                handleStop();

                return;
            }

            recorder.addEventListener('stop', handleStop, { once: true });

            try {
                recorder.stop();
            } catch {
                handleStop();
            }
        });
    };

    const uploadRecording = async (blob: Blob): Promise<void> => {
        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `interview-${session.id}.${extension}`, {
            type: blob.type || 'video/webm',
        });
        const formData = new FormData();
        formData.append('recording', file);

        const response = await fetch(
            CandidateAiInterviewController.uploadRecording.url(session.id),
            {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
            },
        );

        if (!response.ok) {
            throw new Error('Upload rekaman gagal.');
        }
    };

    const updateSignalQuality = async () => {
        if (!networkOnline) {
            setSignalQuality('offline');

            return;
        }

        const connection = peerConnectionRef.current;

        if (!connection) {
            setSignalQuality('good');

            return;
        }

        const iceState = connection.iceConnectionState;

        if (iceState === 'failed' || iceState === 'closed') {
            setSignalQuality('offline');

            return;
        }

        if (iceState === 'disconnected') {
            setSignalQuality('fair');

            return;
        }

        const stats = await connection.getStats();
        let roundTripTimeMs: number | null = null;
        let jitterMs: number | null = null;
        let packetLossPct: number | null = null;
        let bytesReceivedStalled = false;

        stats.forEach((report) => {
            if (
                report.type === 'candidate-pair' &&
                (report as RTCIceCandidatePairStats).state === 'succeeded'
            ) {
                const currentRoundTripTime = (
                    report as RTCIceCandidatePairStats
                ).currentRoundTripTime;

                if (typeof currentRoundTripTime === 'number') {
                    roundTripTimeMs = currentRoundTripTime * 1000;
                }
            }

            if (
                report.type === 'inbound-rtp' &&
                (report as RTCInboundRtpStreamStats).kind === 'audio'
            ) {
                const inbound = report as RTCInboundRtpStreamStats & {
                    bytesReceived?: number;
                };
                const packetsLost = inbound.packetsLost ?? 0;
                const packetsReceived = inbound.packetsReceived ?? 0;
                const bytesReceived = inbound.bytesReceived ?? 0;
                const now = Date.now();

                if (typeof inbound.jitter === 'number') {
                    jitterMs = inbound.jitter * 1000;
                }

                const previous = lastInboundAudioStatsRef.current;

                if (previous) {
                    const deltaLost = packetsLost - previous.packetsLost;
                    const deltaReceived =
                        packetsReceived - previous.packetsReceived;
                    const totalPackets = deltaLost + deltaReceived;

                    if (totalPackets > 0) {
                        packetLossPct = (deltaLost / totalPackets) * 100;
                    }

                    if (
                        bytesReceived === previous.bytesReceived &&
                        now - previous.timestamp > 1500
                    ) {
                        bytesReceivedStalled = true;
                    }
                }

                lastInboundAudioStatsRef.current = {
                    packetsLost,
                    packetsReceived,
                    bytesReceived,
                    timestamp: now,
                };
            }
        });

        if (bytesReceivedStalled) {
            setSignalQuality('poor');

            return;
        }

        const rttScore = scoreFromRtt(roundTripTimeMs);
        const lossScore = scoreFromPacketLoss(packetLossPct);
        const jitterScore = scoreFromJitter(jitterMs);

        setSignalQuality(worstSignal(rttScore, lossScore, jitterScore));

        // Update connection health metrics for UI display
        setConnectionHealth({
            rtt: roundTripTimeMs,
            jitter: jitterMs,
            packetLoss: packetLossPct,
            bitrate: null, // Could be calculated from bytesReceived over time
        });
    };

    const startConnectionMonitor = () => {
        stopConnectionMonitor();

        void updateSignalQuality();
        statsIntervalRef.current = window.setInterval(() => {
            void updateSignalQuality();
        }, 2000);
    };

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const handleOnlineState = () => {
            setNetworkOnline(window.navigator.onLine);

            // Attempt to reconnect voice AI if it was disconnected
            if (window.navigator.onLine && peerConnectionRef.current && peerConnectionRef.current.connectionState === 'disconnected') {
                console.log('[Voice AI] Network back, attempting ICE restart');
                try {
                    peerConnectionRef.current.restartIce();
                } catch (err) {
                    console.warn('[Voice AI] Failed to restart ICE:', err);
                }
            }
        };

        handleOnlineState();
        window.addEventListener('online', handleOnlineState);
        window.addEventListener('offline', handleOnlineState);

        void refreshDevices();

        void startCameraPreview();

        void startMicPreview();

        let permissionStatus: PermissionStatus | null = null;

        if ('permissions' in navigator) {
            void navigator.permissions
                .query({ name: 'microphone' as PermissionName })
                .then((status) => {
                    permissionStatus = status;
                    setMicPermission(status.state as MicPermissionState);
                    status.onchange = () => {
                        setMicPermission(status.state as MicPermissionState);
                    };
                })
                .catch(() => {
                    setMicPermission('unknown');
                });
        }

        return () => {
            window.removeEventListener('online', handleOnlineState);
            window.removeEventListener('offline', handleOnlineState);

            if (permissionStatus) {
                permissionStatus.onchange = null;
            }
        };
    }, [refreshDevices, startCameraPreview, startMicPreview, isPractice]);

    useEffect(() => {
        if (!connected) {
            return;
        }

        const interval = window.setInterval(() => {
            setElapsedSeconds((seconds) => seconds + 1);
        }, 1000);

        return () => window.clearInterval(interval);
    }, [connected]);

    // Auto-save session state to localStorage for recovery
    useEffect(() => {
        if (!connected || !hasQuestionStarted) {
            return;
        }

        const saveInterval = window.setInterval(() => {
            const backupData = {
                currentQuestion,
                elapsedSeconds,
                transcript,
                answers: form.data.answers,
                timestamp: Date.now(),
            };
            try {
                localStorage.setItem(sessionBackupKey, JSON.stringify(backupData));
            } catch (error) {
                console.warn('[Session Backup] Failed to save:', error);
            }
        }, 5000); // Save every 5 seconds

        return () => window.clearInterval(saveInterval);
    }, [connected, hasQuestionStarted, currentQuestion, elapsedSeconds, transcript, form.data.answers, sessionBackupKey]);

    // Restore session state from localStorage on mount
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const backupData = localStorage.getItem(sessionBackupKey);
            if (backupData) {
                const parsed = JSON.parse(backupData);
                const backupAge = Date.now() - parsed.timestamp;

                // Only restore if backup is less than 1 hour old
                if (backupAge < 3600000) {
                    console.log('[Session Backup] Restoring from backup:', parsed);
                    setCurrentQuestion(parsed.currentQuestion);
                    setElapsedSeconds(parsed.elapsedSeconds);
                    setTranscript(parsed.transcript);
                    form.setData('answers', parsed.answers);
                    toast.info('Sesi dipulihkan dari backup terakhir.');
                } else {
                    console.log('[Session Backup] Backup too old, clearing');
                    localStorage.removeItem(sessionBackupKey);
                }
            }
        } catch (error) {
            console.warn('[Session Backup] Failed to restore:', error);
        }
    }, [sessionBackupKey]);

    // Update speech analytics when transcript changes
    useEffect(() => {
        if (transcript.length > 0) {
            updateSpeechAnalytics();
        }
    }, [transcript]);

    // Warn user before leaving page during active interview
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            // Show warning if interview is in progress or has started
            if (session.status !== 'completed' && (connected || hasQuestionStarted)) {
                event.preventDefault();
                event.returnValue = 'Anda yakin ingin meninggalkan halaman ini? Progress interview mungkin hilang.';
                return 'Anda yakin ingin meninggalkan halaman ini? Progress interview mungkin hilang.';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [connected, hasQuestionStarted, session.status]);

    useEffect(() => {
        if (!connected || !hasTimerExpired || hasAutoSubmittedRef.current) {
            return;
        }

        hasAutoSubmittedRef.current = true;
        setTimerExpiryNoticeVisible(true);
        toast.info(t('candidate.ai_interview_show.time_up_auto_end'));
        autoSubmitTimeoutRef.current = window.setTimeout(() => {
            setTimerExpiryNoticeVisible(false);
            void submitInterviewRef.current();
        }, TIMER_EXPIRED_REDIRECT_DELAY_MS);
    }, [connected, hasTimerExpired, t]);

    useEffect(() => {
        attachRemoteAudio();
    }, [connected]);

    useEffect(() => {
        return () => {
            if (autoSubmitTimeoutRef.current !== null) {
                window.clearTimeout(autoSubmitTimeoutRef.current);
                autoSubmitTimeoutRef.current = null;
            }

            stopConnectionMonitor();
            stopMicLevelMonitor();
            stopCameraPreview();
        };
    }, [stopCameraPreview]);

    useEffect(() => {
        if (
            cameraStreamActive &&
            cameraPreviewRef.current &&
            cameraStreamRef.current
        ) {
            cameraPreviewRef.current.srcObject = cameraStreamRef.current;
        }
    }, [cameraStreamActive]);

    const prewarmClientSecret = useCallback(async () => {
        if (prewarmInFlightRef.current) {
            return prewarmInFlightRef.current;
        }

        const cached = prewarmedSecretRef.current;

        if (
            cached &&
            cached.language === interviewLanguage &&
            cached.expiresAt > Date.now()
        ) {
            return;
        }

        const promise = (async () => {
            try {
                const response = await fetch(
                    CandidateAiInterviewController.clientSecret.url(session.id),
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            interview_language: interviewLanguage,
                        }),
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': csrfToken(),
                        },
                        credentials: 'same-origin',
                    },
                );

                if (!response.ok) {
                    return;
                }

                const payload = await response.json();

                if (
                    typeof payload?.client_secret === 'string' &&
                    typeof payload?.model === 'string'
                ) {
                    prewarmedSecretRef.current = {
                        secret: payload.client_secret,
                        model: payload.model,
                        language: interviewLanguage,
                        expiresAt: Date.now() + 40_000,
                    };
                }
            } catch {
                // Prewarm is best-effort; ignore errors and let the real connect handle them.
            } finally {
                prewarmInFlightRef.current = null;
            }
        })();

        prewarmInFlightRef.current = promise;

        return promise;
    }, [interviewLanguage, session.id]);

    useEffect(() => {
        if (
            !isVoiceInterview ||
            micPermission !== 'granted' ||
            connected ||
            connecting
        ) {
            return;
        }

        void prewarmClientSecret();
    }, [
        isVoiceInterview,
        micPermission,
        connected,
        connecting,
        prewarmClientSecret,
    ]);

    const attachRemoteAudio = () => {
        if (!remoteAudioRef.current || !remoteStreamRef.current) {
            return;
        }

        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;

        // Improve audio playback settings to reduce stuttering
        remoteAudioRef.current.autoplay = true;
        remoteAudioRef.current.preload = 'auto';

        const playResult = remoteAudioRef.current.play();

        if (playResult && typeof playResult.then === 'function') {
            playResult.catch((err) => {
                // Pre-gesture autoplay attempt; sendGreeting() will re-attempt
                // in a user gesture context. Only warn — do not surface to user yet.
                console.warn('Voice AI: pre-gesture audio play blocked', err);
            });
        }
    };

    const updateAnswer = (questionId: number, value: string) => {
        form.setData('answers', {
            ...form.data.answers,
            [questionId]: value,
        });
    };

    const confirmInvitation = () => {
        router.patch(
            CandidateAiInterviewController.confirm.url(session.id),
            {},
            {
                preserveScroll: true,
                onError: () => toast.error('Gagal mengonfirmasi undangan. Coba refresh halaman dan ulangi.'),
            },
        );
    };

    const declineInvitation = () => {
        router.patch(
            CandidateAiInterviewController.decline.url(session.id),
            {},
            {
                preserveScroll: true,
                onError: () => toast.error('Gagal menolak undangan. Coba refresh halaman dan ulangi.'),
            },
        );
    };

    const requestReschedule = () => {
        rescheduleForm.patch(
            CandidateAiInterviewController.reschedule.url(session.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    rescheduleForm.reset();
                    toast.success(
                        t('candidate.ai_interview_show.reschedule_sent'),
                    );
                },
                onError: () => {
                    toast.error(
                        'Gagal mengirim permintaan reschedule. Periksa detail dan coba lagi.',
                    );
                },
            },
        );
    };

    const startBackendSession = () => {
        router.patch(
            CandidateAiInterviewController.start.url(session.id),
            {
                interview_language: interviewLanguage,
            },
            {
                preserveScroll: true,
                onError: () =>
                    toast.error('Gagal memulai sesi. Coba refresh halaman dan ulangi.'),
            },
        );
    };

    // Fire-and-forget diagnostic logging to the server so voice/WebRTC issues can
    // be debugged from the Laravel log without needing the user's browser console.
    const logVoiceEvent = (event: string, detail?: Record<string, unknown>) => {
        try {
            void fetch(CandidateAiInterviewController.voiceLog.url(session.id), {
                method: 'POST',
                body: JSON.stringify({ event, detail: detail ?? {} }),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                credentials: 'same-origin',
                keepalive: true,
            }).catch(() => {});
        } catch {
            // Never let logging break the interview flow.
        }
    };

    const connectRealtime = async () => {
        if (!isVoiceInterview) {
            toast.warning('Sesi ini menggunakan mode teks.');

            return;
        }

        if (!consented) {
            toast.warning(
                t('candidate.ai_interview_show.check_consent_before_start'),
            );

            return;
        }

        if (connected || connecting) {
            return;
        }

        setConnecting(true);
        setElapsedSeconds(0);
        hasAutoSubmittedRef.current = false;
        setHasQuestionStarted(false);
        setActiveAiQuestionText(null);
        startBackendSession();
        logVoiceEvent('connect_start', { language: interviewLanguage });

        try {
            const cachedSecret = prewarmedSecretRef.current;
            const canUseCachedSecret =
                cachedSecret !== null &&
                cachedSecret.language === interviewLanguage &&
                cachedSecret.expiresAt > Date.now();

            let secretPayload: {
                client_secret?: string;
                model?: string;
                message?: string;
            };

            if (canUseCachedSecret) {
                secretPayload = {
                    client_secret: cachedSecret!.secret,
                    model: cachedSecret!.model,
                };
                prewarmedSecretRef.current = null;
            } else {
                if (prewarmInFlightRef.current) {
                    await prewarmInFlightRef.current;
                }

                const freshCached = prewarmedSecretRef.current;

                if (
                    freshCached &&
                    freshCached.language === interviewLanguage &&
                    freshCached.expiresAt > Date.now()
                ) {
                    secretPayload = {
                        client_secret: freshCached.secret,
                        model: freshCached.model,
                    };
                    prewarmedSecretRef.current = null;
                } else {
                    const secretResponse = await fetch(
                        CandidateAiInterviewController.clientSecret.url(
                            session.id,
                        ),
                        {
                            method: 'POST',
                            body: JSON.stringify({
                                interview_language: interviewLanguage,
                            }),
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                'X-XSRF-TOKEN': csrfToken(),
                            },
                            credentials: 'same-origin',
                        },
                    );

                    secretPayload = await secretResponse.json();

                    if (!secretResponse.ok || !secretPayload.client_secret) {
                        throw new Error(
                            secretPayload.message ??
                                'Token voice AI belum bisa dibuat.',
                        );
                    }
                }
            }

            if (!secretPayload.client_secret) {
                throw new Error(
                    secretPayload.message ??
                        'Token voice AI belum bisa dibuat.',
                );
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });
            localStreamRef.current = stream;
            setMicPermission('granted');
            setMicrophoneDetected(true);
            startMicLevelMonitor(stream);

            const peerConnection = new RTCPeerConnection({
                iceServers: ICE_SERVERS,
                bundlePolicy: 'max-bundle',
                iceTransportPolicy: 'all', // Allow both relay and direct connections
                rtcpMuxPolicy: 'require', // Reduce overhead
            });
            peerConnectionRef.current = peerConnection;
            lastInboundAudioStatsRef.current = null;

            peerConnection.ontrack = (event) => {
                remoteStreamRef.current = event.streams[0] ?? null;
                attachRemoteAudio();
            };

            // Monitor overall connection state for complete failures
            peerConnection.onconnectionstatechange = () => {
                const state = peerConnection.connectionState;
                console.debug('[Voice AI] Connection state:', state);
                logVoiceEvent('connection_state', {
                    state,
                    dataChannel: dataChannelRef.current?.readyState ?? null,
                });

                if (state === 'failed' || state === 'disconnected') {
                    console.error('[Voice AI] Connection failed/disconnected:', state);
                    toast.error('Koneksi voice AI terputus. Periksa koneksi internet dan coba lagi.');
                    stopRealtime();
                }
            };

            // Auto recovery: network blip (WiFi handoff, 4G fluctuation) bikin ICE
            // sebentar disconnected. Browser akan reconnect sendiri kalau punya
            // STUN/host candidates valid. Kalau gagal pulih dalam 5 detik, kita
            // coba restartIce. Kalau masih gagal dalam 10 detik, surface warning.
            let iceRecoveryTimer: number | null = null;
            let iceFailureTimer: number | null = null;
            peerConnection.oniceconnectionstatechange = () => {
                const state = peerConnection.iceConnectionState;

                if (state === 'disconnected') {
                    if (iceRecoveryTimer === null) {
                        iceRecoveryTimer = window.setTimeout(() => {
                            iceRecoveryTimer = null;

                            if (
                                peerConnectionRef.current === peerConnection &&
                                (peerConnection.iceConnectionState ===
                                    'disconnected' ||
                                    peerConnection.iceConnectionState ===
                                        'failed')
                            ) {
                                try {
                                    console.warn('[Voice AI] Attempting ICE restart');
                                    peerConnection.restartIce();
                                } catch (error) {
                                    console.error(
                                        '[Voice AI] restartIce failed',
                                        error,
                                    );
                                }
                            }
                        }, 5000);
                    }

                    return;
                }

                if (state === 'failed') {
                    if (iceFailureTimer === null) {
                        iceFailureTimer = window.setTimeout(() => {
                            iceFailureTimer = null;

                            if (
                                peerConnectionRef.current === peerConnection &&
                                peerConnection.iceConnectionState === 'failed'
                            ) {
                                toast.error(
                                    'Koneksi voice AI terputus. Coba pindah ke jaringan yang lebih stabil lalu mulai ulang.',
                                );
                            }
                        }, 10000);
                    }

                    return;
                }

                // Clear timers on successful states
                if (iceRecoveryTimer !== null) {
                    window.clearTimeout(iceRecoveryTimer);
                    iceRecoveryTimer = null;
                }

                if (iceFailureTimer !== null) {
                    window.clearTimeout(iceFailureTimer);
                    iceFailureTimer = null;
                }
            };

            stream.getTracks().forEach((track) => {
                if (track.kind === 'audio') {
                    // Prefer OPUS codec for better audio quality
                    const sender = peerConnection.addTrack(track, stream);
                    const params = sender.getParameters();
                    if (params.encodings) {
                        params.encodings.forEach((encoding) => {
                            encoding.scaleResolutionDownBy = 1;
                        });
                    }
                    void sender.setParameters(params);
                } else {
                    peerConnection.addTrack(track, stream);
                }
            });

            // Mulai dengan mic disable — AI bicara greeting+Q1 dulu, baru
            // dibuka saat response.done.
            const audioTrack = stream.getAudioTracks()[0];

            if (audioTrack) {
                audioTrack.enabled = false;

                // Apply echo cancellation and noise suppression if supported
                const settings = audioTrack.getSettings();
                if (settings.echoCancellation !== undefined) {
                    void audioTrack.applyConstraints({
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }).catch((err) => {
                        console.warn('[Voice AI] Failed to apply audio constraints:', err);
                    });
                }
            }

            const dataChannel =
                peerConnection.createDataChannel('karivia-events');
            dataChannelRef.current = dataChannel;
            dataChannel.onopen = () => {
                console.debug('[Voice AI] Data channel open');
                logVoiceEvent('datachannel_open');

                if (greetingPendingRef.current) {
                    greetingPendingRef.current = false;
                    sendGreeting();
                }
            };
            dataChannel.onmessage = (event) => {
                handleRealtimeEvent(String(event.data));
            };
            dataChannel.onclose = () => {
                console.warn('[Voice AI] Data channel closed unexpectedly');
                toast.warning('Koneksi data AI terputus. Memulai ulang...');
                // Attempt to reconnect if still connected via WebRTC
                if (peerConnection.connectionState === 'connected') {
                    try {
                        stopRealtime();
                        void connectRealtime();
                    } catch (error) {
                        console.error('[Voice AI] Reconnect failed', error);
                    }
                }
            };
            dataChannel.onerror = (error) => {
                console.error('[Voice AI] Data channel error', error);
                logVoiceEvent('datachannel_error');
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            const sdpResponse = await fetch(
                'https://api.openai.com/v1/realtime/calls',
                {
                    method: 'POST',
                    body: offer.sdp,
                    headers: {
                        Authorization: `Bearer ${secretPayload.client_secret}`,
                        'Content-Type': 'application/sdp',
                    },
                },
            );

            if (!sdpResponse.ok) {
                throw new Error('Koneksi WebRTC OpenAI gagal dibuat.');
            }

            await peerConnection.setRemoteDescription({
                type: 'answer',
                sdp: await sdpResponse.text(),
            });

            setConnected(true);
            startConnectionMonitor();
            startRecording();
            toast.success('Voice AI terhubung.');
            setVoiceFailureCount(0);
            setShowFallbackOption(false);
            logVoiceEvent('sdp_connected');
        } catch (error) {
            logVoiceEvent('connect_error', {
                message: error instanceof Error ? error.message : String(error),
            });
            setVoiceFailureCount((prev) => prev + 1);

            if (voiceFailureCount >= 2) {
                setShowFallbackOption(true);
                toast.error(
                    'Voice AI gagal terhubung. Coba mode teks sebagai alternatif.',
                );
            } else {
                toast.error(
                    error instanceof Error
                        ? error.message
                        : 'Gagal menghubungkan voice AI.',
                );
            }
            stopRealtime();
        } finally {
            setConnecting(false);
        }
    };

    const sendGreeting = () => {
        if (hasSentGreetingRef.current) {
            return;
        }

        hasSentGreetingRef.current = true;

        // User-gesture-bound: prime audio playback FIRST to bypass autoplay throttling.
        // Must happen before any async work to preserve the gesture activation.
        if (remoteAudioRef.current) {
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current.volume = 1;

            if (remoteStreamRef.current) {
                remoteAudioRef.current.srcObject = remoteStreamRef.current;
            }

            const playResult = remoteAudioRef.current.play();

            if (playResult && typeof playResult.then === 'function') {
                playResult.catch((err) => {
                    console.warn('Voice AI: audio playback blocked', err);
                    toast.error(
                        'Suara AI diblokir browser. Klik area mana saja di halaman lalu klik Sapa lagi.',
                    );
                });
            }
        }

        const channel = dataChannelRef.current;

        if (!channel || channel.readyState !== 'open') {
            // Reset guard supaya saat channel open nanti, sendGreeting bisa run.
            hasSentGreetingRef.current = false;
            greetingPendingRef.current = true;
            toast.info('Menyiapkan koneksi AI, sapaan akan dimulai...');

            // Jangan cuma andalkan event onopen — ada kasus event itu kelewat
            // (race) padahal channel sudah/akan terbuka. Poll readyState langsung
            // supaya sapaan tetap jalan begitu channel siap, dan gagal jelas
            // (bukan diam) kalau channel tak kunjung terbuka.
            const startedAt = Date.now();
            const poll = window.setInterval(() => {
                const liveChannel = dataChannelRef.current;

                if (!greetingPendingRef.current) {
                    window.clearInterval(poll);

                    return;
                }

                if (liveChannel && liveChannel.readyState === 'open') {
                    window.clearInterval(poll);
                    greetingPendingRef.current = false;
                    sendGreeting();

                    return;
                }

                if (Date.now() - startedAt >= 10000) {
                    window.clearInterval(poll);
                    greetingPendingRef.current = false;
                    logVoiceEvent('greeting_timeout', {
                        browser,
                        dataChannel: liveChannel?.readyState ?? null,
                        connection:
                            peerConnectionRef.current?.connectionState ?? null,
                        ice:
                            peerConnectionRef.current?.iceConnectionState ??
                            null,
                    });
                    toast.error(
                        browser === 'firefox' ||
                            !(
                                browser === 'chrome' ||
                                browser === 'edge' ||
                                browser === 'brave'
                            )
                            ? 'Voice AI gagal terhubung di browser ini. Buka sesi di Google Chrome/Edge/Brave, atau gunakan mode teks.'
                            : 'Koneksi data AI gagal terbuka. Klik "Akhiri Sesi" lalu mulai ulang, atau coba jaringan lain.',
                    );
                }
            }, 300);

            return;
        }

        const kickoffInstruction =
            interviewLanguage === 'en'
                ? `The candidate has joined and is ready. Greet them now using exactly: "${session.ai_intro.greeting}" — then immediately ask Q1 prefixed with "Q1:".`
                : `Kandidat sudah bergabung dan siap memulai. Sapa kandidat sekarang menggunakan tepat kalimat: "${session.ai_intro.greeting}" — lalu langsung tanyakan Q1 yang diawali "Q1:".`;

        // Inject a system-style nudge as a user message in the conversation,
        // then trigger response generation. This is the canonical gpt-realtime
        // pattern (replacing the legacy response.create with `instructions` param).
        channel.send(
            JSON.stringify({
                type: 'conversation.item.create',
                item: {
                    type: 'message',
                    role: 'user',
                    content: [
                        {
                            type: 'input_text',
                            text: kickoffInstruction,
                        },
                    ],
                },
            }),
        );

        channel.send(
            JSON.stringify({
                type: 'response.create',
            }),
        );

        setHasSentGreeting(true);
        setTurnState('ai-thinking');
        applyMicGate(true);
        logVoiceEvent('greeting_sent');
    };

    const advanceToNextQuestion = () => {
        // Defensive: jangan trigger response.create kalau AI lagi bicara/memproses.
        const currentTurn = turnStateRef.current;

        if (currentTurn === 'ai-talking' || currentTurn === 'ai-thinking') {
            return;
        }

        setCurrentQuestion((current) => {
            const next = Math.min(current + 1, session.questions.length - 1);

            if (next > current) {
                const nextQuestion = session.questions[next];
                const channel = dataChannelRef.current;

                if (channel && channel.readyState === 'open') {
                    const instruction =
                        interviewLanguage === 'en'
                            ? `The candidate has indicated they are ready to move on. Please skip the current question and proceed directly to Q${next + 1}: "${nextQuestion?.question ?? ''}". Prefix it with "Q${next + 1}" as instructed.`
                            : `Kandidat telah menandakan ingin melanjutkan. Lewati pertanyaan saat ini dan langsung tanyakan Q${next + 1}: "${nextQuestion?.question ?? ''}". Awali dengan "Q${next + 1}" sesuai instruksi.`;

                    channel.send(
                        JSON.stringify({
                            type: 'conversation.item.create',
                            item: {
                                type: 'message',
                                role: 'user',
                                content: [
                                    {
                                        type: 'input_text',
                                        text: instruction,
                                    },
                                ],
                            },
                        }),
                    );
                    clearAutoAdvanceTimers();
                    channel.send(
                        JSON.stringify({
                            type: 'response.create',
                        }),
                    );
                    setTurnState('ai-thinking');
                    applyMicGate(true);
                }
            }

            return next;
        });
    };

    const stopRealtime = () => {
        stopConnectionMonitor();
        stopMicLevelMonitor();
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        dataChannelRef.current = null;
        lastInboundAudioStatsRef.current = null;
        lastResponseDoneAtRef.current = 0;
        lastValidQuestionIndexRef.current = 0;
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        remoteAudioRef.current?.pause();

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }

        remoteStreamRef.current = null;
        setConnected(false);
        setHasSentGreeting(false);
        hasSentGreetingRef.current = false;
        greetingPendingRef.current = false;
        setSignalQuality(networkOnline ? 'good' : 'offline');
        setMuted(false);
        userMutedRef.current = false;
        setHasQuestionStarted(false);
        setActiveAiQuestionText(null);
        clearAutoAdvanceTimers();
        setTurnState('ai-talking');
    };

    const toggleMute = () => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];

        if (!audioTrack) {
            return;
        }

        const nextMuted = !userMutedRef.current;
        userMutedRef.current = nextMuted;
        setMuted(nextMuted);

        const aiSpeaking =
            turnStateRef.current === 'ai-talking' ||
            turnStateRef.current === 'ai-thinking';
        audioTrack.enabled = !nextMuted && !aiSpeaking;
    };

    const togglePause = () => {
        if (isPaused) {
            // Resume
            setIsPaused(false);
            toast.info('Interview dilanjutkan.');
        } else {
            // Pause
            setIsPaused(true);
            clearAutoAdvanceTimers();
            toast.info('Interview dijeda. Klik lanjutkan saat siap.');
        }
    };

    const calculateSimilarity = (str1: string, str2: string): number => {
        if (!str1 || !str2) return 0;

        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);

        if (words1.length === 0 || words2.length === 0) return 0;

        const set1 = new Set(words1);
        const set2 = new Set(words2);

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    };

    const updateSpeechAnalytics = () => {
        const totalDurationMs = totalSpeechDurationRef.current;
        const totalDurationMinutes = totalDurationMs / 60000;
        const wordsPerMinute = totalDurationMinutes > 0
            ? Math.round(wordCountRef.current / totalDurationMinutes)
            : 0;

        // Count filler words from transcript
        const fillerWords = ['um', 'uh', 'eh', 'mm', 'ehm', 'an', 'kan', 'sih', 'ya', 'eh'];
        const transcriptText = transcript
            .filter(item => item.speaker === 'Kandidat')
            .map(item => item.text.toLowerCase())
            .join(' ');
        const fillerCount = fillerWords.reduce((count, word) => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = transcriptText.match(regex);
            return count + (matches ? matches.length : 0);
        }, 0);

        setSpeechAnalytics({
            totalSpeechDuration: totalDurationMs,
            averageSpeechSpeed: wordsPerMinute,
            pauseCount: transcript.filter(item => item.speaker === 'Kandidat').length,
            fillerWordCount: fillerCount,
        });
    };

    const submitInterview = async () => {
        if (autoSubmitTimeoutRef.current !== null) {
            window.clearTimeout(autoSubmitTimeoutRef.current);
            autoSubmitTimeoutRef.current = null;
        }

        setTimerExpiryNoticeVisible(false);

        // Show review modal before actual submit
        setShowReviewModal(true);
    };

    const confirmSubmitInterview = async () => {
        setShowReviewModal(false);

        const recordingBlob = await finalizeRecording();
        stopRealtime();

        if (recordingBlob && recordingBlob.size > 0) {
            const uploadingToastId = toast.loading(
                t('candidate.ai_interview_show.uploading_recording'),
            );

            try {
                await uploadRecording(recordingBlob);
                toast.success(
                    t('candidate.ai_interview_show.recording_saved'),
                    {
                        id: uploadingToastId,
                    },
                );
            } catch {
                toast.error(
                    'Rekaman gagal diunggah, namun jawaban tetap akan dikirim.',
                    { id: uploadingToastId },
                );
            }
        }

        form.transform((data) => ({
            ...data,
            live_transcript: transcript
                .map((item) => `${item.speaker}: ${item.text}`)
                .join('\n'),
        }));
        form.patch(CandidateAiInterviewController.answer.url(session.id), {
            preserveScroll: true,
            onError: () =>
                toast.error(
                    t('candidate.ai_interview_show.check_answers_again'),
                ),
        });
    };

    submitInterviewRef.current = submitInterview;

    const submitAnswers = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submitInterview();
    };

    const clearAutoAdvanceTimers = () => {
        if (silenceTimerRef.current !== null) {
            window.clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (countdownIntervalRef.current !== null) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        setAutoAdvanceRemaining(null);
    };

    const turnStateRef = useRef(turnState);
    turnStateRef.current = turnState;

    // Kontrol mic langsung di sisi WebRTC track. Saat AI bicara, mic kandidat
    // di-disable supaya audio AI tidak balik ke OpenAI lewat echo (penyebab
    // utama AI ke-cancel & restart Q1 sendiri).
    const applyMicGate = (aiSpeaking: boolean) => {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];

        if (!audioTrack) {
            return;
        }

        audioTrack.enabled = !userMutedRef.current && !aiSpeaking;
    };

    const requestAiResponse = () => {
        const channel = dataChannelRef.current;

        if (!channel || channel.readyState !== 'open') {
            return;
        }

        // Defensive: jangan kirim response.create saat AI lagi bicara/memproses.
        const current = turnStateRef.current;

        if (current === 'ai-talking' || current === 'ai-thinking') {
            return;
        }

        channel.send(JSON.stringify({ type: 'response.create' }));
        clearAutoAdvanceTimers();
        setTurnState('ai-thinking');
        applyMicGate(true);
    };

    const startAutoAdvanceTimers = () => {
        clearAutoAdvanceTimers();

        silenceTimerRef.current = window.setTimeout(() => {
            silenceTimerRef.current = null;

            // State berubah saat kita menunggu? Batal.
            const current = turnStateRef.current;

            if (current !== 'user-paused' && current !== 'user-answering') {
                return;
            }

            setAutoAdvanceRemaining(AUTO_ADVANCE_COUNTDOWN_S);

            let remaining = AUTO_ADVANCE_COUNTDOWN_S;
            countdownIntervalRef.current = window.setInterval(() => {
                remaining -= 1;

                const stillIdle = turnStateRef.current === 'user-paused';

                if (!stillIdle) {
                    if (countdownIntervalRef.current !== null) {
                        window.clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = null;
                    }

                    setAutoAdvanceRemaining(null);

                    return;
                }

                if (remaining <= 0) {
                    if (countdownIntervalRef.current !== null) {
                        window.clearInterval(countdownIntervalRef.current);
                        countdownIntervalRef.current = null;
                    }

                    setAutoAdvanceRemaining(null);

                    // Hanya auto-advance jika ada transkripsi valid (user benar-benar menjawab)
                    if (hasValidTranscriptRef.current) {
                        requestAiResponse();
                    } else {
                        console.debug('[Voice AI] No valid transcript, skipping auto-advance');
                        toast.info('Tidak terdeteksi jawaban. Silakan jawab atau klik "Lanjut".');
                    }
                } else {
                    setAutoAdvanceRemaining(remaining);
                }
            }, 1_000);
        }, SILENCE_BEFORE_COUNTDOWN_MS);
    };

    const handleUserDone = () => {
        const channel = dataChannelRef.current;

        if (!channel || channel.readyState !== 'open') {
            toast.warning('Koneksi AI belum siap. Tunggu sebentar...');

            return;
        }

        if (turnState === 'ai-talking' || turnState === 'ai-thinking') {
            return;
        }

        requestAiResponse();
    };

    const handleKeepTalking = () => {
        clearAutoAdvanceTimers();
        setTurnState('user-turn');
    };

    const handleRealtimeEvent = (rawEvent: string) => {
        try {
            const event = JSON.parse(rawEvent);

            // Debug: log every realtime event so we can diagnose silent AI.
            console.debug('[Realtime]', event.type, event);

            if (event.type === 'error') {
                const message =
                    event.error?.message ??
                    event.message ??
                    'Unknown realtime error';
                console.error('[Realtime] error event', event);
                toast.error(`AI error: ${message}`);

                return;
            }

            if (event.type === 'response.created') {
                clearAutoAdvanceTimers();
                hasValidTranscriptRef.current = false;
                setTurnState('ai-talking');
                applyMicGate(true);
            }

            if (
                event.type === 'response.done' ||
                event.type === 'response.completed' ||
                event.type === 'response.cancelled' ||
                event.type === 'response.failed'
            ) {
                setTurnState('user-turn');
                lastResponseDoneAtRef.current = Date.now();
                // Beri jeda lebih lama sebelum buka mic — tail audio AI di
                // speaker bisa berlangsung 1-1.5 detik (terutama Bluetooth /
                // speaker eksternal). Membuka mic terlalu cepat bikin echo
                // bocor & VAD mendeteksinya sebagai user-answering palsu.
                window.setTimeout(() => applyMicGate(false), 1200);
            }

            // VAD events HANYA diproses kalau giliran user. AI yang lagi bicara
            // sering bocor ke mic (echo) dan memicu VAD palsu — abaikan.
            // Plus filter window 1500ms setelah AI done: VAD trigger dalam window
            // tsb hampir pasti echo speaker, bukan kandidat (kandidat tidak akan
            // ngomong barengan saat AI baru selesai).
            const ECHO_SUPPRESSION_MS = 1500;
            const sinceAiDone = Date.now() - lastResponseDoneAtRef.current;
            const inEchoWindow =
                lastResponseDoneAtRef.current > 0 &&
                sinceAiDone < ECHO_SUPPRESSION_MS;

            if (event.type === 'input_audio_buffer.speech_started') {
                if (inEchoWindow || isPaused) {
                    return;
                }
                speechStartedAtRef.current = Date.now();
                speechStartTimeRef.current = Date.now(); // Track untuk analytics
                hasValidTranscriptRef.current = false; // Reset untuk jawaban baru
                setTurnState((current) => {
                    if (current === 'ai-talking' || current === 'ai-thinking') {
                        return current;
                    }

                    clearAutoAdvanceTimers();

                    return 'user-answering';
                });
            }

            if (event.type === 'input_audio_buffer.speech_stopped') {
                if (inEchoWindow) {
                    return;
                }

                // Cek durasi speech - abaikan jika terlalu pendek (batuk, noise)
                const speechDuration = Date.now() - speechStartedAtRef.current;
                if (speechDuration < MIN_SPEECH_DURATION_MS) {
                    console.debug('[Voice AI] Ignoring short speech:', speechDuration, 'ms');
                    recentShortSpeechCountRef.current += 1;

                    // Jika terlalu banyak speech pendek berulang, disable auto-advance sementara
                    if (recentShortSpeechCountRef.current >= 3) {
                        console.warn('[Voice AI] Too many short speeches, disabling auto-advance');
                        clearAutoAdvanceTimers();
                        toast.warning('Terlalu banyak noise. Tekan tombol "Lanjut" saat selesai menjawab.');
                        recentShortSpeechCountRef.current = 0;
                    }

                    return;
                }

                // Reset counter jika speech valid
                recentShortSpeechCountRef.current = 0;

                // Update analytics: track speech duration
                totalSpeechDurationRef.current += speechDuration;

                // Jika speech duration cukup panjang (> 5 detik), mark sebagai valid meskipun transkrip di-skip
                // Ini untuk fallback agar interview tidak stuck jika transkrip di-filter
                if (speechDuration > 5000) {
                    console.log('[Voice AI] Long speech detected, marking as valid despite transcript filter');
                    hasValidTranscriptRef.current = true;
                }

                setTurnState((current) => {
                    if (current !== 'user-answering') {
                        return current;
                    }

                    setTurnState('user-paused');
                    startAutoAdvanceTimers();

                    return 'user-paused';
                });
            }

            // Handle both old and new transcript event names.
            if (
                (event.type === 'response.output_audio_transcript.done' ||
                    event.type === 'response.audio_transcript.done') &&
                event.transcript
            ) {
                appendTranscript('AI', event.transcript);
            }

            if (
                event.type ===
                    'conversation.item.input_audio_transcription.completed' &&
                event.transcript
            ) {
                const transcriptText = event.transcript.trim();

                // Debug log untuk investigasi transcription ngaco
                console.log('[Transcription] User transcript:', transcriptText);
                console.log('[Transcription] Echo window:', inEchoWindow);
                console.log('[Transcription] Time since AI done:', Date.now() - lastResponseDoneAtRef.current);

                // Filter transkrip yang jelas-jelas echo dari AI (cocok dengan transcript AI terakhir)
                const lastAiTranscript = transcript
                    .filter(item => item.speaker === 'AI')
                    .slice(-1)[0]?.text.toLowerCase() || '';
                const transcriptLower = transcriptText.toLowerCase();

                // Jika transkrip user SANGAT mirip dengan AI transcript (lebih dari 80% match), skip
                // Threshold dinaikkan dari 0.5 ke 0.8 agar tidak terlalu strict
                if (lastAiTranscript.length > 0) {
                    const similarity = calculateSimilarity(transcriptLower, lastAiTranscript);
                    if (similarity > 0.8) {
                        console.warn('[Transcription] Skipping echo transcript, similarity:', similarity);
                        return;
                    }
                }

                // Hanya skip jika masih dalam echo window DAN transkrip sangat pendek (< 3 kata)
                // Ini untuk mengizinkan transkrip valid yang datang sedikit setelah AI selesai
                if (inEchoWindow && transcriptText.split(/\s+/).length < 3) {
                    console.warn('[Transcription] Skipping short transcript in echo window');
                    return;
                }

                hasValidTranscriptRef.current = true;
                appendTranscript('Kandidat', transcriptText);

                // Track word count for analytics
                const words = transcriptText.split(/\s+/).filter((w: string) => w.length > 0);
                wordCountRef.current += words.length;
            }
        } catch (err) {
            console.warn('[Realtime] failed to parse event', err, rawEvent);
        }
    };

    const appendTranscript = (
        speaker: TranscriptItem['speaker'],
        text: string,
    ) => {
        setTranscript((items) => [...items, { speaker, text }]);

        if (speaker !== 'AI') {
            return;
        }

        const trimmedText = text.trim();
        const questionNumberMatch = text.match(/\bQ\s*(\d+)\b/i);

        if (questionNumberMatch) {
            const questionIndex = Number(questionNumberMatch[1]) - 1;

            if (
                questionIndex >= 0 &&
                questionIndex < session.questions.length
            ) {
                // Hanya update jika question index valid dan tidak mundur dari last valid
                const lastValid = lastValidQuestionIndexRef.current;
                if (questionIndex >= lastValid) {
                    lastValidQuestionIndexRef.current = questionIndex;
                    setHasQuestionStarted(true);
                    setActiveAiQuestionText(
                        trimmedText.replace(/\bQ\s*\d+\s*[:-]?\s*/i, ''),
                    );
                    setCurrentQuestion((current) =>
                        questionIndex > current ? questionIndex : current,
                    );
                }

                return;
            }
        }

        if (trimmedText.length > 8) {
            setHasQuestionStarted(true);
            setActiveAiQuestionText(trimmedText);
        }

        const normalizedLine = normalizeQuestionText(text);

        if (normalizedLine.length < 12) {
            return;
        }

        const matchedQuestion = normalizedQuestionMap.find(
            (question) =>
                normalizedLine.includes(question.normalized.slice(0, 24)) ||
                question.normalized.includes(normalizedLine.slice(0, 24)),
        );

        if (matchedQuestion) {
            // Hanya update jika matched index tidak mundur dari last valid
            const lastValid = lastValidQuestionIndexRef.current;
            if (matchedQuestion.index >= lastValid) {
                lastValidQuestionIndexRef.current = matchedQuestion.index;
                setHasQuestionStarted(true);
                setCurrentQuestion((current) =>
                    matchedQuestion.index > current
                        ? matchedQuestion.index
                        : current,
                );
            }
        }
    };

    if (invitationPending) {
        return (
            <InterviewInvitation
                session={session}
                isVoiceInterview={isVoiceInterview}
                onConfirm={confirmInvitation}
                onDecline={declineInvitation}
                rescheduleData={rescheduleForm.data}
                rescheduleErrors={
                    rescheduleForm.errors as Record<string, string>
                }
                rescheduleProcessing={rescheduleForm.processing}
                onRescheduleChange={(field, value) =>
                    rescheduleForm.setData(field, value)
                }
                onReschedule={requestReschedule}
            />
        );
    }

    if (session.status === 'completed') {
        return <CompletedInterviewState session={session} />;
    }

    if (connected && isVoiceInterview) {
        return (
            <>
                <ActiveVoiceSession
                    session={session}
                    activeQuestion={activeQuestion}
                    currentQuestion={currentQuestion}
                    remainingSeconds={remainingSeconds}
                    interviewDurationSeconds={interviewDurationSeconds}
                    transcript={transcript}
                    hasQuestionStarted={hasQuestionStarted}
                    hasSentGreeting={hasSentGreeting}
                    activeAiQuestionText={activeAiQuestionText}
                    timerExpiryNoticeVisible={timerExpiryNoticeVisible}
                    muted={muted}
                    formProcessing={form.processing}
                    onNext={() => advanceToNextQuestion()}
                    onMute={toggleMute}
                    onStop={stopRealtime}
                    onGreet={sendGreeting}
                    onSubmit={submitInterview}
                    onUserDone={handleUserDone}
                    onKeepTalking={handleKeepTalking}
                    onPause={togglePause}
                    isPaused={isPaused}
                    speechAnalytics={speechAnalytics}
                    turnState={turnState}
                    autoAdvanceRemaining={autoAdvanceRemaining}
                    remoteAudioRef={remoteAudioRef}
                    signalQuality={signalQuality}
                    connectionHealth={connectionHealth}
                    cameraStream={cameraStream}
                    isPractice={isPractice}
                />
                <ReviewModal
                    show={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onConfirm={confirmSubmitInterview}
                    questions={session.questions}
                    answers={form.data.answers}
                    processing={form.processing}
                />
            </>
        );
    }

    return (
        <>
            <Head title={t('candidate.ai_interview_show.preparation_title')} />
            {questionsPreparing && <QuestionsPreparingOverlay />}
            <ReviewModal
                show={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onConfirm={confirmSubmitInterview}
                questions={session.questions}
                answers={form.data.answers}
                processing={form.processing}
            />
            <div className="min-h-screen bg-slate-50">
                {/* Hero header */}
                <div className="relative overflow-hidden bg-linear-to-br from-[#01296A] via-[#013580] to-[#01296A] px-4 pt-8 pb-8 md:px-8 md:pt-10 md:pb-10 lg:px-12">
                    <div
                        className="pointer-events-none absolute inset-0 opacity-20"
                        style={{
                            backgroundImage:
                                'radial-gradient(ellipse at 90% 0%, #4f9fff 0%, transparent 55%), radial-gradient(ellipse at 0% 100%, #1e5bbb 0%, transparent 50%)',
                        }}
                    />
                    <div className="relative mx-auto max-w-5xl">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-widest text-white/90 ring-1 ring-white/20">
                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                {t('candidate.ai_interview_show.ai_interview')}
                            </span>
                            {session.company && (
                                <span className="text-sm text-white/50">
                                    {session.company}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl lg:text-4xl">
                            {session.job_title ??
                                t(
                                    'candidate.ai_interview_show.preparation_title',
                                )}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1.5 text-sm text-white/60">
                                <Clock3 className="size-3.5 text-white/40" />
                                {session.duration_minutes ?? 30} menit
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-white/60">
                                {isVoiceInterview ? (
                                    <Mic className="size-3.5 text-white/40" />
                                ) : (
                                    <Bot className="size-3.5 text-white/40" />
                                )}
                                {isVoiceInterview
                                    ? t('candidate.ai_interview_show.voice_ai')
                                    : t('candidate.ai_interview_show.text_ai')}
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-white/60">
                                <ListChecks className="size-3.5 text-white/40" />
                                {t(
                                    'candidate.ai_interview_show.questions_count',
                                    { count: session.questions.length },
                                )}
                            </span>
                        </div>
                        <p className="mt-3 text-sm text-white/50">
                            {t(
                                'candidate.ai_interview_show.ensure_devices_ready',
                            )}
                        </p>
                    </div>
                </div>

                {/* Main content */}
                <div className="px-4 py-6 md:px-8 md:py-7 lg:px-12">
                    <div className="mx-auto max-w-5xl">
                        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                            {/* Left column */}
                            <div className="order-last space-y-4 lg:order-first">
                                {/* Device checks — compact horizontal bar */}
                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                    <div className="flex flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3">
                                        <span className="mr-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            Status
                                        </span>
                                        <DeviceStatusPill
                                            icon={Video}
                                            label={t(
                                                'candidate.ai_interview_show.camera',
                                            )}
                                            tone={
                                                cameraStreamActive
                                                    ? 'green'
                                                    : cameraDetected === null
                                                      ? 'orange'
                                                      : cameraDetected
                                                        ? 'orange'
                                                        : 'red'
                                            }
                                            value={
                                                cameraStreamActive
                                                    ? 'Aktif'
                                                    : cameraDetected === null
                                                      ? 'Memeriksa'
                                                      : cameraDetected
                                                        ? 'Terdeteksi'
                                                        : 'Tidak Ditemukan'
                                            }
                                        />
                                        <DeviceStatusPill
                                            icon={Mic}
                                            label={t(
                                                'candidate.ai_interview_show.microphone',
                                            )}
                                            tone={
                                                micPermission === 'denied'
                                                    ? 'red'
                                                    : microphoneDetected ===
                                                            true ||
                                                        micPermission ===
                                                            'granted'
                                                      ? 'green'
                                                      : 'orange'
                                            }
                                            value={
                                                micPermission === 'granted'
                                                    ? micLevel > 10
                                                        ? 'Aktif'
                                                        : 'Terhubung'
                                                    : micPermission === 'denied'
                                                      ? 'Diblokir'
                                                      : microphoneDetected ===
                                                          null
                                                        ? 'Memeriksa'
                                                        : microphoneDetected
                                                          ? 'Terdeteksi'
                                                          : 'Tidak Ditemukan'
                                            }
                                        />
                                        {micPermission === 'granted' && waveformData.length > 0 && (
                                            <div className="flex items-end gap-0.5 h-4">
                                                {waveformData.map((value, index) => (
                                                    <div
                                                        key={index}
                                                        className="w-1 bg-primary-500 rounded-full transition-all duration-75"
                                                        style={{
                                                            height: `${Math.max(4, value * 100)}%`,
                                                            opacity: value > 0.1 ? 1 : 0.3,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <DeviceStatusPill
                                            icon={Radio}
                                            label={t(
                                                'candidate.ai_interview_show.internet',
                                            )}
                                            tone={
                                                networkOnline ? 'green' : 'red'
                                            }
                                            value={
                                                networkOnline
                                                    ? 'Terhubung'
                                                    : 'Offline'
                                            }
                                        />
                                        <DeviceStatusPill
                                            icon={Signal}
                                            label={t(
                                                'candidate.ai_interview_show.signal',
                                            )}
                                            tone={
                                                signalQuality === 'excellent' ||
                                                signalQuality === 'good'
                                                    ? 'green'
                                                    : signalQuality ===
                                                        'offline'
                                                      ? 'red'
                                                      : 'orange'
                                            }
                                            value={
                                                signalQualityConfig(
                                                    signalQuality,
                                                ).label
                                            }
                                        />
                                        {(connectionHealth.rtt !== null ||
                                            connectionHealth.jitter !== null ||
                                            connectionHealth.packetLoss !== null) && (
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                                {connectionHealth.rtt !== null && (
                                                    <span>
                                                        RTT: {Math.round(connectionHealth.rtt)}ms
                                                    </span>
                                                )}
                                                {connectionHealth.jitter !== null && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            Jitter: {Math.round(connectionHealth.jitter)}ms
                                                        </span>
                                                    </>
                                                )}
                                                {connectionHealth.packetLoss !== null && (
                                                    <>
                                                        <span>•</span>
                                                        <span>
                                                            Loss: {connectionHealth.packetLoss.toFixed(1)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {showFallbackOption && (
                                        <div className="border-t border-amber-100 bg-amber-50/60 px-4 py-3">
                                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-start gap-2.5">
                                                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                                    <div className="text-[13px] leading-relaxed text-amber-900">
                                                        <p className="font-semibold">
                                                            Voice AI tidak dapat terhubung
                                                        </p>
                                                        <p className="text-amber-700/90">
                                                            Koneksi voice AI gagal beberapa kali. Kamu bisa lanjut dengan mode teks sebagai alternatif.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                                                    onClick={() => {
                                                        window.location.href = CandidateAiInterviewController.show.url(session.id) + '?mode=text';
                                                    }}
                                                >
                                                    Gunakan Mode Teks
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {(micPermission === 'denied' ||
                                        micErrorKind === 'not-found' ||
                                        micErrorKind === 'in-use' ||
                                        micErrorKind === 'unsupported' ||
                                        micErrorKind === 'unknown') && (
                                        <div className="border-t border-red-100 bg-red-50/60 px-4 py-3">
                                            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-start gap-2.5">
                                                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
                                                    <div className="text-[13px] leading-relaxed text-red-900">
                                                        <p className="font-semibold">
                                                            {micErrorKind ===
                                                            'not-found'
                                                                ? 'Mikrofon tidak terdeteksi'
                                                                : micErrorKind ===
                                                                    'in-use'
                                                                  ? 'Mikrofon sedang dipakai aplikasi lain'
                                                                  : micErrorKind ===
                                                                      'unsupported'
                                                                    ? 'Browser tidak mendukung akses mikrofon'
                                                                    : micErrorKind ===
                                                                        'system-denied'
                                                                      ? 'Akses mikrofon diblokir oleh sistem operasi'
                                                                      : 'Akses mikrofon diblokir'}
                                                        </p>
                                                        <p className="text-red-700/90">
                                                            {micErrorKind ===
                                                            'not-found'
                                                                ? 'Pastikan perangkat mikrofon kamu sudah terpasang.'
                                                                : micErrorKind ===
                                                                    'in-use'
                                                                  ? 'Tutup aplikasi lain (Zoom, Meet, Discord) yang sedang menggunakan mikrofon.'
                                                                  : micErrorKind ===
                                                                      'unsupported'
                                                                    ? 'Coba pakai browser modern seperti Chrome, Firefox, atau Safari versi terbaru.'
                                                                    : 'Klik tombol di bawah untuk minta izin, atau lihat panduan jika popup tidak muncul.'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => {
                                                            void startMicPreview();
                                                        }}
                                                        disabled={
                                                            micRequesting ||
                                                            micErrorKind ===
                                                                'unsupported'
                                                        }
                                                        className="h-8 gap-1.5 bg-red-600 text-white hover:bg-red-700"
                                                    >
                                                        <Mic className="size-3.5" />
                                                        {micRequesting
                                                            ? 'Meminta…'
                                                            : 'Aktifkan Mikrofon'}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setShowMicHelp(true)
                                                        }
                                                        className="h-8 gap-1.5 border-red-200 bg-white text-red-700 hover:bg-red-50"
                                                    >
                                                        <HelpCircle className="size-3.5" />
                                                        Panduan
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Panduan Wawancara — hanya untuk mode voice */}
                                {isVoiceInterview && (
                                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary-600 to-primary-800 shadow-sm">
                                                <ShieldCheck className="size-4 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {t(
                                                        'candidate.ai_interview_show.interview_guide',
                                                    )}
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    {t(
                                                        'candidate.ai_interview_show.read_before_start',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-5">
                                            {/* AI Greeting */}
                                            <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary-50 to-secondary-50/60 p-4 ring-1 ring-primary-200/60">
                                                <div className="absolute top-3 right-3 opacity-10">
                                                    <Sparkles className="size-12 text-primary-500" />
                                                </div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <div className="flex size-6 items-center justify-center rounded-full bg-primary-100">
                                                        <Bot className="size-3.5 text-primary-600" />
                                                    </div>
                                                    <span className="text-[11px] font-bold tracking-wider text-primary-600 uppercase">
                                                        {t(
                                                            'candidate.ai_interview_show.ai_opening',
                                                        )}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {
                                                        session.ai_intro
                                                            .assistant_name
                                                    }
                                                </p>
                                                <p className="mt-1.5 text-sm leading-6 text-slate-600">
                                                    {session.ai_intro.greeting}
                                                </p>
                                            </div>

                                            {/* Instructions */}
                                            <div className="divide-y divide-gray-100">
                                                <InstructionRow
                                                    icon={Mic}
                                                    title={t(
                                                        'candidate.ai_interview_show.speak_clearly',
                                                    )}
                                                    description={t(
                                                        'candidate.ai_interview_show.speak_clearly_desc',
                                                    )}
                                                />
                                                <InstructionRow
                                                    icon={Clock3}
                                                    title={`Durasi ${session.duration_minutes ?? 30} menit`}
                                                    description={t(
                                                        'candidate.ai_interview_show.duration_desc',
                                                    )}
                                                />
                                                <InstructionRow
                                                    icon={Bot}
                                                    title={t(
                                                        'candidate.ai_interview_show.ai_will_guide',
                                                    )}
                                                    description={t(
                                                        'candidate.ai_interview_show.ai_will_guide_desc',
                                                    )}
                                                />
                                                <InstructionRow
                                                    icon={Info}
                                                    title={`${session.questions.length} pertanyaan tersedia`}
                                                    description={t(
                                                        'candidate.ai_interview_show.answers_recorded_desc',
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isVoiceInterview && (
                                    <AnswerForm
                                        session={session}
                                        isVoiceInterview={false}
                                        form={form}
                                        updateAnswer={updateAnswer}
                                        submitAnswers={submitAnswers}
                                    />
                                )}
                            </div>

                            {/* Sidebar */}
                            <aside className="order-first space-y-4 lg:order-last">
                                {/* Camera preview — recording disabled in simulator/practice mode */}
                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                    <div className="relative aspect-video bg-slate-950">
                                        {cameraStreamActive ? (
                                            <video
                                                ref={cameraPreviewRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="h-full w-full object-cover"
                                                style={{
                                                    transform: 'scaleX(-1)',
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full flex-col items-center justify-center gap-3">
                                                <div className="flex size-14 items-center justify-center rounded-full bg-slate-800/80 ring-1 ring-white/10">
                                                    <VideoOff className="size-6 text-slate-400" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-semibold text-slate-300">
                                                        Kamera belum aktif
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-slate-500">
                                                        Aktifkan untuk
                                                        melanjutkan
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* LIVE badge */}
                                        {cameraStreamActive && (
                                            <div className="absolute top-2.5 left-2.5">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white uppercase backdrop-blur-sm">
                                                    <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                                                    LIVE
                                                </span>
                                            </div>
                                        )}

                                        {/* WAJIB badge saat kamera mati */}
                                        {!cameraStreamActive && (
                                            <div className="absolute top-2.5 right-2.5">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                                                    DIPERLUKAN
                                                </span>
                                            </div>
                                        )}

                                        {/* Candidate name overlay */}
                                        {cameraStreamActive &&
                                            session.candidate_name && (
                                                <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent px-3 py-3">
                                                    <p className="text-xs font-semibold text-white">
                                                        {session.candidate_name}
                                                    </p>
                                                </div>
                                            )}
                                    </div>

                                    <div className="border-t border-gray-100 p-3">
                                        {cameraError ? (
                                            <div className="space-y-2">
                                                <p className="text-xs text-red-600">
                                                    {cameraError}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={startCameraPreview}
                                                >
                                                    <RotateCcw className="size-3.5" />
                                                    Coba Lagi
                                                </Button>
                                            </div>
                                        ) : cameraStreamActive ? (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                                                    <span className="size-2 animate-pulse rounded-full bg-green-500" />
                                                    Kamera aktif
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-xs text-slate-400 transition-colors hover:text-red-500"
                                                    onClick={stopCameraPreview}
                                                >
                                                    Matikan
                                                </button>
                                            </div>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="w-full bg-primary-600 hover:bg-primary-700"
                                                onClick={startCameraPreview}
                                            >
                                                <Video className="size-3.5" />
                                                Aktifkan Kamera
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Candidate + session info */}
                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                    {/* Candidate row */}
                                    <div className="flex items-center gap-3 px-4 py-3.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-sm">
                                            {(session.candidate_name ?? 'K')
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-800">
                                                {session.candidate_name ??
                                                    'Kandidat'}
                                            </p>
                                            {session.candidate_headline && (
                                                <p className="truncate text-xs text-slate-400">
                                                    {session.candidate_headline}
                                                </p>
                                            )}
                                        </div>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                            Siap
                                        </span>
                                    </div>
                                    {/* Durasi + Mode — compact row */}
                                    <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                                        <div className="px-4 py-3">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                {t(
                                                    'candidate.ai_interview_show.duration',
                                                )}
                                            </p>
                                            <p className="mt-0.5 text-lg font-black text-slate-900">
                                                {session.duration_minutes ?? 30}
                                                <span className="ml-1 text-xs font-medium text-slate-400">
                                                    {t(
                                                        'candidate.ai_interview_show.minutes_short',
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="px-4 py-3">
                                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                {t(
                                                    'candidate.ai_interview_show.mode',
                                                )}
                                            </p>
                                            <p className="mt-0.5 text-lg font-black text-slate-900">
                                                {isVoiceInterview
                                                    ? t(
                                                          'candidate.ai_interview_show.voice',
                                                      )
                                                    : t(
                                                          'candidate.ai_interview_show.text',
                                                      )}
                                                <span className="ml-1 text-xs font-medium text-slate-400">
                                                    {t(
                                                        'candidate.ai_interview_show.ai',
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Language picker hidden — auto-detected from user locale (navbar flag). */}

                                {/* Headphones tip — penting biar mic tidak nangkep suara AI sendiri */}
                                {isVoiceInterview && (
                                    <div className="overflow-hidden rounded-2xl border-2 border-amber-200 bg-linear-to-br from-amber-50 to-yellow-50 shadow-sm">
                                        <div className="flex gap-3 p-4">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
                                                <Headphones className="size-5" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-sm font-bold text-amber-900">
                                                    Wajib pakai headphone /
                                                    earphone
                                                </p>
                                                <p className="text-xs leading-5 text-amber-800">
                                                    Tanpa headphone, mikrofon
                                                    kamu akan menangkap suara AI
                                                    dari speaker dan AI bisa
                                                    salah anggap kamu sedang
                                                    menjawab — pertanyaan bisa
                                                    terpotong atau diulang.
                                                </p>
                                                <ul className="ml-4 list-disc space-y-0.5 text-[11px] text-amber-700 marker:text-amber-500">
                                                    <li>
                                                        Earphone kabel paling
                                                        stabil
                                                    </li>
                                                    <li>
                                                        AirPods/headphone
                                                        Bluetooth juga OK,
                                                        pastikan udah ter-pair
                                                    </li>
                                                    <li>
                                                        Hindari pakai speaker
                                                        laptop atau speaker
                                                        eksternal
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Consent + Start */}
                                {isVoiceInterview && (
                                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                        <div className="p-4">
                                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-slate-50 p-3 transition-colors hover:bg-gray-100">
                                                <Checkbox
                                                    checked={consented}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        setConsented(
                                                            checked === true,
                                                        )
                                                    }
                                                    className="mt-0.5"
                                                />
                                                <span className="text-xs leading-5 text-slate-600">
                                                    Saya menyetujui perekaman
                                                    sesi wawancara ini untuk
                                                    keperluan evaluasi.
                                                </span>
                                            </label>
                                        </div>
                                        <div className="border-t border-gray-100 p-3">
                                            <Button
                                                className={cn(
                                                    'w-full gap-2 text-base font-bold shadow-sm',
                                                    consented &&
                                                        (isPractice ||
                                                            cameraStreamActive) &&
                                                        !connecting
                                                        ? 'bg-linear-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800'
                                                        : 'bg-primary-600 hover:bg-primary-700',
                                                )}
                                                size="lg"
                                                disabled={
                                                    !consented ||
                                                    (!isPractice &&
                                                        !cameraStreamActive) ||
                                                    connecting
                                                }
                                                onClick={connectRealtime}
                                            >
                                                {connecting ? (
                                                    <>
                                                        <RotateCcw className="size-4 animate-spin" />
                                                        Menghubungkan...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="size-5" />
                                                        Mulai Wawancara
                                                    </>
                                                )}
                                            </Button>
                                            {(!consented ||
                                                (!isPractice &&
                                                    !cameraStreamActive)) &&
                                                !connecting && (
                                                    <p className="mt-2 text-center text-xs text-slate-400">
                                                        {!isPractice &&
                                                        !cameraStreamActive
                                                            ? 'Aktifkan kamera untuk melanjutkan'
                                                            : 'Centang persetujuan untuk melanjutkan'}
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                )}
                            </aside>
                        </div>
                    </div>
                </div>
            </div>

            <MicHelpDialog
                open={showMicHelp}
                onOpenChange={setShowMicHelp}
                browser={browser}
                errorKind={micErrorKind}
                onRetry={() => {
                    setShowMicHelp(false);
                    void startMicPreview();
                }}
            />
        </>
    );
}

type MicHelpDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    browser: BrowserKind;
    errorKind: MicErrorKind;
    onRetry: () => void;
};

function QuestionsPreparingOverlay() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-7 text-center shadow-2xl">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary-50">
                    <Loader2 className="size-7 animate-spin text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                    Menyiapkan pertanyaan AI…
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    AI sedang menyusun pertanyaan yang disesuaikan dengan
                    profilmu. Biasanya butuh 10–30 detik. Halaman akan otomatis
                    berlanjut saat siap.
                </p>
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-600">
                    <Sparkles className="size-3.5" />
                    Karivia AI Interviewer
                </div>
            </div>
        </div>
    );
}

function MicHelpDialog({
    open,
    onOpenChange,
    browser,
    errorKind,
    onRetry,
}: MicHelpDialogProps) {
    const browserLabel = {
        brave: 'Brave',
        chrome: 'Chrome',
        firefox: 'Firefox',
        safari: 'Safari',
        edge: 'Edge',
        other: 'browser kamu',
    }[browser];

    const browserSteps: Record<BrowserKind, string[]> = {
        brave: [
            'Klik ikon gembok atau ikon Brave (singa) di sebelah kiri alamat URL.',
            'Cari menu "Microphone" atau "Site settings".',
            'Ubah pilihan menjadi "Allow" atau "Ask".',
            'Refresh halaman ini (Cmd/Ctrl + R), lalu klik "Coba Lagi" di bawah.',
        ],
        chrome: [
            'Klik ikon gembok di sebelah kiri alamat URL.',
            'Klik "Site settings".',
            'Pada bagian "Microphone", pilih "Allow".',
            'Refresh halaman (Cmd/Ctrl + R), lalu klik "Coba Lagi".',
        ],
        firefox: [
            'Klik ikon gembok di kiri alamat URL.',
            'Klik tanda "x" di sebelah "Blocked Temporarily" atau "Blocked" untuk mikrofon.',
            'Refresh halaman dan izinkan popup mikrofon saat muncul.',
        ],
        safari: [
            'Buka menu Safari → Settings → tab "Websites".',
            'Pilih "Microphone" di sidebar kiri.',
            'Cari karivia.id di list, ubah menjadi "Allow".',
            'Refresh halaman ini lalu klik "Coba Lagi".',
        ],
        edge: [
            'Klik ikon gembok di sebelah kiri alamat URL.',
            'Klik "Permissions for this site".',
            'Pada "Microphone", pilih "Allow".',
            'Refresh halaman dan klik "Coba Lagi".',
        ],
        other: [
            'Cari ikon gembok atau pengaturan situs di address bar.',
            'Izinkan akses mikrofon untuk karivia.id.',
            'Refresh halaman ini lalu klik "Coba Lagi".',
        ],
    };

    const macSystemSteps = [
        'Buka System Settings (Apple menu → System Settings).',
        'Pilih "Privacy & Security" → "Microphone".',
        `Pastikan toggle untuk ${browserLabel} dinyalakan (ON).`,
        `Tutup ${browserLabel} sepenuhnya (Cmd + Q), buka lagi, lalu kembali ke halaman ini.`,
    ];

    const showSystemSection =
        errorKind === 'system-denied' ||
        errorKind === 'not-allowed' ||
        errorKind === 'security' ||
        errorKind === 'unknown';

    const showBrowserSection =
        errorKind === 'not-allowed' ||
        errorKind === 'security' ||
        errorKind === 'system-denied' ||
        errorKind === 'unknown';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mic className="size-5 text-red-600" />
                        Cara Mengaktifkan Mikrofon
                    </DialogTitle>
                    <DialogDescription>
                        {errorKind === 'not-found'
                            ? 'Mikrofon belum terdeteksi. Pastikan headset atau mic kamu sudah terpasang.'
                            : errorKind === 'in-use'
                              ? 'Mikrofon sedang dipakai aplikasi lain (Zoom, Meet, Discord, dll). Tutup dulu aplikasi tersebut.'
                              : errorKind === 'unsupported'
                                ? `${browserLabel} tidak mendukung akses mikrofon. Pakai browser modern seperti Chrome, Firefox, atau Safari versi terbaru.`
                                : `Ikuti panduan di bawah untuk mengizinkan akses mikrofon di ${browserLabel}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 text-sm">
                    {showBrowserSection && (
                        <section className="space-y-2">
                            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                                <span className="flex size-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                                    1
                                </span>
                                Izinkan di {browserLabel}
                            </h3>
                            <ol className="ml-8 list-decimal space-y-1.5 text-slate-700 marker:text-slate-400">
                                {browserSteps[browser].map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ol>
                        </section>
                    )}

                    {showSystemSection && (
                        <section className="space-y-2">
                            <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                                <span className="flex size-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                                    {showBrowserSection ? 2 : 1}
                                </span>
                                Cek izin di macOS (jika masih gagal)
                            </h3>
                            <p className="ml-8 text-xs text-slate-500">
                                Khusus pengguna Mac — di Windows/Linux langkah
                                ini bisa dilewati.
                            </p>
                            <ol className="ml-8 list-decimal space-y-1.5 text-slate-700 marker:text-slate-400">
                                {macSystemSteps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ol>
                        </section>
                    )}

                    {errorKind === 'not-found' && (
                        <section className="space-y-2">
                            <h3 className="font-semibold text-slate-900">
                                Tips
                            </h3>
                            <ul className="ml-5 list-disc space-y-1 text-slate-700 marker:text-slate-400">
                                <li>
                                    Pastikan headset/earphone tertancap penuh ke
                                    port audio.
                                </li>
                                <li>
                                    Untuk Bluetooth, pastikan device sudah
                                    ter-pair dan tersambung.
                                </li>
                                <li>Coba cabut-pasang ulang perangkat mic.</li>
                            </ul>
                        </section>
                    )}

                    {errorKind === 'in-use' && (
                        <section className="space-y-2">
                            <h3 className="font-semibold text-slate-900">
                                Aplikasi yang sering memakai mic:
                            </h3>
                            <ul className="ml-5 list-disc space-y-1 text-slate-700 marker:text-slate-400">
                                <li>Zoom, Google Meet, Microsoft Teams</li>
                                <li>Discord, Slack huddle</li>
                                <li>
                                    OBS Studio atau aplikasi recording lainnya
                                </li>
                            </ul>
                            <p className="text-slate-600">
                                Tutup aplikasi tersebut, lalu klik "Coba Lagi".
                            </p>
                        </section>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                    <Button
                        type="button"
                        onClick={onRetry}
                        disabled={errorKind === 'unsupported'}
                        className="gap-1.5"
                    >
                        <Mic className="size-4" />
                        Coba Lagi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function InterviewInvitation({
    session,
    isVoiceInterview,
    onConfirm,
    onDecline,
    rescheduleData,
    rescheduleErrors,
    rescheduleProcessing,
    onRescheduleChange,
    onReschedule,
}: {
    session: AiInterviewShowProps['session'];
    isVoiceInterview: boolean;
    onConfirm: () => void;
    onDecline: () => void;
    rescheduleData: {
        proposed_at: string;
        reason: string;
    };
    rescheduleErrors: Record<string, string>;
    rescheduleProcessing: boolean;
    onRescheduleChange: (
        field: 'proposed_at' | 'reason',
        value: string,
    ) => void;
    onReschedule: () => void;
}) {
    const { t } = useTranslate();
    const [showRescheduleForm, setShowRescheduleForm] = useState(
        Boolean(session.reschedule_requested_at),
    );
    const [timelineSort, setTimelineSort] = useState<'desc' | 'asc'>(() => {
        if (typeof window === 'undefined') {
            return 'desc';
        }

        const sort = new URLSearchParams(window.location.search).get(
            'candidate_timeline_sort',
        );

        return sort === 'asc' || sort === 'desc' ? sort : 'desc';
    });
    const [timelineFilter, setTimelineFilter] = useState<
        'all' | 'requested' | 'approved' | 'rejected'
    >(() => {
        if (typeof window === 'undefined') {
            return 'all';
        }

        const filter = new URLSearchParams(window.location.search).get(
            'candidate_timeline_filter',
        );

        return filter === 'requested' ||
            filter === 'approved' ||
            filter === 'rejected'
            ? filter
            : 'all';
    });
    const timelineEvents = session.reschedule_timeline ?? [];
    const timelineCounts = {
        all: timelineEvents.length,
        requested: timelineEvents.filter(
            (event) => event.action === 'requested',
        ).length,
        approved: timelineEvents.filter((event) => event.action === 'approved')
            .length,
        rejected: timelineEvents.filter((event) => event.action === 'rejected')
            .length,
    };
    const filteredTimeline = timelineEvents
        .filter(
            (event) =>
                timelineFilter === 'all' || event.action === timelineFilter,
        )
        .slice()
        .sort((first, second) => {
            const firstDate = first.created_at
                ? new Date(first.created_at).getTime()
                : 0;
            const secondDate = second.created_at
                ? new Date(second.created_at).getTime()
                : 0;

            return timelineSort === 'desc'
                ? secondDate - firstDate
                : firstDate - secondDate;
        });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        params.set('candidate_timeline_filter', timelineFilter);
        params.set('candidate_timeline_sort', timelineSort);

        const query = params.toString();
        const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;

        window.history.replaceState(window.history.state, '', url);
    }, [timelineFilter, timelineSort]);

    return (
        <>
            <Head title={t('candidate.ai_interview_show.invitation_title')} />
            <div className="min-h-screen bg-[#f8fafc] px-4 py-6 text-slate-950 md:px-8 lg:px-12">
                <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-slate-200 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-600 text-white">
                            <CalendarDays className="size-5" />
                        </div>
                        <span className="text-xl font-bold text-primary-600">
                            Karivia
                        </span>
                    </div>
                    <div className="hidden gap-8 font-medium text-slate-700 md:flex">
                        <span>{t('candidate.ai_interview_show.nav_jobs')}</span>
                        <span>
                            {t(
                                'candidate.ai_interview_show.nav_my_applications',
                            )}
                        </span>
                        <span>
                            {t('candidate.ai_interview_show.nav_profile')}
                        </span>
                    </div>
                </div>

                <main className="mx-auto max-w-6xl py-12">
                    <p className="text-sm font-semibold tracking-[0.35em] text-slate-500 uppercase">
                        {t(
                            'candidate.ai_interview_show.my_applications_invitation',
                        )}
                    </p>
                    <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">
                        {t('candidate.ai_interview_show.invitation_title')}
                        <span className="text-primary-600">!</span>
                    </h1>
                    <p className="mt-5 max-w-3xl text-xl leading-9 text-slate-600">
                        {t('candidate.ai_interview_show.congrats')},{' '}
                        {session.candidate_name ??
                            t('candidate.ai_interview_show.candidate_lower')}
                        ! {t('candidate.ai_interview_show.selected_for_stage')}{' '}
                        {isVoiceInterview
                            ? t('candidate.ai_interview_show.voice_ai_lower')
                            : t('candidate.ai_interview_show.text_lower')}{' '}
                        {t('candidate.ai_interview_show.for_position')}{' '}
                        <strong className="text-slate-900">
                            {session.job_title}
                        </strong>
                        .
                    </p>
                    {session.reschedule_status === 'approved' ? (
                        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                            {t(
                                'candidate.ai_interview_show.reschedule_approved_at',
                            )}{' '}
                            {session.reschedule_reviewed_at ?? '-'}.
                            {session.reschedule_proposed_at
                                ? ` ${t('candidate.ai_interview_show.latest_schedule')}: ${session.reschedule_proposed_at}.`
                                : ''}
                        </div>
                    ) : null}
                    {session.reschedule_status === 'rejected' ? (
                        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
                            {t(
                                'candidate.ai_interview_show.reschedule_not_approved',
                            )}
                            {session.reschedule_rejected_reason
                                ? ` ${t('candidate.ai_interview_show.recruiter_note')}: ${session.reschedule_rejected_reason}`
                                : ''}
                        </div>
                    ) : null}

                    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
                        <div className="space-y-7">
                            <Card className="shadow-sm">
                                <CardContent className="space-y-6 p-6">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                                                <Bot className="size-7" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-primary-600">
                                                    {t(
                                                        'candidate.ai_interview_show.your_recruiter',
                                                    )}
                                                </p>
                                                <h2 className="text-2xl font-bold">
                                                    {session.company}
                                                </h2>
                                                <p className="text-slate-500">
                                                    {session.job_title}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline">
                                            {t(
                                                'candidate.ai_interview_show.view_company_profile',
                                            )}
                                        </Button>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <InfoBox
                                            icon={CalendarDays}
                                            label={t(
                                                'candidate.ai_interview_show.date_time',
                                            )}
                                            value={session.scheduled_at ?? '-'}
                                        />
                                        <InfoBox
                                            icon={isVoiceInterview ? Mic : Bot}
                                            label={t(
                                                'candidate.ai_interview_show.interview_mode',
                                            )}
                                            value={
                                                isVoiceInterview
                                                    ? t(
                                                          'candidate.ai_interview_show.voice_ai',
                                                      )
                                                    : t(
                                                          'candidate.ai_interview_show.text_ai',
                                                      )
                                            }
                                            helper={
                                                isVoiceInterview
                                                    ? t(
                                                          'candidate.ai_interview_show.mic_used_after_confirmation',
                                                      )
                                                    : t(
                                                          'candidate.ai_interview_show.no_microphone_needed',
                                                      )
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-primary-200 bg-primary-50/70 shadow-sm">
                                <CardContent className="space-y-6 p-7">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-600 text-white">
                                            <Sparkles className="size-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black">
                                                {t(
                                                    'candidate.ai_interview_show.karivia_ai_preparation',
                                                )}
                                            </h2>
                                            <p className="text-slate-600">
                                                {t(
                                                    'candidate.ai_interview_show.preparation_recommendation',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        {session.questions
                                            .slice(0, 3)
                                            .map((question, index) => (
                                                <PrepItem
                                                    key={question.id}
                                                    index={index + 1}
                                                    title={
                                                        question.category ??
                                                        `Pertanyaan ${index + 1}`
                                                    }
                                                    description={
                                                        question.rubric ??
                                                        question.question
                                                    }
                                                />
                                            ))}
                                    </div>
                                    <blockquote className="rounded-2xl border border-primary-200 bg-white/60 p-5 text-primary-700 italic">
                                        Tetap tenang dan gunakan contoh nyata.
                                        Karivia AI akan memandu setiap langkah.
                                    </blockquote>
                                </CardContent>
                            </Card>
                        </div>

                        <aside className="space-y-5">
                            <Card className="shadow-sm">
                                <CardHeader>
                                    <CardTitle>
                                        {t(
                                            'candidate.ai_interview_show.attendance_confirmation',
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {t(
                                            'candidate.ai_interview_show.confirmation_description',
                                        )}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button
                                        className="w-full bg-primary-600 hover:bg-primary-700"
                                        size="lg"
                                        onClick={onConfirm}
                                    >
                                        <CheckCircle2 className="size-4" />
                                        {t(
                                            'candidate.ai_interview_show.confirm_attendance',
                                        )}
                                    </Button>
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        variant="outline"
                                        onClick={() =>
                                            setShowRescheduleForm(
                                                (value) => !value,
                                            )
                                        }
                                    >
                                        <Clock3 className="size-4" />
                                        {t(
                                            'candidate.ai_interview_show.reschedule',
                                        )}
                                    </Button>
                                    {showRescheduleForm ? (
                                        <div className="space-y-3 rounded-xl border border-primary-200 bg-primary-50 p-3">
                                            <label className="space-y-1">
                                                <span className="text-xs font-semibold text-slate-600">
                                                    {t(
                                                        'candidate.ai_interview_show.replacement_schedule',
                                                    )}
                                                </span>
                                                <input
                                                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                                                    type="datetime-local"
                                                    value={
                                                        rescheduleData.proposed_at
                                                    }
                                                    onChange={(event) =>
                                                        onRescheduleChange(
                                                            'proposed_at',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </label>
                                            {rescheduleErrors.proposed_at ? (
                                                <InputError
                                                    message={
                                                        rescheduleErrors.proposed_at
                                                    }
                                                />
                                            ) : null}
                                            <label className="space-y-1">
                                                <span className="text-xs font-semibold text-slate-600">
                                                    {t(
                                                        'candidate.ai_interview_show.reason',
                                                    )}
                                                </span>
                                                <textarea
                                                    className="min-h-24 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                                                    value={
                                                        rescheduleData.reason
                                                    }
                                                    onChange={(event) =>
                                                        onRescheduleChange(
                                                            'reason',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder={t(
                                                        'candidate.ai_interview_show.reschedule_reason_placeholder',
                                                    )}
                                                />
                                            </label>
                                            {rescheduleErrors.reason ? (
                                                <InputError
                                                    message={
                                                        rescheduleErrors.reason
                                                    }
                                                />
                                            ) : null}
                                            <Button
                                                className="w-full"
                                                variant="secondary"
                                                disabled={rescheduleProcessing}
                                                onClick={onReschedule}
                                            >
                                                {rescheduleProcessing
                                                    ? t(
                                                          'candidate.ai_interview_show.sending',
                                                      )
                                                    : t(
                                                          'candidate.ai_interview_show.send_reschedule_request',
                                                      )}
                                            </Button>
                                            {session.reschedule_requested_at ? (
                                                <p className="text-xs text-slate-500">
                                                    {t(
                                                        'candidate.ai_interview_show.last_submission',
                                                    )}{' '}
                                                    {
                                                        session.reschedule_requested_at
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    <Button
                                        className="w-full text-red-600 hover:text-red-700"
                                        size="lg"
                                        variant="ghost"
                                        onClick={onDecline}
                                    >
                                        <X className="size-4" />
                                        {t(
                                            'candidate.ai_interview_show.decline_invitation',
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-100 shadow-sm">
                                <CardContent className="p-5">
                                    <p className="font-bold">
                                        {t(
                                            'candidate.ai_interview_show.need_help',
                                        )}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {t(
                                            'candidate.ai_interview_show.help_description',
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                            {session.reschedule_timeline &&
                            session.reschedule_timeline.length > 0 ? (
                                <Card className="shadow-sm">
                                    <CardHeader>
                                        <CardTitle>
                                            Riwayat Reschedule
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <div className="flex flex-wrap gap-1.5">
                                            {(
                                                [
                                                    [
                                                        'all',
                                                        'Semua',
                                                        timelineCounts.all,
                                                    ],
                                                    [
                                                        'requested',
                                                        'Requested',
                                                        timelineCounts.requested,
                                                    ],
                                                    [
                                                        'approved',
                                                        'Approved',
                                                        timelineCounts.approved,
                                                    ],
                                                    [
                                                        'rejected',
                                                        'Rejected',
                                                        timelineCounts.rejected,
                                                    ],
                                                ] as const
                                            ).map(([value, label, count]) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() =>
                                                        setTimelineFilter(value)
                                                    }
                                                    className={cn(
                                                        'rounded-md border px-2 py-1 text-[11px] font-medium',
                                                        timelineFilter === value
                                                            ? 'border-slate-400 bg-slate-900 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                                                    )}
                                                >
                                                    {label} ({count})
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTimelineSort('desc')
                                                }
                                                className={cn(
                                                    'rounded-md border px-2 py-1 text-[11px] font-medium',
                                                    timelineSort === 'desc'
                                                        ? 'border-slate-400 bg-slate-900 text-white'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                                                )}
                                            >
                                                Terbaru
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTimelineSort('asc')
                                                }
                                                className={cn(
                                                    'rounded-md border px-2 py-1 text-[11px] font-medium',
                                                    timelineSort === 'asc'
                                                        ? 'border-slate-400 bg-slate-900 text-white'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                                                )}
                                            >
                                                Terlama
                                            </button>
                                        </div>
                                        {filteredTimeline.length > 0 ? (
                                            filteredTimeline.map(
                                                (event, index) => (
                                                    <div
                                                        key={`${event.action}-${event.created_at ?? index}`}
                                                        className="rounded-xl border border-slate-200 bg-white p-3"
                                                    >
                                                        <p className="font-semibold capitalize">
                                                            {event.action.replaceAll(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-slate-500">
                                                            {event.created_at ??
                                                                '-'}{' '}
                                                            ·{' '}
                                                            {event.actor_name ??
                                                                'Sistem'}
                                                        </p>
                                                        {event.scheduled_at ? (
                                                            <p className="mt-1 text-slate-600">
                                                                Jadwal:{' '}
                                                                {
                                                                    event.scheduled_at
                                                                }
                                                            </p>
                                                        ) : null}
                                                        {event.reason ? (
                                                            <p className="mt-1 text-slate-600">
                                                                Catatan:{' '}
                                                                {event.reason}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                ),
                                            )
                                        ) : (
                                            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-2 text-slate-500">
                                                Tidak ada event untuk filter
                                                ini.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : null}
                        </aside>
                    </div>
                </main>
            </div>
        </>
    );
}

function CompletedInterviewState({
    session,
}: {
    session: AiInterviewShowProps['session'];
}) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('candidate.ai_interview_show.completed_title')} />
            <div className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
                <div className="mx-auto max-w-3xl space-y-6">
                    <Card className="border-primary-200 bg-white shadow-sm">
                        <CardContent className="space-y-4 p-6 md:p-8">
                            <p className="text-sm font-semibold tracking-[0.3em] text-primary-600 uppercase">
                                {t(
                                    'candidate.ai_interview_show.completed_label',
                                )}
                            </p>
                            <h1 className="text-3xl font-black tracking-tight">
                                {t(
                                    'candidate.ai_interview_show.completed_heading',
                                )}
                            </h1>
                            <p className="text-slate-600">
                                {t(
                                    'candidate.ai_interview_show.completed_description',
                                )}
                            </p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Button
                                    className="w-full bg-primary-600 hover:bg-primary-700"
                                    asChild
                                >
                                    <Link href={feedback(session.id)}>
                                        {t(
                                            'candidate.ai_interview_show.view_post_interview_feedback',
                                        )}
                                    </Link>
                                </Button>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href={index()}>
                                        {t(
                                            'candidate.ai_interview_show.back_to_ai_interview',
                                        )}
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function ActiveVoiceSession({
    session,
    activeQuestion,
    currentQuestion,
    remainingSeconds,
    interviewDurationSeconds,
    transcript,
    hasQuestionStarted,
    hasSentGreeting,
    activeAiQuestionText,
    timerExpiryNoticeVisible,
    muted,
    formProcessing,
    onNext,
    onMute,
    onStop,
    onGreet,
    onSubmit,
    onUserDone,
    onKeepTalking,
    onPause,
    isPaused,
    speechAnalytics,
    turnState,
    autoAdvanceRemaining,
    remoteAudioRef,
    signalQuality,
    connectionHealth,
    cameraStream,
    isPractice,
}: {
    session: AiInterviewShowProps['session'];
    activeQuestion?: AiInterviewShowProps['session']['questions'][number];
    currentQuestion: number;
    remainingSeconds: number;
    interviewDurationSeconds: number;
    transcript: TranscriptItem[];
    hasQuestionStarted: boolean;
    hasSentGreeting: boolean;
    activeAiQuestionText: string | null;
    timerExpiryNoticeVisible: boolean;
    muted: boolean;
    formProcessing: boolean;
    onNext: () => void;
    onMute: () => void;
    onStop: () => void;
    onGreet: () => void;
    onSubmit: () => void;
    onUserDone: () => void;
    onKeepTalking: () => void;
    onPause: () => void;
    isPaused: boolean;
    speechAnalytics: {
        totalSpeechDuration: number;
        averageSpeechSpeed: number;
        pauseCount: number;
        fillerWordCount: number;
    };
    turnState:
        | 'ai-talking'
        | 'user-turn'
        | 'user-answering'
        | 'user-paused'
        | 'ai-thinking';
    autoAdvanceRemaining: number | null;
    remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
    signalQuality: SignalQuality;
    connectionHealth: {
        rtt: number | null;
        jitter: number | null;
        packetLoss: number | null;
        bitrate: number | null;
    };
    cameraStream: MediaStream | null;
    isPractice: boolean;
}) {
    const { branding } = usePage<{
        branding?: { name?: string; logo_url?: string | null };
    }>().props;
    const { t } = useTranslate();
    const siteLogoUrl = branding?.logo_url ?? null;
    const siteName = branding?.name ?? 'Karivia';

    const progress = hasQuestionStarted
        ? Math.round(
              ((currentQuestion + 1) / Math.max(session.questions.length, 1)) *
                  100,
          )
        : 0;
    const signal = signalQualityConfig(signalQuality);
    const [currentClock, setCurrentClock] = useState(() => new Date());

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentClock(new Date());
        }, 1000);

        return () => {
            window.clearInterval(interval);
        };
    }, []);

    /* ref callback — sets srcObject the moment the <video> element mounts,
       so the stream shows even when cameraStream was already set before render */
    const cameraVideoCallbackRef = (el: HTMLVideoElement | null) => {
        if (el) {
            el.srcObject = cameraStream;
        }
    };

    return (
        <>
            <Head title={t('candidate.ai_interview_show.session_title')} />
            <div className="relative flex min-h-screen flex-col overflow-hidden bg-white text-slate-900">
                {/* Blurred primary color blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -right-32 size-125 rounded-full bg-primary-400/25 blur-[120px]" />
                    <div className="absolute -bottom-32 -left-32 size-112.5 rounded-full bg-primary-600/20 blur-[100px]" />
                    <div className="absolute top-1/2 left-1/3 size-75 -translate-y-1/2 rounded-full bg-primary-300/15 blur-[80px]" />
                </div>

                {/* Header */}
                <header className="relative flex items-center gap-3 border-b border-primary-100/60 bg-white/70 px-4 py-2.5 backdrop-blur-md md:px-6">
                    {/* Branding */}
                    <div className="flex shrink-0 items-center">
                        {siteLogoUrl ? (
                            <img
                                src={siteLogoUrl}
                                alt={siteName}
                                className="h-8 object-contain"
                            />
                        ) : (
                            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-200">
                                <Bot className="size-4 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 overflow-hidden rounded-full bg-primary-100">
                                <div
                                    className="h-1.5 rounded-full bg-linear-to-r from-primary-500 to-primary-400 transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            {hasQuestionStarted && (
                                <span className="shrink-0 text-xs font-semibold text-primary-600 tabular-nums">
                                    {currentQuestion + 1}/
                                    {session.questions.length}
                                </span>
                            )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-center gap-2">
                            {hasQuestionStarted ? (
                                <>
                                    <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 capitalize">
                                        {activeQuestion?.category ??
                                            'Interview'}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        Pertanyaan {currentQuestion + 1} dari{' '}
                                        {session.questions.length}
                                    </span>
                                </>
                            ) : (
                                <span className="text-[11px] text-slate-400">
                                    {session.ai_intro.assistant_name} sedang
                                    membuka sesi
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Timer + End */}
                    <div className="flex shrink-0 items-center gap-2 md:gap-3">
                        <div className="text-right">
                            <span className="block font-mono text-sm font-bold text-slate-800 tabular-nums md:text-lg">
                                {formatDuration(remainingSeconds)}
                            </span>
                            <span className="hidden text-[10px] text-slate-400 md:block">
                                / {formatDuration(interviewDurationSeconds)}
                            </span>
                        </div>
                        <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={onSubmit}
                            disabled={formProcessing}
                        >
                            <PhoneOff className="size-3.5" />
                            <span className="hidden sm:inline">
                                {t('candidate.ai_interview_show.end_session')}
                            </span>
                            <span className="sm:hidden">
                                {t('candidate.ai_interview_show.end')}
                            </span>
                        </Button>
                    </div>
                </header>

                {/* Body */}
                <div className="relative flex flex-1 flex-col lg:flex-row">
                    {timerExpiryNoticeVisible && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary-950/40 p-4 backdrop-blur-sm">
                            <div className="w-full max-w-md rounded-2xl border border-primary-100 bg-white p-6 text-center shadow-2xl">
                                <p className="text-xs font-bold tracking-[0.2em] text-primary-500 uppercase">
                                    {t('candidate.ai_interview_show.time_up')}
                                </p>
                                <h2 className="mt-2 text-2xl font-black text-slate-900">
                                    {t(
                                        'candidate.ai_interview_show.session_will_end_automatically',
                                    )}
                                </h2>
                                <p className="mt-2 text-sm text-slate-600">
                                    {t(
                                        'candidate.ai_interview_show.answers_saved_and_redirected',
                                    )}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Right sidebar — order-1 on mobile so camera is at top */}
                    <aside className="order-1 flex flex-col gap-3 border-b border-primary-100/60 bg-white/50 p-4 backdrop-blur-sm lg:order-2 lg:w-72 lg:border-b-0 lg:border-l xl:w-80">
                        {/* Camera feed — recording disabled in simulator/practice mode */}
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-slate-950 shadow-lg shadow-primary-200/40">
                            <div className="relative aspect-video">
                                <video
                                    ref={cameraVideoCallbackRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={cn(
                                        'h-full w-full object-cover',
                                        !cameraStream && 'hidden',
                                    )}
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                {!cameraStream && (
                                    <div className="flex h-full flex-col items-center justify-center gap-2.5">
                                        <div className="flex size-12 items-center justify-center rounded-full bg-slate-800 ring-1 ring-white/10">
                                            <VideoOff className="size-5 text-slate-400" />
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Kamera tidak aktif
                                        </p>
                                    </div>
                                )}
                                {/* Live badge */}
                                <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 backdrop-blur-sm">
                                    <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                                    <span className="text-[10px] font-bold tracking-wider text-white uppercase">
                                        Live
                                    </span>
                                </div>
                                {/* Mute indicator */}
                                {muted && (
                                    <div className="absolute top-2.5 right-2.5 rounded-full bg-red-600/90 p-1.5 shadow-sm">
                                        <MicOff className="size-3 text-white" />
                                    </div>
                                )}
                                {/* Name overlay */}
                                {session.candidate_name && (
                                    <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 to-transparent px-3 py-3">
                                        <p className="text-xs font-semibold text-white">
                                            {session.candidate_name}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-primary-100 bg-white/80 p-2.5 shadow-sm backdrop-blur-sm">
                                <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
                                    Sinyal
                                </p>
                                <p
                                    className={cn(
                                        'mt-1 flex items-center gap-0.5 text-xs font-bold',
                                        signal.color,
                                    )}
                                >
                                    <Signal className="size-3" />
                                    {signal.label}
                                </p>
                            </div>
                            <div className="rounded-xl border border-primary-100 bg-white/80 p-2.5 shadow-sm backdrop-blur-sm">
                                <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
                                    Sisa
                                </p>
                                <p className="mt-1 font-mono text-xs font-bold text-slate-900 tabular-nums">
                                    {formatDuration(remainingSeconds)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-primary-100 bg-white/80 p-2.5 shadow-sm backdrop-blur-sm">
                                <p className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
                                    Waktu
                                </p>
                                <p className="mt-1 font-mono text-xs font-bold text-slate-900 tabular-nums">
                                    {currentClock.toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Turn state indicator */}
                        <TurnStateIndicator
                            turnState={turnState}
                            autoAdvanceRemaining={autoAdvanceRemaining}
                            onKeepTalking={onKeepTalking}
                        />

                        {/* Primary action: Selesai Menjawab */}
                        <Button
                            size="lg"
                            className={cn(
                                'w-full font-bold shadow-md',
                                turnState === 'ai-talking' ||
                                    turnState === 'ai-thinking'
                                    ? 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
                                    : 'bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200 hover:from-emerald-400 hover:to-emerald-500',
                            )}
                            disabled={
                                turnState === 'ai-talking' ||
                                turnState === 'ai-thinking'
                            }
                            onClick={onUserDone}
                        >
                            <Send className="size-4" />
                            Saya Selesai Menjawab
                        </Button>

                        {/* Secondary controls */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="lg"
                                variant="outline"
                                className={cn(
                                    'w-full border-primary-200 bg-white/70 text-slate-700 hover:border-primary-300 hover:bg-white hover:text-slate-900',
                                    isPaused && 'bg-amber-50 border-amber-300 text-amber-800',
                                )}
                                onClick={onPause}
                            >
                                {isPaused ? (
                                    <>
                                        <Play className="size-4" />
                                        Lanjutkan
                                    </>
                                ) : (
                                    <>
                                        <Pause className="size-4" />
                                        Jeda
                                    </>
                                )}
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full border-primary-200 bg-white/70 text-slate-700 hover:border-primary-300 hover:bg-white hover:text-slate-900"
                                disabled={
                                    currentQuestion ===
                                        session.questions.length - 1 ||
                                    turnState === 'ai-talking' ||
                                    turnState === 'ai-thinking'
                                }
                                onClick={onNext}
                            >
                                <SkipForward className="size-4" />
                                Lewati
                            </Button>
                            <Button
                                size="lg"
                                className={cn(
                                    'w-full',
                                    muted
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-linear-to-br from-primary-600 to-primary-700 shadow-md shadow-primary-200 hover:from-primary-500 hover:to-primary-600',
                                )}
                                onClick={onMute}
                            >
                                {muted ? (
                                    <MicOff className="size-4" />
                                ) : (
                                    <Mic className="size-4" />
                                )}
                                {muted ? 'Unmute' : 'Mute'}
                            </Button>
                        </div>

                        <button
                            type="button"
                            className="w-full rounded-xl py-2 text-sm text-slate-400 transition-colors hover:text-slate-600"
                            onClick={onStop}
                        >
                            Kembali ke Lobby
                        </button>
                    </aside>

                    {/* Main area — order-2 on mobile, order-1 on desktop */}
                    <section className="order-2 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center md:px-8 lg:order-1">
                        {/* Status pill */}
                        <div
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm',
                                hasQuestionStarted
                                    ? 'border-primary-200 bg-primary-50/80'
                                    : hasSentGreeting
                                      ? 'border-emerald-200 bg-emerald-50/80'
                                      : 'border-gray-200 bg-white/60',
                            )}
                        >
                            <span
                                className={cn(
                                    'size-2 animate-pulse rounded-full',
                                    hasQuestionStarted
                                        ? 'bg-primary-500'
                                        : hasSentGreeting
                                          ? 'bg-emerald-500'
                                          : 'bg-slate-400',
                                )}
                            />
                            <span
                                className={cn(
                                    'text-[11px] font-bold tracking-widest uppercase',
                                    hasQuestionStarted
                                        ? 'text-primary-600'
                                        : hasSentGreeting
                                          ? 'text-emerald-600'
                                          : 'text-slate-500',
                                )}
                            >
                                {hasQuestionStarted
                                    ? 'AI sedang menanyakan'
                                    : hasSentGreeting
                                      ? 'AI sedang memperkenalkan diri'
                                      : 'Siap — klik Sapa untuk memulai'}
                            </span>
                        </div>

                        {/* Bot avatar */}
                        <div
                            className="relative flex size-28 items-center justify-center rounded-full md:size-40 lg:size-48"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(var(--color-primary-400)/0.2) 0%, rgba(var(--color-primary-200)/0.1) 55%, transparent 72%)',
                            }}
                        >
                            {/* Soft glow ring when speaking */}
                            <div
                                className={cn(
                                    'absolute inset-0 rounded-full transition-opacity duration-500',
                                    hasSentGreeting
                                        ? 'opacity-100'
                                        : 'opacity-0',
                                )}
                                style={{
                                    boxShadow:
                                        '0 0 40px 8px rgba(59,130,246,0.15), 0 0 80px 20px rgba(99,102,241,0.08)',
                                }}
                            />
                            <div className="flex size-20 items-center justify-center rounded-full bg-linear-to-br from-primary-600 to-primary-800 shadow-xl ring-4 shadow-primary-300/50 ring-primary-100 md:size-28 lg:size-36">
                                <Bot className="size-9 text-white md:size-12 lg:size-16" />
                            </div>
                            {/* Voice bars */}
                            <div className="absolute -bottom-3 flex items-end gap-1">
                                {[1, 2, 3, 4, 5].map((bar) => (
                                    <span
                                        key={bar}
                                        className={cn(
                                            'w-1.5 rounded-full',
                                            hasSentGreeting
                                                ? 'animate-pulse bg-primary-500'
                                                : 'bg-primary-200',
                                        )}
                                        style={{
                                            height: `${6 + (bar % 3) * 7}px`,
                                            animationDelay: `${bar * 100}ms`,
                                            animationDuration: `${600 + bar * 80}ms`,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Question / greeting / sapa prompt */}
                        <div className="w-full max-w-xl px-2 text-center md:max-w-2xl md:px-0">
                            {hasQuestionStarted ? null : hasSentGreeting ? null : (
                                <div className="space-y-4">
                                    <p className="text-base leading-7 text-slate-600 md:text-lg">
                                        {t(
                                            'candidate.ai_interview_show.connection_success_click',
                                        )}{' '}
                                        <strong className="text-slate-900">
                                            {t(
                                                'candidate.ai_interview_show.greet',
                                            )}
                                        </strong>{' '}
                                        {t(
                                            'candidate.ai_interview_show.connection_success_suffix',
                                        )}
                                    </p>
                                    <Button
                                        size="lg"
                                        className="gap-2 bg-linear-to-br from-primary-600 to-primary-700 px-8 py-3 text-base shadow-lg shadow-primary-300/50 hover:from-primary-500 hover:to-primary-600"
                                        onClick={onGreet}
                                    >
                                        <Hand className="size-5" />
                                        {t(
                                            'candidate.ai_interview_show.greet_ai_interviewer',
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Live transcript */}
                        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-primary-100 bg-white/70 text-left shadow-sm backdrop-blur-sm md:max-w-2xl">
                            <div className="flex items-center justify-between border-b border-primary-100/60 px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                                        Live Transcription
                                    </p>
                                </div>
                                {speechAnalytics.totalSpeechDuration > 0 && (
                                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                        <span className="font-medium">
                                            {Math.round(speechAnalytics.averageSpeechSpeed)} wpm
                                        </span>
                                        <span>•</span>
                                        <span className="font-medium">
                                            {speechAnalytics.fillerWordCount} filler
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="min-h-16 p-4">
                                {transcript.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {transcript
                                            .slice(-3)
                                            .map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex gap-2"
                                                >
                                                    <span
                                                        className={cn(
                                                            'mt-1 shrink-0 text-[10px] font-bold tracking-widest uppercase',
                                                            item.speaker ===
                                                                'AI'
                                                                ? 'text-primary-500'
                                                                : 'text-slate-400',
                                                        )}
                                                    >
                                                        {item.speaker}
                                                    </span>
                                                    <p className="text-sm leading-6 text-slate-600 italic">
                                                        {item.text}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm leading-6 text-slate-400 italic">
                                        Transkrip akan muncul saat sesi
                                        dimulai...
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

                <audio ref={remoteAudioRef} autoPlay playsInline />
            </div>
        </>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function DeviceCheck({
    icon: Icon,
    label,
    value,
    helper,
    tone = 'orange',
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper?: string;
    tone?: 'green' | 'orange' | 'red';
}) {
    const toneConfig = {
        green: {
            icon: 'bg-green-50 text-green-600',
            dot: 'bg-green-500',
            pill: 'bg-green-50 text-green-700 ring-green-200',
        },
        orange: {
            icon: 'bg-primary-50 text-primary-600',
            dot: 'bg-primary-400',
            pill: 'bg-primary-50 text-primary-700 ring-primary-200',
        },
        red: {
            icon: 'bg-red-50 text-red-600',
            dot: 'bg-red-500',
            pill: 'bg-red-50 text-red-700 ring-red-200',
        },
    }[tone];

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div
                className={cn(
                    'flex size-9 items-center justify-center rounded-xl',
                    toneConfig.icon,
                )}
            >
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    {label}
                </p>
                <div
                    className={cn(
                        'mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
                        toneConfig.pill,
                    )}
                >
                    <span
                        className={cn('size-1.5 rounded-full', toneConfig.dot)}
                    />
                    {value}
                </div>
                {helper ? (
                    <p className="mt-1 text-[11px] text-slate-400">{helper}</p>
                ) : null}
            </div>
        </div>
    );
}

function DeviceStatusPill({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    tone: 'green' | 'orange' | 'red';
}) {
    const config = {
        green: 'bg-green-50 text-green-700 ring-green-200',
        orange: 'bg-amber-50 text-amber-700 ring-amber-200',
        red: 'bg-red-50 text-red-700 ring-red-200',
    }[tone];

    const dotConfig = {
        green: 'bg-green-500',
        orange: 'bg-amber-400',
        red: 'bg-red-500',
    }[tone];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1',
                config,
            )}
        >
            <span className={cn('size-1.5 rounded-full', dotConfig)} />
            <Icon className="size-3 opacity-70" />
            {label}: {value}
        </span>
    );
}

function TurnStateIndicator({
    turnState,
    autoAdvanceRemaining,
    onKeepTalking,
}: {
    turnState:
        | 'ai-talking'
        | 'user-turn'
        | 'user-answering'
        | 'user-paused'
        | 'ai-thinking';
    autoAdvanceRemaining: number | null;
    onKeepTalking: () => void;
}) {
    if (autoAdvanceRemaining !== null) {
        return (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 items-center justify-center rounded-full bg-amber-200 font-mono text-base font-black text-amber-800 tabular-nums">
                            {autoAdvanceRemaining}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-amber-900">
                                AI lanjut otomatis
                            </p>
                            <p className="text-[11px] text-amber-700">
                                Jeda terdeteksi
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
                        onClick={onKeepTalking}
                    >
                        <Pause className="size-3.5" />
                        Tunggu
                    </Button>
                </div>
            </div>
        );
    }

    const stateMap: Record<
        typeof turnState,
        { label: string; sub: string; color: string; icon: typeof Bot }
    > = {
        'ai-talking': {
            label: 'AI sedang bertanya',
            sub: 'Dengarkan pertanyaannya',
            color: 'border-primary-200 bg-primary-50 text-primary-900',
            icon: Bot,
        },
        'ai-thinking': {
            label: 'AI sedang merespons',
            sub: 'Mohon tunggu...',
            color: 'border-primary-200 bg-primary-50 text-primary-900',
            icon: Loader2,
        },
        'user-turn': {
            label: 'Giliranmu menjawab',
            sub: 'Mulai bicara saat siap',
            color: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            icon: Mic,
        },
        'user-answering': {
            label: 'Sedang merekam jawaban',
            sub: 'Lanjutkan, AI mendengarkan',
            color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
            icon: Radio,
        },
        'user-paused': {
            label: 'Jeda terdeteksi',
            sub: 'Lanjutkan atau klik Selesai',
            color: 'border-amber-200 bg-amber-50 text-amber-900',
            icon: Pause,
        },
    };

    const cfg = stateMap[turnState];
    const Icon = cfg.icon;

    return (
        <div
            className={cn(
                'flex items-center gap-2.5 rounded-xl border p-3',
                cfg.color,
            )}
        >
            <Icon
                className={cn(
                    'size-4 shrink-0',
                    turnState === 'ai-thinking' && 'animate-spin',
                    turnState === 'user-answering' && 'animate-pulse',
                )}
            />
            <div className="min-w-0">
                <p className="truncate text-xs font-bold">{cfg.label}</p>
                <p className="truncate text-[11px] opacity-80">{cfg.sub}</p>
            </div>
        </div>
    );
}

function signalQualityConfig(quality: SignalQuality): {
    label: string;
    color: string;
} {
    if (quality === 'excellent') {
        return { label: 'Sangat Baik', color: 'text-green-600' };
    }

    if (quality === 'good') {
        return { label: 'Baik', color: 'text-emerald-600' };
    }

    if (quality === 'fair') {
        return { label: 'Cukup', color: 'text-secondary-600' };
    }

    if (quality === 'poor') {
        return { label: 'Kurang Stabil', color: 'text-primary-600' };
    }

    return { label: 'Offline', color: 'text-red-600' };
}

function InstructionRow({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-sm leading-6 text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
}

function InfoBox({
    icon: Icon,
    label,
    value,
    helper,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    helper?: string;
}) {
    return (
        <div className="rounded-2xl bg-slate-50 p-5">
            <div className="flex items-center gap-3 text-sm font-bold tracking-[0.25em] text-slate-400 uppercase">
                <Icon className="size-5 text-primary-600" />
                {label}
            </div>
            <p className="mt-4 text-xl font-bold">{value}</p>
            {helper ? (
                <p className="mt-2 text-sm text-primary-600">{helper}</p>
            ) : null}
        </div>
    );
}

function PrepItem({
    index,
    title,
    description,
}: {
    index: number;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-200 text-sm font-bold text-primary-700">
                {index}
            </div>
            <div>
                <p className="font-bold capitalize">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                    {description}
                </p>
            </div>
        </div>
    );
}

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

    return `${minutes}:${remainingSeconds}`;
}

function csrfToken(): string {
    return decodeURIComponent(
        document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1] ?? '',
    );
}

function AnswerForm({
    session,
    isVoiceInterview,
    form,
    updateAnswer,
    submitAnswers,
}: {
    session: AiInterviewShowProps['session'];
    isVoiceInterview: boolean;
    form: ReturnType<
        typeof useForm<{
            answers: Record<number, string>;
            live_transcript: string;
        }>
    >;
    updateAnswer: (questionId: number, value: string) => void;
    submitAnswers: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
    const { t } = useTranslate();
    const total = session.questions.length;
    const [currentIndex, setCurrentIndex] = useState(0);
    const activeQuestion = session.questions[currentIndex];
    const errors = form.errors as Record<string, string>;
    const answeredCount = useMemo(
        () =>
            session.questions.reduce(
                (count, q) =>
                    (form.data.answers[q.id] ?? '').trim().length > 0
                        ? count + 1
                        : count,
                0,
            ),
        [session.questions, form.data.answers],
    );
    const progressPercent =
        total === 0 ? 0 : Math.round((answeredCount / total) * 100);
    const isLast = currentIndex === total - 1;
    const isFirst = currentIndex === 0;

    if (!activeQuestion) {
        return null;
    }

    return (
        <form onSubmit={submitAnswers} className="space-y-4">
            {/* Compact greeting — only for text mode */}
            {!isVoiceInterview && (
                <div className="rounded-2xl border border-primary-200 bg-linear-to-br from-primary-50 to-secondary-50/40 p-4">
                    <div className="flex items-center gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-100">
                            <Bot className="size-3.5 text-primary-600" />
                        </div>
                        <p className="text-[11px] font-bold tracking-wider text-primary-600 uppercase">
                            {session.ai_intro.assistant_name}
                        </p>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 sm:line-clamp-none">
                        {session.ai_intro.greeting}
                    </p>
                </div>
            )}

            {/* Sticky exam header — progress + counter + nav grid */}
            <div className="sticky top-2 z-10 space-y-3 rounded-2xl border bg-white/95 p-4 shadow-sm backdrop-blur-sm sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold tracking-[0.25em] text-primary-600 uppercase sm:text-xs">
                            {t(
                                'candidate.ai_interview_show.answers_per_question',
                            )}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                            {answeredCount} / {total} terisi ({progressPercent}
                            %)
                        </p>
                    </div>
                    <div className="shrink-0 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white sm:px-4 sm:py-2 sm:text-sm">
                        {currentIndex + 1} / {total}
                    </div>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full rounded-full bg-linear-to-r from-primary-500 to-primary-700 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Question grid — compact */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {session.questions.map((q, idx) => {
                        const filled =
                            (form.data.answers[q.id] ?? '').trim().length > 0;
                        const isActive = idx === currentIndex;

                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => setCurrentIndex(idx)}
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-md border text-xs font-bold transition-all sm:size-9 sm:text-sm',
                                    isActive
                                        ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                                        : filled
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500'
                                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400',
                                )}
                                aria-label={`Soal ${idx + 1}${filled ? ' (terisi)' : ''}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active question */}
            <div className="rounded-2xl border-2 border-primary-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white shadow-sm sm:size-9 sm:text-sm">
                        {currentIndex + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                        {activeQuestion.category ? (
                            <p className="mb-1 text-[10px] font-bold tracking-widest text-primary-500 uppercase">
                                {activeQuestion.category}
                            </p>
                        ) : null}
                        <p className="text-sm leading-6 font-semibold text-slate-900 sm:text-base sm:leading-7">
                            {activeQuestion.question}
                        </p>
                    </div>
                </div>

                {activeQuestion.question_type === 'multiple_choice' && (activeQuestion.options?.length ?? 0) > 0 ? (
                    <div className="space-y-2.5">
                        {activeQuestion.options!.map((option, optIdx) => {
                            const selected = form.data.answers[activeQuestion.id] === option;
                            return (
                                <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => updateAnswer(activeQuestion.id, selected ? '' : option)}
                                    className={cn(
                                        'flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm leading-6 transition-all',
                                        selected
                                            ? 'border-primary-500 bg-primary-50 font-medium text-primary-800'
                                            : 'border-input hover:border-slate-300 hover:bg-slate-50',
                                    )}
                                >
                                    <span className={cn(
                                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors',
                                        selected
                                            ? 'border-primary-500 bg-primary-500 text-white'
                                            : 'border-slate-300 text-slate-400',
                                    )}>
                                        {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span>{option}</span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <textarea
                        autoFocus
                        className="min-h-40 w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm leading-6 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:min-h-48 sm:px-4 sm:py-3"
                        value={form.data.answers[activeQuestion.id] ?? ''}
                        onChange={(event) =>
                            updateAnswer(activeQuestion.id, event.target.value)
                        }
                        placeholder={t(
                            'candidate.ai_interview_show.write_answer_placeholder',
                        )}
                    />
                )}
                <InputError message={errors[`answers.${activeQuestion.id}`]} />
            </div>

            {/* Navigation footer */}
            <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                <Button
                    type="button"
                    variant="outline"
                    disabled={isFirst}
                    onClick={() =>
                        setCurrentIndex((idx) => Math.max(0, idx - 1))
                    }
                    className="w-full sm:w-auto"
                >
                    <ChevronLeft className="size-4" />
                    Sebelumnya
                </Button>

                {isLast ? (
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="w-full gap-2 sm:w-auto"
                    >
                        <CheckCircle2 className="size-4" />
                        {form.processing
                            ? t('candidate.ai_interview_show.sending')
                            : t(
                                  'candidate.ai_interview_show.complete_and_submit',
                              )}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={() =>
                            setCurrentIndex((idx) =>
                                Math.min(total - 1, idx + 1),
                            )
                        }
                        className="w-full sm:w-auto"
                    >
                        Selanjutnya
                        <ChevronRight className="size-4" />
                    </Button>
                )}
            </div>
        </form>
    );
}

// Review Modal Component
function ReviewModal({
    show,
    onClose,
    onConfirm,
    questions,
    answers,
    processing,
}: {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    questions: AiInterviewShowProps['session']['questions'];
    answers: Record<number, string>;
    processing: boolean;
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ListChecks className="size-5 text-primary-600" />
                        Review Jawaban
                    </CardTitle>
                    <CardDescription>
                        Periksa jawaban Anda sebelum mengirim ke perusahaan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="rounded-lg border border-slate-200 p-4"
                        >
                            <div className="mb-2 flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                    Q{index + 1}: {question.question}
                                </p>
                            </div>
                            <div className="rounded-md bg-slate-50 p-3">
                                <p className="text-sm text-slate-700">
                                    {answers[question.id] || 'Belum dijawab'}
                                </p>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Kembali
                    </Button>
                    <Button onClick={onConfirm} disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 size-4" />
                                Kirim Jawaban
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

CandidateAiInterviewShow.layout = ({ session }: AiInterviewShowProps) => ({
    breadcrumbs: [
        {
            title: 'AI Simulator',
            href: index(),
        },
        {
            title: session.job_title ?? 'Wawancara',
            href: show(session.id),
        },
    ],
});
