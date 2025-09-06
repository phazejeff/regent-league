from typing import List, Dict
from fastapi import FastAPI
from .database import create_db_and_tables, engine
from .models import *
from sqlmodel import Session, select, func
from pydantic import BaseModel

create_db_and_tables()
app = FastAPI()

class TeamStats(BaseModel):
    team: Team
    match_wins: int
    match_losses: int
    map_wins: int
    map_losses: int
    round_wins: int
    round_losses: int

class PlayerstatsAggregated(BaseModel):
    id: int
    name: str
    team: Team
    K: int
    D: int
    A: int
    ADR: float
    HS: float
    accuracy: float

@app.get("/")
def read_root():
    return {"Status" : "OK"}

@app.post("/addmatch")
def add_match(match: Match, maps: List[Map], playerstats: List[Playerstats]):
    session = Session(engine)
    session.add_all([match, *maps, *playerstats])
    session.commit()
    return {"message" : "Created"}

@app.post("/addteam")
def add_team(team: Team):
    print(team)
    session = Session(engine)
    session.add(team)
    session.commit()
    return {"message" : "Created"}

@app.post("/addplayers")
def add_players(players: List[Player]):
    session = Session(engine)
    session.add_all(players)
    session.commit()
    return {"message" : "Created"}

@app.get("/matches")
def get_matches() -> List[Match]:
    session = Session(engine)
    statement = select(Match)
    results = session.exec(statement).all()
    return results

@app.get("/standings")
def get_standings(div: str, group: str) -> List[TeamStats]:
    session = Session(engine)
    statement = select(Team).where(Team.div == div and Team.group == group)
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
            t.match_wins - t.map_losses,
            t.map_wins - t.map_losses,
            t.round_wins - t.round_losses
        )
    )
    return all_team_stats

@app.get("/playerstats")
def get_playerstats(div: int | None = None, group: int | None = None) -> List[PlayerstatsAggregated]:
    session = Session(engine)
    statement = (
        select(
            Player.id,
            Player.name,
            Player.team,
            func.sum(Playerstats.K).label("K"),
            func.sum(Playerstats.A).label("A"),
            func.sum(Playerstats.D).label("D"),
            func.avg(Playerstats.ADR).label("ADR"),
            func.avg(Playerstats.hs_percent).label("HS"),
            func.avg(Playerstats.accuracy).label("accuracy")
        )
        .join(Playerstats, Player.id == Playerstats.player_id)
        .group_by(Player.id)
    )

    results = session.exec(statement).all()
    return results