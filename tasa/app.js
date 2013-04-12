/*
 | Version 1.0.0
 | Copyright 2013 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */

var map, cred = "esri_jsapi_id_manager_data", gridRoutes, gridOrders, gridAlerts, alertCounter = 0, VC, VS, timeMachine, timer, lyrTimer, lyrDevices, lyrRoutes, routesConnect, lyrOrders, lyrTextSymbols, lyrOrdersHighlight, lyrOrdersBreaks, ordersConnect, simulationLoaded = false, tempStopsForRoutes = [], currentStopsForRoute, simProgressDialog, simLoadCounter = 0;

//dojo requires
dojo.require('esri.Map');
dojo.require('esri.layers.FeatureLayer');
dojo.require('esri.tasks.Query');
dojo.require('esri.tasks.Route');
dojo.require('esri.IdentityManager');
dojo.require('esri.dijit.Popup');

dojo.require('dijit.form.HorizontalSlider');
dojo.require('dijit.form.Button');
dojo.require('dijit.form.TextBox');
dojo.require('dijit.form.Select');

dojo.require('dijit.layout.BorderContainer');
dojo.require('dijit.layout.ContentPane');
dojo.require('dijit.layout.TabContainer');

dojo.require('dijit.Toolbar');
dojo.require('dijit.ProgressBar');

dojo.require('dojox.layout.FloatingPane');
dojo.require('dojox.timing');

function init() {

    dojo.parser.parse();

    //Uncomment your proxy page
    // esri.config.defaults.io.proxyUrl = '../proxy.php';
    esri.config.defaults.io.proxyUrl = '../proxy.ashx';

    dojo.addOnUnload(storeCredentials);

    loadCredentials();

    var ext;
    if (config.InitialExtent){
        ext = new esri.geometry.Extent(config.InitialExtent);
    } else {
        ext = new esri.geometry.Extent({
            "xmin": -13056220,
            "ymin": 4033329,
            "xmax": -13032009,
            "ymax": 4040972,
            "spatialReference": {
                "wkid": 102100
            }
        });
    }

    var popupOptions = {
      'markerSymbol': new esri.symbol.SimpleMarkerSymbol('circle', 32, null, new dojo.Color([0, 0, 0, 0.25])),
      'marginLeft': '20',
      'marginTop': '20'
    };
    var popup = new esri.dijit.Popup(popupOptions, dojo.create("div"));

    map = new esri.Map("map", {
        extent: ext,
        infoWindow: popup
    });
    console.log("created the map");

    // con is dojo/_base/connect
    // http://dojotoolkit.org/reference-guide/1.7/dojo/connect.html
    dojo.connect(map, "onLoad", function() {
        dojo.connect(dijit.byId("map"), "resize", map, map.resize);
    });

    var basemapUrl = "http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
    var basemap = new esri.layers.ArcGISTiledMapServiceLayer(basemapUrl);
    map.addLayer(basemap);
    console.log("added the basemap");

    setupGridToolbarItems();

    var uri = window.location.search;
    var query = uri.substring(uri.indexOf("?") + 1, uri.length);
    var queryObj = dojo.queryToObject(query);
    if (queryObj.DeviceIDs) {
        config.Devices.deviceIDs = queryObj.DeviceIDs.split(',');
    }

    //routes layers
    var routesUrl = dojo.string.substitute(config.Routes.url, [config.Host]);
    lyrRoutes = new esri.layers.FeatureLayer(routesUrl, {
        id: 'lyrRoutes',
        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
        outFields: ['*']
    });
    var dte = new Date();
    var millis;
    millis = dte.setUTCHours(0);
    millis = dte.setUTCMinutes(0);
    millis = dte.setUTCSeconds(0);
    millis = dte.setUTCMilliseconds(0);

    lyrRoutes.setDefinitionExpression("DeviceID IN ( " + config.Devices.deviceIDs.join(',') + ") and PlannedDate = " + millis + " and Deleted = 0");

    routesConnect = dojo.connect(lyrRoutes, 'onUpdateEnd', dojo.hitch(this, initRoutes));

    map.addLayer(lyrRoutes);

    dojo.connect(dijit.byId('sldSimulation'), 'onChange', function (value) {
        //console.log('setting m.r. of :: ' + parseInt(value));
        if (timeMachine) {
            timeMachine.setMetabolicRate(parseInt(value));
        }
    });

    dojo.connect(dijit.byId('btnPlayPause'), 'onClick', dojo.hitch(this, simulationPlayPauseClick));

    dijit.byId('tabContainer').watch("selectedChildWidget", 
        function(name, oval, nval) {
            //console.log("selected child changed from ", oval.id, " to ", nval.id);
            alertCounter = 0;
            updateAlertsCounter();
        }
    );
}

dojo.addOnLoad(init);

