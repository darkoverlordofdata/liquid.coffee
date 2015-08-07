/**
 * Expose npm commands with gulp for use by IDE's
 *
 */
var gulp = require('gulp');
var shell = require('gulp-shell');

gulp.task('build', shell.task(['npm run build']));
gulp.task('test', shell.task(['npm run test']));
