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
import xarray


Persistent_Store_Name = 'thredds_db'


def get_data_bounds(request):
    return_obj = {}
    variable_single = request.POST.get('variable')
    tdds_single = request.POST.get('tdds')
    group_single = request.POST.get('group')
    SessionMaker = app.get_persistent_store_database(
        Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()
    tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == group_single).filter(Thredds.title == tdds_single).first()
    var_row = session.query(Variables).filter(Variables.name == variable_single).join(Thredds).filter(Thredds.title == tdds_single).join(Groups).filter(Groups.name == group_single).first()
    # print(type(var_row.range))
    if var_row.range is None:
        # print("hol")
        da = xarray.open_dataset(tdds_group.url.strip(),chunks={"time": '100MB'})
        # print(da)
        data = da[variable_single].compute()
        # print(variable_single)
        max = data.max().values
        min = data.min().values
        # return_obj['min'] = min
        # return_obj['max'] = max
        # print(min, max)
        range_string = f'{min},{max}'
        return_obj['range'] = range_string
        var_row.range = range_string
        session.commit()
        session.close()
    else:
        return_obj['range'] = var_row.range

    # da = xarray.open_dataset(tdds_group.url.strip())
    # print(da)
    # print(da[variable_single].compute())
    # data = da[variable_single].compute()
    # da.load()
    # print(da[variable_single].values)



    return JsonResponse(return_obj)



def add_vars(request):
    group_obj={}
    services_array = []
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    tdds_info = json.loads(request.POST.get("attributes"))
    actual_tdds = request.POST.get("current_tdds")
    actual_group = request.POST.get("current_group")
    unique_vars = []
    if request.is_ajax() and request.method == 'POST':

        ## File Metadata ##
        file_tempt_dict = {}
        # tdds_objects = session.query(Thredds).filter(Thredds.title == actual_tdds)
        tdds_object = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(Thredds.title == actual_tdds).first()
        # print(tdds_object.__dict__)
        # print(tdds_object.group.__dict__)
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
            # print(tdds_var_query)
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
            variables_tdds =request.POST.getlist('variables_del')
            actual_group = request.POST.get('actual-group')
            actual_tdds = request.POST.get('actual-tdds')

            i=0;
            tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(Thredds.title == actual_tdds).first()
            for single_var in variables_tdds:
                var_row = session.query(Variables).filter(Variables.name == single_var).join(Thredds).filter(Thredds.title == actual_tdds).join(Groups).filter(Groups.name == actual_group).first()
                # print(var_row)
                # var_row = session.query(Variables).filter(Variables.title == single_var).first()

                session.delete(var_row)
                session.commit()
                session.close()
            final_list['var_list'] = variables_tdds
        except Exception as e:
            print(e)
            final_list['var_list'] = []

    return JsonResponse(final_list)

