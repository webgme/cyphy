/*globals angular, console, window*/

angular.module( 'CyPhyApp', [
    'ui.router',

    'gme.services',

    'isis.ui.components',

    'cyphy.components'
] )
    .run( function ( $state, growl, dataStoreService, projectService, branchService ) {
        'use strict';
        var connectionId = 'my-db-connection-id';

        dataStoreService.connectToDatabase( connectionId, {
            host: window.location.basename
        } )
            .then( function () {
                // select default project and branch (master)
                return projectService.selectProject( connectionId, 'ADMEditor' );
            } )
            .then( function () {
                dataStoreService.watchConnectionState( connectionId, function ( eventType ) {
                    console.log( 'watchConnectionState: ' + eventType );
                } );
                return branchService.selectBranch( connectionId, 'master' );
            } )
            .then( function () {
                branchService.watchBranchState( 'my-db-connection-id', function ( eventType ) {
                    console.log( 'watchBranchState: ' + eventType );
                } );
            } )
            .
        catch ( function ( reason ) {
            growl.error( 'ADMEditor does not exist. Create and import it using the <a href="' +
                window.location.origin + '"> webgme interface</a>.' );
            console.error( reason );
        } );
    } )
    .controller( 'TestController', function ( $scope, branchService, nodeService ) {
        'use strict';
        $scope.data = {
            branchName: 'master',
            extra: false
        };
        console.log( 'TestController' );

        $scope.switchBranch = function () {
            //nodeService.logContext()
            branchService.selectBranch('my-db-connection-id', $scope.data.branchName)
                .then(function(id) {
                    console.log('branch selected', id);
                })
                .catch(function(err) {
                    console.error(err);
                    window.alert('"' + $scope.data.branchName + '" does not exist!');
                });
        };
    } );
