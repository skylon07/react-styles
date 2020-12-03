/* MODULE INFO:
This module provides the main functionality for implementing all makeStyle()
features, including parsing and applying CSS elements. This module
accomplishes these tasks under the following requirements:

    Main Factory:
        1. Default export of the module
        2. Creates managers for component instances and themes
        3. Given access to React Styles secrets key ("RSKey")
        4. Sets up HTML element structures for modifying CSS later
    Style Manager:
        5. Parses makeStyle() results after first component mounts
        6. Parses/updates dynamic style properties after every component mounts/updates
        7. Manages adding/modifying style elements to/in previous HTML structures
    makeStyle() Syntax:
        8. Static props have string values
        9. Dynamic props have function values
        10. Props defined in camelCase turn to dash-case
        11. Absolute props start with '='
        12. [when('...')] generates subclass
        13. Component name or HTML element name creates child class
            - '.' is auto-appended for Component names ONLY!
        14. '@keyframes ...' defines animation frames
            - Numerical values automatically converted to percentages
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

        const onProp = {
            dynamic: 1,
            static: 1,
        }
        parser.parseStyle('.' + this._cssName, makeResult, {})
        // TODO: parse results (full)
    }
    _laterInitStyle(memory, makeResult) {
        if (!memory.dynamicStyle) {
            return // no dynamic properties to process (because firstInit didnt see any)
        }

        // TODO: parse results (only dynamic)
    }
}

// NOTE: this is a visitor-based makeStyle() parsing singleton,
// which allows one to abstract away from recursively scanning objects
// and just need to provide what to do given certain parameters
const parser = new class {
    // NOTE: this function expects classLine to be a VALID CSS RULE NAME
    parseStyle(classLine, makeResult, onProp) {
        if (typeof makeResult !== "object") {
            return // pretty CSS-like way to do it, right?
        }

        for (const prop in makeResult) {
            const value = makeResult[prop]
            
            // REQ 12: fulfills requirement 12
            if (this._isWhenProp(prop, value)) {
                const origProp = prop.slice(whenKey.length)
                let subClassLine = classLine
                // checks for letters and automatically adds '.' in front of them
                const code = origProp.charCodeAt(0)
                if (code >= 65 && code <= 90 || code >= 97 && code <= 122) {
                    subClassLine += '.'
                }
                subClassLine += origProp

                this.parseStyle(subClassLine, value, onProp)
            }

            else if (this._isChildProp(prop, value)) {
                // REQ 14: fulfills requirement 14
                if (this._isKeyframesProp(prop, value)) {
                    this._on(onProp, "keyframes", classLine, prop, value)
                }

                // REQ 11: fulfills requirement 11
                else if (this._isAbsoluteProp(prop, value)) {
                    const absClassLine = prop.slice(1)
                    this.parseStyle(absClassLine, value, onProp)
                }

                // REQ 13: fulfills requirement 13
                // regular child class
                else {
                    let childClassLine = classLine + ' '
                    // treat component names as CSS custom classes
                    if (this._isComponentName(prop)) {
                        childClassLine += '.'
                    }
                    childClassLine += prop
                    this.parseStyle(childClassLine, value, onProp)
                }
            }

            // REQ 9: fulfills requirement 9
            else if (this._isDynamicProp(prop, value)) {
                this._on(onProp, "dynamic", classLine, prop, value)
            }
            // REQ 8: fulfills requirement 8
            // must be a static property!
            else {
                this._on(onProp, "static", classLine, prop, value)
            }
        }
    }

    parseKeyFrames(keyTimes, onProp) {
        for (const keyProp in keyTimes) {
            const timeProps = keyTimes[keyProp]

            // adds '%' for ints
            let keyTime = keyProp
            const asInt = parseInt(keyTime)
            if (asInt || asInt === 0) { // excludes NaN
                keyTime += '%'
            }

            for (const prop in timeProps) {
                const value = timeProps[prop]
                
                if (this._isDynamicProp(prop, value)) {
                    this._on(onProp, "dynamic", keyTime, prop, value)
                }
                else {
                    this._on(onProp, "static", keyTime, prop, value)
                }
            }
        }
    }

    _toCSSProp(name) {
        let newName = ""
        for (let i = 0; i < name.length; i++) {
            const char = name[i]
            // range of capital letters
            const code = char.charCodeAt(0)
            if (code >= 65 && code <= 90) {
                newName += '-' + char.toLowerCase()
            }
            else {
                newName += char
            }
        }
        return newName
    }

    // returns if when() was used
    _isWhenProp(prop, value) {
        return prop.slice(0, whenKey.length) === whenKey
    }

    // returns if pair defines a CSS child class
    _isChildProp(prop, value) {
        return typeof value === "object"
    }

    // returns if pair defines keyframes for animating
    _isKeyframesProp(prop, value) {
        return prop[0] === '@'
    }

    // returns if an absolute CSS rule was defined
    _isAbsoluteProp(prop, value) {
        return prop[0] === '='
    }

    // returns if a dynamic property was defined
    _isDynamicProp(prop, value) {
        return typeof value === "function"
    }

    // returns if "str" represents a component name (according to JSX specifications)
    _isComponentName(str) {
        const code = str.charCodeAt(0)
        return code >= 65 && code <= 90 // range of capital letters
    }

    // just a wrapper that calls the function if it exists
    _on(onProp, condition, classLine, prop, value) {
        const callback = onProp[condition]
        if (typeof callback === "function") {
            // REQ 10: fulfills requirement 10
            const cssValidProp = this._toCSSProp(prop)
            callback(classLine, cssValidProp, value)
        }
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
    createComponentManager(componentInstance) {
        const rule = '.' + componentInstance.componentName // manager expects a valid CSS rule
        const makeStyle = (when) => componentInstance.makeStyle(when) // binds "this" to component
        return this._createManager(rule, makeStyle)
    }
    createThemeManagerForComponent(componentName, makeTheme) {
        const rule = "body " + componentName + ":not(.__THIS_INCREASES_SPECIFICITY_FOR_THEMES__)"
        return this._createManager(rule, makeTheme)
    }
    _createManager(rule, makeStyle) {
        const createStatic = () => this._createStaticStylesheet()
        const createDynamic = () => this._createDynamicStylesheet()
        return new StyleManager(rule, makeStyle, createStatic, createDynamic)
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
