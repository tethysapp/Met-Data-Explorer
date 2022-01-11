// TODO implement closures

let id_dictionary = {};
let URLpath = [];
let subsetURL = "";
let wmsURL = "";
let opendapURL = "";
let containerAttributes = false;
let urlInfoBox = false;
let spatial_shape = false;
let add_services_list = [];
let mapObj;
let layers_dict = {};
let layerControlObj;
let current_Group;
let current_tdds;
let current_vars;
let dict_file_vars = {};
let isAdding = true;
let tdds_displaying_metadata;
let input_spatial;
let layers_dict_wms = {};
let values_donwload_json ={};
let last_selected_id = null;
let jsonLayer;
let type_of_series;
