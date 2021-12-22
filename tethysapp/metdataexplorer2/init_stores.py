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

        netrc_file = open(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.netrc'), "w")
        netrc_file.close()
        os.chmod(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.netrc'), 0o777)
        cookies_file = open(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.urs_cookies'), "w")
        cookies_file.close()
        os.chmod(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.urs_cookies'), 0o777)
        file = open(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.dodsrc'), 'w')
        os.chmod(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.dodsrc'), 0o777)
        file.write('HTTP.COOKIEJAR=' + os.path.join(os.path.dirname(__file__), 'workspaces',
                                                    'app_workspace', '.urs_cookies')
                   + '\nHTTP.NETRC=' + os.path.join(os.path.dirname(__file__), 'workspaces',
                                                    'app_workspace', '.netrc'))
        file.close()
