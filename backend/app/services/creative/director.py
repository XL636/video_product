"""Creative Director — orchestrates the 3-agent pipeline.

Agent 1 (Consultant): converses with user, outputs concept brief
Agent 2 (Storyboarder): turns concept brief into cinematic storyboard
Agent 3 (Prompt Engineer): optimizes prompts for Seedance 1.5
"""

from __future__ import annotations

import json
import logging
import re

from app.services.creative.agents.consultant import CONSULTANT_PROMPT
from app.services.creative.agents.prompt_engineer import PROMPT_ENGINEER_PROMPT
from app.services.creative.agents.storyboarder import STORYBOARDER_PROMPT
from app.services.creative.llm_client import chat_completion

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Extraction helpers
# ---------------------------------------------------------------------------

def extract_concept_brief(text: str) -> dict | None:
    """Extract JSON from a ```concept_brief code block."""
    pattern = r"```concept_brief\s*\n?(.*?)\n?\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(1))
        if data.get("concept_brief"):
            return data
        return None
    except json.JSONDecodeError:
        logger.warning("Failed to parse concept brief JSON from LLM reply")
        return None


def extract_storyboard_json(text: str) -> dict | None:
    """Extract JSON storyboard from a ```json code block in the LLM reply."""
    pattern = r"```json\s*\n?(.*?)\n?\s*```"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        logger.warning("Failed to parse storyboard JSON from LLM reply")
        return None


# ---------------------------------------------------------------------------
# Individual agent calls
# ---------------------------------------------------------------------------

async def _consultant_chat(
    api_key: str,
    conversation_history: list[dict],
    user_message: str,
) -> str:
    """Agent 1: Creative Consultant — conversational, temperature 0.7."""
    messages = [{"role": "system", "content": CONSULTANT_PROMPT}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})
    return await chat_completion(api_key, messages, temperature=0.7)


async def _storyboarder_generate(api_key: str, concept_brief: dict) -> dict:
    """Agent 2: Storyboard Director — single call, temperature 0.5."""
    messages = [
        {"role": "system", "content": STORYBOARDER_PROMPT},
        {"role": "user", "content": json.dumps(concept_brief, ensure_ascii=False)},
    ]
    reply = await chat_completion(api_key, messages, temperature=0.5)
    storyboard = extract_storyboard_json(reply)
    if storyboard is None:
        logger.error("Storyboarder failed to produce valid JSON, returning raw reply")
        raise ValueError("Storyboard agent did not return valid JSON")
    return storyboard


async def _prompt_engineer_optimize(api_key: str, storyboard: dict) -> dict:
    """Agent 3: Prompt Engineer — single call, temperature 0.3."""
    messages = [
        {"role": "system", "content": PROMPT_ENGINEER_PROMPT},
        {"role": "user", "content": json.dumps(storyboard, ensure_ascii=False)},
    ]
    reply = await chat_completion(api_key, messages, temperature=0.3)
    optimized = extract_storyboard_json(reply)
    if optimized is None:
        logger.warning("Prompt engineer failed to produce valid JSON, using original storyboard")
        return storyboard
    return optimized


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def creative_chat(
    api_key: str,
    conversation_history: list[dict],
    user_message: str,
) -> tuple[str, dict | None]:
    """Run one round of creative dialogue.

    Most of the time only Agent 1 runs. When Agent 1 outputs a concept brief,
    the pipeline automatically chains Agent 2 → Agent 3 and returns the final
    storyboard.

    Returns (ai_reply_text, storyboard_dict_or_none).
    """
    # Always talk through Agent 1 (Creative Consultant)
    reply = await _consultant_chat(api_key, conversation_history, user_message)

    # Check if Agent 1 produced a concept brief
    concept = extract_concept_brief(reply)
    if not concept:
        return reply, None  # Still in conversation phase

    logger.info("Concept brief detected — triggering storyboard pipeline")

    # Agent 2: Storyboard Director
    storyboard_raw = await _storyboarder_generate(api_key, concept)

    # Agent 3: Prompt Engineer
    storyboard_final = await _prompt_engineer_optimize(api_key, storyboard_raw)

    return reply, storyboard_final
