import json
from typing import Generic, TypeVar

import aioboto3
from botocore.config import Config
from pydantic import BaseModel, ValidationError

from crowdgit.logger import logger
from crowdgit.settings import (
    CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
    CROWD_AWS_BEDROCK_REGION,
    CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
)

T = TypeVar("T", bound=BaseModel)


class BedrockResponse(BaseModel, Generic[T]):
    output: T
    cost: float


async def invoke_bedrock(
    instruction, pydantic_model: type[T], replacements=None, max_tokens=65000, temperature=0
) -> BedrockResponse[T]:
    session = aioboto3.Session(
        aws_access_key_id=CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
        aws_secret_access_key=CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
    )

    async with session.client(
        service_name="bedrock-runtime",
        region_name=CROWD_AWS_BEDROCK_REGION,
        config=Config(
            read_timeout=300,  # 5 minutes timeout for reading response
            connect_timeout=60,  # 1 minute timeout for connection
            retries={"max_attempts": 3},  # Retry failed requests
        ),
    ) as bedrock_client:
        # Apply replacements to the instruction string
        if replacements:
            for key, value in replacements.items():
                if not key.startswith("{") and not key.endswith("}"):
                    key = "{" + key + "}"
                if key in instruction:
                    if isinstance(value, list):
                        value = ", ".join(map(str, value))
                    elif isinstance(value, dict):
                        value = json.dumps(value)
                    instruction = instruction.replace(key, value)
                else:
                    raise ValueError(f"Replacement key '{key}' not found in the instruction")

        body = json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "system": "You are a precise JSON extraction assistant. You MUST respond with valid JSON only. Never use markdown formatting, code blocks, or any additional text. Your response must be parseable by json.loads() directly.",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": instruction,
                            },
                        ],
                    }
                ],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }
        )

        try:
            modelId = "anthropic.claude-sonnet-4-5-20250929-v1:0"
            accept = "application/json"
            contentType = "application/json"
            response = await bedrock_client.invoke_model(
                body=body, modelId=modelId, accept=accept, contentType=contentType
            )

            try:
                body_bytes = await response["body"].read()
                response_body = json.loads(body_bytes.decode("utf-8"))
                raw_text = response_body["content"][0]["text"].replace('"""', "").strip()

                # Expect pure JSON - no markdown handling
                output = json.loads(raw_text)

                # Calculate cost
                input_tokens = response_body["usage"]["input_tokens"]
                output_tokens = response_body["usage"]["output_tokens"]
                input_cost = (input_tokens / 1000) * 0.003
                output_cost = (output_tokens / 1000) * 0.015
                total_cost = input_cost + output_cost

                # Validate output with the provided model if it exists
                try:
                    validated_output = pydantic_model.model_validate(output, strict=True)
                except ValidationError as ve:
                    logger.error(f"Output validation failed: {ve}")
                    raise ve

                return BedrockResponse[T](output=validated_output, cost=total_cost)
            except Exception as e:
                logger.error("Failed to parse the response as JSON. Raw response:")
                logger.error(response_body["content"][0]["text"])
                raise e
        except Exception as e:
            logger.error(f"Amazon Bedrock API error: {e}")
            raise e
