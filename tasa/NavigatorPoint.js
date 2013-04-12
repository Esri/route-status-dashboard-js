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
		declare('NavigatorPoint', esri.geometry.Point , {
			
			bearing: NaN,
			bearingTol: 15,
			navLatency: 0,

			constructor: function (args) {
				declare.safeMixin(this, args);
				
				// if (args.mapPoint !== null) {
				// 	this.inherited(arguments);
				// }
				
				// this.bearing = args.bearing ? args.bearing : this.bearing;
				// this.bearingTol = args.bearingTol ? args.bearingTol : this.bearingTol;
				// this.navLatency = args.navLatency ? args.navLatency : this.navLatency;
			},

			getBearing: function() {
				if (isNaN(this.bearing)) {
					return null;
				} else {
					return this.bearing;
				}
			},

			getBearingTol: function() {
				if (isNaN(this.bearingTol)) {
					return null;
				} else {
					return this.bearingTol;
				}
			},

			getNavLatency: function() {
				if (isNaN(this.navLatency)) {
					return null;
				} else {
					return this.navLatency;
				}
			}

		});
	}
);