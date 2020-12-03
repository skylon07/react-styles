/* MODULE INFO:
This module provides the main functionality for implementing all makeStyle()
features, including parsing and applying CSS elements. This module
accomplishes these tasks under the following requirements:

    Main Factory:
        1. Default export of the module
        2. Creates managers for component instances and themes
        3. Sets up HTML element structures for modifying CSS later
    Style Manager:
        4. Parses makeStyle() results after first component mounts
        5. Parses/updates dynamic style properties after every component mounts/updates
        6. Manages adding/modifying style elements to/in previously mentioned HTML structures
    makeStyle() Syntax:
        7. Static props have string values
        8. Dynamic props have function values
        9. Props defined in camelCase turn to dash-case
        10. Absolute props start with '='
        11. [when('...')] generates subclass
        12. Component name or HTML element name creates child class
            - '.' is auto-appended for Component names ONLY!
        13. '@keyframes ...' defines animation frames
            - Numerical values automatically converted to percentages
*/

const whenKey = 'when='
class StyleManager {
    // REQ 6: fulfills requirement 6
    // NOTE: this is a dictionary of all known CSS rule sets for all components and themes
    // (since each component/theme should only have one set of sheets devoted to it)
    static get _knownStyles() {
        if (!this.__knownStyles) {
            this.__knownStyles = {}
        }
        return this.__knownStyles
    }

    static _rememberStyle(baseRule, makeResult) {
        // NOTE: treat this as an immutable object
        const newMemory = { makeResult, staticStyle: null, dynamicStyle: null }
        this._knownStyles[baseRule] = newMemory
        return newMemory
    }
    static _setStaticSheetFor(baseRule, styleElement) {
        const memory = this._knownStyles[baseRule]
        memory.staticStyle = styleElement
    }
    static _setDynamicSheetFor(baseRule, styleElement) {
        const memory = this._knownStyles[baseRule]
        memory.dynamicStyle = styleElement
    }

    // NOTE: as a memory optimization, this manager controls if it needs to create a static/dynamic sheet
    // NOTE: baseRule acts as an ID; it should be unique across all manager instance, and a valid CSS rule
    constructor(baseRule, makeStyle, createStaticSheet, createDynamicSheet) {
        this._baseRule = baseRule
        this._makeStyle = makeStyle

        // binds create funcs to our associated "memory"
        this._createStaticSheet = () => {
            const style = createStaticSheet()
            StyleManager._setStaticSheetFor(this._baseRule, style)
            return style
        }
        this._createDynamicSheet = () => {
            const style = createDynamicSheet()
            StyleManager._setDynamicSheetFor(this._baseRule, style)
            return style
        }

        this._dynamicRules = null // will have all dynamic CSS rules after initStyle() is run (if any)
    }


