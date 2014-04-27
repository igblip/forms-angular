// # Globbing// for performance reasons we're only matching one level down:// 'test/spec/{,*/}*.js'// use this if you want to match all subfolders:// 'test/spec/**/*.js'module.exports = function(grunt) {    var exec = require('child_process').exec,        fs = require('fs');    // load all grunt tasks    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);    /*    WHAT NEEDS TO HAPPEN FOR A RELEASE        MANUAL: Merge everything into master and switch to master branch        BASH: npm test - Test proposed release        BASH: grunt - loads of stuff        MANUAL: Create branch for the next release    */    // Project configuration.    grunt.initConfig({        // Project settings        appDir: require('./bower.json').appPath || 'app',        distDir: 'dist',        bowerBuildDir: 'bower-build',        npmBuildDir: 'npm-build',        pkg: grunt.file.readJSON('package.json'),        meta: {            banner: '/**\n' + ' * <%= pkg.description %>\n' +                ' * @version v<%= pkg.version %> - ' +                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +                ' * @link <%= pkg.homepage %>\n' +                ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' + ' */'        },        watch: {            recess: {                files: ['app/styles/*.less', 'app/demo/styles/*.less'],                tasks: ['recess']            }        },        "expand-include" : {            "get-started": {                src: [ "app/partials/get-started/get-started-template.html" ],                dest: "app/partials/get-started.html",                options: {                    directiveSyntax: "xml",                    substituteEntities : true,                    adjustReferences: false                }            }        },        concat: {            options: {                banner: '/*! forms-angular <%= grunt.template.today("yyyy-mm-dd") %> */\n'            },            jsToBowerBuildDir: {                src: [                    'app/js/forms-angular.js',                    'app/js/controllers/*.js',                    'app/js/directives/*.js',                    'app/js/filters/*.js',                    'app/js/services/*.js',                    'app/js/plugins/ng-grid/*.js',                    'app/js/plugins/jsPDF/*.js'                ],                dest: '<%= bowerBuildDir %>/forms-angular.js'            }        },//      If you are here because you just came across "Warning: Running "recess:dist" (recess) task Fatal error: variable @input-border is undefined Use --force to continue.//      Then make sure your bower.json specifies ~1.2 of git://github.com/t0m/select2-bootstrap-css.git#~1.2        recess: {            dist: {                options: {                    compile: true                },                files: [                    {src: 'app/demo/styles/demo.less', dest: 'app/demo/css/demo.css'},                    {src: 'app/styles/forms-angular.less', dest: 'app/css/forms-angular.css'}                ]            }        },        clean: {            dev: {                files: [{                    dot: true,                    src: [                        '.tmp',                        'app/code/*',                        'app/css/*',                        'app/demo/css/*',                        'app/partials/get-started.html',                        '<%= bowerBuildDir %>'                    ]                }]            },            dist: {                files: [{                    dot: true,                    src: [                        '.tmp',                        'dist/*',                        '<%= bowerBuildDir %>',                        '<%= npmBuildDir %>/lib'                    ]                }]            }        },        // Add vendor prefixed styles        autoprefixer: {            options: {                browsers: ['last 1 version']            },            tmpToDistDir: {                files: [{                    expand: true,                    cwd: '.tmp/css/',                    src: '{,*/}*.css',                    dest: 'dest/css/'                }]            }        },        uglify: {            options: {                banner: '/*! forms-angular <%= grunt.template.today("yyyy-mm-dd") %> */\n'            },            build: {                src: '<%= bowerBuildDir %>/forms-angular.js',                dest: '<%= bowerBuildDir %>/forms-angular.min.js'            }        },        jshint: {            options: {                jshintrc: '.jshintrc'            },            all: [                'Gruntfile.js',                'app/js/**/*.js',                'server/**/*.js',                'npm-build/index.js'            ]        },        // Copy the required files into the npm distribution folder//                    {expand: true, src: ['path/*'], dest: 'dest/', filter: 'isFile'}, // includes files in path//                    {expand: true, src: ['path/**'], dest: 'dest/'}, // includes files in path and its subdirs//                    {expand: true, cwd: 'path/', src: ['**'], dest: 'dest/'}, // makes all src relative to cwd//                    {expand: true, flatten: true, src: ['path/**'], dest: 'dest/', filter: 'isFile'} // flattens results to a single level        copy: {            toBowerBuildDir: {                files: [                    {src: 'bower.json', dest: '<%= bowerBuildDir %>/bower.json'},                    {src: 'app/css/forms-angular.css', dest:'<%= bowerBuildDir %>/forms-angular.css'},                    {src: 'app/css/forms-angular.less', dest:'<%= bowerBuildDir %>/forms-angular.less'}                ]            },            toNpmBuildDir: {                files: [                    {src: 'server/lib/data_form.js',dest:'<%= npmBuildDir %>/lib/data_form.js'}                ]            },            modelfilesToAppDir: {                expand: true,                cwd: 'server/models',                src: '*.js',                dest: 'app/code/',                flatten: true            },            toDistDir: {                files: [{                        expand: true,                        dot: true,                        cwd: '<%= appDir %>',                        dest: '<%= distDir %>',                        src: [                            '*.{ico,png,txt}',                            'partials/*.html',                            '.htaccess',                            'img/{,*/}*.{webp}',                            'fonts/*'                        ]                    },{                        expand: true,                        cwd: '.tmp/img',                        dest: '<%= distDir %>/img',                        src: [                            'generated/*'                        ]                    }                ]            }        },        bump: {            options: {                files: ['package.json','bower.json'],                updateConfigs: ['pkg'],                commit: true,                commitMessage: 'Release v%VERSION%',                commitFiles: ['-a'], // '-a' for all files                createTag: true,                tagName: 'v%VERSION%',                tagMessage: 'Version %VERSION%',                push: true,                pushTo: 'origin',                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'            }        },        // Renames files for browser caching purposes        rev: {            dist: {                files: {                    src: [                        '<%= distDir %>/scripts/{,*/}*.js',                        '<%= distDir %>/styles/{,*/}*.css',                        '<%= distDir %>/img/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',                        '<%= distDir %>/styles/fonts/*'                    ]                }            }        },        // Reads HTML for usemin blocks to enable smart builds that automatically        // concat, minify and revision files. Creates configurations in memory so        // additional tasks can operate on them        useminPrepare: {            html: 'app/index.html',            options: {                dest: '<%= distDir %>'            },            staging: '.tmp',            flow: {                steps: {                    js: ['concat', 'uglifyjs'],                    css: ['concat', 'cssmin'] },                post: {}            }        },        // Allow the use of non-minsafe AngularJS files. Automatically makes it        // minsafe compatible so Uglify does not destroy the ng references        ngmin: {            dist: {                files: [{                    expand: true,                    cwd: '.tmp/concat/scripts',                    src: ['app.js', 'lib.js'],                    dest: '.tmp/concat/scripts'                }]            }        },        // Performs rewrites based on rev and the useminPrepare configuration        usemin: {            html: ['<%= distDir %>/{,*/}*.html'],            css: ['<%= distDir %>/styles/{,*/}*.css'],            options: {                assetsDirs: ['<%= distDir %>']            }        },        // The following *-min tasks produce minified files in the dist folder        imagemin: {            dist: {                files: [{                    expand: true,                    cwd: '<%= appDir %>/img',                    src: '{,*/}*.{png,jpg,jpeg,gif}',                    dest: '<%= distDir %>/img'                }],                options: {                    cache: false                }            }        },        svgmin: {            dist: {                files: [{                    expand: true,                    cwd: '<%= appDir %>/img',                    src: '{,*/}*.svg',                    dest: '<%= distDir %>/img'                }]            }        },        htmlmin: {            dist: {                options: {                    // Optional configurations that you can uncomment to use                    // removeCommentsFromCDATA: true,                    // collapseBooleanAttributes: true,                    // removeAttributeQuotes: true,                    // removeRedundantAttributes: true,                    // useShortDoctype: true,                    // removeEmptyAttributes: true,                    // removeOptionalTags: true*/                },                files: [{                    expand: true,                    cwd: '<%= appDir %>',                    src: ['*.html', 'partials/*.html', 'template/*.html'],                    dest: '<%= distDir %>'                }]            }        }        //,        // concurrent: {        //     dev: [        //         'recess'        //     ],        //     dist: [        //         'recess',        //         'copy:styles',        //     ]        // }    });    grunt.registerTask('modify_json', 'Modify the package.json and bower.json files.', function(type) {        var filename = 'npm-build/package.json';        var content = grunt.file.readJSON(filename);        switch (type) {            case 'live' :                content.name = "forms-angular";                break;            case 'test' :                content.name = "forms-angular-test";                break;            default:                grunt.fatal('Invalid call to modify_json : '+ type);        }        content.main = "lib/data_form.js";        delete content.scripts;        delete content.dependencies.express;        delete content.dependencies.bower;        delete content.dependencies.mongoose;        delete content.devDependencies;        grunt.file.write(filename, JSON.stringify(content,null,2));        grunt.log.ok('Modified npm build package.json');        filename = '<%= bowerBuildDir %>/bower.json';        content = grunt.file.readJSON(filename);        delete content.dependencies['components-font-awesome'];        grunt.file.write(filename, JSON.stringify(content,null,2));        grunt.log.ok('Modified npm build bower.json');    });    grunt.registerTask('commit-tag-push', 'Do a git commit, tag and push', function(folder) {        var startDir = process.cwd();        var opts = grunt.config.get(['bump']).options;        process.chdir(folder);        var globalVersion = grunt.config.get().pkg.version;        var commitMessage = opts.commitMessage.replace('%VERSION%', globalVersion);        var done = this.async();        var queue = [];        var next = function () {            if (!queue.length) {                process.chdir(startDir);                return done();            }            queue.shift()();        };        var runIt = function (behavior) {            queue.push(behavior);        };        runIt(function () {            exec('git commit ' + opts.commitFiles.join(' ') + ' -m "' + commitMessage + '"', function (err, stdout, stderr) {                if (err) {                    grunt.fatal('Can not create the commit:\n  ' + stderr);                }                grunt.log.ok('Committed as "' + commitMessage + '"');                next();            });        });        var tagName = opts.tagName.replace('%VERSION%', globalVersion);        var tagMessage = opts.tagMessage.replace('%VERSION%', globalVersion);        runIt(function () {            exec('git tag -a ' + tagName + ' -m "' + tagMessage + '"', function (err, stdout, stderr) {                if (err) {                    grunt.fatal('Can not create the tag:\n  ' + stderr);                }                grunt.log.ok('Tagged as "' + tagName + '"');                next();            });        });        runIt(function () {            exec('git push ' + opts.pushTo + ' && git push ' + opts.pushTo + ' --tags', function (err, stdout, stderr) {                if (err) {                    grunt.fatal('Can not push to ' + opts.pushTo + ':\n  ' + stderr);                }                grunt.log.ok('Pushed to ' + opts.pushTo);                next();            });        });        next();    });    grunt.registerTask('npm-publish', 'Publish a package', function (folder) {        var done = this.async();        exec('npm publish ' + folder, function (err, stdout, stderr) {            grunt.log.ok(stdout);            if (err) {                grunt.fatal('Can publish to npm:\n  ' + stderr);            }            grunt.log.ok('Package published');            done();        });    });    var bumpLevel = grunt.option('bumpLevel') || 'patch';    /*        build-dev - to build app for development purposes        Need to build dist for testing purposes        Need to build npm-build for publishing and distribution (npm)        build-bower - to build js-build for publishing and distribution (bower)    */    grunt.registerTask( 'clean-all'    ,    [   'clean:dist'    ,   'clean:dev'    ]);    grunt.registerTask( 'build-dev'    ,    [   'clean:dev'    //,   'jshint'    ,   'copy:modelfilesToAppDir'    ,   'recess'    ,   'expand-include:get-started'    ]);    grunt.registerTask( 'build-dist'    ,    [   'clean-all'    ,   'copy:modelfilesToAppDir'    ,   'expand-include:get-started'    ,   'recess'    ,   'useminPrepare'    ,   'autoprefixer:tmpToDistDir'    ,   'concat:jsToBowerBuildDir'    ,   'ngmin'    ,   'copy:toDistDir'    ,   'copy:toBowerBuildDir'    ,   'copy:toNpmBuildDir'    ,   'uglify'    ,   'rev'    ,   'usemin'    ]);    grunt.registerTask( 'default'    ,    [   'build-dev'    ]);    // To do a minor / major release to something of the form    // grunt release --bumpLevel=minor    grunt.registerTask( 'release'    ,    [   'build-dist'    ,   'bump-only:' + bumpLevel    ,   'copy:toNpmBuildDir'    ,   'modify_json:live'    ,   'bump-commit'//    ,   'commit-tag-push:js-build'//    ,   'npm-publish:npm-build'    ]);    grunt.registerTask( 'testprep'    ,    [   'expand-include'    ,   'build-dist'    ,   'copy'    ,   'modify_json:test'    ]);    grunt.registerTask( 'testrelease'    ,    [   'expand-include'    ,   'build-dist'    ,   'bump-only:' + bumpLevel    ,   'copy'    ,   'modify_json:test'    ,   'npm-publish:npm-build'    ]);};