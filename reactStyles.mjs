import React from 'react'

import unnamedComponentHandler from './unnamedComponents.mjs'
import makeStyleManagerFactory from './makeStyleProcessor.mjs'

// just an alias that allows auto-naming of an error...
class CustomError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}


/* PUBLIC INTERFACE FUNCTIONS */
function disableAutoClassNaming() {
    autoClassNamingEnabled = false
}

// NOTE: the global variable CANNOT be disabled permanently;
// that feature is only intended for incompatible components
function disableHiddenProps() {
    hiddenPropEnabledGlobally = false
}
function enableHiddenProps() {
    hiddenPropEnabledGlobally = true
}

function useAsyncSetState() {
    asyncSetStateEnabled = true
    asyncForceUpdateEnabled = true
}

// given the associated unnamed component number, this returns the original constructor
function getUnnamedComponentConstructor(id) {
    const name = unnamedComponentHandler.prefix + id
    return unnamedComponentHandler.getConstructor(name)
}

// given an html element, this will rerun whatever animation
// that applies to a specific class name (or class names)
function rerunAnimationOn(htmlElement, classNames) {
    if (!Array.isArray(classNames)) {
        classNames = [classNames]
    }

    htmlElement.classList.remove(...classNames)
    void htmlElement.offsetWidth // a little trick i learned on the interwebs a while ago...
    htmlElement.classList.add(...classNames)
}


/* LIBRARY PRIVATE VARIABLES */
let autoClassNamingEnabled = false // NOTE: this feature is not currently supported; check XXX tag in _bindRender()
let hiddenPropEnabledGlobally = true

// used to access React Styles properties in components (or JSX representations)
const RSKey = Symbol()

let asyncSetStateEnabled = false
let asyncForceUpdateEnabled = false


/* COMPONENT DEFINITION */
// some error definitions it will use...
class HiddenPropDisabledError extends CustomError {
    constructor(enableOrDisable) {
        super(`Cannot ${enableOrDisable} hidden prop because React Styles has already globally disabled it`)
        this.request = enableOrDisable
    }
}

// main mixin to add React Styles features to any base component class "ReactClass"
function MyComponentFrom(ReactClass) {
    return class extends ReactClass {
        constructor(props) {
            super(props)

            // initializes a secret object for any React Styles implemented properties
            this[RSKey] = {
                // React Styles uses this as the root for CSS rules it generates
                componentName: this.constructor.name || unnamedComponentHandler.generateName(this.constructor),
                hiddenPropEnabled: true, // 'false' means disabled; 'null' means permanently disabled

                // references to originally defined lifecycle functions (to be wrapped later)
                // NOTE: .call() will need to be used on these since they are in a container object
                originalRender: this.render,
                originalComponentDidMount: this.componentDidMount,
                originalComponentDidUpdate: this.componentDidUpdate,
                originalSetState: this.setState,
                originalForceUpdate: this.forceUpdate,
            }
            
            _bindLifecycleWrappersFor(this)

            // makeStyle manager for this instance
            this[RSKey].styleManager = makeStyleManagerFactory.createComponentManager(this)
        }

        // returns a unique name that identifies the base for CSS classes
        get componentName() {
            return this[RSKey].componentName
        }

        /* ENABLE/DISABLE FEATURES */
        disableHiddenProp() {
            if (this[RSKey].hiddenPropEnabled === null) {
                throw new HiddenPropDisabledError("disable")
            }
            this[RSKey].hiddenPropEnabled = false
        }

        enableHiddenProp() {
            if (this[RSKey].hiddenPropEnabled === null) {
                throw new HiddenPropDisabledError("enable")
            }
            this[RSKey].hiddenPropEnabled = true
        }

        forceUpdateStyles() {
            this[RSKey].styleManager.updateDynamicStyles()
        }
    }
}


/* COMPONENT HELPER FUNCTIONS */
function _bindLifecycleWrappersFor(componentInstance) {
    _bindRender(componentInstance)
    _bindComponentDidMount(componentInstance)
    _bindComponentDidUpdate(componentInstance)

    if (asyncSetStateEnabled) {
        _bindSetState(componentInstance)
    }
    if (asyncForceUpdateEnabled) {
        _bindForceUpdate(componentInstance)
    }
}

