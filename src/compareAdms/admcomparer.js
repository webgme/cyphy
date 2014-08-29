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
            subResult,
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
                compareContainers,
                compareConnectorInstances,
                compareProperties,
                compareFormulas,
                compareComponentInstances
            ],
            i,
            root1 = design1.RootContainer,
            root2 = design2.RootContainer,
            type1 = root1[XSI_TYPE],
            type2 = root2[XSI_TYPE],
            name1 = root1[NAME],
            name2 = root2[NAME];

        result = {
            success: true,
            messages: []
        };

        if (JSON.stringify(root1, null, 2) === JSON.stringify(root2, null, 2)) {
            result.success = true;
            result.messages = "Two adm designs are the same.";
        } else if (type1 !== type2) {
            // Check RootContainer xsi:type
            result.success = false;
            result.messages = "Two designs have different types.";
        } else if (name1 !== name2) {
            // Check RootContainer name
            result.success = false;
            result.messages = "Two designs have different names.";
        } else {
            // deeper compare elements of rootcontainers
            for (i = 0; i < ELEMENTS.length; i += 1) {
                if (root1.hasOwnProperty(ELEMENTS[i]) === root2.hasOwnProperty(ELEMENTS[i])) {
                    if (root1.hasOwnProperty(ELEMENTS[i])) {
                        // deep compare elements of each root container child element
                        subResult = FUNCTIONS[i](root1[ELEMENTS[i]], root2[ELEMENTS[2]]);
                        if (!subResult.success) {
                            result = subResult;
                            return result; // todo: or break
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

    var compareContainers = function (container1, container2) {
        var result = {
                success: true,
                messages: []
            },
            XSI_TYPE = "@xsi:type",
            NAME = "@name",
            i,
            type1 = container1[XSI_TYPE],
            type2 = container2[XSI_TYPE],
            name1 = container1[NAME],
            name2 = container2[NAME],
            len1 = container1.length,
            len2 = container2.length;

        if (JSON.stringify(container1, null, 2) === JSON.stringify(container2, null, 2)) {
            result.success = true;
            result.message = "The designs have the same containers";
        } else if (len1 !== len2 || type1 !== type2 || name1 !== name2) {
            result.success = false;
            result.message = "The designs have different containers.";
        } else {

        }

    };

    var compareComponentInstances = function () {

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
