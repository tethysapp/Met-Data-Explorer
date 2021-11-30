import os
import geojson
import geopandas as gpd
import grids


def print_geojson_to_file(geojson_geometry):
    filepath = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', 'original.geojson')
    with open(filepath, 'w') as f:
        geojson.dump(geojson_geometry, f)
    return filepath


def check_lat_lon_within(geo_bounds, bounds):
    bounds_keys = list(bounds.keys())
    if geo_bounds['lat']['min'] <= bounds[bounds_keys[1]]['min'] and geo_bounds['lat']['max'] \
            <= bounds[bounds_keys[1]]['min']:
        lat = 1
    elif geo_bounds['lat']['max'] >= bounds[bounds_keys[1]]['max'] and geo_bounds['lat']['min'] >= \
            bounds[bounds_keys[1]]['max']:
        lat = 2
    elif geo_bounds['lat']['min'] <= bounds[bounds_keys[1]]['min'] <= geo_bounds['lat']['max']:
        lat = 3
    elif geo_bounds['lat']['max'] >= bounds[bounds_keys[1]]['max'] >= geo_bounds['lat']['min']:
        lat = 4
    else:
        lat = 5
    if geo_bounds['lon']['min'] <= bounds[bounds_keys[0]]['min'] and geo_bounds['lon']['max'] \
            <= bounds[bounds_keys[0]]['min']:
        lon = 1
    elif geo_bounds['lon']['max'] >= bounds[bounds_keys[0]]['max'] and geo_bounds['lon']['min'] >= \
            bounds[bounds_keys[0]]['max']:
        lon = 2
    elif geo_bounds['lon']['min'] <= bounds[bounds_keys[0]]['min'] <= geo_bounds['lon']['max']:
        lon = 3
    elif geo_bounds['lon']['max'] >= bounds[bounds_keys[0]]['max'] >= geo_bounds['lon']['min']:
        lon = 4
    else:
        lon = 5
    case = [lat, lon]
    return case


def find_shift(coord, case):
    """
    case 0 1 - shift negative up by 180
    case 0 2 -
    case 0 3 -
    case 0 4 -
    case 0 5 - no shift
    case 1 1 - shift negative right by 360
    case 1 2 -
    case 1 3 -
    case 1 4 -
    case 1 5 - no shift
    """

    lon = coord[0]
    lat = coord[1]
    if case[0] == 1 or case[0] == 3:
        if lat < 0:
            lat += 180
    if case[1] == 1 or case[1] == 3:
        if lon < 0:
            lon += 360
    return [lon, lat]


def shift_shape_bounds(bounds, filepath):
    geojson_geometry = gpd.read_file(filepath)
    new_filepath = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', 'grids.geojson')
    geo_bounds = {'lat': {'max': max(geojson_geometry.geometry.bounds['maxy']),
                          'min': min(geojson_geometry.geometry.bounds['miny'])},
                  'lon': {'max': max(geojson_geometry.geometry.bounds['maxx']),
                          'min': min(geojson_geometry.geometry.bounds['minx'])}}

    case = check_lat_lon_within(geo_bounds, bounds)
    x = 0
    new_geom = []

    for shape in geojson_geometry['geometry']:
        new_shp = {}
        if shape.type == 'Point':
            lonlat = find_shift(shape.coords[0], case)
            new_shp = geojson.Point(tuple((lonlat[0], lonlat[1])))
        elif shape.type == 'Polygon':
            new_coords = []
            for coord in shape.exterior.coords:
                lonlat = find_shift(coord, case)
                new_coords.append(tuple((lonlat[0], lonlat[1])))
            new_shp = geojson.Polygon([new_coords])
        elif shape.type == 'MultiPolygon':
            multipolygons = []
            for shp in shape.geoms:
                new_coords = []
                for coord in shp.exterior.coords:
                    lonlat = find_shift(coord, case)
                    new_coords.append(tuple((lonlat[0], lonlat[1])))
                poly = new_coords
            else:
                multipolygons.append(poly)
            new_shp = geojson.MultiPolygon([multipolygons])
        new_feature = geojson.Feature(properties={'iterate': 'this needs to change'},
                                      geometry=new_shp)
        new_geom.append(new_feature)
        x += 1
    new_fc = geojson.FeatureCollection(crs=str(geojson_geometry.crs), features=new_geom)
    with open(new_filepath, 'w') as f:
        geojson.dump(new_fc, f)
    return new_filepath


def format_datetime(dt):
    string_time = []
    for time in dt:
        string_time.append(str(time))
    return string_time


def get_timeseries_at_geojson(files, var, dim_order, geojson_path, behavior_type,
                              label_type, stats, type_ask, extra_dim, username, password):
    timeseries_array = {}
    if not password:
        series = grids.TimeSeries(files=files, var=var, dim_order=dim_order)
    else:
        series = grids.TimeSeries(files=files, var=var, dim_order=dim_order, user=username, pswd=password)

    geojson_geometry = gpd.read_file(geojson_path)

    if len(list(dim_order)) == 3:
        if type_ask == 'marker':
            try:
                timeseries_array = series.point(None, geojson_geometry.geometry[0].bounds[1],
                                                geojson_geometry.geometry[0].bounds[2])
                timeseries_array['datetime'] = format_datetime(timeseries_array['datetime'])
                return timeseries_array
            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array
        if type_ask == "rectangle":
            try:
                timeseries_array = series.bound((None, geojson_geometry.geometry[0].bounds[1],
                                                 geojson_geometry.geometry[0].bounds[0]),
                                                (None, geojson_geometry.geometry[0].bounds[3],
                                                 geojson_geometry.geometry[0].bounds[2]))
                timeseries_array['datetime'] = format_datetime(timeseries_array['datetime'])
                return timeseries_array
            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array
        if type_ask == "polygon":
            try:
                timeseries_array = series.shape(mask=geojson_path, stats=stats)
                timeseries_array['datetime'] = format_datetime(timeseries_array['datetime'])
                return timeseries_array
            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array
        else:
            try:
                timeseries_array = series.shape(mask=geojson_path, behavior=behavior_type,
                                                labelby=label_type, stats=stats)
                timeseries_array['datetime'] = format_datetime(timeseries_array['datetime'])
                return timeseries_array
            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array
    if len(list(dim_order)) == 4:
        if type_ask == 'marker':
            try:
                if geojson_geometry.crs.area_of_use.west < 0 and geojson_geometry.geometry[0].bounds[2] < 0:
                    timeseries_array = series.point(None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                    geojson_geometry.geometry[0].bounds[2] + 360)
                else:
                    timeseries_array = series.point(None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                    geojson_geometry.geometry[0].bounds[2])
                timeseries_array['datetime'] = format_datetime(timeseries_array['datetime'])
                return timeseries_array
            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array
        if type_ask == "rectangle":
            try:
                timeseries_array = series.bound((None, extra_dim, geojson_geometry.geometry[0].bounds[1],
                                                 geojson_geometry.geometry[0].bounds[0]),
                                                (None, geojson_geometry.geometry[0].bounds[3],
                                                 geojson_geometry.geometry[0].bounds[2]))
                timeseries_array['datetime'] = format_datetime(timeseries_array['datetime'])
            except Exception as e:
                timeseries_array['error'] = str(e)
                return timeseries_array
        if type_ask == "polygon":
            timeseries_array = {}
            timeseries_array['error'] = "Not possible to retrieve timeseries for variables with more than 3 " \
                                        "dimensions when uploading a shapefile or WMF service link "
            return timeseries_array
    return timeseries_array
