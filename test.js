/*
	Aqui é definido o servidor que dá suporte ao Peer.js. 
	Este servidor está self hosted pela sistrade, mas o código fonte é escrito pelos desenvolvedores do Peer.js.
	Aqui também podem ser definidos os servidores de TURN e STUN para facilitar conexões entre redes com NATs simétricas.
	Estes servidores só entram em ação se o WebRTC que está por trás do Peer.js não conseguir establecer uma conexão peer-to-peer.
	O servidor de STUN pode ser encontrado online (ou implementado por nós), mas um servidor TURN teria de ser implementado por nós.
	O servidor de STUN deve ser suficiente, e está por defeito a ir buscar um da google. ('stun:stun.l.google.com:19302')
*/
let peer = new Peer({
	host: "192.168.1.32",
	port: 9000,
	path: "/sispeer",
	config: {
		'iceServers': [
			{ url: 'stun:stun.l.google.com:19302' }
		]
	}
});

//O ID do próprio peer.
let ownID;
//Lista usada para armazenar IDs de conexões para facilitar conexões de dados, e chamadas multi-peer.
let connectedPeerIDList = new Array();
let conn;
//Esta função dispara quando o utilizador abre uma página de html, criando o seu ID.
peer.on('open', function (id) {
	console.log('My peer ID is: ' + id);
	ownID = id;
});

/*
	Esta função conecta dois "peers" para uma conexão de dados.
	Esta conexão pode ser usada para transferir mensagens de texto, e até ficheiros.
*/
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

		if (!connectedPeerIDList.includes(destId)) { //Adicionar id's abaixo do header se a conexão for bem sucedida.
			var p = document.createElement('p');
			p.innerHTML = destId;
			connectedPeerIDList.push(destId);
			document.getElementById("connectionIndicator").appendChild(p);
		}

		// Send messages
		conn.send('Hello!');
	});
}
//Envia uma mensagem de texto pela conexão de dados establecida.

function sendMessage(text) {
	conn.send(text);
}

//Liga a todos os peers na connectionList

async function goThroughListForCall() {
	//Isto vai buscar os media devices a que o browser consegue aceder, neste caso, o microfone e a camara.
	const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	connectedPeerIDList.forEach(element => {
		callPeer(element, stream);
	});
}

/* 
	Realiza uma chamada com todos os peers a que este peer está ligado. 
	Utiliza o testCamera(); para ligar a própria camara no canto superior direito.
	call.on -> stream é definido aqui para que os vídeos dos outros peers sejam injetados na página
	do utilizador que iniciou as chamadas à medida que recebe "streams" dos peers que aceitaram a chamada.
*/

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

// Isto abre a camara do utilizador, e coloca-a no canto superior direito.
async function testCamera() {
	const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	console.log(stream);
	var video = document.getElementById('ownvideoelement');
	video.srcObject = stream;
	video.autoplay = true;
}

/*
	Quando um Peer recebe uma conexão este código é executado.
*/
peer.on('connection', function (conn) { // Receive messages
	document.getElementById('connectionIndicator').style.color = 'green';
	conn.on('data', function (data) {
		console.log('Received', data);
	});


	// Send messages
	conn.send('Hello!');
});

/*	
	Quando um peer recebe uma call, esta função corre automaticamente do lado do peer que recebe a call.
	Se for uma videochamada, a chamada é respondida com a câmara do utilizador, que é enviada de volta para o Peer que iniciou a chamada.
	Depois, é definido que quando a MediaConnection (o objeto "call") recebe uma stream (por exemplo a câmara de um Peer), esta stream é adicionada ao div da
	lista de vídeos.
	
	Se for screenshare, a call é respondida sem uma stream, e a stream recebida é adicionada ao elemento de screen sharing.
*/

peer.on('call', async function (call) {
	console.log(call);
	// Answer the call, providing our mediaStream
	try {
		if (call.metadata.type === 'videoCall') {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			call.answer(stream);
			var blankvideo = document.createElement('video');
			blankvideo.id = 'blank';
			var video = document.createElement('video');

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

/*
	Função utilizada só para ver que connections estão establecidas para este peer.
*/

function checkConnections() {
	console.log(peer.connections);
}
/*
	Função que percorre a lista de conexões para establecer MediaConnections de screen sharing para todos os peers a que este peer está conectado.
*/
async function shareScreenToAllPeers() {
	//Isto dá prompt ao utilizador a que janela ou ecrã quer partilhar com o browser e outros peers.
	const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
	connectedPeerIDList.forEach(element => {
		shareScreen(element, stream);
	});
}

/*
	Esta função establece uma MediaConnection entre dois peers para screensharing.
*/
async function shareScreen(destId, stream) {
	try {
		peer.call(destId, stream, { metadata: { "type": "screenShare" } });

	} catch (err) {
		console.log('Failed to get local stream', err);
	}
}


async function submitFileToPeers(files) {
	connectedPeerIDList.forEach(element => {
		shareFile(files, element);
	});
}

function shareFile(files, destinationId) {
	console.log(files);

}
