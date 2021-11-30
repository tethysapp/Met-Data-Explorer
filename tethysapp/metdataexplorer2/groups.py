import json
import logging
import netCDF4
import pandas as pd
import requests
import xarray
from django.http import JsonResponse, HttpResponse
from siphon.catalog import TDSCatalog
from tethys_sdk.permissions import has_permission

from .app import Metdataexplorer2 as app
from .model import Variables, Thredds, Groups

log = logging.getLogger('tethys.metdataexplorer2')
Persistent_Store_Name = 'thredds_db'


def filter_by_variable(request):
    return_objt = {}
    selected_vars = request.POST.getlist('variables')
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    for selected_var in selected_vars:
        tdds_group = session.query(Thredds).join(Variables).filter(Variables.name == selected_var).all()
        for tdds_single in tdds_group:
            if tdds_single.group.name in return_objt:
                if tdds_single.title not in return_objt[tdds_single.group.name]:
                    return_objt[tdds_single.group.name].append(tdds_single.title)
            else:
                return_objt[tdds_single.group.name] = []
                return_objt[tdds_single.group.name].append(tdds_single.title)
    return JsonResponse(return_objt)


def give_all_attributes(request):
    return_objt = {}
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    variables = session.query(Variables).all()
    list_vars = []

    for variable in variables:
        list_vars.append(variable.name)
    return_objt['attrs'] = list_vars
    return JsonResponse(return_objt)


def thredds_proxy(request):
    try:
        if 'main_url' in request.GET:
            request_url = request.GET.get('main_url')
            query_params = request.GET.dict()
            query_params.pop('main_url', None)
            r = requests.get(request_url, params=query_params)
            return HttpResponse(r.content, content_type="image/png")
        else:
            return JsonResponse({})
    except Exception as e:
        print(e)
        return JsonResponse({'error': e})


def get_files_and_folders(request):
    url = request.GET.get('url')
    print(url)
    data_tree = {}
    folders_dict = {}
    files_dict = {}

    try:
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
    final_obj = {}
    final_obj['dataTree'] = data_tree
    final_obj['correct_url'] = correct_url
    return JsonResponse(final_obj)


def get_variables_and_file_metadata(request):
    url = request.GET.get('opendapURL')
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
    for variable in ds.variables:
        dimension_list = []
        try:
            var_lo = ds[variable].units
            print(var_lo)
        except Exception as e:
            print(e)
            print("no units")
        if len(ds[variable].dimensions) > 2:
            for dimension in ds[variable].dimensions:
                dimension_list.append(dimension)
            array = {'dimensions': dimension_list, 'units': 'false', 'color': 'false'}
            variables[variable] = array

    return JsonResponse({'variables_sorted': variables, 'file_metadata': file_metadata})


def add_group(request):
    group_obj = {}
    single_obj = {}
    services_array = []
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    if request.is_ajax() and request.method == 'POST':
        groups_info = json.loads(request.POST.get("data"))
        description = groups_info['description']
        title = groups_info['title']
        services = groups_info['attributes']
        group_obj['title'] = title
        group_obj['description'] = description
        group_thredds = Groups(name=title, description=description)

        for servi in services:
            # File Metadata
            file_tempt_dict = {}
            try:
                ds = netCDF4.Dataset(servi['url'])
            except Exception as e:
                print(e)
            # INITIALIZING THE THREDDS FILES
            try:
                for metadata_string in ds.__dict__:
                    file_tempt_dict[metadata_string] = str(ds.__dict__[metadata_string])
            except Exception as e:
                print(e)
            file_attr_ex = {}
            try:
                da = xarray.open_dataset(servi['url'].strip(), chunks={"time": '100MB'})
                attr_dims = da.coords.keys()

                for hl in attr_dims:
                    if hl != 'lat' and hl != 'lon':
                        if 'time' not in hl:
                            file_attr_ex[hl] = da.coords[hl].to_dict()['data']
            except Exception as e:
                print(e)
                nc = netCDF4.Dataset(servi['url'])
                dims = nc.dimensions.keys()
                for dim in dims:
                    if dim in nc.variables:
                        if dim != 'lat' and dim != 'lon':
                            if 'time' not in dim:
                                h = nc.variables[dim]
                                hs = pd.Series(h[:])
                                file_attr_ex[dim] = hs.to_list()

            print(file_attr_ex)
            print(servi['authentication'])

            thredds_one = Thredds(server_type=servi['type'],
                                  title=servi['title'],
                                  url=servi['url'],
                                  url_wms=servi['url_wms'],
                                  url_subset=servi['url_subset'],
                                  epsg=servi['epsg'],
                                  spatial=json.dumps({}),
                                  description=servi['description'],
                                  timestamp=servi['timestamp'],
                                  metadata_td_file=json.dumps(file_tempt_dict),
                                  extra_coordinate=json.dumps(file_attr_ex),
                                  authentication=servi['authentication'])

            # Attributes addition and metadata
            for key in servi['attributes']:
                variable_tempt_dict = {}
                try:
                    for metadata_string in ds[key].__dict__:
                        variable_tempt_dict[metadata_string] = str(ds[key].__dict__[metadata_string])
                except Exception as e:
                    print(e)

                variable_one = Variables(name=key, dimensions=servi['attributes'][key]['dimensions'],
                                         units=servi['attributes'][key]['units'],
                                         color=servi['attributes'][key]['color'],
                                         metadata_variable=json.dumps(variable_tempt_dict))

                thredds_one.attributes.append(variable_one)

            group_thredds.thredds_server.append(thredds_one)
            single_obj = servi
            single_obj['metadata_file'] = json.dumps(file_tempt_dict)
            services_array.append(single_obj)

        session.add(group_thredds)
        session.commit()
        session.close()
        group_obj['services'] = services_array

    return JsonResponse(group_obj)


