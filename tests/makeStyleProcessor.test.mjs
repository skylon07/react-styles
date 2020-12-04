import makeManager from '../makeStyleProcessor.mjs'

class MockComponent {
    constructor() {
        this.componentName = this.constructor.name
        this.manager = makeManager.createComponentManager(this)
    }

    componentDidMount() {
        this.manager.initStyle()
        this.manager.updateDynamicStyles(this)
    }

    componentDidUpdate() {
        this.manager.updateDynamicStyles(this)
    }

    makeStyle(when) {
        throw new Error("Not implemented")
    }
}

class FirstTest extends MockComponent {
    makeStyle(when) {
        let numUpdates = 0
        return {
            color: "white",
            backgroundColor: "red",
            size: () => numUpdates++,

            '@keyframes FirstTest-Animation': {
                from: {
                    opacity: () => numUpdates + 5,
                },

                60: {
                    opacity: 1,
                },

                to: {
                    size: () => numUpdates,
                },
            }
        }
    }
}

const test = new FirstTest()
test.componentDidMount()
console.log('STATIC:\n', test.manager._getMemorizedSheets(test.manager._baseRule).static.innerHTML)
console.log('DYNAMIC (first):\n', test.manager._getMemorizedSheets(test.manager._baseRule).dynamic.innerHTML)
console.log('KEYFRAMES (first):\n', test.manager._getMemorizedSheets('@keyframes FirstTest-Animation').dynamic.innerHTML)
test.componentDidUpdate()
test.componentDidUpdate()
console.log('DYNAMIC (second):\n', test.manager._getMemorizedSheets(test.manager._baseRule).dynamic.innerHTML)
console.log('KEYFRAMES (second):\n', test.manager._getMemorizedSheets('@keyframes FirstTest-Animation').dynamic.innerHTML)

