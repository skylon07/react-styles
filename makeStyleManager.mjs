/* MODULE INFO:
This module provides the main functionality for implementing all makeStyle()
features, including parsing and applying CSS elements. This module
accomplishes these tasks under the following requirements:

    Main Factory:
        1. Default export of the module
        2. Creates managers for component instances
        3. Given access to React Styles secrets key ("RSKey")
        4. Sets up HTML element structures for modifying CSS later
    Style Manager:
        5. Parses makeStyle() results after first component mounts
        6. Updates dynamic style properties after every component mounts/updates
        7. Manages adding/modifying style elements to/in previous HTML structures
*/

import { memo } from "react"

// should be defined by the importing module!
let RSKey

const whenKey = 'when='
class StyleManager {
    // REQ 7: fulfills requirement 7
    // NOTE: this is a dictionary of all known CSS rule sets for all components and themes
    // (since each component/theme should only have one set of sheets devoted to it)
    static get _knownStyles() {
        if (!this.__knownStyles) {
            this.__knownStyles = {}
        }
        return this.__knownStyles
    }

    static _rememberStyle(cssName, makeResult) {
        // NOTE: treat this as an immutable object
        const newMemory = { makeResult, staticStyle: null, dynamicStyle: null }
        this._knownStyles[cssName] = newMemory
        return newMemory
    }
    static _setStaticSheetFor(cssName, styleElement) {
        const memory = this._knownStyles[cssName]
        memory.staticStyle = styleElement
    }
    static _setDynamicSheetFor(cssName, styleElement) {
        const memory = this._knownStyles[cssName]
        memory.dynamicStyle = styleElement
    }

    // NOTE: as a memory optimization, this manager controls if it needs to create a static/dynamic sheet
    // NOTE: this constructor setup allows the manager to work with themes and components
    constructor(cssName, makeStyle, createStaticSheet, createDynamicSheet) {
        this._cssName = cssName
        this._makeStyle = makeStyle

        // binds create funcs to our associated "memory"
        this._createStaticSheet = () => {
            const style = createStaticSheet()
            StyleManager._setStaticSheetFor(this._cssName, style)
            return style
        }
        this._createDynamicSheet = () => {
            const style = createDynamicSheet()
            StyleManager._setDynamicSheetFor(this._cssName, style)
            return style
        }
    }


    // REQ 5: fulfills requirement 5
    initStyle() {
        // NOTE: makeStyle() is run on every component, not just first instance;
        // this keeps "this" (and other) references in dynamic property functions intact
        const when = (param) => + whenKey + param
        const makeResult = this._makeStyle(when)

        // creates new style elements for first init
        const memory = this._getMemory()
        if (!memory) {
            // remembers style; prevents future managers from creating elements
            this._firstInitStyle(makeResult)
        }
        // ties in dynamic updater when necessary (but shouldnt update any style elements)
        else {
            this._laterInitStyle(memory, makeResult)
        }
    }

    // REQ 6: fulfills requirement 6
    updateDynamicStyles() {
        const memory = this._getMemory()
        if (!memory.dynamicStyle) {
            return // no dynamic properties to update
        }

        // TODO
    }

    _getMemory() {
        return StyleManager[this._cssName]
    }

    // NOTE: new style elements should ONLY be called in the function below
    _firstInitStyle(makeResult) {
        const memory = StyleManager._rememberStyle(this._cssName, makeResult)
        // TODO: parse results (full)
    }
    _laterInitStyle(memory, makeResult) {
        if (!memory.dynamicStyle) {
            return // no dynamic properties to process (because firstInit didnt see any)
        }

        // TODO: parse results (only dynamic)
    }
}

// REQ 1: fulfills requirement 1
// factory singleton
export default new class {
    constructor() {
        // REQ 4: fulfills requirement 4
        this._masterStylesContainer = this._createMasterContainer()
        this._staticStylesContainer = this._createStaticContainer()
        this._dynamicStylesContainer = this._createDynamicContainer()
    }

    // REQ 3: fulfills requirement 3
    setRSKey(key) {
        RSKey = key
    }

    // REQ 2: fulfills requirement 2
    createManagerFor(componentInstance) {
        const name = componentInstance.componentName // NOTE: needs to be unique accross all CSS declarations
        const makeStyle = (when) => componentInstance.makeStyle(when)
        const createStatic = () => this._createStaticStylesheet()
        const createDynamic = () => this._createDynamicStylesheet()
        return new StyleManager(name, makeStyle, createStatic, createDynamic)
    }

    /* STYLESHEET MANAGEMENT */
    _createMasterContainer() {
        const container = document.createElement('div')
        // attach to document (somehow...)
        const attachTo = document.head || document.body || document.documentElement
        attachTo.appendChild(container)
        return container
    }
    _createStaticContainer() {
        const container = document.createElement('div')
        this._masterStylesContainer.appendChild(container)
        return container
    }
    _createDynamicContainer() {
        const container = document.createElement('div')
        this._masterStylesContainer.appendChild(container)
        return container
    }

    _createStaticStylesheet() {
        const style = document.createElement('style')
        this._staticStylesContainer.appendChild(style)
        return style
    }
    _createDynamicStylesheet() {
        const style = document.createElement('style')
        this._dynamicStylesContainer.appendChild(style)
        return style
    }
}
