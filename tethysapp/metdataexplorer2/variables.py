import glob
import json
import os
import tempfile

import geopandas as gpd
import grids
import netCDF4
import requests
import xarray
from django.http import JsonResponse
from geojson import dump
from shapely import wkt
from shapely.affinity import translate
from shapely.geometry.multipolygon import MultiPolygon
from shapely.geometry.polygon import Polygon

from .app import Metdataexplorer2 as app
from .model import Variables, Thredds, Groups
from .timestamp import iterate_files

Persistent_Store_Name = 'thredds_db'


def shp_to_geojson(shp_filepath, filename):
    new_directory = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace')
    current_geojsons = glob.glob(os.path.join(new_directory, '*.geojson'))
    already_made = False
    for geojson in current_geojsons:
        print(geojson)
        if not already_made:
            if os.path.basename(geojson) == filename + '.geojson':
                already_made = True
            else:
                already_made = False
    # print(already_made)
    if not already_made:
        shape_file = gpd.read_file(shp_filepath)
        shape_file.to_file(os.path.join(new_directory, filename + '.geojson'), driver='GeoJSON')
    return already_made


def upload_shapefile(request):
    files = request.FILES.getlist('files')
    print(files)
    shp_path = os.path.join(os.path.dirname(__file__), 'workspaces', 'user_workspaces')

    # write the new files to the directory
    for n, shp_file in enumerate(files):
        with open(os.path.join(shp_path, shp_file.name), 'wb') as dst:
            for chunk in files[n].chunks():
                dst.write(chunk)

    filepath = glob.glob(os.path.join(shp_path, '*.shp'))[0]
    filename = os.path.splitext(os.path.basename(filepath))[0]
    path_to_shp = os.path.join(shp_path, filename)
    already_made = True
    i = 0
    files_to_remove_app_wokspace = glob.glob(os.path.join(os.path.dirname(__file__), 'workspaces',
                                                          'app_workspace', '*.geojson'))
    for this_file in files_to_remove_app_wokspace:
        os.remove(this_file)
    while already_made:
        already_made = shp_to_geojson(path_to_shp + '.shp', filename)
        if already_made:
            if i == 0:
                filename += str(i)
            else:
                filename = filename[:-1] + str(i)
            i += 1

    files_to_remove = glob.glob(path_to_shp + '*')
    for this_file in files_to_remove:
        os.remove(this_file)

    path_to_geojson = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', filename + '.geojson')
    with open(path_to_geojson) as f:
        geojson = json.load(f)
    # print(geojson)
    return JsonResponse({'filename': filename, 'alreadyMade': already_made, 'geojson': json.dumps(geojson)})


def get_data_bounds(request):
    print('Getting Data Bounds')
    return_obj = {}
    variable_single = request.POST.get('variable')
    tdds_single = request.POST.get('tdds')
    group_single = request.POST.get('group')
    SessionMaker = app.get_persistent_store_database(
        Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()
    tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == group_single).filter(
        Thredds.title == tdds_single).first()
    var_row = session.query(Variables).filter(Variables.name == variable_single).join(Thredds).filter(
        Thredds.title == tdds_single).join(Groups).filter(Groups.name == group_single).first()
    # print(type(var_row.range))
    if var_row.range is None:
        # netcdf = netCDF4.Dataset(tdds_group.url)
        # var = netcdf.variables[variable_single]
        # print(var)
        # # var_array = var.data.flatten()
        # min = var[:].min()
        # max = var[:].max()

        da = xarray.open_dataset(tdds_group.url.strip(), chunks={"time": '100MB'})
        data = da[variable_single].compute()
        max = data.max().values
        min = data.min().values

        range_string = f'{min},{max}'
        return_obj['range'] = range_string
        var_row.range = range_string
        session.commit()
        session.close()
        print('test string 1')
        print(range_string)
    else:
        return_obj['range'] = var_row.range
        print('test string 2v')
        print(return_obj)

    # da = xarray.open_dataset(tdds_group.url.strip())
    # print(da)
    # print(da[variable_single].compute())
    # data = da[variable_single].compute()
    # da.load()
    # print(da[variable_single].values)

    return JsonResponse(return_obj)


