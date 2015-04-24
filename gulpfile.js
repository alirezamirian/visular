/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/22/2015
 */

var through2 = require('through2');
var Buffer = require('buffer').Buffer;
var lazypipe = require('lazypipe');

var argv = require('minimist')(process.argv.slice(2));
var pkg = require('./package.json');


var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');
var ngAnnotate = require('gulp-ng-annotate');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var filter = require('gulp-filter');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var rename = require('gulp-rename');
var autoprefixer = require('gulp-autoprefixer');
var minifyCss = require('gulp-minify-css');


var getModuleInfo = require('./build-utils/ngModuleData');



var VERSION = argv.version || pkg.version;

var config = {
    banner:
    '/*!\n' +
    ' * Visular\n' +
    ' * https://github.com/alirezamirian/visular\n' +
    ' * @license MIT\n' +
    ' * v' + VERSION + '\n' +
    ' */\n',
    jsFiles: [
        'src/modules/**/*.js',
        '!src/modules/**/*.spec.js'
    ],
    scssFiles: [
        'src/modules/**/*.scss',
    ],
    outputDir: 'dist/visular-' + VERSION
};

var IS_RELEASE_BUILD = true;

function buildScss(do_minification) {
    // var defaultThemeContents = fs.readFileSync('themes/_default-theme.scss');

    gutil.log("Building css files...");
    return gulp.src(config.scssFiles)
        .pipe(filterNonCodeFiles())
        // .pipe(insert.append(defaultThemeContents))
        .pipe(sass())
        .pipe(autoprefix())
        .pipe(insert.prepend(config.banner))
        .pipe(concat('visular.css'))
        .pipe(gulp.dest(config.outputDir))
        .pipe(gulpif(do_minification, lazypipe()
                .pipe(minifyCss)
                .pipe(rename, {extname: '.min.css'})
                .pipe(gulp.dest, config.outputDir)
            ()
        ));
}
function buildJs(do_minification){
    gutil.log("building js files...");

    var jsBuildStream = gulp.src(config.jsFiles)
        .pipe(filterNonCodeFiles())
        .pipe(buildVisularDefinition())
        .pipe(insert.prepend(config.banner))
        .pipe(plumber())
        .pipe(ngAnnotate());

    jsBuildStream
        .pipe(concat('visular.js'))
        .pipe(gulp.dest(config.outputDir))
        .pipe(gulpif(do_minification, lazypipe()
                .pipe(uglify, { preserveComments: 'some' })
                .pipe(rename, { extname: '.min.js' })
                .pipe(gulp.dest, config.outputDir)
            ()
        ));
}
function buildVisularDefinition() {
    var buffer = [];
    var modulesSeen = [];
    return through2.obj(function(file, enc, next) {
        var moduleName;
        if (moduleName = getModuleInfo(file.contents).module) {
            modulesSeen.push(moduleName);
        }
        buffer.push(file);
        next();
    }, function(done) {
        var EXPLICIT_DEPS = [];
        var angularFileContents = "angular.module('visular', " + JSON.stringify(EXPLICIT_DEPS.concat(modulesSeen)) + ');';
        var angularFile = new gutil.File({
            base: process.cwd(),
            path: process.cwd() + '/visular.js',
            contents: new Buffer(angularFileContents)
        });
        this.push(angularFile);
        var self = this;
        buffer.forEach(function(file) {
            self.push(file);
        });
        buffer = [];
        done();
    });
};
function filterNonCodeFiles() {
    return filter(function(file) {
        return !/demo|module\.json|\.spec.js|README/.test(file.path);
    });
}
gulp.task('build-scss', function() {
    return buildScss(IS_RELEASE_BUILD);
});
gulp.task('build-js', function() {
    return buildJs(IS_RELEASE_BUILD);
});
gulp.task('build', ['build-scss', 'build-js']);
gulp.task('default', ['build']);

gulp.task('watch', ['build'], function() {
    gulp.watch('src/**', ['build']);
});

function autoprefix() {
    return autoprefixer({browsers: [
        'last 2 versions', 'last 4 Android versions'
    ]});
}