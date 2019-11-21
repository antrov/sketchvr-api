import '../styles/index.scss';
import { motion } from './motion'
import { actions } from './actions'

const actionsMap = new Map([
    ['permission', function () { motion.requestPermission().then() }],
    ['stepForward', function () { actions.stepForward(document.getElementById('cam').object3D) }],
    ['stepBackward', function () { actions.stepBackward(document.getElementById('cam').object3D) }],
    ['load', function (modelUri) { actions.loadModel(document.getElementById('model-container'), modelUri) }]

])

function execAction(actionKey, ...args) {
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
            execAction('load', '/public/sketch_test')
            break
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    actionsMap.forEach((fn, actionKey) => {
        document.querySelectorAll(`[data-action=${actionKey}]`).forEach(el => {
            el.addEventListener('click', fn, false)
        })
    })

    document.getElementById('permstate').innerHTML = "" + await motion.permission()
})