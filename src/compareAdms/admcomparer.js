var adm2Object = require('./dependencies/adm2object.js');
var adm1 = adm2Object('./src/compareAdms/samples/d1.adm');
var adm2 = adm2Object('./src/compareAdms/samples/d2.adm');
//var adm1 = adm2Object('./src/compareAdms/samples/MyMassSpringDamper.adm');
//var adm2 = adm2Object('./src/compareAdms/samples/Wheel.adm');

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

    if (JSON.stringify(adm1, null) === JSON.stringify(adm2, null)) {
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
            container1,
            container2,
            node;

        if (JSON.stringify(containerArray1, null) === JSON.stringify(containerArray2, null)) {
            result.success = true;
            result.messages.push("The designs have the same containers");
        } else if (len1 !== len2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Number of containers does not match: " + len1 + ", " + len2);
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
                container1 = containerArray1[i];
                container2 = containerArray2[i];
                node = {
                    name: container1[NAME],
                    type: 'Container',
                    parent: parent,
                    children: []
                };
                result = compareContainers(container1, container2, node);
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
        if (JSON.stringify(container1, null) === JSON.stringify(container2, null)) {
            result.success = true;

        } else if (name1 !== name2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Name of Containers does not match: " + name1 + ", " + name2);
        } else if (type1 !== type2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Type of Containers " + name1 + " does not match: " + type1 + ", " + type2);
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
                    result.messages.push(formatParentTree(node) + "Not both containers have child element " + ELEMENTS[i]);
                    break;
                }
            }
        }
        return result;
    };

    var compareComponentInstanceArrays = function (componentInstanceArray1, componentInstanceArray2, parent) {
        var result = {
                success: true,
                messages: []
            },
            NAME = "@Name",
            len1 = componentInstanceArray1.length,
            len2 = componentInstanceArray2.length,
            i,
            instance1,
            instance2,
            node;

        if (JSON.stringify(componentInstanceArray1, null) === JSON.stringify(componentInstanceArray2, null)) {
            result.success = true;
            result.messages.push("The designs have the same containers");
        } else if (len1 !== len2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Number of ComponentInstances does not match: " + len1 + ", " + len2);
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
                node = {
                    name: instance1[NAME],
                    type: 'ComponentInstance',
                    parent: parent,
                    children: []
                };
                result = compareComponentInstances(instance1, instance2, node);
                if (!result.success) {
                    break;
                }
            }
        }
        return result;
    };

    var compareComponentInstances = function (componentInstance1, componentInstance2, parent) {
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

        if (JSON.stringify(componentInstance1, null) === JSON.stringify(componentInstance2, null)) {
            result.success = true;
            result.messages.push("The containers have the same ComponentInstances");
        } else if (name1 !== name2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Name of ComponentInstance does not match: " + name1 + ", " + name2);
        } else if (id1 !== id2) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "ComponentID of ComponentInstance does not match: " + id1 + ", " + id2);
        } else {
            // compare the instance's child components
            for (i = 0; i < ELEMENTS.length; i += 1) {
                if (componentInstance1.hasOwnProperty(ELEMENTS[i]) === componentInstance2.hasOwnProperty(ELEMENTS[i])) {
                    if (componentInstance1.hasOwnProperty(ELEMENTS[i])) {
                        // deep compare elements of each container's child element
                        result = FUNCTIONS[i](componentInstance1[ELEMENTS[i]], componentInstance2[ELEMENTS[i]], parent);
                        if (!result.success) {
                            break;
                        }
                    }
                } else {
                    result.success = false;
                    result.messages.push(formatParentTree(parent) + "Not both ComponentInstances have child element " + ELEMENTS[i]);
                    break;
                }
            }
        }
        return result;
    };

    var comparePrimitivePropertyInstanceArrays = function (primPropIns1, primPropIns2, parent) {
        var NAME = "@Name",
            result = {
                success: true,
                messages: []
            },
            i,
            node;
        if (primPropIns1.length !== primPropIns2.length) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Number of PrimitivePropertyInstances does not match: " + primPropIns1.length + ", " + primPropIns2.length);
        } else {
            for (i = 0; i < primPropIns1.length; i += 1) {
                node = {
                    name: primPropIns1[i][NAME],
                    type: 'PrimitivePropertyInstance',
                    parent: parent,
                    children: []
                };
                result = comparePrimitivePropertyInstances(primPropIns1[i], primPropIns2[i], node);
                if (!result.success) {
                    break;
                }
            }
        }

        return result;
    };

    var comparePrimitivePropertyInstances = function (PrimtivePropertyInstance1, PrimtivePropertyInstance2, parent) {
        var result = {
                success: true,
                messages: []
            };

        return result;

    };

    var compareConnectorInstanceArrays = function (connectorInstanceArray1, connectorInstanceArray2, parent) {
        var NAME = "@Name",
            result = {
                success: true,
                messages: []
            },
            i,
            node;

        if (connectorInstanceArray1.length !== connectorInstanceArray2.length) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Number of ConnectorInstances does not match: " + connectorInstanceArray1.length + ", " + connectorInstanceArray2.length);
        } else {
            for (i = 0; i < connectorInstanceArray1.length; i += 1) {
                node = {
                    name: connectorInstanceArray1[i][NAME],
                    type: 'ConnectorInstance',
                    parent: parent,
                    children: []
                };
                result = compareConnectorInstances(connectorInstanceArray1[i], connectorInstanceArray2[i], node);
                if (!result.success) {
                    break;
                }
            }
        }


        return result;
    };

    var compareConnectorInstances = function (ConnectorInstance1, ConnectorInstance2, parent) {
        var result = {
            success: true,
            messages: []
        };

        return result;

    };

    var comparePropertyArrays = function (propArray1, propArray2, parent) {
        var NAME = "@Name",
            i,
            result = {
                success: true,
                messages: []
            },
            node;

        if (propArray1.length !== propArray2.length) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Number of Properties does not match: " + propArray1.length + ", " + propArray2.length);
        } else {
            for (i = 0; i < propArray1.length; i += 1) {
                node = {
                    name: propArray1[i][NAME],
                    type: 'Property',
                    parent: parent,
                    children: []
                };
                result = compareProperties(propArray1[i], propArray2[i], node);
                if (!result.success) {
                    break;
                }
            }
        }

        return result;
    };

    var compareProperties = function (property1, property2, parent) {
        var NAME = "@Name",
            result = {
                success: true,
                messages: []
            };

        if (property1[NAME] !== property2[NAME]) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Name of Property does not match: " + property1[NAME] + ", " + property2[NAME]);
        }

        return result;
    };

    var compareConnectorArrays = function (connectorArray1, connectorArray2, parent) {
        var NAME = "@Name",
            result = {
                success: true,
                messages: []
            },
            i,
            node;

        if (connectorArray1.length !== connectorArray2.length) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Number of Connectors does not match: " + connectorArray1.length + ", " + connectorArray2.length);
        } else {
            for (i = 0; i < connectorArray1.length; i += 1) {
                node = {
                    name: connectorArray1[i][NAME],
                    type: 'Connector',
                    parent: parent,
                    children: []
                };
                result = compareConnectors(connectorArray1[i], connectorArray2[i], node);
                if (!result.success) {
                    break;
                }
            }
        }

        return result;
    };

    var compareConnectors = function (connector1, connector2, parent) {
        var NAME = "@Name",
            ELEMENT = "Role",
            result = {
                success: true,
                messages: []
            },
            node;

        if (connector1[NAME] !== connector2[NAME]) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Name of Connectors does not match: " + connector1[NAME] + ", " + connector2[NAME]);
        } else {
            if (connector1.hasOwnProperty(ELEMENT) === connector2.hasOwnProperty(ELEMENT)) { // todo: use a for loop maybe
                node = {
                    name: connector1[NAME],
                    type: 'Connector',
                    parent: parent,
                    children: []
                };
                result = compareRoleArrays(connector1[ELEMENT], connector2[ELEMENT], node);
            }
        }
        return result;
    };

    var compareFormulaArrays = function (formulaArray1, formulaArray2, parent) {
        var NAME = "@Name",
            TYPE = "@xsi:type",
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
            result.messages.push(formatParentTree(parent) + "Number of Formulas does not match: " + formulaArray1.length + ", " + formulaArray2.length);
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
                result.messages.push(formatParentTree(parent) + "Number of SimpleFormulas does not match: " + simpleFormulaArray1.length + ", " + simpleFormulaArray2.length);
            } else if (customFormulaArray1.length !== customFormulaArray2.length) {
                result.success = false;
                result.messages.push(formatParentTree(parent) + "Number of CustomFormulas does not match: " + customFormulaArray1.length + ", " + customFormulaArray2.length);
            }
        }
        return result;
    };

    var compareSimpleFormulas = function () {

    };

    var compareCustomFormulas = function () {

    };

    var compareRoleArrays = function (roleArray1, roleArray2, parent) {
        var NAME = "@Name",
            i,
            result = {
                success: true,
                messages: []
            },
            node;
        if (roleArray1.length !== roleArray2.length) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Number of Roles does not match: " + roleArray1.length + ", " + roleArray2.length);
        } else {
            for (i = 0; i < roleArray1.length; i += 1) {
                node = {
                    name: roleArray1[i][NAME],
                    type: 'Role',
                    parent: parent,
                    children: []
                };
                result = compareRoles(roleArray1[i], roleArray2[i], node);
                if (!result.success) {
                    break;
                }
            }
        }
        return result;
    };

    var compareRoles = function (role1, role2, parent) {
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
        len = messages.length;
        while (len--) {
            result += messages[len] + '->';
        }

        return result + ': ';
    };

console.log (compareAdms(adm1, adm2));
