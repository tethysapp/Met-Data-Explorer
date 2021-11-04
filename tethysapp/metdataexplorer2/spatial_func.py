import geojson


def check_lat_lon_within(geo_bounds, bounds):
    print(bounds)
    print(geo_bounds)

    bounds_keys = list(bounds.keys())

    print('checking lat')
    if geo_bounds['lat']['min'] <= bounds[bounds_keys[0]]['min'] and geo_bounds['lat']['max'] \
            <= bounds[bounds_keys[0]]['min']:
        print('geojson is below of the data without overlap')
        lat = 1
    elif geo_bounds['lat']['max'] >= bounds[bounds_keys[0]]['max'] and geo_bounds['lat']['min'] >= \
            bounds[bounds_keys[0]]['max']:
        print('geojson is above of the data without overlap')
        lat = 2
    elif geo_bounds['lat']['min'] <= bounds[bounds_keys[0]]['min'] <= geo_bounds['lat']['max']:
        print('geojson is below of the data with overlap')
        lat = 3
    elif geo_bounds['lat']['max'] >= bounds[bounds_keys[0]]['max'] >= geo_bounds['lat']['min']:
        print('geojson is above of the data with overlap')
        lat = 4
    else:
        print('geojson is within the data')
        lat = 5

    print('checking lon')
    if geo_bounds['lon']['min'] <= bounds[bounds_keys[1]]['min'] and geo_bounds['lon']['max'] \
            <= bounds[bounds_keys[1]]['min']:
        print('geojson is left of the data without overlap')
        lon = 1
    elif geo_bounds['lon']['max'] >= bounds[bounds_keys[1]]['max'] and geo_bounds['lon']['min'] >= \
            bounds[bounds_keys[1]]['max']:
        print('geojson is right of the data without overlap')
        lon = 2
    elif geo_bounds['lon']['min'] <= bounds[bounds_keys[1]]['min'] <= geo_bounds['lon']['max']:
        print('geojson is left of the data with overlap')
        lon = 3
    elif geo_bounds['lon']['max'] >= bounds[bounds_keys[1]]['max'] >= geo_bounds['lon']['min']:
        print('geojson is right of the data with overlap')
        lon = 4
    else:
        print('geojson is within the data')
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


def shift_shape_bounds(bounds, geojson_geometry):
    new_filepath = ''
    geo_bounds = {'lat': {'max': max(geojson_geometry.geometry.bounds['maxy']),
                          'min': min(geojson_geometry.geometry.bounds['miny'])},
                  'lon': {'max': max(geojson_geometry.geometry.bounds['maxx']),
                          'min': min(geojson_geometry.geometry.bounds['minx'])}}

    case = check_lat_lon_within(geo_bounds, bounds)
    print(case)
    x = 0
    new_geom = []

    for shape in geojson_geometry['geometry']:
        new_shp = {}
        if shape.type == 'Polygon':
            new_coords = []
            for coord in shape.exterior.coords:
                lon, lat = find_shift(coord, case)
                new_coords.append(tuple((lon, lat)))

            new_shp = geojson.Polygon([new_coords])

        elif shape.type == 'MultiPolygon':
            multipolygons = []
            for shp in shape.geoms:
                new_coords = []
                for coord in shp.exterior.coords:
                    coords = find_shift(coord, case)
                    new_coords.append(tuple((coords[0], coords[1])))
                poly = new_coords

                multipolygons.append(poly)
            new_shp = geojson.MultiPolygon([multipolygons])
        new_feature = geojson.Feature(properties={'iterate': 'this needs to change'}, geometry=new_shp)#geojson_geometry['STATE'][x]
        new_geom.append(new_feature)
        x += 1
    new_fc = geojson.FeatureCollection(crs=str(geojson_geometry.crs), features=new_geom)
    with open(new_filepath, 'w') as f:
        geojson.dump(new_fc, f)
    return new_filepath

