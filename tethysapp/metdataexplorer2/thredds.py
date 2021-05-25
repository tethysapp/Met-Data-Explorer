from django.http import JsonResponse, HttpResponse
import grids
import tempfile
import os
import json
import requests
import geopandas as gpd
from geojson import dump

from .timestamp import iterate_files


def add_tdds(request):
    group_obj={}
    services_array = []
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    tdds_info = json.loads(request.POST["data"])

    if request.is_ajax() and request.method == 'POST':
        group_thredds = session.query(Groups).filter(Groups.name == tdds_info['group'])[0]

        ## File Metadata ##
        file_tempt_dict = {}
        # variable_metadata = {}

        try:
            ds = netCDF4.Dataset(tdds_info['url'])

        except Exception as e:
            print(e)

        ## INITIALIZING THE THREDDS FILES ##
        try:
            for metadata_string in ds.__dict__:

                file_tempt_dict[metadata_string] = str(ds.__dict__[metadata_string])
        except Exception as e:
            print(e)

        thredds_one = Thredds(server_type=tdds_info['type'],
                         title=tdds_info['title'],
                         url = tdds_info['url'],
                         url_wms = tdds_info['url_wms'],
                         url_subset = tdds_info['url_subset'],
                         epsg=servi['epsg'],
                         spatial = json.dumps(tdds_info['spatial']),
                         description = tdds_info['description'],
                         timestamp = tdds_info['timestamp'],
                         metadata_td_file = json.dumps(file_tempt_dict))

        ## Attributes addition and metadata ##
        for key in tdds_info['attributes']:
            variable_tempt_dict = {}
            try:
                for metadata_string in ds[key].__dict__:
                    variable_tempt_dict[metadata_string] = str(ds[key].__dict__[metadata_string])
            except Exception as e:
                print(e)
            # variable_metadata [key] = variable_tempt_dict


            variable_one = Variables(name= key,dimensions =tdds_info['attributes'][key]['dimensions'],
                                units = tdds_info['attributes'][key]['units'],
                                color = tdds_info['attributes'][key]['color'],
                                metadata_variable = json.dumps(variable_tempt_dict))

            thredds_one.attributes.append(variable_one)

        group_thredds.thredds_server.append(thredds_one)
        services_array.append(tdds_info)

        session.add(group_thredds)
        session.commit()
        session.close()
        group_obj['services'] = services_array

    return JsonResponse(group_obj)

def get_full_array(request):
    attribute_array = json.loads(request.GET['containerAttributes'])
    data = organize_array(attribute_array)
    #print(data)
    return JsonResponse({'result': data})


def organize_array(attribute_array):
    access_urls = {}
    variables = ''
    if attribute_array['timestamp'] == 'true':
        access_urls, file_name = iterate_files(attribute_array['url'])
    else:
        access_urls['OPENDAP'] = attribute_array['url'].split(',')[0][4:]
        access_urls['WMS'] = attribute_array['url'].split(',')[1][4:]
        access_urls['NetcdfSubset'] = attribute_array['url'].split(',')[2][4:]

    for variable in attribute_array['attributes']:
        variables += 'var=' + variable + '&'

    epsg = attribute_array['epsg']
    geojson_path = get_geojson_and_data(attribute_array['spatial'], epsg)

    data = {}
    for variable in attribute_array['attributes']:
        dims = attribute_array['attributes'][variable]['dimensions'].split(',')
        dim_order = (dims[0], dims[1], dims[2])
        stats_value = 'mean'
        feature_label = 'id'
        timeseries = get_timeseries_at_geojson([access_urls['OPENDAP']], variable, dim_order, geojson_path, feature_label, stats_value)
        data[variable] = timeseries

    os.remove(geojson_path)
    return data


def get_geojson_and_data(spatial, epsg):
    geojson_path = os.path.join(tempfile.gettempdir(), 'temp.json')
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
        if not str(epsg)[:4] == str(geojson_geometry.crs)[5:]:
            geojson_geometry = geojson_geometry.to_crs('EPSG:' + str(epsg)[:4])
        if len(epsg) > 4:
            shift_lat = int(epsg.split(',')[2][2:])
            shift_lon = int(epsg.split(',')[1][2:])
            geojson_geometry['geometry'] = geojson_geometry.translate(xoff=shift_lon, yoff=shift_lat)

    geojson_geometry.to_file(geojson_path, driver="GeoJSON")

    return geojson_path


def get_timeseries_at_geojson(files, var, dim_order, geojson_path, feature_label, stats):
    #print('Getting TimeSeries')
    series = grids.TimeSeries(files=files, var=var, dim_order=dim_order)
    #series.interp_units = True
    timeseries_array = series.shape(vector=geojson_path, behavior='features', labelby=feature_label, statistics=stats)
    timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
    return timeseries_array
