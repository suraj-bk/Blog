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

gulp.task('default',['watch']);



gulp.task('watch',[],function(){
	return gulp.watch(['./src/stylus/**/*.styl'],['build-css']);
});

gulp.task('build-css',function(){

	gulp.src('./src/stylus/**.styl')
	.pipe(concat('main.styl'))
    .pipe(stylus({ use: nib(), compress: true }))
    .pipe(autoprefixer())
    .pipe(minifyCSS())
    .pipe(rename('build.css'))
	.pipe(gulp.dest('./public/css'))
	.pipe(size());
});