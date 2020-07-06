const actions = {
    walkHistory: [],
    stepForward: function (rig, camera, quaternion) {
        // console.log('step forward with ' + quaternion.toArray())
        let cameraPositon = rig.position,
            cameraReference = new THREE.Vector3()

        quaternion.position.getWorldDirection(cameraReference)

        let cameraMovement = cameraReference
            .multiplyScalar(-1)
            .multiply(new THREE.Vector3(1, 0, 1))

        this.walkHistory.push(cameraPositon.clone())
        cameraPositon.add(cameraMovement)
    },
    stepBackward: function (camera) {
        if (this.walkHistory.length == 0) { return }

        camera.position.copy(this.walkHistory.pop())
    },
    loadModel: function (container, uri) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        let objNode = document.createElement('a-obj-model')
        objNode.setAttribute('mtl', `${uri}.mtl`)
        objNode.setAttribute('src', `${uri}.obj`)
        container.appendChild(objNode)
    },
    screenshot: function (scene, socket) {
        let data = scene.components.screenshot.getCanvas('equirectangular').toDataURL().split(",")[1]

        socket.send(JSON.stringify({
            type: "event.screenshot",
            data: data
        }))
    }
}

export { actions };