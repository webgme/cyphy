var adm2Object = require('./dependencies/adm2object.js');
//var adm1 = adm2Object('./src/compareAdms/samples/m3.adm');
//var adm2 = adm2Object('./src/compareAdms/samples/m2.adm');
var adm1 = adm2Object('./src/compareAdms/samples/MyMassSpringDamper.adm');
var adm2 = adm2Object('./src/compareAdms/samples/Wheel.adm');

var formula1 = [];
var formula2 = [];
var primitiveProperyInstances = [];
var properties = [];
var connectorComposition1_map = {};
var connectorComposition2_map = {};
var valueFlow1_map = {};
var valueFlow2_map = {};
var derivedValue1_map = {};
var derivedValue2_map = {};
var DESIGN1 = 1;
var DESIGN2 = 2;
var propertyMap1 = {};
var propertyMap2 = {};
var keysToCheck1 = [];
var keysToCheck2 = [];

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
            result.messages.warn.push(formatParentTree(parent) + "Number of containers does not match: " + len1 + ", " + len2);
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
            result.messages.warn.push(formatParentTree(parent) + "Name of Containers does not match: " + name1 + ", " + name2);
        } else if (type1 !== type2) {
            result.success = false;
            result.messages.warn.push(formatParentTree(parent) + "Type of Containers " + name1 + " does not match: " + type1 + ", " + type2);
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
                    result.messages.warn.push(formatParentTree(node) + "Not both containers have child element " + ELEMENTS[i]);
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
            result.messages.warn.push(formatParentTree(parent) + "Number of ComponentInstances does not match: " + len1 + ", " + len2);
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
            result.messages.warn.push(formatParentTree(parent) + "Name of ComponentInstance does not match: " + name1 + ", " + name2);
        } else if (id1 !== id2) {
            result.success = false;
            result.messages.warn.push(formatParentTree(parent) + "ComponentID of ComponentInstance does not match: " + id1 + ", " + id2);
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
                    result.messages.warn.push(formatParentTree(parent) + "Not both ComponentInstances have child element " + ELEMENTS[i]);
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
            result.messages.warn.push(formatParentTree(parent) + "Number of Connectors does not match: " + connectorArray1.length + ", " + connectorArray2.length);
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
            result.messages.warn.push(formatParentTree(parent) + "Name of Connectors does not match: " + connector1[NAME] + ", " + connector2[NAME]);
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
            result.messages.warn.push(formatParentTree(parent) + "Number of Roles does not match: " + roleArray1.length + ", " + roleArray2.length);
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
            result.messages.warn.push(formatParentTree(parent) + "Type of Role does not match: " + role1[type1] + ", " + role2[type2]);
        } else if (role1[type1] === MODELICA) {
            if (role1[CLASS] !== role2[CLASS]) {
                result.success = false;
                result.messages.warn.push(formatParentTree(parent) + "Modelica Class of Role does not match: " + role1[CLASS] + ", " + role2[CLASS]);
            }
        } else if (role1[type1] === CAD) {
            if (role1[XSI_TYPE] !== role2[XSI_TYPE]) {
                result.success = false;
                result.messages.warn.push(formatParentTree(parent) + "CAD Class of Role does not match: " + role1[XSI_TYPE] + ", " + role2[XSI_TYPE]);
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
            result.messages.warn.push(formatParentTree(parent) + "Number of Properties does not match: " + propArray1.length + ", " + propArray2.length);
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
            result.messages.warn.push(formatParentTree(parent) + "Name of Property does not match: " + property1[NAME] + ", " + property2[NAME]);
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
            result.messages.warn.push(formatParentTree(parent) + "Number of ConnectorInstances does not match: " + connectorInstanceArray1.length + ", " + connectorInstanceArray2.length);
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
            result.messages.warn.push(formatParentTree(node), "IDinComponentModel of ConnectorInstances does not match: " + connectorInstance1[ID] + ", " + connectorInstance2[ID]);
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
            result.messages.warn.push(formatParentTree(parent) + "Number of PrimitivePropertyInstances does not match: " + primitivePropertyInstanceArray1.length + ", " + primitivePropertyInstanceArray2.length);
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
            result.messages.warn.push(formatParentTree(node) + "Does not have the same primitive property: " + primtivePropertyInstance1[ID] + ", " + primtivePropertyInstance2[ID]);
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
                result.messages.warn.push(formatParentTree(val1.parent) + "Does not have the same number of connections.");
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
                    result.messages.warn.push(formatParentTree(val1.parent) + msg);
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

//<editor-fold desc="Compare Value Flows">

    var storePropertyValuePair = function (element1, element2, parent) {
        var EXP = "ValueExpression";

        if (element1.hasOwnProperty(EXP) || element2.hasOwnProperty(EXP)) {
            storePropertyValue(element1, parent, propertyMap1, derivedValue1_map, true);
            storePropertyValue(element2, parent, propertyMap2, derivedValue2_map, true);
        } else {
            storePropertyValue(element1, parent, propertyMap1, derivedValue1_map, false);
            storePropertyValue(element2, parent, propertyMap2, derivedValue2_map, false);
        }
    };


    /**
     * store property ID with its parent node (and expression if any) to a LUT
     * if primitive property is a derived value, store its ID and value source ID as a pair in a map
     * @param valueElement
     * @param parent - parent of value element
     * @param propertyMap
     * @param derivedValueMap
     * @param addToKey
     */
    var storePropertyValue = function (valueElement, parent, propertyMap, derivedValueMap, addToKey) {
        var ID = "@ID",
            EXP = "ValueExpression",
            XSI_TYPE = "@xsi:type",
            DERIVED = "DerivedValue",
            VALUE_SOURCE = "@ValueSource",
            xsi,
            valueSrc = "",
            exp,
            key = valueElement[ID],
            value = {};

        value.parent = parent;

        if (valueElement.hasOwnProperty(EXP)) {
            exp = valueElement[EXP];
            xsi = exp[XSI_TYPE];
            if (xsi.indexOf(DERIVED) > -1) {
                valueSrc = exp[VALUE_SOURCE];
            } else {
                value.expression = exp;
            }
        }
        propertyMap[key] = value;
        if (addToKey) {
            derivedValueMap[key] = valueSrc === "" ? undefined : valueSrc;
        }
    };

    /**
     * For each pair of keys in keysToCheck, compare their value flows stored in value
     * @returns {{success: boolean, messages: {info: Array, warn: Array, error: Array}}}
     */
    var compareValueFlow = function () {
        var result = {
                success: true,
                messages: {
                    info: [],
                    warn: [],
                    error: []
                }
            };

        if (Object.keys(derivedValue1_map).length !== Object.keys(derivedValue2_map).length) {
            result.messages.info.push("Some error occurred");  // todo: delete this debugging message
            return result;
        } else {

        }

        return result;
    };


//    /**
//     *
//     * @param valueFlowElement - Value element of either a PrimitivePropertyInstance or a Property
//     * @param parentIdentifier - Name of a Property or IDinComponentModel of a PrimitivePropertyInstance
//     * @param type - either a PrimitivePropertyInstance value or a Property value
//     * @param parent - the parent node of Value element
//     * @param design - which design map to store info to
//     */
//    var storeValueFlowInfo = function (valueFlowElement, parentIdentifier, type, parent, design) {
//        var VALUE_EXP = "ValueExpression",
//            ID = "@ID",
//            key, // id of value stored as key of LUT
//            value = {},
//            valueFlowMap = design === DESIGN1 ? valueFlow1_map : valueFlow2_map,
//            derivedValueMap = design === DESIGN1 ? derivedValue1_map : derivedValue2_map;
//
//        key = valueFlowElement[ID];
//
//        value.parentIdentifier = parentIdentifier; // value to be compared to see if two values are the same
//
//        // if ValueExpression exists within a Value element
//        if (valueFlowElement[VALUE_EXP]) {
//            value = storeValueExpression(key, value, valueFlowElement[VALUE_EXP], derivedValueMap);
//        }
//        valueFlowMap[key] = value;
//    };
//
//    var storeValueExpression = function (key, value, valueExpression, derivedValueMap) {
//        var XSI_TYPE = "@xsi:type",
//            FIXED = "FixedValue",
//            PARAM = "ParametricValue",
//            DERIVED = "DerivedValue",
//            VALUE = "Value",
//            VALUE_SOURCE = "@ValueSource",
//            ASSIGNED_VALUE = "AssignedValue",
//            xsi,
//            valueSrc;
//
//        xsi = valueExpression[XSI_TYPE];
//
//        if (xsi.indexOf(FIXED) > -1) {
//            // 1. if ValueExpression is a FixedValue - Identifier is the Value of this ValueExpression.
//            value.fixed = valueExpression[VALUE];
//
//        } else if (xsi.indexOf(PARAM) > -1) {
//            // 2. ValueExpression is ParametricValue - Is end when ValueExpression/AssignedValue is FixedValue- Identifier is the Value of this AssignedValue.
//            value.expression = {};
//            value.expression = storeValueExpression(key, value.expression, valueExpression[ASSIGNED_VALUE], derivedValueMap);
//
//        } else if (xsi.indexOf(DERIVED) > -1) {
//            // 3. ValueExpression is DerivedValue - its source needs to be stored and tracked
//            valueSrc = valueExpression[VALUE_SOURCE];
//            derivedValueMap[key] = valueSrc; // store derived value sources and its identifier to map
//            // todo: next pass compare all pairs stored in derivedValueMaps
//        }
//        return value;
//    };

    var processFormulaArrays = function (formulaArray1, formulaArray2, parent) {
        storeFormulaInfo(formulaArray1, parent.name);
        storeFormulaInfo(formulaArray2, parent.name);
    };

    var storeFormulaInfo = function (formulaArray, parentIdentifier) {
        var TYPE = "@xsi:type",
            ID = "@ID",
            OPERATION = "@Operation",
            OPERAND = "@Operand",
            i,
            key,
            value = {};
        for (i = 0; i < formulaArray; i += 1) {
            key = formulaArray[i][ID];
            value.parentIdentifier = parentIdentifier;
            value.formula = {};
            value.formula.type = formulaArray[i][TYPE];
            value.formula.operation = formulaArray[i][OPERATION];
            value.formula.operand = formulaArray[i][OPERAND];
            valueFlow1_map[key] = value;
        }
    };
//
//    var compareValueFlow = function () {
//
//    };

//    var compareValueFlow = function () {
//        var keyLen1 = Object.keys(derivedValue1_map).length,
//            keyLen2 = Object.keys(derivedValue2_map).length,
//            result = {
//                success: true,
//                messages: {
//                    info: [],
//                    warn: [],
//                    error: []
//                }
//            };
//
//        if (keyLen1 !== keyLen2) {
//            result.success = false;
//            result.messages.warn.push("Designs do not have the same number of derived properties"); //todo: what's a meaningful message?
//        } else {
//            result.success = compareAllPairsOfDerivedValuePairs(keyLen1, Object.keys(derivedValue1_map).slice(0), Object.keys(derivedValue2_map).slice(0));
//            result.messages.warn.push("The derived values have different sources"); // todo: add a message here
//        }
//        return result;
//    };
//    var compareAllPairsOfDerivedValuePairs = function (target, keys1, keys2) {
//        var i,
//            j,
//            counter = 0,
//            keyId1,
//            keyId2,
//            srcId1,
//            srcId2,
//            success;
//
//        // follow and compare all pairs of derived value flows
//        for (i = 0; i < keys1.length; i += 1) {
//            for (j = 0; j < keys1.length; j += 1) {
//                keyId1 = keys1[i]; // value ID of derived property
//                keyId2 = keys2[j]; // value ID of derived property
//                srcId1 = derivedValue1_map[keyId1]; // valueSource of derived property
//                srcId2 = derivedValue2_map[keyId1]; // valueSource of derived property
//
//                // if value id points to the same parentIdentifier && valueSource points to the source with the same parent identifier
//                if (valueFlow1_map[keyId1].parentIdentifier === valueFlow2_map[keyId2].parentIdentifier
//                        && valueFlow1_map[srcId1].parentIdentifier === valueFlow2_map[srcId2].parentIdentifier) {
//                    ++counter;
//                    keys1.splice(i, 1);
//                    keys2.splice(j, 1);
//                    --i;
//                    --j;
//                    if (valueFlow1_map[srcId1].hasOwnProperty("formula") || valueFlow2_map[srcId2].hasOwnProperty("formula")) {
//                        compareFormulas(srcId1, srcId2);
//                    }
//                    break;
//                }
//            }
//        }
//
//        if (counter !== target) {
//            success = false;
//        }
//        return success;
//    };
//
//    var compareFormulas = function (formulaId1, formulaId2) {
//        var SIMPLE = "SimpleFormula",
//            formula1,
//            formula2,
//            result = {
//                success: true,
//                messages: {
//                    info: [],
//                    warn: [],
//                    error: []
//                }
//            };
//
//        if (valueFlow1_map[formulaId1].hasOwnProperty("formula") !== valueFlow2_map[formulaId2].hasOwnProperty("formula")) {
//            result.success = false;
//            result.messages.warn.push("Not matching formulas"); // todo: more meaningful message
//        } else {
//            formula1 = valueFlow1_map[formulaId1];
//            formula2 = valueFlow2_map[formulaId2];
//            if (formula1.formula.type.indexOf("SIMPLE") > -1 && formula1.formula.type === formula2.formula.type) {
//                if (formula1.formula.operation !== formula2.formula.operation) {
//                    result.success = false;
//                    result.messages.warn.push("Mismatching operations"); // todo: more meaningful msg
//                } else {
//                    result = compareSimpleFormulaOperands(formula1.formula.operand, formula2.formula.operand);
//                }
//            }
//        }
//        return result;
//    };
//
//    var compareSimpleFormulaOperands = function (operand1, operand2) {
//        var operandArray1 = operand1 === "" ? [] : operand1.split(" "),
//            operandArray2 = operand2 === "" ? [] : operand2.split(" "),
//            result = {
//                success: true,
//                messages: {
//                    info: [],
//                    warn: [],
//                    error: []
//                }
//            };
//
//        if (operandArray1.length !== operandArray2.length) {
//            result.success = false;
//            result.messages.warn.push("Formulas have different numbers of operands"); // todo: maybe an error msg; more meaningful
//        } else {
//            // todo: each of these have to go back to follow value flow
//            result.success = compareAllPairsOfDerivedValuePairs(operandArray1.length, operandArray1, operandArray2);
//            if (!result.success) {
//                result.messages.warn.push("Operands of formula do not match"); // todo: more meaningful messages here
//            }
//        }
//        return result;
//    };
//</editor-fold>


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



//    /**
//     * When two component arrays have equal length, compare each pair of components
//     * success - if component array length number of pairs match
//     * fail - otherwise
//     * @param name
//     * @param type
//     * @param parent
//     * @param componentArray1
//     * @param componentArray2
//     * @param nextFunc
//     */
//    var compareAllPairsInArrays = function (name, type, parent, componentArray1, componentArray2, nextFunc) {
//        var TARGET = componentArray1.length,
//            counter = 0,
//            i,
//            j,
//            node,
//            result = {
//                success: true,
//                messages: {
//                    info: [],
//                    warn: [],
//                    error: []
//                }
//            };
//
//        for (i = 0; i < componentArray1.length; i += 1) {
//            for (j = 0; j < componentArray1.length; j += 1) {
//                node = {
//                    name: name,
//                    type: type,
//                    parent: parent,
//                    children: []
//                };
//                result = nextFunc(componentArray1[i], componentArray2[j], node);
//                if (result.success) {
//                    ++counter;
//                    componentArray1.splice(i, 1);
//                    componentArray2.splice(j, 1);
//                    --i;
//                    --j;
//                    break;
//                }
//            }
//        }
//
//        if (counter !== TARGET) {
//            result.success = false;
//
//        }
//    };

console.log (compareAdms(adm1, adm2));