function setupGridToolbarItems () {
    //routes toolbar setup
    var toolbarRoutes = new dijit.Toolbar({}, "toolbar");

    var ddSelectRoutes = dijit.form.Select({
        id: 'ddSelectRoutes',
        style: 'width: 125px;margin-right: 10px;',
        options: [
            { label: 'Route Name', value: 'route' },
            { label: 'Status', value: 'status' }
        ]
    });
    toolbarRoutes.addChild(ddSelectRoutes);

    var txtFilterRoutes = new dijit.form.TextBox({
        id: "txtFilterRoutes",
        placeHolder: "Filter Routes",
        width: 135
    });
    toolbarRoutes.addChild(txtFilterRoutes);

    var btnFilterRoutes = new dijit.form.Button({
        label: "Filter",
        showLabel: true
    });
    toolbarRoutes.addChild(btnFilterRoutes);
    dojo.connect(btnFilterRoutes, 'onClick', onFilterRoutesGrid);

    var btnClearRoutesFilter = new dijit.form.Button({
        label: "Clear Filter",
        showLabel: true
    });
    toolbarRoutes.addChild(btnClearRoutesFilter); 

    dojo.connect(btnClearRoutesFilter, 'onClick', onResetRoutesGridFilter);

    //orders toolbar setup
    var toolbarOrders = new dijit.Toolbar({}, "toolbarOrders");

    var ddSelect = dijit.form.Select({
        id: 'ddSelect',
        style: 'width: 125px;margin-right: 10px;',
        options: [
            { label: 'Status', value: 'status' },
            { label: 'Priority', value: 'priority' },
            { label: 'Route Name', value: 'route' },
            { label: 'Order Type', value: 'orderType' }
        ]
    });
    toolbarOrders.addChild(ddSelect);

    var txtFilterOrders = new dijit.form.TextBox({
        id: "txtFilterOrders",
        placeHolder: "Filter Orders",
        width: 135
    });
    toolbarOrders.addChild(txtFilterOrders);

    var btnFilter = new dijit.form.Button({
        label: "Filter",
        showLabel: true,
        style: 'margin-left: 10px;margin-right:10px'
    });
    toolbarOrders.addChild(btnFilter); 

    dojo.connect(btnFilter, 'onClick', onFilterOrdersGrid);

    var btnClearFilter = new dijit.form.Button({
        label: "Clear Filter",
        showLabel: true
    });
    toolbarOrders.addChild(btnClearFilter); 

    dojo.connect(btnClearFilter, 'onClick', onResetOrdersGridFilter);

    //alerts toolbar setup
    var alertsToolbar = new dijit.Toolbar({}, "toolbarAlerts");

    var ddSelectAlerts = dijit.form.Select({
        id: 'ddSelectAlerts',
        style: 'width: 125px;margin-right: 10px;',
        options: [
            { label: 'Route Name', value: 'route' },
            { label: 'Alert Type', value: 'type' }
        ]
    });
    alertsToolbar.addChild(ddSelectAlerts);

    var txtFilterAlerts = new dijit.form.TextBox({
        id: "txtFilterAlerts",
        placeHolder: "Filter Alerts",
        width: 135
    });
    alertsToolbar.addChild(txtFilterAlerts);

    var btnFilterAlerts = new dijit.form.Button({
        label: "Filter",
        showLabel: true,
        style: 'margin-left: 10px;margin-right:10px'
    });
    alertsToolbar.addChild(btnFilterAlerts); 

    dojo.connect(btnFilterAlerts, 'onClick', onFilterAlertsGrid);

    var btnClearFilterAlerts = new dijit.form.Button({
        label: "Clear Filter",
        showLabel: true
    });
    alertsToolbar.addChild(btnClearFilterAlerts); 

    dojo.connect(btnClearFilterAlerts, 'onClick', onResetAlertsGridFilter);
}

function storeCredentials() {
    // make sure there are some credentials to persist
    if ( esri.id.credentials.length === 0 ) {
        return;
    }

    // serialize the ID manager state to a string
    var idString = dojo.toJson(esri.id.toJson());
    // store it client side
    if ( supports_local_storage() ) {
        // use local storage
        window.localStorage.setItem(cred, idString);
        console.log("wrote to local storage");
    } else {
        // use a cookie
        dojo.cookie(cred, idString, { expires: 1 });
        console.log("wrote a cookie :-/");
    }
}

function loadCredentials() {
    var idJson, idObject;

    if ( supports_local_storage() ) {
        // read from local storage
        idJson = window.localStorage.getItem(cred);
    } else {
        // read from a cookie
        idJson = dojo.cookie(cred);
    }

    if ( idJson && idJson != "null" && idJson.length > 4) {
        idObject = dojo.fromJson(idJson);
        esri.id.initialize(idObject);
    } else {
        console.log("didn't find anything to load :(");
    }

}

function supports_local_storage() {
    try {
        return "localStorage" in window && window["localStorage"] !== null;
    } catch( e ) {
        return false;
    }
}

function checkForSimulationRealWorld() {
    var uri = window.location.search;
    if (uri !== '') {
        var query = uri.substring(uri.indexOf("?") + 1, uri.length);
        var queryObj = dojo.queryToObject(query);
        console.log(queryObj);  

        if (queryObj.useInAppSimulator == "true") {
            dijit.byId('dFloatingPane').show();
        } else {
            dijit.byId('dFloatingPane').hide();

            setupMobileDeviceLayer(queryObj);
        }
    
    } else {
        dijit.byId('dFloatingPane').show();
    } 
}

function setupMobileDeviceLayer(obj) {
    
    //add each vehicle (by DeviceID) to devices graphics layer
    var ids = obj.DeviceIDs.split(','),
        layer = map.getLayer('lyrDevices'),
        symbol = new esri.symbol.PictureMarkerSymbol('./images/GpsDisplay.png', 16, 16),
        graphic;
    
    VC = new VehiclesCollection();
    dojo.forEach(lyrRoutes.graphics,
        function (graphic) {
            var vehicleGraphic = VC.addVehicle(graphic.attributes.DeviceID, graphic.attributes.Name, graphic.attributes.Driver, graphic.attributes.Vehicle);
            lyrDevices.add(vehicleGraphic);
        }
    );

    beginTrackingVehicles();
}

function beginTrackingVehicles() {
    lyrTimer = new dojox.timing.Timer(5000);
    lyrTimer.onTick = dojo.hitch(this, onLocationTimerTick);
    lyrTimer.start();
}

function onLocationTimerTick() {
    
    //query task to get location updates
    var dUrl = dojo.string.substitute(config.Devices.url, [config.Host]);
    var dTask = new esri.tasks.QueryTask(dUrl);
    var dQuery = new esri.tasks.Query();
    dQuery.returnGeometry = true;
    dQuery.where = "OBJECTID IN (" + config.Devices.deviceIDs + ") AND Deleted = 0";
    dQuery.outSpatialReference = map.spatialReference;
    dQuery.outFields = ['OBJECTID','Timestamp'];

    dTask.execute(dQuery, dojo.hitch(this, onLocationUpdateSuccess), dojo.hitch(this, onLocationUpdateError))
}

