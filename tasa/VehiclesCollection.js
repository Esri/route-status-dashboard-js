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

require(['dojo/_base/declare','esri/Map', 'esri/Graphic'],
	function (declare, Map, Graphic) {
		declare('VehiclesCollection', null , {
			
			constructor: function () {
				this.VEHICLE_STATUS_EN_ROUTE = 'In Transit';
				this.VEHICLE_STATUS_SERVICING_STOP = 'Servicing Stop';
				this.VEHICLE_STATUS_ROUTE_COMPLETED = 'Route Completed';
				this.VEHICLE_STATUS_IDLE = 'Idle';

				this.vehicles = [
					// new esri.Graphic(null, null,
					// 	{
					// 		id: oid,
					// 		RouteName : 'Test Route',
					// 		STATUS: this.VEHICLE_STATUS_IDLE
					// 	},
					// 	null
					// )
				];
			},

			routeFinishedCount: 0,

			init: function() {
				// var me = this;
				// dojo.forEach(me.vehicles,
				// 	function (vehicle) {
				// 		vehicle.setSymbol(
				// 			new esri.symbol.SimpleMarkerSymbol().setColor( new dojo.Color('blue') )
				// 		);
				// 		vehicle.setGeometry(
				// 			new esri.geometry.Point(0,0, new esri.SpatialReference(102100))
				// 		);
				// 	},
				// 	this
				// );
			},

			addVehicle: function (oid, routeName, driver, vehicle) {
				var graphic = new esri.Graphic(
					new esri.geometry.Point(0,0, new esri.SpatialReference(102100)), 
					new esri.symbol.PictureMarkerSymbol('./images/GpsDisplay.png', 16, 16),
					{
						id: oid,
						DeviceID: oid,
						RouteName: routeName,
						Status: this.VEHICLE_STATUS_IDLE,
						Driver: driver,
						Vehicle: vehicle
					},
					{}
				);
				
				this.vehicles.push(graphic);

				return graphic;
			},

			getByName: function (routeName) {
				var retV,
					me = this;

				dojo.forEach(me.vehicles,
					function (vehicle) {
						if (vehicle.attributes['RouteName'] === routeName) {
							retV = vehicle;
						}
					}
				); 
				return retV;
			}
		});
	}
);