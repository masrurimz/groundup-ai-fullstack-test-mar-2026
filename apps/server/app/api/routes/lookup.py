from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Action, Reason
from app.schemas import LookupItem

router = APIRouter(prefix="/lookup", tags=["lookup"])


@router.get("", response_model=list[LookupItem])
async def get_lookup_items(
    category: str | None = None,
    machine: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> list[LookupItem]:
    items: list[LookupItem] = []

    include_reasons = category in (None, "reasons")
    include_actions = category in (None, "actions")

    if include_reasons:
        reasons_query = select(Reason).order_by(Reason.id)
        if machine is not None:
            reasons_query = reasons_query.where(Reason.machine == machine)

        reasons = (await session.execute(reasons_query)).scalars().all()
        items.extend(
            [LookupItem(id=f"reason-{r.id}", name=r.reason, category="reasons") for r in reasons]
        )

    if include_actions:
        actions = (await session.execute(select(Action).order_by(Action.id))).scalars().all()
        items.extend(
            [LookupItem(id=f"action-{a.id}", name=a.action, category="actions") for a in actions]
        )

    return items


@router.get("/reasons", response_model=list[str])
async def get_reasons(
    machine: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> list[str]:
    if machine is None:
        raise HTTPException(status_code=400, detail="machine query parameter is required")

    result = await session.execute(
        select(Reason).where(Reason.machine == machine).order_by(Reason.id)
    )
    reasons = result.scalars().all()
    return [r.reason for r in reasons]


@router.get("/actions", response_model=list[str])
async def get_actions(session: AsyncSession = Depends(get_session)) -> list[str]:
    result = await session.execute(select(Action).order_by(Action.id))
    actions = result.scalars().all()
    return [a.action for a in actions]