// used for auto className handling and updating hidden prop
function _bindRender(component) {
    const origRender = component[RSKey].originalRender
    // (for all bind functions) only wrap defined functions
    if (typeof origRender === "function") {
        component.render = () => {
            const fullResult = origRender.call(component)
            if (!fullResult || typeof fullResult !== "object") {
                // no further processing needed
                return fullResult
            }

            // define some secret properties...
            // NOTE: props must be used so the component instance can detect this
            // XXX: this does not work in strict mode for react; auto class naming feature
            // cannot work until this is resolved
            /*
            fullResult.props[RSKey] = {
                parentClassName: "", // used to chain className handling if render() returned a component
            }
            */

            // disables hidden prop on structures that cant support it
            // NOTE: arrays do not have props.style attributes; this breaks hidden prop
            if (Array.isArray(fullResult)) {
                if (component[RSKey].hiddenPropEnabled && console && console.warn) {
                    const name = component.componentName
                    console.warn(`Arrays returned from render() cannot use "hidden" prop. This feature will be disabled in component <${name} />. (To mute this message, disable hidden prop in component constructor.)`)
                }
                component[RSKey].hiddenPropEnabled = null // disables permanently
            }
            // NOTE: fragments do not have corresponding DOM elements; this breaks hidden prop
            else if (fullResult.type === React.Fragment) {
                if (component[RSKey].hiddenPropEnabled && console && console.warn) {
                    const name = component.componentName
                    console.warn(`React.Fragments returned from render() cannot use "hidden" prop. This feature will be disabled in component <${name} />. (To mute this message, disable hidden prop in component constructor.)`)
                }
                component[RSKey].hiddenPropEnabled = null // disables permanently
            }

            // NOTE: auto class naming is disabled
            /*
            const isElement = typeof fullResult.type === "string"
            const isComponent = typeof fullResult.type === "function"
            // apply className to elements if not given
            if (isElement) {
                if (autoClassNamingEnabled) {
                    if (!fullResult.props.className) {
                        fullResult.props.className = component.componentName
                    }
                }

                // grabs class name sent from parent (which happens if parent render() returned this directly)
                // NOTE: this is what does the actual "chaining" for component class names
                const parentClassName = component.props[RSKey].parentClassName
                if (parentClassName) {
                    fullResult.props.className += ' ' + parentClassName
                }
            }
            // tell the child component instance (through props) to apply this className
            else if (isComponent) {
                fullResult.props[RSKey].parentClassName = component.componentName
                // chain other classNames if this was rendered directly by parent too
                const parentClassName = component.props[RSKey].parentClassName
                if (parentClassName) {
                    fullResult.props[RSKey].className += ' ' + parentClassName
                }
            }
            */

            _handleHiddenProp(component, fullResult)
            return fullResult
        }
    }
}

// used to initialize makeStyle() properties
function _bindComponentDidMount(component) {
    const origMount = component[RSKey].originalComponentDidMount
    if (typeof origMount === "function") {
        component.componentDidMount = () => {
            const styleManager = component[RSKey].styleManager
            styleManager.initStyle() // before calling mount because static props should not rely on results from mount
            origMount.call(component)
            styleManager.updateDynamicStyles()
        }
    }
}

// used to update dynamic makeStyle() properties
function _bindComponentDidUpdate(component) {
    const origUpdate = component[RSKey].originalComponentDidUpdate
    if (typeof origUpdate === "function") {
        component.componentDidUpdate = () => {
            origUpdate.call(component)
            component[RSKey].styleManager.updateDynamicStyles()
        }
    }
}

// provides async/await functionality for setState()
function _bindSetState(component) {
    const origSetState = component[RSKey].originalSetState
    if (typeof origSetState === "function") {
        component.setState = (newState, callback = null) => {
            // NOTE: not the best way to do this... but this leaves it as syncronous as possible
            // (avoids promise rejecting for errors and lets React handle it normally/syncronously)
            let promiseResolve
            const promise = new Promise((resolve) => {
                promiseResolve = resolve
            })

            // intentionally outside Promise
            origSetState.call(component, newState, () => {
                if (typeof callback === "function") {
                    callback()
                }
                promiseResolve(component.state)
            })

            // make it awaitable!
            return promise
        }
    }
}

// provides async/await functionality for forceUpdate()
function _bindForceUpdate(component) {
    const origForceUpdate = component[RSKey].originalForceUpdate
    if (typeof origForceUpdate === "function") {
        component.forceUpdate = (callback = null) => {
            // NOTE: doing the same thing as setState() wrapper...
            let promiseResolve
            const promise = new Promise((resolve) => {
                promiseResolve = resolve
            })

            // intentionally outside Promise
            origForceUpdate.call(component, () => {
                if (typeof callback === "function") {
                    callback()
                }
                promiseResolve()
            })

            // make it awaitable!
            return promise
        }
    }
}

function _handleHiddenProp(component, renderResult) {
    // check if hidden prop is enabled globally and for the component type
    if (!hiddenPropEnabledGlobally || !component[RSKey].hiddenPropEnabled) {
        return
    }

    // get the correct JSX child hiding (determined by checking class name)
    const childHiding = _getChildJSXWithClass(component.componentName, renderResult)
    if (!childHiding) {
        return
    }

    // ensure props.style is an editable object
    if (typeof childHiding.props.style !== "object" || childHiding.props.style === null) {
        childHiding.props.style = {}
    }

    // update display prop according to hidden prop
    if (component.props.hidden) {
        childHiding.props.style.display = "none"
    }
}

function _getChildJSXWithClass(className, jsxElementOrArray) {
    let children = jsxElementOrArray // will be an array if not already
    if (!Array.isArray(children)) {
        // ensures element is an actual JSX object that can hold a className
        const jsxElement = jsxElementOrArray
        if (!jsxElement || typeof jsxElement !== "object") {
            return null
        }

        // main className test
        const elemClassName = jsxElement.props.className
        if (typeof elemClassName === "string" && elemClassName.split(' ').includes(className)) {
            return jsxElement
        }
        else {
            children = jsxElement.props.children
            if (!Array.isArray(children)) {
                children = [children]
            }
        }
    }

    // recursively check children classNames
    for (let i = 0; i < children.length; i++) {
        const childElem = children[i]
        const nextElem = _getChildJSXWithClass(className, childElem)
        if (nextElem) {
            // found it!
            return nextElem
        }
    }
    return null // never found anything in children either...
}

// wraps and exports React components
const Component = MyComponentFrom(React.Component)
const PureComponent = MyComponentFrom(React.PureComponent)

export default {
    Component, PureComponent,
    HiddenPropDisabledError,
    
    disableAutoClassNaming, disableHiddenProps, enableHiddenProp: enableHiddenProps,
    useAsyncSetState, getUnnamedComponentConstructor, rerunAnimationOn,
}
