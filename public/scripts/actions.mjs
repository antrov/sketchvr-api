const actions = {
    walkHistory: [],
    stepForward: function (rig, camera) {
        let cameraPositon = rig.position,
            cameraReference = new THREE.Vector3()

        camera.getWorldDirection(cameraReference)

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
    }
}

export { actions };