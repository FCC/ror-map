 var map;
 var shownPolygon;
 var clickedPolygon;
 var dataNow = {
     "totalFeatures": 0
 };
 var dataCredential = {};
 var xNow;
 var yNow;

 var drawnPolygonOption = {
     'color': '#ffff21',
     'fillColor': '#ffff21',
     'weight': 4,
     'fillOpacity': 0.25
 }

 var clickedPolygonOption = {
     'color': '#65ff21',
     'fillColor': '#fff',
     'weight': 4,
     'fillOpacity': 0.25
 }

 var southWest = L.latLng(24.525841, -126.597970),
     northEast = L.latLng(50.957531, -64.722975),
     bounds_us = L.latLngBounds(southWest, northEast);

 function createMap() {
     L.mapbox.accessToken = 'pk.eyJ1IjoiY29tcHV0ZWNoIiwiYSI6InMyblMya3cifQ.P8yppesHki5qMyxTc2CNLg';
     map = L.mapbox.map('map', 'nbm.i2op87g0', {
             attributionControl: true,
             maxZoom: 11
         })
         .fitBounds(bounds_us);

     map.attributionControl.addAttribution('<a href="http://fcc.gov/maps">FCC Maps</a>');

     baseStreet = L.mapbox.tileLayer('fcc.k74ed5ge').addTo(map);
     baseSatellite = L.mapbox.tileLayer('fcc.k74d7n0g');
     baseTerrain = L.mapbox.tileLayer('fcc.k74cm3ol');

     var wms_ror_service_areas = L.tileLayer.wms('http://ldevtm-geo02:8080/geoserver/wms', {
         format: 'image/png',
         transparent: true,
         layers: 'geo_swat:ror_service_areas'
     });

     var wms_ror_service_areas_sac = L.tileLayer.wms('http://ldevtm-geo02:8080/geoserver/wms', {
         format: 'image/png',
         transparent: true,
         layers: 'geo_swat:ror_service_areas_sac'
     });

     /*
     var wms_ror_central_offices = L.tileLayer.wms('http://ldevtm-geo02:8080/geoserver/wms', {
         format: 'image/png',
         transparent: true,
         layers: 'geo_swat:ror_central_offices'
     });
	 */
	 
	 var wfs_ror_central_offices = L.mapbox.featureLayer();
	 	 
	 $.ajax({
		type: "GET",
		url: 'http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_central_offices&outputFormat=text/javascript',
		dataType: "jsonp",
		jsonpCallback: "parseResponse",
		success: function(data) {
		
			for (var i = 0; i < data.features.length; i++) {
				data.features[i].properties['marker-color'] = '#7ebc64';
				data.features[i].properties['marker-size'] = 'small';
			}
			
			wfs_ror_central_offices.setGeoJSON(data);		
		}
	 });

     L.control.scale({
         position: 'bottomright'
     }).addTo(map);

     geocoder = L.mapbox.geocoder('mapbox.places-v1');

     L.control.layers({
         'Street': baseStreet.addTo(map),
         'Satellite': baseSatellite,
         'Terrain': baseTerrain
     }, {
         'Service Areas SA': wms_ror_service_areas.addTo(map),
         'Service Areas SAC': wms_ror_service_areas_sac.addTo(map),
         'Central Offices': wfs_ror_central_offices//.addTo(map)
     }, {
         position: 'topleft'
     }).addTo(map);

     // var gridLayer = L.mapbox.gridLayer('fcc.7zcvriap', {'follow': true});
     // map.addLayer(gridLayer);
     // map.addControl(L.mapbox.gridControl(gridLayer));

     //map.addControl(L.mapbox.geocoderControl('mapbox.places').setPosition('topleft'))

     //wms_ror_service_areas.addTo(map);
	 
	 map.on("mousemove", function(e){

		var lat = e.latlng.lat;
		var lng = e.latlng.lng;

		var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas&maxFeatures=1&outputFormat=text/javascript&cql_filter=contains(geom,%20POINT(" + lng + " " + lat + "))";

		isInsideDrawnPolygon = false;
		if (map.hasLayer(shownPolygon)) {
			 var results = leafletPip.pointInLayer([lng, lat], shownPolygon);
			if (results.length > 0) {
				isInsideDrawnPolygon = true;
			}
		}

		if (isInsideDrawnPolygon) {
			return;
		}

		//$("#display").html(isInsideDrawnPolygon + ' ' +  url)

		$.ajax({
			type: "GET",
			url: url,
			dataType: "jsonp",
			jsonpCallback: "parseResponse",
			success: function(data) {
				displayPolygon(data);
			}
		});
	});

	/*
     map.on("click", function(e) {

         var lat = e.latlng.lat;
         var lng = e.latlng.lng;

         var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas&maxFeatures=1&outputFormat=text/javascript&cql_filter=contains(geom,%20POINT(" + lng + " " + lat + "))";

         isInsideDrawnPolygon = false;

         if (map.hasLayer(shownPolygon)) {
             var results = leafletPip.pointInLayer([lng, lat], shownPolygon);
             if (results.length > 0) {
                 isInsideDrawnPolygon = true;
             }
         }

         if (isInsideDrawnPolygon) {
             return;
         }         

         $.ajax({
             type: "GET",
             url: url,
             dataType: "jsonp",
             jsonpCallback: "parseResponse",
             success: function(data) {
                 //displayPolygon(data);
                 clickPolygon(data);
             }
         });
     });
	 */
 }


 $('#btn-street').on('click', function(e) {
     e.preventDefault();
     changeBaseLayer('street');
 });
 $('#btn-satellite').on('click', function(e) {
     e.preventDefault()
     changeBaseLayer('satellite');
 });
 $('#btn-topo').on('click', function(e) {
     e.preventDefault();
     changeBaseLayer('topo');
 });

 function changeBaseLayer(type) {

     map.removeLayer(baseStreet);
     map.removeLayer(baseSatellite);
     map.removeLayer(baseTerrain);

     if (type == 'street') {
         baseStreet.addTo(map);
         toggleClass(type);
     }
     if (type == 'satellite') {
         baseSatellite.addTo(map);
         toggleClass(type);
     }
     if (type == 'topo') {
         baseTerrain.addTo(map);
         toggleClass(type);
     }

 }

 function toggleClass(type) {

     $('#btn-street').removeClass('btn-baselayer-control-selected');
     $('#btn-satellite').removeClass('btn-baselayer-control-selected');
     $('#btn-topo').removeClass('btn-baselayer-control-selected');

     $('#btn-' + type).addClass('btn-baselayer-control-selected');
 }


 function displayPolygon(data) {
     dataNow = data;

     if (map.hasLayer(shownPolygon)) {
         map.removeLayer(shownPolygon)
     }

     if (dataNow.totalFeatures == 0) {
         $("#tooltip_box_div").hide();
         return;
     }

     shownPolygon = L.mapbox.featureLayer(data).setStyle(drawnPolygonOption).addTo(map);
     shownPolygon.on("click", function(e) {
         clickPolygon(e);
     });

     dataNow = data;
     shownPolygon.setZIndex(999);
     var text = "SAC:" + dataNow.features[0].properties.sac + "<br> SA:" + dataNow.features[0].properties.sa + "<br>SOURCE: " + dataNow.features[0].properties.node0sourc;

     $("#feature_display_div").html(text);
     $("#tooltip_box_div").show();
 }

 function clickPolygon(data) { console.log(data);
    dataNow = data;

     if (dataNow.totalFeatures == 0) {
         $("#tooltip_box_div").hide();
         return;
     }

     if (map.hasLayer(clickedPolygon)) {
         map.removeLayer(clickedPolygon);
     }
     clickedPolygon = L.mapbox.featureLayer(dataNow).setStyle(clickedPolygonOption).addTo(map);
     dataCredential = {
         "sac": dataNow.features[0].properties.sac,
         "sa": dataNow.features[0].properties.sa,
         "node0sourc": dataNow.features[0].properties.node0sourc
     };

     var text = "[Selected Area] SAC: " + dataCredential.sac + " SA: " + dataCredential.sa + " SOURCE:" + dataCredential.node0sourc;
     
    var tooltipText = "SAC:" + dataNow.features[0].properties.sac + "<br> SA:" + dataNow.features[0].properties.sa + "<br>SOURCE: " + dataNow.features[0].properties.node0sourc;

     $("#feature_display_div").html(tooltipText);
     $("#tooltip_box_div").show();

     $("#area-display").html(text);
     $("#warning-display").html("");

 }

 function setListener() {

     $("#input-search").on("click", function(e) {
         e.preventDefault();
         locChange();
     });

     $('#btn-geoLocation').click(function(event) {
         if (navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(function(position) {
                 var geo_lat = position.coords.latitude;
                 var geo_lon = position.coords.longitude;
                 var geo_acc = position.coords.accuracy;

                 map.setView([geo_lat, geo_lon], 12);

             }, function(error) {
                 //alert('Error occurred. Error code: ' + error.code);    
                 alert('Sorry, your current location could not be found. \nPlease use the search box to enter your location.');
             }, {
                 timeout: 4000
             });
         } else {
             alert('Sorry, your current location could not be found. \nPlease use the search box to enter your location.');
         }

         return false;
     });

     $("#btn-nationLocation").on("click", function() {
         map.fitBounds(bounds_us);
     });

     $("#map").on("mousemove", function(e) {
         xNow = e.pageX;
         yNow = e.pageY;
        // $("#display").html(xNow + ' ' + yNow)
     });

     $("#x-download").on("click", function(e) {
         $("#download_display_div").hide();
     });

     $("#btn-download").on("click", function(e) {
         e.preventDefault();
         downloadData();
     });

     $("#download_select").on("change", function(e) {
         e.preventDefault();
         $("#warning-display").html("");
     });

     $("input[name=download-type]").on("change", function(e) {
         e.preventDefault();
         var downloadType = $('input[name=download-type]:checked').val();
         if (downloadType == "all") {
             $("#warning-display").html("This will download data for all areas in one file");
         } else {
             if (dataCredential.sac == undefined) {
                 $("#warning-display").html("Please click on map to select an area to download");
             } else {
                 $("#warning-display").html("This will download data for the selected area");
             }
         }

     });
 }

 function downloadData(e) { console.log(e);
     var downloadType = $('input[name=download-type]:checked').val();
     var sac = dataCredential.sac;
     var sa = dataCredential.sa;
     var node0sourc = dataCredential.node0sourc;

     /*if (downloadType == "area" && sac == undefined) {
         var text = "Please click on map to select an area";
         $("#warning-display").html(text);
         return;
     }*/

     var dataType = e.currentTarget.id;;

     if (dataType == "") {
         var text = "Please select a data type";
         $("#warning-display").html(text);
         return;
     } else {
         if (dataType == "shapefile") {
             format = "shape-zip";
         }
         if (dataType == "geojson") {
             format = "application/json";
         }
         if (dataType == "kml") {
             format = "kml";
         }
         if (dataType == "csv") {
             format = "csv"
         }

         var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas&maxFeatures=50&outputFormat=" + format + "&cql_filter=sac='" + sac + "'+AND+sa='" + sa + "'+AND+node0sourc='" + node0sourc + "'";

         window.open(url, config = "toolbar=0");
     }
 }

 function downloadAllData(e) { console.log(e);
     var downloadType = $('input[name=download-type]:checked').val();
     var sac = dataCredential.sac;
     var sa = dataCredential.sa;
     var node0sourc = dataCredential.node0sourc;

     /*if (downloadType == "area" && sac == undefined) {
         var text = "Please click on map to select an area";
         $("#warning-display").html(text);
         return;
     }*/

     var dataType = $(e.currentTarget).attr('data-type');

     if (dataType == "shapefile") {
             format = "shape-zip";
         }
         if (dataType == "geojson") {
             format = "application/json";
         }
         if (dataType == "kml") {
             format = "kml";
         }
         if (dataType == "csv") {
             format = "csv"
         }

     var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas&maxFeatures=10000&outputFormat=" + format;

	 window.open(url, config = "toolbar=0");

 }

 function locChange() {

     var loc = $("#input-location").val();

     geocoder.query(loc, codeMap);
 }

 function codeMap(err, data) {
     //alert(JSON.stringify(data));

     var lat = data.latlng[0];
     var lon = data.latlng[1];

     if (data.lbounds) {
         map.fitBounds(data.lbounds);
     } else if (data.latlng) {
         map.setView([lat, lon], 15);
     }
 }

 function showDownloadMenuBox() {
     $("#download-menu-box").show()
 }

 function hideDownloadMenuBox() {
     $("#download-menu-box").hide()
 }

 function showMapLegendBox() {
     $("#map-legend-box").show()
 }

 function hideMapLegendBox() {
     $("#map-legend-box").hide()
 }

 $(document).ready(function() {
     createMap();
     setListener();

     $('[data-toggle="tooltip"]').tooltip({ trigger: 'hover' });

     $('.btn-legend').click(function(){ 
        $(this).hide();
        $('.legend').show('fast');
    });

    $('.btn-closeLegend').click(function() { 
        $('.legend').hide('fast');
        $('.btn-legend').show();
    });

    $('.links-download').on('click', 'a', function(e) {
        downloadData(e);
    });

    $('.links-downloadAll').on('click', 'a', function(e) {
        downloadAllData(e);
    }).on('click', '.btn', function(e) {
        $('#download-menu-box').hide();
    });

    $('#download-btn-small').on('click', function(){
        $("#download-menu-box").show('fast');
    });

});
