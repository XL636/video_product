from app.services.generation.base_provider import BaseVideoProvider
from app.services.generation.cogvideo import CogVideoProvider
from app.services.generation.comfyui import ComfyUIProvider
from app.services.generation.hailuo import JimengProvider, ViduProvider
from app.services.generation.kling import KlingProvider


def get_provider(provider_name: str, api_key: str = "") -> BaseVideoProvider:
    """Create and return the appropriate video generation provider."""
    providers: dict[str, type[BaseVideoProvider]] = {
        "kling": KlingProvider,
        "jimeng": JimengProvider,
        "vidu": ViduProvider,
        "cogvideo": CogVideoProvider,
        "comfyui": ComfyUIProvider,
    }

    provider_class = providers.get(provider_name)
    if provider_class is None:
        raise ValueError(
            f"Unknown provider: {provider_name}. "
            f"Available providers: {', '.join(providers.keys())}"
        )

    return provider_class(api_key)