function onLocationUpdateError(error) {
    console.log(error);
}

function onLocationUpdateSuccess(fSet) {
    var features = fSet.features;
    if (features.length == 0) {
        return;
    }

    var currentLocationRideAlong;
    dojo.forEach(features,
        function (feature) {
            var id = feature.attributes.OBJECTID,
                graphic;

            dojo.some(lyrDevices.graphics,
                function (device) {
                    if (id == device.attributes.DeviceID) {
                        graphic = device;
                        return false;
                    }
                },
                this
            );                       

            graphic.setGeometry(feature.geometry); 
            currentLocationRideAlong = feature.geometry;
        },
        this
    );

    queryForStopStatus(currentLocationRideAlong);
}

function queryForStopStatus(currentLocationRideAlong) {
    var dte = new Date();
    var millis;
    millis = dte.setUTCHours(0);
    millis = dte.setUTCMinutes(0);
    millis = dte.setUTCSeconds(0);
    millis = dte.setUTCMilliseconds(0);

    var eUrl = dojo.string.substitute(config.Events.url, [config.Host]);
    var sTask = new esri.tasks.QueryTask(eUrl);
    var sQuery = new esri.tasks.Query();
    sQuery.returnGeometry = true;
    sQuery.where = "DeviceID IN (" + config.Devices.deviceIDs + ") AND Deleted = 0 AND Timestamp > " + millis;
    sQuery.outSpatialReference = map.spatialReference;
    sQuery.outFields = ['*'];
    sQuery.orderByFields = ['Timestamp DESC'];

    sTask.execute(sQuery, 
        dojo.hitch(this,
            function (fs) {
                onStopStatusSuccess(fs, currentLocationRideAlong);
            }
        ), 
        dojo.hitch(this, onStopStatusError)
    );
}

function onStopStatusError(error) {
    console.log(error);
} 

function onStopStatusSuccess(fSet, currentLocationRideAlong) {
    var features = fSet.features;
    if (features.length == 0) {
        return;
    }

    var lastUpdatedStop = features[0];

    var gotStops = [],
        routeStatus,
        checked = false;

    dojo.forEach(features,
        function (feat) {
            if (!gotStops[feat.attributes.StopID]) {

                var rawStatus = feat.attributes.Status;
                var status;

                switch (rawStatus) {
                    case 0: 
                        status = 'Started';
                        // routeStatus = 'In Transit';
                        break;
                    case 1: 
                        status = 'Arrived';
                        // routeStatus = 'Arrived at Stop'
                        break;
                    case 2: 
                        status = 'Servicing Started';
                        // routeStatus = 'Servicing Stop';
                        break;
                    case 3: 
                        status = 'Servicing Finished';
                        break;
                    case 4: 
                        status = 'Stop cannot be serviced';
                        break;
                    default:
                        status = 'No status available';
                }

                var routeName = getRouteNameByDeviceID(feat.attributes.DeviceID);
                var stopNumber = feat.attributes.StopID;

                symbolizeStopGraphicByStatusAndUpdateGrid(routeName, stopNumber, status);

                gotStops[feat.attributes.StopID] = true;

            } 
        },
        this
    );
    
    var routeName = getRouteNameByDeviceID(lastUpdatedStop.attributes.DeviceID);

    var status = lastUpdatedStop.attributes.Status,
        routeStatus = 'In Transit';

    if (status == 1) {
        routeStatus = 'Arrived at Stop';
    } else if (status == 2) {
        console.log(lastUpdatedStop.attributes.Status);
        if (lastUpdatedStop.attributes.Status == 'On Break') {
            routeStatus = 'On Break';
        } else {
            routeStatus = 'Servicing Stop';
        }
    }

    refreshRouteGridStatus(routeName, routeStatus);
    
    var vehicle = VC.getByName(routeName);
    if (lastUpdatedStop.attributes.Status == 0) {
        var stop = dojo.filter(lyrOrders.graphics, function (item) { return item.attributes.OBJECTID == lastUpdatedStop.attributes.StopID })[0];
        if (stop.attributes.Type == 4) {
            
            //last stop turn things off if need be
            refreshRouteGridStatus(routeName, 'In Transit to End Depot');
            // lyrTimer.stop();

        } else {
            queryForETAUpdate(currentLocationRideAlong, stop.geometry, routeName);
        }

    } else {
        vehicle.attributes.isApproachingDestination = false;
    }
}

function queryForETAUpdate(currentLocationRideAlong, nextOrderGeom, routeName) {
    var routeTask = new esri.tasks.RouteTask(config.RouteService);
    var routeParams = new esri.tasks.RouteParameters();
    routeParams.outSpatialReference = {"wkid":102100};
    routeParams.returnDirections = false;
    routeParams.returnRoutes = true;

    var stops = new esri.tasks.FeatureSet();
    stops.features.push(new esri.Graphic(currentLocationRideAlong, new esri.symbol.SimpleMarkerSymbol(), { Name: "Stop 1"}, null));
    stops.features.push(new esri.Graphic(nextOrderGeom, new esri.symbol.SimpleMarkerSymbol(), { Name: "Stop 2"}, null));

    // console.log(stops);
    // dojo.forEach(stops.features, function (f) { map.graphics.add(f); }, this);

    routeParams.stops = stops;

    // var dte = new Date(lyrOrders.graphics[0].attributes.ArriveTime)
    // var millis;
    // millis = dte.setUTCHours(8);
    // millis = dte.setUTCMinutes(0);
    // millis = dte.setUTCSeconds(0);
    // millis = dte.setUTCMilliseconds(0);

    // routeParams.startTime = new Date(millis);

    routeTask.solve(routeParams, 
        dojo.hitch(this, 
            function (res) {
                onETARouteSolveSuccess(res, routeName);
            }
        ), 
        dojo.hitch(this, onETARouteSolveError)
    );
}