    // REQ 4: fulfills requirement 4
    initStyle() {
        // NOTE: makeStyle() is run on every component instance, not just first;
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
            this._laterInitStyle(makeResult, memory)
        }
    }

    // REQ 5: fulfills requirement 5
    updateDynamicStyles(componentInstance) {
        const memory = this._getMemory()
        if (!memory.dynamicStyle) {
            return // no dynamic properties to update
        }

        this._insertRulesToSheet(componentInstance, this._dynamicRules, memory.dynamicStyle)
    }

    _getMemory() {
        return StyleManager._knownStyles[this._baseRule]
    }

    // NOTE: new style elements should ONLY be called in the function below
    _firstInitStyle(makeResult) {
        // remember the result for future component mounts
        StyleManager._rememberStyle(this._baseRule, makeResult)

        // set up some accumulators for each CSS rule line
        // NOTE: these nested objects are structured as follows: rules.classLine.prop = value
        const staticRules = {}
        const dynamicRules = {}

        // set up instructions on what to do for static/dynamic props
        const onProp = {
            static: (classLine, prop, value) => {
                let ruleProps = staticRules[classLine]
                if (!ruleProps) {
                    ruleProps = staticRules[classLine] = {}
                }
                ruleProps[prop] = value
            },
            dynamic: (classLine, prop, value) => {
                let ruleProps = dynamicRules[classLine]
                if (!ruleProps) {
                    ruleProps = dynamicRules[classLine] = {}
                }
                ruleProps[prop] = value
            },
        }

        // begin parsing
        const initRule = this._baseRule
        parser.parseStyle(initRule, makeResult, onProp)

        // after accumulating, create ONLY necessary style elements
        // insert to static stylesheet
        let anyStaticRules = false
        for (let _ in staticRules) {
            anyStaticRules = true
            break
        }
        if (anyStaticRules) {
            const styleSheet = this._createStaticSheet()
            // component ref not needed for static properties; no functions
            this._insertRulesToSheet(null, staticRules, styleSheet)
        }

        // do not insert to dynamic stylesheet (that is what updateDynamicStyles() does)
        let anyDynamicRules = false
        for (let _ in dynamicRules) {
            anyDynamicRules = true
            break
        }
        if (anyDynamicRules) {
            this._createDynamicSheet()
            this._dynamicRules = dynamicRules
        }
    }
    _laterInitStyle(makeResult, memory) {
        if (!memory.dynamicStyle) {
            return // no dynamic properties to process (because firstInit didnt see any)
        }

        // acumulate dynamic rules only
        const dynamicRules = {}
        const onProp = {
            dynamic: (classLine, prop, value) => {
                let ruleProps = dynamicRules[classLine]
                if (!ruleProps) {
                    ruleProps = dynamicRules[classLine] = {}
                }
                ruleProps[prop] = value
            },
        }

        // begin parsing
        const initRule = this._baseRule
        parser.parseStyle(initRule, makeResult, onProp)

        // remember dynamic rules
        this._dynamicRules = dynamicRules
    }

    // NOTE: this can process both static and dynamic rules since the logic
    // after getting the value is the same
    _insertRulesToSheet(componentInstance, ruleSet, styleElement) {
        // parse all rules into a single string
        let htmlStr = ''
        for (const ruleLine in ruleSet) {
            htmlStr += ruleLine + '{\n'
            const props = ruleSet[ruleLine]
            for (const prop in props) {
                let value = props[prop]
                if (typeof value === "function") {
                    value = value(componentInstance)
                }
                htmlStr += prop + ':' + value + ';\n'
            }
            htmlStr += '}\n'
        }

        // set style element with string
        styleElement.innerHTML = htmlStr
    }
}

// NOTE: this is a visitor-based makeStyle() parsing singleton,
// which allows one to abstract thinking to "makeResults in,
// CSS pieces out"
const parser = new class {
    // NOTE: this function expects classLine to be a VALID CSS RULE NAME
    // NOTE: onProp has two functions: "static", and "dynamic" (for their respective types of props)
    parseStyle(classLine, makeResult, onProp) {
        if (typeof makeResult !== "object") {
            return // pretty CSS-like way to do it, right?
        }

        for (const prop in makeResult) {
            const value = makeResult[prop]

            // REQ 11: fulfills requirement 11
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
                // REQ 13: fulfills requirement 13
                if (this._isKeyframesProp(prop, value)) {
                    this._on(onProp, "keyframes", classLine, prop, value)
                }

                // REQ 10: fulfills requirement 10
                else if (this._isAbsoluteProp(prop, value)) {
                    const absClassLine = prop.slice(1)
                    this.parseStyle(absClassLine, value, onProp)
                }

                // REQ 12: fulfills requirement 12
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

            // REQ 8: fulfills requirement 8
            else if (this._isDynamicProp(prop, value)) {
                this._on(onProp, "dynamic", classLine, prop, value)
            }
            // REQ 7: fulfills requirement 7
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
            // REQ 9: fulfills requirement 9
            const cssValidProp = this._toCSSProp(prop)
            callback(classLine, cssValidProp, value)
        }
    }
}

// REQ 1: fulfills requirement 1
// factory singleton
export default new class {
    constructor() {
        // REQ 3: fulfills requirement 3
        this._masterStylesContainer = this._createMasterContainer()
        this._staticStylesContainer = this._createStaticContainer()
        this._dynamicStylesContainer = this._createDynamicContainer()
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
