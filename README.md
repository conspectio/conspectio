# conspectio

Conspectio is a library that provides developers the ability to display multiple one-to-many live stream broadcasts all in one view. Conspectio is built with WebRTC and Socket.io.

The beta version is currently available. We welcome and encourage any feedback to make conspectio better for everyone. Thank you!


GET STARTED
Installation is broken up into server-side and client-side:

	Server-Side Implementation:
	1) npm install conspectio
	2) In your server.js file, require in conspectio:
		var conspectio = require('conspectio');
		conspectio(http);
	3) Include this in your server file: 
		app.use(express.static(path.join(`${__dirname}/../node_modules/conspectio`)));

	Client-Side Implementation:
	1) Include this in your html file: <script src='./dist/conspectio.js'></script>
	2) To use any of the methods included in these three objects, invoke the functions first:
		a) To create a ConspectioManager object to get a list of active events:
		// invoke to setup socket listeners and get list of active events
		var conspectioManagerObj = new conspectio.ConspectioManager();
		// call init() passing in callback function for handling displaying of events
		conspectioManagerObj.init(callback);
		b) To create a ConspectioConnection object for a broadcaster and pass in required arguments
			1. unique event id [string]
			2. role: 'broadcaster' [string]
			3. id of DOM element where getUserMedia should attach local stream to [string]
			4. viewerHandlers: null (non applicable for broadcaster role) [null or object]
			5. RTCPeerConnection config options: null (available in future library version) [null]
			// instantiate 
			var conspectioConnectionObj = new conspectio.ConspectioConnection(eventId, 'broadcaster', domId, null, null);
			// invoke start() to open this peer connection endpoint
			conspectioConnectionObj.start();
			// invoke stop() to close this peer connection endpoint
			conspectioConnectionObj.stop();
		c) To create a ConspectioConnection object for a viewer and pass in required arguments
			1. unique event id [string]
			2. role: 'viewer' [string]
			3. id of DOM element where remote streams will be contained in [string]
			4. viewerHandlers: object with handler functions that takes care of presentational behavior when following events occur [object]
			{
				noMoreBroadcasters: handleNoMoreBroadcasters(),
				broadcasterAdded: handleBroadcasterAdded(newVideoHTMLElement),
				broadcasterRemoved: handleBroadcasterRemoved(videoDivId)
			};
			5. RTCPeerConnection config options: null (available in future library version) [null]
			// instantiate 
			var conspectioConnectionObj = new conspectio.ConspectioConnection(eventId, 'viewer', domId, viewerHandlers, null);
			// invoke start() to open this peer connection endpoint
			conspectioConnectionObj.start();


Compatibility:

	This version of conspectio has been tested on Google Chrome browsers and Chrome browsers on mobile Androids.