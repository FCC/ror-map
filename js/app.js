 var map;
 var shownPolygonSAC;
 var shownPolygonSA;
 var clickedPolygon;
 var isInsideDrawnPolygonSAC = false;
 var isInsideDrawnPolygonSA = false;
 var clickedPolygonList = [];
 var clickedSACList = [];
 var clickedSACData = [];
 var dataNowSAC = {
     "totalFeatures": 0
 };
 var dataNowSA = {
     "totalFeatures": 0
 };

 var dataCredential = {};
 var xNow;
 var yNow;

 var drawnPolygonOptionSAC = {
     'color': '#ffff21',
     'fillColor': '#ffff21',
     'weight': 4,
     'fillOpacity': 0.6
 }

  var drawnPolygonOptionSA = {
     'color': '#fff',
     'fillColor': '#999',
     'weight': 2,
     'fillOpacity': 0.4
 }

 // var clickedPolygonOption = {
 //     'color': '#65ff21',
 //     'fillColor': '#fff',
 //     'weight': 4,
 //     'fillOpacity': 0.25
 // }

  var clickedPolygonOption = {
     'color': '#00ff00',
     'fillColor': '#00ff00',
     'weight': 4,
     'fillOpacity': 0.6
 }

 var southWest = L.latLng(24.525841, -126.597970),
     northEast = L.latLng(50.957531, -64.722975),
     bounds_us = L.latLngBounds(southWest, northEast);

 function createMap() {
     L.mapbox.accessToken = 'pk.eyJ1IjoiY29tcHV0ZWNoIiwiYSI6InMyblMya3cifQ.P8yppesHki5qMyxTc2CNLg';
     map = L.mapbox.map('map', 'nbm.i2op87g0', {
             attributionControl: true,
             maxZoom: 19
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

     
     var wms_ror_central_offices = L.tileLayer.wms('http://ldevtm-geo02:8080/geoserver/wms', {
         format: 'image/png',
         transparent: true,
         layers: 'geo_swat:ror_central_offices'
     });
	 
	 
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
         'Central Offices': wms_ror_central_offices.addTo(map)
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

        //SAC
		var url_sac = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas_sac&maxFeatures=1&outputFormat=text/javascript&cql_filter=contains(geom,%20POINT(" + lng + " " + lat + "))";

		isInsideDrawnPolygonSAC = false;
		if (map.hasLayer(shownPolygonSAC)) {
			 var results = leafletPip.pointInLayer([lng, lat], shownPolygonSAC);
			if (results.length > 0) {
				isInsideDrawnPolygonSAC = true;
			}
		}

		if (!isInsideDrawnPolygonSAC) {
    		$.ajax({
                type: "GET",
                url: url_sac,
                dataType: "jsonp",
                jsonpCallback: "parseResponse",
                success: function(data) {
                    displayPolygonSAC(data);
                }
            });

         $("#tooltip_box_div").hide();

            return;
		}

        //SA
        var url_sa = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas&maxFeatures=1&outputFormat=text/javascript&cql_filter=contains(geom,%20POINT(" + lng + " " + lat + "))";

        isInsideDrawnPolygonSA = false;
        if (map.hasLayer(shownPolygonSA)) {
             var results = leafletPip.pointInLayer([lng, lat], shownPolygonSA);
            if (results.length > 0) {
                isInsideDrawnPolygonSA = true;
            }
        }

        if (isInsideDrawnPolygonSA) {
            return;
        }

        $.ajax({
            type: "GET",
            url: url_sa,
            dataType: "jsonp",
            jsonpCallback: "parseResponse",
            success: function(data) {
                displayPolygonSA(data);
            }
        });

	});

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


 function displayPolygonSAC(data) {
     dataNowSAC = data;

     if (dataNowSAC.totalFeatures == 0) {
        if (map.hasLayer(shownPolygonSAC)) {
			 map.removeLayer(shownPolygonSAC);
			 return;
		 }
	 } 	

	var feature_id;
	if (data.features.length > 0) {
		 var feature_id = data.features[0].id.replace(/\..*$/, '');
		 if (feature_id == "ror_service_areas") {
			return;
		 }

		 if (map.hasLayer(shownPolygonSAC)) {
			 map.removeLayer(shownPolygonSAC)
		 }

		 shownPolygonSAC = L.mapbox.featureLayer(dataNowSAC).setStyle(drawnPolygonOptionSAC).addTo(map);
		 shownPolygonSAC.on("click", function(e) {
			 clickPolygonSAC(e);
		 });

		 shownPolygonSAC.setZIndex(999);
		 var text = "SAC:" + dataNowSAC.features[0].properties.sac + "<br> SA:" + dataNowSAC.features[0].properties.sa + "<br>SOURCE: " + dataNowSAC.features[0].properties.node0sourc;
	}
 }


function displayPolygonSA(data) {
     dataNowSA = data;
	
	var feature_id;
	if (data.features.length > 0) {
		
		var feature_id = data.features[0].id.replace(/\..*$/, '');
		 if (feature_id == "ror_service_areas_sac") {
			return;
		 }
	 

		 if (map.hasLayer(shownPolygonSA)) {
			 map.removeLayer(shownPolygonSA)
		 }

		 if (dataNowSA.totalFeatures == 0) {
			 $("#tooltip_box_div").hide();
			 return;
		 }

		 shownPolygonSA = L.mapbox.featureLayer(dataNowSA).setStyle(drawnPolygonOptionSA).addTo(map);
		 shownPolygonSA.on("click", function(e) {
			  clickPolygonSA(e);
		  });

		 shownPolygonSA.setZIndex(999);
		 var text = "Study Area Code:" + dataNowSA.features[0].properties.sac + "<br> Service Area:" + dataNowSA.features[0].properties.sa + "<br>Source: " + dataNowSA.features[0].properties.node0sourc;

		 $("#feature_display_div").html(text);
		 $("#tooltip_box_div").show();
	 }
 }

 function clickPolygonSA(data) { console.log(data);

    dataNow = data;

     if (dataNowSA.totalFeatures == 0) {
         $("#tooltip_box_div").hide();
         return;
     }

     dataCredential = {
         "sac": dataNowSA.features[0].properties.sac,
         "sa": dataNowSA.features[0].properties.sa,
         "node0sourc": dataNowSA.features[0].properties.node0sourc
     };

     var index = $.inArray(dataCredential.sac, clickedSACList);
     if (index < 0) {
        clickedSACList.push(dataCredential.sac);
        clickedSACData.push(dataNowSAC);
     }
     else {
        clickedSACList.splice(index, 1);
        clickedSACData.splice(index, 1);
        //alert('deleted')
        //alert('num sac data=' + clickedSACData.length)
     }

     //alert(clickedSACList);

     updateSACDownloadBox();

     var text = "[Selected Area] SAC: " + dataCredential.sac + " SA: " + dataCredential.sa + " SOURCE:" + dataCredential.node0sourc;

    var tooltipText = "SAC:" + dataNow.features[0].properties.sac + "<br> SA:" + dataNow.features[0].properties.sa + "<br>SOURCE: " + dataNow.features[0].properties.node0sourc;

     $("#feature_display_div").html(tooltipText);
     $("#tooltip_box_div").show();

     $("#area-display").html(text);
     $("#warning-display").html("");

 }

function clickPolygonSAC(data) {

        var index = $.inArray(dataNowSAC.features[0].properties.sac, clickedSACList);
      
         if (index < 0) {
            clickedSACList.push(dataNowSAC.features[0].properties.sac);
            clickedSACData.push(dataNowSAC);
         }
         else {
            clickedSACList.splice(index, 1);
            clickedSACData.splice(index, 1);
         }

         updateSACDownloadBox();

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
     });

     $("#x-download").on("click", function(e) {
         $("#download_display_div").hide();
     });

     // $("#btn-download").on("click", function(e) {
     //     e.preventDefault();
     //     downloadData();
     // });

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


    $( "#input-sac" ).autocomplete({
        source: function( request, response ) {

        var sac = request.term

        var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas_sac&count=25&propertyName=sac&outputFormat=text/javascript&sortBy=sac&cql_filter=sac+like+'" + sac + "%25'";

        $.ajax({
        type: "GET",
        url: url,
        dataType: "jsonp",
        jsonpCallback: "parseResponse",
        success: function( data ) {
            var features = data.features;
            sac_list = [];
            for (var i = 0; i < features.length; i++) {
                sac_list.push(features[i].properties.sac);
            }

        response( sac_list );
        }
        });
        },
        minLength: 2,
        select: function( event, ui ) {
            setTimeout(function() {getSAC();}, 200);
        },
        open: function() {
        $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
        },
        close: function() {
        $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
        }
        });

        function getSAC() {
            var sac = $("#input-sac").val();
            var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=2.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas_sac&count=1&outputFormat=text/javascript&cql_filter=sac='" + sac + "'";

            //alert(url)
            $.ajax({
        type: "GET",
        url: url,
        dataType: "jsonp",
        jsonpCallback: "parseResponse",
        success: function( data ) {
        //alert(data.totalFeatures)
            var feature = data.features[0];
            var bbox = feature.properties.bbox;
            var southWest = L.latLng(bbox[0], bbox[1]),
            northEast = L.latLng(bbox[2], bbox[3]),
            bounds = L.latLngBounds(southWest, northEast);
            //alert(bounds)
            //clickedPolygon1 = L.mapbox.featureLayer(feature).setStyle(clickedPolygonOption).addTo(map);
            //alert(clickedPolygon1)
            //clickedPolygon1.setZIndex(999);
            map.fitBounds(bounds);

        }

        });


        }
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

    $('.links-downloadAll').on('click', 'a', function(e) {
        //downloadAllData(e);
        downloadSAC(e);
    }).on('click', '.btn', function(e) {
        $('#download-menu-box').hide();
    });

    $('#download-btn-small').on('click', function(){
        setWhatToDownload();
        $("#download-menu-box").show('fast');
    });

});


