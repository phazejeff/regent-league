from database import engine
from models import *
from sqlmodel import Session, delete, desc, select, func, or_, and_

placements = {
    'Elites': [
        ('UBC Elite', 1, False),
        ('CSU Fullerton Blue', 2, False),
        ('Gaucho Gaming', 3, False),
        ('Kansas State University', 4, False),
        ('UCSC Onyx', 5, False),
        ('Bronco Esports', 5, False),
        ('CSUSM CS2 Blue', 5, False),
        ('DU Crimson', 5, False)
    ],
    'Challengers' : [
        ('NMSU Crimson', 1, False),
        ('University of Idaho Vandals', 2, False),
        ('UCSC Sardonyx', 3, False),
        ('Tritons Gold', 4, False),
        ('CPP Indigo', 5, False),
        ('SDSU Black', 5, False),
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
            semester='Spring',
            year=2026,
            split=placement[2]
        )
        session.add(p)
session.commit()
session.close()