import { useEffect, useRef, useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mic, Send, Heart, Volume2, Loader, History } from "lucide-react";
import { createConversationSocket, UserSession } from "@/lib/api";
import { requireAppAccess } from "@/lib/guards";
import { capitalizeLang, getLangFlag } from "@/lib/languages";
import { speakBilingualAsync, ensureVoicesLoaded } from "@/lib/voice";
import { startRecording as beginMicCapture, blobToBase64 } from "@/lib/audioRecord";
import { toast } from "sonner";

export const Route = createFileRoute("/conversation")({
  head: () => ({ meta: [{ title: "Practice — TongueBridge" }] }),
  beforeLoad: requireAppAccess,
  component: Conversation,
});

type TutorPhase =
  | "intro"
  | "overview"
  | "teach_word"
  | "quiz"
  | "done"
  | string;

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  messageNative?: string;
  messageTarget?: string;
  pronunciationScore?: number | null;
  correctionNative?: string | null;
  correctionTarget?: string | null;
  encouragement?: string | null;
  languageTip?: string | null;
  newWord?: { target: string; native: string } | null;
  phase?: TutorPhase;
  answerCorrect?: boolean | null;
  evaluationNative?: string | null;
};

type AiPayload = {
  message_native?: string;
  message_target?: string;
  pronunciation_score?: number | null;
  correction?: string | null;
  correction_native?: string | null;
  correction_target?: string | null;
  encouragement?: string | null;
  language_tip?: string | null;
  new_word?: { target: string; native: string } | null;
  phase?: string;
  answer_correct?: boolean | null;
  evaluation_native?: string | null;
  awaiting_user?: boolean;
};

const PHASE_LABELS: Record<string, string> = {
  intro: "📋 Today's plan",
  overview: "📖 Full sentence",
  teach_word: "🔤 Word by word",
  quiz: "❓ Your turn",
  done: "🎉 Complete",
};

function buildAiMessage(data: AiPayload): Message {
  return {
    id: crypto.randomUUID(),
    role: "ai",
    text: [data.message_native, data.message_target].filter(Boolean).join("\n"),
    messageNative: data.message_native,
    messageTarget: data.message_target,
    pronunciationScore: data.pronunciation_score,
    correctionNative: data.correction_native,
    correctionTarget: data.correction_target ?? data.correction,
    encouragement: data.encouragement,
    languageTip: data.language_tip,
    newWord: data.new_word,
    phase: data.phase,
    answerCorrect: data.answer_correct,
    evaluationNative: data.evaluation_native,
  };
}

function Conversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState("");
  const [tutor, setTutor] = useState({ name: "AI Tutor", flag: "🌐" });
  const [lessonTitle, setLessonTitle] = useState("");
  const [tutorPhase, setTutorPhase] = useState<TutorPhase>("intro");
  const [awaitingUser, setAwaitingUser] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [queueBusy, setQueueBusy] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recordingSessionRef = useRef<{ stop: () => void; cancel: () => void } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<AiPayload[]>([]);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const targetLang = UserSession.getTargetLang();
  const nativeLang = UserSession.getNativeLang();

  useEffect(() => {
    mountedRef.current = true;
    void ensureVoicesLoaded();
    return () => {
      mountedRef.current = false;
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking, isSpeaking]);

  const notifyTtsDone = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "tts_done" }));
    }
  }, []);

  const processAiQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setQueueBusy(true);

    while (queueRef.current.length > 0 && mountedRef.current) {
      const data = queueRef.current.shift()!;
      setIsThinking(false);

      if (data.phase) setTutorPhase(data.phase);
      if (data.awaiting_user != null) setAwaitingUser(data.awaiting_user);

      const msg = buildAiMessage(data);
      setMessages((prev) => [...prev, msg]);

      const nativeLine = data.message_native || "";
      const targetLine = data.message_target || "";

      if (nativeLine || targetLine) {
        setIsSpeaking(true);
        try {
          await speakBilingualAsync(nativeLine, targetLine, nativeLang, targetLang);
        } catch {
          /* still advance */
        }
        if (mountedRef.current) setIsSpeaking(false);
      }

      if (data.pronunciation_score != null && data.pronunciation_score < 60) {
        setHearts((h) => Math.max(0, h - 1));
      }

      notifyTtsDone();
    }

    processingRef.current = false;
    if (mountedRef.current) {
      setIsSpeaking(false);
      setQueueBusy(false);
    }
  }, [nativeLang, targetLang, notifyTtsDone]);

  const enqueueAiMessage = useCallback(
    (data: AiPayload) => {
      queueRef.current.push(data);
      void processAiQueue();
    },
    [processAiQueue]
  );

  useEffect(() => {
    const userId = UserSession.getId();
    const ws = createConversationSocket(userId, nativeLang, targetLang);
    wsRef.current = ws;

    const thinkingTimer = { id: 0 as ReturnType<typeof setTimeout> | 0 };

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          setTutor({
            name: data.tutor_name || `${capitalizeLang(targetLang)} Tutor ✨`,
            flag: data.tutor_flag || getLangFlag(targetLang),
          });
          setLessonTitle(data.lesson_title || "");
          setIsThinking(true);
        } else if (data.type === "transcribing") {
          setIsThinking(true);
        } else if (data.type === "transcription") {
          setIsThinking(true);
          const heard = data.text as string;
          if (data.confidence != null && data.confidence < 0.35) {
            toast.info("We may have misheard — check the text below and try again if needed.");
          }
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", text: heard },
          ]);
        } else if (data.type === "thinking") {
          setIsThinking(true);
          if (thinkingTimer.id) clearTimeout(thinkingTimer.id);
          thinkingTimer.id = setTimeout(() => {
            setIsThinking(false);
            toast.error("Tutor is taking too long — try again.");
          }, 90000);
        } else if (data.type === "ai_message") {
          if (thinkingTimer.id) clearTimeout(thinkingTimer.id);
          enqueueAiMessage(data);
        } else if (data.type === "error") {
          if (thinkingTimer.id) clearTimeout(thinkingTimer.id);
          setIsThinking(false);
          toast.error(data.message || "Something went wrong");
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
        setIsThinking(false);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsThinking(false);
      if (thinkingTimer.id) clearTimeout(thinkingTimer.id);
    };
    ws.onerror = () => toast.error("Connection error. Is the backend running on :8000?");

    return () => {
      mountedRef.current = false;
      if (thinkingTimer.id) clearTimeout(thinkingTimer.id);
      ws.close();
    };
  }, [enqueueAiMessage, nativeLang, targetLang]);

  const canInteract =
    isConnected &&
    !isSpeaking &&
    !isThinking &&
    !queueBusy &&
    (awaitingUser || tutorPhase === "teach_word" || tutorPhase === "quiz");

  const sendText = useCallback(() => {
    const text = inputText.trim();
    if (!text || !wsRef.current || !canInteract) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text }]);
    wsRef.current.send(JSON.stringify({ type: "text", text }));
    setInputText("");
    setIsThinking(true);
  }, [inputText, canInteract]);

  const handleStartRecording = useCallback(async () => {
    if (!canInteract) return;
    try {
      const session = await beginMicCapture(
        async (blob) => {
          setIsRecording(false);
          recordingSessionRef.current = null;
          try {
            const base64 = await blobToBase64(blob);
            setIsThinking(true);
            wsRef.current?.send(JSON.stringify({ type: "audio", audio: base64 }));
          } catch (err) {
            setIsThinking(false);
            toast.error(err instanceof Error ? err.message : "Could not send audio");
          }
        },
        (err) => {
          setIsRecording(false);
          recordingSessionRef.current = null;
          setIsThinking(false);
          toast.error(err.message);
        }
      );
      recordingSessionRef.current = session;
      setIsRecording(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Microphone access denied");
    }
  }, [canInteract]);

  const stopRecording = useCallback(() => {
    recordingSessionRef.current?.stop();
  }, []);

  const toggleRecording = () => (isRecording ? stopRecording() : handleStartRecording());

  const progressPct = Math.min((messages.filter((m) => m.role === "user").length / 10) * 100, 100);

  const statusHint = isSpeaking
    ? `🔊 Speaking in ${capitalizeLang(nativeLang)}…`
    : isThinking
      ? "Priya is thinking…"
      : awaitingUser
        ? `Your turn — answer in ${capitalizeLang(targetLang)}`
        : "Listen to Priya, then the next step appears";

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="h-1 bg-brand transition-all" style={{ width: `${progressPct}%` }} />
      <header className="border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link to="/dashboard">
            <ArrowLeft className="w-5 h-5 text-body" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-purple-brand text-white flex items-center justify-center font-bold text-sm">
            {tutor.flag}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-heading text-sm truncate">{tutor.name}</div>
            <div className="text-xs text-muted-ink flex items-center gap-1 truncate">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isConnected ? "bg-success" : "bg-muted-ink"
                }`}
              />
              {isConnected ? statusHint : "Connecting…"} ·{" "}
              {lessonTitle || `Practicing ${capitalizeLang(targetLang)}`}
            </div>
          </div>
          <Link
            to="/conversations"
            className="p-2 text-muted-ink hover:text-brand"
            title="Past conversations"
          >
            <History className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-1 text-coral font-semibold">
            <Heart className="w-4 h-4 fill-coral" /> {hearts}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-4">
          {isConnected && (
            <div className="text-center">
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-purple-brand/10 text-purple-brand">
                {PHASE_LABELS[tutorPhase] || tutorPhase}
              </span>
            </div>
          )}

          {messages.length === 0 && !isThinking && !isSpeaking && isConnected && (
            <p className="text-center text-muted-ink py-8">
              Priya is preparing your lesson in {capitalizeLang(nativeLang)}… 👋
            </p>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="w-9 h-9 rounded-full bg-purple-brand text-white flex items-center justify-center text-lg shrink-0">
                  {tutor.flag}
                </div>
              )}

              <div className={`max-w-[80%] ${m.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`px-4 py-3 rounded-2xl inline-block text-left max-w-full ${
                    m.role === "ai"
                      ? "bg-white text-heading rounded-tl-none shadow-card"
                      : "bg-brand text-white rounded-tr-none"
                  }`}
                >
                  {m.role === "ai" ? (
                    <div className="space-y-2">
                      {m.phase && (
                        <span className="text-[10px] font-semibold uppercase text-purple-brand">
                          {PHASE_LABELS[m.phase] || m.phase}
                        </span>
                      )}
                      {m.messageNative && (
                        <p className="text-base leading-relaxed">
                          <span className="text-[10px] uppercase text-muted-ink block mb-0.5">
                            {capitalizeLang(nativeLang)} · spoken first
                          </span>
                          {m.messageNative}
                        </p>
                      )}
                      {m.messageTarget && (
                        <p className="text-base leading-relaxed font-medium text-brand">
                          <span className="text-[10px] uppercase text-muted-ink block mb-0.5">
                            {capitalizeLang(targetLang)}
                          </span>
                          {m.messageTarget}
                        </p>
                      )}
                      {!m.messageNative && !m.messageTarget && m.text}
                    </div>
                  ) : (
                    m.text
                  )}
                </div>

                {m.role === "ai" && (
                  <div className="mt-2 space-y-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        void speakBilingualAsync(
                          m.messageNative || "",
                          m.messageTarget || "",
                          nativeLang,
                          targetLang
                        )
                      }
                      className="text-xs text-muted-ink hover:text-brand flex items-center gap-1"
                    >
                      <Volume2 className="w-3 h-3" /> Replay ({capitalizeLang(nativeLang)} then{" "}
                      {capitalizeLang(targetLang)})
                    </button>

                    {m.languageTip && (
                      <div className="text-xs bg-purple-brand/10 text-purple-brand px-3 py-2 rounded-lg border border-purple-brand/20">
                        💡 {m.languageTip}
                      </div>
                    )}

                    {m.encouragement && (
                      <div className="text-xs font-semibold text-brand">{m.encouragement}</div>
                    )}

                    {m.evaluationNative && (
                      <div className="text-xs bg-mint px-3 py-2 rounded-lg border border-brand/20">
                        📝 {m.evaluationNative}
                      </div>
                    )}

                    {m.answerCorrect != null && (
                      <div
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg inline-block ${
                          m.answerCorrect
                            ? "bg-success/15 text-success"
                            : "bg-amber-brand/15 text-amber-brand"
                        }`}
                      >
                        {m.answerCorrect ? "✅ Correct!" : "↻ Try again — listen and repeat"}
                      </div>
                    )}

                    {m.pronunciationScore != null && (
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${
                          m.pronunciationScore >= 80
                            ? "bg-success/15 text-success"
                            : "bg-amber-brand/15 text-amber-brand"
                        }`}
                      >
                        🎯 {m.pronunciationScore}%{" "}
                        {m.pronunciationScore >= 80 ? "✅" : "↗ keep trying!"}
                      </div>
                    )}

                    {m.correctionNative && (
                      <div className="block px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 text-xs">
                        ✏️ {capitalizeLang(nativeLang)}: {m.correctionNative}
                      </div>
                    )}
                    {m.correctionTarget && (
                      <div className="block px-3 py-1.5 rounded-lg bg-red-50 text-red-800 text-xs">
                        ✏️ {capitalizeLang(targetLang)}: {m.correctionTarget}
                      </div>
                    )}

                    {m.newWord && (
                      <div className="inline-block px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-xs">
                        <div className="font-bold text-green-800">✨ {m.newWord.target}</div>
                        <div className="text-green-700">{m.newWord.native}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                  YOU
                </div>
              )}
            </div>
          ))}

          {isSpeaking && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-brand text-white flex items-center justify-center text-lg">
                {tutor.flag}
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white shadow-card flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-brand animate-pulse" />
                <span className="text-xs text-muted-ink">Speaking…</span>
              </div>
            </div>
          )}

          {isThinking && !isSpeaking && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-brand text-white flex items-center justify-center text-lg">
                {tutor.flag}
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white shadow-card flex gap-1.5 items-center">
                <span className="text-xs text-muted-ink mr-1">Thinking</span>
                {[0, 0.15, 0.3].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 rounded-full bg-brand animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-border-subtle bg-white p-3">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-[11px] text-muted-ink mb-2">{statusHint}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={!canInteract}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition active:scale-95 disabled:opacity-50 ${
                isRecording ? "bg-coral animate-pulse" : "bg-brand"
              }`}
            >
              {isRecording ? <Loader className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder={
                awaitingUser
                  ? `Answer in ${capitalizeLang(targetLang)}…`
                  : `Wait for Priya to finish speaking…`
              }
              disabled={!canInteract}
              className="flex-1 px-5 py-3 rounded-full bg-mint text-body placeholder:text-muted-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
            />
            <button
              type="button"
              onClick={sendText}
              disabled={!canInteract || !inputText.trim()}
              className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center active:scale-95 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