def getVariablesTds(request):
    final_list = {}
    SessionMaker = app.get_persistent_store_database(
        Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()

    # Query DB for hydroservers
    if request.is_ajax() and request.method == 'POST':
        try:
            actual_group = request.POST.get('group')
            actual_tdds = request.POST.get('tdds')
            # print(actual_group)
            # print(actual_tdds)
            old_attr_arr = []
            tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(Thredds.title == actual_tdds).first()

            for single_var in tdds_group.attributes:
                variable_obj = {}
                variable_obj['name'] = single_var.name
                variable_obj['dimensions'] = single_var.dimensions
                variable_obj['units'] = single_var.units
                variable_obj['color'] = single_var.color
                variable_obj['metatada'] = single_var.metadata_variable

                old_attr_arr.append(variable_obj)

            final_list['var_list'] = old_attr_arr
        except Exception as e:
            print(e)
            final_list['var_list'] = []

    session.close()

    return JsonResponse(final_list)

def get_full_array(request):
    SessionMaker = app.get_persistent_store_database(
        Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()
    attribute_array = {}
    # attribute_array = json.loads(request.GET['containerAttributes'])
    actual_group = request.GET.get('group')
    actual_tdds = request.GET.get('tds')
    single_var = request.GET.get('attr_name')
    input_spatial = request.GET.get('input_sptl')

    tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(Thredds.title == actual_tdds).first()

    attribute_array['title'] = tdds_group.title
    attribute_array['description'] = tdds_group.description
    attribute_array['timestamp'] = tdds_group.timestamp
    attribute_array['epsg'] = tdds_group.epsg
    # attribute_array['epsg'] = '4326,x:360,y:0'
    attribute_array['type'] = 'file'
    attribute_array['url'] = tdds_group.url
    attribute_array['url_wms'] = tdds_group.url_wms
    attribute_array['url_netcdf'] = tdds_group.url_subset
    try:
        attribute_array['spatial'] = json.loads(input_spatial)
    except Exception as e:
        attribute_array['spatial'] = input_spatial

    var_row = session.query(Variables).filter(Variables.name == single_var).join(Thredds).filter(Thredds.title == actual_tdds).join(Groups).filter(Groups.name == actual_group).first()
    attr_variable = {}
    attr_variable['color'] = var_row.color
    attr_variable['dimensions'] = var_row.dimensions
    attr_variable['units'] = var_row.units
    attr_variable['name'] = var_row.name

    attribute_array['attributes'] = attr_variable
    xds = xarray.open_dataset(tdds_group.url)
    # print(xds)
    # print(xds.coords['lon'].to_dict())
    # print(xds.coords['lat'].to_dict())
    data = organize_array(attribute_array)
    #print(data)

    return JsonResponse({'result': data})


def organize_array(attribute_array):
    access_urls = {}
    variables = ''
    if attribute_array['timestamp'] == 'true':
        access_urls, file_name = iterate_files(attribute_array['url'])
    else:
        access_urls['OPENDAP'] = attribute_array['url']
        access_urls['WMS'] = attribute_array['url_wms']
        access_urls['NetcdfSubset'] = attribute_array['url_netcdf']

    variable = attribute_array['attributes']['name']
    # variables += 'var=' + variable + '&'

    # for variable in attribute_array['attributes']:
    #     variables += 'var=' + variable + '&'

    epsg = attribute_array['epsg']
    geojson_path = get_geojson_and_data(attribute_array['spatial'], epsg)
    # print(geojson_path)
    data = {}
    # for variable in attribute_array['attributes']:
    # print(attribute_array['attributes']['dimensions'])
    dims = attribute_array['attributes']['dimensions']
    # dim_order = ("time", "lat", "lon")
    dims2 = []
    for dim_single in dims:
        if dim_single.startswith("time"):
            dims2.append(dim_single)
    for dim_single in dims:
        if dim_single.startswith("lat"):
            dims2.append(dim_single)
    for dim_single in dims:
        if dim_single.startswith("lon"):
            dims2.append(dim_single)
    dim_order = (dims2[0], dims2[1], dims2[2] )
    # print(dim_order)
    stats_value = 'mean'
    feature_label = 'id'
    # print(variable)
    timeseries = get_timeseries_at_geojson([access_urls['OPENDAP']], variable, dim_order, geojson_path, feature_label, stats_value)
    # print(timeseries)
    data[variable] = timeseries
    # for variable in attribute_array['attributes']:
    #     # print(variable)
    #     dims = attribute_array['attributes'][variable]['dimensions'].split(',')
    #     dim_order = (dims[0], dims[1], dims[2])
    #     stats_value = 'mean'
    #     feature_label = 'id'
    #     timeseries = get_timeseries_at_geojson([access_urls['OPENDAP']], variable, dim_order, geojson_path, feature_label, stats_value)
    #     data[variable] = timeseries

    os.remove(geojson_path)
    return data


def get_geojson_and_data(spatial, epsg):
    geojson_path = os.path.join(tempfile.gettempdir(), 'temp.json')
    # print(type(spatial))
    if type(spatial) == dict:
        spatial['properties']['id'] = 'Shape'
        data = os.path.join(tempfile.gettempdir(), 'new_geo_temp.json')
        with open(data, 'w') as f:
            dump(spatial, f)
        geojson_geometry = gpd.read_file(data)
        os.remove(data)
    elif spatial[:4] == 'http':
        data = requests.Request('GET', spatial).url
        geojson_geometry = gpd.read_file(data)
    else:
        data = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', spatial + '.geojson')
        geojson_geometry = gpd.read_file(data)

    if not str(epsg) == 'false':
        # print(len(epsg))
        # print(str(epsg)[:4],str(geojson_geometry.crs)[5:] )

        if not str(epsg)[:4] == str(geojson_geometry.crs)[5:]:
            geojson_geometry = geojson_geometry.to_crs('EPSG:' + str(epsg)[:4])
        if len(epsg) > 4:
            shift_lat = int(epsg.split(',')[2][2:])
            shift_lon = int(epsg.split(',')[1][2:])
            # print(shift_lat, shift_lon)
            # print(geojson_geometry['geometry'])
            geojson_geometry['geometry'] = geojson_geometry.translate(xoff=shift_lon, yoff=shift_lat)

    geojson_geometry.to_file(geojson_path, driver="GeoJSON")

    return geojson_path


def get_timeseries_at_geojson(files, var, dim_order, geojson_path, feature_label, stats):
    #print('Getting TimeSeries')
    # print(var)
    # print(files)
    # print(dim_order)
    series = grids.TimeSeries(files=files, var=var, dim_order=dim_order)
    #series.interp_units = True
    # timeseries_array = series.shape(vector=geojson_path, )
    timeseries_array = series.shape(mask=geojson_path, behavior='features', labelby=feature_label, statistics=stats)

    timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
    return timeseries_array
