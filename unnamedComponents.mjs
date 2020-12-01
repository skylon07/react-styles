/* MODULE INFO:
This module was created to handle a unique scenario for unnamed components.
A problem arises with nameless components, mainly that React Styles cannot
keep track of CSS classes that are meant to apply to them. The solution to
this problem is to automatically generate CSS class names related to the
component, and tie them to the component's constructor.

One particular case shows the details clearly. Suppose I have a component
declared as such:

    class extends ReactStyles.Component {
        constructor(props) {
            // ...
        }

        makeStyle(when) {
            return {
                // ...
            }
        }

        render() {
            return <div />
        }
    }

This class expression could be assigned to a variable, or be returned from
a function call, etc. Whatever the case, the ultimate problem is when React
Styles tries to apply the returned makeStyle() result, it realizes that it
doesn't know what to name the CSS class. It also doesn't know what className
to give to the <div /> returned in render().

The solution to the above problem requires the following:
    1. A method to create a unique name for a component constructor
    2. A method to get a previously created name from a constructor
    3. A method to get the associated constructor from a given name
*/

// a singleton is provided to accomplish the requirements above
export default new class {
    constructor() {
        this._unnamedComponentNames = {}
        this._unnamedComponentConstructors = {}
        this._unnamedCount = 0

        this.prefix = "Unnamed" // provided publicly for convenience
    }

    // satisfies module requirement 1
    generateName(constructor) {
        const name = this.prefix + this._unnamedCount++
        this._unnamedComponentNames[constructor] = name
        this._unnamedComponentConstructors[name] = constructor
        return name
    }

    // satisfies module requirement 2
    getName(constructor) {
        return this._unnamedComponentNames[constructor]
    }

    // satisfies module requirement 3
    getConstructor(name) {
        return this._unnamedComponentConstructors[name]
    }
}