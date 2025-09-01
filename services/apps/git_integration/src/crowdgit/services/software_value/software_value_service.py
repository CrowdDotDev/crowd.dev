from crowdgit.services.base.base_service import BaseService
from crowdgit.services.utils import run_shell_command
from crowdgit.models.service_execution import ServiceExecution
from crowdgit.enums import ExecutionStatus, ErrorCode, OperationType
from crowdgit.database.crud import save_service_execution
from crowdgit.errors import CrowdGitError
import json
import time
from decimal import Decimal


class SoftwareValueService(BaseService):
    """Service for calculating software value metrics"""

    def __init__(self):
        super().__init__()
        # software-value binary path was defined during Docker build
        self.software_value_executable = "/usr/local/bin/software-value"

    async def run(self, repo_id: str, repo_path: str) -> None:
        """
        Triggers software value binary for given repo.
        Results are saved into insights database directly
        """
        start_time = time.time()
        execution_status = ExecutionStatus.SUCCESS
        error_code = None
        error_message = None

        try:
            self.logger.info("Running software value...")
            output = await run_shell_command([self.software_value_executable, repo_path])
            self.logger.info(f"Software value output: {output}")

            # Parse JSON output and extract fields from StandardResponse structure
            json_output = json.loads(output)
            status = json_output.get("status")

            if status == "success":
                execution_status = ExecutionStatus.SUCCESS
            else:
                execution_status = ExecutionStatus.FAILURE
                error_code = json_output.get("error_code")
                error_message = json_output.get("error_message")
                self.logger.error(
                    f"Software value processing failed: {error_message} (code: {error_code})"
                )

        except Exception as e:
            execution_status = ExecutionStatus.FAILURE
            error_code = ErrorCode.UNKNOWN.value
            error_message = repr(e)
            self.logger.error(f"Software value processing failed with unexpected error: {repr(e)}")
        finally:
            end_time = time.time()
            execution_time = Decimal(str(round(end_time - start_time, 2)))

            service_execution = ServiceExecution(
                repo_id=repo_id,
                operation_type=OperationType.SOFTWARE_VALUE,
                status=execution_status,
                error_code=error_code,
                error_message=error_message,
                execution_time_sec=execution_time,
            )
            await save_service_execution(service_execution)
