import logging
import boto3
import os
from uuid import uuid1 as uuid
import json

from crowd.backend.infrastructure.config import KUBE_MODE, IS_DEV_ENV, SQS_ENDPOINT_URL, SQS_REGION, \
    SQS_SECRET_ACCESS_KEY, SQS_ACCESS_KEY_ID

logger = logging.getLogger(__name__)


def string_converter(o):
    """
    Function that converts object to string
    This will be used when converting to Json, to convert non serializable attributes
    """
    return o.__str__()


class SQS:
    """
    Class to handle SQS requests. Can send and recieve messages.
    """

    def __init__(self, sqs_url):
        """
        Initialise class to handle SQS requests.

        Args:
            sqs_url (str): SQS url.
        """
        self.sqs_url = sqs_url
        # Otherwise from the environment files.

        # TODO-kube
        if KUBE_MODE:
            if IS_DEV_ENV:
                self.sqs = boto3.client("sqs",
                                        endpoint_url=SQS_ENDPOINT_URL,
                                        region_name=SQS_REGION,
                                        aws_secret_access_key=SQS_SECRET_ACCESS_KEY,
                                        aws_access_key_id=SQS_ACCESS_KEY_ID)
            else:
                self.sqs = boto3.client("sqs",
                                        region_name=SQS_REGION,
                                        aws_secret_access_key=SQS_SECRET_ACCESS_KEY,
                                        aws_access_key_id=SQS_ACCESS_KEY_ID)
        else:
            if os.environ.get("NODE_ENV") == "development":
                self.sqs = boto3.client(
                    "sqs",
                    region_name="eu-central-1",
                    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID_CROWD"),
                    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY_CROWD"),
                    endpoint_url=f'{os.environ.get("LOCALSTACK_HOSTNAME")}:{os.environ.get("LOCALSTACK_PORT")}'
                )
            else:
                self.sqs = boto3.client(
                    "sqs",
                    region_name="eu-central-1",
                    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID_CROWD"),
                    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY_CROWD"),
                )

    def send_message(self, body, id, deduplicationId, attributes=None):
        """
        Sent a message to the queue

        Args:
            body (dict): the body of the message.
            id (str): id of the message group
            attributes (dict, optional): attributes for the message. Defaults to {}.

        Returns:
            [type]: [description]
        """

        if not attributes:
            attributes = {}

        if type(body) is not str:
            body = json.dumps(body, default=string_converter)
        return self.sqs.send_message(
            QueueUrl=self.sqs_url,
            MessageAttributes=attributes,
            MessageBody=body,
            MessageGroupId=id,
            MessageDeduplicationId=deduplicationId,
        )

    def receive_message(self, delete=True, wait_time_seconds=0, visibility_timeout=60):
        """
        Receive a message from the queue.

        Args:
            delete (bool, optional): delete after receiving. Defaults to True.
            wait_time_seconds (int, optional): how long should the request wait for a queue message.
            visibility_timeout (int, optional): how long should the message be invisible to other receivers

        Returns:
            dict: The fetched message. If no messages, returns None.
        """
        response = self.sqs.receive_message(
            QueueUrl=self.sqs_url,
            MaxNumberOfMessages=1,
            MessageAttributeNames=["All"],
            VisibilityTimeout=visibility_timeout,
            WaitTimeSeconds=wait_time_seconds,
        )

        if "Messages" in response.keys():

            message = response["Messages"][0]
            receipt_handle = message["ReceiptHandle"]

            if delete:
                # Delete received message from queue
                self.sqs.delete_message(QueueUrl=self.sqs_url, ReceiptHandle=receipt_handle)
            return message

        return None

    def delete_message(self, receipt_handle):
        """
        Delete a message from the queue.
        Args:
            receipt_handle: (string, required): receipt handle from the SQS message

        Returns: None
        """
        self.sqs.delete_message(QueueUrl=self.sqs_url, ReceiptHandle=receipt_handle)

    @staticmethod
    def make_id():
        return str(uuid())
