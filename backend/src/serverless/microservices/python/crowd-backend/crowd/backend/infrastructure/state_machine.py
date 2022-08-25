# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

"""
Purpose

Shows how to use the AWS SDK for Python (Boto3) with AWS Step Functions to
create and run state machines.
"""

import json
import logging
from botocore.exceptions import ClientError
import boto3
import os

logger = logging.getLogger(__name__)


class StateMachine:
    """Encapsulates Step Functions state machine functions."""

    def __init__(self):
        """
        :param stepfunctions_client: A Boto3 Step Functions client.
        """
        if os.environ.get("NODE_ENV") == "development":
            self.stepfunctions_client = boto3.client(
                "stepfunctions",
                region_name="eu-central-1",
                aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID_CROWD"),
                aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY_CROWD"),
                endpoint_url=f'{os.environ.get("LOCALSTACK_HOSTNAME")}:{os.environ.get("LOCALSTACK_PORT")}'
            )
        else:
            self.stepfunctions_client = boto3.client(
                "stepfunctions",
                region_name="eu-central-1",
                aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID_CROWD"),
                aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY_CROWD"),
            )

        if (os.environ.get("ONBOARDING_STATE_MACHINE_ARN")):
            self.state_machine_arn = os.environ.get("ONBOARDING_STATE_MACHINE_ARN")
        else:
            # We cannot always have the ONBOARDING STATE MACHINE environment variable, because otherwise AWS complains about a circular dependency issue
            node_env = os.environ.get("NODE_ENV")
            stage = 'prod' if node_env == 'production' else 'staging' if node_env == 'staging' else 'local'
            self.state_machine_arn = f'arn:aws:states:{os.environ.get("CROWD_AWS_REGION")}:{os.environ.get("AWS_ACCOUNT_ID")}:stateMachine:stateMachine:OnboardingStateMachine{stage}'

    def start_run(self, run_name, run_input=None):
        """
        Starts a run with the current state definition.

        :param run_name: The name of the run. This name must be unique for all runs
                         for the state machine.
        :param run_input: Data that is passed as input to the run.
        :return: The ARN of the run.
        """
        if self.state_machine_arn is None:
            raise ValueError("state_machine_arn is not set")
        try:
            kwargs = {"stateMachineArn": self.state_machine_arn, "name": run_name}
            if run_input is not None:
                kwargs["input"] = json.dumps(run_input)
            response = self.stepfunctions_client.start_execution(**kwargs)
            run_arn = response["executionArn"]
            logger.info(f"Started run in {self.state_machine_arn} step function.")
        except ClientError:
            logger.exception("Couldn't start run %s.", run_name)
            raise
        else:
            return run_arn
