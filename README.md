
# React Styles
React Styles is an add-on styling library that helps manage component styles in a CSS-like (and React-like) fashion. It also implements a theming/preset tool to help with managing app themes.

React Styles creates its own set of components that only add onto the original React component functionality. Turning any component into a React Styles component is as easy as extending a different `class`, if you are already using ES6 `class` syntax. **You must have React imported and working for this library to work.**

### Table of Contents
- [Main Features](#main-features)
	- [makeStyle()](#makeStyle)
	- [Custom prop: hidden](#custom-prop-hidden)
	- [Automatic className='...' handling](#automatic-classname-handling)
	- [Async setState()](#async-setstate)
- [makeStyle() Syntax](#makestyle-syntax)
	- [Case: function body](#case-function-body)
	- [Case: static properties](#case-static-properties)
	- [Case: dynamic properties](#case-dynamic-properties)
	- [Case: children](#case-children)
	- [Case: "when()" callback](#case-when-callback)
	- [Case: animations](#case-animations)
	- [Case: absolute properties](#case-absolute-properties)
- [Themes and Presets](#themes-and-presets)


## Main Features
React Styles provides its own component to work with. Don't worry, you won't need to change anything to migrate React components to these (unless you don't use ES6 `class` syntax; this is required). Simply extend the React Styles component instead and you're all ready to go!


### makeStyle()
The `makeStyle()` function is the bread-and-butter of React Styles. Everything ultimately hinges on this dynamic, and it is the main way to style your components (maybe other than using themes). This function will be explained in-depth in [this section](#makestyle-syntax).


### Custom prop: hidden
You might know of some built-in props like `ref` and `key`, and this is just like them. The `hidden` prop is handled by React Styles and simply does one thing: it hides your components. Easy!

Under the hood, all it is doing is setting `display: none` in the coresponding JSX element's `style` property. I've found this shortcut very handy in many components, but you don't need to use it if you don't want to. If you want to completely disable it's default behavior (say, if you want to use `hidden` for something else), just run `this.disableHiddenProp()` in the component's constructor. Alternatively, you can disable it for all components with `ReactStyles.disableHiddenProps()`.


### Automatic className='...' handling
React Styles components automatically attach their own name to whatever element `render()` returns. What this means is if you render a regular `<div />`, the `className` prop will automatically be set to `className="ComponentName"`. This even works if a component immediately returns another component (so long as the chain of components all the way to the element are React Styles components!).

A small caveat, which only applies if the result of `render()` represents an *element* (not a component). React Styles will only automatically set the `className` if the element in question has not already provided it. This allows more control (and less confusion) in case the component renders its own wrapper, or if `className` needs to be managed more intricately.

If you would like to disable this feature, you can run `ReactStyles.disableAutoClassNaming()`, which will apply to any subsequent component renders.


### Async setState()
React's `setState()` function is very common throughout components. However, one of the key things that bothered me is it is not asyncronous! If you like to use ES6 `async/await` syntax, then lucky for you React Styles provides a `setState()` patch which returns an awaitable `Promise`! All you need to do is run `ReactStyles.useAsyncSetState()` at the beginning of your program, and you are good to go! (You can still use the second `callback` argument, in case other code already depends on it).

Running `useAsyncSetState()` will also change the `forceUpdate()` function in a like manner.
    

## makeStyle() Syntax
This section explains the syntax of using `makeStyle()`. This function is called before the component mounts. It returns a single object representing the style layout of a component. An example might look like this:
```
makeStyle(when) {
    // case: function body
    return {
        // case: static properties
        color: "white",
        backgroundColor: "blue",
        "background-color": "blue",
        
        // case: dynamic properties
        color: (ref) => {
            return "red"
        },
        
        // case: children
        ChildComponent: {
            // ...
        },
        div: {
            h1: {
                // ...
            },
        },
        ">button": {
            // ...
        },
        
        // case: "when()" callback
        [when("Square")]: { // notice [...]
            [when(":active")]: {
                // ...
            },
        },
        [when(":active")]: {
            // ...
        },
        
        // case: animations
        "@keyframes ComponentName-AnimationNameHere": {
            from: {
                // ...
            },
            50: {
                // ...
            },
            "60%": {
                // ...
            },
        },
        
        // case: absolute properties
        "=.Component-Container": {
            // ...
        },
    }
}
```
Whew, that was a lot! Let's break this down a bit...


### Case: function body
```
return {
    // ...
}
```
`makeStyle()` is only expected to return a regular JS object, representing a layout of how to style the component. This will eventually be converted to plain CSS.

All of these examples will assume the name of the component is "ComponentName".


### Case: static properties
```
color: "white",
backgroundColor: "blue",
"background-color": "blue",
```
CSS properties are defined by string values. The example above shows defining the property `color` with the value `"white"`. It also shows two valid ways to define the `background-color` property, which has the value of `"blue"`.

These properties will compile to a CSS definition like so:
```
.ComponentName {
    color: white;
    background-color: blue;
}
```


### Case: dynamic properties
```
color: (ref) => {
    return "red"
},
```
Dynamic properties are a little interesting... They probably don't work quite how one would expect. They are defined by a function value, and run on these basic rules:
1. They are updated/called whenever any component rerenders.
2. Their return values apply to ALL components of the same name.

The `ref` value that is passed to the function is equivelant to `this` (when using ES6 `class` syntax). While the `ref` might not be useful in `makeStyle()` itself, its main purpose is found when creating themes. More on that later.

To conceptualize this in CSS terms, imagine a "dynamic property" as a "`var()` variable", which is updated after any component updates. The example above works similarly to these CSS rules:
```
:root {
    --component-color: "red",
}
.ComponentName {
    color: var(--component-color);
}
```

The actual implementation of a dynamic property does not work this way, since changing CSS variables is slow and inefficient. Instead, each component will be given a dedicated style rule for all properties (if any) that are dynamic.

Usage of dynamic properties is uncommon, since technically it is legacy functionality. The main purpose of their existance was to help React Styles maintain multiple themes, however this is not how themes are managed anymore.

One last tip: You can call `.forceUpdateStyles()` on a component instance to, well, force update any dynamic styles you have defined. However if using dynamic styles in the first place is rare, then you likely will never have to touch this function.


### Case: children
```
ChildComponent: {
    // ...
},
div: {
    h1: {
        // ...
    },
},
">button": {
    // ...
},
```
If you have ever used [less](http://lesscss.org/) before, this should look somewhat familiar to you. Children styles are defined with object values. Names starting with a capital letter represent children components, while names starting with a lowercase letter represent HTML elements. This is inspired by the way Babel handles JSX syntax; it is the difference between `<div />` and `<Component />`.

Any nested child properties (shown by the div ---> h1 example) are parsed identically like and recursively with the main `makeStyle()` object. All of these example properties will be compiled to these CSS rules:
```
.ComponentName .ChildComponent {
    /* component children properties */
}
.ComponentName div {
    /* div children properties */
}
.ComponentName div h1 {
    /* h1 children properties */
}
.ComponentName >button {
    /* immediate button children properties */
}
```

Note that due to [CSS specificity rules](https://www.w3schools.com/css/css_specificity.asp), parent components can override the styles provided by the ChildComponent `makeStyle()` results. This is intentional, and allows for parents to control the specific implementation of a child, while still retaining an overall "default" style defined within the child's `makeStyle()`. A similar principle also allows React Styles themes to work (they can override any component's `makeStyle()` results).


### Case: "when()" callback
```
[when("Square")]: { // notice [...]
    [when(":active")]: {
        // ...
    }
},
[when(":active")]: {
    // ...
},
```
The `when()` callback is used to describe what styles a component should use "when" in a certain state. This can include anything from custom CSS classes to pseudo-classes; basically anything you want immediately after `.ComponentName`.

An important syntax to notice is the `[square brackets]` around the call to `when()`. This is required by JavaScript, and is known as a "dynamic key". The `when()` callback generates a special key that React Styles can use to know that the property describes a CSS class, instead of processing it as a regular CSS property.

The examples above will produce the following CSS:
```
.ComponentName.Square {
    /* square properties */
}
.ComponentName.Square:active {
    /* active square properties */
}
.ComponentName:active {
    /* active component properties */
}
```

One last tip regarding this function. You may wish to have many subclasses of a component acting together in CSS. It is permitted to chain these all inside a single `when()` call. For example, this is a completely valid use of `when()` (including the leading '.'):
```
[when(".Square.selected.__something_very_special__:active")]: {
    // ...
}
```


### Case: animations
```
"@keyframes ComponentName-AnimationNameHere": {
    from: {
        // ...
    },
    50: {
        // ...
    },
    "60%": {
        // ...
    },
},
```
React Styles supports defining animation keyframes, although it is not as nicely implemented as other features. Anything starting with `@keyframes` is treated as a *global* CSS animation rule, regardless of where it is inside `makeStyle()`. For this reason, it is recommended that animation names start with the name of the component, to keep them unique throughout the project. (Any ideas for alternative implementations are welcome! Just [create a new "enhancement" issue](https://github.com/skylon07/react-styles/issues/new) on GitHub.)

One thing to note is that this object is specially handled, and only supports the properties "to", "from", or any numerical value (either with or without percentages). Numerical properties automatically append a '%' before being compiled to CSS.


### Case: absolute properties
```
"=.Component-Container": {
    // ...
},
```
**Use these sparingly!** Odds are, if you need to use an absolute property, then something in your styling (or maybe even component structure) is wrong. There are a few exceptions to this rule, mostly including:
1. Your main app component defining `body` or `root` styles.
2. A component who renders its own wrapper, or renders an element that has a different class name from the component's name.

If you determine that an absolute property is necessary, then here is what's going on. When the first character of a property name is '=', then React Styles treats it as an absolute property. This means that, regardless of the placement of its definition, it will render the rest of the property name as the class of the CSS rule. In the example above, this would generate...
```
.Component-Container {
    /* container properties */
}
```
...and NOT...
```
.ComponentName .Component-Container {
    /* container properties */
}
```

It is also worth noting that this must be the EXACT rule. Using "Component-Container" will not work, as it is invalid CSS. It MUST have a leading '.' if it represents a custom CSS class. Also, absolute properties are processed like any other nested property list; it can have its own `when()` statements and children, applied in the same fashion to the absolute property.


## Themes and Presets
*(Sorry, but I still need to write the documentation on these! Themes work just like `makeStyle()`, so hopefully you can figure it out...)*