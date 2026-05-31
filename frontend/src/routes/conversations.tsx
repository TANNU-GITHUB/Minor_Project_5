import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import { listConversations, UserSession, type ConversationSummary } from "@/lib/api";
import { requireAppAccess } from "@/lib/guards";
import { capitalizeLang } from "@/lib/languages";

export const Route = createFileRoute("/conversations")({
  head: () => ({ meta: [{ title: "Chat history — TongueBridge" }] }),
  beforeLoad: requireAppAccess,
  component: ConversationsPage,
});

function ConversationsPage() {
  const [sessions, setSessions] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await listConversations(UserSession.getId());
        setSessions(data.sessions);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load chats");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link to="/dashboard">
            <ArrowLeft className="w-5 h-5 text-body" />
          </Link>
          <MessageSquare className="w-5 h-5 text-brand" />
          <h1 className="font-semibold text-heading">Past conversations</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <p className="text-sm text-muted-ink mb-4">
          Every tutor session with {capitalizeLang(UserSession.getTargetLang())} is saved
          automatically when you leave the chat.
        </p>

        {loading && (
          <div className="flex justify-center py-12 text-muted-ink">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-coral text-sm bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-card">
            <p className="text-muted-ink mb-4">No saved chats yet.</p>
            <Link
              to="/conversation"
              className="inline-block px-5 py-2.5 rounded-full bg-brand text-white font-semibold text-sm"
            >
              Start a tutor session
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                to="/conversations/$sessionId"
                params={{ sessionId: s.id }}
                className="block bg-white rounded-2xl shadow-card p-4 hover:ring-2 hover:ring-brand/30 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-heading text-sm truncate">
                      {s.lesson_title}
                    </div>
                    <div className="text-xs text-muted-ink mt-0.5">
                      {s.created_at
                        ? new Date(s.created_at).toLocaleString()
                        : "—"}{" "}
                      · {s.message_count} messages
                      {s.pronunciation_score > 0 &&
                        ` · ${Math.round(s.pronunciation_score)}% avg`}
                    </div>
                    {s.preview && (
                      <p className="text-sm text-body mt-2 line-clamp-2">{s.preview}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-ink shrink-0 mt-1" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
