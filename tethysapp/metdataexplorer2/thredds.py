import json

import netCDF4
import pandas as pd
import xarray
from django.http import JsonResponse

from .app import Metdataexplorer2 as app
from .model import Variables, Thredds, Groups

# http://186.149.199.244/ftp/

Persistent_Store_Name = 'thredds_db'


######*****************************************************************************************################
############################## DELETE THE HYDROSERVER OF AN SPECIFIC GROUP ####################################
######*****************************************************************************************################


def edit_tdds(request):
    return_objt = {}
    SessionMaker = app.get_persistent_store_database(
        Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()

    # Query DB for hydroservers
    if request.is_ajax() and request.method == 'POST':
        try:
            # print(request.POST)
            title_old = request.POST.get('old_title')
            # print(title_old)
            title_new = request.POST.get('new_title')
            # print(title_new)

            group = request.POST.get('group')
            description = request.POST.get('description')
            epsg = request.POST.get('epsg')
            spatial = request.POST.get('spatial')

            tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == group).filter(
                Thredds.title == title_old).first()
            if title_new != '':
                tdds_group.title = title_new
                session.commit()

            if description != '':
                tdds_group.description = description
                session.commit()

            if epsg != '':
                tdds_group.epsg = epsg
                session.commit()

            if spatial != '':
                tdds_group.spatial = spatial
                session.commit()

            # if url != '':
            #     ds = TDSCatalog(url)
            #     files = ds.datasets
            #     files_dict = {}
            #     files_dict = files[0].access_urls
            #     tdds_group.url = files_dict['OPENDAP']
            #     tdds_group.url_wms = files_dict['WMS']
            #     tdds_group.url_subset = files_dict['NetcdfSubset']
            #     session.commit()
            session.close()
            return_objt['message'] = "updated tdds"
        except Exception as e:
            print(e)
            return_objt['message'] = "failed to update tdds"

    return JsonResponse(return_objt)


def delete_single_thredd(request):
    list_catalog = {}
    list_catalog2 = {}
    final_list = {}
    SessionMaker = app.get_persistent_store_database(
        Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()

    # Query DB for hydroservers
    if request.is_ajax() and request.method == 'POST':
        titles = request.POST.getlist('server')
        group = request.POST.get('actual-group')
        # print(titles)
        # print(group)
        i = 0;
        for title in titles:
            # tdds_group = session.query(Thredds).filter(Thredds.title == title).first().delete(
            #     synchronize_session='evaluate')  # Deleting the record from the local catalog
            # tdds_group = session.query(Thredds).filter(Thredds.title == title).first()
            tdds_objs = session.query(Thredds).filter(Thredds.title == title)
            tdds_group = session.query(Thredds).filter(Thredds.title == title).first()
            for td_single_obj in tdds_objs:
                if td_single_obj.group.name == group:
                    # print(td_single_obj.group.name)
                    # print(td_single_obj.title)
                    tdds_group = td_single_obj

            if tdds_group:
                list_my_attr = []
                for attr_single in tdds_group.attributes:
                    list_my_attr.append(attr_single.name)

                list_catalog2[title] = list_my_attr

            session.delete(tdds_group)
            session.commit()
            session.close()

            # Returning the deleted title. To let the user know that the particular
            # title is deleted.
            i_string = str(i);
            list_catalog[i_string] = title
            i = i + 1
        final_list['title_tdds'] = list_catalog
        final_list['attr_tdds'] = list_catalog2
        # print(final_list)
    return JsonResponse(final_list)


def add_tdds(request):
    group_obj = {}
    services_array = []
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    tdds_info = json.loads(request.POST["data"])

    if request.is_ajax() and request.method == 'POST':

        group_thredds = session.query(Groups).filter(Groups.name == tdds_info['group'])[0]
        for single_tds in group_thredds.thredds_server:
            if single_tds.title == tdds_info['title']:
                group_obj[
                    'error'] = "There is already a Thredds file added with that name in the Group, Please Provide other name"
                return JsonResponse(group_obj)

        ## File Metadata ##
        file_tempt_dict = {}

        try:
            print(tdds_info['url'])
            ds = netCDF4.Dataset(tdds_info['url'])

        except Exception as e:
            print(e)

        ## INITIALIZING THE THREDDS FILES ##
        try:
            for metadata_string in ds.__dict__:
                file_tempt_dict[metadata_string] = str(ds.__dict__[metadata_string])
        except Exception as e:
            print(e)

        file_attr_ex = {}
        try:
            da = xarray.open_dataset(tdds_info['url'].strip(), chunks={"time": '100MB'})
            attr_dims = da.coords.keys()
            print(attr_dims)
            for hl in attr_dims:
                if hl != 'lat' and hl != 'lon':
                    if 'time' not in hl:
                        file_attr_ex[hl] = da.coords[hl].to_dict()['data']
        except Exception as e:
            print(e)
            print(tdds_info['url'])
            nc = netCDF4.Dataset(tdds_info['url'])
            dims = nc.dimensions.keys()
            for dim in dims:
                if dim in nc.variables:
                    if dim != 'lat' and dim != 'lon':
                        if 'time' not in dim:
                            h = nc.variables[dim]
                            hs = pd.Series(h[:])
                            file_attr_ex[dim] = hs.to_list()

        thredds_one = Thredds(server_type=tdds_info['type'],
                              title=tdds_info['title'],
                              url=tdds_info['url'],
                              url_wms=tdds_info['url_wms'],
                              url_subset=tdds_info['url_subset'],
                              epsg=tdds_info['epsg'],
                              spatial=json.dumps({}),
                              # spatial = json.dumps(tdds_info['spatial']),
                              description=tdds_info['description'],
                              timestamp=tdds_info['timestamp'],
                              metadata_td_file=json.dumps(file_tempt_dict),
                              extra_coordinate=json.dumps(file_attr_ex),
                              authentication=tdds_info['authentication'])

        ## Attributes addition and metadata ##
        for key in tdds_info['attributes']:
            variable_tempt_dict = {}
            try:
                for metadata_string in ds[key].__dict__:
                    variable_tempt_dict[metadata_string] = str(ds[key].__dict__[metadata_string])
            except Exception as e:
                print(e)
            # variable_metadata [key] = variable_tempt_dict

            variable_one = Variables(name=key, dimensions=tdds_info['attributes'][key]['dimensions'],
                                     units=tdds_info['attributes'][key]['units'],
                                     color=tdds_info['attributes'][key]['color'],
                                     metadata_variable=json.dumps(variable_tempt_dict))

            thredds_one.attributes.append(variable_one)

        group_thredds.thredds_server.append(thredds_one)
        tdds_info['metadata_file'] = json.dumps(file_tempt_dict)
        tdds_info['extra_coordinate'] = json.dumps(file_attr_ex)
        services_array.append(tdds_info)

        session.add(group_thredds)
        session.commit()
        session.close()
        group_obj['services'] = services_array

    return JsonResponse(group_obj)


def get_edit_info(request):
    return_obj = {}
    tds = request.GET.get('tds')
    group = request.GET.get('group')
    SessionMaker = app.get_persistent_store_database(Persistent_Store_Name, as_sessionmaker=True)
    session = SessionMaker()  # Initiate a session
    tdds_group = session.query(Thredds).join(Groups).filter(Groups.name == group).filter(Thredds.title == tds).first()
    return_obj['title'] = tdds_group.title
    return_obj['description'] = tdds_group.description
    return_obj['epsg'] = tdds_group.epsg
    return JsonResponse(return_obj)
