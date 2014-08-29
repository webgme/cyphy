var adm2Object = require('./dependencies/adm2object.js');
var adm1 = adm2Object('./samples/MyMassSpringDamper.adm');
var adm2 = adm2Object('./samples/MyMassSpringDamper.adm');

var compareAdms = function (adm1, adm2) {
    var result = {
        success: true,
        messages: []
    };
    //TODO: here goes the code
    console.log(JSON.stringify(adm1, null, 2));
    console.log(JSON.stringify(adm2, null, 2));

    return result;
};

compareAdms(adm1, adm2);


