import { motion } from './motion.mjs'
import { actions } from './actions.mjs'

"use strict";

const actionsMap = new Map([
    ['permission', function () {
        motion.requestPermission()
            .then(() => {
                motion.permission()
            })
            .then(permission => {
                // document.getElementById('permstate').innerHTML = "called perm - res " + permission
            })
    }],
    ['stepForward', function () { actions.stepForward(document.getElementById("camera").object3D, document.getElementById('camera').object3D) }],
    ['stepBackward', function () { actions.stepBackward(document.getElementById('camera').object3D) }],
    ['load', function (modelUri) { actions.loadModel(document.getElementById('model-container'), modelUri) }]
])

function log(msg) {
    let logDiv = document.createElement('p')
    logDiv.innerText = msg
    document.getElementById('console').appendChild(logDiv)
}

function execAction(actionKey, ...args) {
    log(`execAction with key '${actionKey}' args ${args}`)
    if (!actionsMap.has(actionKey)) { return }
    actionsMap.get(actionKey)(...args)
}

window.addEventListener('keydown', function (e) {
    switch (e.key) {
        case '+':
        case ' ':
            execAction('stepForward')
            break
        case '-':
            execAction('stepBackward')
            break
        case 'l':
            execAction('load', '/assets/Zimne Wody')
            break
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    actionsMap.forEach((fn, actionKey) => {
        document.querySelectorAll(`[data-action=${actionKey}]`).forEach(el => {
            el.addEventListener('click', fn, false)
        })
    })

    // document.getElementById('permstate').innerHTML = "" + await motion.permission()
    // execAction('load', '/public/sketch_test')
    const socket = new WebSocket('ws://192.168.0.104:8081/');

    socket.onopen = function (e) {
        console.log("[open] Connection established");
        console.log("Sending to server");
        socket.send("My name is John");
    };

    socket.onmessage = function (message) {
        console.log(`[message] Data received from server: ${message.data}`);
        return
        let event = JSON.parse(message.data)
        if (event.event !== 'orientation') return
        if (document.getElementById('rig').object3D === undefined) {
            console.log("nie ma kamery")
            return
        }

        let camera = document.getElementById('rig').object3D
        let v = event.quaternion
        // var quaternion = new THREE.Quaternion(v[0], v[1], v[2], v[3]);
        // var vector = new THREE.Vector3();

        // vector.applyQuaternion(quaternion)
        // console.log(vector)
        // camera.rotation.set(new THREE.Vector3())
        camera.quaternion.set(v[0], v[1], v[2], v[3])
        // console.log(document.getElementById('camera').object3D.rotation)
        // .rotation.set(emptyVector)
    };

    socket.onclose = function (event) {
        if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            // e.g. server process killed or network down
            // event.code is usually 1006 in this case
            console.log('[close] Connection died');
        }
    };

    socket.onerror = function (error) {
        console.log(`[error] ${error.message}`);
    };
})

export { execAction }