def add_vars(request):
    group_obj = {}
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
        tdds_object = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(
            Thredds.title == actual_tdds).first()
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
            tdds_var_query = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(
                Thredds.title == actual_tdds).join(Variables).filter(Variables.name == key).count()
            if tdds_var_query == 0:
                variable_one = Variables(name=key, dimensions=tdds_info[key]['dimensions'],
                                         units=tdds_info[key]['units'],
                                         color=tdds_info[key]['color'],
                                         metadata_variable=json.dumps(variable_tempt_dict))
                tdds_object.attributes.append(variable_one)

        services_array.append(tdds_info)
        session.add(tdds_object)
        session.commit()
        session.close()

        session = SessionMaker()
        tdds_object2 = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(
            Thredds.title == actual_tdds).first()
        group_obj['metadata_file'] = tdds_object2.metadata_td_file
        group_obj['extra_coordinate'] = tdds_object2.extra_coordinate
        group_obj['title'] = tdds_object2.title
        group_obj['description'] = tdds_object2.description
        group_obj['url'] = tdds_object2.url
        group_obj['url_wms'] = tdds_object2.url_wms
        group_obj['url_subset'] = tdds_object2.url_subset
        group_obj['epsg'] = tdds_object2.epsg
        old_attr_arr = []
        for old_attr in tdds_object2.attributes:
            variable_obj = {}
            variable_obj['name'] = old_attr.name
            variable_obj['dimensions'] = old_attr.dimensions
            variable_obj['units'] = old_attr.units
            variable_obj['color'] = old_attr.color
            variable_obj['metadata_var'] = old_attr.metadata_variable
            variable_obj['epsg'] = tdds_object2.epsg

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
            variables_tdds = request.POST.getlist('variables_del')
            actual_group = request.POST.get('actual-group')
            actual_tdds = request.POST.get('actual-tdds')

            i = 0
            tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(
                Thredds.title == actual_tdds).first()
            for single_var in variables_tdds:
                var_row = session.query(Variables).filter(Variables.name == single_var).join(Thredds).filter(
                    Thredds.title == actual_tdds).join(Groups).filter(Groups.name == actual_group).first()
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
            tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == actual_group).filter(
                Thredds.title == actual_tdds).first()

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
    behavior_type = request.GET.get('behavior_type')
    label_type = request.GET.get('label_type')
    dimensions_sel = request.GET.getlist('dimensions_sel[]')
    type_ask = request.GET.get('type_ask')
    extra_dim = request.GET.get('extra_dim')
    epsg_offset = request.GET.get('epsg_offset')
    # print("offset", epsg_offset)
    print(extra_dim)
    tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == actual_group). \
        filter(Thredds.title == actual_tdds).first()

    attribute_array['title'] = tdds_group.title
    attribute_array['description'] = tdds_group.description
    attribute_array['timestamp'] = tdds_group.timestamp
    attribute_array['epsg'] = tdds_group.epsg
    if epsg_offset != '':
        # print("not empty")
        attribute_array['epsg'] = epsg_offset
    else:
        # print("empty")
        attribute_array['epsg'] = tdds_group.epsg

    attribute_array['type'] = 'file'
    attribute_array['url'] = tdds_group.url
    attribute_array['url_wms'] = tdds_group.url_wms
    attribute_array['url_netcdf'] = tdds_group.url_subset
    attribute_array['type_request'] = type_ask

    authentication = tdds_group.authentication
    print(authentication)
    attribute_array['username'] = authentication.split(' ')[1]
    attribute_array['password'] = authentication.split(' ')[2]

    print(attribute_array['username'])
    print(attribute_array['password'])

    if extra_dim != '':
        attribute_array['extra_dim'] = int(extra_dim)
    else:
        attribute_array['extra_dim'] = extra_dim
    try:
        attribute_array['spatial'] = json.loads(input_spatial)
        # print(attribute_array['spatial'])
    except Exception as e:
        attribute_array['spatial'] = input_spatial

    var_row = session.query(Variables).filter(Variables.name == single_var).join(Thredds).filter(
        Thredds.title == actual_tdds).join(Groups).filter(Groups.name == actual_group).first()
    attr_variable = {}
    attr_variable['color'] = var_row.color
    attr_variable['dimensions'] = dimensions_sel
    attr_variable['units'] = var_row.units
    attr_variable['name'] = var_row.name

    attribute_array['attributes'] = attr_variable

    data = organize_array(attribute_array, behavior_type, label_type)
    print(data)

    return JsonResponse({'result': data})


