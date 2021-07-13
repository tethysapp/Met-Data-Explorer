========================
MDE User Functionalities
========================


.. |info_metadata_var| image:: images/info_metadata_var.png

.. |disp_settings| image:: images/disp_settings.png

.. |left| image:: images/left.png

.. |filter| image:: images/filter.png



Data Discovery
**************

The user can filter the available TDS files by variable of interest by using the |filter| icon.

.. image:: images/1.6.png
   :width: 1000
   :align: center


To display the metadata related to a specific TDS file, the user should click on the TDS file title.
The graphs panel will be opened, and the first variable of the TDS file will be displayed on the map
using Web Mapping Services(WMS). The appearance of the TDS file variable can be change by pressing on the |disp_settings| icon.

.. image:: images/1.7.png
   :width: 1000
   :align: center

.. note::
   The display settings allows to change the opacity and color style of the WMS layer beloging to the TDS file variable.
   It also allows the user to find or enter manually the data bounds of the TDS file variable.

To see the available variables of the selected TDS file, the user should use the
|left| icon. A table displaying all the variables found in the TDS file is generated.
The table also shows the dimensions and metadata of each variable.

.. image:: images/1.8.png
   :width: 1000
   :align: center

.. note::
   In order to see the metadata of a variable, the user needs to press in button with the |info_metadata_var| icon.

.. image:: images/1.9.png
   :width: 1000
   :align: center

To see the metadata of the selected TDS file from the TDS file variable list, the user should use the
|left| icon. A table displaying the metadata properties of the selected TDS file is generated.

.. image:: images/1.2.png
   :width: 1000
   :align: center

.. note::
   The metadata properties for each TDS file are different and depends on the data source provider.


Data Analysis
*************

MDE application uses a python package called "grids". The grids package allows for
extracting time series subsets from n-dimensional arrays in NetCDF, GRIB, HDF, and GeoTIFF formats.
Time series can be extracted for:

1. Points - by specifying the coordinates of the point in terms of the dimensions of the array
2. Ranges or Bounding Boxes - by specifying the minimum and maximum coordinates for each dimension
3. Spatial data - if the rasters are spatial data and the appropriate dimensions are specified
4. Masks - any irregularly shaped subset of the array which you can create a binary mask array for
5. Statistical summaries - of the entire array

Users can open a Python notebook demo and documentation for the grids package `here <https://pypi.org/project/grids/>`_


Time Series Visualization and Downloading
*****************************************

To visualize and download time series available for a specific TDS file variable, the user should select the
variable of interest on the WDE map interface. There are three different methods to retrieve timeseries from a
selected variable: "Drawing on map" and "adding a shape feature" such as a shapefile or WMF GeoServer link.

.. note::
   Only time series from variables with 3 dimensions can be plotted using a shapefile and WMF GeoServer link. If a variable
   contains more than 3 dimensions the "Drawing on a map" method should be selected. Timeseries using a marker or bounding box
   are supported for variables with more than 3 dimensions.

Draw on the Map
---------------

The "Draw on map" options allows the user to draw a point, bounding box and polygon in the map using the drawing palette in
the map.

The steps to retrieve Time series using the "Draw on Map" method are the following:

1. Select the variable of interest.
2. Select the option "Draw on Map".
3. Select all the dimensions (e.g. time, lat, lon).
4. If the variable has more than 3 dimensions, then provide a value for the 4th dimension.
5. Provide a EPSG (European Petroleum Survey Group), x offset, and y offset if the the drawing item and gridded data are in different coordinate system.
6. Select the type of plots.
7. Plot the time series.
8. Download in the desired format.

.. image:: images/1.10.png
   :width: 1000
   :align: center

.. note::
   The 4th dimension is other than time, latitude or longitude.The value for the 4th dimension can be found by opening
   the OPeNDAP service in your browser and looking for the name of the variable. For example, a dimension called isobaric will be listed
   in the OPeNDAP service in the following way: isobaric1: Array of 32 bit Reals [isobaric1 = 0..40]. This means that the value of the
   4th dimension can be any between 0 to 40

In order to extract a time series, the drawing item and gridded data on which it is used must be in the same coordinate system.
This includes the location of the origin within the coordinate system. Often, the location of the origin is shifted in respect
to the location set by the EPSG  definition of a coordinate system. If this is the case with
your data, you can specify the shift in x, longitude, or y, latitude, that will align your feature with your gridded data.

.. note::
   In the EPSG Code input bar you can define a shift in coordinates. First, add the EPSG code (eg. 4326) followed by “,x:”
   amount to shift in x “,y:” amount to shift in y. So a fully formatted EPSG code with a shift defined would look like
   this: 4326,x:360,y:180. This would shift all the coordinates in your drawn feature 360 degrees to the right and 180
   degrees up. Be careful when computing the amount by which to shift your coordinates.
   For a drawn feature with longitude coordinates from -180 to 180 to match a gridded dataset with longitude coordinates from 0 to 360, the geojson coordinates would need to be shifted by 360 and not just by 180.

Adding a Shape Feature
----------------------

The "Adding a Shape Feature" option allows the user to upload a shape feature from a shapefile or WMF GeoServer link in the map and extract time series
from a property that is in all the features of the shapefile. For example, if every feature of a shapefile contains a property called "id", then a time serie for each feature will be
retrieved.

.. note::
   Before adding a shape feature, the shapefile or  WMF GeoServer service used must have an attribute shared by each feature with unique values.
   The app will use this attribute to label the features when a time series is extracted.

The first option is to upload a shapefile which will be converted and stored as a geojson in the app. When this option is selected,
a dialogue box will appear allowing you to select a shapefile from your desktop.

.. image:: images/1.12.png
   :width: 1000
   :align: center

The second option is to access a geojson feature through a Geoserver or other application that provides WFS8 (Web Feature Service) access.
When selected a dialogue box with an input box to enter the WFS service URL will appear. Any other properly formatted WFS URL can be pasted.

.. image:: images/1.13.png
   :width: 1000
   :align: center

The steps to retrieve Time series using the "Adding a Shape Feature" method are the following:

1. Select the variable of interest.
2. Select between the options: "Use a Shapefile" or "WMF GeoServer Link".
3. Upload the shapefile or provide the WMF service URL.
4. Select all the dimensions (e.g. time, lat, lon).
5. If the variable has more than 3 dimensions, then provide a value for the 4th dimension.
6. Provide a EPSG (European Petroleum Survey Group), x offset, and y offset if the the drawing item and gridded data are in different coordinate system.
7. Provide the behavior type: dissolve or features.
8. If you select the "features" type for the behavior type, then select an attribute shared by each feature in the shapefile or WMF service URL that contains unique values.
9. Select the type of plots.
10. Plot the time series.

.. image:: images/1.11.png
   :width: 1000
   :align: center

.. note::
   The behavior type determines how the vector data is used to mask the arrays. Options are: dissolve, features - dissolve:
   treats all features as if they were 1 feature and masks the entire set of polygons in 1 grid - features:
   treats each feature as a separate entity, must specify an attribute shared by each feature with unique values
   for each feature used to label the resulting series
