var fs = require("fs");

var converters = require('./xmljsonconverter.js');
var arrayElementsInXml = {
    Design: false,
    RootContainer: false,
    Value: false,
    Container: true,
    Connector: true,
    Property: true,
    Formula: true,
    Operand: true,
    ComponentInstance: true,
    PrimitivePropertyInstance: true,
    ConnectorInstance: true,
    Role: true
};
var xml2json = new converters.Xml2json({ skipWSText: true, arrayElements: arrayElementsInXml});

var adm2Object = function (admFile) {
    var buffer = fs.readFileSync(admFile);
    var output = xml2json.convertFromBuffer(buffer);
    var filename = admFile.replace('adm', 'json');
    fs.writeFileSync(filename, output);
    return output;
};

module.exports = adm2Object;