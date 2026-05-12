from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentConfig(BaseModel):
    name: str
    role: str
    goal: str
    instructions: Optional[str] = None
    memory_context: Optional[str] = None  # injected memory text for this run
    enabled_toolsets: Optional[List[str]] = None
    disabled_toolsets: Optional[List[str]] = None
    memory_enabled: bool = False


class ExecuteRequest(BaseModel):
    task_run_id: str
    message: str
    agent_config: AgentConfig
    model: str = Field(default="openai/gpt-4o-mini")
    provider: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    max_iterations: int = Field(default=20, ge=1, le=90)


class LogEvent(BaseModel):
    type: str  # log | tool_start | tool_end | text_delta | done | error
    content: str
    tool_name: Optional[str] = None
    metadata: Optional[dict] = None
