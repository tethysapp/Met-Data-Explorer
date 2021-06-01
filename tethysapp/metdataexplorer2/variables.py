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

def add_vars(request):
    group_obj={}
    services_array = []
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    tdds_info = json.loads(request.POST["attributes"])
    actual_tdds = request.POST["current_tdds"]
    actual_group = request.POST["current_group"]
    unique_vars = []
    if request.is_ajax() and request.method == 'POST':

        ## File Metadata ##
        file_tempt_dict = {}
        # tdds_objects = session.query(Thredds).filter(Thredds.title == actual_tdds)
        tdds_object = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(Thredds.title == actual_tdds).first()
        print(tdds_object.__dict__)
        print(tdds_object.group.__dict__)
        # for td_single_obj in tdds_objects:
        #     if td_single_obj.group.name == actual_group and td_single_obj.title == actual_tdds:
        #         print(td_single_obj.group.name)
        #         print(td_single_obj.title)
        #         tdds_object = td_single_obj

        try:
            ds = netCDF4.Dataset(tdds_object.url)
            for metadata_string in ds.__dict__:
                file_tempt_dict[metadata_string] = str(ds.__dict__[metadata_string])
        except Exception as e:
            print(e)

        ## Attributes addition and metadata ##
        for key in tdds_info:
            variable_tempt_dict = {}
            try:
                for metadata_string in ds[key].__dict__:
                    variable_tempt_dict[metadata_string] = str(ds[key].__dict__[metadata_string])
            except Exception as e:
                print(e)
            # variable_metadata [key] = variable_tempt_dict
            tdds_var_query = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(Thredds.title == actual_tdds).join(Variables).filter(Variables.name == key).count()
            print(tdds_var_query)
            if tdds_var_query == 0:
                variable_one = Variables(name= key,dimensions =tdds_info[key]['dimensions'],
                                    units = tdds_info[key]['units'],
                                    color = tdds_info[key]['color'],
                                    metadata_variable = json.dumps(variable_tempt_dict))
                tdds_object.attributes.append(variable_one)

            # for single_var in tdds_object.attributes:
            #     # variable_one = Variables(name= key,dimensions =tdds_info[key]['dimensions'],
            #     #                     units = tdds_info[key]['units'],
            #     #                     color = tdds_info[key]['color'],
            #     #                     metadata_variable = json.dumps(variable_tempt_dict))
            #     if single_var.name != key and key not in unique_vars:
            #         unique_vars.append(key)
            #         print(key)
            #         print(key not in unique_vars)
            #         variable_one = Variables(name= key,dimensions =tdds_info[key]['dimensions'],
            #                             units = tdds_info[key]['units'],
            #                             color = tdds_info[key]['color'],
            #                             metadata_variable = json.dumps(variable_tempt_dict))
            #         #
            #         tdds_object.attributes.append(variable_one)
            # for unique_var in unique_vars:
                # tdds_object.attributes.append(unique_var)

        services_array.append(tdds_info)
        session.add(tdds_object)
        session.commit()
        session.close()

        session = SessionMaker()
        tdds_object2 = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(Thredds.title == actual_tdds).first()
        old_attr_arr = []
        for old_attr in tdds_object2.attributes:
            variable_obj = {}
            variable_obj['name'] = old_attr.name
            variable_obj['dimensions'] = old_attr.dimensions
            variable_obj['units'] = old_attr.units
            variable_obj['color'] = old_attr.color
            variable_obj['metatada'] = old_attr.metadata_variable

            old_attr_arr.append(variable_obj)
        session.commit()
        session.close()

        group_obj['all_attr'] = old_attr_arr
        group_obj['services'] = services_array

    return JsonResponse(group_obj)

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
