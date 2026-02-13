from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


from app.models.user import User, UserApiKey  # noqa: E402, F401
from app.models.job import Job  # noqa: E402, F401
from app.models.video import Video  # noqa: E402, F401
from app.models.character import Character  # noqa: E402, F401
from app.models.story import Story, Scene  # noqa: E402, F401
