// This part of forms-angular borrows _very_ heavily from https://github.com/Alexandre-Strzelewicz/angular-bridge
// (now https://github.com/Unitech/angular-bridge

var _ = require('underscore'),
    util = require('util'),
    extend = require('node.extend'),// needed for deep copy even though underscore has an extend
    async = require('async'),
    url = require('url'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    path = require('path'),
    debug = true;

mongoose.set('debug', debug);

var logApiCall = function (req, res, next) {
    console.log('API     : ' + req.method + ' ' + req.url + '  [ ' + JSON.stringify(req.body) + ' ]');
    next();
};


var makeArgList = function (options, array) {
    if (options.authentication) {
        array.splice(1, 0, options.authentication)
    }
    if (debug) {
        array.splice(1, 0, logApiCall)
    }
    array[0] = options.urlPrefix + array[0];
    return array;
};



var DataForm = function (app, options) {
    this.app = app;
    this.options = _.extend({
        urlPrefix: '/api/'
    }, options || {});
    this.resources = [];
    this.searchFunc = async.each;

    this._registerRoutes();
    this.app.get.apply(this.app, makeArgList(this.options, ['search', this.searchAll()]));
};
module.exports = exports = DataForm;



DataForm.prototype._getListFields = function (resource, doc) {
    var display = ''
        , listElement = 0
        , listFields = resource.options.listFields;

    if (listFields) {
        for (; listElement < listFields.length; listElement++) {
            display += doc[listFields[listElement].field] + ' ';
        }
    } else {
        listFields = Object.keys(resource.model.schema.paths);
        for (; listElement < 2; listElement++) {
            display += doc[listFields[listElement]] + ' ';
        }
    }
    return display.trim();
};

/**
* Registers all REST routes with the provided 'app' object.
*/
DataForm.prototype._registerRoutes = function () {

    // get the list of registered models
    this.app.get.apply(this.app, makeArgList(this.options, ['models',                           this.models()]));

    this.app.get.apply(this.app, makeArgList(this.options, ['search/:resourceName',             this.search()]));

    this.app.get.apply(this.app, makeArgList(this.options, ['schema/:resourceName',             this.schema()]));
    this.app.get.apply(this.app, makeArgList(this.options, ['schema/:resourceName/:formName',   this.schema()]));

    this.app.get.apply(this.app, makeArgList(this.options, ['report/:resourceName',             this.report()]));
    this.app.get.apply(this.app, makeArgList(this.options, ['report/:resourceName/:reportName', this.report()]));

    this.app.all.apply(this.app,  makeArgList(this.options, [':resourceName',                   this.collection()]));
    this.app.get.apply(this.app,  makeArgList(this.options, [':resourceName',                   this.collectionGet()]));
    this.app.post.apply(this.app, makeArgList(this.options, [':resourceName',                   this.collectionPost()]));

    this.app.all.apply(this.app,  makeArgList(this.options,   [':resourceName/:id',             this.entity()]));
    this.app.get.apply(this.app,  makeArgList(this.options,   [':resourceName/:id',             this.entityGet()]));
    this.app.post.apply(this.app, makeArgList(this.options,   [':resourceName/:id',             this.entityPut()]));
    this.app.put.apply(this.app,  makeArgList(this.options,   [':resourceName/:id',             this.entityPut()]));
    this.app.delete.apply(this.app, makeArgList(this.options, [':resourceName/:id',             this.entityDelete()]));

    // return the List attributes for a record - used by select2
    this.app.all.apply(this.app, makeArgList(this.options, [':resourceName/:id/list',           this.entity()]));
    this.app.get.apply(this.app, makeArgList(this.options, [':resourceName/:id/list',           this.entityList()]));
};

/*
*   Add a resource to the resource collection
*   A resource is:
*       {
*           resource_name: string identifier
*           model: <mongoose model object>
*           options: a hash of options
*       }
*   Models may include their own options, which means they can be passed through from the model file.
*   See models/b_using_options.js for an example.
*/
DataForm.prototype.addResource = function (resource_name, model, options) {
    var resource = {
        resource_name: resource_name,
        options: options || {}
    };

    if (typeof model === 'function') {
        resource.model = model;
    } else {
        resource.model = model.model;
        for (var prop in model) {
            if (model.hasOwnProperty(prop) && prop !== 'model') {
                resource.options[prop] = model[prop];
            }
        }
    }

    // if (resource_name === 'b_using_options') {
    //     console.log('Before: ');
    //     console.log(resource.options);
    // }

    extend( resource.options, this.preprocess(resource.model.schema.paths, null) );

    // if (resource_name === 'b_using_options') {
    //     console.log('After: ');
    //     console.log(resource.options);
    // }


    if (resource.options.searchImportance) {
        this.searchFunc = async.forEachSeries;
    }
    if (this.searchFunc === async.forEachSeries) {
        this.resources.splice(_.sortedIndex(this.resources, resource, function (obj) {
            return obj.options.searchImportance || 99
        }), 0, resource);
    } else {
        this.resources.push(resource);
    }
};

/**
* Populates a resource's options object with all of the path information from the mongoose model.
* If the formSchema is supplied, then the the model's form() methis is called, which should return
* an object indicating the fields to display. The formName is probably more appropriately called a
* 'view' into the model.
* See models/b_using_options.js and models/b_using_options.json as examples.
*/
DataForm.prototype.preprocess = function (paths, formSchema) {
    var outPath = {},
        hiddenFields = [],
        listFields = [];

    for (var element in paths) {
        if (paths.hasOwnProperty(element) && element != '__v') {
            // check for schemas
            if (paths[element].schema) {
                var subSchemaInfo = this.preprocess(paths[element].schema.paths);
                outPath[element] = {schema: subSchemaInfo.paths};
                if (paths[element].options.form) {
                    outPath[element].options = {form: extend(true, {}, paths[element].options.form)};
                }
            } else {
                // check for arrays
                var realType = paths[element].caster ? paths[element].caster : paths[element];
                if (!realType.instance) {
                    if (realType.options.type) {
                        var type = realType.options.type(),
                            typeType = typeof type;

                        if (typeType === 'string') {
                            realType.instance = (Date.parse(type) !== NaN) ? 'Date' : 'String';
                        } else {
                            realType.instance = typeType;
                        }
                    }
                }
                outPath[element] = extend(true, {}, paths[element]);
                if (paths[element].options.secure) {
                    hiddenFields.push(element);
                }
                if (paths[element].options.match) {
                    outPath[element].options.match = paths[element].options.match.source;
                }
                if (paths[element].options.list) {
                    listFields.push({field: element, params: paths[element].options.list})
                }
            }
        }
    }
    if (formSchema) {
        var vanilla = outPath;
        outPath = {};
        for (var fld in formSchema) {
            if (formSchema.hasOwnProperty(fld)) {
                if (!vanilla[fld]) {
                    throw new Error("No such field as " + fld + ".  Is it part of a sub-doc? If so you need the bit before the period.")
                }
                outPath[fld] = vanilla[fld];
                outPath[fld].options = outPath[fld].options || {};
                for (var override in formSchema[fld]) {
                    if (formSchema[fld].hasOwnProperty(override)) {
                        if (!outPath[fld].options.form) {
                            outPath[fld].options.form = {};
                        }
                        outPath[fld].options.form[override] = formSchema[fld][override];
                    }
                }
            }
        }
    }

    var returnObj = { paths: outPath };

    if (hiddenFields.length > 0) {
        returnObj.hide = hiddenFields;
    }
    if (listFields.length > 0) {
        returnObj.listFields = listFields;
    }
    return returnObj;
};

DataForm.prototype.getResource = function (name) {
    return _.find(this.resources, function (resource) {
        return resource.resource_name === name;
    });
};

DataForm.prototype._internalSearch = function (req, resourcesToSearch, limit, callback) {
    var searches = [],
        resourceCount = resourcesToSearch.length,
        url_parts = url.parse(req.url, true),
        searchFor = url_parts.query.q,
        filter = url_parts.query.f;

    var translate = function (string, array, context) {
        if (array) {
            var translation = _.find(array, function (fromTo) {
                return fromTo.from === string && (!fromTo.context || fromTo.context === context)
            });
            if (translation) {
                string = translation.to;
            }
        }
        return string;
    };

    // return a string that determines the sort order of the resultObject
    var calcResultValue = function (obj) {

        var padLeft = function (number, reqLength, str){
            return Array(reqLength-String(number).length+1).join(str||'0')+number;
        };

        var sortString = '';
        sortString += padLeft(obj.addHits || 9, 1);
        sortString += padLeft(obj.searchImportance || 99, 2);
        sortString += padLeft(obj.weighting || 9999, 4);
        sortString += obj.text;
        return sortString;
    };

    if (filter) {
        filter = JSON.parse(filter)
    }

    for (var i = 0; i < resourceCount; i++) {
        var resource = resourcesToSearch[i];
        if (resource.options.searchImportance !== false) {
            var schema = resource.model.schema;
            var indexedFields = [];
            for (j = 0; j < schema._indexes.length; j++) {
                var attributes = schema._indexes[j][0];
                var field = Object.keys(attributes)[0];
                if (indexedFields.indexOf(field) == -1) {
                    indexedFields.push(field)
                }
            }
            for (var path in schema.paths) {
                if (path != "_id" && schema.paths.hasOwnProperty(path)) {
                    if (schema.paths[path]._index && !schema.paths[path].options.noSearch) {
                        if (indexedFields.indexOf(path) == -1) {
                            indexedFields.push(path)
                        }
                    }
                }
            }
            for (m = 0; m < indexedFields.length; m++) {
                searches.push({resource: resource, field: indexedFields[m] })
            }
        }
    }

    var that = this,
        results = [],
        moreCount = 0,
        searchCriteria;

    if (req.route.path === '/api/search') {
        // Called from search box - treat words as separate strings
        searchCriteria = {$regex: '^(' + searchFor.split(' ').join('|') +')', $options: 'i'};
    } else {
        // called from somewhere else (probably select2 ajax) preserve spaces
        searchCriteria = {$regex: '^' + searchFor, $options: 'i'};
    }

    this.searchFunc(
        searches
        , function (item, cb) {
            var searchDoc = {};
            if (filter) {
                extend(searchDoc, filter);
                if (filter[item.field]) {
                    delete searchDoc[item.field];
                    var obj1 = {}, obj2 = {};
                    obj1[item.field] = filter[item.field];
                    obj2[item.field] = searchCriteria;
                    searchDoc['$and'] = [obj1, obj2];
                } else {
                    searchDoc[item.field] = searchCriteria;
                }
            } else {
                searchDoc[item.field] = searchCriteria;
            }

            // The +60 in the next line is an arbitrary safety zone for situations where items that match the string
            // in more than one index get filtered out.
            // TODO : Figure out a better way to deal with this
            that._filteredFind(item.resource, req, null, searchDoc, item.resource.options.searchOrder, limit + 60, null, function (err, docs) {
                if (!err && docs && docs.length > 0) {
                    for (var k = 0; k < docs.length; k++) {

                        // Do we already have them in the list?
                        var thisId = docs[k]._id,
                            resultObject,
                            resultPos;
                        for (resultPos = results.length - 1; resultPos >= 0 ; resultPos--) {
                            if (results[resultPos].id.id === thisId.id) {
                                break;
                            }
                        }

                        if (resultPos >= 0) {
                            resultObject = {};
                            extend(resultObject, results[resultPos]);
                            // If they have already matched then improve their weighting
                            resultObject.addHits = Math.max((resultObject.addHits || 9) - 1, 1);
                            // remove it from current position
                            results.splice(resultPos,1);
                            // and re-insert where appropriate
                            results.splice(_.sortedIndex(results, resultObject, calcResultValue), 0, resultObject)
                        } else {
                            // Otherwise add them new...
                            // Use special listings format if defined
                            var specialListingFormat = item.resource.options.searchResultFormat;
                            if (specialListingFormat) {
                                resultObject = specialListingFormat.apply(docs[k]);
                            } else {
                                resultObject = {
                                    id: thisId,
                                    weighting: 9999,
                                    text: that._getListFields(item.resource, docs[k])
                                };
                                if (resourceCount > 1) {
                                    resultObject.resource = resultObject.resourceText = item.resource.resource_name;
                                }
                            }
                            resultObject.searchImportance = item.resource.options.searchImportance || 99;
                            if (item.resource.options.localisationData) {
                                resultObject.resource = translate(resultObject.resource, item.resource.options.localisationData, 'resource');
                                resultObject.resourceText = translate(resultObject.resourceText, item.resource.options.localisationData, 'resourceText');
                            }
                            results.splice(_.sortedIndex(results, resultObject, calcResultValue), 0, resultObject)
                        }
                    }
                }
                cb(err)
            })
        }
        , function (err) {
            // Strip weighting from the results
            results = _.map(results, function (aResult) {
                delete aResult.weighting;
                return aResult
            });
            if (results.length > limit) {
                moreCount += results.length - limit;
                results.splice(limit);
            }
            callback({results: results, moreCount: moreCount});
        }
    );
};

/**
* Middleware, Terminus - search
*/
DataForm.prototype.search = function (req, res, next) {
    return _.bind(function (req, res, next) {
        if (!(req.resource = this.getResource(req.params.resourceName))) {
            return next();
        }

        this._internalSearch(req, [req.resource], 10, function (resultsObject) {
            res.send(resultsObject);
        });
    }, this);
};

/**
* Middleware, Terminus - searchAll
*/
DataForm.prototype.searchAll = function (req, res) {
    return _.bind(function (req, res) {
        this._internalSearch(req, this.resources, 10, function (resultsObject) {
            res.send(resultsObject);
        });
    }, this);
};

/**
* Middleware, Terminus - get all models
*/
DataForm.prototype.models = function (req, res, next) {
    var that = this;
    return function (req, res, next) {
        res.send(that.resources);
    };
};

DataForm.prototype._renderError = function (err, redirectUrl, req, res) {
    if (typeof err === "string") {
        res.send(err)
    } else {
        res.send(err.message)
    }
};

/**
* Middleware, Terminus - get a schema
*/
DataForm.prototype.schema = function () {
    return _.bind(function (req, res, next) {
        if (!(req.resource = this.getResource(req.params.resourceName))) {
            return next();
        }
        var formSchema = null;
        if (req.params.formName) {
            formSchema = req.resource.model.schema.statics['form'](req.params.formName)
        }
        var paths = this.preprocess(req.resource.model.schema.paths, formSchema).paths;
        res.send(JSON.stringify(paths));
    }, this);
};

/**
* Middleware - get a schema
*/
DataForm.prototype.report = function () {
    return _.bind(function (req, res, next) {
        if (!(req.resource = this.getResource(req.params.resourceName))) {
            return next();
        }

        var reportSchema
            , self = this
            , urlParts = url.parse(req.url, true);

        if (req.params.reportName) {
            reportSchema = req.resource.model.schema.statics['report'](req.params.reportName, req)
        } else if (urlParts.query.r) {
            switch (urlParts.query.r[0]) {
                case '[':
                    reportSchema = {pipeline: JSON.parse(urlParts.query.r)};
                    break;
                case '{':
                    reportSchema = JSON.parse(urlParts.query.r);
                    break;
                default:
                    return self._renderError(new Error("Invalid 'r' parameter"), null, req, res, next);
            }
        } else {
            var fields = {};
            for (var key in req.resource.model.schema.paths) {
                if (req.resource.model.schema.paths.hasOwnProperty(key)) {
                    if (key !== '__v' && !req.resource.model.schema.paths[key].options.secure) {
                        if (key.indexOf('.') === -1) {
                            fields[key] = 1;
                        }
                    }
                }
            }
            reportSchema = {pipeline: [
                {$project: fields}
            ], drilldown: "/#!/" + req.params.resourceName + "/|_id|/edit"};
        }

        // Replace parameters in pipeline
        var schemaCopy = {};
        extend(schemaCopy, reportSchema);
        schemaCopy.params = schemaCopy.params || [];

        self._reportInternal(req, req.resource, schemaCopy, urlParts, function(err, result){
            if (err) {
                self._renderError(err, null, req, res, next);
            } else {
                res.send(result);
            }
        });
    }, this);
};

DataForm.prototype._reportInternal = function(req, resource, schema, options, callback) {
    var runPipeline
    self = this;

    self._doFindFunc(req, resource, function(err, queryObj) {
        if (err) {
            return "There was a problem with the findFunc for model";
        } else {
            // Bit crap here switching back and forth to string
            runPipeline = JSON.stringify(schema.pipeline);
            for (var param in options.query) {
                if (options.query.hasOwnProperty(param)) {
                    if (param !== 'r') {             // we don't want to copy the whole report schema (again!)
                        schema.params[param].value = options.query[param];
                    }
                }
            }

            // Replace parameters with the value
            if (runPipeline) {
                runPipeline = runPipeline.replace(/\"\(.+?\)\"/g, function (match) {
                    param = schema.params[match.slice(2, -2)];
                    if (param.type === 'number') {
                        return param.value;
                    } else if (_.isObject(param.value)) {
                        return JSON.stringify(param.value);
                    } else if (param.value[0] === '{') {
                        return param.value;
                    } else {
                        return '"' + param.value + '"';
                    }
                });
            };

            // Don't send the 'secure' fields
            for (var hiddenField in self._generateHiddenFields(resource, false)) {
                if (runPipeline.indexOf(hiddenField) !== -1) {
                    callback("You cannot access " + hiddenField);
                }
            }

            runPipeline = JSON.parse(runPipeline);

            // Replace variables that cannot be serialised / deserialised.  Bit of a hack, but needs must...
            // Anything formatted 1800-01-01T00:00:00.000Z or 1800-01-01T00:00:00.000+0000 is converted to a Date
            // Only handles the cases I need for now
            // TODO: handle arrays etc
            var hackVariables = function (obj) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        if (typeof obj[prop] === 'string') {
                            var dateTest = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3})(Z|[+ -]\d{4})$/.exec(obj[prop]);
                            if (dateTest) {
                                obj[prop] = new Date(dateTest[1]+'Z');
                            } else {
                                var objectIdTest = /^([0-9a-fA-F]{24})$/.exec(obj[prop]);
                                if (objectIdTest) {
                                    obj[prop] = new mongoose.Types.ObjectId(objectIdTest[1]);
                                }
                            }
                        } else if (_.isObject(obj[prop])) {
                            hackVariables(obj[prop]);
                        }
                    }
                }
            };

            for (var pipelineSection = 0; pipelineSection < runPipeline.length; pipelineSection++) {
                if (runPipeline[pipelineSection]['$match']) {
                    hackVariables(runPipeline[pipelineSection]['$match']);
                }
            }

            // Add the findFunc query to the pipeline
            if (queryObj) {
                runPipeline.unshift({$match: queryObj});
            }

            var toDo = {
                runAggregation: function (cb) {
                    resource.model.aggregate(runPipeline, cb)
                }
            };

            var translations = [];  // array of form {ref:'lookupname',translations:[{value:xx, display:'  '}]}
            // if we need to do any column translations add the function to the tasks list
            if (schema.columnTranslations) {
                toDo.apply_translations = ['runAggregation', function (cb, results) {

                    var doATranslate = function (column, theTranslation) {
                        results.runAggregation.forEach(function (resultRow) {
                            var thisTranslation = _.find(theTranslation.translations, function (option) {
                                return resultRow[column.field].toString() === option.value.toString()
                            });
                            resultRow[column.field] = thisTranslation.display;
                        })
                    };

                    schema.columnTranslations.forEach(function (columnTranslation) {
                        if (columnTranslation.translations) {
                            doATranslate(columnTranslation, columnTranslation);
                        }
                        if (columnTranslation.ref) {
                            var theTranslation = _.find(translations, function(translation){
                                return (translation.ref === columnTranslation.ref)
                            });
                            if (theTranslation) {
                                doATranslate(columnTranslation, theTranslation);
                            } else {
                                cb("Invalid ref property of "+columnTranslation.ref+" in columnTranslations "+columnTranslations.field)
                            }
                        }
                    });
                    cb(null, null);
                }];

                var callFuncs = false;
                for (var i = 0; i < schema.columnTranslations.length; i++) {
                    var thisColumnTranslation = schema.columnTranslations[i];

                    if (thisColumnTranslation.field) {
                        // if any of the column translations are adhoc funcs, set up the tasks to perform them
                        if (thisColumnTranslation.fn) callFuncs = true;

                        // if this column translation is a "ref", set up the tasks to look up the values and populate the translations
                        if (thisColumnTranslation.ref) {
                            var lookup = self.getResource(thisColumnTranslation.ref);
                            if (lookup) {
                                if (!toDo[thisColumnTranslation.ref]) {
                                    toDo[thisColumnTranslation.ref] = function (cb) {
                                        var translateObject = {ref:lookup.resource_name, translations: [] };
                                        translations.push(translateObject);
                                        lookup.model.find({}, {}, {lean: true}, function (err, findResults) {
                                            if (err) {
                                                cb(err);
                                            } else {
                                                for (var j = 0; j < findResults.length; j++) {
                                                    translateObject.translations[j] = {value: findResults[j]._id, display: self._getListFields(lookup, findResults[j])};
                                                }
                                                cb(null, null);
                                            }
                                        })
                                    };
                                    toDo.apply_translations.unshift(thisColumnTranslation.ref);  // Make sure we populate lookup before doing translation
                                }
                            } else {
                                return callback("Invalid ref property of " + thisColumnTranslation.ref + " in columnTranslations " + thisColumnTranslation.field);
                            }
                        }
                        if (!thisColumnTranslation.translations && !thisColumnTranslation.ref && !thisColumnTranslation.fn) {
                            return callback("A column translation needs a ref, fn or a translations property - " + translateName + " has neither");
                        }
                    } else {
                        return callback("A column translation needs a field property");
                    }
                }
                if (callFuncs) {
                    toDo['callFunctions'] = ['runAggregation', function(cb,results) {
                        async.each(results.runAggregation, function(row, cb) {
                            for (var i = 0; i < schema.columnTranslations.length; i++) {
                                var thisColumnTranslation = schema.columnTranslations[i]
                                    , translateName = thisColumnTranslation.field;

                                if (thisColumnTranslation.fn) {
                                    thisColumnTranslation.fn(row, cb);
                                }
                            }
                        }, function(err) {
                            cb(null)
                        });
                    }];
                    toDo.apply_translations.unshift('callFunctions');  // Make sure we do function before translating its result
                }
            }

            async.auto(toDo, function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    // TODO: Could loop through schema.params and just send back the values
                    callback(null,{success: true, schema: schema, report: results.runAggregation, paramsUsed: schema.params});
                }
            });
        }
    });
};

