from typing import List
from fastapi import FastAPI, Form, HTTPException, Response, status, Depends, File, UploadFile
from fastapi.staticfiles import StaticFiles
from .database import create_db_and_tables, engine
from .models import *
from sqlmodel import Session, select, func, or_
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from .twitch import Twitch
from colorthief import ColorThief

create_db_and_tables()
app = FastAPI()
twitch = Twitch()
PASSWORD = os.environ.get("PASSWORD")
if PASSWORD is None:
    PASSWORD = "test"

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.mount("/photos", StaticFiles(directory="photos"), name="photos")

class TeamStats(BaseModel):
    team: Team | None = None
    match_wins: int = 0
    match_losses: int = 0
    map_wins: int = 0
    map_losses: int = 0
    round_wins: int = 0
    round_losses: int = 0

class PlayerstatsAggregated(BaseModel):
    id: int = 0
    name: str = ""
    team: str = ""
    K: int = 0
    D: int = 0
    A: int = 0
    ADR: float = 0
    HS: float = 0
    accuracy: float = 0

class PlayerstatsWithPlayer(PlayerstatsBase):
    player: Player | None

class MatchWithTeams(MatchBase):
    team1: TeamBase
    team2: TeamBase

class MapWithMatch(MapBase):
    match: MatchWithTeams

class PlayerstatsWithMap(PlayerstatsBase):
    map: MapWithMatch

class MapWithStats(MapBase):
    player_stats: List[PlayerstatsWithPlayer]

class MatchWithMapsWithStats(MatchBase):
    team1: Team
    team2: Team
    maps: List[MapWithStats]

class PlayerstatsCreate(PlayerstatsBase):
    player_id: int

class MapCreate(MapBase):
    winner_id: int
    player_stats: List[PlayerstatsCreate]

class MatchCreate(MatchBase):
    team1_id: int
    team2_id: int
    winner_id: int
    maps: List[MapCreate]

class TeamUpdate(TeamBase):
    name: str | None
    div: str | None
    group: str | None
    logo: str | None

class PlayerUpdate(PlayerBase):
    team_id: int
    team_sub_id: int | None = None

class PlayerFull(PlayerBase):
    team: Team
    team_sub: Team | None
    map_stats: List[PlayerstatsWithMap]

class AddUpcoming(UpcomingBase):
    team1_id: int
    team2_id: int

class GetUpcoming(UpcomingBase):
    id: int
    team1: Team
    team2: Team

def get_session():
    with Session(engine) as session:
        yield session

@app.get("/")
def read_root():
    return {"Status" : "OK"}

