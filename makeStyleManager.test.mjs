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
        return {
            color: "white",
            backgroundColor: "red",

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
console.log(test.manager._getMemory(test.manager._baseRule).staticStyle.innerHTML)