DataForm.prototype._saveAndRespond = function (req, res, hidden_fields) {

    var internalSave = function (doc) {
        doc.save(function (err, doc2) {
            if (err) {
                var err2 = {status: 'err'};
                if (!err.errors) {
                    err2.message = err.message;
                } else {
                    extend(err2, err);
                }
                if (debug) {
                    console.log('Error saving record: ' + JSON.stringify(err2))
                }
                res.send(400, err2);
            } else {
                doc2 = doc2.toObject();
                for (var hidden_field in hidden_fields) {
                    if (doc2.hasOwnProperty(hidden_field)) {
                        delete doc2[hidden_field];
                    }
                }
                res.send(doc2);
            }
        });
    };

    var doc = req.doc;
    if (typeof req.resource.options.onSave === "function") {

        req.resource.options.onSave(doc, req, function (err) {
            if (err) {
                throw err;
            }
            internalSave(doc);
        })
    } else {
        internalSave(doc);
    }
};

/**
* Middleware - All entities REST functions have to go through this first.
*/
DataForm.prototype.collection = function () {
    return _.bind(function (req, res, next) {
        req.resource = this.getResource(req.params.resourceName);
        return next();
    }, this);
};

/**
* Middleware, Terminus - Renders a view with the list of docs, which may be filtered by the f query parameter
*/
DataForm.prototype.collectionGet = function () {
    return _.bind(function (req, res, next) {
        if (!req.resource) {
            return next();
        }

        var url_parts = url.parse(req.url, true);
        try {
            var aggregationParam = url_parts.query.a ? JSON.parse(url_parts.query.a) : null;
            var findParam = url_parts.query.f ? JSON.parse(url_parts.query.f) : {};
            var limitParam = url_parts.query.l ? JSON.parse(url_parts.query.l) : {};
            var skipParam = url_parts.query.s ? JSON.parse(url_parts.query.s) : {};
            var orderParam = url_parts.query.o ? JSON.parse(url_parts.query.o) : req.resource.options.listOrder;

            var self = this;

            this._filteredFind(req.resource, req, aggregationParam, findParam, orderParam, limitParam, skipParam, function (err, docs) {
                if (err) {
                    return self._renderError(err, null, req, res, next);
                } else {
                    res.send(docs);
                }
            });
        } catch (e) {
            res.send(e);
        }
    }, this);
};