function onETARouteSolveError(error) {
    console.log(error);
}

function onETARouteSolveSuccess(solveResult, routeName) {
    var eta = solveResult.routeResults[0].route.attributes.Total_TravelTime;
    // var eta = Math.round(Math.round(Math.max(0, rawETA) / 6000)) / 10;
    var vehicle = VC.getByName(routeName);
    if (eta > 0 && eta < config.Simulator.Alerts.ApproachingStopThreshold && !vehicle.attributes.isApproachingDestination) {
        console.log(eta);
        console.log('approaching destination !');

        //send alert to alerts grid
        var alert = {
            ID: '',
            route: vehicle.attributes.RouteName,
            type: 'Approaching Destination',
            description: vehicle.attributes.Driver + ' is approaching the next stop'
        };

        vehicle.attributes.isApproachingDestination = true;

        addAlert(alert);
    }
}

function onFilterRoutesGrid() {
    var field = dijit.byId('ddSelectRoutes').value; //.toLowerCase();
    var filter = dojo.byId('txtFilterRoutes').value;
    if (filter.length > 0) {
        var obj = {};
        obj[field] = filter;

        gridRoutes.set('query', obj);
    }
}

function onResetRoutesGridFilter() {
    gridRoutes.set('query', {});
    dojo.byId('txtFilterRoutes').value = '';
}

function onFilterOrdersGrid() {
    var field = dijit.byId('ddSelect').value; //.toLowerCase();
    var filter = dojo.byId('txtFilterOrders').value;
    if (filter.length > 0) {
        var obj = {};
        obj[field] = filter;

        gridOrders.set('query', obj);
    }
}

function onResetOrdersGridFilter() {
    gridOrders.set('query', {});
    dojo.byId('txtFilterOrders').value = '';
}

function onFilterAlertsGrid() {
    var field = dijit.byId('ddSelectAlerts').value; //.toLowerCase();
    var filter = dojo.byId('txtFilterAlerts').value;
    if (filter.length > 0) {
        var obj = {};
        obj[field] = filter;

        gridAlerts.set('query', obj);
    }
}

function onResetAlertsGridFilter() {
    gridAlerts.set('query', {});
    dojo.byId('txtFilterAlerts').value = '';
}

function simulationPlayPauseClick() {
    if (!simulationLoaded) {

        if (!simProgressDialog) {
            simProgressDialog = new dijit.Dialog({
                id: 'dialogOne',
                title: "Gathering Simulation Information...",
                content: '<div data-dojo-type="dijit.ProgressBar" style="width:300px" data-dojo-id="jsProgress" id="downloadProgress" data-dojo-props="maximum:10"></div>',
                style: "width: 320px"
            });
        }
        
        simProgressDialog.show();

        setupVehicleCollectionAndSubsytem();

        breakoutStopsByRoutes();

        startSimulationGetRoutes();

        return;
    } else {
        timeMachine.pause(!timeMachine._paused);

        if (timeMachine._paused) {
            dijit.byId('btnPlayPause').attr('label','Play');
        } else {
            dijit.byId('btnPlayPause').attr('label','Pause');
        }
    }
}

function setupVehicleCollectionAndSubsytem() {
    VC = new VehiclesCollection();
    dojo.forEach(lyrRoutes.graphics,
        function (graphic) {
            var vehicleGraphic = VC.addVehicle(graphic.attributes.DeviceID, graphic.attributes.Name, graphic.attributes.Driver, graphic.attributes.Vehicle);
            lyrDevices.add(vehicleGraphic);
        }
    );
    
    VS = new VehicleCommunicationSubsystem();
    console.log(VS);
}

function breakoutStopsByRoutes() {
    tempStopsForRoutes = [];

    dojo.forEach(lyrRoutes.graphics,
        function (route) {
            var deviceID = route.attributes.DeviceID;
            var stopCollection = [];

            dojo.forEach(lyrOrders.graphics,
                function (order) {
                    if (order.attributes.DeviceID === deviceID) {
                        stopCollection.push(order);
                    }
                },
                this
            );

            tempStopsForRoutes.push({ deviceID: deviceID, routeName: route.attributes.Name, stops: stopCollection });

        },
        this
    );

    console.log(tempStopsForRoutes);
}

function startSimulationGetRoutes() {
    if (tempStopsForRoutes.length === 0) {
        
        simProgressDialog.hide();

        beginSimulation();

        return;
    }
    currentStopsForRoute = tempStopsForRoutes.shift();

    getRoute();
}


function getRoute() {
    if (currentStopsForRoute.stops.length > 0) {

        var graphics = currentStopsForRoute.stops;
        

        //use start time of first stop in orders layer
        var dte = new Date(lyrOrders.graphics[0].attributes.ArriveTime)
        var millis;
        millis = dte.setUTCHours(8);
        millis = dte.setUTCMinutes(0);
        millis = dte.setUTCSeconds(0);
        millis = dte.setUTCMilliseconds(0);

        // timeMachine = new TimeMachine(8 * 60 * 60 * 1000);
        timeMachine = new TimeMachine(millis);

          //simulation testing
        var routeTask = new esri.tasks.RouteTask(config.RouteService);
        var routeParams = new esri.tasks.RouteParameters();
        routeParams.outSpatialReference = {"wkid":102100};
        routeParams.returnDirections = true;
		routeParams.outputLines = esri.tasks.NAOutputLine.TRUE_SHAPE;
        // routeParams.doNotLocateOnRestrictedElements = true;
        // routeParams.restrictUTurns = esri.tasks.NAUTurn.AT_DEAD_ENDS_AND_INTERSECTIONS;
        // routeParams.returnRoutes = true;
        // routeParams.restrictionAttributes = ["Oneway", "Driving an Automobile", "Through Traffic Prohibited", "Avoid Unpaved Roads", "Avoid Private Roads", "Avoid Gates" ];

        // var time = timeMachine.getCurrentTime();var dte = new Date();
       
        // routeParams.startTime = new Date(8 * 60 * 60 * 1000);
        routeParams.startTime = new Date(millis);

        dojo.connect(routeTask, "onSolveComplete", showRoute);

        console.log(graphics);
        var stops = new esri.tasks.FeatureSet();
        dojo.forEach(graphics,
            function (graphic, index) {     //TRY AGAIN WITH Attr_TravelTime
                stops.features.push(
                    new esri.Graphic(
                        graphic.geometry, 
                        new esri.symbol.SimpleMarkerSymbol(), 
                        { 
                            Name: "Order #" + graphic.attributes.OBJECTID, //+ (index + 1), 
                            "Attr_TravelTime": graphic.attributes.ServiceTime ? graphic.attributes.ServiceTime : 0
                        },
                        null
                    )
                );
            },
            this
        );

        routeParams.stops = stops;

        routeTask.solve(routeParams);
    } else {
        startSimulationGetRoutes();
    }

}

