
var MAP_PACKAGE = (function(){

  var map_init = function () {
    return map = L.map('map', {
      center: [0, 0],
      zoom: 3,
      minZoom: 2,
      zoomSnap: .5,
      boxZoom: true,
      fullscreenControl: true,
      // maxBounds: L.latLngBounds(L.latLng(-100.0, -270.0), L.latLng(100.0, 270.0)),
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
  var basemaps_init = function(mapObj) {
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

  var clickShpLayer = function (e) {
      let coords = e.sourceTarget._bounds;
      let coord = {
          0: {
              0: {'lat': coords['_southWest']['lat'], 'lng': coords['_southWest']['lng']},
              1: {'lat': coords['_northEast']['lat'], 'lng': coords['_southWest']['lng']},
              2: {'lat': coords['_northEast']['lat'], 'lng': coords['_northEast']['lng']},
              3: {'lat': coords['_southWest']['lat'], 'lng': coords['_northEast']['lng']}
          }
      };
      getTimeseries(coord);
  };


  var configureBounds = function(bounds) {
      if (typeof(bounds) === 'string') {
          if (bounds.slice(0, 4) == 'http') {
              $.getJSON(bounds,function(data){
                  makeGeojsonLayer(data);
                  mapObj.flyToBounds(shpLayer.getBounds());
              });
          } else {
              $.ajax({
                  url: URL_getGeojson,
                  data: {
                      name: bounds,
                  },
                  dataType: "json",
                  contentType: "application/json",
                  method: "GET",
                  async: false,
                  success: function (result) {
                      let geojson = result['geojson'];
                      console.log(geojson)
                      makeGeojsonLayer(geojson);
                      mapObj.flyToBounds(shpLayer.getBounds());
                  },
              });
          }
      } else {
          makeGeojsonLayer(bounds);
          mapObj.flyToBounds(shpLayer.getBounds());
      }
  }


  $(function(){
    mapObj = map_init();
    var getDataBounds = function() {
        let rectangleDrawer = new L.Draw.Rectangle(mapObj);
        rectangleDrawer.enable();
        /* Controls for when drawing on the maps */
    }

    var getThreddsBounds = function() {
        // $('#main-body').css('display', 'block');
        // $('#db-forms').css('display', 'none');
        // $('#add-shape-resource-modal').modal('hide');
        let polygonDrawer = new L.Draw.Polygon(mapObj);
        polygonDrawer.enable();
    }

    let basemapObj = basemaps_init(mapObj);
    layerControlObj = L.control.layers(basemapObj,).addTo(mapObj);
    /* Drawing/Layer Controls */
    let drawnItems = new L.FeatureGroup().addTo(mapObj);   // FeatureGroup is to store editable layers
    let shpLayer;

    let drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            edit: true,
        },
        draw: {
            marker: false,
            polyline: false,
            circlemarker: false,
            circle: false,
            polygon: false,
            rectangle: false,
            trash: true,
        },
    });

    /* Add the controls to the map */
    mapObj.addControl(drawControl);
    $('#draw-on-map-button').click(function(){
      // $('#modalAddGroupThredds').modal('hide');
      $('#modalAddGroupThredds').modal('hide');
      $('#modalAddServices').modal('hide');
      getThreddsBounds();
    });
    $('#get-data-button').click(getDataBounds);

    drawnItems.on('click', function (e) {
        let coord = e.layer.getLatLngs();
        getTimeseries(coord);
    });

    mapObj.on(L.Draw.Event.CREATED, function (e) {
        if (urlInfoBox == true) {
            let coord = e.layer.toGeoJSON();
            console.log(coord)
            /*let bounds = '((';
            for (let i = 0; i < 4; i++) {
                bounds += coord[0][i].lng.toFixed(2) + ' ' + coord[0][i].lat.toFixed(2) + ', ';
            }
            bounds += coord[0][0].lng.toFixed(2) + ' ' + coord[0][0].lat.toFixed(2) + '))';*/
            $('#spatial-input').val(JSON.stringify(coord));
            spatial_shape = coord;
            $('#modalAddGroupThredds').modal('show');
            $('#modalAddServices').modal('show');

            // $('#main-body').css('display', 'none');
            // $('#db-forms').css('display', 'block');
        } else {
            drawnItems.addLayer(e.layer);
            let coord = e.layer.getLatLngs();
            getTimeseries(coord);
        }
    });


  })

})();

var data_layer = function(layernameUI,wmsURL,layer,range,style) {
  console.log("data  layer");
  console.log(URL_threddsProxy);
  let wmsURL2;
  console.log(wmsURL);
  try {
    if (wmsURL.indexOf("http://") != -1) {
      console.log("Http endpoint found, changing to proxy URL");
      wmsURL2 = `${URL_threddsProxy}?main_url=${encodeURIComponent(wmsURL)}`;
    }
    else{
      wmsURL2 = wmsURL;
    }
    console.log(wmsURL2);
    // const layer = $('#variable-input').val();
    // const range = $('#wmslayer-bounds').val();
    // const style = $('#wmslayer-style').val();
    const wmsLayer = L.tileLayer.wms(wmsURL2, {
      layers: layer,
      dimension: 'time',
      useCache: true,
      crossOrigin: false,
      format: 'image/png',
      transparent: true,
      BGCOLOR: '0x000000',
      styles: style,
      colorscalerange: range,
    });
    wmsLayerTime = L.timeDimension.layer.wms(wmsLayer, {
      name: `${layernameUI}_check`,
      requestTimefromCapabilities: true,
      updateTimeDimension: true,
      updateTimeDimensionMode: 'replace',
      cache: 20,
    });
    layers_dict[`${layernameUI}_check`] = wmsLayerTime
    // firstlayeradded = true;
    return wmsLayerTime.addTo(mapObj);
  } catch(err) {
    console.log(err);
  }
}


var updateWMSLayer = function(layernameUI,wmsURL,layer,range,style,opacity) {
    // if (firstlayeradded == true) {
    if (mapObj.hasLayer(layers_dict[`${layernameUI}_check`])) {
        layerControlObj.removeLayer(dataLayerObj);
        mapObj.removeLayer(dataLayerObj);
        delete layers_dict[`${layernameUI}_check`]
    }
    else{
      dataLayerObj = data_layer(layernameUI,wmsURL,layer,range,style,opacity);
      dataLayerObj.setOpacity(opacity);
      layerControlObj.addOverlay(dataLayerObj, "Data Layer");
    }

}

var removeWMSLayer = function() {
    layerControlObj.removeLayer(dataLayerObj);
    mapObj.removeLayer(dataLayerObj);
    // firstlayeradded = false;
    $("#layer-display-container").css("display", "none");
}




//let insetMapObj = insetMap('inset-map-one');








// Inset map
/*
function insetMap(map) {
  let insetmap = L.map(map, {
    center: [0, 0],
    zoom: 3,
    minZoom: 2,
    zoomSnap: .5,
    boxZoom: true,
    fullscreenControl: true,
    maxBounds: L.latLngBounds(L.latLng(-100.0, -270.0), L.latLng(100.0, 270.0)),
  })
  return L.esri.basemapLayer('Streets').addTo(insetmap);
}*/
