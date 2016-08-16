# sunlightjieouba.github.io
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="UTF-8">
    <title>功能演示</title>
    <style type="text/css">
        *
        {
            margin: 0 0 0 5;
            padding: 0;
        }
        body
        {
            font-size: 15px;
            font-family: "宋体" , "微软雅黑";
        }
        ul, li
        {
            list-style: none;
        }
        a:link, a:visited
        {
            text-decoration: none;
        }
        .list
        {
            width: 210px;
            border-bottom: solid 1px #316a91;
            margin: 40px auto 0 auto;
            height: 253px;
        }
        .list ul li
        {
            background-color: #467ca2;
            border: solid 1px #316a91;
            border-bottom: 0;
        }
        .list ul li a
        {
            padding-left: 10px;
            color: #fff;
            font-size: 12px;
            display: block;
            font-weight: bold;
            height: 36px;
            line-height: 36px;
            position: relative;
        }
        .list ul li .inactive
        {
            background: url(images/off.png) no-repeat 184px center;
            top: 0px;
            left: 0px;
        }
        .list ul li .inactives
        {
            background: url(images/on.png) no-repeat 184px center;
        }
        .list ul li ul
        {
            display: none;
        }
        .list ul li ul li
        {
            border-left: 0;
            border-right: 0;
            background-color: #6196bb;
            border-color: #467ca2;
        }
        .list ul li ul li ul
        {
            display: none;
        }
        .list ul li ul li a
        {
            padding-left: 20px;
        }
        .list ul li ul li ul li
        {
            background-color: #d6e6f1;
            border-color: #6196bb;
        }
        .last
        {
            background-color: #d6e6f1;
            border-color: #6196bb;
        }
        .list ul li ul li ul li a
        {
            color: #316a91;
            padding-left: 30px;
        }
        #ttop
        {
            height: 180px;
            width: 100%;
            background-image: url('images/北京.png');
        }
        #mp
        {
            height: 100%;
            width: 345px;
            float: left;
            left: 100px;
            border: blue;
        }
        
        #mapCon
        {
            height: 890px;
            width: 1240px;
            float: left;
            left: 9px;
            position: relative;
            top: 0px;
            background-color: #e0e5eb;
        }
        #dd
        {
            float: left;
            position: relative;
            background-color: #e0e5eb;
            top: -776px;
            left: 1442px;
            height: 40px;
            width: 141px;
            border-radius: 15px;
        }
        #zoom
        {
            float: left;
            top: 170px;
            height: 900px;
            width: 100%;
            background: url('pictures/true-5.jpeg');
            position: relative;
        }
        #resultTable
        {
            height: 920px;
            width: 490px;
            float: left;
            background-color: Gray;
            position: relative;
            top: 0px;
            left: 24px;
            opacity: 0.9;
            overflow: scroll;
        }
        #Button1
        {
            width: 122px;
            height: 43px;
        }
    </style>
    <script src="libs/jquery-1.11.2.min.js" type="text/javascript"></script>
    <script src="libs/OpenLayers.js" type="text/javascript"></script>
    <script src="libs/zdclient.js" type="text/javascript"></script>
    <script src="libs/json2.js" type="text/javascript"></script>
    <script src="libs/jsonExtend.js" type="text/javascript"></script>
    <script src="function.js" type="text/javascript"></script>
    <script type="text/javascript">
        var map;
        function name() {

            hideresultTable();
            //初始化地图容器
            map = new OpenLayers.Map({
                div: "mapCon",
                layers: [
                            new Zondy.Map.GoogleLayer("Google矢量数据", {
                                //谷歌地图类型
                                layerType: Zondy.Enum.GoogleLayerType.VEC,
                                //将该图层作为基础底图
                                isBaseLayer: true
                            }),
                            new Zondy.Map.GoogleLayer("Google影像数据", {
                                //谷歌地图类型
                                layerType: Zondy.Enum.GoogleLayerType.RASTER,
                                //将该图层作为基础底图
                                isBaseLayer: true
                            }),
                            new Zondy.Map.GoogleLayer("Google道路数据", {
                                //谷歌地图类型
                                layerType: Zondy.Enum.GoogleLayerType.ROAD,
                                //将该图层作为叠加图层
                                isBaseLayer: false
                            }),
                            new Zondy.Map.GoogleLayer("Google地形数据", {
                                //谷歌地图类型
                                layerType: Zondy.Enum.GoogleLayerType.TERRAIN,
                                //将该图层作为基础底图
                                isBaseLayer: true
                            })
                        ],
                controls: [
                //缩放导航控件
                            new OpenLayers.Control.Zoom(),
                //图层切换控件
                            new OpenLayers.Control.LayerSwitcher(),
                //地图浏览导航控件
                            new OpenLayers.Control.Navigation(),
                //鼠标位置控件
                            new OpenLayers.Control.MousePosition()
                        ]
            });
            //设置地图的初始化显示中心和级别
            map.setCenter(new OpenLayers.LonLat(0, 0), 3);
        }
        function hideresultTable() {
            var s = document.getElementById('resultTable');
            s.style.display = "none";

            
        }
        $(document).ready(function () {
            $('.inactive').click(function () {
                if ($(this).siblings('ul').css('display') == 'none') {
                    $(this).parent('li').siblings('li').removeClass('inactives');
                    $(this).addClass('inactives');
                    $(this).siblings('ul').slideDown(100).children('li');
                    if ($(this).parents('li').siblings('li').children('ul').css('display') == 'block') {
                        $(this).parents('li').siblings('li').children('ul').parent('li').children('a').removeClass('inactives');
                        $(this).parents('li').siblings('li').children('ul').slideUp(100);

                    }
                } else {
                    //控制自身变成+号
                    $(this).removeClass('inactives');
                    //控制自身菜单下子菜单隐藏
                    $(this).siblings('ul').slideUp(100);
                    //控制自身子菜单变成+号
                    $(this).siblings('ul').children('li').children('ul').parent('li').children('a').addClass('inactives');
                    //控制自身菜单下子菜单隐藏
                    $(this).siblings('ul').children('li').children('ul').slideUp(100);

                    //控制同级菜单只保持一个是展开的（-号显示）
                    $(this).siblings('ul').children('li').children('a').removeClass('inactives');
                }
            })
        });

    </script>