DataForm.prototype._doFindFunc = function (req, resource, cb) {
    if (resource.options.findFunc) {
        resource.options.findFunc(req, cb)
    } else {
        cb(null);
    }
};

DataForm.prototype._filteredFind = function (resource, req, aggregationParam, findParam, sortOrder, limit, skip, callback) {

    var that = this
        , hidden_fields = this._generateHiddenFields(resource, false);

    var doAggregation = function (cb) {
        if (aggregationParam) {
            resource.model.aggregate(aggregationParam, function (err, aggregationResults) {
                if (err) {
                    throw err
                } else {
                    cb(_.map(aggregationResults, function (obj) {
                        return obj._id
                    }));
                }
            })
        } else {
            cb([]);
        }
    };

    doAggregation(function (idArray) {
        if (aggregationParam && idArray.length === 0) {
            callback(null, [])
        } else {
            that._doFindFunc(req, resource, function (err, queryObj) {
                if (err) {
                    callback(err)
                } else {
                    var query = resource.model.find(queryObj);
                    if (idArray.length > 0) {
                        query = query.where('_id').in(idArray)
                    }
                    query = query.find(findParam).select(hidden_fields);
                    if (limit) query = query.limit(limit);
                    if (skip) query = query.skip(skip);
                    if (sortOrder) query = query.sort(sortOrder);
                    query.exec(callback);
                }
            })
        }
    })
};