@app.post("/addmatch", status_code=status.HTTP_201_CREATED)
def add_match(match_data: MatchCreate, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    # Verify teams exist
    team1 = session.get(Team, match_data.team1_id)
    team2 = session.get(Team, match_data.team2_id)
    if not team1 or not team2:
        raise HTTPException(status_code=404, detail="One or both teams not found")

    # Create Match
    match = Match(
        team1_id=match_data.team1_id,
        team2_id=match_data.team2_id,
        score1=match_data.score1,
        score2=match_data.score2,
        datetime=match_data.datetime,
        winner_id=match_data.winner_id,
    )
    session.add(match)
    session.flush()  # ensures match.id is available

    # Create Maps
    for map_data in match_data.maps:
        map_obj = Map(
            map_num=map_data.map_num,
            map_name=map_data.map_name,
            team1_score=map_data.team1_score,
            team2_score=map_data.team2_score,
            winner_id=map_data.winner_id,
            match_id=match.id,
            map_picker_name=map_data.map_picker_name
        )
        session.add(map_obj)
        session.flush()  # ensures map.id is available

        # Add Player Stats for each map
        for ps in map_data.player_stats:
            player = session.get(Player, ps.player_id)
            if not player:
                raise HTTPException(status_code=404, detail=f"Player {ps.player_id} not found")

            # MapPlayer (ensures association between player, team, map)
            mp = MapPlayer(
                map_id=map_obj.id,
                player_id=ps.player_id,
                team_id=player.team_id,
            )
            session.add(mp)

            # Playerstats
            stats = Playerstats(
                player_id=ps.player_id,
                map_id=map_obj.id,
                K=ps.K,
                A=ps.A,
                D=ps.D,
                ADR=ps.ADR,
                hs_percent=ps.hs_percent,
                accuracy=ps.accuracy,
            )
            session.add(stats)

    session.commit()
    session.refresh(match)
    return {"message" : "Created"}

@app.post("/addteam", status_code=status.HTTP_201_CREATED)
def add_team(team: TeamBase, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    team_db = Team.model_validate(team)
    session.add(team_db)
    session.commit()
    return {"message" : "Created"}

@app.post("/upload")
async def upload(file: UploadFile, password, response: Response):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    file_content = await file.read()
    file_location = f"photos/{file.filename}"
    with open(file_location, "wb") as f:
        f.write(file_content)
    return file.filename

@app.post("/addplayers", status_code=status.HTTP_201_CREATED)
def add_players(players: List[Player], password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    session.add_all(players)
    session.commit()
    return {"message" : "Created"}

@app.post("/editplayer", status_code=status.HTTP_201_CREATED)
def edit_player(player: PlayerUpdate, player_id: int, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    player_db = session.get(Player, player_id)
    if not player_db:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message" : "Player not found"}
    
    for key, value in player.model_dump().items():
        setattr(player_db, key, value)
    session.add(player_db)
    session.commit()
    session.refresh(player_db)
    return {"message" : "Created"}

@app.get("/players")
def get_players(team_id: int | None = None, main_only: bool = False, session: Session = Depends(get_session)) -> List[Player]:
    statement = select(Player)
    if team_id is not None:
        if main_only:
            statement = statement.where(Player.team_id == team_id)
        else:
            statement = statement.where(or_(Player.team_id == team_id, Player.team_sub_id == team_id))
    players = session.exec(statement).all()
    return players

@app.get("/player/{player_id}")
def get_player(player_id: int, session: Session = Depends(get_session)) -> PlayerFull:
    statement = select(Player).where(Player.id == player_id)
    player = session.exec(statement).first()
    return player

@app.delete("/deleteplayer", status_code=status.HTTP_200_OK)
def delete_player(player_id: int, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    statement = select(Player).where(Player.id == player_id)
    player = session.exec(statement).first()
    session.delete(player)
    session.commit()
    return {"message" : "Player removed"}

@app.delete("/deleteplayer", status_code=status.HTTP_200_OK)
def delete_player(password, response: Response, player_id: int, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    statement = select(Player).where(Player.id == player_id)
    player = session.exec(statement).first()
    session.delete(player)
    session.commit()
    return {"message" : "Player removed"}

@app.get("/matches")
def get_matches(div: str | None = None, group: str | None = None, session: Session = Depends(get_session)) -> List[MatchWithMapsWithStats]:
    statement = select(Match).join(Match.team1)
    if div is not None:
        statement = statement.where(Team.div == div)
    if group is not None:
        statement = statement.where(Team.group == group)
    results = session.exec(statement).all()
    return results

@app.get("/teams")
def get_teams(div: str | None = None, session: Session = Depends(get_session)) -> List[Team]:
    statement = select(Team)
    if div is not None:
        statement = statement.where(Team.div == div)
    results = session.exec(statement).all()
    return results

@app.delete("/deleteteam", status_code=status.HTTP_200_OK)
def delete_team(team_id: int, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    statement = select(Team).where(Team.id == team_id)
    team = session.exec(statement).first()
    session.delete(team)
    session.commit()
    return {"message" : "Team removed"}

@app.post("/editteam", status_code=status.HTTP_201_CREATED)
def edit_team(team: TeamUpdate, team_id: int, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    team_db = session.get(Team, team_id)
    if not team_db:
        response.status_code = status.HTTP_404_NOT_FOUND
        return {"message" : "Team not found"}
    
    for key, value in team.model_dump().items():
        setattr(team_db, key, value)
    session.add(team_db)
    session.commit()
    session.refresh(team_db)
    return {"message" : "Created"}

@app.get("/standings")
def get_standings(div: str, group: str, session: Session = Depends(get_session)) -> List[TeamStats]:
    statement = select(Team)
    if div is not None:
        statement = statement.where(Team.div == div)
    if group is not None:
        statement = statement.where(Team.group == group)
    teams = session.exec(statement).all()

    all_team_stats: List[TeamStats] = []

    for team in teams:
        matches = [*team.matches_as_team1, *team.matches_as_team2]
        team_stats = TeamStats()
        team_stats.team = team
        for match in matches:
            if match.winner_id == team.id:
                team_stats.match_wins += 1
            else:
                team_stats.match_losses += 1
            
            for map in match.maps:
                if map.winner_id == team.id:
                    team_stats.map_wins += 1
                else:
                    team_stats.map_losses += 1
                
                if match.team1_id == team.id:
                    team_stats.round_wins += map.team1_score
                    team_stats.round_losses += map.team2_score
                else:
                    team_stats.round_wins += map.team2_score
                    team_stats.round_losses += map.team2_score
        all_team_stats.append(team_stats)

    all_team_stats = sorted(
        all_team_stats,
        key = lambda t: (
            t.match_wins - t.match_losses,
            t.map_wins - t.map_losses,
            t.round_wins - t.round_losses,
        ),
        reverse=True
    )
    return all_team_stats

@app.get("/playerstats")
def get_playerstats(div: str | None = None, group: str | None = None, team_id: int | None = None, session: Session = Depends(get_session)) -> List[PlayerstatsAggregated]:
    statement = (
        select(
            Player.id,
            Player.name,
            Team.name.label("team"),  # Get the actual team name
            func.sum(Playerstats.K).label("K"),
            func.sum(Playerstats.A).label("A"),
            func.sum(Playerstats.D).label("D"),
            func.avg(Playerstats.ADR).label("ADR"),
            func.avg(Playerstats.hs_percent).label("HS"),
            func.avg(Playerstats.accuracy).label("accuracy")
        )
        .join(Playerstats, Player.id == Playerstats.player_id)
        .join(Team, Player.team_id == Team.id)  # Join with Team table
        .group_by(Player.id, Player.name, Team.name)  # Include Team.name in group_by
    )
    if div is not None:
        statement = statement.where(Team.div == div)
    if group is not None:
        statement = statement.where(Team.group == group)
    if team_id is not None:
        statement = statement.where(Team.id == team_id)
    
    results = session.exec(statement).all()
    return results

@app.get("/divisions")
def get_divisions(session: Session = Depends(get_session)) -> List[Divisions]:
    statement = select(Divisions)
    result = session.exec(statement).all()
    return result

@app.get("/groups")
def get_groups(div: str | None = None, session: Session = Depends(get_session)) -> List[Groups]:
    statement = select(Groups)
    if div is not None:
        statement = statement.where(Groups.division == div)
    result = session.exec(statement).all()
    return result

@app.post("/setdivsandgroups", status_code=status.HTTP_201_CREATED)
def set_divs_and_groups(divs: List[DivisionsBase], groups: List[GroupsBase], password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    statement = select(Divisions)
    old_divisions = session.exec(statement).all()
    for division in old_divisions:
        session.delete(division)
    statement = select(Groups)
    old_groups = session.exec(statement).all()
    for group in old_groups:
        session.delete(group)

    for division in divs:
        div_db = Divisions.model_validate(division)
        session.add(div_db)
    for group in groups:
        group_db = Groups.model_validate(group)
        session.add(group_db)
    session.commit()
    return {"message" : "Created"}


@app.get("/islive")
def get_is_live() -> bool:
    return twitch.is_channel_live()

@app.get("/getupcoming")
def get_upcoming(div: str | None = None, session: Session = Depends(get_session)) -> List[GetUpcoming]:
    statement = select(Upcoming)
    if div is not None:
        statement = statement.where(Upcoming.division == div)
    results = session.exec(statement).all()
    return results

@app.post("/addupcoming", status_code=status.HTTP_201_CREATED)
def add_upcoming(upcoming: AddUpcoming, password: str, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    upcoming_db = Upcoming.model_validate(upcoming)
    session.add(upcoming_db)
    session.commit()
    return {"message" : "Created"}

@app.delete("/deleteupcoming", status_code=status.HTTP_200_OK)
def delete_upcoming(upcoming_id: int, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    statement = select(Upcoming).where(Upcoming.id == upcoming_id)
    upcoming = session.exec(statement).first()
    session.delete(upcoming)
    session.commit()
    return {"message" : "Upcoming removed"}