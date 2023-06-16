let peer = new Peer('rca2', {
	host: "192.168.1.32",
	port: 9000,
	path: "/sispeer",
});
let ownID;
//On open, create a peer ID.
peer.on('open', function (id) {
	console.log('My peer ID is: ' + id);
	ownID = id;
});
let conn;
//On click, connect to the peer with the id in the text box.
function connectToPeer(destId) {
	console.log(destId + " debug");
	conn = peer.connect(destId);
	console.log(conn);
	console.log("yo");
	conn.on('error', function (error) {
		console.log(error);
	});
	conn.on('open', function () {
		console.log(conn);
		// Receive messages
		conn.on('data', function (data) {
			console.log('Received', data);
		});

		// Send messages
		conn.send('Hello!');
	});
}

function sendMessage(text) {
	console.log(text);
	conn.send(text);
}

function callPeer(destId) {
	var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	getUserMedia({ video: true, audio: true }, function (stream) {
		var call = peer.call(destId, stream);
		call.on('stream', function (remoteStream) {
			var div = document.getElementById('videoList');
			var video = document.createElement('video');
			video.srcObject = remoteStream;
			video.autoplay = true;
			video.onloadedmetadata = function (e) { element.play(); };
			div.appendChild(video);
		});
	}, function (err) {
		console.log('Failed to get local stream', err);
	});
}

//On connection received say something
peer.on('connection', function (conn) { // Receive messages
	document.getElementById('connectionIndicator').style.color = 'green';
	conn.on('data', function (data) {
		console.log('Received', data);
	});
	conn.on('error', function (error) {
		console.log(error);
	});
	// Send messages
	conn.send('Hello!');
});

peer.on('call', function (call) {
	// Answer the call, providing our mediaStream
	var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	getUserMedia({ video: true, audio: true });
	call.answer(mediaStream);
});
