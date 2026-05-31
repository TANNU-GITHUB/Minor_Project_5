import { useState, useRef } from "react";
import { startRecording as beginMicCapture } from "@/lib/audioRecord";
import { Mic, Square, Volume2, Loader, CheckCircle, AlertCircle } from "lucide-react";
import { practicePhrase } from "@/lib/api";
import { capitalizeLang, speakBilingual, speakSlow } from "@/lib/languages";
import { toast } from "sonner";

export interface PhraseItem {
  target: string;
  native: string;
  pronunciation: string;
}

interface PhraseScore {
  score: number;
  passed: boolean;
  feedback_native?: string;
  feedback_target?: string;
  strength?: string;
  weakness?: string;
}

interface Props {
  lessonId: string;
  phraseIndex: number;
  phrase: PhraseItem;
  nativeLang: string;
  targetLang: string;
  existingScore?: PhraseScore;
  onScored: (result: PhraseScore & { phrase_index: number }) => void;
}

export function PhrasePracticeCard({
  lessonId,
  phraseIndex,
  phrase,
  nativeLang,
  targetLang,
  existingScore,
  onScored,
}: Props) {
  const [recording, setRecording] = useState(false);
  const [grading, setGrading] = useState(false);
  const [score, setScore] = useState<PhraseScore | null>(existingScore ?? null);
  const sessionRef = useRef<{ stop: () => void } | null>(null);

  const startRecord = async () => {
    try {
      const session = await beginMicCapture(
        async (blob) => {
          setRecording(false);
          sessionRef.current = null;
          setGrading(true);
          try {
            const result = await practicePhrase(lessonId, phraseIndex, blob);
            const rawScore = Number(result.score);
            const s: PhraseScore = {
              score: Number.isFinite(rawScore) ? Math.round(rawScore) : 0,
              passed: Boolean(result.passed),
              feedback_native: result.feedback_native,
              feedback_target: result.feedback_target,
              strength: result.strength,
              weakness: result.weakness,
            };
            setScore(s);
            onScored({ ...s, phrase_index: phraseIndex });
            if (result.transcript) {
              toast.message(`We heard: «${result.transcript}»`, { duration: 4000 });
            }
            if (result.error === "no_speech_detected") {
              toast.error("No speech detected — hold the mic longer and try again.");
            } else if (result.error === "audio_too_short") {
              toast.error("Recording too short — hold Say it for at least 1 second.");
            } else if (s.passed) {
              toast.success(`Phrase ${phraseIndex + 1} passed! 🎉 (${s.score}%)`);
            } else {
              toast.info(`Score ${s.score}% — listen and try again slowly`);
            }
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not grade phrase");
          } finally {
            setGrading(false);
          }
        },
        (err) => {
          setRecording(false);
          sessionRef.current = null;
          toast.error(err.message);
        }
      );
      sessionRef.current = session;
      setRecording(true);
    } catch {
      toast.error("Microphone access needed to practice phrases");
    }
  };

  const stopRecord = () => {
    sessionRef.current?.stop();
  };

  return (
    <div
      className={`bg-white border-2 rounded-2xl p-5 transition ${
        score?.passed
          ? "border-success shadow-card"
          : score
            ? "border-amber-brand"
            : "border-border-subtle"
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs font-semibold text-brand uppercase">
          {capitalizeLang(targetLang)}
        </span>
        {score?.passed && <CheckCircle className="w-5 h-5 text-success shrink-0" />}
      </div>

      <div className="text-xl font-bold text-heading mt-1 leading-snug">{phrase.target}</div>
      <div className="text-sm text-body mt-2 leading-relaxed">
        <span className="text-muted-ink text-xs block mb-0.5">
          {capitalizeLang(nativeLang)}
        </span>
        {phrase.native}
      </div>
      <div className="text-xs text-muted-ink italic mt-1">🔊 {phrase.pronunciation}</div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={() => speakBilingual(phrase.native, phrase.target, nativeLang, targetLang)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-tint text-brand text-xs font-semibold"
        >
          <Volume2 className="w-3 h-3" /> Listen (slow)
        </button>
        <button
          type="button"
          onClick={() => speakSlow(phrase.target, targetLang)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-mint text-body text-xs font-semibold"
        >
          {capitalizeLang(targetLang)} only
        </button>
        <button
          type="button"
          disabled={grading}
          onClick={() => (recording ? stopRecord() : startRecord())}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white ${
            recording ? "bg-coral animate-pulse" : "bg-brand"
          }`}
        >
          {grading ? (
            <Loader className="w-3 h-3 animate-spin" />
          ) : recording ? (
            <Square className="w-3 h-3" />
          ) : (
            <Mic className="w-3 h-3" />
          )}
          {grading ? "Checking…" : recording ? "Stop" : "Say it"}
        </button>
      </div>

      {score && (
        <div className="mt-4 space-y-2 text-sm border-t border-border-subtle pt-3">
          <div
            className={`font-bold ${score.passed ? "text-success" : "text-amber-brand"}`}
          >
            Score: {Math.round(score.score)}% {score.passed ? "✅" : "↗ try again"}
          </div>
          {score.feedback_native && (
            <p className="text-body">
              <span className="font-semibold">{capitalizeLang(nativeLang)}: </span>
              {score.feedback_native}
            </p>
          )}
          {score.feedback_target && (
            <p className="text-body">
              <span className="font-semibold">{capitalizeLang(targetLang)}: </span>
              {score.feedback_target}
            </p>
          )}
          {score.strength && (
            <p className="text-success text-xs">💪 {score.strength}</p>
          )}
          {score.weakness && !score.passed && (
            <p className="text-amber-brand text-xs flex gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> {score.weakness}
            </p>
          )}
          {!score.passed && score.score === 0 && (
            <p className="text-muted-ink text-xs">
              Tip: speak the {capitalizeLang(targetLang)} phrase on the card clearly for 1–2 seconds.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
