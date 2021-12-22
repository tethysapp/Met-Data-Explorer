#!/bin/bash
cwd="$(pwd)/tethysapp/metdataexplorer2/workspaces/app_workspace/"
cd $cwd

touch .netrc
touch .dodsrc
touch .urs_cookies

chmod 777 .netrc
chmod 777 .dodsrc
chmod 777 .urs_cookies

printf "HTTP.COOKIEJAR=$cwd.urs_cookies\nHTTP.NETRC=$cwd.netrc" >> .dodsrc

