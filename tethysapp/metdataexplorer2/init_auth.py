import os

from .helpers import *

logger.info("Creating authentication files")

try:
    with open(os.open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'workspaces', 'app_workspace',
                                   '.netrc'), os.O_CREAT | os.O_WRONLY, 0o744), 'w') as fh:
        fh.truncate()
        fh.close()

except Exception as e:
    logger.info(e)

try:
    with open(os.open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'workspaces', 'app_workspace',
                                   '.urs_cookies'), os.O_CREAT | os.O_WRONLY, 0o744), 'w') as fl:
        fl.truncate()
        fl.close()

except Exception as e:
    logger.info(e)

try:
    with open(os.open(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'workspaces', 'app_workspace', '.dodsrc'),
                      os.O_CREAT | os.O_WRONLY, 0o744), 'w') as ft:
        ft.truncate()
        ft.write('HTTP.COOKIEJAR=' + os.path.join(os.path.dirname(os.path.realpath(__file__)), 'workspaces',
                                                  'app_workspace', '.urs_cookies') + '\nHTTP.NETRC='
                 + os.path.join(os.path.dirname(os.path.realpath(__file__)), 'workspaces', 'app_workspace', '.netrc'))
        ft.close()

except Exception as e:
    logger.info(e)
