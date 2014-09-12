var adm2Object = require('./dependencies/adm2object.js');
//var adm1 = adm2Object('./src/compareAdms/samples/d1.adm');
//var adm2 = adm2Object('./src/compareAdms/samples/d2.adm');
var adm1 = adm2Object('./src/compareAdms/samples/MyMassSpringDamper.adm');
var adm2 = adm2Object('./src/compareAdms/samples/Wheel.adm');

var formulas = [];
var primitiveProperyInstances = [];
var properties = [];
var connectorComposition1_map = {};
var connectorComposition2_map = {};
var valueFlow1_map = {};
var valueFlow2_map = {};

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
        // 1. first pass -- check all basic components for any differences
        result = compareRootContainer(adm1.Design, adm2.Design);

        // 2. second pass -- check all ConnectorCompositions (connections, referenced via IDs) in the design for any discrepancies
        if (result.success) {
            result = compareConnectorComposition();

            // 3. third pass -- check against all value flows (formulas, properties)
            if (result.success) {

            }
        }
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
     * @param parent
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

        if (len1 !== len2) {
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
                "ComponentInstance",
                "Connector",
                "Property"
            ],
            FUNCTIONS = [
                compareContainerArrays,
                compareComponentInstanceArrays,
                compareConnectorArrays,
                comparePropertyArrays
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

        if (name1 !== name2) {
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

        if (len1 !== len2) {
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
            PRIM_PROP_INS = "PrimitivePropertyInstance",
            ELEMENTS = ["PrimitivePropertyInstance",
                        "ConnectorInstance"],
            i,
            FUNCTIONS = [
                comparePrimitivePropertyInstanceArrays,   // todo: is this checked here or in valueflow checks?
                compareConnectorInstanceArrays
            ],
            name1 = componentInstance1[NAME],
            name2 = componentInstance2[NAME],
            id1 = componentInstance1[COMPONENT_ID],
            id2 = componentInstance2[COMPONENT_ID];

        if (name1 !== name2) {
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


        if (componentInstance1.hasOwnProperty(PRIM_PROP_INS) === componentInstance2.hasOwnProperty(PRIM_PROP_INS)) {
            if (componentInstance1.hasOwnProperty(PRIM_PROP_INS)) {
                scanPrimitivePropertyInstanceArrays(componentInstance1[PRIM_PROP_INS], componentInstance2[PRIM_PROP_INS]);
            }
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
            // sort the arrays first
            connectorArray1.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            connectorArray2.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

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
            TYPE = "Connector",
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
            storeConnectorCompositionInfo(connector1, connector1[NAME], TYPE, parent, connectorComposition1_map);
            storeConnectorCompositionInfo(connector2, connector2[NAME], TYPE, parent, connectorComposition2_map);
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
            // sort the arrays first
            roleArray1.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            roleArray2.sort(function(a, b){
                return a[NAME] > b[NAME];
            });
            // todo: may need to compare all pairs of roles instead of sorting ************

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
        var TYPE = "@xmlns:q",
            CLASS = "@Class",
            XSI_TYPE = "@xsi:type",
            MODELICA = "modelica",
            CAD = "cad",
            result = {
                success: true,
                messages: []
            },
            key,
            type1,
            type2;

        for (key in role1) {
            if (role1.hasOwnProperty(key)) {
                if (key.indexOf(TYPE) === 0) {
                    type1 = key;
                    break;
                }
            }
        }
        for (key in role2) {
            if (role2.hasOwnProperty(key)) {
                if (key.indexOf(TYPE) === 0) {
                    type2 = key;
                    break;
                }
            }
        }

        if (role1[type1] !== role2[type2]) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "Type of Role does not match: " + role1[type1] + ", " + role2[type2]);
        } else if (role1[type1] === MODELICA) {
            if (role1[CLASS] !== role2[CLASS]) {
                result.success = false;
                result.messages.push(formatParentTree(parent) + "Modelica Class of Role does not match: " + role1[CLASS] + ", " + role2[CLASS]);
            }
        } else if (role1[type1] === CAD) {
            if (role1[XSI_TYPE] !== role2[XSI_TYPE]) {
                result.success = false;
                result.messages.push(formatParentTree(parent) + "CAD Class of Role does not match: " + role1[XSI_TYPE] + ", " + role2[XSI_TYPE]);
            }
        }

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
            // sort the arrays first
            propArray1.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            propArray2.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

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

    /**
     * Compare sorted pairs of connector instances
     * fail - if lengths do not match
     * @param connectorInstanceArray1
     * @param connectorInstanceArray2
     * @param parent
     * @returns {{success: boolean, messages: Array}}
     */
    var compareConnectorInstanceArrays = function (connectorInstanceArray1, connectorInstanceArray2, parent) {
        var ID = "@IDinComponentModel",
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
            // sort the arrays first
            connectorInstanceArray1.sort(function(a, b){
                return a[ID] > b[ID];
            });

            connectorInstanceArray2.sort(function(a, b){
                return a[ID] > b[ID];
            });

            // todo: can sorting be done here? ***************************************

            for (i = 0; i < connectorInstanceArray1.length; i += 1) {
                node = {
                    name: "",
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

    /**
     * Comparing two connector instances
     * fail - if IDinComponentModel does not match
     * otherwise - store each ID, ConnectorComposition, and parent name in ComponentInstance
     * @param connectorInstance1
     * @param connectorInstance2
     * @param node: stores current node information
     * @returns {{success: boolean, messages: Array}}
     */
    var compareConnectorInstances = function (connectorInstance1, connectorInstance2, node) {
        var ID = "@IDinComponentModel",
            TYPE = 'ConnectorInstance',
            result = {
                success: true,
                messages: []
            };

        if (connectorInstance1[ID] !== connectorInstance2[ID]) {
            result.success = false;
            result.messages.push(formatParentTree(node), "IDinComponentModel of ConnectorInstances does not match: " + connectorInstance1[ID] + ", " + connectorInstance2[ID]);
        } else {
            storeConnectorCompositionInfo(connectorInstance1, node.parent.name, TYPE, node, connectorComposition1_map);
            storeConnectorCompositionInfo(connectorInstance2, node.parent.name, TYPE, node, connectorComposition2_map);
        }

        return result;
    };

    /**
     * Store information associated with each connector composition; used in second pass checking
     * @param element - the root element containing ConnectorComposition
     * @param parentName - name of the parent node containing ConnectorComposition
     * @param parent - parent node, either a Connector or a ConnectorInstance
     * @param map - which map to store such info to
     */
    var storeConnectorCompositionInfo = function (element, parentName, type, parent, map) {
        var CONNECTOR_COMPOSITION = "@ConnectorComposition",
            ID = "@ID",
            compositionId,
            id,
            value;

        compositionId = element[CONNECTOR_COMPOSITION];
        id = element[ID];
        value = {
            compositionId: compositionId,
            type: type,
            parentName: parentName,
            parent: parent
        };
        map[id] = value;
    };

    var storeValueFlowInfo = function (element, parentName, parent, map) {

    };



    /**
     * store all primitive property instances in a LUT
     * @param array1
     * @param array2
     */
    var scanPrimitivePropertyInstanceArrays = function (array1, array2) {
        var ID = "@IDinComponentModel",
            TYPE = "PrimitivePropertyInstance",
            VALUE = "Value",
            VALUE_ID = "@ID",
            VALUE_SRC = "@ValueSource",
            EXP = "ValueExpression",
            XSI_TYPE = "@xsi:type",
            DERIVED = "DerivedValue",
            i,
            key,
            value = {},
            obj;
        for (i = 0; i < array1.length; i += 1) {
            obj = array1[i];
            key = obj[ID];
            value.type = TYPE;
            value.obj = extractValues(value);
        }
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
            // sort the arrays first
            primPropIns1.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

            primPropIns2.sort(function(a, b){
                return a[NAME] > b[NAME];
            });

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

    var comparePrimitivePropertyInstances = function (primtivePropertyInstance1, primtivePropertyInstance2, node) {
        var ID = "@IDinComponentModel",
            result = {
                success: true,
                messages: []
            };
        // todo: this returns true/false?

        if (primtivePropertyInstance1[ID] !== primtivePropertyInstance2[ID]) {
            result.success = false;
            result.messages.push(formatParentTree(parent) + "IDinComponentModel of PrimitiveInstances does not match: " + primtivePropertyInstance1[ID] + ", " + primtivePropertyInstance2[ID]);
        } else {
            storeValueFlowInfo(primtivePropertyInstance1, node.parent.name, node.parent, valueFlow1_map);
            storeValueFlowInfo(primtivePropertyInstance2, node.parent.name, node.parent, valueFlow2_map);
        }

        return result;

    };


    /**
     * After all elements have been scanned the first time for any discrepancies, compare each pair of ConnectorCompositions stored in the LUT
     * @returns {{success: boolean, messages: Array}}
     */
    var compareConnectorComposition = function () {
        var result = {
                success: true,
                messages: []
            },
            keys1 = Object.keys(connectorComposition1_map),
            keys2 = Object.keys(connectorComposition2_map),
            i,
            j,
            key1,
            val1,
            parentName1,
            refId1,
            id1Index,
            key2,
            val2,
            parentName2,
            refId2,
            id2Index,
            msg,
            type,
            connector1_compIds = [],
            connector2_compIds = [],
            compositionArray1 = [],
            compositionArray2 = [];

        for (i = 0; i < keys1.length; i += 1) {
            // each pair must have matching parentName
            key1 = keys1[i];
            val1 = connectorComposition1_map[key1];
            connector1_compIds = val1.compositionId.split(" ");

            key2 = keys2[i];
            val2 = connectorComposition2_map[key2];
            connector2_compIds = val2.compositionId.split(" ");

            // number of ids in ConnectorComposition needs to match
            if (connector1_compIds.length !== connector2_compIds.length) {
                result.success = false;
                result.messages.push(formatParentTree(val1.parent) + "Number of id references in ConnectorComposition does not match.");
                return result;
            } else {
                // if one compositionID is empty string, the other compositionID is not, then return false

                if (connector1_compIds.length === 1 && (connector1_compIds[0] === "" || connector2_compIds[0] === "")) {
                    if (connector1_compIds[0] !== connector2_compIds[0]) {
                        parentName1 = val1.parentName;
                        result.success = false;
                        msg = val1.type + " does not have the same connections."; // todo: add what each connector is connected to
                        result.messages.push(formatParentTree(val1.parent) + msg);
                        return result;
                    } else {
                        continue;
                    }
                }

                for (j = 0; j < connector1_compIds.length; j += 1) {
                    refId1 = connector1_compIds[j];
                    refId2 = connector2_compIds[j];

                    id1Index = keys1.indexOf(refId1);
                    id2Index = keys2.indexOf(refId2);

                    if (id1Index === -1) {
                        result.success = false;
                        result.messages.push(formatParentTree(val1.parent) + "Design 1 Connector referenced with ID: " + refId1 + " is not found: ");
                        return result;
                    }

                    if (id2Index === -1) {
                        result.success = false;
                        result.messages.push(formatParentTree(val2.parent) + "Design 2 Connector referenced with ID: " + refId2 + " is not found: ");
                        return result;
                    }

                    parentName1 = connectorComposition1_map[keys1[id1Index]].parentName;
                    parentName2 = connectorComposition2_map[keys2[id2Index]].parentName;

                    // todo: find a unique identifier or compare all pairs with the name value

                    compositionArray1.push(parentName1);
                    compositionArray2.push(parentName2);
                }

                result.success = compareAllCompositionPairsInArrays(compositionArray1, compositionArray2);

                if (!result.success) {
                    parentName1 = connectorComposition1_map[refId1].parentName;
                    type = connectorComposition1_map[refId1].type;
                    msg = type + " " + parentName1 + "does not connect to the same connections; they connect to: " + compositionArray1.toString() +
                        " and " + compositionArray2.toString() + " respectively.";
                    result.messages.push(formatParentTree(val1.parent) + msg);
                    return result;
                }

            }
        }

        return result;
    };

    var extractValues = function (valueObject) {
        var // define attribute names
            ID = "@ID",
            TYPE = "@xsi:type",
            // define element tag names
            SOURCE = "ValueSource",
            EXP = "ValueExpression",
            VALUE = "Value",
            ASSIGNED = "AssignedValue",
            // define default const values
            DERIVED = "DerivedValue",
            FIXED = "FixedValue",
            PARAMETRIC = "ParametricValue",
            retObj = {};

        retObj.id = valueObject[ID];
        if (valueObject.hasOwnProperty(EXP)) {
            if (TYPE.indexOf(DERIVED) > -1) {
                retObj.valueSource = valueObject[EXP][SOURCE];
                // todo: start tracking valueflow... ************************************************
            } else if (TYPE.indexOf(FIXED) > -1) {
                // todo: if tag doesn't exist, print error message
                retObj.fixedValue = valueObject[EXP][VALUE];
            } else if (TYPE.indexOf(PARAMETRIC) > -1) {
                // todo: if tag doesn't exist, print error message

                // todo: retObj.assignedValue = valueObject[EXP][ASSIGNED];
                // todo: this might be recursive..........

            }
        }

        return retObj;
    };


    /**
     * A helper function to log the trace of branching during checks
     * @param node
     * @returns {string}
     */
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


//    var compareFormulaArrays = function (formulaArray1, formulaArray2, parent) {
//        var NAME = "@Name",
//            TYPE = "@xsi:type",
//            TYPES = ["SimpleFormula",
//                     "CustomFormula"],
//            result = {
//                success: true,
//                messages: []
//            },
//            i,
//            formula1,
//            formula2,
//            simpleFormulaArray1 = [],
//            simpleFormulaArray2 = [],
//            customFormulaArray1 = [],
//            customFormulaArray2 = [];
//
//        if (formulaArray1.length !== formulaArray2.length) {
//            result.success = false;
//            result.messages.push(formatParentTree(parent) + "Number of Formulas does not match: " + formulaArray1.length + ", " + formulaArray2.length);
//        } else {
//            // todo: comparing formulas cannot use the sorter; for now just compare # of formulas
//            for (i = 0; i < formulaArray1.length; i += 1) {
//                formula1 = formulaArray1[i];
//                formula2 = formulaArray2[i];
//                if (formula1[TYPE] === TYPES[1]) {
//                    simpleFormulaArray1.push(formula1);
//                } else if (formula1[TYPE] === TYPES[2]) {
//                    customFormulaArray1.push(formula1);
//                }
//
//                if (formula2[TYPE] === TYPES[1]) {
//                    simpleFormulaArray2.push(formula2);
//                } else if (formula2[TYPE] === TYPES[2]) {
//                    customFormulaArray2.push(formula2);
//                }
//
//                // todo: if of neither formula type, warning?
//            }
//
//            if (simpleFormulaArray1.length !== simpleFormulaArray2.length) {
//                result.success = false;
//                result.messages.push(formatParentTree(parent) + "Number of SimpleFormulas does not match: " + simpleFormulaArray1.length + ", " + simpleFormulaArray2.length);
//            } else if (customFormulaArray1.length !== customFormulaArray2.length) {
//                result.success = false;
//                result.messages.push(formatParentTree(parent) + "Number of CustomFormulas does not match: " + customFormulaArray1.length + ", " + customFormulaArray2.length);
//            }
//        }
//        return result;
//    };


    /**
     * When two component arrays have equal length, compare each pair of components
     * success - if component array length number of pairs match
     * fail - otherwise
     * @param arr1
     * @param arr2
     */
    var compareAllCompositionPairsInArrays = function (arr1, arr2) {
        var TARGET = arr1.length,
            counter = 0,
            i,
            j,
            success = true;

        for (i = 0; i < arr1.length; i += 1) {
            for (j = 0; j < arr1.length; j += 1) {
                if (arr1[i] === arr2[j]) {
                    ++counter;
                    arr1.splice(i, 1);
                    arr2.splice(j, 1);
                    --i;
                    --j;
                }
            }
        }

        if (counter !== TARGET) {
            success = false;
        }

        return success;
    };

    /**
     * When two component arrays have equal length, compare each pair of components
     * success - if component array length number of pairs match
     * fail - otherwise
     * @param name
     * @param type
     * @param parent
     * @param componentArray1
     * @param componentArray2
     * @param nextFunc
     */
    var compareAllPairsInArrays = function (name, type, parent, componentArray1, componentArray2, nextFunc) {
        var TARGET = componentArray1.length,
            counter = 0,
            i,
            j,
            node,
            result = {
                success: true,
                messages: []
            };

        for (i = 0; i < componentArray1.length; i += 1) {
            for (j = 0; j < componentArray1.length; j += 1) {
                node = {
                    name: name,
                    type: type,
                    parent: parent,
                    children: []
                };
                result = nextFunc(componentArray1[i], componentArray2[j], node);
                if (result.success) {
                    ++counter;
                    componentArray1.splice(i, 1);
                    componentArray2.splice(j, 1);
                    --i;
                    --j;
                }
            }
        }

        if (counter !== TARGET) {
            result.success = false;

        }
    };

console.log (compareAdms(adm1, adm2));
