var adm2Object = require('./dependencies/adm2object.js');
var adm1 = adm2Object('./src/compareAdms/samples/d1.adm');
var adm2 = adm2Object('./src/compareAdms/samples/d2.adm');
//var adm1 = adm2Object('./src/compareAdms/samples/MyMassSpringDamper.adm');
//var adm2 = adm2Object('./src/compareAdms/samples/Wheel.adm');

var properties = [];
var connectorComposition1_map = {};
var connectorComposition2_map = {};
var valuesToCompare1_map = {};
var valuesToCompare2_map = {};
var propertyMap1 = {};
var propertyMap2 = {};

var compareAdms = function (adm1, adm2) {
    var result = {
            success: true,
            messages: {
            info: [],
            warn: [],
            error: []
        }
        };

    if (JSON.stringify(adm1, null) === JSON.stringify(adm2, null)) {
        result.success = true;
        result.messages.info.push("The given two adm designs are identical.");
    } else {
        // 1. first pass -- check all basic components for any differences and store all connector composition & value flow in maps
        result = compareRootContainer(adm1.Design, adm2.Design);

        // 2. second pass -- check all ConnectorCompositions (connections, referenced via IDs) in the design for any discrepancies
        if (result.success) {
            result = compareConnectorComposition();

            // 3. third pass -- check against all value flows (formulas, properties)
            if (result.success) {
                result = compareValueFlow();
            }
        }
    }

    return result;
};


//<editor-fold desc="Containment Comparisons">
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
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
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
            result.messages.error.push(formatParentTree(parent) + "Number of containers does not match: " + len1 + ", " + len2);
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
                result = compareContainers(container1, container2, parent);
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
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            },
            XSI_TYPE = "@xsi:type",
            NAME = "@Name",
            ELEMENTS = [
                "Container",
                "ComponentInstance",
                "Connector",
                "Property",
                "Formula"
            ],
            FUNCTIONS = [
                compareContainerArrays,
                compareComponentInstanceArrays,
                compareConnectorArrays,
                comparePropertyArrays,
                processFormulaArrays
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
            result.messages.error.push(formatParentTree(parent) + "Name of Containers does not match: " + name1 + ", " + name2);
        } else if (type1 !== type2) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Type of Containers " + name1 + " does not match: " + type1 + ", " + type2);
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
                    result.messages.error.push(formatParentTree(node) + "Not both containers have child element " + ELEMENTS[i]);
                    break;
                }
            }
        }
        return result;
    };

    var compareComponentInstanceArrays = function (componentInstanceArray1, componentInstanceArray2, parent) {
        var result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
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
            result.messages.error.push(formatParentTree(parent) + "Number of ComponentInstances does not match: " + len1 + ", " + len2);
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
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
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

        if (name1 !== name2) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Name of ComponentInstance does not match: " + name1 + ", " + name2);
        } else if (id1 !== id2) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "ComponentID of ComponentInstance does not match: " + id1 + ", " + id2);
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
                    result.messages.error.push(formatParentTree(parent) + "Not both ComponentInstances have child element " + ELEMENTS[i]);
                    break;
                }
            }
        }


