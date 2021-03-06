# gulp-i18n-xlsx-resolve
将翻译文档(xls/xlsx)转为json或ini的gulp插件;

## Install
```
npm install gulp-i18n-xlsx-resolve --save-dev
```

## Demo

`language.xlsx` :  

key | English | CHINE_NEW | CHINE_OLD | bak
----|---------|-----------|-----------|----
name     | languages  | 多语言 | 多語言 | 项目名称
menu.new | New        | 创建   |  創建 | 创建图标title 

`gulpfile.js` : 

```js
var gulp = require('gulp');
var concat = require('gulp-concat');
var i18n = require('../');

gulp.task('i18n',function(){
    var files = gulp.src("./language.xlsx"); 
    var langMap = {
        'chine_new':"zh-cn"
        ,'chine_old':"zh-hk"
        ,'english':"en"
    };

    //生成json
    files.pipe(i18n({
        'type':'json'   // 输出为 'ini' or 'json' 默认 'json'
        ,'keyColumnName':"key"  //引用列的名称 默认为 'key'
        ,'langMap': langMap      //语言映射
        ,'passColumns':['bak']  //不输出的列
        //,'sheets': ['sheet1'] //默认处理文件中的所有表，sheets参数 可以指定要处理的表
        //,'concat':'concatfilename' //合并语言包，的包名，不设置则不合并
        //,'nosplit': false //设为true时，不拆开key字段，直接以key字段值做为键名，ini无影响 ， 默认false
    }))
    .pipe(gulp.dest('./language'))

    //生成ini
    files.pipe(i18n({
            'type':"ini" //输出为ini格式文件
            ,'passColumns':['bak']
            ,'langMap':langMap
    }))
    .pipe(concat("langs.ini"))
    .pipe(gulp.dest('./language'))

})
```

Run `gulp i18n`  

### output:  
```js
// ./language/en.json
{"name":"languages","menu":{"new":"New"}}

// ./language/zh-cn.json
{"name":"多语言","menu":{"new":"创建"}}

// ./language/zh-cn.json
{"name":"多語言","menu":{"new":"創建"}}

// ./language/langs.ini
[en]
name=languages
menu.new=New
[zh-cn]
name=多语言
menu.new=创建
[zh-hk]
name=多語言
menu.new=創建

```
