﻿var map, layer, layer1, layer2, layer3, PointLayer, polygonLayer, lineLayer;
var ModifyControl, geomLayer;
var vecLayer, drawControl, drawControls;
var vectorlayerdoc, drawLayer;
var highltLayer;
var features;
var featureSelect;
var resultBaseUrl = "gdbp://MapGisLocal/OpenLayerVecterMap/sfcls/"; //缓存结果图层的基地址
var resultlayername = "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/多圈缓冲线_结果" + getTime(); //定义全局变量为结果图层的地址及加上系统当前时间以防止重名而报错
var resultlayername1 = "gdbp://MapGisLocal/OpenLayerVecterMap/sfcls/Cu Fe 叠加结果" + getTime(); //定义全局变量，为结果显示图层的URL，加上系统当前时间以防止重名而报错
/******************************************** 网页打开时显示的地图*************************************************************/
function init() {


    hideresultTable();
    //创建地图容器，里面参数为div的id
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("底图", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地"], {

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: true //是否作为基础显示图层，默认为true，这里设置为false，保证世界河流图能在背景图层中显示，不被覆盖
    });

    //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    map.addControl(new OpenLayers.Control.MousePosition()); //此控件显示鼠标移动时，所在点的地理坐标
    map.addControl(new OpenLayers.Control.Navigation()); //此控件处理伴随鼠标事件的地图浏览
    //将图层加载到地图容器中
    map.addLayer(layer);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
    initFeatureIds44();
    map.addControl(new OpenLayers.Control.OverviewMap());
    map.setCenter(
                new OpenLayers.LonLat(0, 0).transform(
                    new OpenLayers.Projection("EPSG:100"),
                    map.getProjectionObject()
                ), 2
            );

}
/*****************************************添加mapCon背景图片**************************************************/
function setBgImg() {
    var div = document.getElementById('mapCon'); //获取地图容器元素
    div.style.backgroundImage = 'url(images/北京.png)'; //通过style的填充背景图属性设置背景
}
/****************************************************删除mapcon的背景图片***************************************/
function deleImg() {

    var odiv = document.getElementById('mapCon'); //获取这个DIV元素
    odiv.style.background = ''; //将他的背景设置为空
}
/***********************************************瓦片地图的显示*******************************************************************/
function initwp() {
    
    destroymap();
    hideresultTable();
    map = new OpenLayers.Map("mapCon");
    //初始化瓦片图层对象
    layer = new Zondy.Map.TileLayer("MapGIS IGServer TileLayer", "WORLDJW", {

        ip: "127.0.0.1", //ip地址

        port: "6163", //端口号

        isBaseLayer: true//是否作为基础底图显示
    });
    //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    map.addControl(new OpenLayers.Control.MousePosition()); //此控件显示鼠标移动时，所在点的地理坐标
    map.addControl(new OpenLayers.Control.Navigation()); //此控件处理伴随鼠标事件的地图浏览
    //将瓦片图层加载到地图中
    map.addLayer(layer);
    //设置地图初始显示级数和中心
    map.setCenter(new OpenLayers.LonLat(0, 0), 1);
    var overviewMapLayer = new Zondy.Map.TileLayer("MapGIS IGServer TileLayer", "WORLDJW", {
        ip: "127.0.0.1",
        port: "6163",
        isBaseLayer: true
    });
    //鹰眼中的map容器参数设置
    var mapOptions = {
        numZoomLevels: 12, //设置鹰眼地图级数
        maxExtent: new OpenLayers.Bounds(-180, -90, 180, 90)  //设置鹰眼地图范围
    };
    //鹰眼控件的参数设置
    var controlOptions = {
        autoPan: true,   //自动平移鹰眼中的地图，这样标记范围是否始终保持在中心位置
        maximized: true,    //鹰眼窗口开始为最大化(可见)
        mapOptions: mapOptions,   //一个对象，该对象包含了传给鹰眼的map构造函数的非默认选项
        layers: [overviewMapLayer]  //鹰眼容器里加载的图层对象
    };
    //实例化鹰眼控件并加载到地图容器中
    var overviewMap = new OpenLayers.Control.OverviewMap(controlOptions);
    map.addControl(overviewMap);
    setBgImg();
}
/**************************************************矢量地图文档的显示***************************************************************************/
function initdoc() {

    destroymap();
    hideresultTable();
    //创建一个地图容器
    map = new OpenLayers.Map("mapCon",
             { controls:
             [new OpenLayers.Control.Zoom(),
                new OpenLayers.Control.LayerSwitcher(), //图层控件
                new OpenLayers.Control.Navigation(), //鼠标的放大缩小地图
                new OpenLayers.Control.MousePosition()//此控件显示鼠标移动时，所在点的地理坐标
             ]//值可以为数组，里面可以存放对象
             }); //创建一个矢量图层
    layer = new Zondy.Map.Doc("名字", "WorldMKT",
             {

                 ip: "127.0.0.1",
                 port: "6163", //瓦片地图服务端口
                 isBaseLayer: true//是否作为基础显示图层，默认为true
             });
    map.addLayer(layer); //添加图层到地图容器中
    map.setCenter(new OpenLayers.LonLat(0, 0), 2); //地图显示的位置
    map.addControl(new OpenLayers.Control.OverviewMap());
    map.setCenter(
                new OpenLayers.LonLat(0, 0).transform(
                    new OpenLayers.Projection("EPSG:100"),
                    map.getProjectionObject()
                ), 2
            );

    setBgImg();
}
/**************************************************矢量地图的显示***************************************************************************/
function initlayer() {
    deleImg();
    destroymap();
    hideresultTable();
    //创建地图容器
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("ditu", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    map.addLayer(layer); //将地图图层加载到地图中
    map.setCenter(new OpenLayers.LonLat(0, 0), 2); //设置地图显示的中心位置及级别
    initFeatureIds();
    map.addControl(new OpenLayers.Control.OverviewMap());
    map.addControl(new OpenLayers.Control.MousePosition());
    map.setCenter(
                new OpenLayers.LonLat(0, 0).transform(
                    new OpenLayers.Projection("EPSG:100"),
                    map.getProjectionObject()
                ), 2
            );


}
/**************************************************获取要点删除要素的id***************************************************************************/

//查询地图，获取活动图层所有要素列表
function initFeatureIds(maxIndex) {
    featureSelect = $("#featureID");
    $("<option value='请选择要素'>请选择要素</option>").appendTo(featureSelect);

    if (maxIndex != null && maxIndex == 1) {
        return;
    }

    //初始化查询结构对象，设置查询结构包含几何信息
    var queryStruct = new Zondy.Service.QueryFeatureStruct();
    //是否包含几何图形信息
    queryStruct.IncludeGeometry = true;
    //是否包含属性信息
    queryStruct.IncludeAttribute = true;
    //是否包含图形显示参数
    queryStruct.IncludeWebGraphic = false;
    //实例化查询参数对象	
    var queryParam = new Zondy.Service.QueryByLayerParameter("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都", {
        resultFormat: "json",
        struct: queryStruct
    });
    //设置查询要素数目
    queryParam.recordNumber = 1000;
    //设置属性条件
    //queryParam.where = "name='中国'";
    //实例化地图文档查询服务对象
    var queryService = new Zondy.Service.QueryLayerFeature(queryParam, {
        ip: "127.0.0.1",
        port: "6163"
    });
    //执行查询操作，querySuccess为查询回调函数
    queryService.query(querySuccess2323);
}

var pntArr = new Array();
//查询成功回调
function querySuccess2323(a) {
    if (a.SFEleArray != null) {
        if (a.SFEleArray.length == 0) {
            alert("查询结果为空");
        }
        else {
            for (var i = 0; i < a.SFEleArray.length; i++) {
                var obj = a.SFEleArray[i];
                $("<option value='" + i + "'>" + obj.FID + "</option>").appendTo(featureSelect);

                //获取不同编号对应元素的外包络矩形及中心，用于跳转
                var featureBound = obj.bound;
                var x = 0, y = 0;
                //计算外包矩形的中心点
                x = featureBound.xmax != featureBound.xmin ? ((featureBound.xmax - featureBound.xmin) / 2 + featureBound.xmin) : featureBound.xmax;
                y = featureBound.ymax != featureBound.ymin ? ((featureBound.ymax - featureBound.ymin) / 2 + featureBound.ymin) : featureBound.ymax;
                pntArr.push(new OpenLayers.LonLat(x, y));
            }
        } //if else(a.SFEleArray.length == 0)
    } //if (a.SFEleArray != null) 
    else {
        alert("当前地图未查到要素，请先运行对应的要素添加示例！");
    } //if else(a.SFEleArray != null) 
}

//选中某一个要素编号后触发的事件，用于进行要素定位，地图跳转
function onSelect1() {
    var index = $("#Select1").val();
    if (index == "请选择要素") {
        return;
    }
    var pnt = pntArr[index];
    map.panTo(pnt);
}
function onSelect2() {
    var index = $("#Select2").val();
    if (index == "请选择要素") {
        return;
    }
    var pnt = pntArr[index];
    map.panTo(pnt);
}
function onSelect() {
    var index = $("#featureID").val();
    if (index == "请选择要素") {
        return;
    }
    var pnt = pntArr[index];
    map.panTo(pnt);
}
/********************************************************获取删除线要素的id*************************************************/
function initFeatureIds2(maxIndex) {
    featureSelect = $("#Select1");
    $("<option value='请选择要素'>请选择要素</option>").appendTo(featureSelect);

    if (maxIndex != null && maxIndex == 1) {
        return;
    }

    //初始化查询结构对象，设置查询结构包含几何信息
    var queryStruct = new Zondy.Service.QueryFeatureStruct();
    //是否包含几何图形信息
    queryStruct.IncludeGeometry = true;
    //是否包含属性信息
    queryStruct.IncludeAttribute = true;
    //是否包含图形显示参数
    queryStruct.IncludeWebGraphic = false;
    //实例化查询参数对象	
    var queryParam = new Zondy.Service.QueryByLayerParameter("gdbp://MapGisLocal/OpenLayerVecterMa/ds/世界地图经纬度/sfcls/世界河流", {
        resultFormat: "json",
        struct: queryStruct
    });
    //设置查询要素数目
    queryParam.recordNumber = 1000;
    //设置属性条件
    //queryParam.where = "name='中国'";
    //实例化地图文档查询服务对象
    var queryService = new Zondy.Service.QueryLayerFeature(queryParam, {
        ip: "127.0.0.1",
        port: "6163"
    });
    //执行查询操作，querySuccess为查询回调函数
    queryService.query(querySuccess2323);
}

var pntArr = new Array();
//查询成功回调
function querySuccess2323(a) {
    if (a.SFEleArray != null) {
        if (a.SFEleArray.length == 0) {
            alert("查询结果为空");
        }
        else {
            for (var i = 0; i < a.SFEleArray.length; i++) {
                var obj = a.SFEleArray[i];
                $("<option value='" + i + "'>" + obj.FID + "</option>").appendTo(featureSelect);

                //获取不同编号对应元素的外包络矩形及中心，用于跳转
                var featureBound = obj.bound;
                var x = 0, y = 0;
                //计算外包矩形的中心点
                x = featureBound.xmax != featureBound.xmin ? ((featureBound.xmax - featureBound.xmin) / 2 + featureBound.xmin) : featureBound.xmax;
                y = featureBound.ymax != featureBound.ymin ? ((featureBound.ymax - featureBound.ymin) / 2 + featureBound.ymin) : featureBound.ymax;
                pntArr.push(new OpenLayers.LonLat(x, y));
            }
        } //if else(a.SFEleArray.length == 0)
    } //if (a.SFEleArray != null) 
    else {
        alert("当前地图未查到要素，请先运行对应的要素添加示例！");
    } //if else(a.SFEleArray != null) 
}
/******************************************************************获取区要删除的区要素的id*****************************************/
function initFeatureIds44(maxIndex) {
    featureSelect = $("#Select2");
    $("<option value='请选择要素'>请选择要素</option>").appendTo(featureSelect);

    if (maxIndex != null && maxIndex == 1) {
        return;
    }

    //初始化查询结构对象，设置查询结构包含几何信息
    var queryStruct = new Zondy.Service.QueryFeatureStruct();
    //是否包含几何图形信息
    queryStruct.IncludeGeometry = true;
    //是否包含属性信息
    queryStruct.IncludeAttribute = true;
    //是否包含图形显示参数
    queryStruct.IncludeWebGraphic = false;
    //实例化查询参数对象	
    var queryParam = new Zondy.Service.QueryByLayerParameter("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地", {
        resultFormat: "json",
        struct: queryStruct
    });
    //设置查询要素数目
    queryParam.recordNumber = 10000;
    //设置属性条件
    //queryParam.where = "name='中国'";
    //实例化地图文档查询服务对象
    var queryService = new Zondy.Service.QueryLayerFeature(queryParam, {
        ip: "127.0.0.1",
        port: "6163"
    });
    //执行查询操作，querySuccess为查询回调函数
    queryService.query(querySuccess334);
}

var pntArr = new Array();
//查询成功回调
function querySuccess334(a) {
    if (a.SFEleArray != null) {
        if (a.SFEleArray.length == 0) {
            alert("查询结果为空");
        }
        else {

            for (var i = 0; i < a.SFEleArray.length; i++) {
                var obj = a.SFEleArray[i];
                $("<option value='" + i + "'>" + obj.FID + "</option>").appendTo(featureSelect);

                //获取不同编号对应元素的外包络矩形及中心，用于跳转
                var featureBound = obj.bound;
                var x = 0, y = 0;
                //计算外包矩形的中心点
                x = featureBound.xmax != featureBound.xmin ? ((featureBound.xmax - featureBound.xmin) / 2 + featureBound.xmin) : featureBound.xmax;
                y = featureBound.ymax != featureBound.ymin ? ((featureBound.ymax - featureBound.ymin) / 2 + featureBound.ymin) : featureBound.ymax;
                pntArr.push(new OpenLayers.LonLat(x, y));
            }
        } //if else(a.SFEleArray.length == 0)
    } //if (a.SFEleArray != null) 
    else {
        alert("当前地图未查到要素，请先运行对应的要素添加示例！");
    } //if else(a.SFEleArray != null) 
}
/**************************************************点要素的添加***************************************************************************/
function init111() {
    //创建地图容器
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为矢量图层的位置
    layer = new Zondy.Map.Layer("map", ["gdbp://MapGisLocal/OpenLayerVecterMa/ds/世界地图经纬度/sfcls/世界河流"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    //添加控件
    map.addControl(new OpenLayers.Control.MousePosition()); //此控件显示鼠标移动时，所在点的地理坐标
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    map.addControl(new OpenLayers.Control.Navigation()); //此控件处理伴随鼠标事件的地图浏览
    map.addControl(new OpenLayers.Control.PanZoomBar()); //缩放面板的工具控件
    //将地图图层加载到地图中
    map.addLayer(layer);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
    initFeatureIds2();
    map.addControl(new OpenLayers.Control.OverviewMap());
    map.setCenter(
                new OpenLayers.LonLat(0, 0).transform(
                    new OpenLayers.Projection("EPSG:100"),
                    map.getProjectionObject()
                ), 2
            );
}
function addPoint() {
    destroymap();
    initlayer();
    hideresultTable();
    setBgImg();
    //创建一个点形状，，后面是他的坐标。
    var gpoint = new Zondy.Object.GPoint(20, 21);
    //设置当前点要素的属性信息几何空间信息
    var fGeom = new Zondy.Object.FeatureGeometry({ PntGeom: [gpoint] });
    //描述点要素的符号参数信息
    var pointInfo = new Zondy.Object.CPointInfo({
        Angle: 0, //转角
        Color: 23,
        SymHeight: 1200, //点图形的高度
        SymWidth: 1200, //点图形的宽度
        SymID: 7 // 图形库的图形代号，可以在mapGis10的菜单栏里面的设置->系统库设置里面查看。
    });
    //设置当前点要素的图形参数。
    var webGraphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 1, //InfoType:点要素的图形参数类型 1是点，2是.线3是区。
        PntInfo: pointInfo//将点要素的符号参数信息传给图形参数
    }); //设置属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["Capital", "Country", "Cap_Pop"], //字段名称
        FldNumber: 3, //字段的个数
        FldType: ["string", "string", "double"]//设置字段的类型

    }); //设置添加点要素的属性
    var attValue = ['兰州', '中国', 1.0];
    //创建一个要素
    var feature = new Zondy.Object.Feature({
        fGeom: fGeom, //几何信息
        GraphicInfo: webGraphicInfo, //图形信息
        AttValue: attValue//属性信息

    });
    //设置要素为点要素1为点要素，2为线要素。，
    feature.setFType(1);
    //创建一个要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    featureSet.clear(); //避免要素集里面有其他数据，将要素集清空
    //给要素集添加属性结构
    featureSet.AttStruct = attStruct; //将设置的属性结构赋值给要素数据集
    //将点要素添加到要素集中
    featureSet.addFeature(feature);
    //创建一个编辑服务类
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都", //需要编辑的矢量图层的URL
            {
            ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
            port: "6163"//矢量地图服务端口
        }); //执行添加要素服务
    editService.add(featureSet, onSuccess);
}
/**************************************点要素的删除************************************************/
function deletePoint() {
    destroymap();
    initlayer();
    hideresultTable();
    var featureIds = $("#featureID").find("option:selected").text();
    if (featureIds == "请选择要素") {
        alert("请先选择要素，再进行删除!");
        return;
    }
    //创建删除服务对象
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都",
            {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163"//矢量地图服务端口
            });
    //将服务对象的点的要素删除，及回掉函数返回是否删除成功
    editService.deletes(featureIds, onSuccess);

}
/**************************************点要素的更新************************************************/
function updatePoint() {
    destroymap();
    hideresultTable();
    initlayer();
    //创建一个点形状，描述点形状的几何信息。
    var gpoint = new Zondy.Object.GPoint(20, 21);
    // 设置添加点要素的属性信息空间几何信息
    var fGom = new Zondy.Object.FeatureGeometry({ PntGeom: [gpoint] });
    //设置点的符号信息
    var pointInfo = new Zondy.Object.CPointInfo({
        Angle: 0, //转角
        Color: 2, //点的颜色
        SymHeight: 120, //点图形的高度
        SymWidth: 120, //点图形的高度
        SymID: 22// 图形库的图形代号，可以在mapGis10的菜单栏里面的设置->系统库设置里面查看。
    });
    //设置当前点要素的图形参数信息
    var webGraphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 1, //InfoType:点要素的图形参数类型 1是点，2是.线3是区。
        PntInfo: pointInfo//将点要素的符号参数信息传给图形参数
    });
    //设置属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["Cname", "CNTRY_NAME", "POPULATION"], //字段的名称
        FldNumber: 3, //字段的个数
        FldType: ["string", "string", "double"]//设置字段的类型
    });
    //设置添加点要素的属性
    var attValue = ["平川", "中国", 3.0];
    //创建一个新的要素
    var feature = new Zondy.Object.Feature({
        fGeom: fGom, //几何信息
        GraphicInfo: webGraphicInfo, //图形参数信息
        AttValue: attValue//属性信息
    });
    //设置要素为点要素1为点要素，2为线要素。
    feature.setFType(1);
    //需要更新点的OID
    feature.setFID(164);
    var featureSet = new Zondy.Object.FeatureSet(); //创建要素数据集
    featureSet.clear(); //避免要素集里面有其他数据，将要素集清空
    featureSet.AttStruct = attStruct; //将设置的属性结构赋值给要素数据集
    //添加要素到要素数据集
    featureSet.addFeature(feature);
    //创建一个编辑服务类
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都", //需要编辑的矢量图层的URL
            {
            ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
            port: "6163"//矢量地图服务端口
        }); //执行添加要素服务
    editService.update(featureSet, onSuccess);
}
/**************************************线要素的添加************************************************/
function addline() {
    destroymap();
    hideresultTable();
    init111();
    //创建一个数组，放入线的两端的坐标
    var gPoint = new Array();
    gPoint[0] = new Zondy.Object.Point2D(58, 11); //在地图中随机选择两个点，用于画线
    gPoint[1] = new Zondy.Object.Point2D(90, -12);
    //创建弧段，将点的数组传值给弧段。
    var gArc = new Zondy.Object.Arc(gPoint);
    //创建折线,将弧段传给折线
    var anyLine = new Zondy.Object.AnyLine([gArc]);
    //设置线要素的几何信息
    var gline = new Zondy.Object.GLine(anyLine); //创建一个线形状，传入他的折线的参数信息，设置线要素的几何信息
    var fGeom = new Zondy.Object.FeatureGeometry({ LinGeom: [gline] }); //设置要素的几何信息
    //描述线要素的符号参数信息
    var clineInfo = new Zondy.Object.CLineInfo({
        Color: 13, //颜色
        LinStyleID: 1, //线型
        LinWidth: 0.5, //线宽
        Xscale: 0.5, //线的显示率
        Yscale: 0.5//线的显示率
    });
    //设置当前线要素的图形参数信息
    var graphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 2, //InfoType:线要素的图形参数类型 1是点，2是.线3是区。
        LinInfo: clineInfo//将线要素的符号参数信息传给图形参数
    });
    //设置属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["ID", "长度", "NAME", "SYSTEM", "FID1", "LAYERID", "CName"], //字段名称
        FldNumber: 7, //字段的个数
        FldType: ["long", "double", "string", "string", "long", "long", "string"]//字段的类型
    });
    //设置添加线要素的属性信息
    var attValue = [0, 48.22, "平川", '', 124, 0, '黄河'];
    //创建一个要素
    var newFeature = new Zondy.Object.Feature({
        fGeom: fGeom, //几何参数
        GraphicInfo: graphicInfo, //图形参数
        AttValue: attValue//属性参数
    });
    //设置要素为线要素
    newFeature.setFType(2);
    //创建一个要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    featureSet.AttStruct = attStruct; //将设置的属性结构赋值给要素数据集
    featureSet.addFeature(newFeature); //将线要素添加到数据集中
    //创建地图服务对象
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/OpenLayerVecterMa/ds/世界地图经纬度/sfcls/世界河流", {
        //需要编辑的矢量图层的URL
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口
    });
    //执行添加要素服务，第一个参数为要素集，第二个为回调函数返回是否添加成功
    editService.add(featureSet, onSuccess);
}
/**************************************线要素的更新************************************************/
function line() {
    destroymap();
    hideresultTable();
    init111();
    //创建一个数组，放入线的两端的坐标
    var gPoint = new Array();
    gPoint[0] = new Zondy.Object.Point2D(58, 11);
    gPoint[1] = new Zondy.Object.Point2D(90, -12);
    //创建弧段，将点的数组传值给弧段。
    var gArc = new Zondy.Object.Arc(gPoint);
    //创建折线,将弧段传给折线
    var anyLine = new Zondy.Object.AnyLine([gArc]);
    //设置线要素的几何信息
    var gline = new Zondy.Object.GLine(anyLine); //创建一个线形状，传入他的折线的参数信息，设置线要素的几何信息
    var fGeom = new Zondy.Object.FeatureGeometry({ LinGeom: [gline] }); //设置要素的几何信息
    //描述线要素的符号参数信息
    var clineInfo = new Zondy.Object.CLineInfo({
        Color: 13, //颜色
        LinStyleID: 1, //线型
        LinWidth: 0.5, //线宽
        Xscale: 0.5, //线的显示率
        Yscale: 0.5//线的显示率
    });
    //设置当前线要素的图形参数信息
    var graphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 2, //InfoType:线要素的图形参数类型 1是点，2是.线3是区。
        LinInfo: clineInfo//将线要素的符号参数信息传给图形参数
    });
    //设置属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["ID", "长度", "NAME", "SYSTEM", "FID1", "LAYERID", "CName"], //字段名称
        FldNumber: 7, //字段的个数
        FldType: ["long", "double", "string", "string", "long", "long", "string"]//字段的类型
    });
    //设置添加线要素的属性信息
    var attValue = [0, 48.22, "兰州", '', 124, 0, '黄河'];
    //创建一个要素
    var newFeature = new Zondy.Object.Feature({
        fGeom: fGeom, //几何参数
        GraphicInfo: graphicInfo, //图形参数
        AttValue: attValue//属性参数
    });
    //设置要素为线要素
    newFeature.setFType(2);
    //需要更新线的OID
    newFeature.setFID(142);
    //创建一个要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    featureSet.AttStruct = attStruct; //将设置的属性结构赋值给要素数据集
    featureSet.addFeature(newFeature); //将线要素添加到数据集中
    //创建地图服务对象
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/OpenLayerVecterMa/ds/世界地图经纬度/sfcls/世界河流", {
        //需要编辑的矢量图层的URL
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口
    });
    //执行更新要素服务，第一个参数为要素集，第二个为回调函数返回是否添加成功
    editService.update(featureSet, onSuccess);
}
/**************************************线要素的删除************************************************/
function deletsline() {
    destroymap();
    init111();
    hideresultTable();
    var featureIds = $("#feature1").find("option:selected").text();
    if (featureIds == "请选择要素") {
        alert("请先选择要素，再进行删除!");
        return;
    }
    //创建一个编辑服务类
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/OpenLayerVecterMa/ds/世界地图经纬度/sfcls/世界河流", //需要编辑的矢量图层的URL
            {
            ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
            port: "6163"//矢量地图服务端口
        });
    //将服务对象的点的要素删除，及回掉函数返回是否删除成功
    editService.deletes(festures, onSuccess);

}
/**************************************区要素的删除************************************************/
function delequ() {
    destroymap();
    hideresultTable();
    init();
    var featureIds = $("#feature2").find("option:selected").text();
    if (featureIds == "请选择要素") {
        alert("请先选择要素，再进行删除!");
        return;
    }
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地", {//需要编辑的矢量图层的URL

        ip: "127.0.0.1", //删除图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口

    });
    //将服务对象的区的要素删除，及回掉函数返回是否删除成功
    editService.deletes(festures, onSuccess);
}
//定义一个函数用于获取随机点
function getPoint() {
    //获取地图的最大显示范围
    var mapBound = map.getMaxExtent();
    //计算得到地图容器的宽度
    var width = mapBound.right - mapBound.left;
    //计算得到地图容器的高度
    var height = mapBound.top - mapBound.bottom;
    //计算随机点的X坐标
    var pointX = Math.random() * width + mapBound.left;
    //计算随机点的Y坐标
    var pointY = Math.random() * height + mapBound.bottom;
    //返回随机点的坐标
    return new Zondy.Object.Point2D(pointX, pointY);
}
/***************************************区要素的添加************************/
function addRegion() {
    destroymap();
    hideresultTable();
    init();
    var points = new Array(); //定义一个数组，用于存储区的四个点的坐标
    points[0] = getPoint(); //四边形的第一个点的坐标，调用获取随机点的函数生成坐标、
    points[1] = getPoint(); //四边形的第二个点的坐标，调用获取随机点的函数生成坐标
    points[2] = getPoint(); //四边形的第三个点的坐标，调用获取随机点的函数生成坐标
    points[3] = getPoint(); //四边形的第四个点的坐标，调用获取随机点的函数生成坐标

    //构成区要素的弧段
    var arc = new Zondy.Object.Arc(points);
    //构成区要素的折线
    var anyLine = new Zondy.Object.AnyLine([arc]);
    //设置区要素的几何信息
    var region = new Zondy.Object.GRegion([anyLine]);
    //构成区要素的几何信息
    var fGeom = new Zondy.Object.FeatureGeometry({ RegGeom: [region] });
    //随机输出1~1502之间的整数,floor返回一个比参数小的最大的整数
    var fillColor = Math.floor(Math.random() * 1502 + 1);
    //设置区的符号信息
    var cRegionInfo = new Zondy.Object.CRegionInfo({

        FillColor: fillColor, //区的填充颜色，
        OutPenWidth: 1, //设置区要素的填充图案笔宽
        FillMode: 0, //设置区要素的填充模式默认值为0，取值范围：0（常规模式）、1（线性渐变模式）、2（矩形渐变模式）、3（圆形渐变模式）。
        PatAngle: 1, //设置区要素的填充图案角度，取值范围为0~360，默认值为1。
        PatColor: 1, //填充图案颜色
        PatHeight: 1, //填充图案高度
        PatID: 27//填充图案ID
    });
    //设置图形参数信息
    var graphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 3, //InfoType:区要素的图形参数类型 1是点，2是.线3是区。
        RegInfo: cRegionInfo//将区要素的符号参数信息传给图形参数
    });
    //创建属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["ID", "mpArea", "CAPITAL", "POP_1994"], //字段的名称
        FldNumber: 4, //字段的个数
        FldType: ["long", "double", "string", "double"]//设置字段的类型
    });
    //设置添加区要素的属性信息
    var attValue = [2525, 0.01223, "平川", "0.123"];
    //创建一个要素
    var newFeature = new Zondy.Object.Feature({
        fGeom: fGeom, //几何信息
        GraphicInfo: graphicInfo, //图形信息
        AttValue: attValue//属性信息
    });
    //将要素设置为区要素
    newFeature.setFType(3);
    //创建一个要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    featureSet.AttStruct = attStruct; //设置要素数据集的属性结构
    featureSet.addFeature(newFeature); //添加要素到要素数据集
    //创建地图服务对象
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地", {//需要编辑的矢量图层的URL

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口

    }); //执行添加要素服务，及回掉函数返回是否添加成功
    editService.add(featureSet, onSuccess);
}
/**************************************区要素的更新***********************************************/
function gengxinRegion() {
    destroymap();
    hideresultTable();
    init();
    var points = new Array(); //定义一个数组，用于存储区的四个点的坐标
    points[0] = getPoint(); //四边形的第一个点的坐标，调用获取随机点的函数生成坐标、
    points[1] = getPoint(); //四边形的第二个点的坐标，调用获取随机点的函数生成坐标
    points[2] = getPoint(); //四边形的第三个点的坐标，调用获取随机点的函数生成坐标
    points[3] = getPoint(); //四边形的第四个点的坐标，调用获取随机点的函数生成坐标

    //构成区要素的弧段
    var arc = new Zondy.Object.Arc(points);
    //构成区要素的折线
    var anyLine = new Zondy.Object.AnyLine([arc]);
    //构成区要素
    var region = new Zondy.Object.GRegion([anyLine]);
    //构成区要素的几何信息
    var fGeom = new Zondy.Object.FeatureGeometry({ RegGeom: [region] });
    //随机输出1~1502之间的整数,floor返回一个比参数小的最大的整数
    var fillColor = Math.floor(Math.random() * 1502 + 1);
    //设置区的符号信息
    var cRegionInfo = new Zondy.Object.CRegionInfo({
        FillColor: fillColor, //区的填充颜色，
        OutPenWidth: 1, //设置区要素的填充图案笔宽
        FillMode: 0, //设置区要素的填充模式默认值为0，取值范围：0（常规模式）、1（线性渐变模式）、2（矩形渐变模式）、3（圆形渐变模式）。
        PatAngle: 1, //设置区要素的填充图案角度，取值范围为0~360，默认值为1。
        PatColor: 1, //填充图案颜色
        PatHeight: 1, //填充图案高度
        PatID: 27//填充图案ID
    });
    //设置图形参数信息
    var graphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 3, //InfoType:区要素的图形参数类型 1是点，2是.线3是区。
        RegInfo: cRegionInfo//将区要素的符号参数信息传给图形参数
    });
    //创建属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["ID", "mpArea", "CAPITAL", "POP_1994"], //字段的名称
        FldNumber: 4, //字段的个数
        FldType: ["long", "double", "string", "double"]//设置字段的类型
    });
    //设置添加区要素的属性信息
    var attValue = [2525, 0.01223, "平川", "0.123"];
    //创建一个要素
    var newFeature = new Zondy.Object.Feature({
        fGeom: fGeom, //几何信息
        GraphicInfo: graphicInfo, //图形信息
        AttValue: attValue//属性信息
    });
    //将要素设置为区要素
    newFeature.setFType(3);
    newFeature.setFID(2532); //需要更新区的OID
    //创建一个要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    featureSet.AttStruct = attStruct; //设置要素数据集的属性结构
    featureSet.addFeature(newFeature); //添加要素到要素数据集
    //创建地图服务对象
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地", {//需要编辑的矢量图层的URL
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口
    }); //执行更新要素服务，及回掉函数返回是否更新成功
    editService.update(featureSet, onSuccess);
}
/**************************************类单圈缓冲区分析************************************************/
function initbuff() {

    //创建地图容器，里面参数为div的id
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("多圈类缓冲区分析底图", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/世界河流"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    map.addControl(new OpenLayers.Control.Navigation()); //此控件处理伴随鼠标事件的地图浏览
    map.addControl(new OpenLayers.Control.MousePosition()); //此控件显示鼠标移动时，所在点的地理坐标
    //将地图图层加载到地图中
    map.addLayer(layer);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 1);
}
//多重类缓冲区分析
function classBuffByMultiplyRing() {
    destroymap();
    initbuff();
    hideresultTable();
    clearA();   //用于清除图层
    //实例化一个类缓冲对象
    var classBuffAnalysis = new Zondy.Service.ClassBufferBySingleRing({
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口

        leftRad: 5, //左缓冲半径
        rightRad: 5 //右缓冲半径
    });

    //调用Zondy.Service.ClassBufferBase基类公共属性
    classBuffAnalysis.srcInfo = "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/世界河流";
    //var resultname = "singleBuffAnalysisResultLayer" + getCurentTime();
    classBuffAnalysis.desInfo = resultlayername;

    //调用基类Zondy.Service.AnalysisBase的execute方法执行类缓冲分析，AnalysisSuccess为回调函数
    classBuffAnalysis.execute(Analysissuccess22);
}
/**************************************类多圈缓冲区分析************************************************/
function classBuffByMultiplyRing1() {
    destroymap();
    initbuff();
    hideresultTable();
    clearA();   //用于清除图层
    //实例化一个类缓冲对象
    var classBuffAnalysis = new Zondy.Service.ClassBufferByMultiplyRing({
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        radiusStr: "10,10,20,30", //多圈缓冲分析各圈的缓冲半径
        //源矢量图层URL。
        srcInfo: "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/世界河流",
        //裁剪分析结果图层URL,就是定义的全局变量，
        desInfo: resultlayername
    });
    //调用基类Zondy.Service.AnalysisBase的execute方法执行类缓冲分析，Analysissuccess为回调函数
    classBuffAnalysis.execute(Analysissuccess333);
}
/**************************************要素单圈缓冲区分析************************************************/
function singleBuffAnalysis() {
    destroymap();
    init();
    hideresultTable();
    var points = new Array(); //定义一个数组，用于存储多边形区的坐标
    points[0] = new Zondy.Object.Point2D(0.46, 30.1); //多边形的第一个点的坐标
    points[1] = new Zondy.Object.Point2D(11.48, 6.22); //多边形的第二个点的坐标
    points[2] = new Zondy.Object.Point2D(36.73, 7.6); //多边形的第三个点的坐标
    points[3] = new Zondy.Object.Point2D(58.77, 25.51); //多边形的第四个点的坐标
    points[4] = new Zondy.Object.Point2D(41.33, 49.39); //多边形的第五个点的坐标
    //创建弧段，将得到的点的参数信息传值给弧段要素。点构成弧段
    var arc = new Zondy.Object.Arc(points);
    //创建折线，将得到的弧段的参数信息传值给折线要素，弧段构成折线
    var anyLine = new Zondy.Object.AnyLine([arc]);
    //构成区要素，将得到的折线参数信息传值给区要素，
    var region = new Zondy.Object.GRegion([anyLine]);
    //设置区的几何信息
    var regGeom = new Zondy.Object.FeatureGeometry();
    regGeom.setRegGeom([region]);
    //设置区的符号信息
    var cRegionInfo = new Zondy.Object.CRegionInfo({

        FillColor: 13, //区的填充颜色，
        OutPenWidth: 1, //设置区要素的填充图案笔宽
        FillMode: 0, //设置区要素的填充模式默认值为0，取值范围：0（常规模式）、1（线性渐变模式）、2（矩形渐变模式）、3（圆形渐变模式）。
        PatAngle: 1, //设置区要素的填充图案角度，取值范围为0~360，默认值为1。
        PatColor: 1, //填充图案颜色
        PatHeight: 1, //填充图案高度
        PatID: 27//填充图案ID
    });
    //设置图形参数信息
    var graphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 3, //InfoType:区要素的图形参数类型 1是点，2是.线3是区。
        RegInfo: cRegionInfo//将区要素的符号参数信息传给图形参数
    });
    //设置属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["ID", "面积", "周长", "LayerID"], //字段的名称
        FldNumber: 4, //字段的个数
        FldType: ["long", "double", "double", "long"]//设置字段的类型
    });

    //设置要缓冲区的要素的属性信息
    var attValue = [0, 62.566714, 50.803211, 0];
    //创建一个MapGIS CAttDataRow对象类，描述要素属性信息，与属性结构信息对应，1为对象类的要素ID。用户自定义，默认值为0
    var valueRow = new Zondy.Object.CAttDataRow(attValue, 1);
    //创建一个要素
    var newfeature = new Zondy.Object.Feature({

        fGeom: regGeom, //几何信息
        GraphicInfo: graphicInfo, //图形信息
        AttValue: attValue//属性信息
    });
    //将要素设置为区要素
    newfeature.setFType(3);
    //创建要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    //设置要素数据集的属性结构
    featureSet.AttStruct = attStruct;
    //添加要素到要素数据集中
    featureSet.addFeature(newfeature);
    //创建地图服务对象
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地", {//需要编辑的矢量图层的URL

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口

    });
    //执行添加要素服务
    editService.add(featureSet);
    //实例化单圈缓冲区分析对象，设置要素缓冲分析必要参数，输出分析结果到缓冲分析结果图层
    var featureBufBySR = new Zondy.Service.FeatureBuffBySingleRing({
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        leftRad: 10, //左缓冲半径
        rightRad: 10//右缓冲半径
    });
    //设置必要参数
    featureBufBySR.sfGeometryXML = $.toJSON([regGeom]); //设置要素的几何信息，将几何信息以JSON的形式传给缓冲区分析对象，$为jquery，toJSON为jquery的方法。
    featureBufBySR.attStructXML = $.toJSON([attStruct]); //设置要素的属性结构信息
    featureBufBySR.attRowsXML = $.toJSON([valueRow]); //设置要素的属性信息
    featureBufBySR.traceRadius = 0.0001; //跟踪半径
    //设置目的矢量图层URL，后面调用获取当前时间的函数，以防止重名。
    featureBufBySR.resultName = "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/" + getTime();
    //调用基类Zondy.Service.AnalysisBase的execute方法执行类缓冲分析，AnalysisSuccess为回调函数
    featureBufBySR.execute(AnalysisSuccess1);
}
/**************************************要素多圈缓冲区分析************************************************/
function singleBuffAnalysis1() {
    destroymap();
    init();
    hideresultTable();
    var points = new Array(); //定义一个数组，用于存储多边形区的坐标
    points[0] = new Zondy.Object.Point2D(0.46, 30.1); //多边形的第一个点的坐标
    points[1] = new Zondy.Object.Point2D(11.48, 6.22); //多边形的第二个点的坐标
    points[2] = new Zondy.Object.Point2D(36.73, 7.6); //多边形的第三个点的坐标
    points[3] = new Zondy.Object.Point2D(58.77, 25.51); //多边形的第四个点的坐标
    points[4] = new Zondy.Object.Point2D(41.33, 49.39); //多边形的第五个点的坐标
    //创建弧段，将得到的点的参数信息传值给弧段要素。点构成弧段
    var arc = new Zondy.Object.Arc(points);
    //创建折线，将得到的弧段的参数信息传值给折线要素，弧段构成折线
    var anyLine = new Zondy.Object.AnyLine([arc]);
    //构成区要素，将得到的折线参数信息传值给区要素，
    var region = new Zondy.Object.GRegion([anyLine]);
    //设置区的几何信息
    var regGeom = new Zondy.Object.FeatureGeometry();
    regGeom.setRegGeom([region]);
    //设置区的符号信息
    var cRegionInfo = new Zondy.Object.CRegionInfo({

        FillColor: 13, //区的填充颜色，
        OutPenWidth: 1, //设置区要素的填充图案笔宽
        FillMode: 0, //设置区要素的填充模式默认值为0，取值范围：0（常规模式）、1（线性渐变模式）、2（矩形渐变模式）、3（圆形渐变模式）。
        PatAngle: 1, //设置区要素的填充图案角度，取值范围为0~360，默认值为1。
        PatColor: 1, //填充图案颜色
        PatHeight: 1, //填充图案高度
        PatID: 27//填充图案ID
    });
    //设置图形参数信息
    var graphicInfo = new Zondy.Object.WebGraphicsInfo({
        InfoType: 3, //InfoType:区要素的图形参数类型 1是点，2是.线3是区。
        RegInfo: cRegionInfo//将区要素的符号参数信息传给图形参数
    });
    //设置属性结构
    var attStruct = new Zondy.Object.CAttStruct({//在查看矢量图层的属性结构查看
        FldName: ["ID", "面积", "周长", "LayerID"], //字段的名称
        FldNumber: 4, //字段的个数
        FldType: ["long", "double", "double", "long"]//设置字段的类型
    });

    //设置要缓冲区的要素的属性信息
    var attValue = [0, 62.566714, 50.803211, 0];
    //创建一个MapGIS CAttDataRow对象类，描述要素属性信息，与属性结构信息对应，1为对象类的要素ID。用户自定义，默认值为0
    var valueRow = new Zondy.Object.CAttDataRow(attValue, 1);
    //创建一个要素
    var newfeature = new Zondy.Object.Feature({

        fGeom: regGeom, //几何信息
        GraphicInfo: graphicInfo, //图形信息
        AttValue: attValue//属性信息
    });
    //将要素设置为区要素
    newfeature.setFType(3);
    //创建要素数据集
    var featureSet = new Zondy.Object.FeatureSet();
    //设置要素数据集的属性结构
    featureSet.AttStruct = attStruct;
    //添加要素到要素数据集中
    featureSet.addFeature(newfeature);
    //创建地图服务对象
    var editService = new Zondy.Service.EditLayerFeature("gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地", {//需要编辑的矢量图层的URL

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口

    });
    //执行添加要素服务
    editService.add(featureSet);
    //实例化单圈缓冲区分析对象，设置要素缓冲分析必要参数，输出分析结果到缓冲分析结果图层
    var featureBufBySR = new Zondy.Service.FeatureBuffByMultiplyRing({
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        radiusStr: "10,10,20,10", //多圈缓冲分析各圈的缓冲半径
        //源矢量图层URL。
        srcInfo: "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地",
        desInfo: "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/" + getTime()
    });
    //设置必要参数
    featureBufBySR.sfGeometryXML = $.toJSON([regGeom]); //设置要素的几何信息，将几何信息以JSON的形式传给缓冲区分析对象，$为jquery，toJSON为jquery的方法。
    featureBufBySR.attStructXML = $.toJSON([attStruct]); //设置要素的属性结构信息
    featureBufBySR.attRowsXML = $.toJSON([valueRow]); //设置要素的属性信息
    featureBufBySR.traceRadius = 0.0001; //跟踪半径
    //设置目的矢量图层URL，后面调用获取当前时间的函数，以防止重名。
    featureBufBySR.resultName = "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/" + getTime();
    //调用基类Zondy.Service.AnalysisBase的execute方法执行类缓冲分析，AnalysisSuccess为回调函数
    featureBufBySR.execute(AnalysisSuccess1);
}
/**************************************多边形裁剪分析************************************************/
function initcaijian() {

    //创建地图容器，里面参数为div的id
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer1 = new Zondy.Map.Layer("ditu", ["gdbp://MapGisLocal/OpenLayerVecterMap/ds/世界地图经纬度/sfcls/世界河流"], {

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: false//是否作为基础显示图层，默认为true，这里设置为false，保证世界河流图能在背景图层中显示，不被覆盖
    });
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("底图", ["gdbp://MapGisLocal/OpenLayerVecterMap/ds/世界地图经纬度/sfcls/背景图层"], {

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: true //是否作为基础显示图层，默认为true
    });
    //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    map.addControl(new OpenLayers.Control.MousePosition()); //此控件显示鼠标移动时，所在点的地理坐标
    map.addControl(new OpenLayers.Control.Navigation()); //此控件处理伴随鼠标事件的地图浏览
    //将图层加载到地图容器中
    map.addLayers([layer, layer1]);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
}
function clipAnalysisByPlagon() {
    destroymap();
    initcaijian();
    hideresultTable();
    //创建裁剪分析对象
    var clipAnalysis = new Zondy.Service.ClipByPolygon({
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163"//矢量地图服务端口
    });
    //设置被裁剪图层URL
    clipAnalysis.srcInfo = "gdbp://MapGisLocal/OpenLayerVecterMap/ds/世界地图经纬度/sfcls/世界河流";
    //设置目的矢量图层URL后面加上获取的当前时间，防止重名，使得裁剪失败，
    clipAnalysis.desInfo = "gdbp://MapGisLocal/OpenLayerVecterMap/sfcls/裁剪结果" + getTime();
    //strPos为string格式，内容是多边形几个点的坐标：X1，Y1，X2，Y2。。。。。。
    clipAnalysis.strPos = "-97,16,-31,16,-29,-32,-96,-29";
    //调用基类的execute方法，执行多边形裁剪分析，AnalysisSuccess为结果回调函数
    clipAnalysis.execute(AnalysisSuccess2);
}

