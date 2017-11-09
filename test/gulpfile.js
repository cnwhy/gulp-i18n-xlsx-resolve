var gulp = require('gulp');
var concat = require('gulp-concat');
var i18n = require('../');

//debugger;
gulp.task('i18n',function(){
    var files = gulp.src("./language.xlsx"); 
    var langMap = {
        'chine_new':"zh-cn"
        ,'chine_old':"zh-hk"
        ,'english':"en"
    };

    //生成json 各语言独立语言包
    files.pipe(i18n({
        'type':'json'   // 输出为 'ini' or 'json' 默认 'json'
        ,'keyColumnName':"key"  //引用列的名称 默认为 'key'
        ,'passColumns':['bak']  //不输出的列
        ,'langMap':langMap      //语言映射
        //,'sheets': "sheeT_1"    //默认将处理文件中的所有表        
    }))
    .pipe(gulp.dest('./language'))

    //生成json 生成一个翻译文件
    files.pipe(i18n({
        'type':'json'   // 输出为 'ini' or 'json' 默认 'json'
        ,'keyColumnName':"key"  //引用列的名称 默认为 'key'
        ,'passColumns':['bak']  //不输出的列
        ,'langMap':langMap      //语言映射
        ,'concat': 'langs'      //合并成一个文件
        ,'nosplit': true        //不解析KEY
        ,'sheets': "sheeT_1"    //只处理名为‘sheeT_1’的表 （大小写不敏感）
    }))
    .pipe(gulp.dest('./language'))

    //生成ini
    files.pipe(i18n({
            'type':"ini" //输出为ini
            ,'passColumns':['bak']
            ,'langMap':langMap
            ,'concat':'langs'
            ,'sheets':['sheeT_1','sheet_2'] //可以设置多张表
    }))
    //.pipe(concat("langs.ini"))
    .pipe(gulp.dest('./language'))

})

//gulp.task('default',['i18n']);