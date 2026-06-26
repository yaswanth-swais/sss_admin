from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserOut(BaseModel):
    id:                    int          # user_id — BIGSERIAL
    email:                 str          # login_id
    name:                  str          # full_name
    first_name:            Optional[str]
    last_name:             Optional[str]
    phone_number:          Optional[str]  # mobile_no
    dob:                   Optional[str]
    user_type:             Optional[str]
    role:                  str
    registration_complete: bool
    is_active:             bool
    createdAt:             Optional[datetime]

    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    first_name:   str
    last_name:    str
    phone_number: str
    dob:          str
    user_type:    str   # e.g. "WAREHOUSING", "LOGISTICS" etc.


class UpdateIndustryRequest(BaseModel):
    industry: str
