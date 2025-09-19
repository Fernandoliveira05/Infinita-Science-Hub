from pydantic import BaseModel

class UserProfile(BaseModel):
    address: str
    avatar_url: str
    bio: str = None  
    created_at: int
    updated_at: int

    class Config:
        orm_mode = True