//        if (componentInstance1.hasOwnProperty(PRIM_PROP_INS) === componentInstance2.hasOwnProperty(PRIM_PROP_INS)) {
//            if (componentInstance1.hasOwnProperty(PRIM_PROP_INS)) {
//                scanPrimitivePropertyInstanceArrays(componentInstance1[PRIM_PROP_INS], componentInstance2[PRIM_PROP_INS]);
//            }
//        }
        return result;
    };

    var compareConnectorArrays = function (connectorArray1, connectorArray2, parent) {
        var NAME = "@Name",
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            },
            i,
            node;

        if (connectorArray1.length !== connectorArray2.length) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Number of Connectors does not match: " + connectorArray1.length + ", " + connectorArray2.length);
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
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            },
            node;

        if (connector1[NAME] !== connector2[NAME]) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Name of Connectors does not match: " + connector1[NAME] + ", " + connector2[NAME]);
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
                result = compareRoleArrays(connector1[ELEMENT], connector2[ELEMENT], parent);
            }
        }
        return result;
    };

    var compareRoleArrays = function (roleArray1, roleArray2, parent) {
        var NAME = "@Name",
            i,
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            },
            node;
        if (roleArray1.length !== roleArray2.length) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Number of Roles does not match: " + roleArray1.length + ", " + roleArray2.length);
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
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
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
            result.messages.error.push(formatParentTree(parent) + "Type of Role does not match: " + role1[type1] + ", " + role2[type2]);
        } else if (role1[type1] === MODELICA) {
            if (role1[CLASS] !== role2[CLASS]) {
                result.success = false;
                result.messages.error.push(formatParentTree(parent) + "Modelica Class of Role does not match: " + role1[CLASS] + ", " + role2[CLASS]);
            }
        } else if (role1[type1] === CAD) {
            if (role1[XSI_TYPE] !== role2[XSI_TYPE]) {
                result.success = false;
                result.messages.error.push(formatParentTree(parent) + "CAD Class of Role does not match: " + role1[XSI_TYPE] + ", " + role2[XSI_TYPE]);
            }
        }

        return result;
    };

    var comparePropertyArrays = function (propArray1, propArray2, parent) {
        var NAME = "@Name",
            i,
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            },
            node;

        if (propArray1.length !== propArray2.length) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Number of Properties does not match: " + propArray1.length + ", " + propArray2.length);
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
            VALUE = "Value",
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            };

        if (property1[NAME] !== property2[NAME]) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Name of Property does not match: " + property1[NAME] + ", " + property2[NAME]);
        } else {
            storePropertyValuePair(property1[VALUE], property2[VALUE], parent);
        }
        return result;
    };

    /**
     * Compare sorted pairs of connector instances: fail - if lengths do not match
     * @param connectorInstanceArray1
     * @param connectorInstanceArray2
     * @param parent
     * @returns {{success: boolean, messages: {info: Array, warn: Array, error: Array}}}
     */
    var compareConnectorInstanceArrays = function (connectorInstanceArray1, connectorInstanceArray2, parent) {
        var ID = "@IDinComponentModel",
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            },
            i,
            node;

        if (connectorInstanceArray1.length !== connectorInstanceArray2.length) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Number of ConnectorInstances does not match: " + connectorInstanceArray1.length + ", " + connectorInstanceArray2.length);
        } else {
            // sort the arrays first
            connectorInstanceArray1.sort(function(a, b){
                return a[ID] > b[ID];
            });

            connectorInstanceArray2.sort(function(a, b){
                return a[ID] > b[ID];
            });

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
     * Comparing two connector instances - fail if IDinComponentModel does not match
     * otherwise - store each ID, ConnectorComposition, and parent name in ComponentInstance
     * @param connectorInstance1
     * @param connectorInstance2
     * @param node - stores current node information
     * @returns {{success: boolean, messages: {info: Array, warn: Array, error: Array}}}
     */
    var compareConnectorInstances = function (connectorInstance1, connectorInstance2, node) {
        var ID = "@IDinComponentModel",
            TYPE = 'ConnectorInstance',
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            };

        if (connectorInstance1[ID] !== connectorInstance2[ID]) {
            result.success = false;
            result.messages.error.push(formatParentTree(node), "ConnectorInstances do not have the same id: " + connectorInstance1[ID] + ", " + connectorInstance2[ID]);
        } else {
            storeConnectorCompositionInfo(connectorInstance1, node.parent.name, TYPE, node, connectorComposition1_map);
            storeConnectorCompositionInfo(connectorInstance2, node.parent.name, TYPE, node, connectorComposition2_map);
        }

        return result;
    };

    var comparePrimitivePropertyInstanceArrays = function (primitivePropertyInstanceArray1, primitivePropertyInstanceArray2, parent) {
        var ID = "@IDinComponentModel",
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            },
            i,
            ins1,
            ins2,
            node;

        if (primitivePropertyInstanceArray1.length !== primitivePropertyInstanceArray2.length) {
            result.success = false;
            result.messages.error.push(formatParentTree(parent) + "Number of PrimitivePropertyInstances does not match: " + primitivePropertyInstanceArray1.length + ", " + primitivePropertyInstanceArray2.length);
        } else {

            // sort the arrays by ID first
            primitivePropertyInstanceArray1.sort(function(a, b){
                return a[ID] > b[ID];
            });

            primitivePropertyInstanceArray2.sort(function(a, b){
                return a[ID] > b[ID];
            });

            for (i = 0; i < primitivePropertyInstanceArray1.length; i += 1) {
                ins1 = primitivePropertyInstanceArray1[i];
                ins2 = primitivePropertyInstanceArray2[i];
                node = {
                    name: primitivePropertyInstanceArray1[i][ID], // a way to identify the instance we are looking at
                    type: 'PrimitivePropertyInstance',
                    parent: parent,
                    children: []
                };
                result = comparePrimitivePropertyInstances(ins1, ins2, node);
                if (!result.success) {
                    break;
                }
            }
        }

        return result;
    };

    var comparePrimitivePropertyInstances = function (primtivePropertyInstance1, primtivePropertyInstance2, node) {
        var ID = "@IDinComponentModel",
            VALUE = "Value",
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            };

        if (primtivePropertyInstance1[ID] !== primtivePropertyInstance2[ID]) {
            result.success = false;
            result.messages.error.push(formatParentTree(node) + "Does not have the same primitive property: " + primtivePropertyInstance1[ID] + ", " + primtivePropertyInstance2[ID]);
        } else {
//            storeValueFlowInfo(primtivePropertyInstance1[VALUE], node.name, TYPE, node, DESIGN1);
//            storeValueFlowInfo(primtivePropertyInstance2[VALUE], node.name, TYPE, node, DESIGN2);
            storePropertyValuePair(primtivePropertyInstance1[VALUE], primtivePropertyInstance2[VALUE], node);
        }

        return result;
    };