function AnalysisSuccess2(data) {
    alert(data.results[0].Value); //弹窗显示，显示裁剪结果及当前系统日期。
    if (data.results) {//判断是否返回结果
        if (data.results.length != 0) {//判断data.result是否为空，如果不为空，将返回的裁剪的结果加载在图层中
            //创建一个矢量图层，第一个参数为图层名称，第二个参数为获取的裁剪结果的地址
            var resultLayer = new Zondy.Map.Layer("结果图层", ["gdbp://MapGisLocal/OpenLayerVecterMap/sfcls/" + data.results[0].Value], {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163", //矢量地图服务端口
                isBaseLayer: false//是否作为基础显示图层
            });
            //将裁剪分析得到的图层添加到地图中
            map.addLayer(resultLayer);
            alert("裁剪成功"); //弹窗显示
        }
    }
    else {
        alert("缓冲失败，请检查参数！！"); //弹窗显示
    }
}
function AnalysisSuccess1(data) {
    if (data.results) {//判断是否返回结果
        if (data.results.length != 0) {//判断data.result是否为空，如果不为空，将返回的缓冲的结果加载在图层中
            //创建一个矢量图层，第一个参数为图层名称，第二个参数为获取的缓冲结果的地址
            var resultLayer = new Zondy.Map.Layer("结果图层", [data.results[0].Value], {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163", //矢量地图服务端口
                isBaseLayer: false//是否作为基础显示图层
            });
            map.addLayer(resultLayer); //将缓冲分析得到的图层添加到地图中
        }
    }
    else {
        alert("缓冲失败，请检查参数！！"); //弹窗显示
    }
}
function Analysissuccess22(data) {
    alert(data.results);
    if (data.results) {//判断是否返回结果，results为回调函数结果的属性
        if (data.results.length != 0) {//判断data.result是否为空，如果不为空，将返回的缓冲的结果加载在图层中
            //创建一个矢量图层，第一个参数为图层名称，第二个参数为获取的缓冲结果的地址
            var resultLayer = new Zondy.Map.Layer("类单缓冲区结果", [resultlayername], {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163", //矢量地图服务端口
                isBaseLayer: false//是否作为基础显示图层
            });
            map.addLayer(resultLayer); //将缓冲区分析得到的图层添加到地图中

        }

    }
    else {
        alert("缓冲失败分析失败，请检查参数！！"); //弹窗显示
    }


}
function Analysissuccess333(data) {
    alert(data.results);
    if (data.results) {//判断是否返回结果，results为回调函数结果的属性
        if (data.results.length != 0) {//判断data.result是否为空，如果不为空，将返回的缓冲的结果加载在图层中
            //创建一个矢量图层，第一个参数为图层名称，第二个参数为获取的缓冲结果的地址
            var resultLayer = new Zondy.Map.Layer("类多圈缓冲区结果", [resultlayername], {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163", //矢量地图服务端口
                isBaseLayer: false//是否作为基础显示图层
            });
            map.addLayer(resultLayer); //将缓冲区分析得到的图层添加到地图中

        }

    }
    else {
        alert("缓冲失败分析失败，请检查参数！！"); //弹窗显示
    }


}
/**************************************图层裁剪分析************************************************/
function inittuceng() {

    //创建地图容器，里面参数为div的id
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("ditu", ["gdbp://MapGisLocal/OpenLayerVecterMap/ds/世界地图经纬度/sfcls/beij"], {

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: true //是否作为基础显示图层，默认为true，这里设置为false，保证世界河流图能在背景图层中显示，不被覆盖
    });

    //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    map.addControl(new OpenLayers.Control.MousePosition()); //此控件显示鼠标移动时，所在点的地理坐标
    map.addControl(new OpenLayers.Control.Navigation()); //此控件处理伴随鼠标事件的地图浏览
    //将图层加载到地图容器中
    map.addLayer(layer);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
}
//执行图层裁剪分析
function clipByLayerAnalysis11() {
    destroymap();
    inittuceng();
    hideresultTable();
    clearA(); //清除之前的分析结果
    var resultname = resultBaseUrl + "clipByLayerAnalysisResultLayer" + getTime();
    //实例化ClipByLayer类
    var clipParam = new Zondy.Service.ClipByLayer({
        ip: "127.0.0.1",
        port: "6163",
        srcInfo1: "gdbp://MapGisLocal/OpenLayerVecterMap/ds/世界地图经纬度/sfcls/世界河流",    	//设置裁剪图层URL
        srcInfo2: "gdbp://MapGisLocal/OpenLayerVecterMap/ds/世界地图经纬度/sfcls/beij",   		//设置被裁剪图层URL
        desInfo: resultname   	//设置结果URL 
    });
    //调用基类的execute方法，执行图层裁剪分析。AnalysisSuccess为结果回调函数
    clipParam.execute(AnalysisSuccess3);
}
function AnalysisSuccess3(data) {
    alert(data.results[0].Value); //弹窗显示，显示裁剪结果及当前系统日期。
    if (data.results) {//判断是否返回结果
        if (data.results.length != 0) {//判断data.result是否为空，如果不为空，将返回的裁剪的结果加载在图层中
            //创建一个矢量图层，第一个参数为图层名称，第二个参数为获取的裁剪结果的地址
            var resultLayer = new Zondy.Map.Layer("结果图层", [resultBaseUrl + data.results[0].Value], {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163", //矢量地图服务端口
                isBaseLayer: false//是否作为基础显示图层
            });
            //将裁剪分析得到的图层添加到地图中
            map.addLayer(resultLayer);
            alert("裁剪成功"); //弹窗显示
        }
    }
    else {
        alert("缓冲失败，请检查参数！！"); //弹窗显示
    }
}
/********************************************叠加分析*******************************************/
function initdiejia() {
    
    //创建地图容器，里面参数为div的id
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("背景图层", ["gdbp://MapGisLocal/OpenLayerVecterMap/sfcls/cu fe 背景图"], {

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer1 = new Zondy.Map.Layer("铜矿", ["gdbp://MapGisLocal/OpenLayerVecterMap/sfcls/广西省级行政区n.WP"], {

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: false//是否作为基础显示图层，这里设置为false，要显示在基础显示图层
    });
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer2 = new Zondy.Map.Layer("铁矿", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/世界河流"], {

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: false//是否作为基础显示图层，这里设置为false，要显示在基础显示图层
    });
    //添加控件
    map.addControl(new OpenLayers.Control.MousePosition()); //此控件显示鼠标移动时，所在点的地理坐标
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    map.addControl(new OpenLayers.Control.Navigation()); //此控件处理伴随鼠标事件的地图浏览
    map.addLayers([layer, layer1, layer2]); //将图层加载到地图容器中
    map.setCenter(new OpenLayers.LonLat(0, 0), 1); //设置地图显示的中心位置及级别
}
function OverlayByLayer() {
    destroymap();
    initdiejia();
    hideresultTable();
    //创建一个叠加分析的对象
    var overlayAnalysis = new Zondy.Service.OverlayByLayer({

        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口号
        srcInfo1: "gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/世界河流", //设置裁剪图层URL
        srcInfo2: "gdbp://MapGisLocal/OpenLayerVecterMap/sfcls/广西省级行政区n.WP", //设置被裁剪图层URL
        desInfo: resultlayername, //目的矢量图层URL。这里为前面定义的结果图层的全局变量，
        infoOptType: 2, //使用被叠加图层的图形参数信息，默认值为1，0，代表随机生成图形参数信息，1代表选择裁剪图层的图形参数信息作为结果图层的图形参数信息，2代表选择被裁剪图层的图形参数信息作为结果图层的图形参数信息。
        overType: 1, //叠加分析类型、默认值为1，取值范围：0为求并操作）,1为求交操作,2为求减（差）操作，3.为内裁（交）操作4.为外裁（差）操作5.为叠加操作6.为求对称差操作7.为判别操作，其他为求交操作
        isReCalculate: true, //是否重算面积，该属性继承于OverlayBase类
        radius: 0.05//容差半径
    });
    //调用基类的execute方法，执行路径分析，AnalasisSuccess为结果回调函数
    overlayAnalysis.execute(AnalasisSuccessmm);
}
function AnalasisSuccessmm(data) {
    if (data.results) {//判断是否返回结果
        if (data.results.length != 0) {//判断data.result是否为空，如果不为空，将结果加载在图层中
            //创建一个矢量图层，第一个参数为图层名称，第二个参数为叠加结果的地址，在前面定义的全局变量
            var resultLayer = new Zondy.Map.Layer("Cu Fe 叠加结果", [resultlayername], {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163", //矢量地图服务端口
                isBaseLayer: false//是否作为基础显示图层
            });
            //将叠加分析得到的图层添加到地图中
            map.addLayer(resultLayer);
        }
    }
    else {
        alert("叠加分析失败，请检查参数！！"); //弹窗显示
    }
}
function getTime() {

    var now = new Date(); //实例化一个日期型的对象
    var year = now.getFullYear(); //年
    var month = now.getMonth(); //月
    var day = now.getDate(); //日
    var hh = now.getHours(); //时
    var mm = now.getMinutes(); //分
    var ss = now.getSeconds(); //秒
    var clock = year + "-"; //clock="2016-"
    if (month < 10)
        clock += "0"; //clock="2016-0"
    clock += month + "-"; //clock="2016-07-"
    if (day < 10)
        clock += "0"//clock="2016-07-0"
    clock += day + "-"; //clock="2016-07-06-"
    if (hh < 10)
        clock += "0"; //clock="2016-07-06-0"
    clock += hh; //clock="2016-07-06-06"
    if (mm < 10)
        clock += "0"; //clock="2016-07-06-060"
    clock += mm; //clock="2016-07-06-0604"
    if (ss < 10)
        clock += "0"; //clock="2016-07-06-06040"
    clock += ss; //clock="2016-07-06-060405"
    //函数返回系统当前时间
    return (clock);
}
//定义一个函数，用于清除图层
function clearA() {
    //除底图以上的图层所以大于1，
    if (map.layers.length > 1) {
        for (var i = map.layers.length - 1; i > 0; i--) {

            map.removeLayer(map.layers[i], false); //移除图层，后面false是是否设置基础底图显示，默认为true
        }


    }
    else {

        return;
    }
}
function onSuccess(result) {
    if (result) {
        alert("操作成功！"); //弹窗显示
        map.baseLayer.redraw(true); //刷新地图，重新加载
    }
    else {

        alert("操作失败！"); //弹窗显示
    }
}
/**************************************坐标点添加************************************************/
function initzuobioadian() {
    destroymap();
    //创建地图容器
    map = new OpenLayers.Map('mapCon', { controls: //添加控件
             [new OpenLayers.Control.LayerSwitcher(), //图层控件
              new OpenLayers.Control.Navigation()]//鼠标的放大缩小地图
    });
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("ditu", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    //添加控件
    map.addControl(new OpenLayers.Control.MousePosition());
    //添加图层
    map.addLayer(layer);
    //创建图层
    PointLayer = new OpenLayers.Layer.Vector("点图层");
    //创建一个用于查询的点形状
    var PointGeom = new OpenLayers.Geometry.Point(5.23, 9.33);
    //实例化一个点要素，
    var PointFeature = new OpenLayers.Feature.Vector(PointGeom);
    PointLayer.addFeatures([PointFeature]); //将点要素添加到图层
    map.addLayer(PointLayer); //将画好的图层添加到地图容器中
    //初始化几何点对象
    map.setCenter(new OpenLayers.LonLat(0, 0), 2); //设置显示中心和显示级数
}
/**************************************坐标区绘制************************************************/
function initzuobiaoquhuizhi() {
    destroymap();
    //创建地图容器
    map = new OpenLayers.Map('mapCon', {
        controls: [//添加控件
                     new OpenLayers.Control.Zoom(),
                     new OpenLayers.Control.Navigation(), //鼠标的放大缩小地图
                     new OpenLayers.Control.LayerSwitcher(), //图层控件
                     new OpenLayers.Control.MousePosition()//此控件显示鼠标移动时，所在点的地理坐标
                ]
    });
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为瓦片图层的URL地址
    layer = new Zondy.Map.Layer("ditu", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    map.addLayer(layer);
    //设置地图初始显示级数和中心
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);

    /*直接输入坐标值，在客户端绘制区要素*/
    polygonLayer = new OpenLayers.Layer.Vector("polygonMarker");
    polygonLayer.styleMap.styles["default"].defaultStyle.strokeColor = "orange";  //设置默认样式策略中绘制要素的画笔颜色
    polygonLayer.styleMap.styles["default"].defaultStyle.strokeWidth = 1;  //设置画笔宽度
    polygonLayer.styleMap.styles["default"].defaultStyle.fillColor = "red";  //设置点要素的填充色
    //调用生成几何图形的快捷函数生成几何区
    var polygongeom = OpenLayers.Geometry.fromWKT("POLYGON(-25 8,-22 2,-7 -3,-11 5)");
    var polygonfeature = new OpenLayers.Feature.Vector(polygongeom);  //生成区要素
    polygonLayer.addFeatures([polygonfeature]); //将区要素添加到图层中
    map.addLayers([polygonLayer]); //将矢量层添加到地图容器中        
}
/**************************************坐标线绘制************************************************/
function initzuobiaoxianhuizhi() {
    destroymap();
    //创建地图容器
    map = new OpenLayers.Map('mapCon', { controls: //添加控件
             [new OpenLayers.Control.LayerSwitcher(), //图层控件
              new OpenLayers.Control.Navigation(), //鼠标的放大缩小地图
            new OpenLayers.Control.MousePosition()]//此控件显示鼠标移动时，所在点的地理坐标
    });
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为瓦片图层的URL地址
    layer = new Zondy.Map.Layer("ditu", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    //添加控件
    map.addControl(new OpenLayers.Control.MousePosition());
    //添加图层
    map.addLayer(layer);
    //设置显示中心和显示级数
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);

    //直接输入坐标值，在客户端绘制线要素
    lineLayer = new OpenLayers.Layer.Vector("线图层");
    lineLayer.styleMap.styles["default"].defaultStyle.strokeColor = "orange";  //设置默认样式策略中绘制要素的画笔颜色
    lineLayer.styleMap.styles["default"].defaultStyle.strokeWidth = 3;  //设置画笔宽度
    lineLayer.styleMap.styles["default"].defaultStyle.fillColor = "red";  //设置点要素的填充色
    //调用生成几何图形的快捷函数生成几何线
    var linegeom = OpenLayers.Geometry.fromWKT("LINESTRING(-25 8,-22 2,-7 -3)");
    var linefeature = new OpenLayers.Feature.Vector(linegeom); //生成线要素
    lineLayer.addFeatures([linefeature]); //向图层添加线要素
    map.addLayers([lineLayer]); //将矢量层添加到地图容器中    
}
/**************************************交互式点绘制************************************************/
function initMapjiaohushi() {

    //创建地图容器
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("图层", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/首都"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    }); //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    //将地图图层加载到地图中
    map.addLayer(layer);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
}
function initMapjiaohushi12() {

    //创建地图容器
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("图层", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/国界"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    }); //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher()); //图层切换控件
    //将地图图层加载到地图中
    map.addLayer(layer);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
}
function initDrawControl() {


    //创建一个矢量图层
    vecLayer = new OpenLayers.Layer.Vector("纸"); //和中地的图层不一样。
    //将地图图层加载到地图中
    map.addLayer(vecLayer);
    //变量不能用引号
    //创建画点控件并添加在地图容器中，
    drawControl = new OpenLayers.Control.DrawFeature(vecLayer, OpenLayers.Handler.Point);
    map.addControl(drawControl); //将绘制点控件添加到图层
}
//初始化绘图控件与图形编辑控件
function initDrawLayer() {
    //添加图层，用于显示画的线
    vecLayer = new OpenLayers.Layer.Vector("VectLayer");
    map.addLayer(vecLayer); //将图层添加到地图容器中
    //创建画线控件并添加在地图容器中
    drawControls = new OpenLayers.Control.DrawFeature(vecLayer, OpenLayers.Handler.Path), //绘制线

                map.addControl(drawControls); //将绘图控件添加到控件中
}
/**************************************交互式线绘制************************************************/
function StarDrawxian() {
    destroymap();
    initMapjiaohushi12();
    initDrawLayer();
    hideresultTable();
    
    if (vecLayer == null) {//判断画图的图层是否存在，若果存在激活控件，若不存在执行函数来添加画图图层
        initDrawLayer(); //调用函数，添加画图图层
    }
    //激活控件
    drawControls.activate();
}
function StarDraw() {
    destroymap();
    initMapjiaohushi();
    initDrawControl();
    hideresultTable();
    if (vecLayer == null) {//判断画图的图层是否存在，若果存在激活控件，若不存在执行函数来添加画图图层
        initDrawControl(); //调用函数，添加画图图层
    }
    //激活控件
    drawControl.activate();
}
/**************************************交互式区绘制************************************************/
function initMapjiaohushiquququ() {
    //创建地图容器
    map = new OpenLayers.Map('mapCon');
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Layer("图层", ["gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地"], {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //瓦片地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    //添加控件
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    //将地图图层加载到地图中
    map.addLayer(layer);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
}

function initDrawControlququ() {
    //创建一个矢量图层
    vecLayer = new OpenLayers.Layer.Vector("纸"); //和中地的图层不一样。
    map.addLayer(vecLayer); //将地图图层加载到地图中
    //变量不能用引号
    //画点。
    drawControl = new OpenLayers.Control.DrawFeature(vecLayer, OpenLayers.Handler.RegularPolygon);
    map.addControl(drawControl); //将绘制点控件添加到图层
}
function startzuobioaqu() {
    destroymap();
    initMapjiaohushiquququ();
    initDrawControlququ();
    
    hideresultTable();
    if (vecLayer == null) {//判断画图的图层是否存在，若果存在激活控件，若不存在执行函数来添加画图图层
        initDrawControlququ(); //调用函数，添加画图图层
    }
    //激活控件
    drawControl.activate();
    drawControl.handler.setOptions({ sides: 5 }); //绘制类型：五边形
}
/**************************************坐标点查询（JSON）************************************************/
function initzuobiaodianchaxun() {
    //创建地图容器
    map = new OpenLayers.Map("mapCon",
             { controls: //添加控件
             [new OpenLayers.Control.Zoom(),
                new OpenLayers.Control.LayerSwitcher(), //图层控件
                new OpenLayers.Control.Navigation(), //鼠标的放大缩小地图
                new OpenLayers.Control.MousePosition()//此控件显示鼠标移动时，所在点的地理坐标
             ]
             });
    //创建一个矢量图层，第一个参数为图层的名称，第二个参数为矢量图层的URL地址
    vectorlayerdoc = new Zondy.Map.Doc("名字", "wordJW",
             {

                 ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                 port: "6163", //瓦片地图服务端口
                 isBaseLayer: true//是否作为基础显示图层，默认为true
             });
    //创建图层，用于高亮显示
    drawLayer = new OpenLayers.Layer.Vector("resultLayer");
    map.addLayer(drawLayer); //添加图层
    map.addLayer(vectorlayerdoc); //添加图层
    //设置显示中心和显示级数
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
}
//实例化一个查询结构
function queryByBtn() {
    destroymap();
    initzuobiaodianchaxun();
    hideresultTable();
    var queryStruct = new Zondy.Service.QueryFeatureStruct({

        IncludeGeometry: true, //是否包含几何图形信息
        IncludeAttibute: true, //是否包含属性信息
        IncludeWebGraphic: true//是否包含图形参数信息
    });
    //实例化一个点
    var pointObj = new Zondy.Object.PointForQuery(-0.385, 30);
    //实例化一个查询对象
    var queryPayam = new Zondy.Service.QueryParameter({
        geometry: pointObj, //接受点类型对象的参数
        resultFormat: "json", //查询结果以JSON显示
        struct: queryStruct//查询结构
    });
    //实例化地图文档查询服务对象（要对谁进行查询）
    var queryService = new Zondy.Service.QueryDocFeature(queryPayam, "wordJW", 0, {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163" //矢量地图服务端口
    });


    //实现查询操作，querySucess回调函数，
    queryService.query(querySucessjieguo);
}
function querySucessjieguo(data) {

    var format = new Zondy.Format.PolygonJSON(); //实例化输出格式
    var features = format.read(data); //将查询结果以实例化的输出格式输出
    drawLayer.setVisibility(true); //高亮显示的图层显示出来
    drawLayer.addFeatures(features); //将显示的要素添加到高亮显示的图层里面。

}
/***************************************************多边形查询（JSON）高亮****************************************************/
function initjiaohuishiduobianxgl() {
    //创建地图容器，里面参数为div的id
    map = new OpenLayers.Map('mapCon', {
        //添加控件
        controls:
             [
            new OpenLayers.Control.LayerSwitcher(), //图层切换控件
            new OpenLayers.Control.Zoom(),
            new OpenLayers.Control.MousePosition(), //此控件显示鼠标移动时，所在点的地理坐标
        //此控件处理伴随鼠标事件的地图浏览
            new OpenLayers.Control.Navigation()
            ]
    });
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为地图文档的URL地址
    layer = new Zondy.Map.Doc("底图", "WorldMKT",
             {
                 ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                 port: "6163", //矢量地图服务端口
                 isBaseLayer: true//是否作为基础显示图层，默认为true
             });
    //创建绘图层
    geomLayer = new OpenLayers.Layer.Vector("geomLayer");
    //将地图文档图层、绘图层和闪烁图层加载到地图中
    map.addLayers([layer, geomLayer]);
    //设置地图显示的中心位置及级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
}
function startPloygonQuery() {
    destroymap();
    initjiaohuishiduobianxgl();
    cleraJson();
    showJSON();
    //初始化查询结构（查询的对象）
    var queryStruct = new Zondy.Service.QueryFeatureStruct();
    queryStruct.IncludeGeometry = true; //是否包含几何图形信息
    var pointObj = new Array(); //创建一个数组用于存放四边形的四个点的坐标
    pointObj[0] = new Zondy.Object.Point2D(11858949.66251, 3560221.84801);
    pointObj[1] = new Zondy.Object.Point2D(11232734.49882, 6299913.18918);
    pointObj[2] = new Zondy.Object.Point2D(7671135.75529, 5986505.60734);
    pointObj[3] = new Zondy.Object.Point2D(7005782.14386, 3873329.42986);
    var Polygon = new Zondy.Object.Polygon(pointObj); //初始化几何多边形对象
    //实例化一个查询对象，将需求进行打包
    var queryParam = new Zondy.Service.QueryParameter({

        geometry: Polygon, //几何要素多边形
        geometryType: "line", //查询类型为线，
        resultFormat: "json", //查询输出结果的格式为json
        struct: queryStruct//查询结构
    });
    queryParam.recordNumber = 1000; //设置查询要素数目
    //实例化地图文档查询服务对象（要对谁进行查询）
    var queryService = new Zondy.Service.QueryDocFeature(queryParam, "WorldMKT", 1, {//queryParam实例化的查询对象，1，为图层索引值
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163" //矢量地图服务端口
    }); //实现查询操作，onSucess回调函数
    queryService.query(ddx);

}
function ddx(data) {
    //6类似与缩进，格式字符串，缩进量，格式化后存放结果的标签id，
    var formatData = JSON.stringify(data); //将查询到的结果以JSON的形式输出
    Process(formatData, 1, "resultTable"); //输出格式，格式字符串，缩进量，格式化后存放结果的标签id，
    var format = new Zondy.Format.PolygonJSON(); //初始化转换工具
    var features = format.read(data); //执行对象格式转换，参数data为查询返回的结果，也可以是Zondy.Object.FeatureSet类型对象
    geomLayer.setVisibility(true); //高亮显示的图层显示出来
    geomLayer.addFeatures(features); //将显示的要素添加到高亮显示的图层里面。
}
/******************************************************交互式点击查询（JSON）高亮***********************************/
function initJSON() {
    //创建地图容器
    map = new OpenLayers.Map('mapCon', //创建一个地图容器
            {
            controls: //添加控件
                [new OpenLayers.Control.Navigation(), //缩放面板的工具控件
                 new OpenLayers.Control.LayerSwitcher(), //图层切换控件
            new OpenLayers.Control.Zoom(),
             new OpenLayers.Control.MousePosition()//此控件显示鼠标移动时，所在点的地理坐标
                ]
        });
    //创建一个图层
    layer = new Zondy.Map.Doc("mymap", "WorldMKT",
            {
                ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                port: "6163", //矢量地图服务端口
                isBaseLayer: true//是否作为基础显示图层，默认为true
            });

    //添加图层
    drawLayer = new OpenLayers.Layer.Vector("Layer");
    map.addLayer(layer);
    map.addLayer(drawLayer);
    //设置显示中心和显示级数
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
    initDraw11();
}
function initDraw11() {
    //创建高亮图层
    highltLayer = new OpenLayers.Layer.Vector("highlightlayer")
    map.addLayer(highltLayer)//添加高亮显示图层到地图容器中

    //创建画点控件并添加在地图容器中
    drawControl = new OpenLayers.Control.DrawFeature(drawLayer, OpenLayers.Handler.Point);
    //点击查询的回调函数
    drawControl.featureAdded = callBack11;
    map.addControl(drawControl); //将画图控件添加到地图容器中
}
function startQuery22() {
    destroymap();
    initJSON();
    //initDraw11();
    cleraJson();
    showJSON();
    if (drawControl) {//判断画图控件是否激活
        //激活画图控件
        drawControl.activate();
    }
}
function callBack11(feature) {
    if (highltLayer) {//判断高亮显示的图层是否存在
        map.removeLayer(highltLayer); //移除高亮显示的图层
        highltLayer = null;

    }
    if (highltLayer == null) {
        //创建高亮图层
        highltLayer = new OpenLayers.Layer.Vector("highlightlayer")
        map.addLayer(highltLayer)//将高亮显示的图层添加到地图容器中
    }

    //创建查询结构对象
    var queryStruct = new Zondy.Service.QueryFeatureStruct(
        {
            IncludeGeometry: true, //是否包含几何图形信息
            IncludeAttibute: true, //是否包含属性信息
            IncludeWebGraphic: true//是否包含图形参数信息  
        });
    //创建一个点形状
    var geoObject = new Zondy.Object.PointForQuery();
    geoObject.setByOL(feature.geometry); //将画的点要素转换为Zondy的点的要素
    feature.destroy(); //销毁图层
    //实例化查询参数
    var queryParam = new Zondy.Service.QueryParameter({

        geometry: geoObject, //接受点类型对象的参数
        resultFormat: "json", //查询结果以JSON显示
        struct: queryStruct//查询结构
    });
    //实例化查询服务
    var queryService = new Zondy.Service.QueryDocFeature(queryParam, "WorldMKT", 1, {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163" //矢量地图服务端口
    });
    queryService.query(onSuccessJSON);
}
function onSuccessJSON(data) {
    var formatData = JSON.stringify(data); //将查询到的结果以JSON的形式输出
    Process(formatData, 1, "resultTable"); //1类似与缩进，格式字符串，缩进量，格式化后存放结果的标签id，
    var format = new Zondy.Format.PolygonJSON(); //实例化输出格式
    var features = format.read(data); //将查询结果以实例化的输出格式输出
    highltLayer.setVisibility(true); //高亮显示的图层显示出来
    highltLayer.addFeatures(features)//将显示的要素添加到高亮显示的图层里面。

}
/**************************************************交互式多边形查询（JSON）高亮********************************/
function ddddd() {
    //创建地图容器
    map = new OpenLayers.Map('mapCon', {
        // 添加控件
        controls: [
                    new OpenLayers.Control.Navigation(), //缩放面板的工具控件
                    new OpenLayers.Control.MousePosition(), //此控件处理伴随鼠标事件的地图浏览
                    new OpenLayers.Control.LayerSwitcher(), //图层切换控件
                    new OpenLayers.Control.Zoom()
                ]
    });

    layer = new Zondy.Map.Doc("底图", "WorldMKT", {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163", //矢量地图服务端口
        isBaseLayer: true//是否作为基础显示图层，默认为true
    });
    //添加图层
    drawLayer = new OpenLayers.Layer.Vector("Layer");

    map.addLayer(drawLayer);
    map.addLayer(layer);
    //设置显示中心和级别
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
    initDrawddd(); //调用函数执行绘制
}
function initDrawddd() {
    // 添加一个绘制图层
    drawLayer = new OpenLayers.Layer.Vector("DrawLayer");
    //添加图层
    map.addLayer(drawLayer);
    //创建并添加控件 
    drawControl = new OpenLayers.Control.DrawFeature(drawLayer, OpenLayers.Handler.RegularPolygon); //创建画点控件并添加在地图容器中
    drawControl.featureAdded = callBackddd;
    map.addControl(drawControl);
}
function callBackddd(feature) {
    if (highltLayer) {//判断高亮显示图层是否存在
        map.removeLayer(highltLayer); //移除图层
        highltLayer = null;

    }
    if (highltLayer == null) {
        //创建高亮图层
        highltLayer = new OpenLayers.Layer.Vector("highlightlayer")
        //将图层添加到地图容器中
        map.addLayer(highltLayer)
    }
    // 创建查询结构
    var queryStruct = new Zondy.Service.QueryFeatureStruct(
                    {
                        // 要查询的信息
                        IncludeGeometry: true, //是否包含几何图形信息
                        IncludeAttribute: true, //是否包含属性信息
                        IncludeGraphic: true//是否包含图形参数信息
                    }
            );
    var polygonObj = new Zondy.Object.Polygon(); //创建一个点形状
    polygonObj.setByOL(feature.geometry); //将画的点要素转换为Zondy的点的要素

    //在点击下一个点时清除之前的点
    feature.destroy();
    //创建查询参数
    var queryParm = new Zondy.Service.QueryParameter(
                    {
                        geometry: polygonObj, //接受点类型对象的参数
                        resultFormat: "json", //查询结果以JSON显示
                        struct: queryStruct//查询结构
                    });
    //实例化地图文档查询服务对象
    var queryService = new Zondy.Service.QueryDocFeature(queryParm, "WorldMKT", 1, {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163" //矢量地图服务端口
    });

    //执行查询操作，onSuccess为查询回调函数

    queryService.query(onSuccessjiaohushiduobianxgl);

}
function startQueryddd() {
    destroymap();
    ddddd();
    cleraJson();
    //initDrawddd();
    showJSON();
    if (drawControl) {
        //激活绘图控件
        drawControl.activate();
        drawControl.handler.setOptions({ sides: 4 }); //绘制类型：四边形
    }

}
function onSuccessjiaohushiduobianxgl(data) {
    var formatData = JSON.stringify(data); //将查询到的结果以JSON的形式输出
    Process(formatData, 1, "resultTable"); //1类似与缩进，格式字符串，缩进量，格式化后存放结果的标签id，
    var format = new Zondy.Format.PolygonJSON(); //实例化输出格式
    var features = format.read(data); //将查询结果以实例化的输出格式输出
    highltLayer.setVisibility(true); //高亮显示的图层显示出来
    highltLayer.addFeatures(features)//将显示的要素添加到高亮显示的图层里面。
}

/**********************************属性查询**************************************************/
function initshuxingchaxun() {
    map = new OpenLayers.Map('mapCon', {
        controls: [
                new OpenLayers.Control.Navigation(), //此控件处理伴随鼠标事件的地图浏览
                new OpenLayers.Control.LayerSwitcher(), //图层切换控件
                new OpenLayers.Control.Zoom(),
                new OpenLayers.Control.MousePosition()]//此控件显示鼠标移动时，所在点的地理坐标
    });
    //创建一个矢量图层，第一个参数为图层名称，第二个参数为矢量图层的URL地址
    layer = new Zondy.Map.Doc("底图", "WorldMKT",
             {
                 ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
                 port: "6163", //矢量地图服务端口
                 isBaseLayer: true//是否作为基础显示图层，默认为true
             });
    //创建图层，用于高亮显示
    geomLayer = new OpenLayers.Layer.Vector("geomLayer");
    //将地图图层加载到地图中
    map.addLayers([layer, geomLayer]);
    //设置显示中心和显示级数
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);

}
function startQueryshuxing() {
    destroymap();
    cleraJson();
    initshuxingchaxun();
    showJSON();
    //初始化查询结构对象，设置查询结构包含几何信息
    var queryStruct = new Zondy.Service.QueryFeatureStruct()
    queryStruct.IncludeGeometry = true; //是否包含包含几何信息
    //实例化查询参数对象
    var queryParam = new Zondy.Service.QueryParameter({
        resultFormat: "json", //查询结果的输出格式
        struct: queryStruct//查询结构

    });
    //设置查询要素数目
    queryParam.recordNumber = 1000;
    //设置属性条件
    queryParam.where = "name='中国'";
    //实例化底图文档查询服务对象
    var queryService = new Zondy.Service.QueryDocFeature(queryParam, "WorldMKT", 1, {
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163" //矢量地图服务端口
    });
    queryService.query(shuxing);
}
function shuxing(data) {
    var formatData = JSON.stringify(data); //将查询到的结果以JSON的形式输出
    Process(formatData, 1, "resultTable"); //1类似与缩进，格式字符串，缩进量，格式化后存放结果的标签id，
    var format = new Zondy.Format.PolygonJSON(); //实例化输出格式
    var features = format.read(data); //将查询结果以实例化的输出格式输出
    geomLayer.setVisibility(true); //高亮显示的图层显示出来
    geomLayer.addFeatures(features)//将显示的要素添加到高亮显示的图层里面。
}
/**********************************************OID查询******************************************/
function OIDinit() {

    map = new OpenLayers.Map('mapCon', {

        controls:
             [
            new OpenLayers.Control.LayerSwitcher(),
            new OpenLayers.Control.Zoom(),
            new OpenLayers.Control.MousePosition(),

            new OpenLayers.Control.Navigation()
            ]
    });
    layer = new Zondy.Map.Doc("底图", "WorldMKT",
             {
                 ip: "127.0.0.1",
                 port: "6163",
                 isBaseLayer: true
             });
    //添加高亮显示的图层
    geomLayer = new OpenLayers.Layer.Vector("geomLayer");
    map.addLayers([layer, geomLayer]);
    map.setCenter(new OpenLayers.LonLat(0, 0), 2); //设置显示中心
}
function startQueryOid() {
    destroymap();
    cleraJson();
    OIDinit();
    showJSON();
    //实例化一个查询结构
    var queryStruct = new Zondy.Service.QueryFeatureStruct()
    queryStruct.IncludeGeometry = true; //是否包含几何信息
    var objectOid = "1,6,12,15,23"//设置查询的OID
    //实例化查询的参数
    var queryParam = new Zondy.Service.QueryParameter({
        objectIds: objectOid,
        resultFormat: "json",
        struct: queryStruct
    });
    //设置查询数目
    queryParam.recordNumber = 1000;
    //实例化底图文档查询服务对象
    var queryService = new Zondy.Service.QueryDocFeature(queryParam, "WorldMKT", 1, {
        ip: "127.0.0.1",
        port: "6163"
    });
    //执行查询操作，
    queryService.query(onSuccessOID);
}
function onSuccessOID(data) {
    var formatData = JSON.stringify(data);
    Process(formatData, 1, "resultTable");
    var format = new Zondy.Format.PolygonJSON();
    var features = format.read(data);
    geomLayer.setVisibility(true); //高亮显示的图层显示出来
    geomLayer.addFeatures(features)//将显示的要素添加到高亮显示的图层里面。
}
/************************************************************坐标点查询（返回JSON）*******************************/
function querybypointJSONdd() {
    destroymap();
    cleraJson();
    showJSON();
    //初始化查询结构（查询的对象）结构
    var querystruct = new Zondy.Service.QueryFeatureStruct(
        { includeGeomery: false, //是否包含几何图形信息
            includeAttibute: true, //是否包含属性信息
            includeWebGraphic: false//是否包含图形参数信息

        })//创建一个用于查询的点形状（查询用的工具）参数
    var pointobj = new Zondy.Object.PointForQuery(300, 1200);
    //实例化一个查询对象，将需求进行打包
    var query = new Zondy.Service.QueryParameter({

        geometry: pointobj, //用什么工具查询
        resultFormat: "json", //查询输出结果的格式为json
        struct: querystruct//查询结构
    }); //实例化地图文档查询服务对象（要对谁进行查询）
    var queryService = new Zondy.Service.QueryDocFeature(
    query, "CHINA", 1, {//query实例化的查询对象，1，为图层索引值
        ip: "127.0.0.1", //绘制图形服务器唯一标识为ip
        port: "6163" //矢量地图服务端口
    }
    ); //实现查询操作，querySucess回调函数，
    queryService.query(querySucessdianJSON);
}
function querySucessdianJSON(result) {
    var FormatDate = JSON.stringify(result); //将查询到的结果以JSON的形式输出
    //6类似与缩进，格式字符串，缩进量，格式化后存放结果的标签id，
    Process(FormatDate, 1, "resultTable")

}
/*************************************************resultTable隐藏***************************/
function hideresultTable() {
    var s = document.getElementById('resultTable');
    s.style.display = "none";

    /*****************************************************resultTable显示******************************/
}
/************************************清空resultTable***************************/
function cleraJson() {

    var j = document.getElementById('resultTable');
    j.innerHTML = null;

}
function showJSON() {

    var s = document.getElementById('resultTable');
    s.style.display = "";
}
function destroymap() {
    map.destroy();

}
function removeMap() {
    if (vecLayer) {//判断画图图层是否存在，若存在，则移除图层
        map.removeLayer(vecLayer); //移除图层
    }
    vecLayer = null; //画图图层为空
    drawControls.deactivate(); //注销查询控件
}
