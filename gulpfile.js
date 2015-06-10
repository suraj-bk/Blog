var gulp  = require('gulp')
    ,gutil = require('gulp-util')
    ,stylus = require('gulp-stylus')
	,autoprefixer = require('gulp-autoprefixer')
	,minifyCSS = require('gulp-minify-css')
	,jade = require('gulp-jade')
	,uglify = require('gulp-uglify')
	,rename = require('gulp-rename')
	,concat = require('gulp-concat')
	,size = require('gulp-size');

var nib = require('nib');

//Defining the tasks..

gulp.task('default',function(){
	return gutil.log('Gulp is running');
});

gulp.task('build-css',function(){

	gulp.src('./src/stylus/main.styl')
    .pipe(stylus({ use: nib(), compress: true }))
    .pipe(autoprefixer())
    .pipe(minifyCSS())
    .pipe(rename('out.css'))
	.pipe(gulp.dest('./public/css'))
	.pipe(size());
});

gulp.task('watch',function(){
	gulp.watch('src/styles/**/*.styl',['build-css']);
});