def organize_array(attribute_array, behavior_type, label_type):
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
    # print(geojson_path)
    data = {}

    dims = attribute_array['attributes']['dimensions']

    dim_order = tuple(dims)
    # print(dim_order)
    stats_value = 'mean'
    # feature_label = 'id'
    # print(variable)
    # print(access_urls['OPENDAP'])
    timeseries = get_timeseries_at_geojson([access_urls['OPENDAP']], variable, dim_order, geojson_path, behavior_type,
                                           label_type, stats_value, attribute_array['type_request'],
                                           attribute_array['extra_dim'], attribute_array['username'],
                                           attribute_array['password'])
    # print(timeseries)
    data[variable] = timeseries
    os.remove(geojson_path)
    return data


def get_geojson_and_data(spatial, epsg):
    print('epsg: ' + str(epsg))
    print('spatial: ' + str(spatial))
    geojson_path = os.path.join(tempfile.gettempdir(), 'temp.json')
    print(type(spatial))
    if type(spatial) == dict:
        print("bol1")

        spatial['properties']['id'] = 'Shape'
        data = os.path.join(tempfile.gettempdir(), 'new_geo_temp.json')
        with open(data, 'w') as f:
            dump(spatial, f)
        geojson_geometry = gpd.read_file(data)
        os.remove(data)
        print(geojson_geometry)
    elif spatial[:4] == 'http':
        print("bol2")

        data = requests.Request('GET', spatial).url
        geojson_geometry = gpd.read_file(data)
        # print(geojson_geometry.geometry)
        splitted_geom = []
        moved_geom = []

        for row in geojson_geometry["geometry"]:
            splitted_geom.append(row)
        # print(splitted_geom)
        for element in splitted_geom:
            minx, miny, maxx, maxy = element.bounds
            if minx >= 0 and maxx >= 0:
                moved_geom.append(translate(element, xoff=0))
            if minx < 0 and maxx < 0:
                moved_geom.append(translate(element, xoff=360))
            if minx < 0 and maxx >= 0:
                if isinstance(element, MultiPolygon):
                    # print(element.type)
                    multipolygon_list = []
                    for single_pol in element.geoms:
                        x, y = single_pol.exterior.coords.xy
                        element2 = []
                        for single_x, single_y in zip(x.tolist(), y.tolist()):
                            if single_x < 0:
                                single_x2 = single_x + 360
                                element2.append(single_x2)
                            else:
                                element2.append(single_x)
                        polygonMade = Polygon(list(zip(element2, y.tolist()))).wkt
                        multipolygon_list.append(polygonMade)
                    list_polygons = [wkt.loads(poly) for poly in multipolygon_list]

                    moved_geom.append(MultiPolygon(list_polygons))

                if element.geom_type == 'Polygon':
                    x, y = element.exterior.coords.xy
                    element2 = []
                    for single_x, single_y in zip(x.tolist(), y.tolist()):
                        if single_x < 0:
                            single_x2 = single_x + 360
                            element2.append(single_x2)
                        else:
                            element2.append(single_x)
                    polygonMade = Polygon(list(zip(element2, y.tolist())))
                    moved_geom.append(polygonMade)

        geojson_geometry["geometry"] = moved_geom
        print(geojson_geometry['geometry'])
    else:
        print("bol3")
        data = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', spatial + '.geojson')
        geojson_geometry = gpd.read_file(data)
        # if not str(epsg) == 'false':
        # print(len(epsg))
        # print(str(epsg)[:4],str(geojson_geometry.crs)[5:] )
        # if not str(epsg)[:4] == str(geojson_geometry.crs)[5:]:
        # if not str('4326') == str(geojson_geometry.crs)[5:]:
        # geojson_geometry = geojson_geometry.to_crs('EPSG:' + '4326')
        # geojson_geometry = geojson_geometry.to_crs('EPSG:' + str(epsg)[:4])
        # if len(epsg) > 4:
        # shift_lat = int(epsg.split(',')[2][2:])
        # shift_lon = int(epsg.split(',')[1][2:])
        # print(shift_lat, shift_lon)

        # print(geojson_geometry.crs.area_of_use)
        # print(geojson_geometry.crs.area_of_use.north)
        # print(geojson_geometry.crs.area_of_use.south)
        # print(geojson_geometry.crs.area_of_use.east)
        # print(geojson_geometry.crs.area_of_use.west)

        # print(geojson_geometry['geometry'])
        # geojson_geometry['geometry'] = geojson_geometry.translate(xoff=shift_lon, yoff=shift_lat)

        # print(geojson_geometry.crs.area_of_use)
        #
        # print(geojson_geometry.crs.area_of_use.east)
        # print(type(geojson_geometry.crs.area_of_use.west))
        # print(geojson_geometry.geometry)
        splitted_geom = []
        moved_geom = []

        for row in geojson_geometry["geometry"]:
            splitted_geom.append(row)
        # print(splitted_geom)
        for element in splitted_geom:
            minx, miny, maxx, maxy = element.bounds
            if minx >= 0 and maxx >= 0:
                moved_geom.append(translate(element, xoff=0))
            if minx < 0 and maxx < 0:
                moved_geom.append(translate(element, xoff=360))
            if minx < 0 and maxx >= 0:
                if isinstance(element, MultiPolygon):
                    # print(element.type)
                    multipolygon_list = []
                    for single_pol in element.geoms:
                        x, y = single_pol.exterior.coords.xy
                        element2 = []
                        for single_x, single_y in zip(x.tolist(), y.tolist()):
                            if single_x < 0:
                                single_x2 = single_x + 360
                                element2.append(single_x2)
                            else:
                                element2.append(single_x)
                        polygonMade = Polygon(list(zip(element2, y.tolist()))).wkt
                        multipolygon_list.append(polygonMade)
                    list_polygons = [wkt.loads(poly) for poly in multipolygon_list]

                    moved_geom.append(MultiPolygon(list_polygons))

                if element.geom_type == 'Polygon':
                    x, y = element.exterior.coords.xy
                    element2 = []
                    for single_x, single_y in zip(x.tolist(), y.tolist()):
                        if single_x < 0:
                            single_x2 = single_x + 360
                            element2.append(single_x2)
                        else:
                            element2.append(single_x)
                    polygonMade = Polygon(list(zip(element2, y.tolist())))
                    moved_geom.append(polygonMade)

        geojson_geometry["geometry"] = moved_geom
        # print(geojson_geometry['geometry'])

    geojson_geometry.to_file(geojson_path, driver="GeoJSON")
    print(geojson_path)
    return geojson_path


