var through = require('through2');
var gutil = require('gulp-util');
var XLSX = require("xlsx");
var path = require("path");
var PluginError = gutil.PluginError;
var File = gutil.File;
// 常量
var PLUGIN_NAME = 'gulp-i18n-xlsx-resolve';
var DEF_TYPE = 'json';
var KEY_COLUMN = 'key';



var defopt = {
	type : DEF_TYPE,
	keyColumnName: KEY_COLUMN,
	langMap: {},
	passColumns: []
}

function gulpI18n(opt) {
	var outjson = {};
	
	opt = opt || {};
	//处理映射;
	if(typeof opt.langMap){
		var langMap = {}
		for(var k in opt.langMap){
			var langName = k.toLocaleLowerCase();
			if(typeof langMap[langName] != 'undefined'){gutil.log(PLUGIN_NAME,"langMap key Repeat")};
			langMap[langName] = opt.langMap[k]
		}
		opt.langMap = langMap;
	}

	//输出类型
	if(!opt.type) opt.type =  opt.type ? opt.type.toLocaleLowerCase() : DEF_TYPE;

	if(!opt.keyColumnName) opt.keyColumnName = KEY_COLUMN
	
	if(opt.passColumns){
		if(typeof opt.passColumns == 'string'){
			opt.passColumns = [opt.passColumns];
		}
	}

	function isPassColumn(ColumnName){
		if(isRefName(ColumnName)) return true;
		if(opt.passColumns){
			var passCol = opt.passColumns;
			for(var i = 0; i<passCol.length; i++){
				if(passCol[i].toLocaleLowerCase() == ColumnName.toLocaleLowerCase()){
					return true;
				}
			}
		}
	}

	function isRefName(ColumnName){
		return ColumnName.toLocaleLowerCase() == opt.keyColumnName.toLocaleLowerCase();
	}

	function getRefName(obj){
		var refname;
		for(var k in obj){
			if(isRefName(k)){
				refname = obj[k];
				break;
			}
		}
		return refname;
	}

	function tolanName(str){
		//console.log(typeof str);
		var langname;
		if(isPassColumn(str)) return;
		if(str === "undefined") return;
		langname = str.toLocaleLowerCase();
		if(typeof opt.langMap == 'object'){
			langname = opt.langMap[langname] ? opt.langMap[langname] : langname;
		}
		return langname;
	}

	function setMap(obj,map,v,path){
		//if(!obj) return;
		if(map.length == 1){
			if(obj.hasOwnProperty(map[0])){
				gutil.log('key repeat!', gutil.colors.green(opt.keyColumnName),">>",gutil.colors.magenta(map[0]));
			}
			obj[map[0]] = v;
		}else{
			var a0 = map.shift();
			if(obj[a0] == undefined){
				obj[a0] = {}
			}
			if(typeof obj[a0] == "object"){
				setMap(obj[a0],map,v,[].concat(path || [],[a0]))	
			}else{
				var key = [].concat([a0],map).join('.');
				obj[key] = v;
				gutil.log('key path conflict!', gutil.colors.green(opt.keyColumnName),">>",gutil.colors.magenta([].concat(path || [],[a0],map).slice(1).join('.')));
				//throw new PluginError(PLUGIN_NAME,'key path conflict : ' + [].concat(path || [],[a0],map).join('.'));
			}
		}
	}

	function xlsx2json(data,noNested){
		var workbook = XLSX.read(data);
		var sheet_name_list = workbook.SheetNames;
		for(var i = 0; i<sheet_name_list.length; i++){
			var sheetName = sheet_name_list[i];
			var worksheet = workbook.Sheets[sheetName];
			var array = XLSX.utils.sheet_to_json(worksheet);
			//console.log(typeof worksheet);
			//console.log(array);
			array.forEach(function(v){
				var refname = getRefName(v)
				if(refname){
					map = opt.nosplit ? [refname] : refname.split('.');
					for(k in v){
						var langname = tolanName(k)
						if(langname){
							if(noNested){
								if(!outjson[langname]){
									outjson[langname] = {};
								}
								outjson[langname][refname] = v[k];
							}else{
								setMap(outjson,[langname].concat(map),v[k]);
							}
						}
					}
				}
			})
		}
	}

	function jsoi2ini(name,json){
		var refstr = "[" + name + "]";
		for(var k in json){
			refstr += "\n" + [k,json[k]].join("=");
		}
		return refstr;
	}

	function json2iniCenter(json){
		var inistr = '';
		for(var name in json){
			inistr += jsoi2ini(name,json[name])+'\n';
		}
		return inistr;
	}

	// 创建一个让每个文件通过的 stream 通道
	return through.obj(function(file, enc, cb) {

		//console.log(file);
		if (file.isNull()) {
			// 返回空文件
			return cb();
		}
		if (file.isBuffer()) {
			switch (opt.type){
				case 'json':
					xlsx2json(file.contents)
					break;
				case 'ini':
					xlsx2json(file.contents,true)
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
		if(opt.concat){
			var nfile;
			switch (opt.type){
				case 'json':
				nfile = new File({path:  opt.concat + '.json',});
				nfile.contents = new Buffer(JSON.stringify(outjson),'utf-8');
				break;
				case 'ini':
				nfile = new File({path: opt.concat + '.ini',});
				nfile.contents = new Buffer(json2iniCenter(outjson),'utf-8');
				break;
			}
			this.push(nfile);
		}else{
			for(var lan in outjson){
				var nfile;
				switch (opt.type){
					case 'json':
					nfile = new File({path: lan + '.json',});
					nfile.contents = new Buffer(JSON.stringify(outjson[lan]),'utf-8');
					break;
					case 'ini':
					nfile = new File({path: lan + '.ini',});
					nfile.contents = new Buffer(jsoi2ini(lan,outjson[lan]),'utf-8');
					break;
				}
				//console.log(nfile);
				this.push(nfile);
			}
		}
		cb();
	});
};

module.exports = gulpI18n;