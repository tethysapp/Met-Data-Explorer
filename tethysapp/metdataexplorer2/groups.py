
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from tethys_sdk.permissions import  has_permission
from siphon.catalog import TDSCatalog
import requests
import netCDF4
import logging
from .model import Variables, Thredds, Groups
import json

# from .model import Thredds, Groups
from .app import Metdataexplorer2 as app

log = logging.getLogger('tethys.metdataexplorer2')
Persistent_Store_Name = 'thredds_db'





def get_files_and_folders(request):
    url = request.GET['url']
    data_tree = {}
    folders_dict = {}
    files_dict = {}

    try:
        #ToDo error on gfs catalog top folder, server error
        ds = TDSCatalog(url)
    except Exception as e:
        print(e)
        exception = 'Invalid URL'
        return JsonResponse({'dataTree': exception})

    folders = ds.catalog_refs
    for x in enumerate(folders):
        try:
            TDSCatalog(folders[x[0]].href)
            folders_dict[folders[x[0]].title] = folders[x[0]].href
        except Exception as e:
            print(e)

    files = ds.datasets
    for x in enumerate(files):
        files_dict[files[x[0]].name] = files[x[0]].access_urls

    data_tree['folders'] = folders_dict
    data_tree['files'] = files_dict

    correct_url = ds.catalog_url
    return JsonResponse({'dataTree': data_tree, 'correct_url': correct_url})

def get_variables_and_file_metadata(request):
    url = request.GET['opendapURL']
    variables = {}
    file_metadata = ''

    try:
        ds = netCDF4.Dataset(url)
    except OSError:
        log.exception('get_variables_and_file_metadata')
        exception = False
        return JsonResponse({'variables_sorted': exception})

    for metadata_string in ds.__dict__:
        file_metadata += '<b>' + str(metadata_string) + '</b><br><p>' + str(ds.__dict__[metadata_string]) + '</p>'
    # print(ds.variables)
    for variable in ds.variables:
        dimension_list = []
        try:
            VAR_LO = ds[variable].units
        except Exception as e:
            print("no units")
        for dimension in ds[variable].dimensions:

            dimension_list.append(dimension)
        array = {'dimensions': dimension_list, 'units': 'false', 'color': 'false'}
        variables[variable] = array

    return JsonResponse({'variables_sorted': variables, 'file_metadata': file_metadata})



def add_group(request):
    group_obj={}
    services_array = []
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    if request.is_ajax() and request.method == 'POST':
        # print(request.POST)
        groups_info = json.loads(request.POST["data"])
        print(groups_info)
        description = groups_info['description']
        title = groups_info['title']
        services = groups_info['attributes']
        group_obj['title']= title
        group_obj['description']= description
        group_thredds = Groups(name=title, description=description)

        # hydroservers_group = session.query(Groups).filter(Groups.title == group)[0]

        for servi in services:

            thredds_one = Thredds(server_type=servi['type'],
                             title=servi['title'],
                             url = servi['url'],
                             epsg=servi['epsg'],
                             spatial = json.dumps(servi['spatial']),
                             description = servi['description'],
                             timestamp = servi['timestamp'])
            for key in servi['attributes']:
                variable_one = Variables(name= key,dimensions =servi['attributes'][key]['dimensions'],
                                    units = servi['attributes'][key]['units'],color = servi['attributes'][key]['color'])

                thredds_one.attributes.append(variable_one)

            group_thredds.thredds_server.append(thredds_one)
            services_array.append(servi)
        session.add(group_thredds)
        session.commit()
        session.close()
        group_obj['services'] = services_array

    return JsonResponse(group_obj)

def load_group(request):

    specific_group=request.GET.get('group')

    list_catalog = {}

    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)

    # print(SessionMaker)
    session = SessionMaker()  # Initiate a session
    thredds_in_group = session.query(Groups).filter(Groups.name == specific_group)[0].thredds_server
    td_list = []
    for trds in thredds_in_group:
        layer_obj = {}
        layer_obj["title"] = trds.title
        layer_obj["url"] = trds.url.strip()
        layer_obj["epsg"] = trds.epsg
        layer_obj["spatial"] = trds.spatial
        layer_obj["description"] = trds.description
        layer_obj["timestamp"] = trds.timestamp

        td_list.append(layer_obj)

    list_catalog["thredds"] = td_list

    return JsonResponse(list_catalog)

def get_groups_list(request):
    list_catalog = {}
    #print("get_groups_list controllers.py FUNCTION inside")

    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)

    #print(SessionMaker)
    session = SessionMaker()  # Initiate a session


    # Query DB for hydroservers
    thredds_groups = session.query(Groups).all()

    thredds_groups_list = []
    for group in thredds_groups:
        layer_obj = {}
        layer_obj["title"] = group.name
        layer_obj["description"] = group.description

        thredds_groups_list.append(layer_obj)

    list_catalog["groups"] = thredds_groups_list


    return JsonResponse(list_catalog)


######*****************************************************************************************################
############################## DELETE A GROUP OF HYDROSERVERS #############################
######*****************************************************************************************################
def delete_groups(request):
    list_catalog = {}
    list_groups ={}
    list_response = {}
    if has_permission(request,"delete_groups"):

        SessionMaker = app.get_persistent_store_database(
            Persistent_Store_Name, as_sessionmaker=True)
        session = SessionMaker()
        #print(request.POST)
        if request.is_ajax() and request.method == 'POST':
            groups=request.POST.getlist('groups[]')
            list_groups['groups']=groups
            list_response['groups']=groups
            #print(groups)
            i=0
            arrayTitles = []
            # for group in session.query(Groups).all():
            #     print(group.title)

            for group in groups:
                thredds_group = session.query(Groups).filter(Groups.name == group)[0].thredds_server
                for single_thredds in thredds_group:
                    title=single_thredds.title
                    arrayTitles.append(title)
                    i_string=str(i);
                    list_catalog[i_string] = title

                    i=i+1
                thredds_group = session.query(Groups).filter(Groups.name == group).first()
                session.delete(thredds_group)
                session.commit()
                session.close()
            list_response['thredds']=arrayTitles

    return JsonResponse(list_response)




# def add_thredd(request):
#     group_obj={}
#     group_obj['reponse'] = 'failed'
#
#     SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
#     session = SessionMaker()  # Initiate a session
#     if request.is_ajax() and request.method == 'POST':
#         # print(request.POST)
#         groups_info = json.loads(request.POST["data"])
#         print(groups_info)
#         description = groups_info['description']
#         title = groups_info['title']
#         services = groups_info['attributes']
#         group_obj['title']= title
#         group_obj['description']= description
#         group_thredds = Groups(title=title, description=description)
#
#         # hydroservers_group = session.query(Groups).filter(Groups.title == group)[0]
#         for servi in services:
#             thredds_one = Thredds(server_type=servi['title'],
#                              title=servi['url'],
#                              url = servi['description'],
#                              epsg=servi['epsg'],
#                              spatial = servi['spatial'],
#                              description = servi['description'],
#                              attributes = servi['attributes'],
#                              timestamp = servi['timestamp'])
#             for key in servi['attributes']:
#                 variable_one = Variables(name= key,dimensions =servi['attributes'][key]['dimensions'],
#                                     units = servi['attributes'][key]['units'],color = servi['attributes'][key]['color'])
#
#                 thredds_one.attributes.append(variable_one)
#
#             group_thredds.thredds_servers.append(thredds_one)
#
#
#         session.add(group_thredds)
#         session.commit()
#         session.close()
#         group_obj['reponse'] = 'success'
#
#     return JsonResponse(group_obj)
