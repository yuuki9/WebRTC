/*********************************************************
 * 엔진 파일을 로드합니다.
 * 파일은 asm.js파일, html.mem파일, js 파일 순으로 로드하며,
 * 로드 시 버전 명(engineVersion)을 적용합니다.
 *********************************************************/
var ENGINE_PATH = "./static/js/engine/"
var engineVersion = "v0.0.0.1";
var LSMD_LAYER=null; //"lsmd_svc_view_seoul"; // 기본 서울
;(function(){

	  var tm = (new Date()).getTime();	// 캐싱 방지
	   
	// 1. XDWorldEM.asm.js 파일 로드
	var file = ENGINE_PATH+"XDWorldEM.asm.js?tm="+engineVersion;
	var xhr = new XMLHttpRequest();
	xhr.open('GET', file, true);
	xhr.onload = function() {

		var script = document.createElement('script');
		script.innerHTML = xhr.responseText;
		document.body.appendChild(script);

		// 2. XDWorldEM.html.mem 파일 로드
		setTimeout(function() {
			(function() {
				  
				var memoryInitializer = ENGINE_PATH+"XDWorldEM.html.mem?tm="+engineVersion;
				var xhr = Module['memoryInitializerRequest'] = new XMLHttpRequest();
				xhr.open('GET', memoryInitializer, true);
				xhr.responseType = 'arraybuffer';

				xhr.onload =  function(){

					// 3. XDWorldEM.js 파일 로드
					var url = ENGINE_PATH+"XDWorldEM.js?tm="+engineVersion;
					var xhr = new XMLHttpRequest();
					xhr.open('GET',url , true);
					xhr.onload = function(){
						var script = document.createElement('script');
						script.innerHTML = xhr.responseText;
						document.body.appendChild(script);
					};
					xhr.send(null);
				}
				xhr.send(null);
			})();
		}, 1);
	};
	xhr.send(null);

})();


/*********************************************************
 *	엔진파일 로드 후 Module 객체가 생성되며,
 *  Module 객체를 통해 API 클래스에 접근 할 수 있습니다. 
 *	 - Module.postRun : 엔진파일 로드 후 실행할 함수를 연결합니다.
 *	 - Module.canvas : 지도를 표시할 canvas 엘리먼트를 연결합니다.
 *********************************************************/
 
/**
* 	화면 크기 구하기 W
**/
function returnWidths(){
	return $(window).width();	
}

/**
* 	화면 크기 구하기 H
**/
function returnHeights(){
	return $(window).height();	
}

var Module = {
	TOTAL_MEMORY: 256*1024*1024,
	postRun: [init],
	canvas: (function() {
		var canvas = document.getElementById('canvas');
		// Canvas 스타일 설정
		canvas.style.position = "fixed";
		canvas.style.top = "0px";
		canvas.style.left = "0px";

		canvas.addEventListener("contextmenu", function(e){
			e.preventDefault();
		});
		
		// 화면 저장을 위해 버퍼 설정이 필요합니다.
		var context = canvas.getContext("experimental-webgl", {
			preserveDrawingBuffer : true

		});
		
		return canvas;
	})()
};

//브이월드 정보
var Vworld = { 
	Api_key: '42F6D36E-1A78-34B7-959F-37611794397B',
	Url: 'http://xdworld.vworld.kr:8080',
	Port : 8080,
	Wms_Url : 'http://api.vworld.kr',
	Wms_key : 'A632FC0F-1DE6-3FB1-AD2B-64B09AA41FB6',
	Wms_workspace : '/req/wms?',
	Wfs_workspace : '/req/wfs?',
	Wms_domain : 'localhost',
	Wms_port : 80
};

//var mapServer = "http://localhost:8081"; 
var mapServer = "http://localhost:8080"

