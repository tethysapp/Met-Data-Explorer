
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from tethys_sdk.permissions import login_required #, has_permission
from siphon.catalog import TDSCatalog
import requests
import netCDF4
import logging

# from .model import Thredds, Groups
from .app import Metdataexplorer2 as app

log = logging.getLogger('tethys.metdataexplorer2')



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
    print(ds.variables)
    for variable in ds.variables:
        dimension_list = []
        for dimension in ds[variable].dimensions:
            # print(dimension)

            dimension_list.append(dimension)
        array = {'dimensions': dimension_list, 'units': 'false', 'color': 'false'}
        variables[variable] = array

    return JsonResponse({'variables_sorted': variables, 'file_metadata': file_metadata})
