import React from 'react'

// just an alias that allows auto-naming of an error...
class CustomError extends Error {
    constructor(message) {
        super(message)
        this.name = this.constructor.name
    }
}

/* COMPONENT DEFINITION */
// some errors...

// main mixin
function MyComponentFrom(ReactClass) {
    return class extends ReactClass {

    }
}





// TODO: remove this nasty...
class ReactStyles {
    /* PRODUCTION MODE */
    // disables certain features and enables performance optimizations
    static enableProduction() {
        this._checkPropDisabled = true;
        this._themeClassCheckDisabled = true;
    }

    /* COMPONENT STRUCTURE */
    // static class ReactStyles.Component
    static get Component() {
        if (!this._Component) {
            this._Component = this._MyComponentFrom(React.Component);
        }
        return this._Component;
    }

    // static class ReactStyles.PureComponent
    static get PureComponent() {
        if (!this._PureComponent) {
            this._PureComponent = this._MyComponentFrom(React.PureComponent);
        }
        return this._PureComponent;
    }

    // ReactStyles._MyComponentFrom(ReactClass) => class MyComponentMixin
    static _MyComponentFrom(ReactClass) {
        return class extends ReactClass {
            constructor(props) {
                super(props);
                this.__ReactStyles_propsToCheck = [["hidden", "possible-typeof", "boolean"]];
                this.__ReactStyles_dynamicStyles = [];
                this.enableHiddenProp();

                this.__ReactStyles_componentName = this.constructor.name || ReactStyles._getUnnamedComponentName(this.constructor);

                // binding component constructor (static) functions
                if (!this.constructor.__ReactStyles_boundStaticWrapperFuncs) {
                    this.constructor.__ReactStyles_bindGetDerivedStateFromProps();
                    this.constructor.__ReactStyles_boundStaticWrapperFuncs = true;
                }
                this.__ReactStyles_bindWrapperFuncs();
            }
            
            // TODO: required implementation
            get componentName() {
                return this.__ReactStyles_componentName;
            }

            /* PROP CHECKER */
            // in getter form so "const check = this.addCheckForProp" works
            get addCheckForProp() {
                return (prop, checkType, shouldBe) => {
                    if (typeof prop !== "string") {
                        throw new Error(`addCheckForProp() first argument must be a string`);
                    }
                    if (typeof checkType !== "string") {
                        throw new Error(`addCheckForProp() second argument must be a string`);
                    }

                    this.__ReactStyles_propsToCheck.push([prop, checkType, shouldBe]);
                };
            }

            // TODO: required implementation (split into public:disable and private:disablePermanently)
            disableHiddenProp(permanent = false) {
                this.__ReactStyles_shouldHandleHiddenProp = false;
                if (permanent) {
                    this.__ReactStyles_cannotEnableHiddenProp = true;
                }
            }
            // TODO: required implementation
            enableHiddenProp() {
                if (!this.__ReactStyles_cannotEnableHiddenProp) {
                    this.__ReactStyles_shouldHandleHiddenProp = true;
                }
            }

            // TODO: add ability to disable className='' handling

            __ReactStyles_checkProp(prop, checkType, shouldBe) {
                const className = this.componentName;
                const propVal = this.props[prop];

                // check and handle "possible-" keyword
                const possibleIdx = checkType.indexOf("possible-");
                if (possibleIdx >= 0) {
                    if (propVal === null || propVal === undefined) {
                        return;
                    }
                    checkType = checkType.slice(0, possibleIdx) + checkType.slice(possibleIdx + "possible-".length);
                }

                const shouldBeName = shouldBe.constructor && !["Function", "String"].includes(shouldBe.constructor.name) ? shouldBe.constructor.name : shouldBe.name ? shouldBe.name : shouldBe;

                const errorStart = `(for component ${className}) props.${prop}`;
                const gotStr = `got ${prop}='${propVal}' (type: ${typeof propVal})`;

                switch (checkType) {
                    case 'typeof':
                        {
                            if (shouldBe === "object" && !propVal) {
                                throw new Error(`${errorStart} must be a truthy object; ${gotStr}`);
                            }
                            if (typeof shouldBe !== "string") {
                                throw new Error(`#{errorStart} cannot compare typeof to ${shouldBeName}`);
                            }
                            if (typeof propVal !== shouldBe) {
                                throw new Error(`${errorStart} must be of type '${shouldBeName}'; ${gotStr}`);
                            }
                        }
                        break;

                    case 'instanceof':
                        {
                            if (!(propVal instanceof shouldBe)) {
                                throw new Error(`${errorStart} must be an instance of '${shouldBeName}'; ${gotStr}`);
                            }
                        }
                        break;

                    case 'lengthof':
                        {
                            if (typeof shouldBe !== 'number') {
                                throw new Error(`${errorStart} cannot compare size with non-number '${shouldBeName}'`);
                            }
                            if (!propVal || typeof propVal.length !== "number") {
                                throw new Error(`${errorStart} must have numerical .length property to determine size; ${gotStr}`);
                            }
                            if (propVal.length !== shouldBe) {
                                throw new Error(`${errorStart} is an invalid size (expected ${shouldBeName}, got ${propVal.length})`);
                            }
                        }
                        break;

                    case 'elementof':
                        {
                            if (typeof shouldBe !== "string") {
                                throw new Error(`${errorStart} must be given a string; ${gotStr}`);
                            }
                            if (!propVal || typeof propVal.type !== "string") {
                                throw new Error(`${errorStart} is not a valid element representation; ${gotStr}`);
                            }
                            if (propVal.type !== shouldBe) {
                                throw new Error(`${errorStart} is not an element of type ${shouldBeName}; got ${prop}=<${propVal.type} ... />`);
                            }
                        }

                    case 'componentof':
                        {
                            if (typeof shouldBe === "string") {
                                throw new Error(`${errorStart} must be compared with literal function, not "${shouldBeName}" (type string)`);
                            }
                            if (!propVal && typeof propVal.type !== "function" && typeof propVal.type !== "symbol") {
                                throw new Error(`${errorStart} is not a valid component representation; ${gotStr}`);
                            }
                            if (propVal.type !== shouldBe) {
                                throw new Error(`${errorStart} is not a component of type ${shouldBeName}; got ${prop}=<${propVal.type.name} ... />`);
                            }
                        }
                        break;

                    case 'custom':
                        {
                            if (typeof shouldBe !== "function") {
                                throw new Error(`${errorStart} must be custom-checked with a function`);
                            }
                            const message = shouldBe(propVal);
                            if (message) {
                                throw new Error(`${errorStart} failed a custom property check: ${message}`);
                            }
                        }
                        break;

                    default:
                        {
                            throw new Error(`MyReactLib property checker received an invalid second argument: '${checkType}'`);
                        }
                        break;
                }
            }

            __ReactStyles_checkProps() {
                if (ReactStyles._checkPropDisabled) {
                    return;
                }

                for (const args of this.__ReactStyles_propsToCheck) {
                    this.__ReactStyles_checkProp(...args);
                }
            }

            /* REACT WRAPPER BINDINGS */
            // most wrapper functions just provide error checking to prevent React from crashing completely
            // static bindings
            static __ReactStyles_bindGetDerivedStateFromProps() {
                this.__ReactStyles_origGetDerivedStateFromProps = this.getDerivedStateFromProps;
                this.getDerivedStateFromProps = (props, state) => {
                    if (typeof this.__ReactStyles_origGetDerivedStateFromProps === "function") {
                        try {
                            return this.__ReactStyles_origGetDerivedStateFromProps(props, state);
                        } catch (error) {
                            try {
                                const cons = console;
                                cons.logError(error);
                            } catch (_) {
                                // no console!
                            }
                            return state;
                        }
                    }
                };
            }

            // instance bindings
            // TODO: required implementation
            __ReactStyles_bindWrapperFuncs() {
                this.__ReactStyles_bindRender();
                this.__ReactStyles_bindMakeStyle();
                this.__ReactStyles_bindComponentDidMount();
                this.__ReactStyles_bindShouldComponentUpdate();
                this.__ReactStyles_bindComponentDidUpdate();
                this.__ReactStyles_bindSetState();
                this.__ReactStyles_bindForceUpdate();
            }

            // TODO: required implementation
            __ReactStyles_bindRender() {
                this.__ReactStyles_origRender = this.render;
                this.render = () => {
                    if (typeof this.__ReactStyles_origRender !== "function") {
                        throw new Error(`Component <${this.componentName} /> must have a render function`);
                    }

                    // these are the same, unless fullResult is an array (see below)
                    let fullResult;
                    // TODO: remove try/catch (both) from implementation
                    try {
                        // TODO: remove from implementation
                        this.__ReactStyles_checkProps(); // checked here because shouldComponentUpdate() is not always run (first render, forceUpdate(), etc)
                        
                        fullResult = this.__ReactStyles_origRender();

                        // TODO: remove from implementation 
                        if (typeof fullResult !== "object") {
                            throw new Error(`Component <${this.componentName} />.render() must return a React/JSX representation of a DOM element`);
                        }
                    } catch (error) {
                        try {
                            // avoid console dot warnings
                            const cons = console;
                            cons.logError(`(<${this.componentName} /> render failed!) ${error}`);
                        } catch (_) {
                            // do nuthin
                        }
                        return React.createElement(
                            "div",
                            { style: { color: "white", ["background-color"]: "red" } },
                            "render error"
                        );
                    }

                    // TODO: required implementation
                    // disables ref-based props for arrays and fragments
                    if (Array.isArray(fullResult)) {
                        if (this.__ReactStyles_shouldHandleHiddenProp) {
                            this.disableHiddenProp(true);
                            try {
                                const cons = console;
                                cons.logWarning(`Arrays in render() cannot use "hidden" prop; will be disabled (in component '${this.componentName}')`);
                            } catch (_) {
                                // okay, console doesnt exist...
                            }
                        }
                    }
                    // TODO: required implementation
                    else if (fullResult.type === React.Fragment) {
                        if (this.__ReactStyles_shouldHandleHiddenProp) {
                            this.disableHiddenProp(true);
                            try {
                                const cons = console;
                                cons.logWarning(`React.Fragments in render() cannot use "hidden" prop; will be disabled (in component '${this.componentName}')`);
                            } catch (_) {
                                // okay, console doesnt exist...
                            }
                        }
                    }
                    
                    // TODO: required implementation (also document this is determining class names in case rendering another component)
                    // represents html element
                    if (typeof fullResult.type === "string") {
                        if (!fullResult.props.className) {
                            fullResult.props.className = this.componentName;
                        }

                        if (this.props.__ReactStyles_parentClassName) {
                            fullResult.props.className += ' ' + this.props.__ReactStyles_parentClassName;
                        }
                    }
                    // represents class component
                    else {
                            // tells future render to include this class (since it "is" this component, style-wise)
                            fullResult.props.__ReactStyles_parentClassName = this.componentName;
                            if (this.props.__ReactStyles_parentClassName) {
                                fullResult.props.__ReactStyles_parentClassName += ' ' + this.props.__ReactStyles_parentClassName;
                            }
                        }

                    this.__ReactStyles_handleHiddenProp(fullResult);
                    return fullResult;
                };
            }
            
            // TODO: required implementation
            __ReactStyles_bindMakeStyle() {
                this.__ReactStyles_origMakeStyle = this.makeStyle;
                this.makeStyle = when => {
                    if (typeof this.__ReactStyles_origMakeStyle !== "function") {
                        return; // no reason to run if there is no makeStyle()
                    }

                    try {
                        const styleRep = this.__ReactStyles_origMakeStyle(when);
                        if (typeof styleRep !== "object" || !(styleRep.type === undefined || styleRep.type === "style")) {
                            throw new Error(`${this.componentName}.makeStyle() must return either an object representing CSS prop-value pairs, or a JSX style element with a single (string) child`);
                        }
                        return styleRep;
                    } catch (error) {
                        try {
                            // avoid console dot warnings
                            const cons = console;
                            cons.logError(`(<${this.componentName} /> style-making failed!) ${error}`);
                        } catch (_) {
                            // do nuthin
                        }
                    }
                };
            }

            // TODO: required implementation
            __ReactStyles_bindComponentDidMount() {
                this.__ReactStyles_origComponentDidMount = this.componentDidMount;
                this.componentDidMount = () => {
                    // initialized here so this.state could exist for makeStyle() use
                    this.__ReactStyles_initStyle(); // TODO: required implementation

                    if (typeof this.__ReactStyles_origComponentDidMount === "function") {
                        try {
                            this.__ReactStyles_origComponentDidMount();
                        } catch (error) {
                            try {
                                const cons = console;
                                cons.logError(`(<${this.componentName} /> mounting failed!) ${error}`);
                            } catch (_) {
                                // welp, guess you wont know
                            }
                        }
                    }
                    this.__ReactStyles_updateDynamicStyles();
                };
            }

            __ReactStyles_bindShouldComponentUpdate() {
                this.__ReactStyles_origShouldComponentUpdate = this.shouldComponentUpdate;
                this.shouldComponentUpdate = (nextProps, nextState) => {
                    if (typeof this.__ReactStyles_origShouldComponentUpdate === "function") {
                        try {
                            return nextProps.shouldUpdate || this.__ReactStyles_origShouldComponentUpdate(nextProps, nextState);
                        } catch (error) {
                            try {
                                const cons = console;
                                cons.logError(`(<${this.componentName} /> should-updating failed!) ${error}`);
                            } catch (_) {
                                // welp, guess you wont know
                            }
                            return false; // dont update on errors
                        }
                    } else {
                            return true; // no checking provided!
                        }
                };
            }

            // TODO: required implementation
            __ReactStyles_bindComponentDidUpdate() {
                this.__ReactStyles_origComponentDidUpdate = this.componentDidUpdate;
                this.componentDidUpdate = () => {
                    if (typeof this.__ReactStyles_origComponentDidUpdate === "function") {
                        try {
                            this.__ReactStyles_origComponentDidUpdate();
                        } catch (error) {
                            try {
                                const cons = console;
                                cons.logError(`(<${this.componentName} /> updating failed!) ${error}`);
                            } catch (_) {
                                // welp, guess you wont know
                            }
                        }
                    }
                    this.__ReactStyles_updateDynamicStyles(); // TODO: required implementation
                };
            }

            // NOTE: a few notes for this function (its awesome!)
            //  - it wont crash the whole app if either callback errors
            //  - if there are errors (and a console), it will warn on the console
            //  - it is both awaitable and allows a callback as a second argument

            // TODO: required implementation (make it optional; enable first)
            __ReactStyles_bindSetState() {
                this.__ReactStyles_origSetState = this.setState;
                this.setState = (newState = {}, callback = null) => {
                    return new Promise((res, rej) => {
                        this.__ReactStyles_origSetState((state, props) => {
                            if (typeof newState === "function") {
                                try {
                                    return newState(state, props);
                                } catch (error) {
                                    this.__ReactStyles_setStateFail(error);
                                    rej(error);
                                    return {};
                                }
                            } else {
                                return newState;
                            }
                        }, () => {
                            if (typeof callback === "function") {
                                try {
                                    callback();
                                } catch (error) {
                                    this.__ReactStyles_setStateFail(error);
                                    rej(error);
                                }
                            }
                            res(this.state);
                        });
                    });
                };
            }

            __ReactStyles_setStateFail(error) {
                try {
                    // avoid console dot warnings
                    const cons = console;
                    cons.logError(`(<${this.componentName} /> setState failed!) ${error}`);
                } catch (_) {
                    // do nuthin
                }
            }

            // TODO: make this optional (alongside setState())
            __ReactStyles_bindForceUpdate() {
                this.__ReactStyles_origForceUpdate = this.forceUpdate;
                this.forceUpdate = (callback = null) => {
                    return new Promise((res, rej) => {
                        this.__ReactStyles_origForceUpdate(() => {
                            if (typeof callback === "function") {
                                try {
                                    callback();
                                } catch (error) {
                                    this.__ReactStyles_forceUpdateFail(error);
                                    rej(error);
                                }
                            }
                            res();
                        });
                    });
                };
            }

            __ReactStyles_forceUpdateFail(error) {
                try {
                    // avoid console dot warnings
                    const cons = console;
                    cons.logError(`(<${this.componentName} /> forceUpdate failed!) ${error}`);
                } catch (_) {
                    // do nuthin
                }
            }

            /* CSS STYLE IMPLEMENTATION */
            __ReactStyles_initStyle() {
                const style = this.makeStyle(ReactStyles._makeStyleWhen);
                if (ReactStyles._shouldRenderStyle(this.componentName)) {
                    if (style === undefined) {
                        // not much to do...
                        ReactStyles._renderStyle(this.componentName, '');
                    } else if (style.type === "style") {
                        try {
                            const cons = console; // avoid console dot warnings
                            cons.logWarning(`${this.componentName}.makeStyle() returned a style element; this is legacy functionality, so it is better to use object notation`);
                        } catch (_) {
                            // welp, no console exists...
                        }
                        ReactStyles._renderStyle(this.componentName, style.props.children);
                    } else if (typeof style === "object") {
                        const processedStyle = this.__ReactStyles_parseStyle(style, "normalMode");
                        ReactStyles._renderStyle(this.componentName, processedStyle);
                    }
                }

                // compiles the dynamic styles, but without all the baggy strings (optimization)
                else {
                        if (style) {
                            const isJSXElement = style.type;
                            if (!isJSXElement) {
                                this.__ReactStyles_parseStyle(style, "dynamicOnly");
                            }
                        }
                    }
            }

            __ReactStyles_parseStyle(style, mode = "normalMode") {
                return ReactStyles._parseStyleAs(mode, '.' + this.componentName, style, this.__ReactStyles_dynamicStyles);
            }

            // checks if dynamic styles need to be updated, and if so, renders whats needed
            __ReactStyles_updateDynamicStyles() {
                ReactStyles._renderDynamicStyles(this.__ReactStyles_dynamicStyles, this);
                if (typeof this.componentDidUpdateStyle === "function") {
                    this.componentDidUpdateStyle();
                }
            }
            forceUpdateStyles() {
                this.__ReactStyles_updateDynamicStyles();
            }

            __ReactStyles_handleHiddenProp(result) {
                if (!this.__ReactStyles_shouldHandleHiddenProp) {
                    return;
                }

                const hidingChild = ReactStyles._getChildWithClass(this.componentName, result);
                if (!hidingChild) {
                    return;
                }

                if (typeof hidingChild.props.style !== "object" || hidingChild.props.style === null) {
                    hidingChild.props.style = {};
                }

                // update built-in hidden prop
                if (this.props.hidden) {
                    hidingChild.props.style.display = "none";
                }
            }
        };
    }

