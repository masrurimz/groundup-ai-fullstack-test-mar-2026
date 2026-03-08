from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.models import Action, AuditLog, Machine, Reason
from app.schemas import (
    ActionCreateRequest,
    ActionUpdateRequest,
    LookupItem,
    MachineCreateRequest,
    MachineUpdateRequest,
    ReasonCreateRequest,
    ReasonUpdateRequest,
)

router = APIRouter(prefix="/lookup", tags=["lookup"])


def _normalize_key(value: str) -> str:
    return " ".join(value.strip().split()).lower()


def _to_machine_item(machine: Machine) -> LookupItem:
    return LookupItem(
        id=machine.id,
        name=machine.name,
        category="machines",
        key=machine.key,
        is_active=machine.is_active,
    )


def _to_reason_item(reason: Reason, machine_name: str) -> LookupItem:
    return LookupItem(
        id=reason.id,
        name=reason.reason,
        category="reasons",
        key=reason.key,
        is_active=reason.is_active,
        machine_id=reason.machine_id,
        machine_name=machine_name,
    )


def _to_action_item(action: Action) -> LookupItem:
    return LookupItem(
        id=action.id,
        name=action.action,
        category="actions",
        key=action.key,
        is_active=action.is_active,
    )


async def _record_audit(
    session: AsyncSession,
    *,
    entity_type: str,
    entity_id: int,
    operation: str,
    before_json: dict | None,
    after_json: dict | None,
) -> None:
    session.add(
        AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            operation=operation,
            actor="admin-ui",
            before_json=before_json,
            after_json=after_json,
            created_at=datetime.now(tz=UTC),
        )
    )


@router.get("", response_model=list[LookupItem])
async def get_lookup_items(
    category: str | None = None,
    machine_id: int | None = None,
    include_inactive: bool = False,
    session: AsyncSession = Depends(get_session),
) -> list[LookupItem]:
    items: list[LookupItem] = []

    include_machines = category in (None, "machines")
    include_reasons = category in (None, "reasons")
    include_actions = category in (None, "actions")

    if include_machines:
        query = select(Machine).order_by(Machine.name)
        if not include_inactive:
            query = query.where(Machine.is_active)
        machines = (await session.execute(query)).scalars().all()
        items.extend(_to_machine_item(machine) for machine in machines)

    if include_reasons:
        query = (
            select(Reason, Machine.name)
            .join(Machine, Reason.machine_id == Machine.id)
            .order_by(Machine.name, Reason.reason)
        )
        conditions = []
        if machine_id is not None:
            conditions.append(Reason.machine_id == machine_id)
        if not include_inactive:
            conditions.append(and_(Reason.is_active, Machine.is_active))
        if conditions:
            query = query.where(and_(*conditions))
        rows = (await session.execute(query)).all()
        items.extend(_to_reason_item(reason, machine_name) for reason, machine_name in rows)

    if include_actions:
        query = select(Action).order_by(Action.action)
        if not include_inactive:
            query = query.where(Action.is_active)
        actions = (await session.execute(query)).scalars().all()
        items.extend(_to_action_item(action) for action in actions)

    return items


@router.get("/machines", response_model=list[LookupItem])
async def get_machines(
    include_inactive: bool = False,
    session: AsyncSession = Depends(get_session),
) -> list[LookupItem]:
    query = select(Machine).order_by(Machine.name)
    if not include_inactive:
        query = query.where(Machine.is_active)
    machines = (await session.execute(query)).scalars().all()
    return [_to_machine_item(machine) for machine in machines]


@router.post("/machines", response_model=LookupItem, status_code=status.HTTP_201_CREATED)
async def create_machine(
    body: MachineCreateRequest,
    session: AsyncSession = Depends(get_session),
) -> LookupItem:
    name = body.name
    key = _normalize_key(body.name)

    exists = await session.execute(select(Machine).where(Machine.key == key))
    if exists.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="machine already exists")

    now = datetime.now(tz=UTC)
    machine = Machine(key=key, name=name, is_active=True, created_at=now, updated_at=now)
    session.add(machine)
    await session.flush()
    await _record_audit(
        session,
        entity_type="machine",
        entity_id=machine.id,
        operation="create",
        before_json=None,
        after_json={"name": machine.name, "is_active": machine.is_active},
    )
    await session.commit()
    await session.refresh(machine)
    return _to_machine_item(machine)


@router.patch("/machines/{machine_id}", response_model=LookupItem)
async def update_machine(
    machine_id: int,
    body: MachineUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> LookupItem:
    machine = (
        await session.execute(select(Machine).where(Machine.id == machine_id))
    ).scalar_one_or_none()
    if machine is None:
        raise HTTPException(status_code=404, detail="machine not found")

    before = {"name": machine.name, "is_active": machine.is_active}

    if body.name is not None:
        name = body.name
        key = _normalize_key(body.name)
        dupe = await session.execute(
            select(Machine).where(and_(Machine.key == key, Machine.id != machine_id))
        )
        if dupe.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="machine already exists")
        machine.name = name
        machine.key = key

    if body.is_active is not None:
        machine.is_active = body.is_active

    machine.updated_at = datetime.now(tz=UTC)

    await _record_audit(
        session,
        entity_type="machine",
        entity_id=machine.id,
        operation="update",
        before_json=before,
        after_json={"name": machine.name, "is_active": machine.is_active},
    )
    await session.commit()
    await session.refresh(machine)
    return _to_machine_item(machine)


