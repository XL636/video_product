from app.services.generation.base_provider import BaseVideoProvider

QUALITY_TAGS = (
    "masterpiece, best quality, highly detailed, sharp focus, "
    "professional, 4k, anime screencap"
)

MOTION_TAGS = {
    "img2vid": "smooth motion, fluid animation, cinematic movement",
    "txt2vid": "dynamic scene, smooth animation, cinematic camera work",
    "vid2anime": "anime conversion, stylized animation, consistent style throughout",
    "story": "narrative flow, scene continuity, consistent characters",
}

NEGATIVE_DEFAULTS = (
    "low quality, worst quality, blurry, pixelated, distorted, deformed, "
    "bad anatomy, extra limbs, ugly, watermark, text, logo, signature, "
    "3d render, photorealistic, live action"
)


def enhance_prompt(
    prompt: str,
    style_preset: str,
    job_type: str = "txt2vid",
) -> str:
    """Enhance a user prompt with anime-specific quality and style keywords."""
    style_prefix = BaseVideoProvider.ANIME_STYLE_PRESETS.get(
        style_preset,
        BaseVideoProvider.ANIME_STYLE_PRESETS["ghibli"],
    )

    motion_tag = MOTION_TAGS.get(job_type, MOTION_TAGS["txt2vid"])

    parts = [
        style_prefix,
        QUALITY_TAGS,
        motion_tag,
        prompt.strip(),
    ]

    return ", ".join(part for part in parts if part)


def get_negative_prompt(user_negative: str = "") -> str:
    """Build a comprehensive negative prompt."""
    if user_negative:
        return f"{NEGATIVE_DEFAULTS}, {user_negative.strip()}"
    return NEGATIVE_DEFAULTS


def enhance_story_scene_prompt(
    scene_prompt: str,
    character_name: str | None,
    character_description: str | None,
    style_preset: str,
    scene_index: int,
    total_scenes: int,
    is_chained: bool = False,
) -> str:
    """Enhance a story scene prompt with character and continuity context.

    Args:
        is_chained: When True (coherent mode), adds I2V-aware continuity hints.
    """
    parts: list[str] = []

    style_prefix = BaseVideoProvider.ANIME_STYLE_PRESETS.get(
        style_preset,
        BaseVideoProvider.ANIME_STYLE_PRESETS["ghibli"],
    )
    parts.append(style_prefix)
    parts.append(QUALITY_TAGS)

    if character_name:
        char_context = f"featuring character {character_name}"
        if character_description:
            char_context += f" ({character_description})"
        parts.append(char_context)

    parts.append(f"scene {scene_index + 1} of {total_scenes}")

    # I2V-aware continuity hints for coherent mode
    if is_chained:
        if scene_index == 0:
            parts.append("opening scene, establishing shot")
        else:
            parts.append(
                "continuation from previous scene, "
                "maintain character appearance and color palette"
            )

    parts.append("consistent art style throughout")
    parts.append(scene_prompt.strip())

    return ", ".join(part for part in parts if part)
