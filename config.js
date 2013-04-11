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

/*
** Host
** string that refers to the server containing your ArcGIS for Transportation Analytics services
*/

/*
** RouteService
** string that refers to the Routing Service used in the application
*/

/*
** Initial Extent
** json object that contains the information needed to construct a new Extent (esri.geometry.Extent)
*/

/*
** Orders
** json object with key:
** "url" - value is a string that points to the Orders (Stops) layer in your feature service
*/

/*
** Routes
** json object with keys:
** "url" - value is a string that points to the Routes layer in your feature service
** "symbolWidth" - value is an integer that will be used as the width parameter in creating the Route line graphic for display purposes
*/

/*
** Devices
** json object with keys:
** "url" - value is a string that points to the Devices layer in your feature service
** "deviceIDs" - value is an array that contains one or more mobile device ids used to track using the dashboard
*/

/*
** Events
** json object with key:
** "url" - value is a string that points to the Events layer in your feature service
*/

/*
** Simulator
** json object with key:
** "Alerts" - value is a json object with key
**      	---> "ApproachingStopThreshold" - value is an integer (representing minutes) that is used to fire off alerts in the sample dashboard.  Example: a value of 2 will send alerts when a vehicle is within 2 minutes of a destination
*/

var config = {
	"Host" : "tadev.arcgisonline.com",
	"RouteService" : "http://tadev.arcgisonline.com/arcgis/rest/services/Route/NAServer/Route_NorthAmerica",
	"InitialExtent": {
		"xmin":-9764325.826454915,
		"ymin":5135502.823315015,
		"xmax":-9744050.904702298,
		"ymax":5146605.301673422,
		"spatialReference":{ 
			"wkid":102100
		}
	},
	"Orders" : { 
		"url": "http://${0}/arcgis/rest/services/WorkforceManagement/FeatureServer/2"
	},
	"Routes" : {
		"url" : "http://${0}/arcgis/rest/services/WorkforceManagement/FeatureServer/4",
		"symbolWidth" : 4
	},
	"Devices" : {
		"url" : "http://${0}/arcgis/rest/services/WorkforceManagement/FeatureServer/0",
		"deviceIDs" : [
			2802
		]
	},
	"Events" : {
		"url" : "http://${0}/arcgis/rest/services/WorkforceManagement/FeatureServer/6"
	},
	"Simulator" : {
		"Alerts" : {
			"ApproachingStopThreshold" : 2
		}
	}
};







