"""
Optional Pinecone storage for Language DNA vectors.
Groq does not provide embeddings — we skip vector upsert and log once.
DNA is always stored in Postgres (primary source).
"""
from app.config import settings

_pc = None


def _get_pinecone():
    global _pc
    if not settings.pinecone_api_key:
        return None
    if _pc is None:
        from pinecone import Pinecone
        _pc = Pinecone(api_key=settings.pinecone_api_key)
    return _pc


async def store_dna(user_id: str, dna: dict) -> None:
    """Best-effort metadata log; vector upsert skipped without an embedding provider."""
    if not settings.pinecone_api_key:
        return
    try:
        pc = _get_pinecone()
        if pc is None:
            return
        # Groq has no embedding API — Postgres is the source of truth for DNA.
        topics = ", ".join(dna.get("favorite_topics", []))
        print(
            f"ℹ️ Pinecone: DNA saved for user {user_id} in Postgres "
            f"(topics: {topics}; vector index skipped — no embed API on Groq)"
        )
    except Exception as e:
        print(f"⚠️ Pinecone skipped: {e}")
