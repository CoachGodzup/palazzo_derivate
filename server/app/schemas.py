from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class HealthResponse(BaseModel):
    status: Literal["ok"]


class PublicPuzzle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9-]+$")
    order: int = Field(ge=1, le=3)
    title: str = Field(min_length=1, max_length=160)
    short_title: str = Field(min_length=1, max_length=80)
    mechanism: Literal["seal", "gears", "fountain"]
    prompt: str = Field(min_length=1, max_length=1200)
    function_latex: str = Field(min_length=1, max_length=600)
    hints: list[str] = Field(min_length=3, max_length=3)
    target_seconds: int = Field(gt=0, le=3600)
    difficulty: int = Field(ge=1, le=3)


class PublicDemo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: str
    chapter: str
    room: str
    intro: str
    outro: str
    puzzles: list[PublicPuzzle]


class Puzzle(PublicPuzzle):
    function_sympy: str = Field(min_length=1, max_length=240, repr=False)
    derivative_sympy: str = Field(min_length=1, max_length=240, repr=False)
    feedback_profile: Literal["power_rule", "product_rule", "radical_rule"]


class DemoContent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    version: str = Field(min_length=1, max_length=40)
    chapter: str = Field(min_length=1, max_length=200)
    room: str = Field(min_length=1, max_length=200)
    intro: str = Field(min_length=1, max_length=1600)
    outro: str = Field(min_length=1, max_length=1600)
    puzzles: list[Puzzle] = Field(min_length=3, max_length=3)

    @model_validator(mode="after")
    def validate_puzzle_order_and_ids(self):
        ids = [puzzle.id for puzzle in self.puzzles]
        orders = [puzzle.order for puzzle in self.puzzles]
        if len(set(ids)) != len(ids):
            raise ValueError("Gli id dei puzzle devono essere univoci.")
        if sorted(orders) != [1, 2, 3]:
            raise ValueError("Gli ordini dei puzzle devono essere 1, 2 e 3.")
        return self

    def to_public(self) -> PublicDemo:
        public_fields = set(PublicPuzzle.model_fields)
        return PublicDemo(
            version=self.version,
            chapter=self.chapter,
            room=self.room,
            intro=self.intro,
            outro=self.outro,
            puzzles=[
                PublicPuzzle(**puzzle.model_dump(include=public_fields))
                for puzzle in self.puzzles
            ],
        )


class VerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    answer: str = Field(max_length=240)


class VerifyResponse(BaseModel):
    status: Literal["correct", "incorrect", "syntax_error", "unsupported_expression"]
    message: str
    feedback_category: str | None