/**
* Middleware, Terminus - post an entity to a collection
*/
DataForm.prototype.collectionPost = function () {
    return _.bind(function (req, res, next) {
        if (!req.resource) {
            next();
            return;
        }
        if (!req.body) throw new Error('Nothing submitted.');

        var cleansedBody = this._cleanseRequest(req);
        req.doc = new req.resource.model(cleansedBody);

        this._saveAndRespond(req, res);
    }, this);
};

/**
 * Generate an object of fields to not expose
 **/
DataForm.prototype._generateHiddenFields = function (resource, state) {
    var hidden_fields = {};

    if (resource.options['hide'] !== undefined) {
        resource.options.hide.forEach(function (dt) {
            hidden_fields[dt] = state;
        });
    }
    return hidden_fields;
};

/** Sec issue
 * Cleanse incoming data to avoid overwrite and POST request forgery
 * (name may seem weird but it was in French, so it is some small improvement!)
 */
DataForm.prototype._cleanseRequest = function (req) {
    var req_data = req.body,
        resource = req.resource;

    delete req_data.__v;   // Don't mess with Mongoose internal field (https://github.com/LearnBoost/mongoose/issues/1933)
    if (typeof resource.options['hide'] == 'undefined')
        return req_data;

    var hidden_fields = resource.options.hide;

    _.each(req_data, function (num, key) {
        _.each(hidden_fields, function (fi) {
            if (fi == key)
                delete req_data[key];
        });
    });

    return req_data;
};