@router.get("/reasons", response_model=list[LookupItem])
async def get_reasons(
    machine_id: int | None = None,
    machine: str | None = None,
    include_inactive: bool = False,
    session: AsyncSession = Depends(get_session),
) -> list[LookupItem]:
    query = (
        select(Reason, Machine.name)
        .join(Machine, Reason.machine_id == Machine.id)
        .order_by(Machine.name, Reason.reason)
    )

    conditions = []
    if machine_id is not None:
        conditions.append(Reason.machine_id == machine_id)
    elif machine is not None:
        normalized_machine = _normalize_key(machine)
        conditions.append(func.lower(Machine.key) == normalized_machine)

    if not include_inactive:
        conditions.append(and_(Reason.is_active, Machine.is_active))

    if conditions:
        query = query.where(and_(*conditions))

    rows = (await session.execute(query)).all()
    return [_to_reason_item(reason, machine_name) for reason, machine_name in rows]


@router.post("/reasons", response_model=LookupItem, status_code=status.HTTP_201_CREATED)
async def create_reason(
    body: ReasonCreateRequest,
    session: AsyncSession = Depends(get_session),
) -> LookupItem:
    machine = (
        await session.execute(select(Machine).where(Machine.id == body.machine_id))
    ).scalar_one_or_none()
    if machine is None:
        raise HTTPException(status_code=404, detail="machine not found")

    reason_name = body.reason
    key = _normalize_key(body.reason)

    exists = await session.execute(
        select(Reason).where(and_(Reason.machine_id == body.machine_id, Reason.key == key))
    )
    if exists.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="reason already exists for machine")

    now = datetime.now(tz=UTC)
    reason = Reason(
        machine_id=body.machine_id,
        key=key,
        reason=reason_name,
        is_active=True,
        created_at=now,
        updated_at=now,
    )
    session.add(reason)
    await session.flush()
    await _record_audit(
        session,
        entity_type="reason",
        entity_id=reason.id,
        operation="create",
        before_json=None,
        after_json={
            "machine_id": reason.machine_id,
            "reason": reason.reason,
            "is_active": reason.is_active,
        },
    )
    await session.commit()
    await session.refresh(reason)
    return _to_reason_item(reason, machine.name)


@router.patch("/reasons/{reason_id}", response_model=LookupItem)
async def update_reason(
    reason_id: int,
    body: ReasonUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> LookupItem:
    row = (
        await session.execute(
            select(Reason, Machine.name)
            .join(Machine, Reason.machine_id == Machine.id)
            .where(Reason.id == reason_id)
        )
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="reason not found")

    reason, machine_name = row
    before = {"reason": reason.reason, "is_active": reason.is_active}

    if body.reason is not None:
        reason_name = body.reason
        key = _normalize_key(body.reason)
        dupe = await session.execute(
            select(Reason).where(
                and_(
                    Reason.machine_id == reason.machine_id,
                    Reason.key == key,
                    Reason.id != reason.id,
                )
            )
        )
        if dupe.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="reason already exists for machine")
        reason.reason = reason_name
        reason.key = key

    if body.is_active is not None:
        reason.is_active = body.is_active

    reason.updated_at = datetime.now(tz=UTC)
    await _record_audit(
        session,
        entity_type="reason",
        entity_id=reason.id,
        operation="update",
        before_json=before,
        after_json={"reason": reason.reason, "is_active": reason.is_active},
    )
    await session.commit()
    await session.refresh(reason)
    return _to_reason_item(reason, machine_name)


@router.get("/actions", response_model=list[LookupItem])
async def get_actions(
    include_inactive: bool = False,
    session: AsyncSession = Depends(get_session),
) -> list[LookupItem]:
    query = select(Action).order_by(Action.action)
    if not include_inactive:
        query = query.where(Action.is_active)
    actions = (await session.execute(query)).scalars().all()
    return [_to_action_item(action) for action in actions]


@router.post("/actions", response_model=LookupItem, status_code=status.HTTP_201_CREATED)
async def create_action(
    body: ActionCreateRequest,
    session: AsyncSession = Depends(get_session),
) -> LookupItem:
    action_name = body.action
    key = _normalize_key(body.action)

    exists = await session.execute(select(Action).where(Action.key == key))
    if exists.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="action already exists")

    now = datetime.now(tz=UTC)
    action = Action(key=key, action=action_name, is_active=True, created_at=now, updated_at=now)
    session.add(action)
    await session.flush()
    await _record_audit(
        session,
        entity_type="action",
        entity_id=action.id,
        operation="create",
        before_json=None,
        after_json={"action": action.action, "is_active": action.is_active},
    )
    await session.commit()
    await session.refresh(action)
    return _to_action_item(action)


@router.patch("/actions/{action_id}", response_model=LookupItem)
async def update_action(
    action_id: int,
    body: ActionUpdateRequest,
    session: AsyncSession = Depends(get_session),
) -> LookupItem:
    action = (
        await session.execute(select(Action).where(Action.id == action_id))
    ).scalar_one_or_none()
    if action is None:
        raise HTTPException(status_code=404, detail="action not found")

    before = {"action": action.action, "is_active": action.is_active}

    if body.action is not None:
        action_name = body.action
        key = _normalize_key(body.action)
        dupe = await session.execute(
            select(Action).where(and_(Action.key == key, Action.id != action_id))
        )
        if dupe.scalar_one_or_none() is not None:
            raise HTTPException(status_code=409, detail="action already exists")
        action.action = action_name
        action.key = key

    if body.is_active is not None:
        action.is_active = body.is_active

    action.updated_at = datetime.now(tz=UTC)
    await _record_audit(
        session,
        entity_type="action",
        entity_id=action.id,
        operation="update",
        before_json=before,
        after_json={"action": action.action, "is_active": action.is_active},
    )
    await session.commit()
    await session.refresh(action)
    return _to_action_item(action)
