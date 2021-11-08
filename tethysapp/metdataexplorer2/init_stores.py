from sqlalchemy.orm import sessionmaker

from .model import Base

import os


# Initialize an empty database, if the database has not been created already.
def init_thredds_db(engine, first_time):
    print("Initializing Persistant Storage")
    Base.metadata.create_all(engine)
    if first_time:
        # # Make session
        SessionMaker = sessionmaker(bind=engine)
        session = SessionMaker()

        session.close()
        print("Finishing Initializing Persistant Storage")

        open(os.path.expanduser('~') + '/.netrc', 'a+').close()
        open(os.path.expanduser('~') + '/.urs_cookies', 'a+').close()
        file = open(os.path.expanduser('~') + '/.dodsrc', 'w+')
        file.write('HTTP.COOKIEJAR=' + os.path.expanduser('~') + '/.urs_cookies\nHTTP.NETRC=' + os.path.expanduser(
            '~') + '/.netrc')
        file.close()