function showRoute(solveResult) {
    console.log(solveResult);

    //for debug purposes --- test if route is same as Route Planning app
    //var routeSymbol = new esri.symbol.SimpleLineSymbol().setColor(new dojo.Color([0,0,255,0.5])).setWidth(5);
    //map.graphics.add(solveResult.routeResults[0].route.setSymbol(routeSymbol));

    var vehicle = VC.getByName(currentStopsForRoute.routeName);
    VS.sendDirectionsToVehicle(vehicle.attributes.RouteName, solveResult.routeResults[0].directions);

    jsProgress.update({
        maximum: lyrRoutes.graphics.length,
        progress: simLoadCounter
    });

    simLoadCounter += 1;

    startSimulationGetRoutes();
}

function beginSimulation() {

    timeMachine.pause(false);

    timer = new dojox.timing.Timer(30);
    timer.onTick = function () {
        var currentTime = timeMachine.getCurrentTime();
        if (!timeMachine.isPaused()) {
            updateVehiclePosition(currentTime);
        }
    };
    timer.start();

    simulationLoaded = true;

    dijit.byId('btnPlayPause').attr('label','Pause');

}

function updateVehiclePosition(currentTime) {
    var vehicle,
        now = new Date(currentTime),
        i = 0;
    for (i; i < VC.vehicles.length; i ++) {
        vehicle = VC.vehicles[i];
        
        var response = VS.getRecentVehiclePosition(vehicle.attributes.RouteName, now);
        //console.log(locationPoint);
        vehicle.attributes['routeFinished'] = response.routeFinished;
        if (response.routeFinished) {
            VC.routeFinishedCount += 1;
        }
        vehicle.setGeometry(response.location);
        

        //need to process events to show what the vehicle is doing. i.e. en route to Stop 1 or Servicing Stop 3, etc.
        var eventQueue = response.eventQueue;

        if (checkSimulationFinished()) {
            return;
        }

        var j = 0,
            event;
        for (j; j < eventQueue.events.length;j++) {
            event = eventQueue.events[j];
            if (event.text.indexOf('Order #') > -1) {

                if (event.maneuverType === 'esriDMTStop') {
                    vehicle.attributes.Status = VC.VEHICLE_STATUS_SERVICING_STOP;

                    refreshRouteGridStatus(vehicle.attributes.RouteName, vehicle.attributes.Status);
                    
                    var t = event.text;
                    var stopId = parseInt( t.substr(t.indexOf('#') + 1, t.length-1) );
                    symbolizeStopGraphicByStatusAndUpdateGrid(vehicle.attributes.RouteName, stopId, 'Servicing');
                }

                if (event.maneuverType === 'esriDMTDepart') {
                    vehicle.attributes.Status = VC.VEHICLE_STATUS_EN_ROUTE;
                    
                    refreshRouteGridStatus(vehicle.attributes.RouteName, vehicle.attributes.Status);

                    var t = event.text;
                    var stopId = parseInt( t.substr(t.indexOf('#') + 1, t.length-1) );
                    symbolizeStopGraphicByStatusAndUpdateGrid(vehicle.attributes.RouteName, stopId, 'Servicing Finished');

                    vehicle.attributes.isApproachingDestination = false;

                }
            }
        }

        var nextStopETA = response.outNextStopETA;
        //console.log(nextStopETA);
        var eta = Math.round(Math.round(Math.max(0, nextStopETA) / 6000)) / 10;
        if (eta > 0 && eta < config.Simulator.Alerts.ApproachingStopThreshold && !vehicle.attributes.isApproachingDestination) {
            console.log(eta);
            console.log('approaching destination !');

            //send alert to alerts grid
            var alert = {
                ID: '',
                route: vehicle.attributes.RouteName,
                type: 'Approaching Destination',
                description: vehicle.attributes.Driver + ' is approaching the next stop'
            };

            vehicle.attributes.isApproachingDestination = true;

            addAlert(alert);
        }
    }
}

function symbolizeStopGraphicByStatusAndUpdateGrid(routeName, stopId, status) {
    var stopGraphic,
        updateItem;

    dojo.some(gridOrders.store.data,
        function (item, index) {
            if (stopId == item.id) {

                updateItem = item;

                if (item.type !== 0 && item.type !== 3 && item.type !== 4) {
                    if (item.type == 2) {
                        item.status = 'On Break';
                    } else {
                        item.status = status;
                    }
                    return false;
                }
            }
        },
        this
    );

    if (!updateItem) {
        return;
    } else {
        gridOrders.store.put(updateItem);
        gridOrders.refresh();
    }

    if (status == 'Servicing Finished' && updateItem.type == 1) {
        dojo.some(lyrOrders.graphics,
            function (graphic) {
                if (graphic.attributes.RouteName == routeName && graphic.attributes.OBJECTID == stopId) {
                    
                    var outlineColor = new dojo.Color(graphic.attributes.Color);
                    outlineColor.a = .5;
                    
                    var symbol = new esri.symbol.SimpleMarkerSymbol()
                        .setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE)
                        .setSize(18)
                        .setColor(new dojo.Color([128,128,128, .5]))
                        .setOutline(new esri.symbol.SimpleLineSymbol().setColor(outlineColor).setWidth(2));
                    
                    graphic.setSymbol(symbol);

                    return false;
                }
            }
        );
    }

}

