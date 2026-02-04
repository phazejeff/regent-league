from zoneinfo import ZoneInfo
from ..models import *
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class CCTeam(BaseModel):
    id: int
    name: str
    picture: str
    school_name: str
    division: str
    roster: List["CCPlayer"]

    @staticmethod
    def convert_to_cc(team: Team) -> "CCTeam":
        return CCTeam(
                id = team.id,
                name = team.name,
                picture = "https://regent-league-api.poopdealer.lol/photos/" + team.logo,
                school_name = team.school,
                division = team.div,
                roster = [CCPlayer.convert_to_cc(player) for player in team.players if not player.former_player and player.main] # isnt python just nuts lol
            )

class CCPlayer(BaseModel):
    id: int
    name: str
    steam_id: Optional[str]
    faceit_id: Optional[str]

    @staticmethod
    def convert_to_cc(player: Player) -> "CCPlayer":
        return CCPlayer(
            id = player.id,
            name = player.name,
            steam_id = player.steam_id,
            faceit_id = player.faceit_url.split("/")[-1] if player.faceit_url is not None else None
        )

class Status(Enum):
    scheduled = 'Scheduled'
    in_progress = 'In Progress'
    completed = 'Completed'

class CCMatch(BaseModel):
    id: int
    team1: CCTeam
    team2: CCTeam
    date: datetime
    status: Status
    winner: Optional[CCTeam] = None
    score_team1: Optional[int] = None
    score_team2: Optional[int] = None

    @staticmethod
    def convert_upcoming_to_cc(upcoming: Upcoming) -> "CCMatch":
        return CCMatch(
            id = upcoming.id,
            team1 = CCTeam.convert_to_cc(upcoming.team1),
            team2 = CCTeam.convert_to_cc(upcoming.team2),
            date = upcoming.datetime,
            status = Status.scheduled if datetime.now(tz=ZoneInfo("America/Los_Angeles")) < upcoming.datetime.replace(tzinfo=ZoneInfo("America/Los_Angeles")) else Status.in_progress
        )
    
    @staticmethod
    def convert_finished_match_to_cc(match: Match):
        return CCMatch(
            id = match.upcoming_id,
            team1 = CCTeam.convert_to_cc(match.team1),
            team2 = CCTeam.convert_to_cc(match.team2),
            date = match.datetime,
            status = Status.completed,
            winner = CCTeam.convert_to_cc(match.team1),
            score_team1 = match.score1,
            score_team2 = match.score2
        )