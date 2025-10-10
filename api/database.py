from sqlmodel import SQLModel, create_engine
from colorthief import ColorThief

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///database/{sqlite_file_name}"

engine = create_engine(sqlite_url)

def getMainColor(logo) -> str:
    color_thief = ColorThief(f"photos/{logo}")
    r, g, b = color_thief.get_color(quality=1)
    return f"#{r:02X}{g:02X}{b:02X}"

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)