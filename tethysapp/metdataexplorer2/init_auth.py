import os

with open(os.open(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.netrc'),
                  os.O_CREAT | os.O_WRONLY, 0o744), 'w') as fh:
    fh.close()

with open(os.open(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.dodsrc'),
                  os.O_CREAT | os.O_WRONLY, 0o744), 'w') as fl:
    fl.close()

with open(os.open(os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.urs_cookies'),
                  os.O_CREAT | os.O_WRONLY, 0o744), 'w') as ft:
    ft.write('HTTP.COOKIEJAR=' + os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.urs_cookies')
             + '\nHTTP.NETRC=' + os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', '.netrc'))
    ft.close()