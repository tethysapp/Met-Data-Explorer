
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
  var data_layer = function() {
    try {
      if (wmsURL.indexOf("http://") != -1) {
        console.log("Http endpoint found, changing to proxy URL");
        wmsURL = `${URL_threddsProxy}?main_url=${encodeURIComponent(wmsURL)}`;
      }
      const layer = $('#variable-input').val();
      const range = $('#wmslayer-bounds').val();
      const style = $('#wmslayer-style').val();
      const wmsLayer = L.tileLayer.wms(wmsURL, {
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
        name: 'time',
        requestTimefromCapabilities: true,
        updateTimeDimension: true,
        updateTimeDimensionMode: 'replace',
        cache: 20,
      });
      firstlayeradded = true;
      return wmsLayerTime.addTo(mapObj);
    } catch(err) {
      alert('Invalid values.');
    }
  }

  $(function(){
    let mapObj = map_init();
    let basemapObj = basemaps_init(mapObj);
    let layerControlObj = L.control.layers(basemapObj,).addTo(mapObj);
  })

})();




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
