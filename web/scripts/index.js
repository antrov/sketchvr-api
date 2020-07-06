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
    ['stepForward', function (quaternion) { actions.stepForward(document.getElementById("rig").object3D, document.getElementById('camera').object3D, quaternion) }],
    ['stepBackward', function () { actions.stepBackward(document.getElementById('camera').object3D) }],
    ['load', function (modelUri) { actions.loadModel(document.getElementById('model-container'), modelUri) }],
    ['screenshot', function () { actions.screenshot(document.querySelector('a-scene'), window.socket) }]
])

function log(msg) {
    let logDiv = document.createElement('p')
    logDiv.innerText = msg
    document.getElementById('console').appendChild(logDiv)
}

function execAction(actionKey, ...args) {
    if (!actionsMap.has(actionKey)) { return }
    log(`execAction with key '${actionKey}' args ${args}`)
    actionsMap.get(actionKey)(...args)
}

window.addEventListener('keydown', function (e) {
    let ref = document.getElementById('camera-ref').object3D,
        rig = document.getElementById('rig').object3D

    switch (e.key) {
        case '+':
        case 'j':
            applyQuaternion(ref, ref.quaternion)
            applyStep(ref)

            rig.position.copy(ref.position)
            execAction('screenshot')
            break
        case '-':
            execAction('stepBackward')
            break
        case 'l':
            execAction('load', '/assets/stitch_free_Reduced')
            break
        case 's':
            execAction('screenshot')
            break
    }
});

function applyQuaternion(obj, qarr) {
    let quaternion = (new THREE.Quaternion).fromArray(qarr)
    obj.quaternion.copy(quaternion)
}

function applyStep(obj) {
    let dir = new THREE.Vector3()
    obj.getWorldDirection(dir)

    let mov = dir
        .multiplyScalar(-1)
        .multiply(new THREE.Vector3(1, 0, 1))

    obj.position.add(mov)
}

document.addEventListener('DOMContentLoaded', async function () {
    actionsMap.forEach((fn, actionKey) => {
        document.querySelectorAll(`[data-action=${actionKey}]`).forEach(el => {
            el.addEventListener('click', fn, false)
        })
    })

    execAction('load', '/assets/morgi')
    const socket = new WebSocket('ws://localhost:8081/');

    window['socket'] = socket

    socket.onopen = function (e) {
        console.log("[open] Connection established");
        console.log("Sending to server");
        socket.send("My name is John");
    };

    socket.onmessage = function (message) {
        console.log(`[message] Data received from server: ${message.data}`);

        let event = JSON.parse(message.data)

        let ref = document.getElementById('camera-ref').object3D,
            rig = document.getElementById('rig').object3D

        switch (event.type) {
            case 'action.reload':
                location.reload()
                break

            case 'action.screenshot':
                execAction('screenshot')
                break

            case 'action.step.forward':
                applyQuaternion(ref, event.quaternion)
                applyStep(ref)

                rig.quaternion.set(0, 0, 0, 0)
                rig.position.copy(ref.position)
                execAction('screenshot')
                break

            case 'action.quaternion':
                applyQuaternion(ref, event.quaternion)
                break

            case 'action.step.backward':
                execAction('stepBackward')
                break
        }

        // // return
        // // let event = JSON.parse(message.data)
        // if (event.type !== 'orientation') return
        // if (document.getElementById('rig').object3D === undefined) {
        //     console.log("nie ma kamery")
        //     return
        // }

        // let camera = document.getElementById('rig').object3D
        // let v = event.quaternion
        // // var quaternion = new THREE.Quaternion(v[0], v[1], v[2], v[3]);
        // // var vector = new THREE.Vector3();

        // // vector.applyQuaternion(quaternion)
        // // console.log(vector)
        // // camera.rotation.set(new THREE.Vector3())
        // camera.quaternion.set(v[0], v[1], v[2], v[3])
        // // console.log(document.getElementById('camera').object3D.rotation)
        // // .rotation.set(emptyVector)
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