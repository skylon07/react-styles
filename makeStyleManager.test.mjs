import makeManager from './makeStyleManager.mjs'

class MockComponent {
    constructor() {
        this.componentName = this.constructor.name
        this.manager = makeManager.createComponentManager(this)
    }

    componentDidMount() {
        this.manager.initStyle()
        this.manager.updateDynamicStyles()
    }

    componentDidUpdate() {
        this.manager.updateDynamicStyles()
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
                    opacity: 0,
                },

                60: {
                    opacity: 1,
                }
            }
        }
    }
}

const test = new FirstTest()
test.componentDidMount()
console.log('STATIC:', test.manager._getMemory(test.manager._baseRule).staticStyle.innerHTML)
console.log('DYNAMIC (first):', test.manager._getMemory(test.manager._baseRule).dynamicStyle.innerHTML)
test.componentDidUpdate()
test.componentDidUpdate()
console.log('DYNAMIC (second):', test.manager._getMemory(test.manager._baseRule).dynamicStyle.innerHTML)

