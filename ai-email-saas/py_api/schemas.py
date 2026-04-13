from pydantic import BaseModel


class TestEmailPayload(BaseModel):
    text: str
