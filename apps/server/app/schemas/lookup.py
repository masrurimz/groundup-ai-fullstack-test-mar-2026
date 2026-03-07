from pydantic import BaseModel


class LookupItem(BaseModel):
    id: str
    name: str
    category: str
