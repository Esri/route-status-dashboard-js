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

require(['dojo/_base/declare', 'esri/Map'],
	function (declare, Map) {
		declare('VehicleCommunicationSubsystem', null, {
			
			_directionsPool: {},
			_eventQueuePool: {},

			// constructor: function(args) {
			// 	dojo.safeMixin(this, args);
			// },

			sendDirectionsToVehicle: function (routeName, directions) {

				//START - added
				if (directions == null) {
					return;
				}
				//EMD - added

				var me = this;

				me._directionsPool[routeName] = directions;
				if (directions !== null) {
					me._directionsPool[routeName + '_polylineLengths'] = {};

					var eventQueue = new EventQueue();
					me._eventQueuePool[routeName] = eventQueue;

					if (eventQueue !== null) {
						eventQueue._eventsBefore.setTime(directions.features[0].attributes.ETA - 1);
					}
				}
			},

			getRecentVehiclePosition: function (routeName, date) {
				var me = this;
				var dMs = date.getTime();
				var directions = me._directionsPool[routeName];
				var vehicle = VC.getByName(routeName);
				var outNextStopETA = [];

				var outEventQueue = new EventQueue();

				if (directions == null) {
					console.log('directions are null');
					return { location: new NavigatorPoint(vehicle.geometry), routeFinished: true };
				}

				// var eventQueue = new EventQueue();
				// me._eventQueuePool[routeName] = eventQueue;

				var eventQueue = me._eventQueuePool[routeName];
				if (eventQueue == null) {
					eventQueue = new EventQueue();
					me._eventQueuePool[routeName] = eventQueue;
				}
				
				eventQueue.clear();

			
				//collecting all the events of visiting stops -- OLD
				var direction;
				var polyline;
				var etaFrom; // = directions.features[0].attributes.ETA;
				var etaTo = directions.features[0].attributes.ETA;
				var eventsAfter = eventQueue._eventsBefore.getTime();
				var directionsCount = directions.features.length;
				var i = 0;
				for (i; i < directionsCount; i ++) {
					direction = directions.features[i];
					polyline = direction.geometry;
					etaFrom = etaTo;

					if (i < directionsCount -1) {
						etaTo = directions.features[i+1].attributes.ETA;
						if (
							// etaTo > eventsAfter && etaTo <= dMs
							directions.features[i].attributes.ETA > eventsAfter && directions.features[i].attributes.ETA <= dMs
							&& ( direction.attributes.maneuverType == 'esriDMTStop' ||
								 direction.attributes.maneuverType == 'esriDMTDepart' 
							   )
							) {
								console.log(direction.attributes.maneuverType + '  ::  ' + direction.attributes.text);
								eventQueue.addEvent(direction.attributes.maneuverType, direction.attributes.text);
							}
	
					} else {
						if (etaTo > eventsAfter && etaTo <= dMs) {
							
							etaTo = direction.attributes.ETA + me.getDirectionServiceTimeMs(direction);
							etaFrom = etaTo;

							if (etaTo <= dMs) {
								console.log('adding depart :: hardcoded');
								eventQueue.addEvent('esriDMTDepart', direction.attributes.text);

								if (direction.attributes.text.indexOf('Order #') > -1) {
									console.log('something!');
									vehicle.attributes.RouteDirections = me.recalculateDirectionETAs(dMs, vehicle.attributes.RouteDirections);
									me.sendDirectionsToVehicle(routeName, vehicle.attributes.RouteDirections);
								} else {
									me._directionsPool[routeName] = null;
								}
							}
						}
					}

					if (dMs < etaTo && polyline.paths[0].length > 0) {

						for (var j = i; j < directionsCount; j++) {
							if (directions.features[j].attributes.maneuverType == 'esriDMTStop') {
								outNextStopETA[0] = directions.features[j].attributes.ETA - dMs;
								break;
							} else if (directions.features[j].attributes.maneuverType == 'esriDMTDepart') {
								outNextStopETA[0] = 0;
							}
						}

						break;
					}
				}

				eventQueue._eventsBefore = date;
				if (outEventQueue !== null) {
					outEventQueue.events = eventQueue.events;
				}

				var result;
				if (etaFrom == etaTo) {
					result = new NavigatorPoint(polyline.getPoint(0,0));
				} else {
					var polyLineLength;
					if (me._directionsPool[routeName + '_polylineLengths'][i] == null) {
						polyLineLength = me.traversePolyline(polyline, -1, null).length;
						me._directionsPool[routeName + '_polylineLengths'][i] = polyLineLength;
					} else {
						polyLineLength = me._directionsPool[routeName + "_polylineLengths"][i];
					}

					var traverseToPosAlong = Math.max(0, dMs - etaFrom) / (etaTo - etaFrom);
					result = new NavigatorPoint();
					result = me.traversePolyline(polyline, polyLineLength * traverseToPosAlong, result).result;
				}

				return { location: result, routeFinished: false, eventQueue: outEventQueue, outNextStopETA: outNextStopETA };

			},

			traversePolyline: function (polyline, lengthToTraverse, outStopPoint) {
				var me = this;
				var traversedLength = 0;
				for (var i=0; i < polyline.paths.length; i ++) {
					var p1 = polyline.getPoint(i,0);
					var p2 = polyline.getPoint(i,0);
					var isDone = false;
					for (var j = 1; j < polyline.paths[i].length; j++) {
						p1 = p2;
						p2 = polyline.getPoint(i, j);
						var delta = me.euclidianDistance(p1, p2);

						if (delta > 0 && outStopPoint !== null) {
							outStopPoint.bearing = 180 / Math.PI * Math.atan2(p1.x - p2.x, p1.y - p2.y) + 180;
						}

						if (lengthToTraverse > -1 && lengthToTraverse <= traversedLength + delta) {
	                        var interpolateToPosition = lengthToTraverse - traversedLength;
	                        outStopPoint.x = p1.x + interpolateToPosition * (p2.x - p1.x) / (delta == 0 ? 1 : delta);
	                        outStopPoint.y = p1.y + interpolateToPosition * (p2.y - p1.y) / (delta == 0 ? 1 : delta);
	                        traversedLength += interpolateToPosition;
	                        isDone = true;
	                        break;
	                    } else {
	                        traversedLength += delta;
	                        if (
	                               i == polyline.paths.length - 1 
	                            && j == polyline.paths[i].length - 1
	                            && outStopPoint != null
	                        ){
	                            outStopPoint.x = p2.x;
	                            outStopPoint.y = p2.y;
	                        }
	                    }
					}
					if (isDone) {
						break;
					}
				}
				return {
					length: traversedLength,
					result: outStopPoint
				};
			},

			getDirectionServiceTimeMs: function (direction) {
				return direction.attributes.time * 60 * 1000;
			},

			recalculateDirectionETAs: function (eta, directions) {
            	if (directions != null) {
	                for (var i = 0; i < directions.features.length; i++){
	                    directions.features[i].attributes.ETA = eta;
	                    eta += Math.round(directions.features[i].attributes.time * 60 * 1000);
	                } 
	            }
	            return directions;            
	        },

	        euclidianDistance: function (p1, p2) {
            	return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));    
            }        
        
		});
	}
);