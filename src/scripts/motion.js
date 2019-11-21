
console.log('motion module');

const motion = {
    isAvailable: function () {
        return typeof DeviceMotionEvent.requestPermission === 'function'
    },
    permission: async function () {
        if (!this.isAvailable()) { return undefined }

        try {
            switch (await DeviceMotionEvent.requestPermission()) {
                case 'granted': return true
                case 'denied': return false
                default: return null
            }
        } catch (error) {
            return null
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