    /* RENDER RESULT MANIPULATION */
    static _getChildWithClass(name, result) {
        let children = result; // will be an array somehow by the end of this block
        if (!Array.isArray(result)) {
            if (!result || typeof result !== "object") {
                return null;
            }
            if (typeof result.props.className === "string" && result.props.className.split(' ').includes(name)) {
                return result;
            }

            children = result.props.children;
            if (!Array.isArray(children)) {
                children = [children];
            }
        }

        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const nextResult = this._getChildWithClass(name, child);
            if (nextResult) {
                return nextResult;
            }
        }

        return null;
    }

    // certain components (like class expressions) dont have names, so this gives them one
    static _getUnnamedComponentName(constructor) {
        if (!this._unnamedComponentList) {
            this._unnamedComponentList = {};
            this._unnamedComponentNameList = {};
        }
        if (!this._unnamedCount) {
            this._unnamedCount = 0;
        }

        if (!this._unnamedComponentList[constructor]) {
            const name = `UnnamedComponent${this._unnamedCount++}`;
            this._unnamedComponentList[constructor] = name;
            this._unnamedComponentNameList[name] = constructor;
        }
        return this._unnamedComponentList[constructor];
    }

    // provides a way to get the original constructor of an unnamed component
    static getUnnamedComponent(n) {
        return this._unnamedComponentNameList[`UnnamedComponent${n}`];
    }

    /* STYLE RENDERING (STATIC) */
    // cache of components that have rendered
    // ReactStyles._stylesToRender{}
    static get _stylesToRender() {
        if (!this.__stylesToRender) {
            this.__stylesToRender = {};
        }
        return this.__stylesToRender;
    }

    // returns if component class has already been rendered before
    static _shouldRenderStyle(componentClass) {
        return this._stylesToRender[componentClass] ? false : true;
    }

    // saves a components style, and tells React to update the main div
    static _renderStyle(componentClass, styleStr) {
        this._stylesToRender[componentClass] = true;
        this._loadStyle(styleStr);
    }

    static _loadStyle(styleStr) {
        // initializing static and dynamic styles...
        if (!this._stylesContainer) {
            // static styles
            this._stylesContainer = document.createElement("div");
            document.head.appendChild(this._stylesContainer);

            // dynamic styles (including themes)
            // NOTE: these can be initialized here because static styles are initialized before dynamic ones
            this._dynamicStylesContainer = document.createElement("div");
            document.head.appendChild(this._dynamicStylesContainer);

            this._dynamicStyleRefs = {};

            // theme styles
            this._themeStylesElem = document.createElement("style");
            document.head.appendChild(this._themeStylesElem);
            if (this._setThemeStylesContainerOnInit) {
                this._themeStylesElem.innerHTML = this._setThemeStylesContainerOnInit;
                delete this._setThemeStylesContainerOnInit;
            }
        }
        if (styleStr) {
            const style = document.createElement("style");
            style.innerHTML = styleStr;
            this._stylesContainer.appendChild(style);
        }
    }

    /* STYLE RENDERING (DYNAMIC) */
    // creates a style element for a single class line
    static _createDynamicStyleElem(classLine) {
        const elem = document.createElement("style");
        this._dynamicStylesContainer.appendChild(elem);
        this._dynamicStyleRefs[classLine] = elem;
        return elem;
    }

    // renders (creating elements if needed) a list of class lines,
    // and only modifies elements when the class lines change
    static _renderDynamicStyles(styleStack, componentRef) {
        if (!this._lastStyleValues) {
            this._lastStyleValues = {};
        }

        let mergedClassLines = {};
        const initStyleStackLength = styleStack.length;
        styleStack = styleStack.concat(this._dynamicThemeStyles || []); // "|| []" in case themes arent initialized yet
        for (let i = 0; i < styleStack.length; i++) {
            const styleData = styleStack[i];
            const { classLine, prop, getValue } = styleData;

            let newVal;
            try {
                newVal = getValue(componentRef);

                // skip the theme when callback does not apply to this component
                if (newVal === ReactStyles._themeSkipped) {
                    continue;
                }
            } catch (error) {
                try {
                    const cons = console; // avoid... yeah
                    if (i >= initStyleStackLength) {
                        cons.logError(`(Theme (for <${componentRef.componentName} />) style-updating failed!) ${error}`);
                    } else {
                        cons.logError(`(<${componentRef.componentName} /> style-updating failed!) ${error}`);
                    }
                } catch (_) {
                    // no console!
                }
            }

            if (!mergedClassLines[classLine]) {
                mergedClassLines[classLine] = "";
            }

            if (classLine.slice(0, 7) === "@keyfra") {
                mergedClassLines[classLine] += `${ReactStyles._parseCSSPropName(prop)} {${newVal}}n`;
            } else {
                mergedClassLines[classLine] += `${ReactStyles._parseCSSPropName(prop)}: ${newVal};n`;
            }
        }

        // applies merged style strings to their corresponding elements
        for (const classLine in mergedClassLines) {
            const props = mergedClassLines[classLine];
            let ref = this._dynamicStyleRefs[classLine];
            if (!ref) {
                ref = this._createDynamicStyleElem(classLine);
            }

            if (props !== this._lastStyleValues[classLine]) {
                ref.innerHTML = `${classLine} {${props}}`;
                this._lastStyleValues[classLine] = props;
            }
        }
    }

    /* COMPONENT-CSS FUNCTIONS */
    // reruns the animation defined in css
    // NOTE: must be given the css class name that defines an "animation-name" property
    static rerunAnimationOn(elem, className) {
        elem.classList.remove(className);
        void elem.offsetWidth;
        elem.classList.add(className);
    }

    static _makeStyleWhen(subclass) {
        return "when=" + subclass;
    }

    // given a css class line and an object representing style, this generates a string full of css class rules
    // NOTE: "dynamicOnly" can be passed as the first argument to avoid constructing strings and only initialize dynamic function constructs (optimization)
    // NOTE: "themeMode" processes as a theme, and allows use of themeClassName
    static _parseStyleAs(mode, classLine, styleRep, dynStyleStack, themeClassName = null) {
        if (typeof styleRep !== "object") {
            return ""; // pretty css-like way to do it, right?
        }

        const whenKey = 'when=';
        // these strings will only be modified if the mode !== "dynamicOnly"
        let styleContent = "";
        let subClassStr = "";
        let childClassStr = "";

        for (const prop in styleRep) {
            const value = styleRep[prop];

            // if it is a when() subclass...
            if (prop.slice(0, whenKey.length) === whenKey) {
                const whenProp = prop.slice(whenKey.length);
                let subClassLine = classLine;
                // forces props that start with a letter to be a '.' class
                const code = whenProp.charCodeAt(0);
                if (code >= 65 && code <= 90 || code >= 97 && code <= 122) {
                    subClassLine += '.';
                }
                subClassLine += whenProp;

                if (mode === "dynamicOnly") {
                    this._parseStyleAs(mode, subClassLine, value, dynStyleStack, themeClassName);
                } else {
                    subClassStr += this._parseStyleAs(mode, subClassLine, value, dynStyleStack, themeClassName);
                }
            }

            // if it is a child class...
            else if (typeof value === "object") {
                    // special: @keyframes
                    if (prop[0] === '@') {
                        if (mode === "dynamicOnly") {
                            this._parseKeyFrames(mode, prop, value, dynStyleStack);
                        } else {
                            childClassStr += this._parseKeyFrames(mode, prop, value, dynStyleStack);
                        }
                    }

                    // special: raw line definition
                    else if (prop[0] === '=') {
                            if (mode === "dynamicOnly") {
                                this._parseStyleAs(mode, prop.slice(1), value, dynStyleStack, themeClassName);
                            } else {
                                childClassStr += this._parseStyleAs(mode, prop.slice(1), value, dynStyleStack, themeClassName);
                            }
                        }

                        // regular subclass
                        else {
                                let childSep = ' ';
                                // if first character is a capital letter, its a subclass name (allows using things like button and *)
                                const code = prop.charCodeAt(0);
                                if (code >= 65 && code <= 90) {
                                    childSep += '.';
                                }

                                const childClassLine = classLine + childSep + prop;
                                if (mode === "dynamicOnly") {
                                    this._parseStyleAs(mode, childClassLine, value, dynStyleStack, themeClassName);
                                } else {
                                    childClassStr += this._parseStyleAs(mode, childClassLine, value, dynStyleStack, themeClassName);
                                }
                            }
                }

                // if it is a dynamic/updatable property...
                else if (typeof value === "function") {
                        if (mode === "themeMode") {
                            const getValue = ref => {
                                // for themes, callbacks should only be called on the correct components
                                if (ref.constructor.name === themeClassName) {
                                    return value(ref);
                                } else {
                                    return this._themeSkipped;
                                }
                            };

                            // keeps track of dynamic theme styles to delete when a new theme is selected
                            dynStyleStack.push({ classLine, prop, getValue });
                        } else {
                            dynStyleStack.push({ classLine, prop, getValue: value });
                        }
                    }

                    // if it is a regular css property
                    else {
                            if (mode !== "dynamicOnly") {
                                const propName = this._parseCSSPropName(prop);
                                styleContent += `${propName}: ${value};n`;
                            }
                        }
        }

        if (mode === "dynamicOnly") {
            return;
        }
        // increases specificity to override component makeStyle() statements
        else if (mode === "themeMode") {
                return `html:not(.__THIS_INCREASES_SPECIFICITY__) ${classLine} {n${styleContent}}n${subClassStr}${childClassStr}`;
            } else {
                return `${classLine} {n${styleContent}}n${subClassStr}${childClassStr}`;
            }
    }

    // changes "backgroundColor" to "background-color"
    static _parseCSSPropName(name) {
        let newName = "";
        for (let i = 0; i < name.length; i++) {
            const char = name[i];
            if (char === char.toUpperCase()) {
                newName += '-' + char.toLowerCase();
            } else {
                newName += char;
            }
        }
        return newName;
    }

    // creates strings from keyframe object representations
    static _parseKeyFrames(mode, frameLine, value, dynStyleStack) {
        if (typeof value !== "object") {
            return "";
        }

        let frameRules = "";
        let dynFrameRules = [];
        let useDynRules = false;
        for (let frameTime in value) {
            const frameTimeRules = value[frameTime];
            const frameTimeInt = parseInt(frameTime);
            if (frameTimeInt || frameTimeInt === 0) {
                frameTime = frameTimeInt + '%';
            }

            let rulesStr = "";
            let rulesFuncPairs = [];
            for (const ruleProp in frameTimeRules) {
                const ruleVal = frameTimeRules[ruleProp];
                if (typeof ruleVal === "function") {
                    useDynRules = true;
                }

                if (!useDynRules && mode !== "dynamicOnly") {
                    rulesStr += `${ruleProp}: ${ruleVal};n`;
                }
                // NOTE: must keep track in case dynamic rules must be used in later loops
                rulesFuncPairs.push({ prop: ruleProp, value: ruleVal });
            }

            if (!useDynRules && mode !== "dynamicOnly") {
                frameRules += `${frameTime} {n${rulesStr}}n`;
            }

            const rulesFunc = ref => {
                let propsStr = "";
                for (let i = 0; i < rulesFuncPairs.length; i++) {
                    let { prop, value } = rulesFuncPairs[i];
                    if (typeof value === "function") {
                        value = value(ref);
                    }
                    propsStr += `${prop}: ${value};n`;
                }
                return propsStr;
            };
            dynFrameRules.push({
                classLine: frameLine,
                prop: frameTime,
                getValue: rulesFunc
            });
        }

        if (!useDynRules) {
            return `${frameLine} {n${frameRules}}n`;
        } else {
            for (let i = 0; i < dynFrameRules.length; i++) {
                dynStyleStack.push(dynFrameRules[i]);
            }
            return '';
        }
    }

    /* THEME FUNCTIONS */
    // creates a theme preset
    // NOTE: names for the first layer of objects should be
    // names of components, NOT abstract CSS class names
    static registerTheme(name, styleRepOrCallback) {
        if (!this._registeredThemes) {
            this._registeredThemes = {};
        }

        if (name.includes(',')) {
            throw new Error(`Theme names cannot contain ',' (in '${name}')`);
        }

        let styleRep = styleRepOrCallback;
        if (typeof styleRep === "function") {
            styleRep = styleRep(ReactStyles._makeStyleWhen);
        }

        const extStr = styleRep.extends;
        if (typeof extStr === "string") {
            delete styleRep.extends;
            this._mixinTheme(styleRep, this._registeredThemes[extStr]);
        }

        this._registeredThemes[name] = styleRep;
    }

    static get registeredThemes() {
        let themes = [];
        for (const themeName in this._registeredThemes) {
            themes.push(themeName);
        }
        return themes;
    }

    // returns a theme as a css style string
    static _parseTheme(styleRep) {
        let styleStr = "";
        for (const prop in styleRep) {
            let boundCompName = prop;
            const isComp = this._evalCheckIsComponent(prop);
            if (!isComp) {
                boundCompName = "";
                if (!this._themeClassCheckDisabled) {
                    try {
                        const cons = console;
                        cons.logWarning(`Selected theme root property '${prop}' is not a ReactStyles.Component (some features will not work properly)`);
                    } catch (_) {
                        // do nuthin
                    }
                }
            }

            const value = styleRep[prop];
            if (typeof value === "object") {
                const notStr = ":not(.__THIS_INCREASES_SPECIFICITY__)";
                styleStr += this._parseStyleAs("themeMode", '.' + prop + notStr, value, this._dynamicThemeStyles, boundCompName);
            }
        }
        return styleStr;
    }

    static _evalCheckIsComponent(name) {
        try {
            const result = eval(name);
            if (result && (result.prototype instanceof this.Component || result.prototype instanceof this.PureComponent)) {
                return result;
            }
            return null;
        } catch (error) {
            if ((error + '').includes("access lexical declaration")) {
                return name;
            }
            return null;
        }
    }

    static get _themeSkipped() {
        if (!this.__themeSkipped) {
            this.__themeSkipped = Symbol();
        }
        return this.__themeSkipped;
    }

    static get selectedTheme() {
        return this._selectedTheme;
    }
    static set selectedTheme(names) {
        if (!(names instanceof Array)) {
            names = [names];
        }
        this._selectedTheme = names;

        // resets previous dynamic properties defined in themes
        if (this._dynamicStyleRefs) {
            // (in case there hasnt been a render yet)
            // "|| []" is used since this also initializes this._dynamicThemeStyles
            for (let i = 0; i < (this._dynamicThemeStyles || []).length; i++) {
                const { classLine } = this._dynamicThemeStyles[i];
                const ref = this._dynamicStyleRefs[classLine];
                if (ref) {
                    // is undefined when classLine is tracked but theme reselected without updating at some point
                    ref.innerHTML = "";
                }
            }
        }
        this._dynamicThemeStyles = [];

        let newTheme = {};
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            const theme = this._registeredThemes[name];
            if (theme) {
                this._mixinTheme(newTheme, theme);
            }
        }

        const finalStyle = this._parseTheme(newTheme);
        if (this._themeStylesElem) {
            this._themeStylesElem.innerHTML = finalStyle;
        } else {
            this._setThemeStylesContainerOnInit = finalStyle;
        }
    }

    static _combineThemes(...themes) {
        let theme = {};
        for (let i = 0; i < themes.length; i++) {
            this._mixinTheme(theme, themes[i]);
        }
        return theme;
    }
    // modifies theme to include undefined properties from nextTheme, without
    // modifying nextTheme
    static _mixinTheme(theme, nextTheme) {
        if (typeof nextTheme !== "object") {
            return;
        }

        for (const prop in nextTheme) {
            const value = nextTheme[prop];
            if (!value) {
                continue;
            }

            const currValue = theme[prop];
            if (!currValue) {
                if (typeof value === "object") {
                    theme[prop] = {};
                    this._mixinTheme(theme[prop], value);
                } else {
                    theme[prop] = value;
                }
            } else if (typeof currValue === "object") {
                this._mixinTheme(currValue, value); // currValue can be modified
            }
        }
    }

    // register a name for a css property
    static registerPreset(name, valueObj, mode = "warn") {
        const currVal = this._registeredPresets[name];
        if (!currVal || mode === "overwrite") {
            if (typeof valueObj === "string") {
                const value = valueObj;
                valueObj = { value, type: "prop" };
            } else if (!valueObj.type) {
                valueObj.type = "prop";
            } else if (!["prop", "color"].includes(valueObj.type)) {
                throw new Error(`Cannot register preset of invalid type '${valueObj.type}'`);
            }
            this._registeredPresets[name] = valueObj;
        } else if (mode === "warn") {
            try {
                const cons = console;
                cons.logWarning(`ReactStyles preset '${name}' already registered; pass "overwrite" as the third argument to override`);
            } catch (_) {
                // kay, no displaying of logs for you..
            }
        } else if (mode === "nowarn") {
            // no warn, no overwrite
        }
    }

    // get the css-ready property string from a preset name
    static getPreset(name, options = {}) {
        const value = this._registeredPresets[name];
        if (!value) {
            throw new Error(`ReactStyles preset '${name}' does not exist`);
        }

        let valueStr;
        if (value.type === "color") {
            if (typeof options.alpha === "number" || typeof options.alpha === "string") {
                valueStr = `rgba(${value.value}, ${options.alpha})`;
            } else {
                valueStr = `rgb(${value.value})`;
            }
        } else if (value.type === "prop") {
            valueStr = value.value;
        }

        return valueStr;
    }

    // generates a "blueprint" theme that can be filled with values
    static registerThemeFromBase(name, styleRepCallback, fillDefs) {
        if (typeof styleRepCallback !== "function") {
            throw new Error(`ReactStyles can only register a theme from a base using a callback (as the second argument)`);
        }

        this.registerTheme(name, styleRepCallback(fillDefs, ReactStyles._makeStyleWhen));
    }

    static get _registeredPresets() {
        if (!this.__registeredPresets) {
            this.__registeredPresets = {};
        }
        return this.__registeredPresets;
    }

    static isColorDark(preset) {
        let rgbStr = this.getPreset(preset);

        let throwErr = false;
        if (rgbStr.slice(0, 4) !== "rgb(") {
            throwErr = true;
        }

        rgbStr = rgbStr.slice("rgb(".length, rgbStr.lastIndexOf(')'));
        const [red, green, blue] = rgbStr.split(',').map(str => {
            const asInt = parseInt(str);
            if (!asInt || throwErr) {
                throw new Error(`ReactStyles preset '${preset}' is not a valid color preset`);
            }
            return asInt;
        });

        const hsp = Math.sqrt(0.299 * red ** 2 + 0.587 * green ** 2 + 0.144 * blue ** 2);
        return hsp < 256 / 2;
    }
}

export default {
    Component: MyComponentFrom(React.Component),
    PureComponent: MyComponentFrom(React.PureComponent),
}
