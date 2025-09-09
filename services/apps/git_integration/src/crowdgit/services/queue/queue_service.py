from crowdgit.services.base.base_service import BaseService
from aiokafka import AIOKafkaProducer
import asyncio
import json
import ssl
from typing import List, Dict
from crowdgit.settings import (
    CROWD_KAFKA_TOPIC,
    CROWD_KAFKA_BROKERS,
    CROWD_KAFKA_EXTRA,
)
from crowdgit.errors import QueueConnectionError, QueueMessageProduceError


class QueueService(BaseService):
    _CLIENT_ID = "git-integration-v2"

    def __init__(self):
        super().__init__()
        self.kafka_topic = CROWD_KAFKA_TOPIC
        self.kafka_producer = AIOKafkaProducer(**self._build_kafka_config())
        self._connected = False

    def _build_kafka_config(self):
        """Build Kafka configuration with SSL support (same as test script)"""
        config = {
            "bootstrap_servers": CROWD_KAFKA_BROKERS,
            "client_id": self._CLIENT_ID,
            "acks": "all",
        }

        # Parse extra configuration from kafkajs config
        extra_config = json.loads(CROWD_KAFKA_EXTRA)

        if extra_config.get("ssl"):
            config["security_protocol"] = "SASL_SSL"
            ssl_context = ssl.create_default_context()
            config["ssl_context"] = ssl_context
        else:
            config["security_protocol"] = "SASL_PLAINTEXT"

        sasl_config = extra_config["sasl"]
        config["sasl_mechanism"] = sasl_config["mechanism"].upper()
        config["sasl_plain_username"] = sasl_config["username"]
        config["sasl_plain_password"] = sasl_config["password"]

        return config

    async def ensure_connected(self):
        """Ensure connection is established and healthy"""
        if not self._connected or not await self._is_connection_healthy():
            if self._connected:
                self.logger.info("Connection unhealthy, reconnecting...")
                await self.disconnect()
            await self.connect()

    async def _is_connection_healthy(self) -> bool:
        """Check if the current connection is healthy"""
        try:
            # Test connection by fetching metadata - this will fail if connection is broken
            await self.kafka_producer.client.fetch_all_metadata()
            return True
        except Exception:
            return False

    async def connect(self):
        if self._connected:
            return
        self.logger.info("Connecting to kafka...")
        try:
            await self.kafka_producer.start()
            self.logger.info("Connected to kafka")
            self._connected = True
        except Exception as e:
            self.logger.error(f"Queue connection failed: {e}")
            raise QueueConnectionError()

    async def disconnect(self):
        if self._connected:
            try:
                await self.kafka_producer.stop()
                self.logger.info("Disconnected from kafka")
            except Exception as e:
                self.logger.error(f"Error during disconnect: {e}")
            finally:
                self._connected = False

    async def send_message(self, message_id: str, payload: str):
        """Send a single message to Kafka in a non-blocking way"""
        await self.ensure_connected()
        try:
            await self.kafka_producer.send(
                topic=self.kafka_topic,
                key=message_id.encode("utf-8"),
                value=payload.encode("utf-8"),
            )
        except Exception as e:
            self.logger.error(f"Failed to emit message {message_id} to queue with error: {e}")
            raise QueueMessageProduceError()

    async def send_batch_activities(self, activities_kafka: List[Dict[str, str]]):
        """
        Send multiple pre-prepared activities to Kafka in a non-blocking way.
        Args:
            activities_kafka: List of dicts with 'message_id' and 'payload' keys
                             (prepared by CommitService.prepare_activity_for_db_and_queue)
        """
        await self.ensure_connected()
        self.logger.info(f"Emitting {len(activities_kafka)} activities to kafka queue...")
        await asyncio.gather(
            *[
                self.send_message(activity_kafka["message_id"], activity_kafka["payload"])
                for activity_kafka in activities_kafka
            ]
        )
        self.logger.info(f"Successfully emitted {len(activities_kafka)} activities to queue")
