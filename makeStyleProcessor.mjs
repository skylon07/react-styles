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

import StyleManager from './styleManager.mjs'

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
