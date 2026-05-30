from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # AI
    groq_api_key: str = ""
    elevenlabs_api_key: str = ""
    pinecone_api_key: str = ""
    pinecone_env: str = "gcp-starter"

    # Database
    database_url: str
    redis_url: str = "redis://redis:6379"

    # App
    frontend_url: str = "http://localhost:5173"
    # Set MOCK_ANALYSIS=true to skip Whisper/Claude (local dev without API credits)
    mock_analysis: bool = False

    # AWS
    aws_region: str = "ap-south-1"
    s3_bucket_name: str = "tonguebridge-audio"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()