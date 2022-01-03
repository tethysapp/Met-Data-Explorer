#! /bin/bash
printf "Running post shell script" >> /var/log/tethys/tethys.log
python tethysapp/metdataexplorer2/init_auth.py
