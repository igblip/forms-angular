module.exports = function(grunt) {    var exec = require('child_process').exec;    /*    WHAT NEEDS TO HAPPEN FOR A RELEASE    MANUAL: Merge everything into master and switch to master branch    BASH: npm test - Test proposed release    *MANUAL: Lint proposed release    BASH: grunt - loads of stuff    MANUAL: Create branch for the next release    */    // Project configuration.    grunt.initConfig({        builddir: 'js-build',        pkg: grunt.file.readJSON('package.json'),        meta: {            banner: '/**\n' + ' * <%= pkg.description %>\n' +                ' * @version v<%= pkg.version %> - ' +                '<%= grunt.template.today("yyyy-mm-dd") %>\n' +                ' * @link <%= pkg.homepage %>\n' +                ' * @license MIT License, http://www.opensource.org/licenses/MIT\n' + ' */'        },        concat: {            options: {                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'            },            build: {                src: ['app/js/<%= pkg.name %>.js', 'app/js/controllers/*.js', 'app/js/directives/*.js', 'app/js/filters/*.js', 'app/js/services/*.js', 'app/js/lib/*.js'],                dest: '<%= builddir %>/<%= pkg.name %>.js'            }        },        uglify: {            options: {                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'            },            build: {                src: '<%= builddir %>/<%= pkg.name %>.js',                dest: '<%= builddir %>/<%= pkg.name %>.min.js'            }        },        lint: {            files: ['grunt.js', 'common/**/*.js', 'modules/**/*.js']        },        copy: {            // Copy the required files into the npm distribution folder//                    {expand: true, src: ['path/*'], dest: 'dest/', filter: 'isFile'}, // includes files in path//                    {expand: true, src: ['path/**'], dest: 'dest/'}, // includes files in path and its subdirs//                    {expand: true, cwd: 'path/', src: ['**'], dest: 'dest/'}, // makes all src relative to cwd//                    {expand: true, flatten: true, src: ['path/**'], dest: 'dest/', filter: 'isFile'} // flattens results to a single level            minimal: {                files: [                    {src: 'bower.json', dest: 'minimal/bower.json'},                    {src: 'app/css/forms-angular.css', dest:'minimal/app/css/forms-angular.css'},                    {src: 'js-build/forms-angular.min.js', dest:'minimal/app/lib/forms-angular.min.js'},                    {src: 'app/partials/404.html', dest: 'minimal/app/partials/404.html'},                    {src: 'app/partials/base-edit.html', dest: 'minimal/app/partials/base-edit.html'},                    {src: 'app/partials/base-list.html', dest: 'minimal/app/partials/base-list.html'},                    {src: 'package.json', dest:'minimal/package.json'},                    {src: 'server/lib/data_form.js', dest: 'minimal/server/lib/data_form.js'}                ]            },            bower: {                files: [                    {src: 'bower.json', dest: 'js-build/bower.json'},                    {src: 'app/css/forms-angular.css', dest:'js-build/forms-angular.css'}                ]            },            npm: {                files: [                    {src: 'package.json', dest:'npm-build/package.json'},                    {src: 'LICENSE.txt', dest:'npm-build/LICENSE.txt'},                    {src: 'server/lib/data_form.js',dest:'npm-build/lib/data_form.js'}                ]            }        },        bump: {            options: {                files: ['package.json','bower.json','./minimal/package.json'],                updateConfigs: ['pkg'],                commit: true,                commitMessage: 'Release v%VERSION%',                commitFiles: ['-a'], // '-a' for all files                createTag: true,                tagName: 'v%VERSION%',                tagMessage: 'Version %VERSION%',                push: true,                pushTo: 'origin',                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'            }        }    });    // Load the plugin that provides the "uglify" task.    grunt.loadNpmTasks('grunt-contrib-uglify');    grunt.loadNpmTasks('grunt-contrib-concat');    grunt.loadNpmTasks('grunt-bump');    grunt.loadNpmTasks('grunt-contrib-copy');    grunt.registerTask('modify_json', 'Modify the package.json and bower.json files.', function() {        var filename = 'minimal/bower.json';        var content = grunt.file.readJSON(filename);        content.name = "fng-minimal";        grunt.file.write(filename, JSON.stringify(content,null,2));        var filename = 'minimal/package.json';        var content = grunt.file.readJSON(filename);        content.name = "fng-minimal";        content.description = "A minimal deployment of forms-angular";        var start = content.scripts.start;        content.scripts = {start: start};        delete content.devDependencies;        grunt.file.write(filename, JSON.stringify(content,null,2));        grunt.log.ok('Modified 2 files');    });    grunt.registerTask('commit-tag-push', 'Do a git commit, tag and push', function(folder) {        var startDir = process.cwd();        var opts = grunt.config.get(['bump']).options;        process.chdir(folder)        var globalVersion = grunt.config.get().pkg.version;        var commitMessage = opts.commitMessage.replace('%VERSION%', globalVersion);        var done = this.async();        var queue = [];        var next = function () {            if (!queue.length) {                process.chdir(startDir)                return done();            }            queue.shift()();        };        var runIt = function (behavior) {            queue.push(behavior);        };        runIt(function () {            console.log('git commit ' + opts.commitFiles.join(' ') + ' -m "' + commitMessage + '"')            exec('git commit ' + opts.commitFiles.join(' ') + ' -m "' + commitMessage + '"', function (err, stdout, stderr) {                if (err) {                    grunt.fatal('Can not create the commit:\n  ' + stderr);                }                grunt.log.ok('Committed as "' + commitMessage + '"');                next();            });        });        var tagName = opts.tagName.replace('%VERSION%', globalVersion);        var tagMessage = opts.tagMessage.replace('%VERSION%', globalVersion);        runIt(function () {            exec('git tag -a ' + tagName + ' -m "' + tagMessage + '"', function (err, stdout, stderr) {                if (err) {                    grunt.fatal('Can not create the tag:\n  ' + stderr);                }                grunt.log.ok('Tagged as "' + tagName + '"');                next();            });        });        runIt(function () {            exec('git push ' + opts.pushTo + ' && git push ' + opts.pushTo + ' --tags', function (err, stdout, stderr) {                if (err) {                    grunt.fatal('Can not push to ' + opts.pushTo + ':\n  ' + stderr);                }                grunt.log.ok('Pushed to ' + opts.pushTo);                next();            });        });        next();    });    grunt.registerTask('npm-publish', 'Publish a package', function (folder) {        var done = this.async();        exec('npm publish ' + folder, function (err, stdout, stderr) {            grunt.log.ok(stdout);            if (err) {                grunt.fatal('Can publish to npm:\n  ' + stderr);            }            grunt.log.ok('Package published');            done();        });    });    var bumpLevel = grunt.option('bumpLevel') || 'patch';    grunt.registerTask('default', ['concat', 'uglify']);    grunt.registerTask('release', ['bump-only:' + bumpLevel, 'concat', 'uglify', 'copy', 'modify_json', 'bump-commit', 'commit-tag-push:js-build', 'npm-publish:npm-build']);};