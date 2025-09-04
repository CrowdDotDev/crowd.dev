from pydantic import BaseModel
from typing import Optional, List, Literal


class MaintainerFile(BaseModel):
    file_name: Optional[str] = None
    error: Optional[str] = None


class MaintainerInfoItem(BaseModel):
    github_username: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    normalized_title: Optional[Literal["maintainer", "contributor"]] = None


class MaintainerInfo(BaseModel):
    info: Optional[list[MaintainerInfoItem]] = None
    error: Optional[str] = None


class AggregatedMaintainerInfoItems(BaseModel):
    info: List[MaintainerInfoItem]


class AggregatedMaintainerInfo(BaseModel):
    output: AggregatedMaintainerInfoItems
    cost: float


class MaintainerResult(BaseModel):
    maintainer_file: Optional[str] = None
    maintainer_info: Optional[List[MaintainerInfoItem]] = None
    total_cost: float = 0
