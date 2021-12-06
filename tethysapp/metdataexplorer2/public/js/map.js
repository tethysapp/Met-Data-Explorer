var MAP_PACKAGE = (function () {

  var map_init = function () {
    return map = L.map('map', {
      center: [0, 0],
      zoom: 3,
      minZoom: 2,
      zoomSnap: .5,
      boxZoom: true,
      fullscreenControl: true,
      timeDimension: true,
      timeDimensionControl: true,
      timeDimensionControlOptions: {
        position: "bottomleft",
        autoPlay: true,
        loopButton: true,
        backwardButton: true,
        forwardButton: true,
        timeSliderDragUpdate: true,
        minSpeed: 2,
        maxSpeed: 6,
        speedStep: 1,
      },
    })
  };
  var basemaps_init = function (mapObj) {
    // create the basemap layers
    let esri_imagery = L.esri.basemapLayer('Imagery');
    let esri_terrain = L.esri.basemapLayer('Terrain');
    let esri_labels = L.esri.basemapLayer('ImageryLabels');
    return {
      "ESRI Imagery (No Label)": L.layerGroup([esri_imagery]).addTo(mapObj),
      "ESRI Imagery (Labeled)": L.layerGroup([esri_imagery, esri_labels]),
      "ESRI Terrain": L.layerGroup([esri_terrain]),
    }
  };

  $(function () {
    mapObj = map_init();
    var getDataBounds = function () {
      let rectangleDrawer = new L.Draw.Rectangle(mapObj);
      rectangleDrawer.enable();
      /* Controls for when drawing on the maps */
    }

    let basemapObj = basemaps_init(mapObj);
    layerControlObj = L.control.layers(basemapObj,).addTo(mapObj);
    /* Drawing/Layer Controls */
    drawnItems = new L.FeatureGroup().addTo(mapObj);   // FeatureGroup is to store editable layers

    let drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        edit: true,
      },
      draw: {
        marker: true,
        polyline: false,
        circlemarker: false,
        circle: false,
        polygon: true,
        rectangle: true,
        trash: true,
      },
    });

    /* Add the controls to the map */
    mapObj.addControl(drawControl);

    $('#get-data-button').click(getDataBounds);

    mapObj.on(L.Draw.Event.CREATED, function (e) {
      console.log('Draw Event Created');
      drawnItems.addLayer(e.layer);
      input_spatial = JSON.stringify(e.layer.toGeoJSON());
      type_of_series = e.layerType;
    });
  })
})();

var data_layer = function (layernameUI, wmsURL, layer, range, style) {
  let wmsURL2;
  try {
    wmsURL2 = `${URL_threddsProxy}?main_url=${encodeURIComponent(wmsURL)}`;
    const wmsLayer = L.tileLayer.wms(wmsURL2, {
      layers: layer,
      dimension: 'time',
      useCache: true,
      crossOrigin: true,
      format: 'image/png',
      transparent: true,
      BGCOLOR: '0x000000',
      styles: style,
      colorscalerange: range,
    });
    wmsLayerTime = L.timeDimension.layer.wms(wmsLayer, {
      name: `${layernameUI}_check`,
      cacheForward: 200,
      updateTimeDimension: true,
      updateTimeDimensionMode: 'replace',
      requestTimefromCapabilities: false,
    });
    layers_dict[`${layernameUI}_check`] = wmsLayerTime
    return wmsLayerTime.addTo(mapObj);
  } catch (err) {
    console.log(err);
  }
}

var updateWMSLayer = function (layernameUI, x) {
  try {
    wmsURL = x['wmsURL'];
    layer = x['variable'];
    range = x['range'];
    style = x['style'];
    opacity = x['opacity'];
    if (mapObj.hasLayer(layers_dict[`${layernameUI}_check`])) {
      layerControlObj.removeLayer(layers_dict[`${layernameUI}_check`]);
      mapObj.removeLayer(layers_dict[`${layernameUI}_check`]);
      delete layers_dict[`${layernameUI}_check`];
    } else {
      Object.keys(layers_dict).forEach(function (key) {
        layerControlObj.removeLayer(layers_dict[key]);
        mapObj.removeLayer(layers_dict[key]);
        delete layers_dict[key];

      });
      dataLayerObj = data_layer(layernameUI, wmsURL, layer, range, style, opacity);
      dataLayerObj.setOpacity(opacity);
      layerControlObj.addOverlay(dataLayerObj, "Data Layer");
    }
  } catch (e) {
    console.log(e);
  }
}

var updateWMSLayer2 = function (layernameUI, x) {
  try {
    wmsURL = x['wmsURL'];
    layer = x['variable'];
    range = x['range'];
    style = x['style'];
    opacity = x['opacity'];

    Object.keys(layers_dict).forEach(function (key) {
      layerControlObj.removeLayer(layers_dict[key]);
      mapObj.removeLayer(layers_dict[key]);
      delete layers_dict[key];

    });
    dataLayerObj = data_layer(layernameUI, wmsURL, layer, range, style, opacity);
    dataLayerObj.setOpacity(opacity);
    layerControlObj.addOverlay(dataLayerObj, "Data Layer");

  } catch (e) {
    console.log(e);
  }
}

var removeActiveLayer = function (layernameUI) {
  try {
    layerControlObj.removeLayer(layers_dict[`${layernameUI}_check`]);
    mapObj.removeLayer(layers_dict[`${layernameUI}_check`]);
    delete layers_dict[`${layernameUI}_check`];
  } catch (e) {
    return
  }
}

var changeOpacity = function (layernameUI, opacity) {
  opacity_new = Math.trunc(opacity * 100);
  $("#opacityValue").html(`${opacity_new} `);
  try {
    layers_dict[`${layernameUI}_check`].setOpacity(opacity);
  } catch (e) {
    return
  }
}