//</editor-fold>


//<editor-fold desc="Connector Composition Storing and Comparing">
/**
     * Store information associated with each connector composition; used in second pass checking
     * @param element - the root element containing ConnectorComposition
     * @param parentName - name of the parent node containing ConnectorComposition
     * @param type - type of element: connector or connector instance
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

    /**
     * After all elements have been scanned the first time for any discrepancies, compare each pair of ConnectorCompositions stored in the LUT
     * @returns {{success: boolean, messages: {info: Array, warn: Array, error: Array}}}
     */
    var compareConnectorComposition = function () {
        var result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
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
            compositionArray1,
            compositionArray2;

        for (i = 0; i < keys1.length; i += 1) {
            // initialize local arrays storing the "connections" via compositionIDs
            compositionArray1 = [];
            compositionArray2 = [];

            // each pair must have matching parentName
            key1 = keys1[i];
            val1 = connectorComposition1_map[key1];

            connector1_compIds = (val1.compositionId === "") ? [] : val1.compositionId.split(" ");



            key2 = keys2[i];
            val2 = connectorComposition2_map[key2];
            connector2_compIds = (val2.compositionId === "") ? [] : val2.compositionId.split(" ");


            // number of ids in ConnectorComposition needs to match
            if (connector1_compIds.length !== connector2_compIds.length) {
                result.success = false;
                result.messages.error.push(formatParentTree(val1.parent) + "Does not have the same number of connections.");
                return result;
            } else {
                for (j = 0; j < connector1_compIds.length; j += 1) {
                    refId1 = connector1_compIds[j];
                    refId2 = connector2_compIds[j];

                    id1Index = keys1.indexOf(refId1);
                    id2Index = keys2.indexOf(refId2);

                    if (id1Index === -1) {
                        result.success = false;
                        result.messages.error.push(formatParentTree(val1.parent) + "Design 1 Connector referenced with ID: " + refId1 + " is not found: ");
                        return result;
                    }

                    if (id2Index === -1) {
                        result.success = false;
                        result.messages.error.push(formatParentTree(val2.parent) + "Design 2 Connector referenced with ID: " + refId2 + " is not found: ");
                        return result;
                    }

                    parentName1 = connectorComposition1_map[keys1[id1Index]].parentName;
                    parentName2 = connectorComposition2_map[keys2[id2Index]].parentName;

                    compositionArray1.push(parentName1);
                    compositionArray2.push(parentName2);
                }

                result.success = compareAllCompositionPairsInArrays(compositionArray1.slice(0), compositionArray2.slice(0));

                if (!result.success) {
                    parentName1 = connectorComposition1_map[refId1].parentName;
                    type = connectorComposition1_map[refId1].type;
                    msg = type + " " + parentName1 + " does not connect to the same connections; they connect to: " + compositionArray1.toString() +
                        " and " + compositionArray2.toString() + " respectively.";
                    result.messages.error.push(formatParentTree(val1.parent) + msg);
                    return result;
                }
            }
        }

        return result;
    };

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
                    break;
                }
            }
        }

        if (counter !== TARGET) {
            success = false;
        }

        return success;
    };