/*
* Middleware - Entity request goes there first. It retrieves the resource and puts it on the request as 'doc'
*/
DataForm.prototype.entity = function () {
    return _.bind(function (req, res, next) {
        if (!(req.resource = this.getResource(req.params.resourceName))) {
            next();
            return;
        }

        var hidden_fields = this._generateHiddenFields(req.resource, false);
        hidden_fields.__v = 0;

        var query = req.resource.model.findOne({ _id: req.params.id }).select(hidden_fields);

        query.exec(function (err, doc) {
            if (err) {
                return res.send({
                    success: false,
                    err: util.inspect(err)
                });
            }
            else if (doc == null) {
                return res.send({
                    success: false,
                    err: 'Record not found'
                });
            }
            req.doc = doc;
            return next();
        });
    }, this);
};

/**
* Middleware, Terminus - Gets a single entity
*/
DataForm.prototype.entityGet = function () {
    return _.bind(function (req, res, next) {
        if (!req.resource) {
            return next();
        }
        return res.send(req.doc);
    }, this);
};

DataForm.prototype._replaceHiddenFields = function (record, data) {
    var self = this;
    //self._replacingHiddenFields = true;
    _.each(data, function (value, name) {
        if (_.isObject(value)) {
            self._replaceHiddenFields(record[name], value)
        } else {
            record[name] = value;
        }
    });
    //delete self._replacingHiddenFields;
};