/* 엔진 로드 후 실행할 초기화 함수(Module.postRun) */
function init() {

		Module.SetAPIKey(Vworld.Api_key);
		Module.XDESetSatUrlLayerName(Vworld.Url, "tile"); // tile 설정
		Module.XDESetDemUrlLayerName(Vworld.Url, "dem"); // dem 설정
		
		// 엔진 초기화 API 호출(필수)
		Module.Start(returnWidths(), returnHeights());
		
		// 이벤트 설정
		initEvent(Module.canvas)
		
		// 오브젝트 선택 이벤트 (6) 
		Module.XDSetMouseState(Module.MML_SELECT_POINT); 
		
		// 건물 레이어 추가
		Module.XDEMapCreateLayer("bldg_ver2",mapServer,0,true,true,false,9,0,12); // 패스트파이브 모델링 건물 레이어
	
		// 카메라 설정
		//Module.getViewCamera().moveLonLatAlt(126.97208483187177, 37.56065944234132, 190, true);
		//Module.getViewCamera().moveLonLatAlt(127.037169, 37.662069, 190, true);
		Module.getViewCamera().moveLonLatAlt(126.97194277296818, 37.56343845236496, 85, true);
		Module.getViewCamera().setTilt(90);
}


function initEvent(_canvas) {
	/* 브라우저 이벤트 등록 */
	window.onresize = function(e) {
		Module.Resize(returnWidths(), returnHeights());
		Module.XDRenderData();
	};

	
	//레이어 클릭 
	_canvas.addEventListener("Fire_EventSelectedObject", function(e) {
		console.log(e)
		var vPosition = Module.getMap().ScreenToMapPointEX(new Module.JSVector2D(e.idx , e.idy));
		console.log(vPosition)

	});	
	
	
}
/*********************************************************/
var GLOBAL = {	
	layer : null,	// 고스트 심볼 오브젝트 저장 레이어
	object : null	// 고스트 심볼 오브젝트
};


/* 고스트 심볼 XDO import */
function importXDO(_fileNm) {

	Module.getViewCamera().setLocation(new Module.JSVector3D(128.64259157603368, 35.8885570147165, 1500.0));

	// 고스트 심볼 저장 레이어 생성
	var layerList = new Module.JSLayerList(true);
	GLOBAL.layer = layerList.createLayer("GHOSTSYMBOL_XDO", Module.ELT_GHOST_3DSYMBOL);
	
	// 원점 (0, 0, 0), 평면 기반의 xdo 포맷 데이터 로드
	Module.getGhostSymbolMap().insert({
		
		id : "building",
		//url : ENGINE_PATH+"input.xdo",
		url : ENGINE_PATH+_fileNm,
		format : "xdo",         // url 정보에 확장자가 없는 경우 format을 xdo로 명시해 주시면 xdo 파일로 인식됩니다
		version : "3.0.0.2",	// XDO 버전 설정(3.0.0.2 혹은 3.0.0.1)

		callback : function(e) {

			// 모델 크기 반환
			var objectSize = Module.getGhostSymbolMap().getGhostSymbolSize(e.id);

			// 고스트심볼 오브젝트 생성
			GLOBAL.object = createGhostSymbol(
				"import_object", 
				e.id, 
				objectSize, 
				[128.64259157603368, 35.8885570147165, 28.27228598576039] //원본
			);

			GLOBAL.layer.addObject(GLOBAL.object, 0);
		}
	});
}

