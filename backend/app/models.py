from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email        = Column(String, unique=True, nullable=False)
    name         = Column(String, default="")
    native_lang  = Column(String, default="hindi")
    target_lang  = Column(String, default="spanish")
    plan         = Column(String, default="free")   # "free" | "pro"
    streak_days  = Column(Integer, default=0)
    created_at   = Column(DateTime, server_default=func.now())

class LanguageDNA(Base):
    __tablename__ = "language_dna"
    id                    = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id               = Column(UUID(as_uuid=True), nullable=False)
    vocabulary_richness   = Column(Float, default=5.0)
    formality_level       = Column(Float, default=5.0)
    humor_style           = Column(String, default="none")
    sentence_complexity   = Column(Float, default=5.0)
    fluency_score         = Column(Float, default=5.0)
    cultural_richness     = Column(Float, default=5.0)
    favorite_topics       = Column(JSON, default=list)
    communication_patterns= Column(JSON, default=list)
    cultural_references   = Column(JSON, default=list)
    teaching_persona      = Column(Text, default="")
    raw_transcript        = Column(Text, default="")
    created_at            = Column(DateTime, server_default=func.now())

class Lesson(Base):
    __tablename__ = "lessons"
    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id     = Column(UUID(as_uuid=True), nullable=False)
    week_number = Column(Integer, default=1)
    day_number  = Column(Integer, default=1)
    title       = Column(String, default="")
    theme       = Column(String, default="")
    content     = Column(JSON, default=dict)
    completed   = Column(Boolean, default=False)
    score       = Column(Float, default=0.0)
    created_at  = Column(DateTime, server_default=func.now())

class ConversationSession(Base):
    __tablename__ = "conversation_sessions"
    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id            = Column(UUID(as_uuid=True), nullable=False)
    lesson_id          = Column(UUID(as_uuid=True), nullable=True)
    messages           = Column(JSON, default=list)
    pronunciation_score= Column(Float, default=0.0)
    words_learned      = Column(JSON, default=list)
    duration_seconds   = Column(Integer, default=0)
    session_review     = Column(JSON, default=dict)
    created_at         = Column(DateTime, server_default=func.now())