def get_timeseries_at_geojson(files, var, dim_order, geojson_path, behavior_type,
                              label_type, stats, type_ask, extra_dim, username, password):
    timeseries_array = {}

    if not password == False:
        series = grids.TimeSeries(files=files, var=var, dim_order=dim_order, user=username, pswd=password)
    else:
        series = grids.TimeSeries(files=files, var=var, dim_order=dim_order)


    # if label_type != 'select_val':
    # timeseries_array = series.shape(mask=geojson_path, behavior=behavior_type, labelby=label_type, statistics=stats)
    # else:

    geojson_geometry = gpd.read_file(geojson_path)
    # print(geojson_geometry['geometry'])
    # print(geojson_geometry.geometry)
    # print(geojson_geometry.geometry[0].geom_type)
    # print(geojson_geometry.geometry[0].bounds)
    if len(list(dim_order)) == 3:
        print(type_ask)
        # print("3 dimensions")
        if type_ask == 'marker':
            # print("point")
            try:
                # print(geojson_geometry.geometry[0].bounds[2])
                print(geojson_geometry.crs.area_of_use.west)
                if geojson_geometry.crs.area_of_use.west < 0 and geojson_geometry.geometry[0].bounds[2] < 0:
                    print('if')
                    # geojson_geometry['geometry'] = geojson_geometry.translate(xoff=360, yoff=0)
                    timeseries_array = series.point(None, geojson_geometry.geometry[0].bounds[1],
                                                    geojson_geometry.geometry[0].bounds[2] + 360)
                else:
                    print('bounds')
                    print(geojson_geometry.geometry[0].bounds[1])
                    print(geojson_geometry.geometry[0].bounds[2])
                    timeseries_array = series.point(None, geojson_geometry.geometry[0].bounds[1],
                                                    geojson_geometry.geometry[0].bounds[2])

                #timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
                string_time = []
                for time in timeseries_array['datetime']:
                    string_time.append(str(time))

                timeseries_array['datetime'] = string_time

                return timeseries_array

            except Exception as e:
                timeseries_array['error'] = str(e)
                print(e)
                return timeseries_array

        if type_ask == "rectangle":
            try:

                if geojson_geometry.geometry[0].bounds[0] < 0 and geojson_geometry.geometry[0].bounds[2] > 0:
                    # print("1")
                    timeseries_array = series.bound((None, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0] + 360),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2]))
                if geojson_geometry.geometry[0].bounds[0] > 0 and geojson_geometry.geometry[0].bounds[2] < 0:
                    # print("2")
                    timeseries_array = series.bound((None, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0]),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2] + 360))
                if geojson_geometry.geometry[0].bounds[0] < 0 and geojson_geometry.geometry[0].bounds[2] < 0:
                    # print("3")
                    timeseries_array = series.bound((None, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0] + 360),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2] + 360))
                if geojson_geometry.geometry[0].bounds[0] > 0 and geojson_geometry.geometry[0].bounds[2] > 0:
                    # print("4")
                    timeseries_array = series.bound((None, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0]),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2]))

                timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
                return timeseries_array

            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array

        if type_ask == "polygon":
            try:
                timeseries_array = series.shape(mask=geojson_path, statistics=stats)
                timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')

                return timeseries_array

            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array

        else:
            try:
                timeseries_array = series.shape(mask=geojson_path, behavior=behavior_type,
                                                labelby=label_type, statistics=stats)
                timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
                return timeseries_array

            except Exception as e:
                print(e)
                timeseries_array['error'] = str(e)
                return timeseries_array

    if len(list(dim_order)) == 4:
        # print("4 dimensions")

        if type_ask == 'marker':
            # print("point")
            try:
                # timeseries_array = series.point(None,extra_dim, geojson_geometry.geometry[0].bounds[1], geojson_geometry.geometry[0].bounds[2])
                # timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
                # return timeseries_array

                if geojson_geometry.crs.area_of_use.west < 0 and geojson_geometry.geometry[0].bounds[2] < 0:
                    timeseries_array = series.point(None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                    geojson_geometry.geometry[0].bounds[2] + 360)
                else:
                    timeseries_array = series.point(None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                    geojson_geometry.geometry[0].bounds[2])

                timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
                return timeseries_array

            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array

        if type_ask == "rectangle":
            # print("bounding_box")
            try:
                # timeseries_array = series.bound((None,extra_dim, geojson_geometry.geometry[0].bounds[1], geojson_geometry.geometry[0].bounds[0]), (None,extra_dim, geojson_geometry.geometry[0].bounds[3], geojson_geometry.geometry[0].bounds[2]))
                # timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')
                # return timeseries_array

                if geojson_geometry.geometry[0].bounds[0] < 0 and geojson_geometry.geometry[0].bounds[2] > 0:
                    # print("1")
                    timeseries_array = series.bound((None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0] + 360),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2]))
                if geojson_geometry.geometry[0].bounds[0] > 0 and geojson_geometry.geometry[0].bounds[2] < 0:
                    # print("2")
                    timeseries_array = series.bound((None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0]),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2] + 360))
                if geojson_geometry.geometry[0].bounds[0] < 0 and geojson_geometry.geometry[0].bounds[2] < 0:
                    # print("3")
                    timeseries_array = series.bound((None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0] + 360),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2] + 360))
                if geojson_geometry.geometry[0].bounds[0] > 0 and geojson_geometry.geometry[0].bounds[2] > 0:
                    # print("4")
                    timeseries_array = series.bound((None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                     geojson_geometry.geometry[0].bounds[0]),
                                                    (None, geojson_geometry.geometry[0].bounds[3],
                                                     geojson_geometry.geometry[0].bounds[2]))
                timeseries_array['datetime'] = timeseries_array['datetime'].dt.strftime('%Y-%m-%d %H:%M:%S')

            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array

        if type_ask == "polygon":
            timeseries_array = {}
            timeseries_array['error'] = "Not possible to retrieve timeseries for variables with more than 3 " \
                                        "dimensions when uploading a shapefile or WMF service link "
            return timeseries_array

    return timeseries_array
