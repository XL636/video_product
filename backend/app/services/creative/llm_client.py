"""ZhiPu GLM Chat client — reuses the same API key as CogVideo."""

import logging

import httpx

logger = logging.getLogger(__name__)

ZHIPU_CHAT_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"


async def chat_completion(
    api_key: str,
    messages: list[dict],
    model: str = "glm-4-flash",
    temperature: float = 0.7,
) -> str:
    """Send a chat completion request to ZhiPu GLM and return the assistant reply."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(ZHIPU_CHAT_URL, json=payload, headers=headers)

    if response.status_code == 401:
        raise ValueError("智谱 API Key 无效或已过期，请在 Settings 页面检查 CogVideo API Key。")
    if response.status_code == 429:
        raise ValueError("智谱 API 请求频率超限，请稍后重试。")
    if response.status_code >= 400:
        detail = response.text[:200] if response.text else str(response.status_code)
        logger.error("ZhiPu API error %s: %s", response.status_code, detail)
        raise ValueError(f"智谱 API 调用失败 (HTTP {response.status_code})，请检查 API Key 或稍后重试。")

    data = response.json()
    return data["choices"][0]["message"]["content"]