function updateSACDownloadBox() {

    for (var i = 0; i < clickedPolygonList.length; i++) {
        if (map.hasLayer(clickedPolygonList[i])) {
            map.removeLayer(clickedPolygonList[i]);
        }
    }

    setWhatToDownload();

    clickedPolygonList = [];
    for (var i = 0; i < clickedSACData.length; i++) {
        var poly = L.mapbox.featureLayer(clickedSACData[i]).setStyle(clickedPolygonOption).addTo(map);
        clickedPolygonList.push(poly);
        clickedPolygonList[clickedPolygonList.length-1].on("click", function(e) {

        var index = $.inArray(dataCredential.sac, clickedSACList);
         if (index < 0) {
            clickedSACList.push(dataCredential.sac);
            clickedSACData.push(dataNowSAC);
         }
         else {
            clickedSACList.splice(index, 1);
            clickedSACData.splice(index, 1);
         }

         updateSACDownloadBox();

            });
        }

}

function downloadSAC(e) {
    var dataType = e.target.id;
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

    var what = $('input[name=radio-areas]:checked').val();

    if (what == "all") {
        var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas&maxFeatures=10000&outputFormat=" + format;
        window.open(url, config = "toolbar=0");
    }
    else {
        var sac_tuple = "(";
        for (var i = 0; i < clickedSACList.length; i++){
            sac_tuple += "'" + clickedSACList[i] + "',";
        }

        sac_tuple = sac_tuple.replace(/,$/, "");
        sac_tuple += ")";

        var url = "http://ldevtm-geo02:8080/geoserver/geo_swat/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=geo_swat:ror_service_areas&maxFeatures=10000&outputFormat=" + format + "&cql_filter=sac+IN+" + sac_tuple;
        window.open(url, config = "toolbar=0");

    }
}

function setWhatToDownload() {
    if (clickedSACData.length == 0) {
        $('#all-areas').prop('checked',true);
        $('#selected-areas').prop('checked', false);
    }
    else {
        $('#all-areas').prop('checked',false);
        $('#selected-areas').prop('checked', true);
    }
}


