from database import engine
from models import *
from sqlmodel import Session, delete, desc, select, func, or_, and_

placements = {
    'Elites': [
        ('UBC Elite', 1, False),
        ('CSUSM CS2 Blue', 2, False),
        ('CSU Fullerton Blue', 3, True),
        ('Gaucho Gaming', 3, True),
        ('DU Crimson', 5, False),
        ('Bronco Esports', 5, False)
    ],
    'Challengers' : [
        ('University of Idaho Vandals', 1, False),
        ('UCSC Sardonyx', 2, False),
        ('Tritons Gold', 3, False),
        ('CSUSM CS2 Black', 4, False),
        ('CPP Indigo', 5, False),
        ('UCSC Onyx', 5, False),
        ('SU Esports & Gaming', 5, False)
    ]
}

session = Session(engine)
for div in placements:
    print(div)
    for placement in placements[div]:
        stmt = select(Team).where(Team.name == placement[0])
        team_db = session.exec(stmt).first()
        p = Placements(
            team_id=team_db.id,
            placement=placement[1],
            division=div,
            semester='Fall',
            year=2025,
            split=placement[2]
        )
        session.add(p)
session.commit()
session.close()