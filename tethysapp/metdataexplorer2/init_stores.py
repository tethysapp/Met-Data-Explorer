from sqlalchemy.orm import sessionmaker

from .model import Base
from .init_auth import make_auth_files

import os


# Initialize an empty database, if the database has not been created already.
def init_thredds_db(engine, first_time):
    print("Initializing Persistant Storage")
    Base.metadata.create_all(engine)
    make_auth_files()
    if first_time:
        # # Make session
        SessionMaker = sessionmaker(bind=engine)
        session = SessionMaker()

        session.close()
        print("Finishing Initializing Persistant Storage")
