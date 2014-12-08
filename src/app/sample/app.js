/*globals angular, console*/

var TIMEOUT = 0;
// uncomment this and the meta nodes won't be loaded:
// TIMEOUT = 1000;

var fatal = function (err) {
    console.log(err);
};

var CyPhyApp = angular.module('CyPhyApp', [
    'ui.router',

    'gme.services',

    'isis.ui.components',

    'cyphy.components',

    // app specific templates
    'cyphy.sample.templates'
])
    .run(function ($state, $http, growl, dataStoreService, projectService, nodeService) {
        'use strict';
    });

// TODO: require all of your controllers
//require('./views/MyView/MyViewController');


angular.module('CyPhyApp')
    .controller('MyViewController', function ($scope, $timeout, $http, growl, dataStoreService, projectService, nodeService, branchService) {
        'use strict';

        $scope.logs = ['init'];

        var log = function (message) {
            $scope.logs.push(message);
        };

        var databaseId = 'my-db-connection-id';

        var meta;
        var context;
        //$http.get('/rest/external/copyproject/noredirect')
        //    .then(function(data) {
        //        //return data.data;
        //        return "NkLabsPrototype";
        //    }).then(
        (function(projectName) {
                return dataStoreService.connectToDatabase(databaseId, {host: window.location.basename})
                    .then(function () {
                        // select default project and branch (master)
                        log('db open');
                        return projectService.selectProject(databaseId, projectName);
                    })
                    .catch(function (reason) {
                        log('ADMEditor does not exist. Create and import it using the <a href="' +
                        window.location.origin + '"> webgme interface</a>.');
                        fatal(reason);
                    });
            })("NkLabsPrototype").then(function (project) {
                context = {
                    db: databaseId,
                    projectId: project,
                    branchId: 'master',
                    regionId: (new Date()).toISOString() + 'x'
                };
                return $timeout(function () {
                    return project;
                }, TIMEOUT);
            }).then(function () {
                return branchService.selectBranch(databaseId, "master_copy");
            }).then(function(project) {
                return nodeService.getMetaNodes(context);
            }).then(function (metaNodes) {
                meta = metaNodes;
                log('meta loaded');
                //nodeService.loadNode(context, nodeId)
            }).catch(fatal);
    });