function refreshRouteGridStatus(routeName, status) {
    // var routeName = vehicle.attributes.RouteName;
    var item = gridRoutes.store.query({ route: routeName })[0];
    item.status = status; //vehicle.attributes.Status;
    gridRoutes.store.put(item);
    gridRoutes.refresh();
}

function checkSimulationFinished() {
    if (VC.routeFinishedCount === VC.vehicles.length) {
        console.log('stopping timer');
        timer.stop();
        return true;
    }
    return false;
}

function initRoutes() { 

    require(
        ["dojo/_base/declare", "dojo/_base/connect", "dgrid/OnDemandGrid", "dgrid/Grid", "dgrid/Keyboard", "dgrid/Selection","dgrid/extensions/ColumnHider", "dgrid/extensions/ColumnResizer", "dgrid/extensions/DijitRegistry", "dojo/store/Memory"],
        function (declare, con, OnDemandGrid, Grid, Keyboard, Selection, ColumnHider, ColumnResizer, DijitRegistry, Memory) {
            
            dojo.disconnect(routesConnect);

            //setup renderer
            var defaultSymbol = new esri.symbol.SimpleLineSymbol();
            var renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "OBJECTID");

            dojo.forEach(lyrRoutes.graphics,
                function (graphic) {
                    var color = new dojo.Color( dojo.fromJson(graphic.attributes.Color).color );
                    var width = (config.Routes.symbolWidth) ? config.Routes.symbolWidth : 3;
                    renderer.addValue(graphic.attributes.OBJECTID, new esri.symbol.SimpleLineSymbol().setColor(color).setWidth(width));
                },
                this
            );

            lyrRoutes.setRenderer(renderer);

            console.log('initting routes');

            var data = [];
            dojo.forEach(lyrRoutes.graphics,
                function (graphic) {
                    data.push(
                        {
                            id: graphic.attributes.OBJECTID,
                            route: graphic.attributes.Name,
                            status: 'Idle',
                            driver: graphic.attributes.Driver,
                            driverSpecialty: (graphic.attributes.DriverSpecialty != null) ? graphic.attributes.DriverSpecialty : '',
                            vehicle: graphic.attributes.Vehicle,
                            vehicleSpecialty: (graphic.attributes.VehicleSpecialty != null) ? graphic.attributes.VehicleSpecialty : '',
                            graphic: graphic
                        }
                    );
                },
                this
            );

            var memoryStore = new Memory({
                data: data
            });

            gridRoutes = new declare([OnDemandGrid, Keyboard, Selection, ColumnHider, ColumnResizer,DijitRegistry])({
                columns: {
                    id: {
                        label: "ID",
                        hidden: true
                    },
                    route: {
                        label: "Route Name"
                    },
                    status: {
                        label: "Status"
                    },
                    driver: {
                        label: "Driver"
                    },
                    driverSpecialty: {
                        label: "Driver Specialty"
                    },
                    vehicle: {
                        label: "Vehicle"
                    },
                    vehicleSpecialty: {
                        label: "Vehicle Specialty"
                    }
                },
                store: memoryStore
            }, "gridRoutes");

            //grid row click handlers setup
            gridRoutes.on(".dgrid-row:click", dojo.hitch(this, onRoutesGridRowClick ));

            //add layer for breaks
            lyrOrdersBreaks = new esri.layers.GraphicsLayer({
                id: 'lyrOrdersBreaks'
            });
            map.addLayer(lyrOrdersBreaks);   


            //popup for Orders
            var popupTemplate = new esri.dijit.PopupTemplate({
                title: "{Name}",
                fieldInfos: [
                    {fieldName: "RouteName", visible: true, label:"Route"},
                    {fieldName: "Status", visible:true, label:"Status" },
                    {fieldName: "FormattedPriority", visible:true, label:"Priority" }
                ],
                showAttachments:false
            });

            //init orders layer
            var oUrl = dojo.string.substitute(config.Orders.url, [config.Host]);
            lyrOrders = new esri.layers.FeatureLayer(oUrl, {
                id: 'lyrOrders',
                mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
                infoTemplate: popupTemplate,
                outFields: ['*']
            });

            ordersConnect = con.connect(lyrOrders, 'onUpdateEnd', dojo.hitch(this, initOrders));

            con.connect(lyrOrders, 'onClick', function (evt) {
                map.infoWindow.setFeatures([evt.graphic]);
            });

            var dte = new Date();
            var millis;
            millis = dte.setUTCHours(0);
            millis = dte.setUTCMinutes(0);
            millis = dte.setUTCSeconds(0);
            millis = dte.setUTCMilliseconds(0);
            
            lyrOrders.setDefinitionExpression("DeviceID IN (" + config.Devices.deviceIDs.join(',') + ") AND PlannedDate = " + millis + " AND Deleted = 0"); // AND Type <> 2 ");
            
            map.addLayer(lyrOrders);

            //init order highlight layer
            lyrOrdersHighlight = new esri.layers.GraphicsLayer({
                id: 'lyrOrdersHighlight'
            });
            map.addLayer(lyrOrdersHighlight);

            //add text symbol layer
            lyrTextSymbols = new esri.layers.GraphicsLayer({
                id: 'lyrTextSymbols'
            });
            con.connect(lyrTextSymbols, 'onClick', dojo.hitch(this, onTextSymbolLayerClick));

            map.addLayer(lyrTextSymbols);

            //add device layer for tracking
            lyrDevices = new esri.layers.GraphicsLayer({
                id: 'lyrDevices'
            });

            map.addLayer(lyrDevices);

            checkForSimulationRealWorld();

        }
    );
}

