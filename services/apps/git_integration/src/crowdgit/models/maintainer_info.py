from typing import Literal

from pydantic import BaseModel


class MaintainerFile(BaseModel):
    file_name: str | None = None
    error: str | None = None


class MaintainerInfoItem(BaseModel):
    github_username: str | None = None
    name: str | None = None
    title: str | None = None
    normalized_title: Literal["maintainer", "contributor"] | None = None


class MaintainerInfo(BaseModel):
    info: list[MaintainerInfoItem] | None = None
    error: str | None = None


class AggregatedMaintainerInfoItems(BaseModel):
    info: list[MaintainerInfoItem]


class AggregatedMaintainerInfo(BaseModel):
    output: AggregatedMaintainerInfoItems
    cost: float


class MaintainerResult(BaseModel):
    maintainer_file: str | None = None
    maintainer_info: list[MaintainerInfoItem] | None = None
    total_cost: float = 0
