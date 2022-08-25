from enum import Enum


class Operations(Enum):
    UPDATE_MEMBERS: str = "update_members"
    UPSERT_MEMBERS: str = "upsert_members"
    UPDATE_MEMBERS_TO_MERGE: str = "update_members_to_merge"
    UPSERT_ACTIVITIES_WITH_MEMBERS: str = "upsert_activities_with_members"
    UPDATE_INTEGRATIONS: str = "update_integrations"
    UPDATE_WIDGETS: str = "update_widgets"
    UPDATE_MICROSERVICES: str = "update_microservices"