/* 고스트 심볼 XDO export */
function exportXDO() {

	if (GLOBAL.object == null) {
		return;
	}

	// real3d 타일 레이어 포맷의 XDO 파일 export
	var bytes = GLOBAL.object.exportFileFormat({
		format : "xdo",
		version : "3.0.0.2",
		worldPosition : true
	});

	if (bytes == null) {
		return;
	}

	// 반환 된 바이트를 파일로 저장
	var len = bytes.length;
	var buf = new ArrayBuffer(len);
	var view = new Uint8Array(buf);
	
	var i;
	for (i = 0; i < len; i++) {
		view[i] = bytes[i];
	}
	console.log(view)
	var blob = new Blob([new Uint8Array(view).buffer]);
	console.log(blob)
	
	var formData = new FormData();
	formData.append("blob",blob); 
	formData.append("fileNm","mina1");
	$.ajax({
		method : "POST",
		url : 'http://localhost:8081/api/prj/test',
		processData: false, 
		contentType: false, 
		data : formData,
		beforeSend: function() {
		}, success : function (data) {
			console.log(data);
		}
		
		})
		
	 $.ajax({
			method : "GET",
			url : 'http://localhost:8081/api/prj/read?buildId='+17,
			processData: false, 
	  		contentType: false, 
			beforeSend: function() {
			}, success : function (data) {
				console.log(data);
	        }
	        
	        })

	/*var blob = new Blob([view], {
		type: "application/octet-stream"
	});

	if (window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveOrOpenBlob(blob, fileName)
	} else {
		var a = document.createElement("a");
		a.style = "display:none";
		a.href = URL.createObjectURL(blob);
		a.download = "building_export.xdo";	// 저장 파일 명칭
		document.body.appendChild(a);
		a.click();
		setTimeout(function() {
			document.body.removeChild(a)
		}, 100)
	}*/
}

/* 고스트 심볼 모델 오브젝트 생성 */
function createGhostSymbol(_objectKey, _modelKey, _size, _position) {
	
	var newModel = Module.createGhostSymbol(_objectKey);
	
	newModel.setRotation(0.0, 0.0, 0.0);
	newModel.setScale(new Module.JSSize3D(1.0, 1.0, 1.0));
	newModel.setGhostSymbol(_modelKey);
	newModel.setBasePoint(0.0, -_size.height*0.5, 0.0);
	newModel.setPosition(new Module.JSVector3D(_position[0], _position[1], _position[2]));			

	return newModel;
}

function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
    c = array[i++];
    switch(c >> 4)
    {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
                       ((char2 & 0x3F) << 6) |
                       ((char3 & 0x3F) << 0));
        break;
    }
    }

    return out;
}

// ------------------------------------------------- 브이월드 타일 계산 코드
// VWorld 타일의 레벨 당 길이 (단위 degree)
function getDistanceFromLevel( _level )
{
    if(isNaN(_level))   return null;
    if(_level == 0 )    return 36;
    else                return 36 / (Math.pow(2, _level))
}

// 숫자를 문자열 변환 중 앞자리 0 채움
function leadingZeros(n) {
    var zero = '';
    n = n.toString();

    digits = 8;
    if(n.length<5) digits = 4;

    if (n.length < digits) {
      for (var i = 0; i < digits - n.length; i++)
        zero += '0';
    }
    return zero + n;
  }

// 입력 인자
// options = { level : n, longitude : flon, latitude : flat }
function getTileInfoFromPosition( _options )
{
    var rst = {
        level : _options.level,     // 레벨 출력
        x : 0,
        y : 0,
        idx : 0,                    // 타일 idx (number)
        idy : 0,                    // 타일 idy (number)
        idxstr : "0000",            // 타일 idx 문자열 경로 지정 (자릿수 0 채움)
        idystr : "0000",            // 타일 idy 문자열 경로 지정 (자릿수 0 채움)
        path : "",                  // 서버의 타일 경로 계산
    }
    
    if(_options.longitude>360 || _options.longitude<0 || 180<_options.latitude || _options.latitude<0) return null;

	var levelDist = getDistanceFromLevel(_options.level);
	
	rst.x = _options.longitude;
	rst.y = _options.latitude;
	
	rst.idx = Math.floor((180+_options.longitude)/levelDist);
	rst.idy = Math.floor((90+_options.latitude)/levelDist);
	
	rst.idxstr = leadingZeros(rst.idx);
    rst.idystr = leadingZeros(rst.idy);
    
    rst.path = '/' + _options.level + '/' + rst.idystr + '/' + rst.idystr + '_' + rst.idxstr;
	
    return rst;
}