/**
* Middleware, Terminus - 'Puts' a single entity for update
*/
DataForm.prototype.entityPut = function () {
    return _.bind(function (req, res, next) {
        if (!req.resource) {
            next();
            return;
        }

        if (!req.body) throw new Error('Nothing submitted.');
        var cleansedBody = this._cleanseRequest(req)
            , that = this;

        // Merge
        _.each(cleansedBody, function (value, name) {
            req.doc[name] = (value === "") ? undefined : value;
        });

        if (req.resource.options.hide !== undefined) {
            var hidden_fields = this._generateHiddenFields(req.resource, true);
            hidden_fields._id = false;
            req.resource.model.findById(req.doc._id, hidden_fields, {lean: true}, function (err, data) {
                that._replaceHiddenFields(req.doc, data);
                that._saveAndRespond(req, res, hidden_fields);
            })
        } else {
            that._saveAndRespond(req, res);
        }
    }, this);
};

/**
* Middleware, Terminus - Deletes a single entity
*/
DataForm.prototype.entityDelete = function () {
    return _.bind(function (req, res, next) {
        if (!req.resource) {
            next();
            return;
        }

        req.doc.remove(function (err) {
            if (err) {
                return res.send({success: false});
            }
            return res.send({success: true});
        });
    }, this);
};

DataForm.prototype.entityList = function () {
    return _.bind(function (req, res, next) {
        if (!req.resource) {
            return next();
        }
        return res.send({list: this._getListFields(req.resource, req.doc)});
    }, this);
};
