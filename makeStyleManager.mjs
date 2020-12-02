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

// should be defined by importing module!
let RSKey

class StyleManager {
    constructor(component) {
        // REQ 7: fulfills requirement 7
        // TODO: create style elements
    }

    // REQ 5: fulfills requirement 5
    initStyle() {
        // TODO: load makeStyle() ONLY ONCE!
    }

    // REQ 6: fulfills requirement 6
    updateDynamicStyles() {
        // TODO
    }
}

// REQ 1: fulfills requirement 1
// factory singleton
export default new class {
    constructor() {
        // REQ 4: fulfills requirement 4
        // TODO: create HTML elements as style containers
    }

    // REQ 3: fulfills requirement 3
    setRSKey(key) {
        RSKey = key
    }

    // REQ 2: fulfills requirement 2
    createManagerFor(componentInstance) {
        return new StyleManager(componentInstance)
    }
}
