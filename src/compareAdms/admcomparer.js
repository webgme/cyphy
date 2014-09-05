var adm2Object = require('./dependencies/adm2object.js');
var adm1 = adm2Object('./samples/d1.adm');
var adm2 = adm2Object('./samples/d2.adm');

var compareAdms = function (adm1, adm2) {
    var result = {
        success: true,
        messages: []
    };
    /* TODO: messages: {
                info: [],
                warn: [],
                error: []
            }
    */
    //TODO: here goes the code

    //TODO: remove the indentation (will save some resources).
    if (JSON.stringify(adm1, null, 2) === JSON.stringify(adm2, null, 2)) {
        result.success = true;
        result.messages.push("The given two adm designs are identical.");
    } else {
        // deep compare
        result = compareRootContainer(adm1.Design, adm2.Design);
    }

    return result;
};

    var compareRootContainer = function (design1, design2) {
        var result,
            root1 = design1.RootContainer,
            root2 = design2.RootContainer,
            rootNode = {
                name: 'RootContainer',
                type: 'Container',
                children: [],
                parent: null
            };

        result = compareContainers(root1, root2, rootNode);
        return result;
    };

    /**
     * Compare two container Arrays by making a recursive call that compares individual container object
     * @param containerArray1 - an array of containers
     * @param containerArray2 - a second array of containers
     */
    var compareContainerArrays = function (containerArray1, containerArray2, parent) {
        var result = {
                success: true,
                messages: []
            },
            NAME = "@Name",
            len1 = containerArray1.length,
            len2 = containerArray2.length,
            i,
            cont1,
            cont2;

        if (JSON.stringify(containerArray1, null, 2) === JSON.stringify(containerArray2, null, 2)) {
            result.success = true;
            result.messages.push("The designs have the same containers");
        } else if (len1 !== len2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + " have different numbers of containers.");
        } else {
            // sort the arrays first
            containerArray1.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            containerArray2.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            for (i = 0; i < len1; i += 1) {
                // each cont is an object
                cont1 = containerArray1[i];
                cont2 = containerArray2[i];
                node = {
                    name: cont1[NAME],
                    type: 'Container',
                    parent: parent,
                    children: []
                };
                result = compareContainers(cont1, cont2, parent);
                if (!result.success) {
                    break;
                }
            }
        }
        return result;
    };

    var compareContainers = function (container1, container2, parent) {
        var result = {
                success: true,
                messages: []
            },
            XSI_TYPE = "@xsi:type",
            NAME = "@Name",
            ELEMENTS = [
                "Container",
                "Connector",
                "Property",
                "Formula",
                "ComponentInstance"
            ],
            FUNCTIONS = [
                compareContainerArrays,
                compareConnectorArrays,
                comparePropertyArrays,
                compareFormulaArrays,
                compareComponentInstanceArrays
            ],
            i,
            type1 = container1[XSI_TYPE],
            type2 = container2[XSI_TYPE],
            name1 = container1[NAME],
            name2 = container2[NAME],
            node = {
                name: name1,
                type: 'Container',
                children: [],
                parent: parent
            };

        parent.children.push(node);
        if (JSON.stringify(container1, null, 2) === JSON.stringify(container2, null, 2)) {
            result.success = true;
        // TODO: split into two else ifs . Easier to explain what didn't match..
        } else if (name1 !== name2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Name of Containers does not match: " + name1 + ", " + name2);
        } else if (type1 !== type2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Type of Containers " + name1 + " does not match: " + type1 + ", " + type1);
        } else {
            // compare the container's child components
            for (i = 0; i < ELEMENTS.length; i += 1) {
                if (container1.hasOwnProperty(ELEMENTS[i]) === container2.hasOwnProperty(ELEMENTS[i])) {
                    if (container1.hasOwnProperty(ELEMENTS[i])) {
                        // deep compare elements of each container's child element
                        result = FUNCTIONS[i](container1[ELEMENTS[i]], container2[ELEMENTS[i]], node);
                        if (!result.success) {
                            break;
                        }
                    }
                } else {
                    result.success = false;
                    result.messages.push("Two designs have different" + ELEMENTS[i] + "s.");
                }
            }
        }
        return result;
    };

    var compareComponentInstanceArrays = function (componentInstanceArray1, componentInstanceArray2) {
        var result = {
                success: true,
                messages: []
            },
            NAME = "@Name",
            len1 = componentInstanceArray1.length,
            len2 = componentInstanceArray2.length,
            i,
            instance1,
            instance2;

        if (JSON.stringify(componentInstanceArray1, null, 2) === JSON.stringify(componentInstanceArray2, null, 2)) {
            result.success = true;
            result.messages.push("The designs have the same containers");
        } else if (len1 !== len2) {
            result.success = false;
            result.messages.push("The designs have different numbers of ComponentInstances.");
        } else {

            // sort the arrays first
            componentInstanceArray1.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            componentInstanceArray2.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            for (i = 0; i < len1; i += 1) {
                // each cont is an object
                instance1 = componentInstanceArray1[i];
                instance2 = componentInstanceArray2[i];
                result = compareComponentInstances(instance1, instance2);
                if (!result.success) {
                    break;
                }
            }
        }
        return result;
    };

    var compareComponentInstances = function (componentInstance1, componentInstance2) {
        var result = {
                success: true,
                messages: []
            },
            COMPONENT_ID = "@ComponentID",
            NAME = "@Name",
            ELEMENTS = ["PrimitivePropertyInstance",
                        "ConnectorInstance"],
            i,
            FUNCTIONS = [
                comparePrimitivePropertyInstanceArrays,
                compareConnectorInstanceArrays
            ],
            name1 = componentInstance1[NAME],
            name2 = componentInstance2[NAME],
            id1 = componentInstance1[COMPONENT_ID],
            id2 = componentInstance2[COMPONENT_ID];

        if (JSON.stringify(componentInstance1, null, 2) === JSON.stringify(componentInstance2, null, 2)) {
            result.success = true;
            result.messages.push("The designs have the same containers");
        } else if (name1 !== name2 || id1 !== id2) {
            result.success = false;
            result.messages.push("The designs have different component instances.");
        } else {
            // compare the instance's child components
            for (i = 0; i < ELEMENTS.length; i += 1) {
                if (componentInstance1.hasOwnProperty(ELEMENTS[i]) === componentInstance2.hasOwnProperty(ELEMENTS[i])) {
                    if (componentInstance1.hasOwnProperty(ELEMENTS[i])) {
                        // deep compare elements of each container's child element
                        result = FUNCTIONS[i](componentInstance1[ELEMENTS[i]], componentInstance2[ELEMENTS[i]]);
                        if (!result.success) {
                            break;
                        }
                    }
                } else {
                    result.success = false;
                    result.messages = "Two designs have different" + ELEMENTS[i] + "s.";
                }
            }
        }
        return result;
    };

    var comparePrimitivePropertyInstanceArrays = function (primPropIns1, primPropIns2) {
        var result = {
                success: true,
                messages: []
            },
            i;
        if (primPropIns1.length !== primPropIns2) {
            result.success = false;
            result.messages.push("Two designs have different numbers of primitive property instances")
        } else {
            for (i = 0; i < primPropIns1.length; i += 1) {
                result = comparePrimitivePropertyInstances(primPropIns1[i], primPropIns2[i]);
                if (!result.success) {
                    break;
                }
            }
        }

        return result;
    };

    var comparePrimitivePropertyInstances = function () {
        var result = {
                success: true,
                messages: []
            };

        return result;

    };

    var compareConnectorInstanceArrays = function (connectorInstanceArray1, connectorInstanceArray2) {
        var result = {
                success: true,
                messages: []
            },
            i;

        if (connectorInstanceArray1.length !== connectorInstanceArray2) {
            result.success = false;
            result.messages.push("The designs have different numbers of connector instances");
        } else {
            for (i = 0; i < connectorInstanceArray1.length; i += 1) {
                result = compareConnectorInstances(connectorInstanceArray1[i], connectorInstanceArray2[i]);
                if (!result.success) {
                    break;
                }
            }
        }


        return result;
    };

    var compareConnectorInstances = function () {
        var result = {
            success: true,
            messages: []
        };

        return result;

    };

    var comparePropertyArrays = function (propArray1, propArray2) {
        var i,
            result = {
                success: true,
                messages: []
            };

        if (propArray1.length !== propArray2.length) {
            result.success = false;
            result.messages.push("Containers have different numbers of properties");
        } else {
            for (i = 0; i < propArray1.length; i += 1) {
                result = compareProperties(propArray1[i], propArray2[i]);
                if (!result.success) {
                    break;
                }
            }
        }

        return result;
    };

    var compareProperties = function (property1, property2) {
        var NAME = "@Name",
            result = {
                success: true,
                messages: []
            };

        if (property1[NAME] !== property2[NAME]) {
            result.success = false;
            result.messages.push("Containers have different properties.");
        }

        return result;
    };

    var compareConnectorArrays = function (connectorArray1, connectorArray2) {
        var result = {
                success: true,
                messages: []
            },
            i;

        if (connectorArray1.length !== connectorArray2.length) {
            result.success = false;
            result.messages.push("Numbers of connector arrays are different");
        } else {
            for (i = 0; i < connectorArray1.length; i += 1) {
                result = compareConnectors(connectorArray1[i], connectorArray2[i]);
                if (!result.success) {
                    break;
                }
            }
        }

        return result;
    };

    var compareConnectors = function (connector1, connector2) {
        var NAME = "@Name",
            ELEMENT = "Role",
            result = {
                success: true,
                messages: []
            };

        if (connector1[NAME] !== connector2[NAME]) {
            result.success = false;
            result.messages.push("Connectors have different names");
        } else {
            if (connector1.hasOwnProperty(ELEMENT) === connector2.hasOwnProperty(ELEMENT)) {
                result = compareRoleArrays(connector1[ELEMENT], connector2[ELEMENT]);
            }
        }
        return result;
    };

    var compareFormulaArrays = function (formulaArray1, formulaArray2) {
        var TYPE = "@xsi:type",
            TYPES = ["SimpleFormula",
                     "CustomFormula"],
            result = {
                success: true,
                messages: []
            },
            i,
            formula1,
            formula2,
            simpleFormulaArray1 = [],
            simpleFormulaArray2 = [],
            customFormulaArray1 = [],
            customFormulaArray2 = [];

        if (formulaArray1.length !== formulaArray2.length) {
            result.success = false;
            result.messages.push("The containers have different numbers of formulas")
        } else {
            // todo: comparing formulas cannot use the sorter; for now just compare # of formulas
            for (i = 0; i < formulaArray1.length; i += 1) {
                formula1 = formulaArray1[i];
                formula2 = formulaArray2[i];
                if (formula1[TYPE] === TYPES[1]) {
                    simpleFormulaArray1.push(formula1);
                } else if (formula1[TYPE] === TYPES[2]) {
                    customFormulaArray1.push(formula1);
                }

                if (formula2[TYPE] === TYPES[1]) {
                    simpleFormulaArray2.push(formula2);
                } else if (formula2[TYPE] === TYPES[2]) {
                    customFormulaArray2.push(formula2);
                }

                // todo: if of neither formula type, warning?
            }

            if (simpleFormulaArray1.length !== simpleFormulaArray2.length) {
                result.success = false;
                result.messages.push("The containers have different numbers of simple formulas");
            } else if (customFormulaArray1.length !== customFormulaArray2.length) {
                result.success = false;
                result.messages.push("The containers have different numbers of custom formulas");
            }
        }
        return result;
    };

    var compareSimpleFormulas = function () {

    };

    var compareCustomFormulas = function () {

    };

    var compareRoleArrays = function (roleArray1, roleArray2) {
        var i,
            result = {
                success: true,
                messages: []
            };
        if (roleArray1.length !== roleArray2.length) {
            result.success = false;
            result.messages.push("Connectors have different numbers of roles");
        } else {
            for (i = 0; i < roleArray1.length; i += 1) {
                result = compareRoles(roleArray1[i], roleArray2[i]);
                if (!result.success) {
                    break;
                }
            }
        }
        return result;
    };

    var compareRoles = function (role1, role2) {
        var result = {
                success: true,
                messages: []
            };

        return result;
    };

    var compareModelica = function () {

    };

    var compareCAD = function () {

    };

    var formatParentTree = function (node) {
        var messages = [],
            parentNode,
            result = '',
            len;
        messages.push(node.type + ' "' + node.name + '"');
        parentNode = node.parent;
        while (parentNode) {
            messages.push('"' + parentNode.name + '"[' + parentNode.type + ']');
            parentNode = parentNode.parent;
        }
        len = messages.length - 1;
        while (len--) {
            result += messages[len] + '->';
        }

        return result + ': ';
    };

console.log (compareAdms(adm1, adm2));
