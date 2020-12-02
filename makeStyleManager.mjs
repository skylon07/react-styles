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

// REQUIRED NAMES (factory):
// setRSKey(key)
// createManagerFor(componentInstance)
// REQUIRED NAMES (style manager):
// initStyle()
// updateDynamicStyles()

// should be defined by importing module!
let RSKey
