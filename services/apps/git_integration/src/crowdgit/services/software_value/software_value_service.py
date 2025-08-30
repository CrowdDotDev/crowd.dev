from crowdgit.services.base.base_service import BaseService
from crowdgit.services.utils import run_shell_command
import json


class SoftwareValueService(BaseService):
    """Service for calculating software value metrics"""

    def __init__(self):
        super().__init__()
        # software-value binary path was defined during Docker build
        self.software_value_executable = "/usr/local/bin/software-value"

    async def run(self, repo_path: str):
        """
        Triggers software value binary for given repo.
        Results are saved into insights database directly
        """
        try:
            self.logger.info("Running software value...")
            output = await run_shell_command([self.software_value_executable, repo_path])
            self.logger.info(f"Software value output: {output}")
            # json_output = json.loads(output)
        except Exception as e:
            self.logger.error(f"Failed to run software-value with error: {repr(e)}")