function onTextSymbolLayerClick(evt) {
    var graphic = evt.graphic;
    if (graphic) {
        var orderGraphic;
        dojo.forEach(lyrOrders.graphics,
            function (g) {
                if (g.geometry.x === graphic.geometry.x && (g.attributes.Type !== 2) ) {
                    orderGraphic = g;
                }
            },
            this
        );

        if (orderGraphic) {
            console.log(orderGraphic);
            map.infoWindow.setFeatures([orderGraphic]);
            map.infoWindow.show(orderGraphic.geometry, map.getInfoWindowAnchor(map.toScreen(orderGraphic.geometry)));
        }
    }
}

function initOrders(OnDemandGrid, Keyboard, Selection, ColumnHider, ColumnResizer, DijitRegistry, Memory, declare) {
    //setup datagrid for Orders
    //Address, Name, route, status, sequence, service time, type, priority

    require(
        ["dojo/_base/declare", "dojo/_base/connect", "dgrid/OnDemandGrid", "dgrid/Grid", "dgrid/Keyboard", "dgrid/Selection","dgrid/extensions/ColumnHider", "dgrid/extensions/ColumnResizer", "dgrid/extensions/DijitRegistry", "dojo/store/Memory"],
        function (declare, con, OnDemandGrid, Grid, Keyboard, Selection, ColumnHider, ColumnResizer, DijitRegistry, Memory) {

            dojo.disconnect(ordersConnect);

            var data = [],
                sequenceCounter = 0;
            dojo.forEach(lyrOrders.graphics,
                function (graphic, index) {
                    var atts = graphic.attributes;
                    var rawAddress = dojo.fromJson(atts.Address);
                    var address = '';
                    if (rawAddress.length > 0) {
                        address = rawAddress[0].value;
                    }
                    var route = getRouteNameByDeviceID(atts.DeviceID);
                    var color = getRouteColor(route);
                    var orderType = (atts.OrderType === 0) ? 'Pickup' : 'Delivery';
                    var type = atts.Type;
                    var priority = (atts.Priority === 0) ? 'High' : 'Normal';

                    atts.Color = color;
                    atts.RouteName = route;
                    atts.FormattedAddress = address;
                    atts.Status = (atts.Type == 1) ? 'Waiting' : '';
                    atts.FormattedOrderType = orderType;
                    atts.FormattedPriority = priority;
                    atts.OrderedSequence = (type == 1) ? ++sequenceCounter : '';

                    data.push({
                        id: atts.OBJECTID,
                        route: route,
                        color: color,
                        address: address,
                        name: atts.Name,
                        status: atts.Status,
                        sequence: atts.OrderedSequence, //atts.SequenceNumber,
                        serviceTime: atts.ServiceTime,
                        orderType: orderType,
                        type: type,
                        priority: priority,
                        graphic: graphic
                    });

                    setOrderSymbol(graphic);
                },
                this
            );
            
            var memoryStore = new Memory({
                data: data
            });

            gridOrders = new declare([OnDemandGrid, Keyboard, Selection, ColumnHider, ColumnResizer,  DijitRegistry])({
                columns: {
                    id: {
                        label: "ID",
                        hidden: true
                    },
                    route: {
                        label: "Route Name"
                    }
                    ,sequence: {
                        label: "Sequence",
                        width: '10px'
                    },
                    status: {
                        label: "Status"
                    },
                    name: {
                        label: "Name"
                    },
                    address: {
                        label: "Address"
                    },
                    orderType: {
                        label: "Order Type"
                    },
                    priority: {
                        label: "Priority"
                    },
                    serviceTime: {
                        label: "Service Time"
                    }
                },
                store: memoryStore
            }, "gridOrders");

            //call startup because it's not initially visible
            gridOrders.startup();

            gridOrders.on(".dgrid-row:click", dojo.hitch(this, onOrdersGridRowClick ));

            var extents = [];
            dojo.forEach(lyrRoutes.graphics,
                function (graphic) {
                    if (graphic.geometry) {
                        extents.push(graphic);
                    }
                }
            );
            
            if (extents.length > 0) {
                var ex =  esri.graphicsExtent(extents);
                map.setExtent(ex, true);
            }

            // below method doesn't sort on 2nd attribute, only first
            // gridOrders.set('query',{}, { sort: [{attribute:'route', descending: false}, {attribute:'sequence', descending: false}] });

            initAlerts();

    });
}

function initAlerts(OnDemandGrid, Keyboard, Selection, ColumnHider, ColumnResizer, DijitRegistry, Memory, declare) {
    //setup datagrid for Alerts

    require(
        ["dojo/_base/declare", "dojo/_base/connect", "dgrid/OnDemandGrid", "dgrid/Grid", "dgrid/Keyboard", "dgrid/Selection","dgrid/extensions/ColumnHider", "dgrid/extensions/ColumnResizer", "dgrid/extensions/DijitRegistry", "dojo/store/Memory"],
        function (declare, con, OnDemandGrid, Grid, Keyboard, Selection, ColumnHider, ColumnResizer, DijitRegistry, Memory) {

            var memoryStore = new Memory({
                data: []
            });

            gridAlerts = new declare([OnDemandGrid, Keyboard, Selection, ColumnHider, ColumnResizer,  DijitRegistry])({
                columns: {
                    id: {
                        label: "ID",
                        hidden: true
                    },
                    route: {
                        label: "Route Name"
                    },
                    type: {
                        label: "Alert Type"
                    },
                    description: {
                        label: "Description"
                    }
                },
                store: memoryStore
            }, "gridAlerts");

            //call startup because it's not initially visible
            gridAlerts.startup();

        }
    );
}

function addAlert(alert) {
    gridAlerts.store.put(alert);
    gridAlerts.refresh();

    alertCounter += 1;

    updateAlertsCounter();
}