def refresh_group(request):
    group_obj = {}
    specific_group = request.GET.get('group')
    specific_tds = request.GET.get('tds')
    print(specific_group)

    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)

    session = SessionMaker()  # Initiate a session
    thredds_in_group = session.query(Groups).filter(Groups.name == specific_group)[0].thredds_server

    for trds in thredds_in_group:
        layer_obj = {}
        layer_obj["title"] = trds.title
        if layer_obj["title"] == specific_tds:
            print(layer_obj["title"])
    group_obj['services'] = "this group"
    return JsonResponse(group_obj)


def load_group(request):
    specific_group = request.GET.get('group')

    list_catalog = {}

    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)

    session = SessionMaker()  # Initiate a session
    thredds_in_group = session.query(Groups).filter(Groups.name == specific_group)[0].thredds_server
    td_list = []
    for trds in thredds_in_group:
        layer_obj = {}
        layer_obj["title"] = trds.title
        layer_obj["url"] = trds.url.strip()
        layer_obj["url_wms"] = trds.url_wms.strip()
        layer_obj["url_subset"] = trds.url_subset.strip()
        layer_obj["epsg"] = trds.epsg
        layer_obj["spatial"] = trds.spatial
        layer_obj["description"] = trds.description
        layer_obj["timestamp"] = trds.timestamp
        layer_obj["metadata_file"] = trds.metadata_td_file
        layer_obj["extra_coordinate"] = trds.extra_coordinate
        layer_obj["attributes"] = []

        for attribute_single in trds.attributes:
            temp_var_td = {}

            temp_var_td['name'] = attribute_single.name
            temp_var_td['dimensions'] = attribute_single.dimensions
            temp_var_td['units'] = attribute_single.units
            temp_var_td['color'] = attribute_single.color
            temp_var_td['metadata_var'] = attribute_single.metadata_variable
            layer_obj["attributes"].append(temp_var_td)
        td_list.append(layer_obj)

    list_catalog["thredds"] = td_list

    return JsonResponse(list_catalog)


def get_groups_list(request):
    list_catalog = {}
    print(Persistent_Store_Name)
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    print('Session Maker:')
    print(SessionMaker)
    session = SessionMaker()  # Initiate a session

    thredds_groups = session.query(Groups).all()

    thredds_groups_list = []
    for group in thredds_groups:
        layer_obj = {}
        layer_obj["title"] = group.name
        layer_obj["description"] = group.description

        thredds_groups_list.append(layer_obj)

    list_catalog["groups"] = thredds_groups_list

    return JsonResponse(list_catalog)


# DELETE A GROUP OF HYDROSERVERS
def delete_groups(request):
    list_catalog = {}
    list_groups = {}
    list_response = {}
    level_response = {}
    if has_permission(request, "delete_groups"):

        SessionMaker = app.get_persistent_store_database(
            Persistent_Store_Name, as_sessionmaker=True)
        session = SessionMaker()
        if request.is_ajax() and request.method == 'POST':
            groups = request.POST.getlist('groups[]')
            list_groups['groups'] = groups
            list_response['groups'] = groups
            i = 0
            arrayTitles = []
            level_response = {}
            for group in groups:
                level_response[group] = {}

                thredds_group = session.query(Groups).filter(Groups.name == group)[0].thredds_server
                for single_thredds in thredds_group:
                    title = single_thredds.title
                    arrayTitles.append(title)
                    i_string = str(i)
                    list_catalog[i_string] = title
                    level_response[group][title] = []

                    vars_thredds = session.query(Thredds).filter(Thredds.title == single_thredds.title)[0].attributes

                    for single_var in vars_thredds:
                        title_var = single_var.name
                        level_response[group][title].append(title_var)
                    i = i + 1
                thredds_group = session.query(Groups).filter(Groups.name == group).first()
                session.delete(thredds_group)
                session.commit()
                session.close()
            list_response['thredds'] = arrayTitles
            list_response['levels'] = level_response

    return JsonResponse(list_response)
