import uuid

from pydantic import BaseModel, Field, field_validator, model_validator


def _normalize_text(value: str) -> str:
    return " ".join(value.strip().split())


class MachineResponse(BaseModel):
    id: uuid.UUID
    key: str
    name: str
    is_active: bool


class ReasonResponse(BaseModel):
    id: uuid.UUID
    key: str
    reason: str
    is_active: bool
    machine_id: uuid.UUID
    machine_name: str


class ActionResponse(BaseModel):
    id: uuid.UUID
    key: str
    action: str
    is_active: bool


class SensorResponse(BaseModel):
    id: uuid.UUID
    key: str
    serial: str
    name: str
    is_active: bool
    machine_id: uuid.UUID
    machine_name: str


class MachineCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("name is required")
        return normalized


class MachineUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("name cannot be empty")
        return normalized

    @model_validator(mode="after")
    def ensure_non_empty_update(self) -> "MachineUpdateRequest":
        if self.name is None and self.is_active is None:
            raise ValueError("at least one field must be provided")
        return self


class ReasonCreateRequest(BaseModel):
    machine_id: uuid.UUID
    reason: str = Field(min_length=1, max_length=255)

    @field_validator("reason")
    @classmethod
    def normalize_reason(cls, value: str) -> str:
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("reason is required")
        return normalized


class ReasonUpdateRequest(BaseModel):
    reason: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None

    @field_validator("reason")
    @classmethod
    def normalize_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("reason cannot be empty")
        return normalized

    @model_validator(mode="after")
    def ensure_non_empty_update(self) -> "ReasonUpdateRequest":
        if self.reason is None and self.is_active is None:
            raise ValueError("at least one field must be provided")
        return self


class ActionCreateRequest(BaseModel):
    action: str = Field(min_length=1, max_length=255)

    @field_validator("action")
    @classmethod
    def normalize_action(cls, value: str) -> str:
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("action is required")
        return normalized


class ActionUpdateRequest(BaseModel):
    action: str | None = Field(default=None, min_length=1, max_length=255)
    is_active: bool | None = None

    @field_validator("action")
    @classmethod
    def normalize_action(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("action cannot be empty")
        return normalized

    @model_validator(mode="after")
    def ensure_non_empty_update(self) -> "ActionUpdateRequest":
        if self.action is None and self.is_active is None:
            raise ValueError("at least one field must be provided")
        return self


class SensorCreateRequest(BaseModel):
    machine_id: uuid.UUID
    serial: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)

    @field_validator("serial")
    @classmethod
    def normalize_serial(cls, value: str) -> str:
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("serial is required")
        return normalized

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("name is required")
        return normalized


class SensorUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    serial: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("name cannot be empty")
        return normalized

    @field_validator("serial")
    @classmethod
    def normalize_serial(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_text(value)
        if not normalized:
            raise ValueError("serial cannot be empty")
        return normalized

    @model_validator(mode="after")
    def ensure_non_empty_update(self) -> "SensorUpdateRequest":
        if self.name is None and self.serial is None and self.is_active is None:
            raise ValueError("at least one field must be provided")
        return self
