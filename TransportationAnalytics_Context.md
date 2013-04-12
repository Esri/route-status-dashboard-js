# ArcGIS for Transportation Analytics

[ArcGIS for Transportation Analytics](http://www.esri.com/software/arcgis/arcgis-for-transportation-analytics) helps you minimize the costs associated with operating a fleet of vehicles. At it's core, value comes from using ArcGIS for Server to host Routing, Vehicle Routing Problem, Geocode and Feature services published from ArcGIS for Desktop using NAVTEQ data specific to your region. Also, all licensing is included for using NAVTEQ data for in routing, optimization, and navigation tasks.

Additionally, the ArcGIS for Transportation Analytics bundle includes a few sample applications which you may choose to use.

The [Route Planner](https://github.com/Esri/route-planner-csharp) is a lightweight desktop sample application that plans and optimizes work for your fleet.

The Status Dashboard is a web application built using HTML5 web standards which tracks fleet vehicle locations and order status updates.

The iOS Navigator is an Apple Xcode project containing source code which you can compile and deploy on your own iOS devices for in-vehicle navigation.

Note that these applications are provided as samples to help get you up and running or to be extended with plug-in's or source code modification to meet the needs of your organization. They are not intended as a complete and ready to implement solution.

After installing and setting up services and sample or custom applications, you provide orders, which are locations or addresses to visit; characteristics of vehicles in you fleet; and other related information. In return, you receive the following:

* An optimized routing plan for the entire fleet
* Optimized routes for individual vehicles
* Optional turn-by-turn driving directions and voice guidance for drivers via on-board electronic devices, including smart phones
* An overview of the routing plan through the dashboard app, which also provides other optional, high-level views, including the following:
    * status of planned orders (Planned, Finished, Could not service)
    * where your vehicles are located currently
    * the fleet's actual progress towards completing the routing plan

### Setting up ArcGIS for Transportation Analytics

Before you can start optimizing your operations with ArcGIS for Transportation Analytics, you need to install software, set up data, and create web services. Optionally, you can also configure the supplied sample applications. Much of the documentation is focused on guiding you through these preliminary steps.

The following subsections in this topic list and briefly describe all the components you can configure for use with Transportation Analytics. They are described in more detail throughout the rest of the documentation and you will also learn how to configure them.

The list below is comprehensive, but not all components are required. You can use the most basic ArcGIS for Transportation Analytics functionality by configuring only a route, VRP, and geocode service and then integrating with other databases and applications in your organization.

If you require an application to import orders and optimize your fleet, install Route Planner and configure to reference your services. You can take full advantage of ArcGIS for Transportation Analytics's capabilities by configuring all of the items listed below.

#### Basic Setup

After performing these steps you'll have VRP, Route, and locator services hosted on your own ArcGIS Server and, optionally, the Route Planner sample application configured to use these services in optimal route calculation for your fleet. 

Install ArcGIS for Desktop and Server, see installation instructions included with the setups you downloaded. 
Setup File Geodatabase network and locator data for publishing VRP & Route Services. See the Data Setup topics for details.
Publish VRP, Route, and Geocode services. See the Service publishing topics for details.
Configure the Route Planner sample app. See the Route Planner installation and configuration topic for details.

#### Status Dashboard Setup

After performing these steps, you'll be able to push your routing schedules to a Feature service hosted on your ArcGIS server and monitor the status of work being done. Please note, you'll need to purchase the Navigation add-on or build your own field applications to send status updates and update vehicle location to the dashboard.


Install an RDBMS. This guide uses Microsoft SQL Server 2008 R2. 
Setup an Enterprise database. See the Enterprise database Setup topic for details.
Publish a feature service where Route Planner will send your route schedules. See the Feature service Setup topic.
Deploy and configure the Status Dashboard sample app. See the Status Dashboard topic.

#### Navigation Add-On

If you've purchased the Navigation add-on, you'll be able to push your work schedules to drivers in the field with Windows devices. They'll get voice guided turn by turn directions and will be able to update the status of each work order as they service it. The status dashboard user will be able to view these order status updates as well as view the current location of drivers in the field. Note that the iOS Navigator sample can be used for the same purpose.


Install and configure the Windows Navigator on a tablet PC or laptop with a GPS chip. See the Navigator installation and configuration topic. 
Obtain, build, and deploy the iOS Navigator. See the iOS Navigator topic for details and note you'll need to compile and deploy this from your own Apple Enterprise developer account.

#### Traffic Add-On

If you've purchased the traffic add-on, you'll be able to visual and use real time traffic in your routing.


If you haven't already done so, setup your Enterprise database. See the traffic feed setup topic . 
Publish traffic services. See the traffic service publishing topic.

Configure sample applications to use traffic services. See the applicable application configuration topics.

### Components of the Transportion Analytics Bundle

The following are short descriptions of the individual components that comprise the Transportation Analytics bundle

#### ArcGIS for Desktop

ArcGIS for Desktop is supplied to edit your geographic and street data as well as publish services to your ArcGIS server. For installation instructions, please see the Install.htm supplied with the installation package.

#### ArcGIS for Server 

ArcGIS for Server will host and serve your VRP, Route, and feature services. These are the services that will optimize your work, route vehicles, and communicate the information between the sample applications including the Route Planner, Status dashboard, and Navigator applications. For installation instructions, please see the Install.htm supplied with the ArcGIS Server installation package. See the Services configuration topics for detailed instructions concerning the publishing and hosting of these services.

#### Route Planner Sample (Optional)

The Route Planner is a sample application used to optimally assign work to vehicles and manage your fleet. You can configure it to use your hosted services right out of the box or you can extend it using the included Plug-In SDK.

#### Status Dashboard Sample (Optional)

The status dashboard is a web application that can be used to monitor the status of a fleet of vehicles working for the day. It shows current vehicle location on the map and updates order statuses based on driver entries from field navigation devices.

#### Route Planner Plug-in Package

The Route Planner comes with a documented plug-in package including OMD's, and example plug-in's. Plug-in's are intended to extend functionality of Route Planner in terms of data input/output. For more in-depth functionality changes, source code for the Route Planner along with instructions to build the project in Visual Studio may be available.

#### Navigator for Windows (Add-On)

The Navigator provides turn by turn guidance to your drivers. It also updates order status and raises exceptions which can be seen in the Status Dashboard. This sample application is for use on Windows platforms (XP, Vista, 7).

Provide the Navigator_Quick_Start document to your drivers.
Please take notice of safety disclaimers in this document.

#### Navigator Sample for iPhone (Optional)

The Navigator for iPhone provides guidance to your drivers and runs on the iOS platform. It also updates order status and raises exceptions which can be seen in the Status Dashboard. Per Apple's guidelines, this application is not available through any store. You'll need to obtain your own Enterprise developer license from Apple and compile and deploy the application yourself. Please the iOS Navigator topic for more details.

#### RDBMS such as Microsoft SQL Server Standard

An enterprise geodatabase in a RDBMS is required for hosting feature services for Workflow Management capabilities. These include sending work to the Navigator applications and seeing status updates in the dashboard. It is also required to use the traffic add-on and host your own real time traffic services.

While many RDBMS such as Oracle and PostGreSQL can be supported, SQL Server is the DBMS used for publishing your feature services in the examples in the configuration documentation. The Express version is unsuitable for use due to concurrent user limitations. SQL Server Standard is available from Microsoft.