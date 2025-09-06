from typing import TYPE_CHECKING, List, Optional
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
    from . import Team, Playerstats, MapPlayer
    
class Team(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    div: str
    group: str

    # Relationship to players
    players: List["Player"] = Relationship(back_populates="team")
    matches_as_team1: List["Match"] = Relationship(back_populates="team1", sa_relationship_kwargs={"foreign_keys": "[Match.team1_id]"})
    matches_as_team2: List["Match"] = Relationship(back_populates="team2", sa_relationship_kwargs={"foreign_keys": "[Match.team2_id]"})

class Player(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    team_id: int = Field(foreign_key="team.id")

    team: Optional["Team"] = Relationship(back_populates="players")
    map_stats: List["Playerstats"] = Relationship(back_populates="player")
    map_entries: List["MapPlayer"] = Relationship(back_populates="player")

class Match(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team1_id: int = Field(foreign_key="team.id")
    team2_id: int = Field(foreign_key="team.id")
    score1: int
    score2: int
    winner_id: Optional[int] = Field(default=None, foreign_key="team.id")

    team1: Optional["Team"] = Relationship(back_populates="matches_as_team1", sa_relationship_kwargs={"foreign_keys": "[Match.team1_id]"})
    team2: Optional["Team"] = Relationship(back_populates="matches_as_team2", sa_relationship_kwargs={"foreign_keys": "[Match.team2_id]"})
    maps: List["Map"] = Relationship(back_populates="match")

class Map(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
    map_num: int
    map_name: str
    team1_score: int
    team2_score: int
    winner_id: Optional[int] = Field(default=None, foreign_key="team.id")

    match: Optional["Match"] = Relationship(back_populates="maps")
    players: List["MapPlayer"] = Relationship(back_populates="map")
    player_stats: List["Playerstats"] = Relationship(back_populates="map")

class MapPlayer(SQLModel, table=True):
    map_id: int = Field(foreign_key="map.id", primary_key=True)
    player_id: int = Field(foreign_key="player.id", primary_key=True)
    team_id: int = Field(foreign_key="team.id")

    map: Optional["Map"] = Relationship(back_populates="players")
    player: Optional["Player"] = Relationship(back_populates="map_entries")

class Playerstats(SQLModel, table=True):
    player_id: int = Field(foreign_key="player.id", primary_key=True)
    map_id: int = Field(foreign_key="map.id", primary_key=True)
    K: int
    A: int
    D: int
    ADR: float
    hs_percent: float
    accuracy: float

    player: Optional["Player"] = Relationship(back_populates="map_stats")
    map: Optional["Map"] = Relationship(back_populates="player_stats")