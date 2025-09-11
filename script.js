const hash = location.hash;
const id = hash.split('#')[6];
var room_id;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var local_stream;
var screenStream;
var peer = null;
var currentPeer = null
var screenSharing = false
var x = false
let room ="248932";
var text
let mqttClient;




function createRoom() {
    console.log("Creating Room")
   
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = room;
    peer = new Peer(room_id)
    peer.on('open', (id) => {
        console.log("Peer Room ID: ", id)
        getUserMedia({ video: true, audio: true }, (stream) => {
            console.log(stream);
            local_stream = stream;
            setLocalStream(local_stream)
        }, (err) => {
            console.log(err)
        })
        notify("Waiting for peer to join.")
    })
    peer.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            console.log("got call");
            console.log(stream);
            setRemoteStream(stream)
        })
        currentPeer = call;
    })
}

function setLocalStream(stream) {
    document.getElementById("local-vid-container").hidden = false;
    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = false;
    video.play();
}
function setScreenSharingStream(stream) {
    document.getElementById("screenshare-container").hidden = false;
    let video = document.getElementById("screenshared-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setRemoteStream(stream) {
    document.getElementById("remote-vid-container").hidden = false;
    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}


function notify(msg) {

}

function joinRoom() {
    console.log("Joining Room")
    let room = document.getElementById("room-input").value;
    if (room == " " || room == "") {
        document.getElementById("room-input").value="248932";
        joinRoom();
        return;
    }
    room_id = room;
    peer = new Peer()
    peer.on('open', (id) => {
        console.log("Connected room with Id: " + id)

        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
            notify("Joining peer")
            let call = peer.call(room_id, stream)
            call.on('stream', (stream) => {
                setRemoteStream(stream);

            })
            currentPeer = call;
        }, (err) => {
            console.log(err)
        })

    })
}
function joinRoomWithoutCamShareScreen() {
    // join a call and drirectly share screen, without accesing camera
    console.log("Joining Room")
    let room = 2;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = room;
    peer = new Peer()
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id)

        const createMediaStreamFake = () => {
            return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width: 640, height: 480 })]);
        }

        const createEmptyAudioTrack = () => {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const dst = oscillator.connect(ctx.createMediaStreamDestination());
            oscillator.start();
            const track = dst.stream.getAudioTracks()[0];
            return Object.assign(track, { enabled: false });
        }

        const createEmptyVideoTrack = ({ width, height }) => {
            const canvas = Object.assign(document.createElement('canvas'), { width, height });
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = "green";
            ctx.fillRect(0, 0, width, height);

            const stream = canvas.captureStream();
            const track = stream.getVideoTracks()[0];

            return Object.assign(track, { enabled: false });
        };

        notify("Joining peer")
        let call = peer.call(room_id, createMediaStreamFake())
        call.on('stream', (stream) => {
            setRemoteStream(stream);

        })

        currentPeer = call;
        startScreenShare();

    })
}

function joinRoomShareVideoAsStream() {
    // Play video from local media
    console.log("Joining Room")
    let room = 2;
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }

    room_id = room;
    peer = new Peer()
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id)

        document.getElementById("local-mdeia-container").hidden = false;
        
        const video = document.getElementById('local-media');
        video.onplay = function () {
            const stream = video.captureStream();
            notify("Joining peer")
            let call = peer.call(room_id, stream)

            // Show remote stream on my side
            call.on('stream', (stream) => {
                setRemoteStream(stream);

            })
        };
        video.play();
    })
}

function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
        setScreenSharingStream(stream);

        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing()
        }
        if (peer) {
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
            screenSharing = true
        }
        console.log(screenStream)
    })
}

function stopScreenSharing() {
    if (!screenSharing) return;
    let videoTrack = local_stream.getVideoTracks()[0];
    if (peer) {
        let sender = currentPeer.peerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        })
        sender.replaceTrack(videoTrack)
    }
    screenStream.getTracks().forEach(function (track) {
        track.stop();
    });
    screenSharing = false
}


const host = "ws://10.109.234.237:9001/mqtt";
const clientId = "client" + Math.random().toString(36).substring(7);

var direct='';
var count=0;
const topic = "Isaac";
const topic1 = "Isaac1";

window.addEventListener("load", (event) => {
  connectToBroker_pub();
  const control = document.querySelector(".control");
  const publishBtn = document.querySelector(".publish");
  publishBtn.addEventListener("click", function () {
    publishMessage();
  });

  control.addEventListener("click", function () {
    publishMessage();
  });
});

function connectToBroker_pub() {
  const clientId = "client" + Math.random().toString(36).substring(7);

  // Change this to point to your MQTT broker
  

  const options = {
    keepalive: 60,
    clientId: clientId,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  };

  mqttClient = mqtt.connect(host, options);

  mqttClient.on("error", (err) => {
    console.log("Error: ", err);
    mqttClient.end();
  });

  mqttClient.on("reconnect", () => {
    console.log("Reconnecting...");
  });

  mqttClient.on("connect", () => {
    console.log("Client connected:" + clientId);

  mqttClient.subscribe("topic1", { qos: 0 }, (err) => {
        if (!err) {
          console.log("Subscribed to: topic1");
        }
      });
  });

  // Received
  mqttClient.on("message", (topic1, message, packet) => {
    console.log(
      "Received Message: " + message.toString() + "\nOn topic: " + topic
    );
    const messageTextArea = document.querySelector("#messagesub");
      messageTextArea.value += `[${topic1}] ${message}\r\n`;
  });
}
var count;
function publishMessage(direct) {
  const messageInput = document.querySelector("#message");
    
  

  if(direct != ''){
    message= direct;
  }
  else{
    message='';
  }
  console.log(`Sending Topic: ${topic}, Message: ${message}`);

  mqttClient.publish(topic, message, {
    qos: 0,
    retain: false,
  });
    mqttClient.publish(topic, count, {
    qos: 0,
    retain: false,
  });
  //messageInput.value = "";
}

    function reloadEye() {
      const f = document.getElementById('eye-monitor');
      f.src = PI_EYE_URL;
    }