//</editor-fold>


//<editor-fold desc="Compare Value Flow">
var storePropertyValuePair = function (element1, element2, parent) {
        var EXP = "ValueExpression";

        if (element1.hasOwnProperty(EXP) || element2.hasOwnProperty(EXP)) {
            storePropertyValue(element1, parent, propertyMap1, valuesToCompare1_map, true);
            storePropertyValue(element2, parent, propertyMap2, valuesToCompare2_map, true);
        } else {
            storePropertyValue(element1, parent, propertyMap1, valuesToCompare1_map, false);
            storePropertyValue(element2, parent, propertyMap2, valuesToCompare2_map, false);
        }
    };

    /**
     * store property ID with its parent node (and expression if any) to a LUT
     * if primitive property is a derived value, store its ID and value source ID as a pair in a map
     * @param valueElement
     * @param parent - parent of value element
     * @param propertyMap
     * @param addToKey
     * @param valuesToCheckMap
     */
    var storePropertyValue = function (valueElement, parent, propertyMap, valuesToCheckMap, addToKey) {
        var ID = "@ID",
            EXP = "ValueExpression",
            XSI_TYPE = "@xsi:type",
            DERIVED = "DerivedValue",
            FIXED = "FixedValue",
            PARAM = "ParametricValue",
            VALUE = "Value",
            FIXED_VAL = "#text",
            VALUE_SOURCE = "@ValueSource",
            xsi,
            valueSrc = "",
            exp,
            key = valueElement[ID],
            value = {};


        propertyMap[key] = parent;

        // if valueElement has ValueExpression tag, store its expression as part of the value


        if (addToKey) {
            if (valueElement.hasOwnProperty(EXP)) {
                exp = valueElement[EXP];
                xsi = exp[XSI_TYPE];
                if (xsi.indexOf(DERIVED) > -1) {
                    value.type = DERIVED;
                    valueSrc = exp[VALUE_SOURCE];
                    value.value = valueSrc === "" ? null : valueSrc;
                } else if (xsi.indexOf(FIXED) > -1){
                    value.type = FIXED;
                    value.value = exp[VALUE][FIXED_VAL];
                } else if (xsi.indexOf(PARAM) > -1) {
                    value.type = PARAM;
                    value.value = exp;
                }
            }
            valuesToCheckMap[key] = value;
        }
    };


    var processFormulaArrays = function (formulaArray1, formulaArray2, parent) {
        var result = {
            success: true,
            messages: {
                info: [],
                warn: [],
                error: []
            }
        };
        storeFormulaInfo(formulaArray1);
        storeFormulaInfo(formulaArray2);

        return result;
    };

    // todo: formulas stored as undefined for now
    var storeFormulaInfo = function (formulaArray) {
        var ID = "@ID",
            i,
            key,
            value = {};
        for (i = 0; i < formulaArray; i += 1) {
            key = formulaArray[i][ID];
            value = null;
        }
    };


    /**
     * For each pair of keys in keysToCheck, compare their value flows stored in value
     * @returns {{success: boolean, messages: {info: Array, warn: Array, error: Array}}}
     */
    var compareValueFlow = function () {
        var keyLength,
            i,
            key1,
            key2,
            val1,
            val2,
            parent1,
            parent2,
            DERIVED = "DerivedValue",
            FIXED = "FixedValue",
            PARAM = "ParametricValue",
            result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            };

        if (Object.keys(valuesToCompare1_map).length !== Object.keys(valuesToCompare2_map).length) {
            console.log("Some exception occurred");  // todo: delete this debugging message
            return result;
        } else {
            keyLength = Object.keys(valuesToCompare1_map).length;
            for (i = 0; i < keyLength; i += 1) {
                key1 = Object.keys(valuesToCompare1_map)[i];
                key2 = Object.keys(valuesToCompare2_map)[i];
                val1 = valuesToCompare1_map[key1];
                val2 = valuesToCompare2_map[key2];

                if (val1.type !== val2.type) {
                    result.success = false;
                    parent1 = propertyMap1[key1];
                    result.messages.error.push(formatParentTree(parent1) + "Value type does not match.");
                    return result;
                } else {
                    val1 = getEndValue(key1, valuesToCompare1_map, propertyMap1);
                    val2 = getEndValue(key2, valuesToCompare2_map, propertyMap2);

                    if (!val1 || !val2) {
                        result.success = false;
                        parent1 = propertyMap1[key1];
                        result.messages.warn.push(formatParentTree(parent1) + "Some values are undefined.");
                    } else if (val1.type !== val2.type) {
                        result.success = false;
                        parent1 = propertyMap1[key1];
                        result.messages.warn.push(formatParentTree(parent1) + "End value type does not match.");
                    } else if (val1.value !== val2.value) {
                        result.success = false;
                        parent1 = propertyMap1[key1];
                        result.messages.error.push(formatParentTree(parent1) + "End value does not match."); // todo: add what values each point to
                        return result;
                    }

                }
            }
        }

        return result;
    };

    /**
     * Recursively get the end value following a value flow starting with key in valuesToCheckMap
     * @param key
     * @param valuesToCheckMap
     * @param propertyMap
     */
    var getEndValue = function (key, valuesToCheckMap, propertyMap) {
        // todo: a more efficient way would be comparing the derived values to see if they are equal at every level; if equal return early
        var endVal = {},
            valueType = valuesToCheckMap[key].type,
            srcID,
            expression,
            DERIVED = "DerivedValue",
            FIXED = "FixedValue",
            PARAM = "ParametricValue",
            ASSIGNED = "AssignedValue";

        if (valueType === FIXED) {
            endVal = {
                type: FIXED,
                value: valuesToCheckMap[key].value
            };

        } else if (valueType === DERIVED) {
            // if src ID is in the valuesToCheck map, keep checking
            srcID = valuesToCheckMap[key].value;
            if (valuesToCheckMap.hasOwnProperty(srcID)) {
                    getEndValue(srcID, valuesToCheckMap, propertyMap);
            } else {
                // otherwise, it's a primitive property instance; look up its identifier and return it
                if (!propertyMap.hasOwnProperty(srcID)) {
                    endVal = null;
                } else {
                    endVal = {
                        type: DERIVED,
                        value: propertyMap[srcID].name
                    };
                }
            }
        } else if (valueType === PARAM) {
            expression = valuesToCheckMap[key].value[ASSIGNED];
            endVal = getEndAssignedValue(expression);
            if (endVal.type === DERIVED) {
                endVal = getEndValue(endVal.value, valuesToCheckMap, propertyMap);
            }
        }

        return endVal;
    };

    var getEndAssignedValue = function (expression) {
        var TYPE = "@xsi:type",
            DERIVED = "DerivedValue",
            FIXED = "FixedValue",
            PARAM = "ParametricValue",
            ASSIGNED = "AssignedValue",
            VALUE = "Value",
            TEXT = "#text",
            EXP = "ValueExpression",
            SRC = "@ValueSource",
            type,
            value = {};

        type = expression[TYPE];
        if (type.indexOf(FIXED) > -1) {
            value = {
                type: FIXED,
                value: expression[VALUE][TEXT]
            };
        } else if (type.indexOf(PARAM) > -1) {
            value = getEndAssignedValue(expression[EXP][ASSIGNED]); // todo: what's the format of an assigned parametric value???
        } else if (type.indexOf(DERIVED) > -1) {
            value = {
                type: DERIVED,
                value: expression[SRC]
            };
        }

        return value;
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
//</editor-fold>


console.log (compareAdms(adm1, adm2));