function updateAlertsCounter() {
    var label = 'Alerts';

    if (alertCounter > 0) {
        label += ' - <span style="color:red;display:inline-block;min-height:21px;">' + alertCounter + '</span>';
    }

    var el = dojo.query('#tabContainer_tablist_tbAlerts .tabLabel')[0]; 
    el.innerHTML = label;
}

function setOrderSymbol(graphic) {
    var symbol = new esri.symbol.SimpleMarkerSymbol();
    var txtGraphic, txtSymbol, txtFont;


    switch (graphic.attributes.Type) {
        case 0:
            // Start Depot
            symbol
                .setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE)
                .setSize(18)
                .setColor(new dojo.Color('green'))
                .setOutline(new esri.symbol.SimpleLineSymbol().setColor(graphic.attributes.Color).setWidth(2));

            txtFont = new esri.symbol.Font();
            txtFont.setWeight(esri.symbol.Font.WEIGHT_BOLD);
            
            txtSymbol = new esri.symbol.TextSymbol('S');
            txtSymbol.setOffset(0, -4);
            txtSymbol.setFont(txtFont);

            txtGraphic = new esri.Graphic(graphic.geometry, txtSymbol);
            
            lyrTextSymbols.add(txtGraphic);

            graphic.setSymbol(symbol);
            break;
        case 1:
            // Order
            symbol
                .setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE)
                .setSize(18)
                .setColor(new dojo.Color('white'))
                .setOutline(new esri.symbol.SimpleLineSymbol().setColor(graphic.attributes.Color).setWidth(2));

            txtFont = new esri.symbol.Font();
            txtFont.setWeight(esri.symbol.Font.WEIGHT_BOLD);
            
            txtSymbol = new esri.symbol.TextSymbol(graphic.attributes.OrderedSequence);
            txtSymbol.setOffset(0, -4);
            txtSymbol.setFont(txtFont);

            txtGraphic = new esri.Graphic(graphic.geometry, txtSymbol);
            
            lyrTextSymbols.add(txtGraphic);

            graphic.setSymbol(symbol);
            var shp = graphic.getDojoShape();
			if (shp) {
				shp.moveToFront();
			}
            break;
        case 2:
            // Break
            // var backSym = new esri.symbol.SimpleMarkerSymbol()
            //     .setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE)
            //     .setSize(14)
            //     .setColor(new dojo.Color('white'))
            //     .setOffset(12, -1)
            //     .setOutline(new esri.symbol.SimpleLineSymbol().setColor(new dojo.Color('blue')).setWidth(2));

            // var backGraphic = new esri.Graphic(graphic.geometry, backSym);
            // lyrOrdersBreaks.add(backGraphic);

            // txtFont = new esri.symbol.Font();
            // txtFont.setWeight(esri.symbol.Font.WEIGHT_BOLD);
            // txtFont.setSize('8pt');
            // txtFont.setFamily('Arial');
            
            // txtSymbol = new esri.symbol.TextSymbol('B');
            // txtSymbol.setOffset(14, -4);
            // txtSymbol.setFont(txtFont);
            // txtSymbol.setColor(new dojo.Color('blue'));

            // txtGraphic = new esri.Graphic(graphic.geometry, txtSymbol);

            // lyrOrdersBreaks.add(txtGraphic);

            graphic.hide();

            break;
        case 3:
            // Renewal Location
            graphic.hide();
            break;
        case 4:
            // Finish Location
            symbol
                .setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE)
                .setSize(18)
                .setColor(new dojo.Color('end'))
                .setOutline(new esri.symbol.SimpleLineSymbol().setColor(graphic.attributes.Color).setWidth(2));

            txtFont = new esri.symbol.Font();
            txtFont.setWeight(esri.symbol.Font.WEIGHT_BOLD);
            
            txtSymbol = new esri.symbol.TextSymbol('E');
            txtSymbol.setOffset(0, -4);
            txtSymbol.setFont(txtFont);

            txtGraphic = new esri.Graphic(graphic.geometry, txtSymbol);
            
            lyrTextSymbols.add(txtGraphic);

            graphic.setSymbol(symbol);
			var shp = graphic.getDojoShape();
			if (shp) {
				shp.moveToBack();
			}
            break;
    }
    


}

function getRouteNameByDeviceID(id) {
    var routeName = 'unknown';
    dojo.forEach(lyrRoutes.graphics,
        function (graphic) {
            if (graphic.attributes.DeviceID === id) {
                routeName = graphic.attributes.Name;
            }
        }
    );
    return routeName;
}

function getRouteColor(routeName) {
    var color;
    dojo.forEach(lyrRoutes.graphics,
        function (graphic) {
            if (graphic.attributes.Name === routeName) {
                color = new dojo.Color( dojo.fromJson(graphic.attributes.Color).color );
            }
        },
        this
    );
    return color;
}

function onRoutesGridRowClick(evt) {
    var row = gridRoutes.row(evt);
    var graphic = row.data.graphic;
    if (graphic) {
        var extent = graphic.geometry.getExtent();
        zoomToExtentAndExpand(extent);
    }
}

function onOrdersGridRowClick(evt) {
    var row = gridOrders.row(evt);
    var graphic = row.data.graphic;
    if (graphic) {
        var point = graphic.geometry;
        map.centerAt(point);

        highlightOrderGraphicOnMap(graphic);
    } 
}

function zoomToExtentAndExpand(extent, expandFactor) {
    if (expandFactor) {
        extent = extent.expand(expandFactor);
    }
    map.setExtent(extent, true);
}

function highlightOrderGraphicOnMap(graphic) {
    var symbol = new esri.symbol.SimpleMarkerSymbol().setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE).setColor(new dojo.Color('yellow'));
    var hGraphic = new esri.Graphic(graphic.geometry, symbol);
    lyrOrdersHighlight.clear();
    lyrOrdersHighlight.add(hGraphic);
}

