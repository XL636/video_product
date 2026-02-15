from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/anime_video_gen"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ENCRYPTION_KEY: str = ""  # Fernet key, auto-generated if empty
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_PUBLIC_ENDPOINT: str = ""  # Public URL for browser access; defaults to MINIO_ENDPOINT
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "anime-video-gen"
    MINIO_SECURE: bool = False

    @property
    def minio_public_url_base(self) -> str:
        endpoint = self.MINIO_PUBLIC_ENDPOINT or self.MINIO_ENDPOINT
        scheme = "https" if self.MINIO_SECURE else "http"
        return f"{scheme}://{endpoint}"
    COMFYUI_URL: str = "http://localhost:8188"
    DEBUG: bool = False

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    ALGORITHM: str = "HS256"

    @property
    def celery_broker_url(self) -> str:
        return self.REDIS_URL

    @property
    def celery_result_backend(self) -> str:
        return self.REDIS_URL


settings = Settings()
