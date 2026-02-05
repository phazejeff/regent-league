from collections import defaultdict
from typing import List
from zoneinfo import ZoneInfo
from fastapi import FastAPI, Form, HTTPException, Response, status, Depends, File, UploadFile
from fastapi.staticfiles import StaticFiles
from .database import create_db_and_tables, engine, getMainColor
from .models import *
from .collegecounter.models import *
from sqlmodel import Session, delete, desc, select, func, or_, and_
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
from .twitch import Twitch
from datetime import datetime, timedelta, timezone
from .faceit import Faceit

create_db_and_tables()
app = FastAPI(
    title="Regent League API",
    contact={
        "name" : "poop dealer",
        "email" : "phazejeff@proton.me"
    },
    openapi_tags=[
        {
            "name" : "CollegeCounter",
            "description" : "Collection of endpoints designed specifically for CollegeCounter. Hi Aidan :)"
        }
    ]
)

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

# with Session(engine) as session:
#     statement = select(Team)
#     teams = session.exec(statement).all()
#     for team in teams:
#         team.mainColor = getMainColor(team.logo)
#     session.add_all(teams)
#     session.commit()

class PlayerWithTeam(PlayerBase):
    id: int
    team_id: int | None = None
    team: Team | None = None

class TeamStats(BaseModel):
    team: Team | None = None
    match_wins: int = 0
    match_losses: int = 0
    map_wins: int = 0
    map_losses: int = 0
    round_wins: int = 0
    round_losses: int = 0

class PlayerstatsAggregated(BaseModel):
    id: int
    name: str
    team: str
    K: int
    D: int
    A: int
    ADR: float
    HS: Optional[float]
    accuracy: Optional[float]
    games: int

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
    winner_id: int

class MatchWithMapsWithStats(MatchBase):
    team1: Team
    team2: Team
    winner_id: int
    maps: List[MapWithStats]

class MatchWithMapsWithStatsId(MatchWithMapsWithStats):
    id: int

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

class EditUpcoming(UpcomingBase):
    id: int
    team1_id: int
    team2_id: int

class TeamFull(TeamBase):
    id: int
    players: List[Player]
    sub_players: List[Player]
    matches_as_team1: List[MatchWithMapsWithStats]
    matches_as_team2: List[MatchWithMapsWithStats]
    upcoming_as_team1: List[GetUpcoming]
    upcoming_as_team2: List[GetUpcoming]

class GetPlacement(PlacementsBase):
    team: Team

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
        upcoming_id=match_data.upcoming_id
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

