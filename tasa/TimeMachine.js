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

require(['dojo/_base/declare'],
	function (declare) {
		declare('TimeMachine', null , {

			_previousRequestAt : null,
			_currentTime : NaN,

			currentTimeUTCString : '',
			metabolicRate: 0,
			_userDefinedMetabolicRate: 6,
			_paused: true,

			constructor: function (startTime) {
				var me = this;

				me._currentTime = startTime;
				me._previousRequestAt = new Date();
				me.getCurrentTime();
			},

			getCurrentTime: function () {
				var me = this;
				var now = new Date();
				me._currentTime += me.metabolicRate * (now.getTime() - me._previousRequestAt.getTime());
				me.currentTimeUTCString = me.millisecondsToUTCTime(me._currentTime);
				me._previousRequestAt = now;

				return me._currentTime;
			},

			getCurrentTimeAsDate: function() {
	            var ms = getCurrentTime();
	            var d = new Date();
	            d.setTime(ms);
	            return d;
	        },

			millisecondsToUTCTime: function (ms) {
				var me = this;
				if (isNaN(ms)) {
					return '';
				}

				var d = new Date();
				d.setTime(ms);

				return me.ddFormatter(d.getUTCHours()) + ':' + 
					   me.ddFormatter(d.getUTCMinutes()) + ':' +
					   me.ddFormatter(d.getUTCSeconds());

			},

			ddFormatter: function (value) {
	            var s = "0" + value.toString(); 
	            return s.substr(s.length - 2);
	        },

	        toRealTimeSpeed: function() {
	        	var me = this;
	            if (!me.isPaused()) {
	                if (me.metabolicRate > 1)
	                    me._userDefinedMetabolicRate = me.metabolicRate;
	                me.metabolicRate = 1;
	            }
	        },

	        toUserDefinedSpeed: function() {
	            var me = this;
	            if (!me.isPaused()) {
	                me.metabolicRate = me._userDefinedMetabolicRate;
	            }
	        },

	        setMetabolicRate: function (newRate) {
	            var me = this;
	            me.metabolicRate = newRate;
	            if (newRate > 0) {
	                me._userDefineMetabolicRate = newRate;
	            }
	            me._paused = newRate == 0;
	        },

	        pause: function(makePaused) {
	            var me = this;
	            if (makePaused){
	                if (!me.isPaused()) {
	                    me._userDefinedMetabolicRate = me.metabolicRate;
	                }
	                me.metabolicRate = 0;
	            }else {
	                me.metabolicRate = me._userDefinedMetabolicRate;
	            }
	            me._paused = makePaused;
	        },

	        isPaused: function() {
	            return this._paused;
	        }
          
		});
	}
);