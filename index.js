var through = require('through2');
var gutil = require('gulp-util');
var XLSX = require("xlsx");
var path = require("path");
var PluginError = gutil.PluginError;
var File = gutil.File;
// 常量
var PLUGIN_NAME = 'gulp-i18n-xlsx-resolve';
var DEF_TYPE = 'json';

function setMap(obj,map,v){
	if(map.length == 1){
		obj[map[0]] = v;
	}else{
		var a0 = map.shift();
		if(obj[a0] == undefined){
			obj[a0] = {}
		}
		setMap(obj[a0],map,v)
	}
}

function gulpI18n(opt) {
	var outjson = {};
	var defType = "json";
	
	opt = opt || {};
	//处理映射;
	if(typeof opt.langMap){
		var langMap = {}
		for(var k in opt.langMap){
			var langName = k.toLocaleLowerCase();
			if(langMap.langName){console.warn(PLUGIN_NAME,"langMap key Repeat")};
			langMap[langName] = opt.langMap[k]
		}
		opt.langMap = langMap;
	}
	//处理输出类型
	if(!opt.type) opt.type = DEF_TYPE;

	function getRefName(obj){
		var refname;
		for(var k in obj){
			if(k.toLocaleLowerCase() == "refname"){
				refname = obj[k];
				break;
			}
		}
		return refname;
	}

	function tolanName(str){
		var langname = str.toLocaleLowerCase();
		if(langname.toLocaleLowerCase() == "refname") return;
		if(typeof opt.langMap == 'object'){
			langname = opt.langMap[langname] ? opt.langMap[langname] : langname;
		}
		return langname;
	}

	function xlsx2json(data){
		var workbook = XLSX.read(data);
		var sheet_name_list = workbook.SheetNames;
		var worksheet = workbook.Sheets[workbook.SheetNames[0]];
		var array = XLSX.utils.sheet_to_json(worksheet);
		array.forEach(function(v){
			var refname = getRefName(v)
			if(refname){
				map = refname.split('.');
				for(k in v){
					var langname = tolanName(k)
					if(langname){
						setMap(outjson,[langname].concat(map),v[k]);
					}
				}
			}
		})
	}

	function xlsx2ini(data){
		var workbook = XLSX.read(data);
		var sheet_name_list = workbook.SheetNames;
		var worksheet = workbook.Sheets[workbook.SheetNames[0]];
		var array = XLSX.utils.sheet_to_json(worksheet);
		array.forEach(function(v){
			var key = getRefName(v);
			if(key){
				for(k in v){
					var langname = tolanName(k)
					if(langname){
						outjson[langname] =  !outjson[langname] ? "["+langname+"]\n" : outjson[langname]+[key,v[k]].join("=")+'\n';
					}
				}
			}
		})
	}

	// 创建一个让每个文件通过的 stream 通道
	return through.obj(function(file, enc, cb) {

		if (file.isNull()) {
			// 返回空文件
			return cb();
		}
		if (file.isBuffer()) {
			switch (opt.type.toLocaleLowerCase()){
				case 'json':
					xlsx2json(file.contents)
					break;
				case 'ini':
					xlsx2ini(file.contents)
					break;
				default:
					throw new PluginError(PLUGIN_NAME,'optiion type is not supported')	
			}
			//console.log(file.relative, file.contents, file.sourceMap);
		}
		if (file.isStream()) {
			throw new PluginError(PLUGIN_NAME,'Streams not supported')
		}
		cb();

	},function(cb){
		//var promiseArr = [];
		//console.log(outjson)
		for(var lan in outjson){
			var nfile;
			switch (opt.type.toLocaleLowerCase()){
				case 'json':
					nfile = new File({path: lan + '.json',});
					nfile.contents = new Buffer(JSON.stringify(outjson[lan]),'utf-8');
					break;
				case 'ini':
					nfile = new File({path: lan + '.ini',});
					nfile.contents = new Buffer(outjson[lan],'utf-8');
					break;
			}
			//console.log(nfile);
			this.push(nfile);
		}
		cb();
	});
};

module.exports = gulpI18n;