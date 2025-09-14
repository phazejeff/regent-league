from typing import  List, Optional
from sqlmodel import Field, SQLModel, Relationship
from datetime import datetime

class TeamBase(SQLModel):
    name: str
    div: str
    group: str
    logo: str
class Team(TeamBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Relationship to players
    players: List["Player"] = Relationship(back_populates="team")
    matches_as_team1: List["Match"] = Relationship(back_populates="team1", sa_relationship_kwargs={"foreign_keys": "[Match.team1_id]"})
    matches_as_team2: List["Match"] = Relationship(back_populates="team2", sa_relationship_kwargs={"foreign_keys": "[Match.team2_id]"})

class PlayerBase(SQLModel):
    name: str
    age: int
    year: int
    major: str
class Player(PlayerBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")

    team: Optional["Team"] = Relationship(back_populates="players")
    map_stats: List["Playerstats"] = Relationship(back_populates="player")
    map_entries: List["MapPlayer"] = Relationship(back_populates="player")

class MatchBase(SQLModel):
    score1: int
    score2: int
    datetime: datetime
class Match(MatchBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team1_id: int = Field(foreign_key="team.id")
    team2_id: int = Field(foreign_key="team.id")
    winner_id: Optional[int] = Field(default=None, foreign_key="team.id")

    team1: Optional["Team"] = Relationship(back_populates="matches_as_team1", sa_relationship_kwargs={"foreign_keys": "[Match.team1_id]"})
    team2: Optional["Team"] = Relationship(back_populates="matches_as_team2", sa_relationship_kwargs={"foreign_keys": "[Match.team2_id]"})
    maps: List["Map"] = Relationship(back_populates="match")

class MapBase(SQLModel):
    map_num: int
    map_name: str
    team1_score: int
    team2_score: int
    map_picker_name: str
class Map(MapBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
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

class PlayerstatsBase(SQLModel):
    K: int
    A: int
    D: int
    ADR: float
    hs_percent: float
    accuracy: float
class Playerstats(PlayerstatsBase, table=True):
    player_id: int = Field(foreign_key="player.id", primary_key=True)
    map_id: int = Field(foreign_key="map.id", primary_key=True)

    player: Optional["Player"] = Relationship(back_populates="map_stats")
    map: Optional["Map"] = Relationship(back_populates="player_stats")

class DivisionsBase(SQLModel):
    name: str
class Divisions(DivisionsBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class GroupsBase(SQLModel):
    division: str
    name: str
class Groups(GroupsBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)