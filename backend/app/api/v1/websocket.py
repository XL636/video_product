import asyncio
import json
import logging
import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws/jobs/{user_id}")
async def websocket_job_updates(websocket: WebSocket, user_id: uuid.UUID) -> None:
    await websocket.accept()

    redis_client = aioredis.Redis.from_url(settings.REDIS_URL)
    pubsub = redis_client.pubsub()
    channel = f"job_updates:{user_id}"

    try:
        await pubsub.subscribe(channel)

        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, timeout=1.0
            )

            if message is not None and message["type"] == "message":
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                try:
                    parsed = json.loads(data)
                    await websocket.send_json(parsed)
                except (json.JSONDecodeError, ValueError):
                    await websocket.send_text(data)

            # Check if client sent anything (e.g., ping/pong or close)
            try:
                client_msg = await asyncio.wait_for(
                    websocket.receive_text(), timeout=0.01
                )
                # Handle ping from client
                if client_msg == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                pass
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for user %s", user_id)
    except Exception:
        logger.exception("WebSocket error for user %s", user_id)
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()
        await redis_client.close()
