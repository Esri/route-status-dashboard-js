# route-status-dashboard-js

The Route Status Dashboard allows you track vehicle positions on a map, receive status updates relating to stops/orders, and monitor pre-defined alerts associated with each route.

![App](https://raw.github.com/Esri/route-status-dashboard-js/master/RouteStatusDashboard.png)

## Features

The Route Status Dashboard allows you track vehicle positions on a map, receive status updates relating to stops/orders, and monitor pre-defined alerts associated with each route.

The Route Status Dashboard:
* Uses ArcGIS.com services for mapping.
* Uses ArcGIS.com feature services for storing routes, stops, positions, and order status.
* Works with a routing and scheduling application such as [Route Planner] (https://github.com/Esri/route-planner-csharp). 

## Instructions

1. Download the files.
2. Copy the "tasa" folder to your webserver root directory. For IIS, ''c:\inetpub\wwwroot\tasa\''.
3. For Windows, verify that both folders are not encrypted.  Right click on each folder and go to Properties -> Advanced and uncheck the 'Encrypt contents to secure data'.
4. Place the necessary proxy files needed for the Dashboard application.
    * [IIS] 'proxy.ashx' & 'proxy.config'.
    * [PHP] For PHP setup, please reference the Esri JavaScript API Resource Center, Working with ArcGIS Server Services, Using the Proxy Page.
    
Also see [TransportationAnalytics_Context.md]( https://raw.github.com/Esri/route-status-dashboard-js/master/TransportationAnalytics_Context.md) for detailed instructions for setting up Route Planner for creating routes, configuring the ArcGIS.com feature service, and this dashboard sample application. 

WorkforceManagement.zip includes files useful for creating/publishing the ArcGIS.com feature service.

## Configuration

Configure the proxy page for use according to your webserver environment.

#### IIS
* Open “proxy.config” in a text editor
    * Add a “serverUrl” XML node that will reference your instance of ArcGIS Server that contains your Workforce Management services.

```xml
    <serverUrl url=”http://localhost/arcgis/rest/services” matchAll=”true” />
```
* Open “tasa/config.js” in a text editor
    * Change the “Host” parameter to the machine name of the ArcGIS Server hosting the Workforce Management services
    * Verify the references to the layer indices are correct so that each layer index points to the correct REST endpoint of your ArcGIS Server hosting the Workforce Management services
    * [Optional. See Note Below] Locate the “deviceIDs” key and enter in the Mobile Device ID(s) you wish to track. Multiple IDs can be specified separated by commas. Ex. “[1234, 5678]”.
    * Refer to the comments in config.js to make any additional changes 

![Config](https://raw.github.com/Esri/route-status-dashboard-js/master/RouteStatusDashboardConfig.png)

* Open “tasa/app.js”
        * Locate the line of code (usually around Line #30) that references the proxy.ashx page and verify it is pointing to your local proxy page. For example (IIS) esri.config.defaults.proxyUrl = ../proxy.ashx.

* The Dashboard application can be loaded in a web browser (i.e. http://localhost/tasa/dashboard.html).

## Notes

* The tasa/index.html page is included as a quick way to load multiple routes and simulate their movement using an In-App Simulator.  This is an optional step that eases the loading of specific routes by reading directly from the Workforce Management services to retrieve work for mobile devices.
   
## Requirements

* [Esri Javascript API version 3.0](http://help.arcgis.com/en/webapi/javascript/arcgis/index.html)
* Dojo dGrid
    * [Automatic download with CPM]( https://github.com/SitePen/dgrid#automatic-download-with-cpm) 
    * [Inline Javascript Manual Setup]( https://github.com/SitePen/dgrid#manual-download)
    * [Home Page](http://dojofoundation.org/packages/dgrid/)
    * [Project Page (GitHub)](https://github.com/SitePen/dgrid)
    * [Samples](http://sitepen.github.com/dgrid/dgrid/test/)
    * [SitePen Blog Post](http://www.sitepen.com/blog/2012/04/24/dgrid-getting-down-to-the-nitty-griddy/)

## Resources

* [Route Planner](https://github.com/Esri/route-planner-csharp)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)
* [twitter@esri](http://twitter.com/esri)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Anyone and everyone is welcome to contribute. 

## Licensing

Copyright 2013 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt]( https://raw.github.com/Esri/route-status-dashboard-js/master/license.txt) file.

[](Esri Tags: Route Status Dashboard Route Planner ArcLogistics)
[](Esri Language: JavaScript)
