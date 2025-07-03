import json
import boto3
from crowdgit.logger import get_logger
from pydantic import BaseModel, ValidationError
from typing import Generic, TypeVar
from threading import Semaphore

T = TypeVar("T", bound=BaseModel)


class BedrockResponse(BaseModel, Generic[T]):
    output: T
    cost: float


logger = get_logger(__name__)
semaphore = Semaphore(2)


def invoke_bedrock(
    instructions, pydantic_model: type[T], replacements=None, max_tokens=120000, temperature=0
) -> BedrockResponse[T]:
    bedrock_client = boto3.client(service_name="bedrock-runtime", region_name="us-east-1")

    # Join the instructions into a single string
    instruction = (
        "Human:" + "\n".join(instructions) + '\n"""\nAnswer in JSON formatAssistant:{\n"""'
    )

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
        modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0"
        accept = "application/json"
        contentType = "application/json"
        with semaphore:
            response = bedrock_client.invoke_model(
                body=body, modelId=modelId, accept=accept, contentType=contentType
            )
        try:
            response_body = json.loads(response.get("body").read())
            output = json.loads(response_body["content"][0]["text"].replace('"""', ""))

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
            logger.error(f"Failed to parse the response as JSON. Raw response:")
            logger.error(response_body["content"][0]["text"])
            raise e
    except Exception as e:
        logger.error(f"Amazon Bedrock API error: {e}")
        raise e