@app.post("/editmatch/{match_id}", status_code=status.HTTP_200_OK)
def edit_match(match_id: int, match_data: MatchCreate, password: str, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message": "Incorrect password"}

    match = session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    team1 = session.get(Team, match_data.team1_id)
    team2 = session.get(Team, match_data.team2_id)
    if not team1 or not team2:
        raise HTTPException(status_code=404, detail="One or both teams not found")

    match.team1_id = match_data.team1_id
    match.team2_id = match_data.team2_id
    match.score1 = match_data.score1
    match.score2 = match_data.score2
    match.datetime = match_data.datetime
    match.winner_id = match_data.winner_id

    existing_maps = session.exec(select(Map).where(Map.match_id == match.id)).all()
    for map_obj in existing_maps:
        session.exec(delete(Playerstats).where(Playerstats.map_id == map_obj.id))
        session.exec(delete(MapPlayer).where(MapPlayer.map_id == map_obj.id))
        session.delete(map_obj)
    session.flush()

    for map_data in match_data.maps:
        new_map = Map(
            map_num=map_data.map_num,
            map_name=map_data.map_name,
            team1_score=map_data.team1_score,
            team2_score=map_data.team2_score,
            winner_id=map_data.winner_id,
            match_id=match.id,
            map_picker_name=map_data.map_picker_name,
        )
        session.add(new_map)
        session.flush()

        # Add Player Stats for each map
        for ps in map_data.player_stats:
            player = session.get(Player, ps.player_id)
            if not player:
                raise HTTPException(status_code=404, detail=f"Player {ps.player_id} not found")

            # MapPlayer
            mp = MapPlayer(
                map_id=new_map.id,
                player_id=ps.player_id,
                team_id=player.team_id,
            )
            session.add(mp)

            # Playerstats
            stats = Playerstats(
                player_id=ps.player_id,
                map_id=new_map.id,
                K=ps.K,
                A=ps.A,
                D=ps.D,
                ADR=ps.ADR,
                hs_percent=ps.hs_percent,
                KPR=ps.KPR,
            )
            session.add(stats)

    session.commit()
    session.refresh(match)

    return {"message": "Match updated successfully"}

@app.get("/match/{match_id}")
def get_match(match_id: int, session: Session = Depends(get_session)) -> MatchWithMapsWithStatsId:
    statement = select(Match).where(Match.id == match_id)
    result = session.exec(statement).first()
    return result

@app.delete("/deletematch/{match_id}")
def delete_match(match_id: int, password: str, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message": "Incorrect password"}

    match = session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    existing_maps = session.exec(select(Map).where(Map.match_id == match.id)).all()
    for map_obj in existing_maps:
        session.exec(delete(Playerstats).where(Playerstats.map_id == map_obj.id))
        session.exec(delete(MapPlayer).where(MapPlayer.map_id == map_obj.id))
        session.delete(map_obj)
    session.delete(match)
    session.flush()
    session.commit()

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
def get_players(team_id: int | None = None, main_only: bool = False, session: Session = Depends(get_session)) -> List[PlayerWithTeam]:
    statement = select(Player)
    if team_id is not None:
        if main_only:
            statement = statement.where(and_(Player.team_id == team_id, Player.main == True, Player.former_player == False))
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

@app.get("/matches")
def get_matches(div: str | None = None, group: str | None = None, session: Session = Depends(get_session)) -> List[MatchWithMapsWithStatsId]:
    statement = select(Match).join(Match.team1)
    statement = statement.order_by(desc(Match.datetime))
    if div is not None:
        statement = statement.where(Team.div == div)
    if group is not None:
        statement = statement.where(Team.group == group)
    results = session.exec(statement).all()
    return results

@app.get("/teams")
def get_teams(div: str | None = None, active_only: bool = False, session: Session = Depends(get_session)) -> List[Team]:
    statement = select(Team).order_by(Team.name)
    if div is not None:
        statement = statement.where(Team.div == div)
    if active_only:
        statement = statement.where(Team.active == True)
    results = session.exec(statement).all()
    return results

@app.get("/team/{team_id}")
def get_team(team_id: int, session: Session = Depends(get_session)) -> TeamFull:
    statement = select(Team).where(Team.id == team_id)
    team = session.exec(statement).first()
    return team

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

    head_to_head = {}

    team_stats_map = {}

    for team in teams:
        matches = [*team.matches_as_team1, *team.matches_as_team2]
        stats = TeamStats()
        stats.team = team
        
        for match in matches:
            opponent_id = match.team1_id if match.team1_id != team.id else match.team2_id

            head_to_head.setdefault((team.id, opponent_id), 0)

            if match.winner_id == team.id:
                stats.match_wins += 1
                head_to_head[(team.id, opponent_id)] += 1
            else:
                stats.match_losses += 1

            for map in match.maps:
                if map.winner_id == team.id:
                    stats.map_wins += 1
                else:
                    stats.map_losses += 1

                if match.team1_id == team.id:
                    stats.round_wins += map.team1_score
                    stats.round_losses += map.team2_score
                else:
                    stats.round_wins += map.team2_score
                    stats.round_losses += map.team1_score

        team_stats_map[team.id] = stats

    groups = defaultdict(list)

    for stats in team_stats_map.values():
        key = (stats.match_wins, stats.match_losses)
        groups[key].append(stats)

    final_list = []

    for key, tied_teams in sorted(groups.items(), key=lambda x: (x[0][0] - x[0][1]), reverse=True):
        def tiebreaker(t: TeamStats):
            # Head-to-head score vs all tied opponents
            h2h_score = 0
            for other in tied_teams:
                if other.team.id == t.team.id:
                    continue
                h2h_score += head_to_head.get((t.team.id, other.team.id), 0)

            return (
                h2h_score,
                t.round_wins - t.round_losses,
                t.map_wins - t.map_losses,
            )

        tied_sorted = sorted(tied_teams, key=tiebreaker, reverse=True)
        final_list.extend(tied_sorted)

    return final_list

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
            func.coalesce(func.avg(Playerstats.hs_percent), None).label("HS"),
            func.coalesce(func.avg(Playerstats.accuracy), None).label("accuracy"),
            func.count().label("games")
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
def get_is_live(username: str | None = "regent_xd") -> bool:
    return twitch.is_channel_live(username)

@app.get("/getupcoming")
def get_upcoming(div: str | None = None, session: Session = Depends(get_session)) -> List[GetUpcoming]:
    statement = select(Upcoming)
    if div is not None:
        statement = statement.where(Upcoming.division == div)
    statement = statement.order_by(Upcoming.datetime, desc(Upcoming.casted))
    results = session.exec(statement).all()
    return results

@app.get("/getcurrentlycasted")
def get_currently_casted(div: str | None = None, session: Session = Depends(get_session)) -> List[GetUpcoming]:
    statement = select(Upcoming).where(and_(Upcoming.casted == True, Upcoming.datetime <= datetime.now(tz=ZoneInfo("UTC")) + timedelta(minutes=10)))
    if div is not None:
        statement = statement.where(Upcoming.division == div)
    statement = statement.order_by(Upcoming.datetime, desc(Upcoming.casted))
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

@app.post("/editupcoming", status_code=status.HTTP_201_CREATED)
def edit_upcoming(upcoming: EditUpcoming, password, response: Response, session: Session = Depends(get_session)):
    if password != PASSWORD:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {"message" : "Incorrect password"}
    upcoming_db = session.get(Upcoming, upcoming.id)
    for key, value in upcoming.model_dump(exclude_unset=True).items():
        if key == "id":
            continue
        setattr(upcoming_db, key, value)
    session.add(upcoming_db)
    session.commit()
    session.refresh(upcoming_db)
    return {"message" : "Created"}

@app.get("/placements")
def get_placements(div: str | None, session: Session = Depends(get_session)) -> List[GetPlacement]:
    placements_db = select(Placements)
    if div:
        placements_db = placements_db.where(Placements.division == div)
    placements_db = placements_db.order_by(Placements.placement)
    return session.exec(placements_db).all()

@app.get("/cc/teams", tags=["CollegeCounter"])
def get_teams_cc(session: Session = Depends(get_session)) -> List[CCTeam]:
    statement = select(Team).order_by(Team.name)
    statement = statement.where(Team.active == True)
    results = session.exec(statement).all()

    response = [CCTeam.convert_to_cc(result) for result in results]
    return response

@app.get("/cc/matches", tags=["CollegeCounter"])
def get_matches_cc(session: Session = Depends(get_session)) -> List[CCMatch]:
    statement = select(Upcoming)
    statement = statement.order_by(Upcoming.datetime)
    results = session.exec(statement).all()
    response = [CCMatch.convert_upcoming_to_cc(result) for result in results]

    statement = select(Match)
    statement = statement.order_by(Match.datetime)
    results = session.exec(statement).all()
    response = response + [CCMatch.convert_finished_match_to_cc(result) for result in results]

    return response

@app.get("/faceit/getmatch")
def get_faceit_match(faceit_url: str, session: Session = Depends(get_session)) -> MatchCreate:
    match_data, match_stats = Faceit.get_match(faceit_url)
    maps = match_stats["rounds"]
    mapsCreate = []
    for map in maps:
        team1 = map["teams"][0]
        team2 = map["teams"][1]

        team1player1stmt = select(Player).where(Player.faceit_url == "https://www.faceit.com/en/players/" + team1["players"][0]["nickname"])
        team1Db = session.exec(team1player1stmt).first().team
        team2player2stmt = select(Player).where(Player.faceit_url == "https://www.faceit.com/en/players/" + team2["players"][0]["nickname"])
        team2Db = session.exec(team2player2stmt).first().team

        if map["round_stats"]["Winner"] == team1["team_id"]:
            winner_id = team1Db.id
        elif map["round_stats"]["Winner"] == team2["team_id"]:
            winner_id = team2Db.id
        else:
            winner_id = 0
        
        playerstatsCreate = []
        for player in team1["players"] + team2["players"]:
            playerstats = player["player_stats"]
            playerStmt = select(Player).where(Player.faceit_url == "https://www.faceit.com/en/players/" + player["nickname"])
            playerDb = session.exec(playerStmt).first()
            if playerDb == None: continue
            playerstatCreate = PlayerstatsCreate(
                player_id = playerDb.id,
                K = int(playerstats["Kills"]),
                D = int(playerstats["Deaths"]),
                A = int(playerstats["Assists"]),
                ADR = float(playerstats["ADR"]),
                KPR = float(playerstats["K/R Ratio"]),
                hs_percent = float(playerstats["Headshots %"])
            )
            playerstatsCreate.append(playerstatCreate)
        
        mapCreate = MapCreate(
            map_name = map["round_stats"]["Map"],
            map_num = map["match_round"],
            team1_score = team1["team_stats"]["Final Score"],
            team2_score = team2["team_stats"]["Final Score"],
            map_picker_name = "",
            winner_id = winner_id,
            player_stats = playerstatsCreate
        )
        mapsCreate.append(mapCreate)

    if match_data["results"]["winner"] == "faction1":
        winner_id = team1Db.id
    elif match_data["results"]["winner"] == "faction2":
        winner_id = team2Db.id
    else:
        winner_id = 0

    matchCreate = MatchCreate(
        team1_id = team1Db.id,
        team2_id = team2Db.id,
        maps = mapsCreate,
        winner_id = winner_id,
        score1 = match_data["results"]["score"]["faction1"],
        score2 = match_data["results"]["score"]["faction2"],
        datetime = datetime.fromtimestamp(match_data["started_at"], tz=timezone.utc)
    )

    return matchCreate
