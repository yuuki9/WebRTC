/**
* 1. offer를 생성하고 이를 peerConnection 의 localDescription으로 설정
* 2. 이후 offer 을 다른 PeerB 에게 보낸다.
*/
function createOffer() {
    peerConnection.createOffer(function(offer) {
        //send 메소드는 offer 정보 를 전달하기 위해 Signaling Server를 호출
        send({
            event : "offer",
            data : offer
        });
        peerConnection.setLocalDescription(offer);
    }, function(error) {
        alert("Error creating an offer");
    });
}

/**
* PeerA가 보낸 ICE candidate를 처리해야 하는데
* 이 candidate를 받은 PeerB는 해당 candidate를 candidate pool의 추가
*/
function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

/**
* offer를 받은 PeerB는 이를 Remotedescription으로 설정하고
* answer를 생성하여 PeerA 에게 보낸다.
* @param offer d
*/
function handleOffer(offer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // create and send an answer to an offer
    peerConnection.createAnswer(function(answer) {
        peerConnection.setLocalDescription(answer);
        send({
            event : "answer",
            data : answer
        });
    }, function(error) {
        alert("Error creating an answer");
    });
};

/**
* 처음 PeerA는 anwser를 받고 setRemoteDescription 으로 설정
*/
function handleAnswer(answer) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("connection established successfully!!");
};


function sendMessage(msg) {
    dataChannel.send(msg);

}

