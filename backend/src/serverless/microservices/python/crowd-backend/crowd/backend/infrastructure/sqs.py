import logging
import boto3
import os
from uuid import uuid1 as uuid
import json

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

    def receive_message(self, delete=True):
        """
        Receive a message from the queue.

        Args:
            delete (bool, optional): delete after receiving. Defaults to True.

        Returns:
            dict: The fetched message. If no messaes, returns False.
        """
        response = self.sqs.receive_message(
            QueueUrl=self.sqs_url,
            MaxNumberOfMessages=1,
            MessageAttributeNames=["All"],
            VisibilityTimeout=60,
            WaitTimeSeconds=0,
        )

        if "Messages" in response.keys():

            message = response["Messages"][0]
            receipt_handle = message["ReceiptHandle"]

            if delete:
                # Delete received message from queue
                self.sqs.delete_message(QueueUrl=self.sqs_url, ReceiptHandle=receipt_handle)
            return message

        return False

    @staticmethod
    def make_id():
        return str(uuid())
