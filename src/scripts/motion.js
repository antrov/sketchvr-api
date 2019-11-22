
console.log('motion module');

const motion = {
    isAvailable: function () {
        return typeof DeviceMotionEvent.requestPermission === 'function'
    },
    /**
     * Checks current DeviceMotionEvent permission state
     * @returns {Bool} 
     * * `true` if permission is granted
     * * `false` if permission is denied or unavailable
     * * `null` if permission is default (not defined yet)
     * * `undefined` in case of check error. Error can occurs when check called from unsafe domain
     */
    permission: async function () {
        if (!this.isAvailable()) { return false }

        try {
            switch (await DeviceMotionEvent.requestPermission()) {
                case 'granted': return true
                case 'denied': return false
                default: return null
            }
        } catch (error) {
            return undefined
        }
    },
    requestPermission: async function () {
        if (!this.isAvailable()) { return }

        await DeviceMotionEvent.requestPermission()

        if (await this.requestPermission()) {
            window.addEventListener('devicemotion', () => { });
        }
    }
}

export { motion };