=========================
met Data Explorer (MDE)
=========================

Introduction
************

In recent years, there has been a growing recognition of the need for standardized ways of sharing meteorological gridded data on the web.
In response to this need, Unidata, a division of the University Corporation for Atmospheric Research (UCAR) developed the `THREDDS Data Server<https://github.com/Unidata/thredds>`_ (TDS)
TDS is a web server that provides metadata and data access for scientific datasets, using OPeNDAP, OGC WMS and WCS, HTTP, and other remote data
access protocols.

Met Data Explorer (MDE) is a newly developed web-based tool allowing a broad range of users to discover, access, visualize, and download data from any TDS that stores available meteorological data.
MDE is designed in a way that allows users to customize it for local or regional web portals.


MDE Overview
************

WDE is an open-source web application providing users with the functionalities of data discovery, data access, data visualization,
and data downloading from any Information System that makes available water data in WaterML format through WaterOneFlow web services.
WDE  can be installed by any organization and requires minimal server space.

The MDE is an open-source web application for visualizing meteorological gridded data. Utilizing TDS to serve the data, the app
allows you to organize and save datafiles with the specific variables and dimensions that you need, visualize the data in a
Leaflet based map viewer, animate the data across a time series, and extract a time series over a specified area.
The area for extraction can be specified as a bounding box or a geojson shape. To extract a time series, the app utilizes
the Grids python to remotely access and extract the data over the given area. The time series extraction
feature in the MDE will work on most data, provided that the data conforms to OGC3 standards and the TDS is properly configured.

User Interface
--------------

To organize and manage various WaterOneFlow web services, WDE uses THREDDS files that are organized in Catalogs.


.. image:: images/1.1.png
   :width: 1000
   :align: center


Each THREDDS file contains a set of data that is accessible through a specific OPeNDAP service.

For each THREDDS files, a set of metadata is available in the Graphs Panel of the WDE User Interface.

.. image:: images/1.2.png
   :width: 1000
   :align: center

Also, for each THREDDS files,a table of variables is available, which includes the dimensions and metadata of each variable.

.. image:: images/1.3.png
   :width: 1000
   :align: center


Variables are displayed on the MDE map interface using Web Mapping Services (WMS) layers.

.. image:: images/1.4.png
   :width: 1000
   :align: center


Variables time series data can be plotted as “Scatter” or “Whisker and Box” plots, and be downloaded in
CSV and JSON formats for any available time period of interest in the Time Series Plots section.


.. image:: images/1.5.png
   :width: 1000
   :align: center


Developers
----------

WDE has been developed by Elkin Giovanni Romero Bustamante and Enoch Jones
at `Brigham Young University's (BYU) Hydroinformatics laboratory <https://hydroinformatics.byu.edu/>`_
with the support of the World Meteorological Organization.
The BYU's Hydroinformatics laboratory focuses on delivering different software products and services for water modelling. Some of the most important works include:
`Global Streamflow Forecast Services API <https://hydroinformatics.byu.edu/global-streamflow-forecasts>`_ ,
creation of the `Tethys Platform <https://hydroinformatics.byu.edu/tethys-platform>`_ ,
and `Hydroserver Lite <http://128.187.106.131/Historical_Data_template.php>`_ . The most recent publications and works can be found on the BYU Hydroinformatics website.

Source Code
-----------


The WDE source code is available on Github:

  - https://github.com/BYU-Hydroinformatics/Met-Data-Explorer
