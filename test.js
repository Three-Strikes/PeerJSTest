let peer = new Peer({
	host: "192.168.1.32",
	port: 9000,
	path: "/sispeer",
});


let ownID;

let connectionList = new Array();

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

	conn.on('error', function (error) {
		console.log(error);
	});
	conn.on('open', function () {
		console.log(conn);
		// Receive messages
		conn.on('data', function (data) {
			console.log('Received', data);
		});

		if (!connectionList.includes(destId)) {
			var p = document.createElement('p');
			p.innerHTML = destId;
			connectionList.push(destId);
			document.getElementById("connectionIndicator").appendChild(p);
		}

		// Send messages
		conn.send('Hello!');
	});
}

function sendMessage(text) {
	console.log(text);
	conn.send(text);
}


async function goThroughListForCall() {
	const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	connectionList.forEach(element => {
		callPeer(element, stream);
	});
}

async function callPeer(destId, stream) {
	try {

		var call = peer.call(destId, stream, { metadata: { "type": "videoCall" } });
		var video = document.createElement('video');
		call.on('stream', function (remoteStream) {
			testCamera();
			console.log(remoteStream);
			var div = document.getElementById('videoList');

			video.id = destId + '\'s video stream';
			video.srcObject = remoteStream;
			video.autoplay = true;
			div.appendChild(video);
			//video.onloadedmetadata = () => { video.play(); };
		});
	} catch (err) {
		console.log('Failed to get local stream', err);
	}
}

async function testCamera() {
	const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	console.log(stream);
	var video = document.getElementById('ownvideoelement');
	video.srcObject = stream;
	video.autoplay = true;
	//video.onloadedmetadata = () => { video.play(); };
}

//On connection received say something
peer.on('connection', function (conn) { // Receive messages
	document.getElementById('connectionIndicator').style.color = 'green';
	conn.on('data', function (data) {
		console.log('Received', data);
	});


	// Send messages
	conn.send('Hello!');
});

peer.on('call', async function (call) {
	console.log(call);
	// Answer the call, providing our mediaStream
	try {
		if (call.metadata.type === 'videoCall') {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			call.answer(stream);
			var blankvideo = document.createElement('video');
			blankvideo.id = 'blank';

			call.on('stream', function (remoteStream) {
				var div = document.getElementById('videoList');
				video.id = '\'s video stream';
				video.srcObject = remoteStream;
				video.autoplay = true;
				div.appendChild(video);
				//video.onloadedmetadata = () => { video.play(); };
			});
		} else if (call.metadata.type === 'screenShare') {
			call.answer();
			console.log('answered');
			call.on('stream', function (remoteStream) {
				var video = document.getElementById('screenSharing');
				video.srcObject = remoteStream;
				video.autoplay = true;
			});
			call.on('close', function (remoteStream) {
				console.log(remoteStream);
				console.log('closed');
				var video = document.getElementById('screenSharing');
				video.srcObject = blankvideo.srcObject;
				video.autoplay = false;
			});
		}

	} catch (err) {
		console.log('Failed to get local stream', err);
	};

});

function checkConnections() {
	console.log(peer.connections);
}

async function shareScreenToAllPeers() {
	const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
	connectionList.forEach(element => {
		shareScreen(element, stream);
	});
}

async function shareScreen(destId, stream) {
	try {
		peer.call(destId, stream, { metadata: { "type": "screenShare" } });

	} catch (err) {
		console.log('Failed to get local stream', err);
	}
}

