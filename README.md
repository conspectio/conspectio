![logo](http://i.imgur.com/ZEBvuGv.png)



Conspectio is an open-source library for grouping multiple live stream broadcasts, and scaling viewers without the need for additional servers. Built on top of WebRTC -- used for realtime peer-to-peer video and audio communication in the browser --  Conspectio exceeds the number of concurrent viewers constrained by WebRTC.

>We welcome and encourage any feedback to make Conspectio better for everyone. Thank you!

##Version
![npm version](https://badge.fury.io/js/conspectio.svg)

##Features
* scale to many viewers without additional servers
* viewers can see multiple broadcasts in one view
* built-in signaling with socket.io


##Installation


###Overview
Conspectio is composed of  two modules: **server-side module and client-side module**.  Both modules **must** be properly installed and used in order for the underlying **WebRTC peer connections and Socket.IO event messaging** mechanism to work correctly. 


####Server-Side Module
    npm install --save conspectio

In your server file, setup your Node/Express server

    const express = require('express');
    const app = express();
    const http = require ('http').Server(app);

We recommend using the npm package path to help manage file paths

    const path = require('path');

Require in **conspectio** and pass in the **http** object

    const conspectio = require('conspectio');
    conspectio(http);

**Note**: there is **NO** need to require in Socket.IO as this is already handled by conspectio

Include this in your server file: **Note** that the path to **node_modules** folder is relative to your **server** file. With this line of code, we are having the Express server host the client side library JavaScript file

    app.use(express.static(path.join(`${__dirname}/../node_modules/conspectio/dist`)));
 
---
####Client-Side Module
Include the **conspectio.min.js** file in your html file(s) in order to give your custom JavaScript files access to the **conspectio object** that is attached to the global browser window object

     <script src='conspectio.js'></script>

**Note**: there is **NO** need to require in Socket.IO-client as this is already handled by conspectio

##API


###Terminology & Concepts
**Broadcaster:** A client who is the origin of a live MediaStream obtained via the client’s camera using WebRTC’s getUserMedia API.

**Viewer:** A client who is viewing the live MediaStream(s) sent from  broadcaster(s).

**Single role:** A client is either a broadcaster or viewer.

**Uni-directional relationship:** The video/audio tracks originates from the broadcaster and is sent to the viewer.

**Event:** An event is identified by an unique identifier, an event is considered active if there is at least 1 broadcaster for that event.

**Multiple broadcasters per event:** More than 1 broadcasters can be grouped into a single event.

**Multiple viewers per event:** More than 1 viewers can be grouped into an event, a viewer can see all the streams from the broadcasters grouped into the same event.

*Note: current limit is 2 broadcasters maximum*

###Server-Side Module

The server-side module exposes the following function
 
    conspectio(http)

A function that takes in the Node http server object in order to setup Socket.IO and other mechanisms needed by conspectio on the server-side

*Arguments:*

*http: A Node http server object*


###Client-Side Module
The client-side module exposes the following functions and objects:

####conspectio.ConspectioManager

A class object that is used for getting a list of active events:

Constructor: 

    conspectio.ConspectioManager()
*Arguments:*

 *Takes in no arguments*

    conspectio.ConspectioManager.init(callback(eventList) => {...})

The function **init()** is a method of the **conspectio.ConspectioManager** object that retrieves a list of active events and passes in the resulting **eventList** as an argument into the provided callback function.

*Arguments:*

*callback(eventList) => {...}: A callback function for handling the displaying of events passed in as argument
eventList: This is an array of event identifier strings*

####conspectio.ConspectioConnection

A class object representing 1 peer entity (broadcaster or viewer) in a peer-to-peer relationship

If there exists broadcaster1, viewer1 and viewer2, then each client is a ConspectioConnection entity

Constructor: 

    conspectio.ConspectioConnection(eventId, role, domId, viewerHandlers, RTCPeerConnection config);

*Arguments:*

1. **eventId:** An unique event identifier [string].

2. **role:** ‘broadcaster’ OR ‘viewer’ [string], indicates whether this ConspectioConnection entity represents a broadcaster or viewer.

3. **domId:** The id of DOM element [string]

 a. If role is **‘broadcaster’:** id of DOM element where getUserMedia should attach local stream received from broadcaster client’s camera device.

 b. If role is **‘viewer’:** id of DOM element where remote streams received from broadcasters will be contained in.

4. **viewerHandlers:** object with handler functions that takes care of presentational behavior when the following specified events occur [null OR object].

 a. If role is **‘broadcaster’:** 

        null (non applicable for broadcaster role)
 
 b. If role is **‘viewer’:**

        {  
          noMoreBroadcasters: function(),
          broadcasterAdded: function(newVideoHTMLElement),
          broadcasterRemoved: function(videoDivId)
        }



  1. The **noMoreBroadcasters** event handler function is invoked by conspectio when there are no more broadcasters for this event identifier.

   a. This will be a good place to display an informative message or redirect to another page.

  2. The **broadcasterAdded** event handler function is invoked by conspectio when there is a new broadcaster for this event identifier.

   a. This event handler function takes in an argument of type HTML video element: this element has an unique conspectio value assigned to its id attribute **(please do not edit this).**

   b. This will be a good place to append the passed in HTML video element to the DOM.

  3. **The broadcasterRemoved** event handler function is invoked by conspectio when an existing broadcaster is removed for this event identifier.

   a. This event handler function takes in an argument of type string that is the unique conspectio value assigned to the id attribute of HTML video element previously passed in for the **broadcasterAdded** event.

   b. This will be a good place to remove the HTML video element in the DOM with the matched id attribute.


  4. **conspectio.ConspectioConnection.start()**

   a. Invoke the **start()** method to open this peer entity connection endpoint.

  5. **conspectio.ConspectioConnection.stop()**
	
   a. Invoke the **stop()** method to close this peer entity connection endpoint.

##Guide


####How to make the first WebRTC peer connection using conspectio library?

1. First install conspectio library server-side module and client-side module (See the INSTALLATION instructions).

2. Instantiate a broadcaster conspectio.ConspectioConnection() object and invoke start() on it (See the API for details)

 a. 

        const conspectioConnectionBroadcaster = new conspectio.ConspectioConnection(eventId, 'broadcaster', 'broadcasterStream', null, null);

 b. 
                
        conspectioConnectionBroadcaster.start();

 c. You should see that the HTML video element that you specified with the domId start showing the MediaStream from broadcaster client’s camera device.

3. Instantiate a viewer conspectio.ConspectioConnection() object and invoke start() on it (See the API for details)

 a.

        const conspectioConnectionViewer = new conspectio.ConspectioConnection(eventId, 'viewer', 'conspectioViewerContainer', viewerHandlers, null);

 b.

        const viewerHandlers = 
          { 
            noMoreBroadcasters: handleNoMoreBroadcasters,    
            broadcasterAdded: handleBroadcasterAdded, 
            broadcasterRemoved: handleBroadcasterRemoved 
          };

 c.

        conspectioConnectionViewer.start();

You should see a HTML video element appended to the div container that you specified showing the received broadcasted stream.

##Testing

WebRTC requires HTTPS, so when testing in your local environment we recommend using [ngrok](https://ngrok.com/). 

##Compatibility

This version of conspectio has been tested on Google Chrome browsers and Chrome browsers on mobile Androids.

##Contributors

[Diana Cheung](https://github.com/dianacheung)

[Simon Situ](https://github.com/ssitu001)

[Dana Tran](https://github.com/productdana)

##License 

MIT
