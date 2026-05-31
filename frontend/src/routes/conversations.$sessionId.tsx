import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getConversation, UserSession, type ConversationDetail } from "@/lib/api";
import { requireAppAccess } from "@/lib/guards";
import { capitalizeLang } from "@/lib/languages";

export const Route = createFileRoute("/conversations/$sessionId")({
  head: () => ({ meta: [{ title: "Chat — TongueBridge" }] }),
  beforeLoad: requireAppAccess,
  component: ConversationDetailPage,
});

function ConversationDetailPage() {
  const { sessionId } = Route.useParams();
  const [data, setData] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const nativeLang = UserSession.getNativeLang();
  const targetLang = UserSession.getTargetLang();

  useEffect(() => {
    const load = async () => {
      try {
        setData(await getConversation(sessionId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load chat");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-border-subtle shrink-0">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link to="/conversations">
            <ArrowLeft className="w-5 h-5 text-body" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-heading text-sm truncate">
              {data?.lesson_title || "Chat"}
            </h1>
            <p className="text-xs text-muted-ink">
              {data?.created_at ? new Date(data.created_at).toLocaleString() : ""}
            </p>
          </div>
          <Link
            to="/conversation"
            className="text-xs font-semibold text-brand whitespace-nowrap"
          >
            New chat
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-5 py-6 space-y-4">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-ink" />
            </div>
          )}
          {error && <p className="text-coral text-sm">{error}</p>}

          {data?.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "bg-brand text-white rounded-tr-none"
                    : "bg-white shadow-card text-heading rounded-tl-none"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="space-y-2">
                    {m.phase && (
                      <span className="text-[10px] uppercase text-muted-ink block">
                        {m.phase.replace("_", " ")}
                      </span>
                    )}
                    {m.message_native && (
                      <p>
                        <span className="text-[10px] text-muted-ink block">
                          {capitalizeLang(nativeLang)}
                        </span>
                        {m.message_native}
                      </p>
                    )}
                    {m.message_target && (
                      <p className="text-brand font-medium">
                        <span className="text-[10px] text-muted-ink block">
                          {capitalizeLang(targetLang)}
                        </span>
                        {m.message_target}
                      </p>
                    )}
                    {!m.message_native && !m.message_target && m.content}
                    {m.evaluation_native && (
                      <p className="text-xs bg-mint/50 px-2 py-1 rounded">{m.evaluation_native}</p>
                    )}
                    {m.pronunciation_score != null && (
                      <span className="text-xs font-semibold text-brand">
                        Score: {m.pronunciation_score}%
                      </span>
                    )}
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
