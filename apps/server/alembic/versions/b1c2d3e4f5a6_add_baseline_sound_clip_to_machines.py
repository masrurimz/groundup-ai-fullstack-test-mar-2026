"""add_baseline_sound_clip_to_machines

Revision ID: b1c2d3e4f5a6
Revises: 0a412b99977d
Create Date: 2026-03-08 17:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: str | Sequence[str] | None = "0a412b99977d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "machines",
        sa.Column("baseline_sound_clip", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("machines", "baseline_sound_clip")
