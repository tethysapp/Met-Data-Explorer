from django.http import JsonResponse, HttpResponse
import grids
import tempfile
import os
import json
import requests
import geopandas as gpd
from geojson import dump
from .model import Variables, Thredds, Groups
from siphon.catalog import TDSCatalog
import requests
import netCDF4
from .timestamp import iterate_files
from .app import Metdataexplorer2 as app

Persistent_Store_Name = 'thredds_db'

def delete_vars(request):
    final_list = {}
    SessionMaker = app.get_persistent_store_database(
        Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()

    # Query DB for hydroservers
    if request.is_ajax() and request.method == 'POST':
        try:
            variables_tdds =request.POST.getlist('variable')
            group = request.POST.get('actual-group')
            tdds = request.POST.get('actual-tdds')

            i=0;
            tdds_group = session.query(Thredds).filter(Thredds.title == tdds).first()
            for single_var in variables_tdds:
                var_row = session.query(VariableS).filter(Variables.title == single_var).first()
                session.delete(var_row)
                session.commit()
                session.close()
            final_list['tdds_list'] = variables_tdds
        except Exception as e:
            final_list['tdds_list'] = []

    return JsonResponse(final_list)
