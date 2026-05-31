import { useState, useEffect, useRef } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import {
  NATIVE_LANGUAGE_OPTIONS,
  TARGET_LANGUAGE_OPTIONS,
  capitalizeLang,
  getLangFlag,
} from "@/lib/languages";
import { uploadVoice, UserSession } from "@/lib/api";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — TongueBridge" }] }),
  beforeLoad: () => {
    if (!UserSession.isLoggedIn()) {
      throw redirect({ to: "/signup" });
    }
  },
  component: Onboarding,
});

function Onboarding() {
  const [step, setStep] = useState(1);
  const [native, setNative] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= n ? "bg-brand text-white" : "bg-border-subtle text-muted-ink"
                }`}
              >
                {n}
              </div>
              {n < 3 && (
                <div className={`w-12 h-0.5 ${step > n ? "bg-brand" : "bg-border-subtle"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-ink mb-6">
          Step {step} of 3 —{" "}
          {step === 1 ? "Your language" : step === 2 ? "Language to learn" : "Voice DNA"}
        </p>

        {step === 1 && (
          <Picker
            title="What language do you speak at home?"
            sub="We'll analyze your natural speaking style in this language"
            items={NATIVE_LANGUAGE_OPTIONS.map((l) => ({
              name: l.name,
              key: l.key,
              flag: l.flag,
            }))}
            value={native}
            onChange={setNative}
            onNext={() => {
              if (native) {
                UserSession.setLanguages(native, UserSession.getTargetLang() || "");
                setStep(2);
              }
            }}
          />
        )}
        {step === 2 && (
          <Picker
            title="Which language do you want to master?"
            sub="Your lessons, phrases, and AI tutor will use this language only"
            items={TARGET_LANGUAGE_OPTIONS.filter((l) => l.key !== native).map((l) => ({
              name: l.name,
              key: l.key,
              flag: l.flag,
              sub: l.sub,
            }))}
            value={target}
            onChange={setTarget}
            onNext={() => {
              if (target && native) {
                if (target === native) {
                  toast.error("Pick a different language to learn than your native language.");
                  return;
                }
                UserSession.setLanguages(native, target);
                setStep(3);
              }
            }}
          />
        )}
        {step === 3 && native && target && (
          <RecordStep nativeLang={native} targetLang={target} />
        )}
      </div>
    </div>
  );
}

function Picker({
  title,
  sub,
  items,
  value,
  onChange,
  onNext,
}: {
  title: string;
  sub: string;
  items: { name: string; key: string; flag: string; sub?: string }[];
  value: string | null;
  onChange: (key: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 className="text-3xl md:text-4xl font-extrabold text-heading text-center">{title}</h2>
      <p className="text-center text-body mt-2">{sub}</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            className={`p-5 rounded-2xl border-2 flex items-center gap-3 text-left transition ${
              value === it.key
                ? "border-brand bg-brand-tint"
                : "border-border-subtle bg-white hover:border-brand/40"
            }`}
          >
            <span className="text-3xl">{it.flag}</span>
            <div>
              <div className="font-semibold text-heading">{it.name}</div>
              {it.sub && <div className="text-xs text-muted-ink">{it.sub}</div>}
            </div>
            {value === it.key && <span className="ml-auto text-brand">✓</span>}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={!value}
        className="mt-8 w-full px-6 py-3.5 rounded-full bg-brand text-white font-semibold disabled:bg-border-subtle disabled:text-muted-ink active:scale-95 transition"
      >
        Continue
      </button>
    </>
  );
}

function RecordStep({ nativeLang, targetLang }: { nativeLang: string; targetLang: string }) {
  const [rec, setRec] = useState(false);
  const [time, setTime] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const nav = useNavigate();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const MSGS = [
    "Transcribing your speech...",
    "Mapping your vocabulary...",
    "Detecting your humor & tone...",
    `Building your ${capitalizeLang(targetLang)} curriculum...`,
  ];

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setTime((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  useEffect(() => {
    if (!analyzing) return;
    const t = setInterval(() => setMsgIdx((i) => i + 1), 700);
    return () => clearInterval(t);
  }, [analyzing]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAnalyzing(true);
        setUploading(true);

        try {
          const userId = UserSession.getId();
          const result = await uploadVoice(blob, nativeLang, targetLang, userId);
          UserSession.saveDNA(result);
          UserSession.setOnboardingComplete(true);
          setTimeout(() => nav({ to: "/dna-results" }), 2500);
        } catch (err) {
          setAnalyzing(false);
          setUploading(false);
          toast.error(err instanceof Error ? err.message : "Voice analysis failed");
        }
      };

      recorder.start();
      setRec(true);
      setTime(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state !== "inactive") {
      recorderRef.current?.stop();
      setRec(false);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-3xl md:text-4xl font-extrabold text-heading">
        Speak naturally for 30–60 seconds
      </h2>
      <p className="text-body mt-3 max-w-xl mx-auto">
        Talk in <strong>{capitalizeLang(nativeLang)}</strong> about your life, hobbies, or dreams.
        We&apos;ll build a <strong>{capitalizeLang(targetLang)}</strong> {getLangFlag(targetLang)} plan
        matched to <em>your</em> tone.
      </p>
      <span className="inline-block mt-3 px-3 py-1 rounded-full bg-brand-tint text-brand text-xs font-semibold">
        🔒 Audio is analyzed, not stored
      </span>

      <div className="mt-12 flex flex-col items-center">
        <button
          type="button"
          onClick={() => (rec ? stopRecording() : startRecording())}
          disabled={uploading}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center transition active:scale-95 disabled:opacity-50 ${
            rec ? "bg-coral text-white" : "bg-white border-4 border-brand text-brand"
          }`}
        >
          {rec ? <Square className="w-9 h-9 fill-white" /> : <Mic className="w-10 h-10" />}
        </button>

        {rec && (
          <div className="mt-4 text-3xl font-mono text-heading">
            {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
          </div>
        )}

        {analyzing && (
          <div className="mt-6">
            <p className="text-heading font-semibold">Creating your Language DNA 🧬</p>
            <p className="text-sm text-muted-ink mt-1">{MSGS[msgIdx % MSGS.length]}</p>
          </div>
        )}
      </div>
    </div>
  );
}