</head>
<body onload="name()">
    <div id="zoom">
        <div id="mp">
            <div class="list">
                <ul class="yiji">
                    <li><a href="#">功能</a></li>
                    <li><a href="#" class="inactive">地图显示</a>
                        <ul style="display: none">
                            <li><a onclick="initwp()">瓦片地图</a></li>
                            <li><a onclick="initdoc()">矢量地图文档</a></li>
                            <li><a onclick="initlayer()">矢量图层</a></li>

                        </ul>
                    </li>
                    <li><a href="#" class="inactive">图层要素编辑</a>
                        <ul style="display: none">
                            <li><a onclick="addPoint()">点要素添加</a></li>
                            <li><a onclick="deletePoint()">点要素删除</a></li>
                            <li><a onclick="updatePoint()">点要素更新</a></li>
                            <li><a onclick="addline()">线要素添加</a></li>
                            <li><a onclick="line()">线要素更新</a></li>
                            <li><a onclick="deletsline()">线要素删除</a></li>
                            <li><a onclick="addRegion()">区要素添加</a></li>
                            <li><a onclick="gengxinRegion()">区要素更新</a></li>
                            <li><a onclick="delequ()">区要素删除</a></li>
                        </ul>
                    </li>
                    <li><a href="#" class="inactive active">空间分析</a>
                        <ul style="display: none">
                            <li><a onclick="classBuffByMultiplyRing()">类单圈缓冲区分析</a></li>
                            <li><a onclick="classBuffByMultiplyRing1()">类多圈缓冲区分析</a></li>
                            <li><a onclick="singleBuffAnalysis()">要素单圈缓冲区分析</a></li>
                            <li><a onclick="singleBuffAnalysis1()">要素多圈缓冲区分析</a></li>
                            <li><a onclick="clipAnalysisByPlagon()">多边形裁剪分析</a></li>
                            <li><a onclick="clipByLayerAnalysis11()">图层裁剪分析</a></li>
                            <li><a ondblclick="OverlayByLayer()">图层叠加分析</a></li>
                        </ul>
                    </li>
                    <li><a href="#" class="inactive active">矢量图层查询</a>
                        <ul style="display: none">
                            <li><a onclick="querybypointJSONdd()">点查询（返回JSON）</a></li>
                            <li><a onclick="queryByBtn()">点查询高亮</a></li>
                            <li><a onclick="startPloygonQuery()">多边形查询高亮（返回JSON）</a></li>
                            <li><a onclick="startQueryshuxing()">属性查询</a></li>
                            <li><a onclick="startQueryOid()">OID查询高亮</a></li>
                        </ul>
                    </li>
                    <li><a href="#" class="inactive active">交互式矢量图层查询</a>
                        <ul style="display: none">
                            <li><a onclick="startQuery22()">点查询（返回JSON）高亮</a></li>
                            <li><a onclick="startQueryddd()">多边形查询（返回JSON）高亮</a></li>
                        </ul>
                    </li>
                    <li><a href="#" class="inactive active">图形绘制</a>
                        <ul style="display: none">
                            <li><a onclick="initzuobioadian()">坐标点绘制</a></li>
                            <li><a onclick="initzuobiaoquhuizhi()">坐标区绘制</a></li>
                            <li><a onclick="initzuobiaoxianhuizhi()">坐标线绘制</a></li>
                            <li><a onclick="StarDrawxian()">交互式线绘制</a></li>
                            <li><a onclick="startzuobioaqu()">交互式多边形绘制</a></li>
                            <li><a onclick="StarDraw()">交互式点绘制</a></li>
                        </ul>
                </ul>
                </li> </li> </ul>
            </div>
        </div>
        <div id="mapCon">
        请输入要点删除的要素ID：<select id="featureID" onchange="onSelect()"></select>
        <input type="button" class="ButtonLib" value="删除点要素" onclick="deletePoint()" />
        请输入要线删除的要素ID：<select id="Select1" onchange="onSelect1()"></select>
        <input type="button" class="ButtonLib" value="删除线要素" onclick="deletsline()" />
        请输入要区删除的要素ID：<select id="Select2" onchange="onSelect2()"></select>
        <input type="button" class="ButtonLib" value="删除区要素" onclick="delequ()" />   
        </div>
        <div id="resultTable">
        </div>
    </div>
    <div id="ttop">
        <input type="button" id="dd" value="清除绘制" onclick="removeMap()" title="用于清除图形绘制中绘制的点要素、线要素、及区要素"/>
    </div>
    
</body>
</html>
