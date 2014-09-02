var adm2Object = require('./dependencies/adm2object.js');
var adm1 = adm2Object('./src/compareAdms/samples/MyMassSpringDamper.adm');
var adm2 = adm2Object('./src/compareAdms/samples/MyMassSpringDamper.adm');

var compareAdms = function (adm1, adm2) {
    var result = {
            success: true,
            messages: []
        };
    //TODO: here goes the code
//    console.log(JSON.stringify(adm1, null, 2));
//    console.log(JSON.stringify(adm2, null, 2));

    if (JSON.stringify(adm1, null, 2) === JSON.stringify(adm2, null, 2)) {
        result.success = true;
        result.messages = "The given two adm designs are identical.";
    } else {
        // deep compare
        compareRootContainer(adm1.Design, adm2.Design);
    }

    return result;
};

    var compareRootContainer = function (design1, design2) {
        var result,
            root1 = design1.RootContainer,
            root2 = design2.RootContainer;

        result = compareContainerArrays(root1, root2);
        return result;
    };

    /**
     * Compare two container Arrays by making a recursive call that compares individual container object
     * @param containerArray1 - an array of containers
     * @param containerArray2 - a second array of containers
     */
    var compareContainerArrays = function (containerArray1, containerArray2) {
        var result = {
                success: true,
                messages: []
            },
            len1 = containerArray1.length,
            len2 = containerArray2.length,
            i,
            cont1,
            cont2;

        if (JSON.stringify(containerArray1, null, 2) === JSON.stringify(containerArray2, null, 2)) {
            result.success = true;
            result.message = "The designs have the same containers";
        } else if (len1 !== len2) {
            result.success = false;
            result.message = "The designs have different numbers of containers.";
        } else {
            for (i = 0; i < len1; i += 1) {
                // each cont is an object
                cont1 = containerArray1[i];
                cont2 = containerArray2[i];
                result = compareContainers(cont1, cont2);
                if (!result.success) {
                    break;
                }
            }
        }
        return result;
    };

    var compareContainers = function (container1, container2) {
        var result = {
                success: true,
                messages: []
            },
            XSI_TYPE = "@xsi:type",
            NAME = "@name",
            ELEMENTS = [
                "Container",
                "Connector",
                "Property",
                "Formula",
                "ComponentInstance"
            ],
            FUNCTIONS = [
                compareContainerArrays,
                compareComponentInstanceArrays,
                compareProperties,
                compareFormulas,
                compareComponentInstances
            ],
            i,
            type1 = container1[XSI_TYPE],
            type2 = container2[XSI_TYPE],
            name1 = container1[NAME],
            name2 = container2[NAME];

        if (JSON.stringify(container1, null, 2) === JSON.stringify(container2, null, 2)) {
            result.success = true;
            // todo: add a message here to show success

        } else if (type1 !== type2 || name1 !== name2) {
            result.success = false;
            result.message = "The designs have different containers: " + name1 + ", " + name2;
        } else {
            // compare the container's child components
            for (i = 0; i < ELEMENTS.length; i += 1) {
                if (container1.hasOwnProperty(ELEMENTS[i]) === container2.hasOwnProperty(ELEMENTS[i])) {
                    if (container1.hasOwnProperty(ELEMENTS[i])) {
                        // deep compare elements of each container's child element
                        result = FUNCTIONS[i](container1[ELEMENTS[i]], container2[ELEMENTS[i]]);
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

    var compareComponentInstanceArrays = function (componentInstanceArray1, componentInstanceArray2) {
        var result = {
                success: true,
                messages: []
            },
            len1 = componentInstanceArray1.length,
            len2 = componentInstanceArray2.length,
            i,
            instance1,
            instance2;

        if (JSON.stringify(componentInstanceArray1, null, 2) === JSON.stringify(componentInstanceArray2, null, 2)) {
            result.success = true;
            result.message = "The designs have the same containers";
        } else if (len1 !== len2) {
            result.success = false;
            result.message = "The designs have different numbers of ComponentInstances.";
        } else {
            for (i = 0; i < len1; i += 1) {
                // each cont is an object
                instance1 = componentInstanceArray1[i];
                instance2 = componentInstanceArray2[i];
                result = compareContainers(instance1, instance2);
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
                comparePrimitivePropertyInstances,
                compareConnectorInstances
            ],
            name1 = componentInstance1[NAME],
            name2 = componentInstance2[NAME],
            id1 = componentInstance1[COMPONENT_ID],
            id2 = componentInstance2[COMPONENT_ID];

        if (JSON.stringify(componentInstance1, null, 2) === JSON.stringify(componentInstance2, null, 2)) {
            result.success = true;
            result.message = "The designs have the same containers";
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
    };

    var compareProperties = function () {

    };

    var compareConnectors = function () {

    };

    var compareFormulas = function () {

    };

    var compareSimpleFormulas = function () {

    };

    var compareCustomFormulas = function () {

    };

    var comparePrimitivePropertyInstances = function () {

    };

    var compareConnectorInstances = function () {

    };

    var compareRoles = function () {

    };

    var compareModelica = function () {

    };

    var compareCAD = function () {

    };

compareAdms(adm1, adm2);
