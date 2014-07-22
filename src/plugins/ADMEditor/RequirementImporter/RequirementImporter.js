/**
* Generated by PluginGenerator from webgme on Thu Jul 17 2014 16:46:10 GMT-0500 (Central Daylight Time).
*/

define(['plugin/PluginConfig', 'plugin/PluginBase', 'plugin/RequirementImporter/RequirementImporter/meta'], function (PluginConfig, PluginBase, MetaTypes) {
    'use strict';

    /**
    * Initializes a new instance of RequirementImporter.
    * @class
    * @augments {PluginBase}
    * @classdesc This class represents the plugin RequirementImporter.
    * @constructor
    */
    var RequirementImporter = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.meta = null;
        this.metricMap = {};
        this.missingMetrics = false;
        this.acceptErrors = false;
    };

    // Prototypal inheritance from PluginBase.
    RequirementImporter.prototype = Object.create(PluginBase.prototype);
    RequirementImporter.prototype.constructor = RequirementImporter;

    /**
    * Gets the name of the RequirementImporter.
    * @returns {string} The name of the plugin.
    * @public
    */
    RequirementImporter.prototype.getName = function () {
        return "Requirement Importer";
    };

    /**
    * Gets the semantic version (semver.org) of the RequirementImporter.
    * @returns {string} The version of the plugin.
    * @public
    */
    RequirementImporter.prototype.getVersion = function () {
        return "0.1.0";
    };

    /**
    * Gets the description of the RequirementImporter.
    * @returns {string} The description of the plugin.
    * @public
    */
    RequirementImporter.prototype.getDescription = function () {
        return "Imports a requirement from a json representation.";
    };

    /**
     * Gets the configuration structure for the AcmImporter.
     * The ConfigurationStructure defines the configuration for the plugin
     * and will be used to populate the GUI when invoking the plugin from webGME.
     * @returns {object} The version of the plugin.
     * @public
     */
    RequirementImporter.prototype.getConfigStructure = function () {
        return [
            {
                "name": "requirement",
                "displayName": "Requirement",
                "description": "Existing requirements in json representation.",
                "value": "",
                "valueType": "asset",
                "readOnly": false
            },
            {
                'name': 'partial',
                'displayName': 'Import partial',
                'description': 'If the workspace is missing metrics - requirements w/o assigned metrics will be created.',
                'value': true,
                'valueType': 'boolean',
                'readOnly': false
            }
        ];
    };
    /**
    * Main function for the plugin to execute. This will perform the execution.
    * Notes:
    * - Always log with the provided logger.[error,warning,info,debug].
    * - Do NOT put any user interaction logic UI, etc. inside this method.
    * - callback always has to be called even if error happened.
    *
    * @param {function(string, plugin.PluginResult)} callback - the result callback
    */
    RequirementImporter.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            config;

        if (!self.activeNode) {
            self.createMessage(null, 'Active node is not present! This happens sometimes... Loading another model ' +
                'and trying again will solve it most of times.', 'error');
            return callback('Active node is not present!', self.result);
        }

        if (self.isMetaTypeOf(self.activeNode, self.META.RequirementsFolder) === false) {
            self.createMessage(null, 'This plugin must be called from a RequirementsFolder.', 'error');
            return callback(null, self.result);
        }

        self.meta = MetaTypes;
        self.updateMETA(self.meta);
        config = self.getCurrentConfig();
        self.acceptErrors = config.partial;
        self.blobClient.getObject(config.requirement, function (err, requirementBuffer) {
            var reqStr,
                reqJson,
                wsNode;
            if (err) {
                self.createMessage(null, 'Could not obtain file from blob.', 'error');
                return callback(null, self.result);
            }
            reqStr = String.fromCharCode.apply(null, new Uint8Array(requirementBuffer));
            try {
                reqJson = JSON.parse(reqStr);
            } catch (exc) {
                self.logger.error('Could not parse given file as json, err: ' + exc.message);
                self.createMessage(null, 'Could not parse given file as json, err: ' + exc.message, 'error');
                return callback(null, self.result);
            }
            wsNode = self.getWorkspaceNode(self.activeNode);
            self.gatherMetrics(wsNode, function (err) {
                if (err) {
                    self.createMessage(wsNode, 'Something went wrong exploring the test-benches/metrics.', 'error');
                    self.result.setSuccess(false);
                    return callback(null, self.result);
                }
                self.buildRequirementRec(reqJson, self.activeNode, 0);
                self.result.setSuccess(true);
                if (self.missingMetrics && self.acceptErrors) {
                    self.createMessage(wsNode, 'Some metrics did not exist in project - requirements still imported.', 'warning');
                    self.result.setSuccess(true);
                    self.save('Imported requirements', function (err) {
                        callback(null, self.result);
                    });
                } else if (self.missingMetrics) {
                    self.createMessage(wsNode, 'Some metrics in the requirements did not exist in project!', 'error');
                    self.result.setSuccess(true);
                    callback(null, self.result);
                }
            });
        });
    };

    RequirementImporter.prototype.buildRequirementRec = function (req, parent, siblingNbr) {
        var self = this,
            node,
            metricNode,
            isCategory,
            i;
        if (req.hasOwnProperty('children')) {
            node = self.core.createNode({parent: parent, base: self.meta.RequirementCategory});
            isCategory = true;
        } else {
            node = self.core.createNode({parent: parent, base: self.meta.Requirement});
            if (req.hasOwnProperty('KPP')) {
                self.core.setAttribute(node, 'KPP', req.KPP);
            }
            if (req.hasOwnProperty('objective')) {
                self.core.setAttribute(node, 'objective', req.objective);
            }
            if (req.hasOwnProperty('threshold')) {
                self.core.setAttribute(node, 'threshold', req.threshold);
            }
            if (req.hasOwnProperty('function')) {
                self.core.setAttribute(node, 'function', req.function);
            }
            metricNode = self.metricMap[req.metricName + '-in-' + req.testBench];
            if (metricNode) {
                self.core.setPointer(node, 'Metric', metricNode);
            } else {
                if (self.acceptErrors) {
                    self.createMessage(node, 'Requirement named "' + req.name +
                        '" did not have a matching metric and test-bench.', 'warning');
                } else {
                    self.createMessage(node, 'Requirement named "' + req.name +
                        '" did not have a matching metric and test-bench.', 'error');
                }
                self.missingMetrics = true;
            }
        }
        // Common attributes
        self.core.setAttribute(node, 'name', req.name);
        self.core.setRegistry(node, 'position', {x: 100, y: 100 + 100 * siblingNbr});
        if (req.hasOwnProperty('weight')) {
            self.core.setAttribute(node, 'weight', req.weight);
        }
        if (req.hasOwnProperty('weightNeg')) {
            self.core.setAttribute(node, 'weightNeg', req.weightNeg);
        }
        if (req.hasOwnProperty('Priority')) {
            self.core.setAttribute(node, 'Priority', req.Priority);
        }
        if (req.hasOwnProperty('description')) {
            self.core.setAttribute(node, 'description', req.description);
        }

        if (isCategory) {
            for (i = 0; i < req.children.length; i += 1) {
                self.buildRequirementRec(req.children[i], node, i);
            }
        }
    };

    RequirementImporter.prototype.gatherMetrics = function (wsNode, callback) {
        var self = this;
        self.core.loadChildren(wsNode, function (err, children) {
            var counter,
                i,
                counterCallback,
                error = '';

            if (err) {
                return callback('Could not load children for project, err: ' + err, self.result);
            }
            if (children.length === 0) {
                return callback(null);
            }
            // Define a counter and callback for the recursion.
            counter = {visits: children.length};
            counterCallback = function (err) {
                error = err ? error += err : error;
                counter.visits -= 1;
                if (counter.visits === 0) {
                    callback(error);
                }
            };
            // Iterate over children and invoke recursion on ACMFolders.
            for (i = 0; i < children.length; i += 1) {
                if (self.isMetaTypeOf(children[i], self.meta.ATMFolder)) {
                    self.visitTestBenchesRec(children[i], counter, null, counterCallback);
                } else {
                    counterCallback(null);
                }
            }
        });
    };

    RequirementImporter.prototype.visitTestBenchesRec = function (node, counter, tbName, callback) {
        var self = this,
            name = self.core.getAttribute(node, 'name'),
            childName;

//        if (self.acmCounter <= 0) {
//            callback(null);
//        }
        self.core.loadChildren(node, function (err, children) {
            var i,
                childMetaType;
            if (err) {
                return callback(' loadChildren failed for ' + name + ' with error : ' + err);
            }
            counter.visits += children.length;

            if (children.length === 0) {
                // The only chance for callback to be called.
                callback(null);
            } else {
                // The node needs to be accounted for.
                counter.visits -= 1;
            }
            for (i = 0; i < children.length; i += 1) {
                childMetaType = self.core.getAttribute(self.getMetaType(children[i]), 'name');
                childName = self.core.getAttribute(children[i], 'name');
                if (childMetaType === 'ATMFolder' || childMetaType === 'AVMTestBenchModel') {
                    self.visitTestBenchesRec(children[i], counter, childName, callback);
                } else if (childMetaType === 'Metric') {
                    self.metricMap[childName + '-in-' + tbName] = children[i];
                    callback(null);
                } else {
                    callback(null);
                }
            }
        });
    };

    RequirementImporter.prototype.getWorkspaceNode = function (node) {
        var self = this;
        while (node) {
            if (self.isMetaTypeOf(node, self.meta.WorkSpace)) {
                self.logger.debug('Found WorkSpace-Node : ' + self.core.getAttribute(node, 'name'));
                return node;
            }
            node = self.core.getParent(node);
        }
        self.logger.error('Could not find WorkSpace!!');
    };

    return RequirementImporter;
});