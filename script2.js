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
let room ="248933";
var text
let mqttClient;




function createRoom() {
    console.log("Creating Room")
   
    if (room == " " || room == "") {
        alert("Please enter room number")
        return;
    }
    room_id = room;
        peer = new Peer(undefined, {
  host: '10.109.234.237',
  port: 9000,
  path: '/peerjs',
  debug: 2
})
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
    //video.play();
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
        peer = new Peer(undefined, {
  host: '10.109.234.237',
  port: 9000,
  path: '/peerjs',
  debug: 2
})
    peer.on('open', (id) => {
        console.log("Connected room with Id: " + id)

        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
           
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
    let room = "248933";
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


const topicsub = "Isaac";

window.addEventListener("load", (event) => {
  connectToBroker();

});

function connectToBroker() {
  const clientId = "client" + Math.random().toString(36).substring(7);
  const host = "ws://10.109.234.237:9001/mqtt"; // เปลี่ยนเป็น broker ของคุณ

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
    console.log("Client connected:", clientId);

    // ✅ auto subscribe to Isaac1
    const topic = "Isaac";
    mqttClient.subscribe(topic, { qos: 0 }, (err) => {
      if (!err) {
        console.log("Auto subscribed to:", topic);
      }
    });
  });

  // รับข้อความ
  mqttClient.on("message", (topic, message) => {
    const msg = message.toString();
    console.log("Received:", msg, "on topic:", topic);

    // ✅ ถ้า msg เท่ากับ "x" เล่นเสียง
    if (msg === "ON") {
        joinRoom();
    document.querySelector(".container").hidden = false;
    }
    if(msg === "OFF")
    {
        document.querySelector(".container").hidden = true;
        
    }
    if(msg === "eyeup")
    {
        moveEyesUp();
    }
    if(msg === "eyedown")
    {
        moveEyesDown();
    }
    if(msg === "eyeleft")
    {
        moveEyesLeft();
    }
     if(msg === "eyeright")
    {
        moveEyesRight();
    }
    if(msg === "eyecenter")
    {
        resetEyes();
    }
    if(msg === "eyeclose")
    {
        document.querySelector(".container").hidden = true;

// แสดง container อีกครั้งหลังจาก 1 วินาที (1000 ms)
setTimeout(() => {
  document.querySelector(".container").hidden = false;
}, 1000);
    }

  });
}

// เริ่มทำงานอัตโนมัติ
window.addEventListener("load", () => {
  connectToBroker();
});

const innerCircles = document.querySelectorAll(".inner-circle");
const outerCircles = document.querySelectorAll(".outer-circle");

let posX = 50;
let posY = 50;

// ฟังก์ชันขยับตา
function moveEyesLeft() {
  posX = 30;
  updateEyes();
}

function moveEyesRight() {
  posX = 70;
  updateEyes();
}

function moveEyesUp() {
  posY = 30;
  updateEyes();
}

function moveEyesDown() {
  posY = 70;
  updateEyes();
}

function resetEyes() {
  posX = 50;
  posY = 50;
  updateEyes();
}

// ฟังก์ชันอัปเดตตำแหน่งตา
function updateEyes() {
  innerCircles.forEach(circle => {
    circle.style.left = posX + "%";
    circle.style.top = posY + "%";
  });
}





