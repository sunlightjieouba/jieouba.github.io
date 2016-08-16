/*!
* MapGIS JavaScript Library v1.6.1
* http://www.smaryun.com/
*
* Copyright (c) 2016 Zondy
*
* Date: 2016-04-18 09:00:16 -0600 (Wes, 18 Apral 2016)
* Revision: 6000
*/

/*---------------------------------------------------------GlobalDefine.js---------------------------------------------------------*/
//#region 图层自动配置模块
/// 自动配置是否完成
OpenLayers.Map.prototype.isSucceedAutoConfig = false;

/// 基础图层自动配置是否完成
OpenLayers.Map.prototype.isAutoConfigSucceedBaseLayer = false;
///是否为自动配置地图参数
OpenLayers.Map.prototype.isAutoConfig = true;
///配置成功时的回调方法
OpenLayers.Map.prototype.autoConfigSucceedCallback = null;

OpenLayers.Map.prototype.isValidLonLat = function (lonlat) {

    var valid = false;
    if (lonlat != null) {
        var maxExtent = this.getMaxExtent();
        var worldBounds = this.baseLayer.wrapDateLine && maxExtent;
        valid = maxExtent.containsLonLat(lonlat, { worldBounds: worldBounds });
    }
    return valid;
};

///根据基图层来设置范围等 只有是基图层才能设置
OpenLayers.Map.prototype.setConfigByLayer = function (layer, complete, error) {
    var url, callback, info;
    var map = this;
    if (layer instanceof Zondy.Map.Doc) {
        //===============================增加了判断是否是动态裁图modify by zl 2016/01/22=====================================================
        if (layer.cache) {
            url = "http://" + layer.ip + ":" + layer.port + "/igs/rest/mrcs/tiles/" + layer.docName + "?f=json&v=2.0";
        } else {
            url = "http://" + layer.ip + ":" + layer.port + "/igs/rest/mrcs/docs/" + layer.docName + "/0?f=json&include={includeDetails:true,includeSubs:true}";
        }
        callback = function (json) {
            if (json) {
                if (layer.cache) {
                    map.maxExtent = new OpenLayers.Bounds(json.XMin, json.YMin, json.XMax, json.YMax);
                    layer.fullExtent = map.maxExtent;
                    var lod = json.LODs;

                    if (json.OriginX) {
                        layer.tileOrigin = new OpenLayers.LonLat(json.OriginX, json.OriginY);
                    } else {
                        layer.tileOrigin = new OpenLayers.LonLat(json.XMin, json.YMax);
                    }


                    map.numZoomLevels = lod.length;
                    var ress = [];
                    var beginLevel = 0;
                    if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                        beginLevel = layer.zoomOffset;
                    }
                    var newLod = [];
                    for (var i = beginLevel; i < lod.length; i++) {
                        ress.push(lod[i].Resolution);
                        newLod[i - beginLevel] = new Object();
                        newLod[i - beginLevel] = lod[i];
                    }
                    layer.lod = newLod;
                    layer.beginZoomLevel = beginLevel;
                    map.maxResolution = ress[0];
                    layer.cacheWidth = json.Width;
                    layer.cacheHeight = json.Height;
                    layer.tileSize = new OpenLayers.Size(json.Width, json.Height);
                    map.resolutions = ress;
                    map.numZoomLevels = ress.length;

                } else {
                    var range = json.range;
                    map.maxExtent = new OpenLayers.Bounds(range.split(',')[0], range.split(',')[1], range.split(',')[2], range.split(',')[3]);
                    var xDelta = map.maxExtent.right - map.maxExtent.left;
                    var yDelta = map.maxExtent.top - map.maxExtent.bottom;
                    if (map.resolutions) {
                        map.maxResolution = map.resolutions[0];
                    } else {
                        if (map.maxResolution == null || map.maxResolution == "auto") {
                            map.maxResolution = (xDelta < yDelta ? yDelta : xDelta) / 256;
                        }
                        var beginLevel = 0;
                        if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                            beginLevel = layer.zoomOffset;
                        }
                        map.maxResolution = map.maxResolution / Math.pow(2, beginLevel);
                    }
                }
            }
            complete && complete();
        };
        layer.ajax(url, null, callback, "GET", null, "json", error, { async: false });
    } else if (layer instanceof Zondy.Map.TileLayer) {
        url = "http://" + layer.ip + ":" + layer.port + "/igs/rest/mrcs/tiles/" + layer.hdfName + "?f=json&v=2.0";
        callback = function (json) {
            if (json) {
                if (json.TileInfo1) {
                    //=================================修改了获取老版瓦片时的信息设置 modify by zl 2016/1/22=============================
                    info = json.TileInfo1;
                    map.maxExtent = new OpenLayers.Bounds(info.XMin, info.YMin, info.XMax, info.YMax);
                    layer.fullExtent = map.maxExtent;
                    var xDelta = info.XMax - info.XMin;
                    var yDelta = info.YMax - info.YMin;
                    //图片的大小，如256，512之类的
                    map.maxResolution = (xDelta > yDelta ? xDelta : yDelta) / info.ImageWidth;
                    if (info.EndLevel > 0 && info.BeginLevel >= 0) {
                        map.numZoomLevels = info.EndLevel - info.BeginLevel;
                        var beginLevel = info.BeginLevel;
                        if (layer.zoomOffset != undefined && parseInt(layer.zoomOffset) >= 0) {
                            beginLevel = beginLevel + parseInt(layer.zoomOffset);
                        }
                        var lod = [];
                        var ress = [];
                        for (var i = beginLevel; i <= info.EndLevel; i++) {
                            lod[i - beginLevel] = new Object();
                            ress.push(map.maxResolution / Math.pow(2, i));
                            var maxRowCol = Math.pow(2, i) - 1;
                            lod[i - beginLevel].startCol = 0;
                            lod[i - beginLevel].endCol = maxRowCol;
                            lod[i - beginLevel].startRow = 0;
                            lod[i - beginLevel].endRow = maxRowCol;
                        }
                        layer.beginZoomLevel = beginLevel;
                        map.maxResolution = map.maxResolution / Math.pow(2, beginLevel);
                        layer.lod = lod;
                        layer.tileSize = new OpenLayers.Size(info.ImageWidth, info.ImageWidth);
                        layer.tileVersion = 'oldTile';
                        layer.tileOrigin = new OpenLayers.LonLat(info.XMin, info.YMin);
                        map.numZoomLevels = ress.length;
                        map.resolutions = ress;
                    }
                } else if (json.TileInfo2) {
                    info = json.TileInfo2;
                    var range = info.fullExtent;
                    var origin = info.tileInfo.origin;
                    var lod = info.tileInfo.lods;
                    map.maxResolution = lod[0].resolution;
                    map.numZoomLevels = lod.length;
                    if (origin) {
                        layer.tileOrigin = new OpenLayers.LonLat(origin.x, origin.y);
                    } else {
                        layer.tileOrigin = new OpenLayers.LonLat(range.xmin, range.ymax);
                    }
                    map.maxExtent = new OpenLayers.Bounds(range.xmin, range.ymin, range.xmax, range.ymax);
                    var SMALL_DATA = 10e-5;
                    var SMAX_DXYLOGIC = 1e-10;
                    var tileStart = function (distance, dxyTileLogic) {
                        if (Math.abs(dxyTileLogic) < SMAX_DXYLOGIC) {
                            return 0;
                        }
                        if ((Math.ceil(distance / dxyTileLogic) - distance / dxyTileLogic) <= SMALL_DATA) {
                            return parseInt(Math.ceil(distance / dxyTileLogic));
                        }
                        else {
                            return parseInt(Math.floor(distance / dxyTileLogic));
                        }
                    };
                    var tileEnd = function (distance, dxyTileLogic) {
                        if (Math.abs(dxyTileLogic) < SMAX_DXYLOGIC) {
                            return 0;
                        }
                        if ((distance / dxyTileLogic - Math.floor(distance / dxyTileLogic)) <= SMALL_DATA) {
                            return parseInt(Math.floor(distance / dxyTileLogic)) - 1;
                        }
                        else {
                            return parseInt(Math.ceil(distance / dxyTileLogic)) - 1;
                        }
                    };
                    //判断获取第几级开始有图
                    var beginLevel = 0;
                    for (var j = beginLevel; j < lod.length; j++) {
                        var currentLod = lod[j];
                        if (currentLod.scale != 0) {
                            beginLevel = j;
                            break;
                        }
                    }
                    var ress = [];
                    if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                        beginLevel = beginLevel + layer.zoomOffset;
                    }
                    var newLod = [];
                    for (var i = beginLevel; i < lod.length; i++) {
                        var currentRect = lod[i].tileLogicRect;
                        ress.push(lod[i].resolution);
                        newLod[i - beginLevel] = new Object();
                        newLod[i - beginLevel].startCol = tileStart((currentRect.xmin - origin.x), lod[i].dxTileLogic);
                        newLod[i - beginLevel].endCol = tileEnd((currentRect.xmax - origin.x), lod[i].dxTileLogic);
                        newLod[i - beginLevel].startRow = tileStart((origin.y - currentRect.ymax), lod[i].dyTileLogic);
                        newLod[i - beginLevel].endRow = tileEnd((origin.y - currentRect.ymin), lod[i].dyTileLogic);
                    }

                    layer.beginZoomLevel = beginLevel;
                    //新瓦片的原点都是左上角
                    layer.tileVersion = 'newTile';
                    layer.lod = newLod;
                    layer.tileSize = new OpenLayers.Size(info.tileInfo.rows, info.tileInfo.cols);
                    map.numZoomLevels = ress.length;
                    map.maxResolution = ress[0];
                    map.resolutions = ress;
                } else {
                    info = json;
                    map.maxExtent = new OpenLayers.Bounds(info.XMin, info.YMin, info.XMax, info.YMax);
                    layer.fullExtent = map.maxExtent;

                    var lod = info.LODs;

                    if (lod.length > 1)
                        map.numZoomLevels = lod.length - 1;
                    var resolutions = [];
                    var beginLevel = 0;
                    if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                        beginLevel = layer.zoomOffset;
                    }
                    var newLod = [];
                    for (var i = beginLevel; i < lod.length; i++) {
                        resolutions.push(lod[i].Resolution);
                        newLod[i - beginLevel] = new Object();
                        newLod[i - beginLevel] = lod[i];
                    }
                    layer.beginZoomLevel = beginLevel;
                    layer.tileOrigin = new OpenLayers.LonLat(info.OriginX, info.OriginY);
                    map.resolutions = resolutions;
                    layer.lod = newLod;
                    map.maxResolution = resolutions[0];
                    layer.tileSize = new OpenLayers.Size(info.Width, info.Height);
                    layer.cache = true;
                }
                complete && complete();
            } else {
                alert("无法获取瓦片信息，请使用手动配置 ！");
            }
        };
        layer.ajax(url, null, callback, "GET", null, "json", error, { async: false });
    } else if (layer instanceof Zondy.Map.Layer) {
        url = "http://" + layer.ip + ":" + layer.port + "/igs/rest/mrcs/layerinfo?gdbpUrl=" + layer.gdbps[0];
        callback = function (json) {
            if (json && json.Range) {
                var r = json.Range;
                map.maxExtent = new OpenLayers.Bounds(r.xmin, r.ymin, r.xmax, r.ymax);
                var xDelta = map.maxExtent.right - map.maxExtent.left;
                var yDelta = map.maxExtent.top - map.maxExtent.bottom;
                if (map.maxResolution == null) {
                    map.maxResolution = (xDelta < yDelta ? yDelta : xDelta) / 256;
                }
                var beginLevel = 0;
                if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                    beginLevel = layer.zoomOffset;
                }
                map.maxResolution = map.maxResolution / Math.pow(2, beginLevel);
            }
            complete && complete();
        };
        layer.ajax(url, null, callback, "GET", null, "json", error, { async: false });
    }
};

//==================================增加添加不是基础图层时获取信息的方法 modify by zl 2016/1/22=======================================

OpenLayers.Map.prototype.setOverLayerConfig = function (layer, complete, error) {
    var url, callback, info;
    var map = this;
    if (layer instanceof Zondy.Map.Doc) {
        //判断是否是动态裁图
        if (layer.cache) {
            url = "http://" + layer.ip + ":" + layer.port + "/igs/rest/mrcs/tiles/" + layer.docName + "?f=json&v=2.0";
            callback = function (json) {
                if (json) {
                    if (layer.cache) {
                        layer.fullExtent = new OpenLayers.Bounds(json.XMin, json.YMin, json.XMax, json.YMax);
                        var lod = json.LODs;
                        layer.layerNumZoomLevels = lod.length;
                        if (json.OriginX) {
                            layer.tileOrigin = new OpenLayers.LonLat(json.OriginX, json.OriginY);
                        } else {
                            layer.tileOrigin = new OpenLayers.LonLat(json.XMin, json.YMax);
                        }

                        var ress = [];
                        var beginLevel = 0;
                        if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                            beginLevel = layer.zoomOffset;
                        }
                        var newLod = [];
                        for (var i = beginLevel; i < lod.length; i++) {
                            ress.push(lod[i].Resolution);
                            newLod[i - beginLevel] = new Object();
                            newLod[i - beginLevel] = lod[i];
                        }
                        layer.lod = newLod;
                        layer.cacheWidth = json.Width;
                        layer.cacheHeight = json.Height;
                        layer.tileSize = new OpenLayers.Size(json.Width, json.Height);
                        layer.layerMaxResolution = newLod[0].Resolution;
                        layer.beginZoomLevel = beginLevel;
                        //map.numZoomLevels = ress.length;
                        //===============修改如果底图是矢量地图，当前添加的是瓦片地图，则以瓦片图为标准设置map容器======
                        if ((map.baseLayer instanceof Zondy.Map.Doc && map.baseLayer.cache == false) || map.baseLayer instanceof Zondy.Map.Layer) {
                            //==================================重新构建resolutions=========
                            var newress = [];
                            var newResolutions = map.baseLayer.resolutions;
                            var closetLevel = map.getZoomForResolution(ress[0], true);
                            layer.beginLevel = closetLevel;
                            var newNumberLevels = closetLevel + ress.length;
                            if (map.numZoomLevels < newNumberLevels) {
                                newNumberLevels = map.numZoomLevels;
                            }
                            for (var j = 0; j < newNumberLevels; j++) {
                                if (j >= closetLevel) {
                                    newress.push(ress[j - closetLevel]);
                                } else {
                                    newress.push(newResolutions[j]);
                                }
                            }
                            ress = newress;
                            //==============================================================
                            map.maxExtent = new OpenLayers.Bounds(json.XMin, json.YMin, json.XMax, json.YMax);
                            map.numZoomLevels = ress.length;
                            map.resolutions = ress;
                            map.baseLayer.resolutions = ress;
                            map.baseLayer.maxResolution = ress[0];
                            map.baseLayer.numZoomLevels = ress.length;
                            //===判断当前是否有PanZoomBar控件，如果有就刷新
                            var panCtrls = map.getControlsByClass("OpenLayers.Control.PanZoomBar");
                            if (panCtrls != null && panCtrls.length > 0) {
                                for (var j = 0; j < panCtrls.length; j++) {
                                    if (panCtrls[j]) {
                                        panCtrls[j].redraw();
                                    }
                                }
                            }
                        }
                        //==============================================================================================

                    }
                }
                complete && complete();
            };
            layer.ajax(url, null, callback, "GET", null, "json", error, { async: false });
        } else {
            complete && complete();
        }
    } else if (layer instanceof Zondy.Map.TileLayer) {
        url = "http://" + layer.ip + ":" + layer.port + "/igs/rest/mrcs/tiles/" + layer.hdfName + "?f=json&v=2.0";
        callback = function (json) {
            if (json) {
                if (json.TileInfo1) {
                    //=================================修改了获取老版瓦片时的信息设置 modify by zl 2016/1/22=============================
                    info = json.TileInfo1;
                    layer.fullExtent = new OpenLayers.Bounds(info.XMin, info.YMin, info.XMax, info.YMax);
                    var xDelta = info.XMax - info.XMin;
                    var yDelta = info.YMax - info.YMin;
                    var layerMaxResolution = (xDelta > yDelta ? xDelta : yDelta) / info.ImageWidth;
                    if (info.EndLevel > 0 && info.BeginLevel >= 0) {
                        //map.numZoomLevels = info.EndLevel - info.BeginLevel;
                        layer.layerNumZoomLevels = info.EndLevel - info.BeginLevel;
                        var beginLevel = info.BeginLevel;
                        if (layer.zoomOffset != undefined && parseInt(layer.zoomOffset) >= 0) {
                            beginLevel = beginLevel + parseInt(layer.zoomOffset);
                        }
                        var lod = [];
                        var ress = [];
                        for (var i = beginLevel; i < info.EndLevel; i++) {
                            lod[i - beginLevel] = new Object();
                            ress.push(layerMaxResolution / Math.pow(2, i));
                            var maxRowCol = Math.pow(2, i) - 1;
                            lod[i - beginLevel].startCol = 0;
                            lod[i - beginLevel].endCol = maxRowCol;
                            lod[i - beginLevel].startRow = 0;
                            lod[i - beginLevel].endRow = maxRowCol;
                        }

                        layer.beginZoomLevel = beginLevel;
                        layer.lod = lod;
                        layer.tileSize = new OpenLayers.Size(info.ImageWidth, info.ImageWidth);
                        layer.tileVersion = 'oldTile';
                        layer.tileOrigin = new OpenLayers.LonLat(info.XMin, info.YMin);
                        layer.layerResolutions = ress;
                        layer.layerMaxResolution = ress[0];
                        //===============修改如果底图是矢量地图，当前添加的是瓦片地图，则以瓦片图为标准设置map容器======
                        if ((map.baseLayer instanceof Zondy.Map.Doc && map.baseLayer.cache == false) || map.baseLayer instanceof Zondy.Map.Layer) {
                            //==================================重新构建resolutions=========
                            var newress = [];
                            var newResolutions = map.baseLayer.resolutions;
                            var closetLevel = map.getZoomForResolution(ress[0], true);
                            layer.beginLevel = closetLevel;
                            //alert(layer.beginLevel);
                            var newNumberLevels = closetLevel + ress.length;
                            if (map.numZoomLevels < newNumberLevels) {
                                newNumberLevels = map.numZoomLevels;
                            }
                            for (var j = 0; j < newNumberLevels; j++) {
                                if (j >= closetLevel) {
                                    newress.push(ress[j - closetLevel]);
                                } else {
                                    newress.push(newResolutions[j]);
                                }
                            }
                            ress = newress;
                            //==============================================================
                            map.maxExtent = new OpenLayers.Bounds(info.XMin, info.YMin, info.XMax, info.YMax);
                            map.numZoomLevels = ress.length;
                            map.resolutions = ress;
                            map.baseLayer.resolutions = ress;
                            map.baseLayer.maxResolution = ress[0];
                            map.baseLayer.numZoomLevels = ress.length;
                            //===判断当前是否有PanZoomBar控件，如果有就刷新
                            var panCtrls = map.getControlsByClass("OpenLayers.Control.PanZoomBar");
                            if (panCtrls != null && panCtrls.length > 0) {
                                for (var j = 0; j < panCtrls.length; j++) {
                                    if (panCtrls[j]) {
                                        panCtrls[j].redraw();
                                    }
                                }
                            }
                        }

                        //==============================================================================================
                    }
                } else if (json.TileInfo2) {
                    info = json.TileInfo2;
                    var range = info.fullExtent;
                    var origin = info.tileInfo.origin;
                    var lod = info.tileInfo.lods;
                    //var layerMaxResolution = lod[0].resolution;
                    layer.layerNumZoomLevels = lod.length;
                    if (origin) {
                        layer.tileOrigin = new OpenLayers.LonLat(origin.x, origin.y);
                    } else {
                        layer.tileOrigin = new OpenLayers.LonLat(range.xmin, range.ymax);
                    }
                    layer.fullExtent = new OpenLayers.Bounds(range.xmin, range.ymin, range.xmax, range.ymax);
                    var SMALL_DATA = 10e-5;
                    var SMAX_DXYLOGIC = 1e-10;
                    var tileStart = function (distance, dxyTileLogic) {
                        if (Math.abs(dxyTileLogic) < SMAX_DXYLOGIC) {
                            return 0;
                        }
                        if ((Math.ceil(distance / dxyTileLogic) - distance / dxyTileLogic) <= SMALL_DATA) {
                            return parseInt(Math.ceil(distance / dxyTileLogic));
                        }
                        else {
                            return parseInt(Math.floor(distance / dxyTileLogic));
                        }
                    };
                    var tileEnd = function (distance, dxyTileLogic) {
                        if (Math.abs(dxyTileLogic) < SMAX_DXYLOGIC) {
                            return 0;
                        }
                        if ((distance / dxyTileLogic - Math.floor(distance / dxyTileLogic)) <= SMALL_DATA) {
                            return parseInt(Math.floor(distance / dxyTileLogic)) - 1;
                        }
                        else {
                            return parseInt(Math.ceil(distance / dxyTileLogic)) - 1;
                        }
                    };
                    var ress = [];
                    var beginLevel = 0;

                    //判断获取第几级开始有图
                    var beginLevel = 0;
                    for (var j = beginLevel; j < lod.length; j++) {
                        var currentLod = lod[j];
                        if (currentLod.scale != 0) {
                            beginLevel = j;
                            break;
                        }
                    }


                    if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                        beginLevel = beginLevel + layer.zoomOffset;
                    }
                    var newLod = [];
                    for (var i = beginLevel; i < lod.length; i++) {
                        var currentRect = lod[i].tileLogicRect;
                        ress.push(lod[i].resolution);
                        newLod[i - beginLevel] = new Object();
                        newLod[i - beginLevel].startCol = tileStart((currentRect.xmin - origin.x), lod[i].dxTileLogic);
                        newLod[i - beginLevel].endCol = tileEnd((currentRect.xmax - origin.x), lod[i].dxTileLogic);
                        newLod[i - beginLevel].startRow = tileStart((origin.y - currentRect.ymax), lod[i].dyTileLogic);
                        newLod[i - beginLevel].endRow = tileEnd((origin.y - currentRect.ymin), lod[i].dyTileLogic);
                    }
                    layer.beginZoomLevel = beginLevel;
                    //新瓦片的原点都是左上角
                    layer.tileVersion = 'newTile';
                    layer.lod = newLod;
                    layer.tileSize = new OpenLayers.Size(info.tileInfo.rows, info.tileInfo.cols);
                    layer.layerResolutions = ress;
                    layer.layerMaxResolution = ress[0];
                    //===============修改如果底图是矢量地图，当前添加的是瓦片地图，则以瓦片图为标准设置map容器======
                    if ((map.baseLayer instanceof Zondy.Map.Doc && map.baseLayer.cache == false) || map.baseLayer instanceof Zondy.Map.Layer) {
                        //==================================重新构建resolutions=========
                        var newress = [];
                        var newResolutions = map.baseLayer.resolutions;
                        var closetLevel = map.getZoomForResolution(ress[0], true);
                        layer.beginLevel = closetLevel;
                        var newNumberLevels = closetLevel + ress.length;
                        if (map.numZoomLevels < newNumberLevels) {
                            newNumberLevels = map.numZoomLevels;
                        }
                        for (var j = 0; j < newNumberLevels; j++) {
                            if (j >= closetLevel) {
                                newress.push(ress[j - closetLevel]);
                            } else {
                                newress.push(newResolutions[j]);
                            }
                        }
                        ress = newress;
                        //==============================================================
                        map.maxExtent = new OpenLayers.Bounds(range.xmin, range.ymin, range.xmax, range.ymax);
                        map.numZoomLevels = ress.length;
                        map.resolutions = ress;
                        map.baseLayer.resolutions = ress;
                        map.baseLayer.maxResolution = ress[0];
                        map.baseLayer.numZoomLevels = ress.length;
                        //===判断当前是否有PanZoomBar控件，如果有就刷新
                        var panCtrls = map.getControlsByClass("OpenLayers.Control.PanZoomBar");
                        if (panCtrls != null && panCtrls.length > 0) {
                            for (var j = 0; j < panCtrls.length; j++) {
                                if (panCtrls[j]) {
                                    panCtrls[j].redraw();
                                }
                            }
                        }
                    }
                    //==============================================================================================
                } else {
                    info = json;
                    layer.fullExtent = new OpenLayers.Bounds(info.XMin, info.YMin, info.XMax, info.YMax);
                    var lod = info.LODs;
                    var layerNumZoomLevels = 0;
                    // map.maxResolution = lod[0].Resolution;
                    if (lod.length > 1)
                        layerNumZoomLevels = lod.length - 1;
                    var resolutions = [];
                    var beginLevel = 0;
                    if (layer.zoomOffset != undefined && layer.zoomOffset >= 0) {
                        beginLevel = layer.zoomOffset;
                    }
                    var newLod = [];
                    for (var i = beginLevel; i < lod.length; i++) {
                        resolutions.push(lod[i].Resolution);
                        newLod[i - beginLevel] = new Object();
                        newLod[i - beginLevel] = lod[i];
                    }
                    layer.tileOrigin = new OpenLayers.LonLat(info.OriginX, info.OriginY);
                    //map.resolutions = resolutions;
                    layer.lod = newLod;
                    layer.cache = true;
                    layer.tileSize = new OpenLayers.Size(info.Width, info.Height);
                    layer.beginZoomLevel = beginLevel;
                    layer.layerMaxResolution = resolutions[0];
                    //===============修改如果底图是矢量地图，当前添加的是瓦片地图，则以瓦片图为标准设置map容器======
                    if ((map.baseLayer instanceof Zondy.Map.Doc && map.baseLayer.cache == false) || map.baseLayer instanceof Zondy.Map.Layer) {
                        //==================================重新构建resolutions=========
                        var newress = [];
                        var newResolutions = map.baseLayer.resolutions;
                        var closetLevel = map.getZoomForResolution(resolutions[0], true);
                        layer.beginLevel = closetLevel;
                        var newNumberLevels = closetLevel + resolutions.length;
                        if (map.numZoomLevels < newNumberLevels) {
                            newNumberLevels = map.numZoomLevels;
                        }
                        for (var j = 0; j < newNumberLevels; j++) {
                            if (j >= closetLevel) {
                                newress.push(resolutions[j - closetLevel]);
                            } else {
                                newress.push(newResolutions[j]);
                            }
                        }
                        resolutions = newress;
                        //==============================================================

                        map.maxExtent = new OpenLayers.Bounds(info.XMin, info.YMin, info.XMax, info.YMax);
                        map.numZoomLevels = resolutions.length;
                        map.resolutions = resolutions;
                        map.baseLayer.resolutions = resolutions;
                        map.baseLayer.maxResolution = resolutions[0];
                        map.baseLayer.numZoomLevels = resolutions.length;
                        //===判断当前是否有PanZoomBar控件，如果有就刷新
                        var panCtrls = map.getControlsByClass("OpenLayers.Control.PanZoomBar");
                        if (panCtrls != null && panCtrls.length > 0) {
                            for (var j = 0; j < panCtrls.length; j++) {
                                if (panCtrls[j]) {
                                    panCtrls[j].redraw();
                                }
                            }
                        }
                    }
                    //==============================================================================================
                }
                complete && complete();
            } else {
                alert("无法获取瓦片信息，请使用手动配置 ！");
            }
        };
        layer.ajax(url, null, callback, "GET", null, "json", error, { async: false });
    }
};

//==============================================================================================================


OpenLayers.Map.prototype.addLayer = function (layer) {
    for (var i = 0, len = this.layers.length; i < len; i++) {
        if (this.layers[i] == layer) {
            var msg = OpenLayers.i18n('layerAlreadyAdded', { 'layerName': layer.name });
            OpenLayers.Console.warn(msg);
            return false;
        }
    }
    if (this.allOverlays) {
        layer.isBaseLayer = false;
    }
    var map = this;

    var addLayerFun = function () {
        //addLayer
        (function () {
            if (this.events.triggerEvent("preaddlayer", { layer: layer }) === false) {
                return;
            }
            layer.div.className = "olLayerDiv";
            layer.div.style.overflow = "";
            this.setLayerZIndex(layer, this.layers.length);

            if (layer.isFixed) {
                this.viewPortDiv.appendChild(layer.div);
            } else {
                this.layerContainerDiv.appendChild(layer.div);
            }
            this.layers.push(layer);
            layer.setMap(this);

            if (layer.isBaseLayer || (this.allOverlays && !this.baseLayer)) {
                if (this.baseLayer == null) {
                    // set the first baselaye we add as the baselayer
                    this.setBaseLayer(layer);
                } else {
                    layer.setVisibility(false);
                }
            } else {
                layer.redraw();
            }
            this.events.triggerEvent("addlayer", { layer: layer });
            layer.events.triggerEvent("added", { map: this, layer: layer });
            layer.afterAdd();
        }).call(map);
        //========================基础图层加载完成后执行的回调=========================
        if (layer.isBaseLayer && !map.isAutoConfigSucceedBaseLayer) {
            map.isAutoConfigSucceedBaseLayer = true;
            //解决IE跨域访问时，无法实现同步调用的问题，将常用的方法延迟执行
            if (map.zoomToMaxExtentArgs) {
                map.zoomToMaxExtent.apply(map, map.zoomToMaxExtentArgs);
            }
            if (map.zoomToExtentArgs) {
                map.zoomToExtent.apply(map, map.zoomToExtentArgs);
            }
            if (map.setCenterArgs) {
                map.setCenter.apply(map, map.setCenterArgs);
            }
            if (map.zoomToArgs) {
                map.zoomTo.apply(map, map.zoomToArgs);
            }
            map.autoConfigSucceedCallback && map.autoConfigSucceedCallback();
        }
        //添加后执行图层添加完的方法
        if (layer.layerAddCallBack) {
            layer.layerAddCallBack && layer.layerAddCallBack();
        }
    };

    var configCallBack = function () {
        map.isSucceedAutoConfig = true;
        addLayerFun();

    };

    var configError = function () {
        map.isSucceedAutoConfig = false;
        addLayerFun();
    };

    if (layer.isBaseLayer === true && this.isAutoConfig === true && (layer instanceof Zondy.Map.Doc || layer instanceof Zondy.Map.TileLayer || layer instanceof Zondy.Map.Layer)) {
        this.isSucceedAutoConfig = false;
        this.setConfigByLayer(layer, configCallBack, configError);
    } else {
        if (this.isAutoConfig === false) {
            addLayerFun();
        } else {
            //加判断是为了防止基础图层请求发送两次
            if (layer.isBaseLayer) {
                if (!(layer instanceof Zondy.Map.Doc || layer instanceof Zondy.Map.TileLayer || layer instanceof Zondy.Map.Layer)) {
                    this.isSucceedAutoConfig = true;
                }
                addLayerFun();
            } else {
                //===================修改为程序从自动获取信息中进行==========================
                if (((layer instanceof Zondy.Map.Doc && layer.cache) || layer instanceof Zondy.Map.TileLayer)) {
                    if (this.isSucceedAutoConfig) {
                        this.setOverLayerConfig(layer, configCallBack, configError);
                    } else {
                        //延时判断当前是否加载完成基础图层
                        var restime = null;
                        restime = setInterval(function () {
                            if (map.isSucceedAutoConfig) {
                                map.setOverLayerConfig.apply(map, [layer, configCallBack, configError]);
                                if (restime) {
                                    clearInterval(restime);
                                }
                            }
                        }, 20);
                    }
                } else {
                    addLayerFun();
                }
            }
        }

    }
};



OpenLayers.Map.prototype.zoomToMaxExtent = function (options) {
  if (navigator.userAgent.indexOf("MSIE")>=0 && this.isAutoConfig === true && this.isSucceedAutoConfig === false) {
        this.zoomToMaxExtentArgs = arguments;
        return;
    }
    //restricted is true by default
    var restricted = (options) ? options.restricted : true;

    var maxExtent = this.getMaxExtent({
        'restricted': restricted
    });
    this.zoomToExtent(maxExtent);
};

OpenLayers.Map.prototype.zoomToExtent = function (bounds, closest) {
   if (navigator.userAgent.indexOf("MSIE") >= 0 && this.isAutoConfig === true && this.isSucceedAutoConfig === false) {
        this.zoomToExtentArgs = arguments;
        return;
    }
    var center = bounds.getCenterLonLat();
    if (this.baseLayer.wrapDateLine) {
        var maxExtent = this.getMaxExtent();
        bounds = bounds.clone();
        while (bounds.right < bounds.left) {
            bounds.right += maxExtent.getWidth();
        }
        center = bounds.getCenterLonLat().wrapDateLine(maxExtent);
    }
    this.setCenter(center, this.getZoomForExtent(bounds, closest));
};

OpenLayers.Map.prototype.setCenter = function (lonlat, zoom, dragging, forceZoomChange) {
    // var restext = top.$("#consoleText").text();
    // top.$("#consoleText").text(restext + "/abc");
      if (navigator.userAgent.indexOf("MSIE") >= 0 && this.isAutoConfig === true && this.isSucceedAutoConfig === false) {
        this.setCenterArgs = arguments;
        return;
    }
    // var restext = top.$("#consoleText").text();
    // top.$("#consoleText").text(restext + "/123");
    this.panTween && this.panTween.stop();
    this.moveTo(lonlat, zoom, {
        'dragging': dragging,
        'forceZoomChange': forceZoomChange
    });
};

OpenLayers.Map.prototype.zoomTo = function (zoom) {
   if (navigator.userAgent.indexOf("MSIE") >= 0 && this.isAutoConfig === true && this.isSucceedAutoConfig === false) {
        this.zoomToArgs = arguments;
        return;
    }
    if (this.isValidZoomLevel(zoom)) {
        this.setCenter(null, zoom);
    }
};

//===============================================重写shouldDraw====================================================
OpenLayers.Tile.prototype.shouldDraw = function () {
    if (this.layer == null) {
        return false
    };
    var withinMaxExtent = false,
            maxExtent = this.layer.maxExtent;

    if (maxExtent) {
        var map = this.layer.map;
        var worldBounds = map.baseLayer.wrapDateLine && map.getMaxExtent();
        if (this.bounds.intersectsBounds(maxExtent, { inclusive: false, worldBounds: worldBounds })) {
            withinMaxExtent = true;
        }
    }

    return withinMaxExtent || this.layer.displayOutsideMaxExtent;

};
//===============================================修改鹰眼====================================================

OpenLayers.Control.OverviewMap.prototype.createMap = function () {
    // create the overview map
    var options = { controls: [], maxResolution: 'auto', fallThrough: false };
    options.isAutoConfig = this.map.isAutoConfig;
    if (!this.map.isAutoConfig) {
        options.maxResolution = this.map.maxResolution;
        options.resolutions = this.map.resolutions;
        options.maxExtent = this.map.maxExtent;
    }
    options = OpenLayers.Util.extend(options, this.mapOptions);

    this.ovmap = new OpenLayers.Map(this.mapDiv, options);
    this.ovmap.viewPortDiv.appendChild(this.extentRectangle);

    OpenLayers.Event.stopObserving(window, 'unload', this.ovmap.unloadDestroy);

    this.ovmap.addLayers(this.layers);
    this.ovmap.zoomToMaxExtent();
    // check extent rectangle border width
    this.wComp = parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-left-width')) +
                     parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-right-width'));
    this.wComp = (this.wComp) ? this.wComp : 2;
    this.hComp = parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-top-width')) +
                     parseInt(OpenLayers.Element.getStyle(this.extentRectangle,
                                               'border-bottom-width'));
    this.hComp = (this.hComp) ? this.hComp : 2;

    this.handlers.drag = new OpenLayers.Handler.Drag(
            this, { move: this.rectDrag, done: this.updateMapToRect },
            { map: this.ovmap }
        );
    this.handlers.click = new OpenLayers.Handler.Click(
            this, {
                "click": this.mapDivClick
            }, {
                "single": true, "double": false,
                "stopSingle": true, "stopDouble": true,
                "pixelTolerance": 1,
                map: this.ovmap
            }
        );
    this.handlers.click.activate();

    this.rectEvents = new OpenLayers.Events(this, this.extentRectangle,
                                                null, true);
    this.rectEvents.register("mouseover", this, function (e) {
        if (!this.handlers.drag.active && !this.map.dragging) {
            this.handlers.drag.activate();
        }
    });
    this.rectEvents.register("mouseout", this, function (e) {
        if (!this.handlers.drag.dragging) {
            this.handlers.drag.deactivate();
        }
    });

    if (this.ovmap.getProjection() != this.map.getProjection()) {
        var sourceUnits = this.map.getProjectionObject().getUnits() ||
                this.map.units || this.map.baseLayer.units;
        var targetUnits = this.ovmap.getProjectionObject().getUnits() ||
                this.ovmap.units || this.ovmap.baseLayer.units;
        this.resolutionFactor = sourceUnits && targetUnits ?
                OpenLayers.INCHES_PER_UNIT[sourceUnits] /
                OpenLayers.INCHES_PER_UNIT[targetUnits] : 1;
    }
};

//===========================================================================================================
//#endregion
window.Zondy = {};
Zondy.Map = OpenLayers.Class(Zondy, {
});
Zondy.Service = OpenLayers.Class(Zondy, {
});
Zondy.Service.Catalog = OpenLayers.Class(Zondy.Service, {
});
Zondy.Object = OpenLayers.Class(Zondy, {
});
Zondy.Format = OpenLayers.Class(Zondy, {
});
Zondy.Util = OpenLayers.Class(Zondy, {
});
Zondy.Control = OpenLayers.Class(Zondy, {
});
Zondy.Util.Hashtable = OpenLayers.Class({
    items: new Array,
    itemsCount: 0,
    initialize: function () {
    },
    add: function (key, value) {
        if (!this.containsKey(key)) {
            this.items[key] = value;
            this.itemsCount++;
        } else
            throw "key '" + key + "'已经存在";
    },
    get: function (key) {
        if (this.containsKey(key))
            return this.items[key];
        else
            return null;
    },
    remove: function (key) {
        if (this.containsKey(key)) {
            delete this.items[key];
            this.itemsCount--;
        } else
            throw "key '" + key + "' does not exists.";
    },
    containsKey: function (key) {
        return typeof (this.items[key]) != "undefined";
    },
    containsValue: function containsValue(value) {
        for (var item in this.items) {
            if (this.items[item] == value)
                return true;
        }
        return false;
    },
    contains: function (keyOrValue) {
        return this.containsKey(keyOrValue) || this.containsValue(keyOrValue);
    },
    clear: function () {
        this.items = new Array();
        itemsCount = 0;
    },
    size: function () {
        return this.itemsCount;
    },
    isEmpty: function () {
        return this.size() == 0;
    }
});

/**全局变量定义******/
// {Zondy.Util.HashTable}
Zondy.ATT_STURCT_CACHE = new Zondy.Util.Hashtable();

/**********************************************************常量(枚举)定义************************************************/
Zondy.Enum = {};
Zondy.Enum.FeatureType = {};
Zondy.Enum.FeatureType.Unknown = 0;
Zondy.Enum.FeatureType.Pnt = 1;
Zondy.Enum.FeatureType.Lin = 2;
Zondy.Enum.FeatureType.Reg = 3;

/// <summary>线的动态注记的线方位类型</summary>
Zondy.Enum.LabelLinType = {};

/// <summary>弯曲注记</summary>
Zondy.Enum.LabelLinType.Curved = 0;

/// <summary>笔直注记</summary>
Zondy.Enum.LabelLinType.Forward = 1;

/// <summary>水平注记</summary>
Zondy.Enum.LabelLinType.Horizontal = 2;

/// <summary>正交注记</summary>
Zondy.Enum.LabelLinType.Tangent = 3;

/// <summary>区的动态注记的区方位类型</summary>
Zondy.Enum.LabelRegType = {};
/// <summary>沿骨架线弯曲注记</summary>
Zondy.Enum.LabelRegType.Curved = 0;
/// <summary>沿骨架线笔直注记</summary>
Zondy.Enum.LabelRegType.Forward = 1;
/// <summary>水平注记</summary>
Zondy.Enum.LabelRegType.Horizontal = 2;
/// <summary>边界线注记</summary>
Zondy.Enum.LabelRegType.Boundray = 3;
/// <summary>区域外注记</summary>
Zondy.Enum.LabelRegType.Outside = 4;

/// <summary>点的动态注记的方位类型</summary>
Zondy.Enum.LabelPntType = {};
/// <summary>任意方位</summary>
Zondy.Enum.LabelPntType.PntAnyDir = 0;
/// <summary>八方位</summary>
Zondy.Enum.LabelPntType.PntEightDir = 1;
/// <summary>压点</summary>
Zondy.Enum.LabelPntType.PntOnFea = 2;

/// <summary>线重复注记策略</summary>
Zondy.Enum.RepeatType = {};

/// <summary>自动重复注记（当线长度超过注记长度的2倍时重复注记，否则不重复注记）</summary>
Zondy.Enum.RepeatType.Auto = 0;

/// <summary>从不重复注记</summary>
Zondy.Enum.RepeatType.NoRep = 1;

/// <summary>分段注记</summary>
Zondy.Enum.RepeatType.OnStep = 2;

/// <summary> 注记分布的策略</summary>
Zondy.Enum.LabelSpreadType = {};
/// <summary>自动分布策略（全是数字或字符采用集中注记方式，注记中带有汉字采用分散分布注记）</summary>
Zondy.Enum.LabelSpreadType.AutoSpread = 0;
/// <summary>字符集中分布</summary>
Zondy.Enum.LabelSpreadType.Centralization = 1;
/// <summary>字符分散分布</summary>
Zondy.Enum.LabelSpreadType.Decentralization = 2;

/// <summary>偏离线约束</summary>
Zondy.Enum.LineConstrain = {};

/// <summary>注记在线的左边</summary>
Zondy.Enum.LineConstrain.Left = 0;

/// <summary>注记在线的右边</summary>
Zondy.Enum.LineConstrain.Right = 1;

/// <summary>注记在线的上方</summary>
Zondy.Enum.LineConstrain.Above = 2;

/// <summary>注记在线的下方</summary>
Zondy.Enum.LineConstrain.Below = 3;

/// <summary>注记在线的两边</summary>
Zondy.Enum.LineConstrain.Both = 4;

/// <summary>没有约束</summary>
Zondy.Enum.LineConstrain.NoRes = 5;

/// <summary>点八方位注记类型</summary>
Zondy.Enum.EightDirType = {};
/// <summary>东</summary>
Zondy.Enum.EightDirType.East = 0;
/// <summary>北</summary>
Zondy.Enum.EightDirType.North = 1;
/// <summary>东北</summary>
Zondy.Enum.EightDirType.NorthEast = 2;
/// <summary>西北</summary>
Zondy.Enum.EightDirType.NorthWest = 3;
/// <summary>南</summary>
Zondy.Enum.EightDirType.South = 4;
/// <summary>东南</summary>
Zondy.Enum.EightDirType.SouthEast = 5;
/// <summary>西南</summary>
Zondy.Enum.EightDirType.SouthWest = 6;
/// <summary>西</summary>
Zondy.Enum.EightDirType.West = 7;
/// <summary>无方位</summary>
Zondy.Enum.EightDirType.NoDir = 8;

/// <summary>是否显示弧段</summary>
Zondy.Enum.ISShowArc = {};

/// <summary>只显示填充区域</summary>
Zondy.Enum.ISShowArc.Reg = 0;

/// <summary>只显示弧段</summary>
Zondy.Enum.ISShowArc.Arc = 1;

/// <summary>两者都显示</summary>
Zondy.Enum.ISShowArc.All = 2;

/// <summary>矢量数据类型</summary>
Zondy.Enum.VectClsType ={};
/// <summary>未知类型</summary>
Zondy.Enum.VectClsType.Unknown = 0;                
/// <summary>简单要素类</summary>
Zondy.Enum.VectClsType.SFCls = "SFeatureCls",       
/// <summary>注记类</summary>
Zondy.Enum.VectClsType.AnnoCls = "AnnotationCls"   
//扩展jQuery对json字符串的转换 
jQuery.extend({
    /** * @see 将json字符串转换为对象 * @param json字符串 * @return 返回object,array,string等对象 */
    evalJSON: function (strJson) {
        return eval("(" + strJson + ")");
    }
});

jQuery.extend({
    /// <summary>将javascript数据类型转换为json字符串</summary>
    /// <param name="object" type="{Object}">待转换对象,支持object,array,string,function,number,boolean,regexp</param>
    /// <param name="exclude" type="{Array}">要排除的属性名称数组，在此数组里的属性将不会被加入到json字符串中</param>
    /// <param name="splitor" type="String">指明属性间用什么符号分割，默认为‘，’</param>
    /// <param name="containQuot" type="Bool">属性名和属性值是否包含引号，如果为false，那么即使是字符串也不会被引号包裹</param>
    toJSON: function (object, exclude, splitor, containQuot) {
        if (object == null)
            return null;
        var type = typeof object;
        var results, value;
        if ('object' == type) {
            if (Array == object.constructor) type = 'array';
            else if (RegExp == object.constructor) type = 'regexp';
            else type = 'object';
        }
        switch (type) {
            case 'undefined':
            case 'unknown':
                return;
            case 'function':
                return;
            case 'boolean':
            case 'regexp':
                return object.toString();
            case 'number':
                return isFinite(object) ? object.toString() : 'null';
            case 'string':
                if (containQuot || containQuot == undefined) {
                    return '"' + object.replace(/(\\|\")/g, "\\$1").replace(/\n|\r|\t/g, function () {
                        var a = arguments[0];
                        return (a == '\n') ? '\\n' : (a == '\r') ? '\\r' : (a == '\t') ? '\\t' : "";
                    }) + '"';
                }
                else {
                    return object;
                }
            case 'object':
                results = [];
                for (var property in object) {
                    if (exclude != undefined | exclude != null) {
                        if ($.inArray(property, exclude) > -1)
                            continue;
                    }
                    value = jQuery.toJSON(object[property], null, null, containQuot);
                    if (value !== undefined) results.push(jQuery.toJSON(property, null, null, containQuot) + ':' + value);
                }
                if (splitor != undefined) {
                    return '{' + results.join(splitor) + '}';
                }
                else {
                    return '{' + results.join(',') + '}';
                }
            case 'array':
                results = [];
                for (var i = 0; i < object.length; i++) {
                    value = jQuery.toJSON(object[i], null, null, containQuot);
                    if (value !== undefined) {
                        if (value == null) {
                            value = 'null';
                        }
                        results.push(value);
                    }
                }
                return '[' + results.join(',') + ']';
        }
    }
});

//***********************************************Helper 方法************************************************
Zondy.Util.getTopAnalysisResult = function (enumNum) {
    /// <summary>解析拓扑分析的服务器REST返回结果，以更友好的形式返回给客户端</summary>
    switch (enumNum) {
        case 0:
            //        return "Intersect";
            return "相交";
        case 1:
            //        return "Disjoin";
            return "相离";
        case 2:
            //        return "Include";
            return "包含";
        case 3:
            //        return "Adjacent";
            return "相邻";
        default:
            return "Unknown";
    }
};

Zondy.Util.newGuid = function () {
    /// <summary>生成一个guid</summary>
    var guid = "";
    for (var i = 1; i <= 32; i++) {
        var n = Math.floor(Math.random() * 16.0).toString(16);
        guid += n;
        if ((i == 8) || (i == 12) || (i == 16) || (i == 20))
            guid += "-";
    }
    return guid;
};

Zondy.Util.objectDeleteUnuseful = function (obj, array) {
    /// <summary>删除对象的指定属性</summary>
    /// <param name="obj" type="Object">操作对象</param>
    /// <param name="array" type="String in an Array">需要删除的属性名称</param>
    $.each(array, function (i, value) {
        delete obj[value];
    });
    return obj;
};

Zondy.Util.toUrlParameters = function (obj) {
    if (obj) {
        var rltStr = '';
        $.each(obj, function (key, value) {
            rltStr = rltStr + '&' + key + '=' + value;
        });
        rltStr = rltStr.substring(1, rltStr.length);
        return rltStr;
    } else {
        return '';
    }
};
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------HttpRequest.js---------------------------------------------------------*/
Zondy.Service.HttpRequest = OpenLayers.Class({
    /**
    * 查询服务器地址
    * {String}
    */
    ip: "localhost",

    /**
    * 查询服务器端口
    * {String}
    */
    port: "6163",

    /**
    * 查询服务的基地址
    * {String}
    */
    baseUrl: null,

    partUrl: null,

    resultFormat: "json",

    initialize: function () {
    },

    /**
    * 查询函数，用于向REST服务发送请求,Get方式发送
    * onSuccess(required): 查询成功的回调，此函数接将接受要素类 - {Function}
    */
    ajax: function (restUrl, dataObject, onSuccess, type, contentType, resultFormat, onError, options) {
        /// <summary>ajax调用REST服务</summary>
        /// <param name="restUrl" type="String">REST服务地址</param>
        /// <param name="dataObject" type="Object">服务器发送的数据，如果为Get则该参数为参数对象</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        /// <param name="type" type="{String}">请求类型"Get","Post"</param>
        /// <param name="contentType" type="String">get方式默认为‘application/x-www-form-urlencoded’，post默认为text/plain</param>
        /// <param name="resultFormat" type="String">回调结果的包装形式，取值为'json','xml','kml','gml',georss'，默认为‘json’，对于resultFormat参数为xml，kml，
        ///   gml或者georss格式的类xml类型将以text文本返回，如需要可以调用$.parseXML(text)得到其xml包装</param>
        if (restUrl == null) {
            restUrl = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl + "/" + this.partUrl;
        }
        $.support.cors = true;

        if (!type) {
            type = "GET";
        }
        if (type.toUpperCase() == "POST") {
            if (typeof (dataObject) === "object") {
                var jsonStr = $.toJSON(dataObject);
                dataObject = jsonStr;
            }
        }
        if (contentType === undefined || contentType === null) {
            if (dataObject != null && type.toUpperCase() == "POST")
                contentType = "text/plain";
            else {
                contentType = 'application/x-www-form-urlencoded';
            }
        }
		if(resultFormat!=null)
			this.resultFormat=resultFormat;
        var dataType = this.analysisResultType(this.resultFormat);
        if (OpenLayers.ProxyHost != "") {
            this.ajaxForProxy(restUrl, dataObject, onSuccess, type, contentType, dataType, onError, options);
        }
        else {
            this.ajaxNormal(restUrl, dataObject, onSuccess, type, contentType, dataType, onError, options);
        }
    },

    analysisCrossDomain: function (url) {
        if (url.indexOf('http') < 0 && url.indexOf('https') < 0) {
            return false;
        }
        else {
            var domainHost = window.location.protocol + '://' + window.location.host;
            if (url.indexOf(domainHost) == 0) {
                return false;
            }
        }
        return true;
    },

    analysisResultType: function (requestFormat) {
        if (!requestFormat)
            return "json";
        if (requestFormat != "json")
            return "text";
        return requestFormat;
    },

    ajaxForProxy: function (restUrl, dataObject, onSuccess, type, contentType, dataType, onError, options) {
        /// <summary>通过代理服务调用IGServer</summary>
        var reUrl = OpenLayers.ProxyHost;
        if (type.toUpperCase() == "GET") {
            dataObject = { 'url': restUrl + "?" + Zondy.Util.toUrlParameters(dataObject) };
        }
        else {
            reUrl += '?url=' + encodeURI(restUrl);
        }
        var thisObj = this;
        var ajaxParam = {
            type: type,
            url: reUrl,
            dataType: dataType,
            data: dataObject,
            context: thisObj,
            contentType: contentType,
            success: function (jsonObj, status, xrequest) {
                onSuccess.call(this, jsonObj);
            },
            error: function (s) {
                onError && onError();
                alert("请求失败，请检查参数");
            }
        };
        OpenLayers.Util.extend(ajaxParam, options);
        $.ajax(ajaxParam);
    },

    ajaxNormal: function (restUrl, dataObject, onSuccess, type, contentType, dataType, onError, options) {
        /// <summary>不经过代理服务，直接调用REST服务</summary>
        var thisObj = this;
        var crossDomain = this.analysisCrossDomain(restUrl);
       if (navigator.userAgent.indexOf("MSIE") >= 0 && window.XDomainRequest && crossDomain) {
            // window.XDomainRequest 要求服务器输出header信息，所以如果不是跨域的请求即使是IE也不要使用XDomainRequest
            this.ajaxForIE(restUrl, dataObject, onSuccess, type, thisObj, dataType, onError);
        }
        else {
            var ajaxParam = {
                type: type,
                url: restUrl,
                dataType: dataType,
                data: dataObject,
                context: thisObj,
                contentType: contentType,
                success: function (jsonObj, status, xrequest) {
                    onSuccess.call(this, jsonObj);
                },
                error: function (s) {
                    onError && onError();
                    alert("请求失败，请检查参数");
                }
            };
            OpenLayers.Util.extend(ajaxParam, options);
            $.ajax(ajaxParam);
        }
    },

    ajaxForIE: function (url, data, callback, type, context, resultFormat, onError) {
        /// <summary>IE实现跨域，只支持IE8.0beta版本以上的浏览器，8.0以下版本无法实现跨域</summary>
        var xdr = new window.XDomainRequest();
        xdr.timeout = 60000;
        var ontimeout = function () {
            alert("IE跨域访问超时");
        };
        //解决IE跨越访问不稳定的问题，需要监听该事件
        var onprogress = function () {
        };
        var onload = function () {
            var rlt;
            if (resultFormat != "text") {
                rlt = $.parseJSON(this.responseText);
            } else {
                rlt = this.responseText;
            }
            callback.call(context, rlt);
        };
        var onerror = function () {
            onError && onError();
            alert("IE跨域请求请求失败");
        };
        if (type.toUpperCase() == "GET") {
            var params = '';
            if (data) {
                for (var key in data) {
                    params = params + '&' + key + '=' + encodeURIComponent(data[key]);
                }
                params = params.substring(1, params.length);
                if (OpenLayers.String.contains(url, '?'))
                    url += params;
                else
                    url = url + "?" + params;
            }else {
                url = decodeURI(url);
                url = encodeURI(url);
            }
            
            xdr.onload = onload;
            xdr.onerror = onerror;
            xdr.ontimeout = ontimeout;
            xdr.onprogress = onprogress;
            xdr.open('get', url);
            xdr.send();

        }
        if (type.toUpperCase() == "POST") {
            url = decodeURI(url);
            url = encodeURI(url);
            xdr.onload = onload;
            xdr.onerror = onerror;
            xdr.ontimeout = ontimeout;
            xdr.onprogress = onprogress;
            xdr.open("post", url);
            xdr.send(data);
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------DocLayer.js---------------------------------------------------------*/



Zondy.Service.DocLayer = OpenLayers.Class({
    /**
    *  地图文档名
    * {String}
    */
    docName: null,

    /**
    *  地图图层序号
    * {Interger}
    */
    layerIndex: 0,

    /**
    *  地图序号,用于指定查询地图文档下的哪个地图，目前仅支持0
    *  {Interger}
    **/
    mapIndex: 0,

    initialize: function () {
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Doc.js---------------------------------------------------------*/
Zondy.Map.Doc = OpenLayers.Class(OpenLayers.Layer.Grid, Zondy.Service.HttpRequest, {
    /// <summary>用于显示一个地图文档的图像</summary>

    /// <summary>当重叠层与基础层的空间参考系不一致时,可设置其与基础层一致
    ///     {Boolean} Try to reproject this layer if its coordinate reference system
    ///     is different than that of the base layer.  Default is false.  
    ///     Set this in the layer options.   
    /// </summary>
    reproject: false,

    isBaseLayer: true,

    /// <summary>
    ///     {Boolean} Should the BBOX commas be encoded? The WMS spec says 'no', 
    ///     but some services want it that way. Default false.
    /// </summary>
    encodeBBOX: false,

    /// <summary>文档名称</summary>
    docName: null,

    /// <summary>图像类型:jpg,png,gif</summary>
    f: "png",
    ///<summary>图层添加完成后执行的方法,类型为function</summary>
    layerAddCallBack: null,
    /// <summary>
    ///     指示需要显示的地图图层号
    ///     show,hide,include,exclude 4种形式
    ///     eg:  'layers=show:1,2,3','layers=include:4,5,7'
    /// </summary>
    layers: null,

    /// <summary>
    ///     用户指定的图层过滤条件，它由多个键值对组成，值为您所要设定的过滤条件。
    ///     eg：'filters=1:ID>4,3:ID>1'
    ///     中文请使用UTF-8编码后再传入参数
    ///     javascitpt中请使用encodeURI（）函数编码后再代入filters参数中
    ///     注意，在此函数中“：”和“，”是保留字符，用于表示键值对概念和分隔不同图层的条件，请不要将这2个字符用于自定义条件中
    /// </summary>
    filters: null,

    /// <summary>
    ///     显示参数
    ///     Zondy.Object.CDisplayStyle
    /// </summary>
    style: null,

    /// <summary>
    ///     动态投影参数,设置地图文档在服务器端重新投影所需的空间参考系对象
    ///     Zondy.Object.CGetImageBySRSID
    /// </summary>
    proj: null,

    /// <summary>是否使用动态裁图</summary>
    cache: false,

    /// <summary>是否重新裁图</summary>
    update: false,

    /// <summary>动态裁图范围,OpenLayers.Bounds，如果null，默认取map最大范围</summary>
    cacheBox: null,

    /// <summary></summary>
    p_cacheOrigin: null,

    /// <summary>裁图宽度</summary>
    cacheWidth: 256,

    /// <summary>裁图高度</summary>
    cacheHeight: 256,

    /// <summary>设置地图从某一级开始（仅当cache为true即动态裁图时有效）</summary>
    zoomOffset: 0,

    /// <summary>客户端标识，用以服务器缓存地图,此属性不应作为公有属性</summary>
    guid: null,

    temp_Options: null,

    initialize: function (name, docName, options) {
        /// <summary>构造函数</summary>
        /// <param name="name" type="String">此地图文档控件的显示名称</param>
        /// <param name="docName" type="String">地图文档名</param>
        /// <param name="options" type="String">其他属性键值对</param>
        var newArguments = [];
        if (this.baseUrl == null)
            this.baseUrl = "igs/rest/mrms";
        if (this.partUrl == null)
            this.partUrl = "docs";
        OpenLayers.Util.extend(this, options);
        this.docName = docName;
        var url = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl + "/" + this.partUrl + "/" + this.docName;
        var params = {};

        newArguments.push(name, url, params, {});
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
        if (options != null) {
            if (options.isBaseLayer == false) {
                this.isBaseLayer = false;
            }
        }
        this.temp_Options = options;
        if (this.guid == null) {
            this.guid = Zondy.Util.newGuid();
        }

        if (!this.cache) {
            this.singleTile = true;
        }
    },

    setDocUniqueName: function (guid) {
        /// <summary>设置文档在服务器的名称</summary>
        /// <param name="guid" type="String">唯一文档名称</param>
        this.guid = guid;
    },

    getDocUniqueName: function () {
        /// <summary>获取文档在服务器的名称</summary>
        return this.guid;
    },

    destroy: function () {
        // for now, nothing special to do here. 
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
    },

    clone: function (obj) {
        if (obj == null) {
            var clone_Options = this.temp_Options;
            obj = new Zondy.Map.Doc(this.name, this.docName, clone_Options);
        }
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here
        return obj;
    },

    reverseAxisOrder: function () {
        return (parseFloat(this.params.VERSION) >= 1.3 &&
            !!this.yx[this.map.getProjectionObject().getCode()]);
    },

    getURL: function (bounds) {
        var newParams = {};
        newParams.f = this.f;
        newParams.cache = this.cache;

        bounds = this.adjustBounds(bounds);

        if (this.cache) {
            if (this.cacheBox == null) {
                this.cacheBox = this.map.maxExtent;
            }

            if (this.p_cacheOrigin == null) {
                /*modify by liuruoli 2015-11-10
                * 将裁剪原点由左下角（MapGIS老版本的默认值），改为左上角 
                */
                this.p_cacheOrigin = new OpenLayers.LonLat(this.cacheBox.left, this.cacheBox.top);
            }
            var res = this.map.getResolution();
            newParams.col = Math.round((bounds.left - this.p_cacheOrigin.lon) / (res * this.tileSize.w));

            var latCenter = (this.map.maxExtent.top - this.map.maxExtent.bottom) / 2 + this.map.maxExtent.bottom;

            newParams.row = Math.round((this.p_cacheOrigin.lat - bounds.top) / (res * this.tileSize.h)); //按新裁图方式

            //===========modify by ZL 2016/01/25 增加了参数zoomOffset，以便于能设置从第几级开始显示动态瓦片===================
            newParams.level = this.getZoomForResolution(res, true);
            if (this.map.isSucceedAutoConfig) {
                newParams.level = newParams.level + this.beginZoomLevel;
            } else {
                newParams.level = newParams.level + this.zoomOffset;
            }
            //beginLevel参数为内部使用，不能外部赋值 ,用在自动配置时底图是矢量地图，叠加显示当前动态裁图时使用
            if (this.beginLevel) {
                newParams.level = newParams.level - this.beginLevel;
            }
            //=========modify by ZL 2016/01/25 增加了瓦片每一级的最大行列号和最小行列号，以便于判断当前计算的行列好是否在该范围内=======
            if (this.lod && this.lod.length > 0) {
                var lodIndex = newParams.level - this.beginZoomLevel;
                if (lodIndex < 0) {
                    return;
                }
                var currentLod = this.lod[parseInt(lodIndex)];
                if (currentLod == undefined || currentLod == null || currentLod.StartRow == null || currentLod.EndRow == null || currentLod.StartCol == null || currentLod.EndCol == null) {
                    return;
                }
                if (newParams.row < currentLod.StartRow || newParams.row > currentLod.EndRow || newParams.col < currentLod.StartCol || newParams.col > currentLod.EndCol) {
                    return;
                }
            }
            //==========================================================================================================================


            newParams.w = this.cacheWidth;
            newParams.h = this.cacheHeight;
            newParams.bbox = this.map.maxExtent.toString();
            newParams.update = this.update;
        }
        else {
            var imageSize = this.getImageSize();

            var reverseAxisOrder = this.reverseAxisOrder();
            newParams.bbox = this.encodeBBOX ?
            bounds.toBBOX(null, reverseAxisOrder) :
            bounds.toArray(reverseAxisOrder);

            newParams.w = imageSize.w;
            newParams.h = imageSize.h;
            newParams.filters = this.filters;
            newParams.layers = this.layers;
            newParams.style = $.toJSON(this.style);
            newParams.proj = $.toJSON(this.proj);
            newParams.guid = this.guid;
        }
        var requestString = this.getFullRequestString(newParams);
        return requestString;
    },

    mergeNewParams: function (newParams) {
        var upperParams = OpenLayers.Util.upperCaseObject(newParams);
        var newArguments = [upperParams];
        return OpenLayers.Layer.Grid.prototype.mergeNewParams.apply(this, newArguments);
    },

    getFullRequestString: function (newParams, altUrl) {
        if (typeof this.params.TRANSPARENT == "boolean") {
            newParams.TRANSPARENT = this.params.TRANSPARENT ? "TRUE" : "FALSE";
        }
        return OpenLayers.Layer.Grid.prototype.getFullRequestString.apply(this, arguments);
    },

    CLASS_NAME: "Zondy.Map.Doc"
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Layer.js---------------------------------------------------------*/
Zondy.Map.Layer = OpenLayers.Class(OpenLayers.Layer.Grid, Zondy.Service.HttpRequest, {

    // An Array of String,一组需要叠加显示的图层gdbp
    gdbps: null,
    f: 'png',

    /// <summary>图层的显示样式。Zondy.Object.CDisplayStyleExtend类型的对象</summary>
    style: null,
    /// <summary>图层添加完成后执行的方法,类型为function</summary>
    layerAddCallBack: null,
    filters: null,
    singleTile: true,

    initialize: function (name, gdbps, options) {
        this.gdbps = gdbps;
        if (this.baseUrl == null)
            this.baseUrl = "igs/rest/mrms";
        if (this.partUrl == null)
            this.partUrl = "layers";
        OpenLayers.Util.extend(this, options);
        var url = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl + "/" + this.partUrl;

        var newArguments = [];
        var params = {};
        newArguments.push(name, url, params, {});
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);
    },

    getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var params = {};
        var imgSize = this.getImageSize();
        params.bbox = this.encodeBBOX ?
            bounds.toBBOX(null) :
            bounds.toArray();
        params.w = imgSize.w;
        params.h = imgSize.h;
        params.style = $.toJSON(this.style);
        params.filters = this.filters;

        var gdbpStr = '';
        $.each(this.gdbps, function (i, value) {
            gdbpStr += (',' + value);
        });
        params.gdbps = gdbpStr.substring(1, gdbpStr.length);
        params.r = Math.random().toFixed(3);
        return this.getFullRequestString(params);
    },

    CLASS_NAME: "Zondy.Map.Layer"
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------TileLayer.js---------------------------------------------------------*/
Zondy.Map.TileLayer = OpenLayers.Class(OpenLayers.Layer.Grid, Zondy.Service.HttpRequest, {

    fullExtent: null,
    /**
    * APIProperty: serviceVersion
    * {String}
    */
    serviceVersion: "1.0.0",

    /**
    * APIProperty: isBaseLayer 是否作为基础图层显示
    * {Boolean}
    */
    isBaseLayer: true,

    /**
    * APIProperty: tileOrigin 瓦片地图的显示原点
    * {<OpenLayers.LonLat>}
    */
    tileOrigin: null,

    /**
    * @public
    * @type {string}
    * 瓦片版本，是MapGIS 10裁图的新瓦片，还是MapGIS K9裁图的旧瓦片
    * 参数：eg：new表示采用MapGIS 10裁图的新瓦片；oldTile表示MapGIS K9裁图的旧瓦片。默认值是newTile。
    * modify by liuruoli 2015-11-11 将tileOriginType:"leftBottom"改为tileVersion:"newTile"
    */
    tileVersion: "newTile",
    //tileOriginType: "leftTop",

    /**
    * APIProperty: serverResolutions
    * {Array} A list of all resolutions available on the server.  Only set this 
    *     property if the map resolutions differs from the server.
    */
    serverResolutions: null,

    /**
    * APIProperty: zoomOffset
    * {Number} If your cache has more zoom levels than you want to provide
    *     access to with this layer, supply a zoomOffset.  This zoom offset
    *     is added to the current map zoom level to determine the level
    *     for a requested tile.  For example, if you supply a zoomOffset
    *     of 3, when the map is at the zoom 0, tiles will be requested from
    *     level 3 of your cache.  Default is 0 (assumes cache level and map
    *     zoom are equivalent).  Using <zoomOffset> is an alternative to
    *     setting <serverResolutions> if you only want to expose a subset
    *     of the server resolutions.
    */
    zoomOffset: 0,

    ///<summary>图层添加完成后执行的方法,类型为function</summary>
    layerAddCallBack: null,

    /// <summary>瓦片缓存名</summary>
    hdfName: null,

    /// <summary>是否压缩瓦片</summary>
    compress: false,

    /// <summary>压缩比例</summary>
    rate: 1.0,

    initialize: function (name, hdfName, options) {
        /// <summary>构造函数</summary>
        /// <param name="name" type="String">图层的显示名称</param>
        /// <param name="hdfName" type="String">hdf名</param>
        /// <param name="options" type="Object">属性赋值键值对</param>
        var newArguments = [];

        this.hdfName = hdfName;
        newArguments.push(name, null, {}, options);
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (this.baseUrl == null)
            this.baseUrl = "igs/rest/mrms";
        //================================modify by zl 删除调用setLevelExtent方法 2016/01/25======================
        // this.setLevelExtent();
    },

    destroy: function () {
        /// <summary>销毁此图层</summary>
        // for now, nothing special to do here. 
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
    },

    clone: function (obj) {
        /// <summary>克隆此图层</summary>
        if (obj == null) {
            obj = new Zondy.Map.TileLayer(this.name,
                                           this.hdfName,
                                           this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },

    getURL: function (bounds) {
        bounds = this.adjustBounds(bounds);
        var res = this.map.getResolution();
        var z = this.getZoomForResolution(res, true);
        //用于内部处理的开始级数以及zoomOffset if (this.map.isSucceedAutoConfig) {
        if (this.map.isSucceedAutoConfig && this.beginZoomLevel) {
            z = z + this.beginZoomLevel;
        } else {
            z = z + this.zoomOffset;
        }
        //用于当基础图层是矢量地图，覆盖图层是瓦片地图的时候；
        if (this.beginLevel) {
            z = z - this.beginLevel;
        }
        //============增加判断z<0时直接返回=================
        if (z < 0) {
            return;
        }
        var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
        var y;
        var latCenter = (this.map.maxExtent.top - this.map.maxExtent.bottom) / 2 + this.map.maxExtent.bottom;
        if (this.tileVersion == "newTile") {
            y = Math.round((this.tileOrigin.lat - bounds.top) / (res * this.tileSize.h)); //按MapGIS10裁图方式计算
        } else {
            y = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h)); //按MapGIS K9裁图方式计算
        }
        //=========modify by ZL 2016/01/11 增加了瓦片每一级的最大行列号和最小行列号，以便于判断当前计算的行列好是否在该范围内=======
        if (this.lod && this.lod.length > 0) {
            var lodIndex = z;
            if (this.map.isSucceedAutoConfig && this.beginZoomLevel) {
                lodIndex = lodIndex - this.beginZoomLevel;
            }
            var currentLod = this.lod[lodIndex];

            //=======增加了是否是动态裁图的瓦片进行判断 modify by ZL 2016/01/21=========
            if (this.cache != undefined && this.cache == true) {
                if (currentLod == undefined || currentLod == null || currentLod.StartRow == null || currentLod.EndRow == null || currentLod.StartCol == null || currentLod.EndCol == null) {
                    return;
                }
                if (y < currentLod.StartRow || y > currentLod.EndRow || x < currentLod.StartCol || x > currentLod.EndCol) {
                    return;
                }
            } else {
                if (currentLod == undefined || currentLod == null || currentLod.startRow == null || currentLod.endRow == null || currentLod.startCol == null || currentLod.endCol == null) {
                    return;
                }
                if (y < currentLod.startRow || y > currentLod.endRow || x < currentLod.startCol || x > currentLod.endCol) {
                    return;
                }
            }
        }
        //==========================================================================================================================
        var path = "/" + this.hdfName + "/" + z + "/" + y + "/" + x;
        var url = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl + "/" + "tile";
        return url + path;
    },

    setMap: function (map) {
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        //modify by zl 2015-11-11 修改了默认的瓦片地图的原点，若用户未设置原点，则内部自动赋值，以用户赋值为准
        if (this.tileOrigin == null) {
            if (this.tileVersion == "newTile") {
                this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.top);
            } else {
                this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.bottom);
            }
        }
    },

    //验证
    setLevelExtent: function () {
        var url = "http://" + this.ip + ":" + this.port + "/igs/rest/mrcs/tiles/" + this.hdfName + "?f=json";
        var thisTile = this;
        this.ajax(url, {}, function (data) {
            data = eval(data);
            if (data && data.tileInfo && data.tileInfo.lods && data.tileInfo.lods.length > 0) {//新版本瓦片信息
                for (var i = 0; i < data.tileInfo.lods.length; i++) {
                    if (data.tileInfo.lods[i] && data.tileInfo.lods[i].scale != 0) {
                        var minlevel = data.tileInfo.lods[0].level;
                        var maxLevel = data.tileInfo.lods[data.tileInfo.lods.length - 1].level;
                        if (thisTile.map) {
                            if (thisTile.map.zoom > maxLevel)
                                thisTile.map.zoom = maxLevel;
                            if (thisTile.map.zoom < minlevel)
                                thisTile.map.zoom = minlevel;
                        }
                        break;
                    }
                }
            }
            else {
                if (data.TileInfo1 && data.TileInfo1.BeginLevel && thisTile.map) {//旧瓦片
                    if (thisTile.map.zoom > data.TileInfo1.BeginLevel)
                        thisTile.map.zoom = data.TileInfo1.BeginLevel;
                }
            }
        });
    },

    CLASS_NAME: "Zondy.Map.TileLayer"
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------TianDiTuLayer.js---------------------------------------------------------*/
Zondy.Enum.TiandituType = {
    VEC: 'vector',         //天地图矢量数据
    IMG: 'raster',         //天地图影像数据
    CVA: 'vectorAnnotation',         //天地图矢量注记数据
    CIA: 'rasterAnnotation',         //天地图影像注记数据
    VEC_IGS: 'vector_igs', //天地图矢量数据(通过IGS)
    IMG_IGS: 'raster_igs', //天地图影像数据(通过IGS)
    CVA_IGS: 'vectorAnnotation_igs', //天地图矢量注记数据(通过IGS)
    CIA_IGS: 'rasterAnnotation_igs'  //天地图影像注记数据(通过IGS)
};
Zondy.Map.TianDiTuLayer = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
    * APIProperty: serviceVersion
    * {String}
    */
    serviceVersion: "1.0.0",

    /**
    * APIProperty: isBaseLayer
    * {Boolean}
    */
    isBaseLayer: true,

    /**
    * APIProperty: tileOrigin
    * {<OpenLayers.LonLat>}
    */
    tileOrigin: new OpenLayers.LonLat(-180, 90),

    ip: "localhost",

    port: "6163",

    //图层类型，默认为矢量图
    layerType: Zondy.Enum.TiandituType.VEC,

    //基础取图地址
    baseUrl: null,

    /**
    * APIProperty: resolutions
    * {Array} A list of all resolutions available on the server.  Only set this 
    *     property if the map resolutions differs from the server.
    */
    resolutions: [
        1.40625,
        0.703125,
        0.3515625,
        0.17578125,
        0.087890625,
        0.0439453125,
        0.02197265625,
        0.010986328125,
        0.0054931640625,
        0.00274658203125,
        0.001373291015625,
        0.0006866455078125,
        0.00034332275390625,
        0.000171661376953125,
        0.0000858306884765625,
        0.00004291534423828125,
        0.00002145767211914062,
        0.00001072883605957031,
        0.00000536441802978515
     ],

    /**
    * APIProperty: zoomOffset
    * {Number} If your cache has more zoom levels than you want to provide
    *     access to with this layer, supply a zoomOffset.  This zoom offset
    *     is added to the current map zoom level to determine the level
    *     for a requested tile.  For example, if you supply a zoomOffset
    *     of 3, when the map is at the zoom 0, tiles will be requested from
    *     level 3 of your cache.  Default is 0 (assumes cache level and map
    *     zoom are equivalent).  Using <zoomOffset> is an alternative to
    *     setting <serverResolutions> if you only want to expose a subset
    *     of the server resolutions.
    */
    zoomOffset: 1,

    imgUrls: [
                "http://t0.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t1.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t2.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t3.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t4.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t5.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t6.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t7.tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles"
            ],
    vecUrls: [
                "http://t0.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t1.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t2.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t3.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t4.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t5.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t6.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t7.tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles"
            ],
    cvaUrls: [
                "http://t0.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t1.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t2.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t3.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t4.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t5.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t6.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t7.tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles"
            ],
    ciaUrls: [
                "http://t0.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t1.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t2.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t3.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t4.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t5.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t6.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles",
                "http://t7.tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles"
            ],


    /// <summary>构造函数</summary>
    /// <param name="name" type="String">地图在浏览器上的显示名称</param>
    initialize: function (name, options) {
        /// <summary>构造函数</summary>
        /// <param name="name" type="String">地图在浏览器上的显示名称</param>
        $.extend(this, options);
        var newArguments = [];
        newArguments.push(name, {}, {});
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (this.baseUrl == null) {
            this.getBaseURL();
        }
    },

    destroy: function () {
        /// <summary>销毁此图层</summary>
        // for now, nothing special to do here. 
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
    },


    clone: function (obj) {
        /// <summary>克隆此图层</summary>
        if (obj == null) {
            /*将OpenLayers.Layer.TileLayer改为Zondy.Map.TianDiTuLayer
            *modify moveBy liuruoli 2015-11-11 */
            obj = new Zondy.Map.TianDiTuLayer(this.name, this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },


    getURL: function (bounds) {
        var res = this.map.getResolution();
        var l = this.resolutions != null ?
            OpenLayers.Util.indexOf(this.resolutions, res) + this.zoomOffset :
            this.map.getZoom() + this.zoomOffset;
        var d = 360 / Math.pow(2, l);
        var r = Math.round((90 - bounds.top) / d);
        var c = Math.round((bounds.left + 180) / d);


        switch (this.layerType) {
            case "vector":          //天地图矢量数据
            case "raster":        //天地图影像数据
            case "vectorAnnotation":            //天地图矢量注记数据
            case "rasterAnnotation":         //天地图影像注记数据
                return this.baseUrl + "&TILECOL=" + c + "&TILEROW=" + r + "&TILEMATRIX=" + l;
                break;
            case "vector_igs":      //天地图矢量数据(通过IGS)
            case "raster_igs":      //天地图影像数据(通过IGS)
            case "vectorAnnotation_igs":        //天地图矢量注记数据(通过IGS)
            case "rasterAnnotation_igs":      //天地图影像注记数据(通过IGS)
                return this.baseUrl + c + "/" + r + "/" + l;
                break;
        }
    },

    getBaseURL: function () {
        var m = parseInt(Math.random() * 8);
        switch (this.layerType) {
            case "vector":          //天地图矢量数据
                this.baseUrl = this.vecUrls[m];
                break;
            case "raster":        //天地图影像数据
                this.baseUrl = this.imgUrls[m];
                break;
            case "vectorAnnotation":            //天地图矢量注记数据
                this.baseUrl = this.cvaUrls[m];
                break;
            case "rasterAnnotation":         //天地图影像注记数据
                this.baseUrl = this.ciaUrls[m];
                break;
            case "vector_igs":      //天地图矢量数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/tianditu" + "/vector/";
                break;
            case "raster_igs":      //天地图影像数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/tianditu" + "/raster/";
                break;
            case "vectorAnnotation_igs":        //天地图矢量注记数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/tianditu" + "/vectorAnno/";
                break;
            case "rasterAnnotation_igs":      //天地图影像注记数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/tianditu" + "/rasterAnno/";
                break;
        }
    },

    setMap: function (map) {
        if (map != null && this.resolutions != null && this.isBaseLayer) {
            if (map.numZoomLevels && map.numZoomLevels < (this.resolutions.length - this.zoomOffset)) {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.zoomOffset + map.numZoomLevels);
            } else {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.resolutions.length);
            }

            map.resolutions = this.resolutions;
            map.maxResolution = this.resolutions[0];

        }

        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) {
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.top);
        }
    },

    CLASS_NAME: "Zondy.Map.TianDiTuLayer"
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------GoogleLayer.js---------------------------------------------------------*/
Zondy.Enum.GoogleLayerType = {
    VEC: 'vector',            //Google矢量数据
    RASTER: 'raster',         //Google影像数据
    ROAD: 'road',             //Google道路数据
    TERRAIN: 'terrain',       //Google地形数据
    VEC_IGS: 'vector_igs',    //Google矢量数据(通过IGS)
    RASTER_IGS: 'raster_igs', //Google影像数据(通过IGS)
    ROAD_IGS: 'road_igs',     //Google道路数据(通过IGS)
    TERRAIN_IGS: 'terrain_igs'//Google地形数据(通过IGS)
};
Zondy.Map.GoogleLayer = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
    * APIProperty: serviceVersion
    * {String}
    */
    serviceVersion: "1.0.0",

    //是否是基图层
    isBaseLayer: true,

    ip: "localhost",

    port: "6163",

    /**
    * APIProperty: tileOrigin
    * {<OpenLayers.LonLat>}
    */
    tileOrigin: new OpenLayers.LonLat(-20037508.34, 20037508.34),

    //图层类型，默认为矢量图
    layerType: Zondy.Enum.GoogleLayerType.VEC,

    //基础取图地址
    baseUrl: null,
    //===============modify by zl 2016/05/05================
    //分辩率组
    resolutions: null,
    //地图显示的起始级别
    zoomOffset: 0,
    //======================================================

    /// <summary>构造函数</summary>
    /// <param name="name" type="String">地图在浏览器上的显示名称</param>
    initialize: function (name, options) {
        $.extend(this, options);
        var url = this.url;
        var newArguments = [];
        newArguments.push(name, url, {}, {});
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (this.baseUrl == null) {
            this.getBaseURL();
        }
    },

    //获取google基础取图地址
    getBaseURL: function () {
        switch (this.layerType) {
            case "vector":          //Google矢量数据
                this.baseUrl = "http://mt2.google.cn/vt/lyrs=m@207000000&hl=zh-CN&gl=CN&src=app&s=Galile";
                break;
            case "raster":        //Google影像数据
                this.baseUrl = "http://mt1.google.cn/vt?lyrs=s@172&hl=zh-Hans-CN&gl=CN";
                break;
            case "road":            //Google道路数据
                this.baseUrl = "http://mt1.google.cn/vt/lyrs=h@207000000&hl=zh-CN&src=app&s=G";
                break;
            case "terrain":         //Google地形数据
                this.baseUrl = "http://mt0.google.cn/vt/lyrs=t@130,r@207000000&hl=zh-CN&src=app&s=Galileo";
                break;
            case "vector_igs":      //Google矢量数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/google" + "/vector/";
                break;
            case "raster_igs":      //Google影像数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/google" + "/raster/";
                break;
            case "road_igs":        //Google道路数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/google" + "/road/";
                break;
            case "terrain_igs":      //Google地形数据(通过IGS)
                this.baseUrl = "http://" + this.ip + ":" + this.port + "/igs/rest/cts/google" + "/terrain/";
                break;
        }
    },

    /// <summary>获取google瓦片地址</summary>
    getURL: function (bounds){ 
        //===============modify by zl 2016/05/05================
        var z = this.map.getZoom() + this.zoomOffset;
        //======================================================
        var res = this.map.getResolution();
        var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
        var lat = this.maxExtent.top - bounds.top;
        var y = Math.round(lat / (res * this.tileSize.h));

        var urlTemplate = "";
        switch (this.layerType) {
            case "vector":
            case "raster":
            case "road":
            case "terrain":
                urlTemplate = this.baseUrl + "&x=" + x + "&y=" + y + "&z=" + z;
                break;
            case "vector_igs":
            case "raster_igs":
            case "road_igs":
            case "terrain_igs":
                urlTemplate = this.baseUrl + x + "/" + y + "/" + z;
                break;
        }

        return urlTemplate;
    },

    setMap: function (map) {
        //===============modify by zl 2016/05/05================
        if (map != null && this.isBaseLayer) {
            map.maxExtent = new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34);
            var maxResolution = (map.maxExtent.right - map.maxExtent.left) / 256;
            this.resolutions = [];
            if (map.numberlevels == null || map.numberlevels == undefined) {
                map.numberlevels = 16;
            }
            for (var i = 0; i < map.numberlevels; i++) {
                this.resolutions.push(maxResolution / Math.pow(2, i));
            }

            if (map.numZoomLevels && map.numZoomLevels < (this.resolutions.length - this.zoomOffset)) {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.zoomOffset + map.numZoomLevels);
            } else {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.resolutions.length);
            }
            map.resolutions = this.resolutions;
            map.maxResolution = this.resolutions[0];
        }
        //==========================================================
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) {
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.top);
        }
    },

    /// <summary>销毁此图层</summary>
    destroy: function () {
        // 销毁基类
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
    },

    /// <summary>克隆此图层</summary>
    clone: function (obj) {
        if (obj == null) {
            /*将OpenLayers.Layer.TileLayer类改为Zondy.Map.GoogleLayer   
            *modify by liuruoli 2015-11-05 
            */
            obj = new Zondy.Map.GoogleLayer(this.name,
                                           this.url,
                                           this.getOptions());
        }
        //深度克隆
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
        return obj;
    },

    CLASS_NAME: "Zondy.Map.GoogleLayer"
});
/*--------------------------------------------------------------------------------------------------------------------------*/


/*---------------------------------------------------------BaiduLayer.js---------------------------------------------------------*/
Zondy.Enum.BaiduLayerType = {
    VEC: 'vector',         //百度矢量数据
    RASTER: 'raster',         //百度影像数据
    ROAD: 'road'           //百度道路数据
};
Zondy.Map.BaiduLayer = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
    * APIProperty: serviceVersion
    * {String}
    */
    serviceVersion: "1.0.0",

    //是否是基图层
    isBaseLayer: true,

    ip: "localhost",

    port: "6163",

    /**
    * APIProperty: tileOrigin
    * {<OpenLayers.LonLat>}
    */
    tileOrigin: new OpenLayers.LonLat(0, 0),

    //图层类型，默认为矢量图
    layerType: Zondy.Enum.BaiduLayerType.VEC,

    //基础取图地址
    baseUrl: null,

    //===============modify by zl 2016/05/05================
    //分辩率组
    resolutions: null,
    //地图显示的起始级别
    zoomOffset: 3,
    //======================================================

    /// <summary>构造函数</summary>
    /// <param name="name" type="String">地图在浏览器上的显示名称</param>
    initialize: function (name, options) {
        $.extend(this, options);
        var url = this.url;
        var newArguments = [];
        newArguments.push(name, url, {}, {});
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (this.baseUrl == null) {
            this.getBaseURL();
        }
    },

    //获取百度基础取图地址
    getBaseURL: function () {
        switch (this.layerType) {
            case "vector":          //矢量数据
                this.baseUrl = "http://online2.map.bdimg.com/tile/?qt=tile&styles=pl&udt=20141219&scaler=1";
                break;
            case "raster":          //影像数据
                break;
            case "road":            //道路数据
                this.baseUrl = "http://online2.map.bdimg.com/tile/?qt=tile&styles=sl&v=071&udt=20150521";
                break;
        }
    },

    getURL: function (bounds) {
        //===============modify by zl 2016/05/05================
        var z = this.map.getZoom() + this.zoomOffset;
        //======================================================
        var res = this.map.getResolution();
        var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
        var y = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h)); //按左下角为原点计算

        var urlTemplate = "";
        switch (this.layerType) {
            case "vector":          //矢量数据
            case "road":            //道路数据
                urlTemplate = this.baseUrl + "&x=" + x + "&y=" + y + "&z=" + z;
                break;
            case "raster":          //影像数据
                /* modify by liuruoli 2015-11-16
                * 根据百度地图计算规则，当x,y<0时，x,y的值用M*表示。
                */
                if (x == -1)
                    x = "M1";
                else if (x == -2) {
                    x = "M2";
                }
                else if (x == -3) {
                    x = "M3";
                } else if (x == -4) {
                    x = "M4";
                }

                if (y == -1)
                    y = "M1";
                else if (y == -2) {
                    y = "M2";
                }
                else if (y == -3) {
                    y = "M3";
                } else if (y == -4) {
                    y = "M4";
                }
                urlTemplate = "http://shangetu1.map.bdimg.com/it/u=x=" + x + ";y=" + y + ";z=" + z + ";v=009;type=sate&fm=46&udt=20150504";
                break;
        }

        return urlTemplate;
    },

    setMap: function (map) {
        //===============modify by zl 2016/05/05================
        if (map != null && this.isBaseLayer) {
            map.maxExtent = new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34);
            var maxResolution = (map.maxExtent.right - map.maxExtent.left) / 256;
            this.resolutions = [];
            if (map.numberlevels == null || map.numberlevels == undefined) {
                map.numberlevels = 16;
            }
            for (var i = 0; i < map.numberlevels; i++) {
                this.resolutions.push(maxResolution / Math.pow(2, i));
            }

            if (map.numZoomLevels && map.numZoomLevels < (this.resolutions.length - this.zoomOffset)) {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.zoomOffset + map.numZoomLevels);
            } else {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.resolutions.length);
            }
            map.resolutions = this.resolutions;
            map.maxResolution = this.resolutions[0];
         }
        //==========================================================

        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) {
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.bottom);
        }
    },

    /// <summary>销毁此图层</summary>
    destroy: function () {
        // 销毁基类
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
    },

    /// <summary>克隆此图层</summary>
    clone: function (obj) {
        if (obj == null) {
            obj = new Zondy.Map.BaiduLayer(this.name,
                                           this.url,
                                           this.getOptions());
        }
        //深度克隆
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
        return obj;
    },

    CLASS_NAME: "Zondy.Map.BaiduLayer"
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------GaodeLayer.js---------------------------------------------------------*/
Zondy.Map.GaodeLayer = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
    * APIProperty: serviceVersion
    * {String}
    */
    serviceVersion: "1.0.0",

    //是否是基图层
    isBaseLayer: true,

    ip: "localhost",

    port: "6163",

    resolutions: [
                    156543.033928039,
                    78271.5169640196,
                    39135.7584820098,
                    19567.8792410049,
                    9783.93962050244,
                    4891.96981025122,
                    2445.98490512561,
                    1222.99245256281,
                    611.496226281403,
                    305.748113140701,
                    152.874056570351,
                    76.4370282851753,
                    38.2185141425877,
                    19.1092570712938,
                    9.55462853564692,
                    4.77731426782346,
                    2.38865713391173,
                    1.19432856695586,
                    0.597164283477932

    ],


    /**
    * APIProperty: tileOrigin
    * {<OpenLayers.LonLat>}
    */
    tileOrigin: new OpenLayers.LonLat(-20037508.342789, 20037508.342789),

    //图层类型，默认为矢量图
    //layerType: "vector",

    //基础取图地址
    baseUrl: null,

    //初始显示级数
    zoomOffset: 1,

    initialize: function (name, options) {
        $.extend(this, options);
        var url = this.url;
        var newArguments = [];
        newArguments.push(name, url, {}, {});
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (this.baseUrl == null) {
            var urlTemplate = [
                "http://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7",
                "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7",
                "http://webrd03.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7",
                "http://webrd04.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7"
			];

            if (OpenLayers.Util.isArray(urlTemplate)) {
                var serverNo = parseInt(Math.random(0, urlTemplate.length));
                this.baseUrl = urlTemplate[serverNo];

            } else {
                this.baseUrl = urlTemplate;
            }
        }
    },

    getURL: function (bounds) {
        var res = this.map.getResolution();
        //增加了判断超出范围的不显示
        if (bounds.left >= map.maxExtent.right || bounds.top <= map.maxExtent.bottom) {
            return null;
        }

        var x = Math.round((bounds.left - this.tileOrigin.lon) / (256 * res));
        var y = y = Math.round((this.tileOrigin.lat - bounds.top) / (256 * res));

        var z = this.map.getZoom();
        if (Math.abs(this.resolutions[z] - res) > 0.0000000000000000001) {
            for (var i = 0; i < this.resolutions.length; i++) {
                if (Math.abs(this.resolutions[i] - res) <= 0.0000000000000000001) {
                    z = i;
                    break;
                }
            }
        }
        z = z + this.zoomOffset;
        return this.baseUrl + "&z=" + z + '&y=' + y + '&x=' + x;
    },

    setMap: function (map) {
        if (map != null && this.resolutions != null && this.isBaseLayer) {
            map.maxExtent = new OpenLayers.Bounds(-20037508.342789, -20037508.342789, 20037508.342789, 20037508.342789);
            if (map.numZoomLevels && map.numZoomLevels < (this.resolutions.length - this.zoomOffset)) {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.zoomOffset + map.numZoomLevels);
            } else {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.resolutions.length);
            }
            map.resolutions = this.resolutions;
            map.maxResolution = this.resolutions[0];
        }

        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) {
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.top);
        }
    },

    /// <summary>销毁此图层</summary>
    destroy: function () {
        // 销毁基类
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
    },

    /// <summary>克隆此图层</summary>
    clone: function (obj) {
        if (obj == null) {
            obj = new Zondy.Map.GaodeLayer(this.getOwnPropertyNames, this.url, this.getOptions());
        }
        //深度克隆
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
        return obj;
    },

    CLASS_NAME: "Zondy.Map.GaodeLayer"
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ArcGISLayer.js---------------------------------------------------------*/
Zondy.Enum.ArcGISLayerType = {
    ImageryWorld2D: 'ESRI_Imagery_World_2D',
    StreetMapWorld2D: 'ESRI_StreetMap_World_2D',
    TopoUS2D: 'NGS_Topo_US_2D',
    WorldImagery: 'World_Imagery',
    WorldPhysical: 'World_Physical_Map',
    WorldShadedRelief: 'World_Shaded_Relief',
    WorldStreet: 'World_Street_Map',
    WorldTerrainBase: 'World_Terrain_Base',
    WorldTopo: 'World_Topo_Map',
    NatGeoWorldMap: 'NatGeo_World_Map',
    OceanBasemap: 'Ocean_Basemap',
    USATopoMaps: 'USA_Topo_Maps'
};

Zondy.Map.ArcGISLayer = OpenLayers.Class(OpenLayers.Layer.Grid, {

    /**
    * APIProperty: serviceVersion
    * {String}
    */
    serviceVersion: "1.0.0",

    //是否是基图层
    isBaseLayer: true,

    ip: "localhost",

    port: "6163",

    /**
    * APIProperty: tileOrigin
    * {<OpenLayers.LonLat>}
    */
    tileOrigin: null,

    //图层类型，默认为"ESRI_Imagery_World_2D"
    layerType: Zondy.Enum.ArcGISLayerType.WorldImagery,

    //基础取图地址
    baseUrl: null,

    //===============modify by zl 2016/05/05================
    //分辩率数组
    resolutions: null,

    //地图显示的起始级别
    zoomOffset: 0,
    //======================================================


    /// <summary>构造函数</summary>
    /// <param name="name" type="String">地图在浏览器上的显示名称</param>
    initialize: function (name, options) {
        $.extend(this, options);
        var url = this.url;
        var newArguments = [];
        newArguments.push(name, url, {}, {});
        OpenLayers.Layer.Grid.prototype.initialize.apply(this, newArguments);

        if (this.baseUrl == null) {
            this.baseUrl = "http://services.arcgisonline.com/ArcGIS/rest/services/";
        }
    },

    getURL: function (bounds) {
        //===============modify by zl 2016/05/05================
        var z = this.map.getZoom() + this.zoomOffset;
        //======================================================
        //var z = this.map.getZoom();
        var res = this.map.getResolution();
        var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
        var y = Math.round((this.tileOrigin.lat - bounds.top) / (res * this.tileSize.h)); //按MapGIS10裁图方式计算

        var urlTemplate = this.baseUrl + this.layerType + "/MapServer/tile/" + z + "/" + y + "/" + x + ".jpg";

        return urlTemplate;
    },

    setMap: function (map) {
        //===============modify by zl 2016/05/05================
        //根据不同参考系数据类型设置其范围
        switch (this.layerType) {
            case "World_Imagery":
            case "World_Physical_Map":
            case "World_Shaded_Relief":
            case "World_Street_Map":
            case "World_Terrain_Base":
            case "World_Topo_Map":
            case "NatGeo_World_Map":
            case "Ocean_Basemap":
            case "USA_Topo_Maps":
                map.maxExtent = new OpenLayers.Bounds(-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892);
                break;
            case "ESRI_Imagery_World_2D":
            case "ESRI_StreetMap_World_2D":
            case "NGS_Topo_US_2D":            
                map.maxExtent = new OpenLayers.Bounds(-180, -90, 180, 90);
                break;
        }
        //设置地图显示的分辨率
        if (map != null && this.isBaseLayer) {
            var maxResolution = (map.maxExtent.top - map.maxExtent.bottom) / 256;
            this.resolutions = [];
            if (map.numberlevels == null || map.numberlevels == undefined) {
                map.numberlevels = 16;
            }
            for (var i = 0; i < map.numberlevels; i++) {
                this.resolutions.push(maxResolution / Math.pow(2, i));
            }

            if (map.numZoomLevels && map.numZoomLevels < (this.resolutions.length - this.zoomOffset)) {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.zoomOffset + map.numZoomLevels);
            } else {
                this.resolutions = this.resolutions.slice(this.zoomOffset, this.resolutions.length);
            }
            map.resolutions = this.resolutions;
            map.maxResolution = this.resolutions[0];
        }
        //==========================================================
        //设置瓦片原点
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) {
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.top);
        }
    },

    /// <summary>销毁此图层</summary>
    destroy: function () {
        // 销毁基类
        OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
    },

    /// <summary>克隆此图层</summary>
    clone: function (obj) {
        if (obj == null) {
            obj = new Zondy.Map.ArcGISLayer(this.name,
                                           this.url,
                                           this.getOptions());
        }
        //深度克隆
        obj = OpenLayers.Layer.Grid.prototype.clone.apply(this, [obj]);
        return obj;
    },

    CLASS_NAME: "Zondy.Map.ArcGISLayer"
});

/*----------------------------------------------------------------------------------------------------------------------------*/
/*modify by liuruoli 2015-11-29*/
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------SoGouLayer.js---------------------------------------------------------*/
Zondy.Enum.SoGouLayerType = {
    VEC: 'vector',         //搜狗矢量数据
    RASTER: 'raster'       //搜狗影像数据
};

Zondy.Map.SoGouLayer = OpenLayers.Class(OpenLayers.Layer.Grid, {
    //图层类型，默认为矢量图
    layerType: Zondy.Enum.SoGouLayerType.VEC,

    //基础取图地址
    baseUrl: null,

    //分辨率数组
    resolutions: null,

    initialize: function (name, options) {
        var tempoptions = OpenLayers.Util.extend({
            'format': 'image/png',
            isBaseLayer: true
        }, options);
        var url = this.url;
        var newArguments = [];
        newArguments.push(name, url, {}, tempoptions);
        OpenLayers.Layer.TileCache.prototype.initialize.apply(this, newArguments);

        this.extension = this.format.split('/')[1].toLowerCase();
        this.extension = (this.extension == 'jpg') ? 'jpeg' : this.extension;
        this.transitionEffect = "resize";
        this.buffer = 0;

        if (this.baseUrl == null) {
            this.getBaseUrl();
        }
    },

    getBaseUrl: function () {
        switch (this.layerType) {
            case "vector":          //矢量数据
                var urlTemplate = [
                "http://p0.go2map.com/seamless1/0/174/",
                "http://p1.go2map.com/seamless1/0/174/",
                "http://p2.go2map.com/seamless1/0/174/",
                "http://p3.go2map.com/seamless1/0/174/"];
                break;
            case "raster":            //卫星影像数据
                var urlTemplate = [
                "http://hbpic1.go2map.com/seamless/0/180/"];
                break;
        }
        if (OpenLayers.Util.isArray(urlTemplate)) {
            var serverNo = parseInt(Math.random(0, urlTemplate.length));
            this.baseUrl = urlTemplate[serverNo];

        } else {
            this.baseUrl = urlTemplate;
        }
    },
    /**
    * 按地图引擎切图规则实现的拼接方式
    */
    getURL: function (bounds) {
        var tilez = this.map.zoom - 1;
        var offsetX = Math.pow(2, tilez);
        var offsetY = offsetX - 1;
        var res = this.map.getResolution();
        var bbox = this.map.getMaxExtent();
        var size = this.tileSize;
        var bx = Math.round((bounds.left - bbox.left) / (res * size.w));
        var by = Math.round((bbox.top - bounds.top) / (res * size.h));
        var numX = bx - offsetX;
        var numY = (-by) + offsetY;
        tilez = tilez + 1;
        var zoomLevel = 729 - tilez ;
        if (zoomLevel == 710) zoomLevel = 792;
        var blo = Math.floor(numX / 200);
        var bla = Math.floor(numY / 200);
        var blos, blas;
        if (blo < 0)
            blos = "M" + (-blo);
        else
            blos = "" + blo;
        if (bla < 0)
            blas = "M" + (-bla);
        else
            blas = "" + bla;
        var x = numX.toString().replace("-", "M");
        var y = numY.toString().replace("-", "M");
        var strURL = "";
        switch (this.layerType) {
            case "vector":          //矢量数据
                strURL = this.baseUrl + zoomLevel + "/" + blos + "/" + blas + "/" + x + "_" + y + ".GIF";
                break;
            case "raster":          //卫星影像数据
                strURL = this.baseUrl + zoomLevel + "/" + blos + "/" + blas + "/" + x + "_" + y + ".JPG";
                break;
        }
        return strURL;
    },
    setMap: function (map) {
        //===============modify by zl 2016/05/05================
        if (map != null && this.isBaseLayer) {
            map.maxExtent = new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34);
        }
        //==========================================================
        OpenLayers.Layer.Grid.prototype.setMap.apply(this, arguments);
        if (!this.tileOrigin) {
            this.tileOrigin = new OpenLayers.LonLat(this.map.maxExtent.left, this.map.maxExtent.top);
        }
    },
    clone: function (obj) {
        if (obj == null) {
            obj = new Zondy.Map.SoGouLayer(this.name, this.url, this.options);
        }
        obj = OpenLayers.Layer.TileCache.prototype.clone.apply(this, [obj]);
        return obj;
    },
    CLASS_NAME: "Zondy.Map.SoGouLayer"
});

/*---------------------------------------------------------AnyLine.js---------------------------------------------------------*/

Zondy.Object.AnyLine = OpenLayers.Class({

    /// <summary>{Array},一组{Zondy.Object.Arc}类型</summary>
    Arcs: null,

    initialize: function (arcs) {
        /// <summary>构造函数</summary>
        /// <param name="arcs" type="Array,Zondy.Object.Arc in an Array">一组Zondy.Object.Arc，用以描述弧段</param>
        this.Arcs = arcs;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Arc.js---------------------------------------------------------*/


Zondy.Object.Arc = OpenLayers.Class({
    /// <summary>描述一个弧段</summary>

    /// <summary>表示一个弧段的ID编号，不需要为其赋值</summary>
    ArcID: 0,

    /// <summary>{Array},一组{Zondy.Object.Point2D}类型</summary>
    Dots: null,

    initialize: function (dots) {
        /// <summary>构造函数</summary>
        /// <param name="dots" type="Array,Zondy.Object.Point2D in an Array">一组点用以构造弧段</param>
        this.Dots = dots;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------FeatureGraphicBase.js---------------------------------------------------------*/
Zondy.Object.FeatureGraphicBase = OpenLayers.Class({

    GID: 0,

    initialize: function () {
    },

    setGID: function (id) {
        /// <summary>设置此类的id</summary>
        /// <param name="id" type="Interger">id号</param>
        this.GID = id;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------GLine.js---------------------------------------------------------*/
Zondy.Object.GLine = OpenLayers.Class(Zondy.Object.FeatureGraphicBase, {

    /// <summary>{Zondy.Object.AnyLine}类型</summary>
    Line: null,

    initialize: function (line) {
        /// <summary>构造函数</summary>
        /// <param name="line" type="Zondy.Object.AnyLine">构造GLine的参数</param>s
        this.Line = line;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------GRegion.js---------------------------------------------------------*/
Zondy.Object.GRegion = OpenLayers.Class(Zondy.Object.FeatureGraphicBase, {

    /// <summary>Array,Zondy.Object.AnyLine in an Array</summary>
    Rings: null,

    initialize: function (rings) {
        /// <summary>构造函数</summary>
        /// <param name="rings" type="Array,Zondy.Object.AnyLine in an Array">一组AnyLine</param>
        this.Rings = rings;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CAttDataRow.js---------------------------------------------------------*/


Zondy.Object.CAttDataRow = OpenLayers.Class({


    FID: 0,
    Values: null,

    initialize: function (values, fid) {
        /// <summary>构造函数</summary>
        /// <param name="values" type="Array,String in an Array">属性数据</param>
        /// <param name="fid" type="Interger">要素的ID</param>
        this.FID = fid;
        this.Values = values;
    }
}
);
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CAttStruct.js---------------------------------------------------------*/


Zondy.Object.CAttStruct = OpenLayers.Class({


    /// <summary>
    /// 属性名
    /// Array,String in an Array
    ///</summary>
    FldName: null,

    /// <summary>
    /// 属性个数
    /// Interger
    ///</summary>
    FldNumber: 0,


    /// <summary>
    /// 属性类型数组
    /// Array,String in an Array
    /// Type: string,boolean,double,integer,long,short,datetime,time,stamp
    ///</summary>
    FldType: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性字段赋值对象</param>
        $.extend(this, options); //扩展属性的函数
    }
}
);
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CLineInfo.js---------------------------------------------------------*/

Zondy.Object.CLineInfo = OpenLayers.Class({

    /// <summary>定义线要素的相关参数</summary>

    /// <summary>线颜色</summary>
    Color: 1,

    /// <summary>线型ID</summary>
    LinStyleID: 1,

    /// <summary>辅助线型ID</summary>
    LinStyleID2: 0,

    /// <summary>线宽度</summary>
    LinWidth: 1,

    /// <summary>x比例系数</summary>
    Xscale: 1,

    /// <summary>y比例系数</summary>
    Yscale: 1,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>

        OpenLayers.Util.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CPointInfo.js---------------------------------------------------------*/

Zondy.Object.CPointInfo = OpenLayers.Class({
    /// <summary>定义点要素的相关参数</summary>

    /// <summary>子图角度</summary>
    Angle: 1,

    /// <summary>子图颜色</summary>
    Color: 1,

    /// <summary>子图高度</summary>
    SymHeight: 1,

    /// <summary>子图ID</summary>
    SymID: 1,

    /// <summary>子图宽度</summary>
    SymWidth: 1,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>

        OpenLayers.Util.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CRegionInfo.js---------------------------------------------------------*/

Zondy.Object.CRegionInfo = OpenLayers.Class({
    /// <summary>定义线要素的相关参数</summary>

    /// <summary>结束填充色</summary>
    EndColor: 1,

    /// <summary>填充颜色</summary>
    FillColor: 1,

    /// <summary>填充模式</summary>
    FillMode: 0,

    /// <summary>填充图案笔宽</summary>
    OutPenWidth: 1,

    /// <summary>填充图案角度</summary>
    PatAngle: 1,

    /// <summary>填充图案颜色</summary>
    PatColor: 1,

    /// <summary>填充图案高度</summary>
    PatHeight: 1,

    /// <summary>填充图案ID</summary>
    PatID: 1,

    /// <summary>填充图案宽度</summary>
    PatWidth: 1,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>

        OpenLayers.Util.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CGDBInfo.js---------------------------------------------------------*/
Zondy.Object.CGDBInfo = OpenLayers.Class({
    /// <summary>表示一个GDB的相关信息</summary>

    GDBName: null, //数据库名称
    GDBSvrName: null, //数据源名称
    Password: null, //除MapGISLocal数据源，其它的都设置
    User: null, //除MapGISLocal数据源，其它的都设置

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性字段赋值对象/param>
        $.extend(this, options);
    }
});


/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CGetImageBySRSID.js---------------------------------------------------------*/

Zondy.Object.CGetImageBySRSID = OpenLayers.Class({
    /// <summary>取图投影参数信息</summary>

    /// <summary>Zondy.Object.CGDBInfo</summary>
    GdbInfo: null,

    /// <summary>投影参数ID</summary>
    SRSID: -1,

    initialize: function (srsID, gdbInfo) {
        /// <summary>构造函数</summary>
        /// <param name="srsID" type="Interger">投影ID</param>
        /// <param name="gdbInfo" type="Zondy.Object.CGDBInfo">投影系数的GDB信息</param>
        this.GdbInfo = gdbInfo;
        this.SRSID = srsID;
    }

});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------DynShowStyle.js---------------------------------------------------------*/

Zondy.Object.DynShowStyle = OpenLayers.Class({

    /// <summary>透明度</summary>
    Alpha: 0,

    /// <summary>是否使用错误处理符号</summary>
    BugSpare: false,

    /// <summary>是否自绘驱动</summary>
    CustomRender: false,

    /// <summary>
    /// String
    /// 自绘驱动路径设置
    /// </summary>
    CustomRenderPath: null,

    /// <summary>显示的线方向线符号(只适用于其颜色)</summary>
    DirectionLineClr: 0,

    /// <summary>是否动态注记</summary>
    DynNoteFlag: false,


    /// <summary>
    ///  动态注记参数
    /// Zondy.Object.CDynNoteInfo
    /// </summary>
    DynNoteInfo: null,

    /// <summary>
    ///  Zondy.Enum.ISShowArc,枚举类型
    ///   是否显示填充区域的弧段
    /// </summary>
    IsShowArc: 0,

    /// <summary>是否显示线方向</summary>
    ISShowLineDirection: false,

    /// <summary>
    ///  显示的弧段样式(只适用于其颜色)
    /// Zondy.Object.CLineInfo
    /// </summary>
    LineInfo: null,

    /// <summary>最大显示比率</summary>
    MaxScale: 0.00,

    /// <summary>最小显示比率</summary>
    MinScale: 0.00,

    /// <summary>显示坐标点</summary>
    ShowCoordPnt: false,

    /// <summary>
    /// Zondy.Object.CLineInfo
    ///  错误处理线符号
    ///</summary>
    SpareLineInfo: null,


    /// <summary>
    ///  错误处理点符号
    ///  Zondy.Object.CPointInfo
    /// </summary>
    SparePointInfo: null,



    /// <summary>
    ///  错误处理区符号
    /// Zondy.Object.CRegionInfo
    ///</summary>
    SpareRegInfo: null,

    /// <summary>符号显示比例</summary>
    SymbleScale: 0.00,


    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------LabelLinInfo.js---------------------------------------------------------*/


Zondy.Object.LabelLinInfo = OpenLayers.Class({

    /// <summary> 不完全注记</summary>
    ClientOutLabel: false,

    /// <summary>偏离线约束 偏移线的距离</summary>
    DistFromLine: 0.00,

    /// <summary>Zondy.Enum.LineConstrain,枚举类型,偏离线约束</summary>
    FromLineConstrain: 0,

    /// <summary>线重复注记 每段的长度</summary>
    Interval: 0.00,

    /// <summary>Zondy.Enum.LabelLinType,枚举类型, 线方位</summary>
    LinType: 0,

    /// <summary>Zondy.Enum.RepeatType,枚举类型,线重复注记策略</summary>
    Repeat: 0,

    /// <summary>Zondy.Enum.LabelSpreadType,枚举类型,注记分布的策略</summary>
    SpreadType: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------LabelPntInfo.js---------------------------------------------------------*/



Zondy.Object.LabelPntInfo = OpenLayers.Class({
    /// <summary>点任意方位的角度值，Array,Double in an Array</summary>
    Ang: null,

    /// <summary>不完全注记</summary>
    ClientOutLabel: false,

    /// <summary>偏移距离，单位为像素</summary>
    Distance: 0.00,

    /// <summary>点八方位注记类型，Array,Zondy.Enum.EightDirType in an Array</summary>
    EightDirLableType: null,

    /// <summary>点方位，Zondy.Enum.LabelPntType</summary>
    PntType: 0,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------LabelRegInfo.js---------------------------------------------------------*/


Zondy.Object.LabelRegInfo = OpenLayers.Class({
    /// <summary>区方位属性</summary>

    /// <summary>不完全注记</summary>
    ClientOutLabel: false,

    /// <summary>
    ///是否尝试水平注记微小区
    /// short
    ///</summary>
    LabelMiniRegion: 0,

    /// <summary>
    ///  自适应策略 区内不能注记时，是否可以注记在外部
    ///  short
    /// </summary>
    MayPlaceOutside: 0,

    /// <summary>
    ///  微小区最大面积
    ///  short
    /// </summary>
    MiniRegionArea: 0,

    /// <summary>区域外注记时，注记偏移的距离</summary>
    Offset: 0.00,

    /// <summary>区方位，Zondy.Enum.LabelRegType,枚举类型</summary>
    RegType: 0,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CDisplayStyle.js---------------------------------------------------------*/


Zondy.Object.CDisplayStyle = OpenLayers.Class({
    /// <summary>地图显示参数</summary>

    /// <summary>注记符号大小固定</summary>
    AnnSizeFixed: false,

    /// <summary>图像质量。可选值为：1（低）、2（中）、3（高）</summary>
    DriverQuality: 0,

    /// <summary>是否动态投影</summary>
    DynProjFlag: false,

    /// <summary>符号是否跟随显示放大（该属性已过时，请使用各个要素类的大小固定及线宽固定）</summary>
    FollowScale: false,

    /// <summary>线状符号线宽固定</summary>
    LinPenWidFixed: false,

    /// <summary>线状符号大小固定</summary>
    LinSizeFixed: false,

    /// <summary>点状符号线宽固定</summary>
    PntPenWidFixed: false,

    /// <summary>点状符号大小固定</summary>
    PntSizeFixed: false,

    /// <summary>填充符号线宽固定</summary>
    RegPenWidFixed: false,

    /// <summary> 填充符号大小固定</summary>
    RegSizeFixed: false,

    /// <summary>显示坐标点</summary>
    ShowCoordPnt: false,

    /// <summary>显示元素的外包矩形</summary>
    ShowElemRect: false,

    /// <summary>
    ///     图层显示参数
    ///     Array,Zondy.Object.DynShowStyle in Array，每个数组元素依次对应一个图层的DynShowStyle，如果相应的图层显示参数不需更新，请设置相应位置的数组元素值为null
    /// </summary>
    ShowStyle: null,

    /// <summary>是否进行还原显示</summary>
    SymbleShow: false,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性字段赋值对象</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CDisplayStyleExtend.js---------------------------------------------------------*/

Zondy.Object.CDisplayStyleExtend = OpenLayers.Class({
    /// <summary>图层显示参数</summary>

    /// <summary>图层索引</summary>
    Index: 0,

    /// <summary>是否进行还原显示</summary>
    SymbleShow: false,

    /// <summary>线状符号线宽固定</summary>
    LinPenWidFixed: false,

    /// <summary>线状符号大小固定</summary>
    LinSizeFixed: false,

    /// <summary>点状符号线宽固定</summary>
    PntPenWidFixed: false,

    /// <summary>点状符号大小固定</summary>
    PntSizeFixed: false,

    /// <summary>填充符号线宽固定</summary>
    RegPenWidFixed: false,

    /// <summary> 填充符号大小固定</summary>
    RegSizeFixed: false,

    /// <summary> 注记符号大小固定</summary>
    AnnSizeFixed: false,

    /// <summary>符号是否跟随显示放大（该属性已过时，请使用各个要素类的大小固定及线宽固定）</summary>
    FollowScale: true,

    /// <summary>显示坐标点</summary>
    ShowCoordPnt: false,

    /// <summary>显示元素的外包矩形</summary>
    ShowElemRect: false,

    /// <summary>图像质量</summary>
    DriverQuality: 0,

    /// <summary>是否动态投影</summary>
    DynProjFlag: false,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性字段赋值对象</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CDynNoteInfo.js---------------------------------------------------------*/

Zondy.Object.CDynNoteInfo = OpenLayers.Class({

    /// <summary>动态注记字符串角度</summary>
    Angle: 0.00,

    /// <summary>背景颜色</summary>取值请参照MapGIS颜色库中颜色编号
    Backclr: 0,

    /// <summary>轮廓宽度</summary>
    Backexp: 0.00,

    /// <summary>加粗</summary>
    Bold: 0,

    /// <summary>注记字段名称</summary>
    FieldName: null,

    /// <summary>字体角度</summary>
    FontAngle: 0.00,

    /// <summary>注记颜色</summary>
    FontColor: 0,

    /// <summary>注记大小</summary>
    FontSize: 0,

    /// <summary>注记字体</summary>
    FontStyle: 0,

    /// <summary>中文字体</summary>
    Ifnt: 0,

    /// <summary>字形</summary>
    Ifnx: 0,

    /// <summary>是否填充背景</summary>
    IsFilled: false,

    /// <summary>是否水平显示</summary>
    IsHzpl: false,

    /// <summary>覆盖方式（表明透明还是覆盖）</summary>
    IsOvprnt: false,

    /// <summary>Description</summary>
    LabelLevel: 0,

    /// <summary>
    ///   Zondy.Object.DynNoteLableType
    /// </summary>
    LableType: null,

    /// <summary> x方向的偏移</summary>
    Offsetx: 0.00,

    /// <summary>y方向的偏移</summary>
    Offsety: 0.00,

    /// <summary>字间距</summary>
    Space: 0.00,

    /// <summary>删除线</summary>
    StrikeThrough: 0,

    /// <summary>下划线</summary>
    UnderLine: 0,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性字段赋值对象</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/


/*---------------------------------------------------------DynNoteLabelType.js----------------------------------*/
Zondy.Object.DynNoteLabelType = OpenLayers.Class({

    /// <summary>方位属性</summary>
    /// <summary>
    /// Zondy.Object.LabelLinInfo
    /// 线方位属性
    /// </summary>
    LinInfo: null,

    /// <summary>点方位属性,Zondy.Object.LabelPntInfo</summary>
    PntInfo: null,

    /// <summary>区方位属性,Zondy.Object.LabelRegInfo</summary>
    RegInfo: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    }
});

/*------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------WebGraphicsInfo.js---------------------------------------------------------*/


Zondy.Object.WebGraphicsInfo = OpenLayers.Class({
    /// <summary>定义要素的图形参数</summary>


    /// <summary>枚举类型，取值范围： 1（PntInfo）,2（LinInfo）,3（RegInfo）</summary>
    InfoType: 0,

    /// <summary>线信息对象,Zondy.Object.CLineInfo类型</summary>
    LinInfo: null,

    /// <summary>点信息对象,Zondy.Object.CPointInfo类型</summary>
    PntInfo: null,

    /// <summary>区信息对象,Zondy.Object.CRegionInfo类型</summary>
    RegInfo: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------FeatureGeometry.js---------------------------------------------------------*/

Zondy.Object.FeatureGeometry = OpenLayers.Class({

    /*
    *Array类型
    *一组Zondy.Object.GLine对象in Array
    */
    LinGeom: null,

    /*
    *Array类型
    *一组Zondy.Object.GPoint 对象in Array
    */
    PntGeom: null,

    /*
    *Array类型
    *一组Zondy.Object.GRegion 对象in Array
    */
    RegGeom: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    },

    setLine: function (lines) {
        /// <param name="lines" type="Zondy.Object.GLine in Array">线参数设置</param>
        this.LinGeom = lines;
    },
    setPntGeom: function (pnts) {
        /// <param name="pnts" type="Zondy.Object.GPoint in Array">点参数设置</param>
        this.PntGeom = pnts;
    },
    setRegGeom: function (Regs) {
        /// <param name="Regs" type="Zondy.Object.GRegion in Array">区参数设置</param>
        this.RegGeom = Regs;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Tangram.js---------------------------------------------------------*/


Zondy.Object.Tangram = OpenLayers.Class({

    setByOL: function (openlayersObj) {
        /// <summary> * 实现将openlayers的geomerty转换为zondy类型
        ///此方法由子类实现</summary>
        return null;
    },

    toString: function () {
        return "";
    },

    getGeometryType: function () {
        /// <summary>获取几何类型名称,由子类实现</summary>
        return;
    }
});






/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Point2D.js---------------------------------------------------------*/
Zondy.Object.Point2D = OpenLayers.Class(Zondy.Object.Tangram, {

    /// <summary>x轴坐标</summary>
    x: null,

    /// <summary>y轴坐标</summary>
    y: null,


    setByOL: function (point) {
        /// <summary>通过传入Openlayers的OpenLayers.Geometry.Point类型来设置参数</summary>
        /// <param name="point" type="OpenLayers.Geometry.Point">Openlayers定义的点类型</param>
        this.x = point.x;
        this.y = point.y;

    },

    toString: function () {
        /// <summary>返回一个以字符串形式表示的点</summary>
        if (this.x == null || this.y == null)
            return "";
        var str = this.x + ',' + this.y;
        return str;
    },

    getGeometryType: function () {
        /// <summary>获取几何类型名称</summary>
        return "Point2D";
    },


    initialize: function (x, y) {
        /// <summary>构造函数</summary>
        /// <param name="x" type="Double">x轴坐标</param>
        /// <param name="y" type="Double">y轴坐标</param>
        this.x = x;
        this.y = y;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------PointForQuery.js---------------------------------------------------------*/
Zondy.Object.PointForQuery = OpenLayers.Class(Zondy.Object.Point2D, {

    initialize: function (x, y) {
        /// <summary>构造函数</summary>
        /// <param name="x" type="Double">x轴坐标</param>
        /// <param name="y" type="Double">y轴坐标</param>
        Zondy.Object.Point2D.prototype.initialize.apply(this, arguments);
    },

    /// <summary>设置点的搜索半径</summary>
    nearDis: 0.0,

    getGeometryType: function () {
        /// <summary>获取几何类型名称</summary>
        return "Point";
    },

    toString: function () {
        var str = Zondy.Object.Point2D.prototype.toString.apply(this);
        return str + ";" + this.nearDis;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Rectangle.js---------------------------------------------------------*/
Zondy.Object.Rectangle = OpenLayers.Class(Zondy.Object.Tangram, {
    /// <summary>表示一个矩形</summary>

    xmin: 0.0,

    xmax: 0.0,

    ymin: 0.0,

    ymax: 0.0,

    setByOL: function (openlayersRect) {
        /// <summary>使用一个由Openlayers定义的矩形来构造本对象</summary>
        /// <param name="openlayersRect" type="OpenLayers.Geometry.Polygon">由OpenLayers定义的矩形对象</param>
        this.xmin = openlayersRect.components[0].components[3].x;
        this.ymin = openlayersRect.components[0].components[3].y;
        this.xmax = openlayersRect.components[0].components[1].x;
        this.ymax = openlayersRect.components[0].components[1].y;
    },

    toString: function () {
        /// <summary>返回一个字符串来表示此矩形</summary>
        return "" + this.xmin + ',' + this.ymin + ',' + this.xmax + ',' + this.ymax;
    },

    getGeometryType: function () {
        /// <summary>获取几何类型名称</summary>
        return "Rect";
    },

    convertToBound: function () {
        /// <summary>将本对象转换为一个OpenLayers.Bound对象</summary>
        /// <returns type="OpenLayers.Bound" />
        var bounds = new OpenLayers.Bounds(this.xmin, this.ymin, this.ymax, this.xmax);
        return bounds;
    },

    initialize: function (argument1, argument2, argument3, argument4) {
        /// <summary>构造函数</summary>
        /// <param name="argument1" type="String">接受一个形如：xmin,ymin,xmax,ymax的字符串，也可以接受4个float类型的变量来初始化此对象</param>

        if (arguments.length == 1) {
            this.xmin = OpenLayers.Util.toFloat(argument1.split(",")[0]);
            this.ymin = OpenLayers.Util.toFloat(argument1.split(",")[1]);
            this.xmax = OpenLayers.Util.toFloat(argument1.split(",")[2]);
            this.ymax = OpenLayers.Util.toFloat(argument1.split(",")[3]);

        }
        if (arguments.length == 4) {
            this.xmin = argument1;
            this.ymin = argument2;
            this.xmax = argument3;
            this.ymax = argument4;
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Feature.js---------------------------------------------------------*/



Zondy.Object.Feature = OpenLayers.Class({
    /// <summary>表示一个要素类</summary>


    /// <summary>
    ///  属性值
    ///  Array,String in an Array
    /// </summary>
    AttValue: null,

    /// <summary>
    /// 要素id号
    /// Interger
    /// </summary>
    FID: 0,


    /// <summary>
    /// 要素的外包矩形
    /// Zondy.Object.Rectangle
    ///</summary>
    bound: null,

    /// <summary>
    ///  要素的几何图形描述
    ///  Zondy.Object.FeatureGeometry
    /// </summary>
    fGeom: null,


    /// <summary>
    ///  要素几何类型
    ///  Zondy.Enum.FeatureType类型，取值范围：1（Pnt）、2（Lin）、3（Reg）
    /// </summary>
    ftype: 0,


    /// <summary>
    ///  几何图形参数
    ///  Zondy.Object.WebGraphicsInfo
    /// </summary>
    GraphicInfo: null,

    initialize: function (feature) {
        /// <summary>构造函数</summary>
        /// <param name="name" type="Object">一个包含feature数据的对象</param>
        $.extend(this, feature);
    },



    getAttValue: function (attKey) {
        /// <summary>获取当前要素的属性值</summary>
        /// <param name="attKey" type="Interger">属性字段关键字或者属性序号</param>
        /// <returns type="String" />
        if (this.AttValue === null)
            return null;
        var attLength = this.AttValue.length;

        if (typeof (attKey) == 'number') {
            if (attKey >= attLength)
                return null;
            return this.AttValue[attKey];
        }
    },

    getGraphicInfo: function () {
        /// <summary>获取当前要素的几何图形参数</summary>
        /// <returns type="Zondy.Object.WebGraphicsInfo" />
        if (this.GraphicInfo === null) {
            return null;
        }
        else {
            return new Zondy.Object.WebGraphicsInfo(this.GraphicInfo);
        }
    },

    getAttValueArray: function () {
        /// <summary>获取当前要素的所有字段属性值</summary>
        /// <returns type="Array contains String" />
        return this.AttValue;
    },
    getRectBound: function () {
        /// <summary>获取当前要素的外包矩形</summary>
        /// <returns type="Zondy.Object.Rectangle" />
        var bound = this.bound;
        if (bound != null) {
            return new Zondy.Object.Rectangle(bound);
        }
        else
            return bound;
    },

    getGeometry: function () {
        /// <summary>获取当前要素的几何描述</summary>
        /// <returns type="String" />
    },

    getFID: function () {
        /// <summary>获取当前要素的FID</summary>
        /// <returns type="Interger" />
        return this.FID;
    },

    setAttValues: function (values) {
        /// <summary>设置当前要素的所有属性值</summary>
        /// <param name="values" type="Array / Object">属性值数组 /或者属性键值对</param>
        this.AttValue = values;
    },

    setBound: function (bound) {
        /// <summary>设置当前要素的外包矩形</summary>
        /// <param name="bound" type="String:'xmin,ymin,xmax,ymax' | Zondy.Object.Rectangle
        ///  | {OpenLayers.Geometry.Rectangle}">外包矩形描述，可以是字符串，zondy矩形或者openlayers矩形</param>
        var rect = null;
        if (typeof (bound) == "string") {
            rect = new Zondy.Object.Rectangle(bound);
        }
        if (bound instanceof String) {
            rect = new Zondy.Object.Rectangle(bound);
        }
        if (bound instanceof Zondy.Object.Rectangle) {
            rect = bound;
        }
        if (bound instanceof OpenLayers.Geometry.Rectangle) {
            rect = new Zondy.Object.Rectangle();
            rect.setByOL(bound);
        }
        this.bound = rect;
    },

    setFID: function (fid) {
        /// <summary>设置当前要素的FID</summary>
        /// <param name="fid" type="Interger">要素id号</param>
        this.FID = fid;
    },

    setFType: function (type) {
        /// <summary>设置几何图形的类型</summary>
        /// <param name="type" type="Zondy.Enum.FeatureType">几何类型</param>
        this.ftype = type;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------FeatureSet.js---------------------------------------------------------*/

/// <reference path="../../jquery-1.4.4.min.js" />


Zondy.Object.FeatureSet = OpenLayers.Class({
    /// <summary> 
    /// 简单要素类集合，用于相关要素操作
    /// @requires Feature.js
    ///</summary>

    /*********************************************Private*******************************/

    /******************************************** Public********************************
    /**
    * 属性结构
    * {Array}
    * {Zondy.Object.CAttStruct}
    */
    AttStruct: null,

    /**
    * 要素数组
    * {Array}
    * {Zondy.Object.Feature} in Array
    */
    SFEleArray: new Array(),

    /// <summary>{Interger},一次查询的总要素个数，仅在做要素查询时有意义
    ///   ReadOnly
    /// </summary>
    TotalCount: 0,


    initialize: function () {
        this.clear();
    },


    clear: function () {
        /// <summary>还原主参数为默认值</summary>
        this.AttStruct = null;
        this.SFEleArray = new Array();
    },

    addFeature: function (features) {
        /// <summary>添加一组或者一个要素</summary>
        /// <param name="name" type="{Array} | {Zondy.Object.Feature} | {Object}（代表Feature的属性键值对）">一组要素，或者一个要素</param>
        if (features instanceof Array) {
            this.SFEleArray.concat(features);
        }
        else {
            this.SFEleArray.push(features);
        }
    },


    getFeaturesLength: function () {
        /// <summary>获取要素集要素的记录条数</summary>
        /// <returns type="Integer" />
        if (this.SFEleArray instanceof Array) {
            return this.SFEleArray.length;
        }
        else {
            return 0;
        }
    },

    getFeatureByIndex: function (i) {
        /// <summary>获取指定要素类</summary>
        /// <returns type="{Zondy.Object.Feature}" />
        if (i >= this.getFeaturesLength()) {
            return null;
        }
        else {
            var feature = this.SFEleArray[i];
            if (feature instanceof Zondy.Object.Feature)
                return feature;
            else {
                return new Zondy.Object.Feature(this.SFEleArray[i]);
            }
        }
    },

    getAttType: function (attKey) {
        /// <summary>获取某属性字段的类型</summary>
        /// <param name="attkey" type="String">属性字段关键字，可以是{String}字段名，可以是序号{Interger}</param>
        /// <returns type="String" />
        var index;
        if (this.AttStruct == null)
            return null;
        if (typeof (attKey) == 'number')
            index = attKey;
        else
            index = this.getAttIndexByAttName(attKey);
        if (index == null)
            return null;
        else
            return this.AttStruct.FldType[index];
    },

    getAttIndexByAttName: function (name) {
        /// <summary>通过属性的名称获取属性的序号</summary>
        /// <param name="name" type="String">属性名</param>
        /// <returns type="Interger" />
        if (this.AttStruct == null)
            return null;
        if (this.AttStruct.FldName == null)
            return null;
        var length = this.AttStruct.FldName.length;
        for (var i = 0; i < length; i++) {
            if (this.AttStruct.FldName[i] == name)
                return i;
        }
        return null;
    },

    getAttNameByIndex: function (index) {
        /// <summary>通过属性的序号获取属性名称</summary>
        /// <param name="index" type="Interger">属性序号</param>
        /// <returns type="String" />
        if (this.AttStruct == null)
            return null;
        if (this.AttStruct.FldName == null)
            return null;
        if (this.AttStruct.FldName.length <= index)
            return null;
        return this.AttStruct.FldName[index];
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------GPoint.js---------------------------------------------------------*/
Zondy.Object.GPoint = OpenLayers.Class(Zondy.Object.FeatureGraphicBase, {

    /// <summary>Zondy.Object.Point2D</summary>
    Dot: null,

    initialize: function (x, y) {
        /// <summary>构造函数</summary>
        /// <param name="x" type="Float">圆心x坐标</param>
        /// <param name="y" type="Float">圆心y坐标</param>
        this.Dot = new Zondy.Object.Point2D(x, y);
    },

    setDot: function (pnt) {
        /// <summary>设置圆心点</summary>
        /// <param name="pnt" type="Zondy.Object.Point2D">圆心</param>
        this.Dot = pnt;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Circle.js---------------------------------------------------------*/


Zondy.Object.Circle = OpenLayers.Class(Zondy.Object.Tangram, {
    /// <summary>表示一个圆</summary>

    /// <summary>
    ///  圆心点
    ///  Zondy.Object.Point2D
    /// </summary>
    point: null,

    /// <summary>
    ///  半径
    ///  Float
    /// </summary>
    radius: null,

    setByOL: function (openlayersCircle) {
        /// <summary>通过传入Openlayers的OpenLayers.Geometry类型来设置参数</summary>
        /// <param name="openlayersCircle" type="由Openlayers定义的圆类型">Description</param>
        var geoObj = openlayersCircle.components;
        var linearRing = new OpenLayers.Geometry.LinearRing(geoObj[0].components);
        //圆心
        var centerPoint = linearRing.getCentroid();
        //圆半径
        var radious = Math.abs(geoObj[0].components[0].x - centerPoint.x);
        this.point = new Zondy.Object.Point2D(centerPoint.x, centerPoint.y);
        this.radious = radious;
    },

    toString: function () {
        /// <summary>返回一个字符串来表示此圆</summary>
        if (this.point == null || this.radious == null)
            return "";
        return this.point.x + ',' + this.point.y + ',' + this.radious;
    },

    getGeometryType: function () {
        /// <summary>获取几何类型名称</summary>
        return "Circle";
    },

    initialize: function (point, radious) {
        /// <summary>构造函数</summary>
        /// <param name="point" type="Zondy.Object.Point2D">圆心点</param>
        /// <param name="radious" type="Float">半径</param>
        this.point = point;
        this.radious = radious;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------Polygon.js---------------------------------------------------------*/
Zondy.Object.Polygon = OpenLayers.Class(Zondy.Object.Tangram, {

    /// <summary>Array ,Zondy.Object.Point2D in an Array</summary>
    pointArr: null,

    setByOL: function (openlayersPoly) {
        /// <summary> 通过传入Openlayers的OpenLayers.Geometry类型来设置参数</summary>
        /// <param name="openlayersPoly" type="OpenLayers.Geometry">由Openlayers定义的多边形</param>
        var pointArr = openlayersPoly.components[0].components;
        var len = pointArr.length;
        var i;
        for (i = 0; i < len; i++) {
            this.pointArr[i] = new Zondy.Object.Point2D(pointArr[i].x, pointArr[i].y);
        }
    },

    toString: function () {
        /// <summary>返回一个字符串来表示该多边形</summary>
        if (this.pointArr == null || this.pointArr.length == 0)
            return "";
        var i;
        var str = "";
        for (i = 0; i < this.pointArr.length; i++) {
            str += this.pointArr[i].x + ',' + this.pointArr[i].y + ',';
        }
        return str.substring(0, str.length - 1);

    },

    getGeometryType: function () {
        /// <summary>获取几何类型名称</summary>
        return "Polygon";
    },

    initialize: function (pointArr) {
        /// <summary>构造函数</summary>
        /// <param name="pointArr" type="Array,Zondy.Object.Point2D in an Array">一组点类型</param>
        this.pointArr = new Array();
        if (pointArr != undefined) {
            this.pointArr = pointArr;
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------MultiPolygon.js---------------------------------------------------------*/
Zondy.Object.MultiPolygon = OpenLayers.Class(Zondy.Object.Tangram, {

    /// <summary>Array ,Zondy.Object.Polygon in an Array</summary>
    polygonArr: null,

    setByOL: function (openlayersPoly) {
        /// <summary> 通过传入Openlayers的OpenLayers.Geometry类型来设置参数</summary>
        /// <param name="openlayersPoly" type="OpenLayers.Geometry">由Openlayers定义的多边形</param>
        polygonArr = [];
        var polygonLen = openlayersPoly.components.length;
        for (var i = 0; i < polygonLen; i++) {
            var pointArr = openlayersPoly.components[i].components;
            var len = pointArr.length;
            var polygonPoints = [];
            for (var j = 0; j < len; j++) {
                polygonPoints[j] = new Zondy.Object.Point2D(pointArr[j].x, pointArr[j].y);
            }
            polygonArr[i] = new Zondy.Object.Polygon(polygonPoints);
        }
    },

    toString: function () {
        /// <summary>返回一个字符串来表示该多边形</summary>
        if (this.polygonArr == null || this.polygonArr.length == 0)
            return "";
        var i;
        var str = "";
        for (i = 0; i < this.polygonArr.length; i++) {
            str += this.polygonArr[i].toString() + ";";
        }
        return str.substring(0, str.length - 1);
    },

    getGeometryType: function () {
        /// <summary>获取几何类型名称</summary>
        return "MultiPolygon";
    },

    initialize: function (polygonArr) {
        /// <summary>构造函数</summary>
        /// <param name="pointArr" type="Array,Zondy.Object.Polygon in an Array">一组点类型</param>
        this.polygonArr = new Array();
        if (polygonArr) {
            this.polygonArr = polygonArr;
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------PolyLine.js---------------------------------------------------------*/
Zondy.Object.PolyLine = OpenLayers.Class(Zondy.Object.Tangram, {

    /// <summary>Array ,Zondy.Object.Point2D in an Array</summary>
    pointArr: null,

    setByOL: function (openlayersLine) {
        /// <summary> 通过传入Openlayers的OpenLayers.Geometry类型来设置参数</summary>
        /// <param name="openlayersPoly" type="OpenLayers.Geometry">由Openlayers定义的折线</param>
        // var len = openlayersLine.components[0].components.length;
        var len = openlayersLine.components.length;
        var i;
        for (i = 0; i < len; i++) {
            this.pointArr[i] = new Zondy.Object.Point2D(openlayersLine.components[i].x, openlayersLine.components[i].y);
        }
    },

    toString: function () {
        /// <summary>返回一个字符串来表示该折线</summary>
        if (this.pointArr == null || this.pointArr.length == 0)
            return "";
        var i;
        var str = "";
        for (i = 0; i < this.pointArr.length; i++) {
            str += this.pointArr[i].x + ',' + this.pointArr[i].y + ",";
        }
        return str.substring(0, str.length - 1);
    },

    getGeometryType: function () {
        /// <summary>获取几何类型名称</summary>
        return "Line";
    },


    initialize: function (pointArr) {
        /// <summary>构造函数</summary>
        /// <param name="pointArr" type="Array,Zondy.Object.Point2D in an Array">一组点类型</param>
        this.pointArr = new Array();
        if (pointArr != undefined) {
            this.pointArr = pointArr;
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------PolyLineForQuery.js---------------------------------------------------------*/
Zondy.Object.PolyLineForQuery = OpenLayers.Class(Zondy.Object.PolyLine, {

    initialize: function (pntArray) {
        /// <summary>构造函数</summary>
        /// <param name="pntArray" type="Array">一组 Zondy.Object.Point2D类型的对象</param>
        Zondy.Object.PolyLine.prototype.initialize.apply(this, arguments);
    },

    /// <summary>设置点的搜索半径</summary>
    nearDis: 0.0,

    toString: function () {
        var str = Zondy.Object.PolyLine.prototype.toString.apply(this);
        return str + ";" + this.nearDis;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------AnalysisBase.js---------------------------------------------------------*/

Zondy.Service.AnalysisBase = OpenLayers.Class(Zondy.Service.HttpRequest, {
    /// <summary>分析服务基类</summary>

    /// <summary>工作流ID号,Interger</summary>
    flowID: null,

    initialize: function () {
    },

    execute: function (onSuccess, way, isAsy, f) {
        /// <summary>执行分析语句</summary>
        /// <param name="onSuccess" type="{Function}">必要参数，执行成功后的回调函数</param>
        /// <param name="way" type="{String}">
        ///     'POST' or 'GET'，默认为'Get',当所需要发送的数据量比较大时，请选择'Post',否则可能会执行失败
        ///</param>
        /// <param name="isAsy" type="{Boolean}">是否异步执行，默认为false</param>
        /// <param name="f" type="{String}">'json' or 'xml' 指明执行返回结果的格式</param>
        var data = {};
        if (!way)
            way = "get";

        if (f == undefined)
        //  如果f 未定义，或者f为非法字符串时，默认为json
            f = "json";
        else {
            if (f.toLowerCase() != 'xml')
                f = 'json';
        }
        if (isAsy == undefined) {
            isAsy = false;
        }

        if (this.partUrl == null)
            this.partUrl = "execute/" + this.flowID;
        if (this.baseUrl == null)
            this.baseUrl = "igs/rest/mrfws";

        if (way.toLowerCase() == "get") {
            data.f = f;
            data.isAsy = isAsy;
            var jsonStr = $.toJSON(this, ['port', 'ip', 'baseUrl', 'partUrl'], ';', false);
            data.paraValues = jsonStr.substring(1, jsonStr.length - 1);
        }

        if (way.toLowerCase() == "post") {
            this.partUrl += "?isAsy=" + isAsy.toString() + "&f=" + f;
            jsonStr = $.toJSON(this, ['port', 'ip', 'baseUrl', 'partUrl'], ',');
            var obj = $.parseJSON(jsonStr);
            var keyValueArray = new Array();
            for (var o in obj) {
                var keyValue = {};
                keyValue.Key = o;
                keyValue.Value = obj[o].toString();
                keyValueArray.push(keyValue);
            }
            data = $.toJSON(keyValueArray);
        }

        this.ajax(null, data, onSuccess, way, null, f);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ClassBufferBase.js---------------------------------------------------------*/


Zondy.Service.ClassBufferBase = OpenLayers.Class(Zondy.Service.AnalysisBase, {
    /// <summary>类缓冲分析基类</summary>

    /*源矢量图层URL*/
    srcInfo: null,
    
//    目的矢量图层URL
    desInfo: null,
    
//    指定图层中进行缓冲区分析的要素ID串
    idstr: "",
    
//    拐角类型
    angleType: 0,
    
//    缓冲区是否合并
    isDissolve: true,
    
//    是否动态投影
    isDynPrj: false,


    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        $.extend(this, parameters, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ClassBufferByMultiplyRing.js---------------------------------------------------------*/


Zondy.Service.ClassBufferByMultiplyRing = OpenLayers.Class(Zondy.Service.ClassBufferBase, {

    /// <summary>类缓冲分析（多圈）</summary>

    radiusStr: "2,4,8,10",

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600232";
        Zondy.Service.ClassBufferBase.prototype.initialize.apply(this, arguments);
    }
});

/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ClassBufferBySingleRing.js---------------------------------------------------------*/


Zondy.Service.ClassBufferBySingleRing = OpenLayers.Class(Zondy.Service.ClassBufferBase, {

    /// <summary>类缓冲分析（单圈）</summary>

//    缓冲时要素左侧缓冲半径
    leftRad: 5,
    
//    缓冲时要素右侧缓冲半径
    rightRad: 5,
    
//    是否允许根据属性字段设置缓冲区半径
    isByAtt: false,
    
//    属性字段名称
    fldName: null,
    
//    动态投影半径
    dynPrjRad: 0,

    initialize: function (parameters, property) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600231";
        Zondy.Service.ClassBufferBase.prototype.initialize.apply(this, arguments);
    }
});







/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ClipBase.js---------------------------------------------------------*/


Zondy.Service.ClipBase = OpenLayers.Class(Zondy.Service.AnalysisBase, {
    /// <summary>裁剪分析基类分析类</summary>

    desInfo: null, 		//裁剪分析结果图层URL
    attOptType: 1, 		//属性数据处理方式
    infoOptType: 1, 		//图形参数处理方式
    overType: 3, 			//裁剪方式
    tolerance: 0.0001, 	//容差半径
    isCleanNode: false, 	//是否结点平差
    isLabelPnt: false, 	//是否裁剪label点
    isValidReg: false, 	//是否检查区的合法性


    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        $.extend(this, parameters, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ClipByCircle.js---------------------------------------------------------*/


Zondy.Service.ClipByCircle = OpenLayers.Class(Zondy.Service.ClipBase, {

    /// <summary>圆裁剪类</summary>
//    源图层URL
    srcInfo: null,
    //圆点坐标，string：x,y
    center: null,
    //半径长度float
    radius: null,
//    离散化步长
    step: 0.001,

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600229";
        Zondy.Service.ClipBase.prototype.initialize.apply(this, arguments);
    }
});







/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ClipByLayer.js---------------------------------------------------------*/


Zondy.Service.ClipByLayer = OpenLayers.Class(Zondy.Service.ClipBase, {

    /// <summary>图层裁剪类</summary>
    srcInfo1: null, 		//源简单要素类的URL
    srcInfo2: null, 		//裁剪框简单要素类的URL

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600230";
        Zondy.Service.ClipBase.prototype.initialize.apply(this, arguments);
    }
});

/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ClipByPolygon.js---------------------------------------------------------*/


Zondy.Service.ClipByPolygon = OpenLayers.Class(Zondy.Service.ClipBase, {
    /// <summary>多边形裁剪类</summary>

    
//    源图层URL
    srcInfo: null,
    //多边形点坐标串。strPos为STRING格式，内容是多边形几个点坐标：x1,y1,x2,y2....
    strPos: null,

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600228";
        Zondy.Service.ClipBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------FeatureBuffBase.js---------------------------------------------------------*/


Zondy.Service.FeatureBuffBase = OpenLayers.Class(Zondy.Service.AnalysisBase, {
    /// <summary>要素缓冲分析基类</summary>

    sfGeometryXML: null, //注意:需要修改为将FeatureGeometry[]数组序列化为字符串
    attStrctXML: null, //注意:需要修改为CAttStruct数组序列化为字符串
    attRowsXML: null, //注意:需要修改为将CAttDataRow[]数组序列化为字符串
    traceRadius: 0.0001,
    resultName: null,
    inFormat: "json",

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        $.extend(this, parameters, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------FeatureBuffByMultiplyRing.js---------------------------------------------------------*/


Zondy.Service.FeatureBuffByMultiplyRing = OpenLayers.Class(Zondy.Service.FeatureBuffBase, {
    /// <summary>要素缓冲区分析（多圈）</summary>

    radiusStr: "0.003,0.002,0.001",


    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600239";
        Zondy.Service.FeatureBuffBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------FeatureBuffBySingleRing.js---------------------------------------------------------*/

Zondy.Service.FeatureBuffBySingleRing = OpenLayers.Class(Zondy.Service.FeatureBuffBase, {
    /// <summary>要素缓冲区分析（单圈）</summary>


    leftRad: 0.001,
    rightRad: 0.001,

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600238";

        Zondy.Service.FeatureBuffBase.prototype.initialize.apply(this, arguments);
    }
});







/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------GeometryAnalysisBase.js---------------------------------------------------------*/

Zondy.Service.GeometryAnalysisBase = OpenLayers.Class(Zondy.Service.HttpRequest, {
    /// <summary>几何分析基类</summary>

    resultFormat: "json",
    initialize: function () {
        /// <summary>构造函数</summary>
        if (this.baseUrl == null) {
            this.baseUrl = "igs/rest/mrgs";
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CalServiceBase.js---------------------------------------------------------*/


Zondy.Service.CalServiceBase = OpenLayers.Class(Zondy.Service.GeometryAnalysisBase, {
    /// <summary>测量服务基类</summary>

    /// <summary>{Array},一组{Zondy.Object.Point2D}类型</summary>
    dots: null,

    /// <summary>{Zondy.Service.CProjectParam}类型</summary>
    projectInfo: null,

    /// <summary>{Zondy.Service.CProjectBySRSID}</summary>
    projectInfoBySRSID: null,

    initialize: function (obj, options) {
        /// <summary>构造函数</summary>
        /// <param name="obj" type="Array,Zondy.Object.Point2D in an Array">需要计算的点数组,数组类型为Zondy.Object.Point2D</param>

        this.dots = obj;
        $.extend(this, options);
        Zondy.Service.GeometryAnalysisBase.prototype.initialize.apply(this);
    },

    execute: function (projParam, onSuccess) {
        /// <summary>通过传入投影参数或者通过传入SRSID参数进行计算</summary>
        /// <param name="projParam" type="Zondy.Service.CProjectParam | Zondy.Service.CProjectBySRSID（建议普通用户采用此类直接获取MapGIS GDB 已经提供的空间参考系）">投影参数</param>
        /// <param name="onSuccess" type="Function">执行成功后的回调函数</param>
        if (projParam instanceof Zondy.Service.CProjectParam) {
            this.projectInfo = projParam;
        }
        if (projParam instanceof Zondy.Service.CProjectBySRSID) {
            this.projectInfoBySrsID = projParam;
        }
        var postObj = {};
        postObj.Dots = this.dots;
        postObj.ProjectInfo = this.projectInfo;
        postObj.ProjectInfoBySrsID = this.projectInfoBySrsID;
        //var postString = $.toJSON(postObj);
        this.ajax(null, postObj, onSuccess, "POST");
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CProjectBySRSID.js---------------------------------------------------------*/

Zondy.Service.CProjectBySRSID = OpenLayers.Class({
    /// <summary>用于进行SRSID投影的参数类/summary>

    DesSrsID: null,
    GdbInfo: null,

    initialize: function (desSrsID, gdbInfo) {
        /// <summary>构造函数</summary>
        /// <param name="desSrsID" type="{Interger}">目标SRSID号</param>
        /// <param name="gdbInfo" type="{Zondy.Object.CGDBInfo}">关于SRSID的GDB信息</param>
        this.DesSrsID = desSrsID;
        this.GdbInfo = gdbInfo;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CProjectParam.js---------------------------------------------------------*/


Zondy.Service.CProjectParam = OpenLayers.Class({
    /// <summary>投影转换空间参数类</summary>

    /// <summary>{Interger},角度单位</summary>
    ProjAngleUnit: 0,

    /// <summary>{Double},投影原点纬度</summary>
    ProjLat: 0.00,

    /// <summary>{Double},第一标准维度</summary>
    ProjLat1: 0.00,

    /// <summary>{Double},第二标准维度</summary>
    ProjLat2: 0.00,

    /// <summary>{Double}，中央子午线经度</summary>
    ProjLon: 0.00,

    /// <summary>{Double}，水平比例尺</summary>
    ProjRate: 0.00,

    /// <summary>{Interger}，坐标系类型</summary>
    ProjType: 0,

    /// <summary>{Interger}，投影类型</summary>
    ProjTypeID: 0,

    /// <summary>{Interger}，长度单位</summary>
    ProjUnit: 0,

    /// <summary>{Short}，投影带号</summary>
    ProjZoneNO: 0,

    /// <summary>{Short}，投影分带类型</summary>
    ProjZoneType: 0,

    /// <summary>{Interger}，椭球体参数</summary>
    SphereID: 0,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CProjectDots.js---------------------------------------------------------*/


Zondy.Service.CProjectDots = OpenLayers.Class({
    /// <summary>作为MRGS的投影服务Post参数</summary>

    /// <summary>目标投影参数，Zondy.Service.CProjectParam 类型</summary>
    DesProjParm: null,

    /// <summary>源投影参数，Zondy.Service.CProjectParam 类型</summary>
    SrcProjParam: null,

    /// <summary>需要转换的点坐标,Zondy.Object.Point2D in an Array</summary>
    InputDots: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CalPolyLineLength.js---------------------------------------------------------*/


Zondy.Service.CalPolyLineLength = OpenLayers.Class(Zondy.Service.CalServiceBase, {
    /// <summary>折线长度计算服务</summary>


    initialize: function (obj, options) {
        /// <summary>构造函数</summary>
        /// <param name="obj" type="Array">需要计算的点数组,数组类型为Zondy.Object.Point2D</param>
        /// <param name="options" type="Object">为其他属性赋值的键值对</param>
        this.partUrl = "geomservice/calLength?f=" + this.resultFormat;
        Zondy.Service.CalServiceBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CalArea.js---------------------------------------------------------*/



Zondy.Service.CalArea = OpenLayers.Class(Zondy.Service.CalServiceBase, {
    /// <summary>计算面积服务</summary>

    initialize: function (obj, options) {
        /// <summary>构造函数</summary>
        /// <param name="obj" type="Array,Zondy.Object.Point2D in an Array">需要计算的点数组,数组类型为Zondy.Object.Point2D</param>
        /// <param name="options" type="Object">为属性赋值的键值对</param>
        this.partUrl = "geomservice/calArea?f=" + this.resultFormat;
        Zondy.Service.CalServiceBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ProjectDots.js---------------------------------------------------------*/

Zondy.Service.ProjectDots = OpenLayers.Class(Zondy.Service.GeometryAnalysisBase, {
    /// <summary>点投影服务</summary>

    InputDots: null,
    SrcProjParam: null,
    DesProjParm: null,

    initialize: function (dots, srcparam, desparam, options) {
        /// <summary>构造函数</summary>
        /// <param name="dots" type="{Array},一组{Zondy.Object.Point2D}类型">需要投影转换的点数组</param>
        /// <param name="srcparam" type="{Zondy.Service.CProjectParam}">源投影参数</param>
        /// <param name="desparam" type="{Zondy.Service.CProjectParam}">目标投影参数</param>
        /// <param name="options" type="{Object}">其他属性键值</param>
        this.InputDots = dots;
        this.SrcProjParam = srcparam;
        this.DesProjParm = desparam;

        $.extend(this, options);
        Zondy.Service.GeometryAnalysisBase.prototype.initialize.apply(this);
    },

    execute: function (onSuccess) {
        /// <summary>执行点投影</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "geomservice/projectdots?f=" + this.resultFormat;
        var jsonString = $.toJSON(this, ['ip', 'port', 'baseUrl', 'partUrl', 'resultFormat']);
        this.ajax(null, jsonString, onSuccess, "POST");
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------TopAnalysis.js---------------------------------------------------------*/
Zondy.Service.TopAnalysis = OpenLayers.Class(Zondy.Service.GeometryAnalysisBase, {
    /// <summary>拓扑分析类,您只应该对pnt,line,reg3个属性中的一个赋值</summary>

    pnt: null,
    line: null,
    reg: null,

    /// <summary>分析半径</summary>
    nearDis: 0.01,

    /// <summary>相对对象</summary>
    relativeObj: null,
    p_onSuccess: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值键值对</param>
        $.extend(this, options);
        Zondy.Service.GeometryAnalysisBase.prototype.initialize.apply(this);
    },

    setPnt: function (pnt) {
        /// <summary>设置点类型</summary>
        /// <param name="pnt" type="Zondy.Object.GPoint">需要设置的点类型</param>
        this.pnt = pnt;
    },

    setLine: function (line) {
        /// <summary>设置线类型</summary>
        /// <param name="line" type="Zondy.Object.GLine">需要设置的线类型</param>
        this.line = line;
    },

    setReg: function (reg) {
        /// <summary>设置区类型</summary>
        /// <param name="reg" type="Zondy.Object.GRegion">需要设置的区类型</param>
        this.reg = reg;
    },

    setRelativeObj: function (obj) {
        /// <summary>设置拓扑分析的相对参照物</summary>
        /// <param name="obj" type="Zondy.Object.GRegion">相对参照物</param>
        this.relativeObj = obj;
    },

    execute: function (onSuccess) {
        /// <summary>执行拓扑分析</summary>
        /// <param name="onSuccess" type="Function">执行成功后的回调函数</param>
        this.p_onSuccess = onSuccess;
        var postObj = {};
        postObj.NearDis = this.nearDis;
        postObj.Pnt = this.pnt;
        postObj.Line = this.line;
        postObj.Reg = this.reg;
        postObj.RelativeObj = this.relativeObj;
        this.partUrl = "geomservice/topanalysis?f=" + this.resultFormat;
        var postString = $.toJSON(postObj);
        this.ajax(null, postString, this.onGetRltSuccess, "POST");
    },

    onGetRltSuccess: function (enumNum) {
        var rlt = Zondy.Util.getTopAnalysisResult(enumNum);
        this.p_onSuccess(rlt);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------NetAnalysis.js---------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------------------------------*/
//老版本的网络分析，调用工作流600233实现，为兼容而保留，推荐使用新版本。需扩展REST服务或者搭建新的工作流
Zondy.Service.NetAnalysis = OpenLayers.Class(Zondy.Service.AnalysisBase, {
    /// <summary>路径分析类</summary>

    netClsUrl: null,
    flagPosStr: null,
    analyTp: 'UserMode',
    weight: ',Weight1,Weight1',
    outFormat: 'JSON',
    elementType: 2,
    nearDis: 0.001,
    barrierPosStr: null,


    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600233";
        $.extend(this, parameters, options);
    }
});

//改进版的网络分析。通过扩展的REST服务改进算法，REST服务中解决点未落到道路网节点或者线上时自动更正位置，弥补老版本严格要求必须点到位才可以的局限。
Zondy.Service.NetAnalysisExtent = OpenLayers.Class(Zondy.Service.AnalysisBase, {
    /// <summary>路径分析类</summary>

    netClsUrl: null,                //网络类url
    flagPosStr: null,               //网标序列，包括点上网标、网线网标
    analyTp: 'UserMode',            //分析模式，包括用户模式、系统模式（系统模型下有六种分析方式）
    weight: ',Weight1,Weight1',     //权值
    outFormat: 'JSON',              //返回格式
    elementType: 2,                 //网络元素类型，包括结点元素、边线元素、以及其他分析中会用到的如源、汇等类型。
    nearDis: 0.001,                 //网标或障碍的捕捉精度
    barrierPosStr: null,            //障碍序列，包括点上障碍、线上障碍
    roadName:"name",                //生成报告时道路名称字段

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600233";
        $.extend(this, parameters, options);
        this.partUrl = "netAnalyse";
    },

    getNetInfo: function (infoType, onSuccess) {
        /// <summary>获取网络类权值信息</summary>
        /// <param name="infoType" type="String">获取网络类信息类型</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.baseUrl = "igs/rest/netAnaly";
        this.partUrl = "netClsInfo?netCls=" + this.netClsUrl + "&type=" + infoType;
        this.ajax(null, null, onSuccess);
    },

    addNetFlag: function (dotVal, onSuccess) {
        /// <summary>添加网标（Get）</summary>
        /// <param name="dotVal" type="String">添加网标点坐标</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.baseUrl = "igs/rest/netAnaly";
        this.partUrl = "netClsFlag?netCls=" + this.netClsUrl + "&type=" + this.elementType + "&value=" + dotVal + "&nearDis=" + this.nearDis;

        this.ajax(null, null, onSuccess);
    },

    netAnalyse: function (dataObject, onSuccess, type) {
        /// <summary>执行网络分析（post）</summary>
        /// <param name="dataObject" type="object">服务器发送的数据</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        /// <param name="type" type="string">请求发送类型</param>
        this.baseUrl = "igs/rest/netAnaly";
        this.partUrl = "netAnalyse";

        this.ajax(null, dataObject, onSuccess, "POST");
    },

    comNetAnalyse: function (dataObject, onSuccess, type) {
        /// <summary>执行多策略网络分析（post）</summary>
        /// <param name="dataObject" type="object">服务器发送的数据</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        /// <param name="type" type="string">请求发送类型</param>
        this.baseUrl = "igs/rest/netAnaly";
        this.partUrl = "comNetAnalyse";
        this.ajax(null, dataObject, onSuccess, "POST");
    },

    pluNetAnalyse: function (dataObject, onSuccess, type) {
        /// <summary>执行多路网络分析（post）</summary>
        /// <param name="dataObject" type="object">服务器发送的数据</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        /// <param name="type" type="string">请求发送类型</param>
        this.baseUrl = "igs/rest/netAnaly";
        this.partUrl = "pluNetAnalyse";
        this.ajax(null, dataObject, onSuccess, "POST");
    }
});

Zondy.Object.NetAnalyse = OpenLayers.Class({
    netCls: null,               //网络类
    flagPosStr: null,           //网标序列，包括点上网标、网线网标
    barrierPosStr: null,        //障碍序列，包括点上障碍、线上障碍
    weight: null,               //权值
    mode: null,                 //分析模式
    isTour: false,              //是否迂回
    isTravel: false,            //是否游历
    usedTWgt: false,            //是否启用转角权值
    turnWgt: null,              //转角权值
	roadName:"name",            //生成报告时道路名称字段
	
    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">其他参数键值对</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------OverlayBase.js---------------------------------------------------------*/

Zondy.Service.OverlayBase = OpenLayers.Class(Zondy.Service.AnalysisBase, {
    /// <summary>叠加分析类</summary>

    srcInfo1: null, 			//被叠加简单要素类的信息
    desInfo: null, 			//结果简单要素类信息
    attOptType: 1, 			//是否进行属性操作
    infoOptType: 1, 			//共有部分的图形参数操作
    overType: 1, 			//叠加类型
    isCleanNode: false, 		//是否节点平差
    isLabelPnt: false, 		//是否label点
    isValidReg: false, 		//是否检查区的合法性
    isReCalculate: true, 	//是否重算面积
    radius: 0.001, 			//容差半径

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        $.extend(this, parameters, options);

    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------OverlayByLayer.js---------------------------------------------------------*/

Zondy.Service.OverlayByLayer = OpenLayers.Class(Zondy.Service.OverlayBase, {
    /// <summary>叠加分析类</summary
    
//    叠加图层URL
    srcInfo2: null,

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600227";
        Zondy.Service.OverlayBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------OverlayByPolygon.js---------------------------------------------------------*/

Zondy.Service.OverlayByPolygon = OpenLayers.Class(Zondy.Service.OverlayBase, {
    /// <summary>叠加分析类</summary>

    /// <summary>Zondy.Object.GRegion的json或者xml序列化形式</summary>
    strGRegionXML: null,
//    多边形字符串输入格式
    inFormat: "json",

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600237";
        Zondy.Service.OverlayBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ProjectBase.js---------------------------------------------------------*/

Zondy.Service.ProjectBase = OpenLayers.Class(Zondy.Service.AnalysisBase, {
    /// <summary>投影基类</summary>

    clsName: null,
    desClsName: null,
    resultName:"",


    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        $.extend(this, parameters, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ProjectByLayer.js---------------------------------------------------------*/

Zondy.Service.ProjectByLayer = OpenLayers.Class(Zondy.Service.ProjectBase, {
    /// <summary>根据投影参数投影类，生成目的类</summary>

    projTypeID: 5,
    sphereType: 2,
    projAngleUnit: 4,
    projType: 3,
    projZoneType: 1,
    projZoneNO: 20,
    projLon: 1170000,
    projLat: 0,
    projLat1: 0,
    projLat2: 0,
    projUnit: 2,
    projRate: 1,
    x: 0,
    y: 0,

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600235";
        Zondy.Service.ProjectBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ProjectBySRID.js---------------------------------------------------------*/

Zondy.Service.ProjectBySRID = OpenLayers.Class(Zondy.Service.ProjectBase, {
    /// <summary>根据参照系ID投影类，生成目的类</summary>
    srID: 32,

    initialize: function (parameters, options) {
        /// <summary>构造函数</summary>
        /// <param name="parameters" type="Object">分析相关必要参数</param>
        /// <param name="options" type="Object">其他参数键值对</param>
        this.flowID = "600234";
        Zondy.Service.ProjectBase.prototype.initialize.apply(this, arguments);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CatalogServiceBase.js---------------------------------------------------------*/

Zondy.Service.Catalog.CatalogServiceBase = OpenLayers.Class(Zondy.Service.HttpRequest, {

    initialize: function () {
        /// <summary>构造函数</summary>
        if (this.baseUrl == null) {
            this.baseUrl = "igs/rest/mrcs";
        }
    }
});

/*----------------------------------------------------------------------------------------------------------------------------*/


/*---------------------------------------------------------IncludeStruct.js---------------------------------------------------------*/
Zondy.Service.Catalog.IncludeStruct = OpenLayers.Class({
    /**
    *是否包含细节内容
    */
    includeDetails: true,
    /**
    *是否包含子项
    */
    includeSubs: false,

    initialize: function () {
    },

    toJSON: function () {
        /// <summary>返回次类的JSON字符串</summary>
        return $.toJSON(this);
    }
});

/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CGDBInfo.js---------------------------------------------------------*/
Zondy.Service.Catalog.GDBInfo = OpenLayers.Class(Zondy.Service.Catalog.CatalogServiceBase, {
    gdbName: null, 		//数据库名称
    serverName: null, 	//数据源名称
    dsName: null,
    rcsName: null,
    Password: null, 	//除MapGISLocal数据源，其它的都设置
    User: null, 		//除MapGISLocal数据源，其它的都设置
    containAll:true,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值对象</param>
        OpenLayers.Util.extend(this, options);
        Zondy.Service.Catalog.CatalogServiceBase.prototype.initialize.apply(this);
    },

    setServerName: function (serverName) {
        /// <summary>设置GDBServer的名称，默认为MapGISLocal</summary>
        /// <param name="serverName" type="String">GDBServer 名称</param>
        this.serverName = serverName;
    },

    setGdbName: function (gdbName) {
        /// <summary>设置GDB名称</summary>
        /// <param name="gdbName" type="String">GDB名称</param>
        this.gdbName = gdbName;
    },

    setDsName: function (dsName) {
        /// <summary>设置要素集名称</summary>
        /// <param name="dsName" type="String">要素集名称</param>
        this.dsName = dsName;
    },

    setRcsName: function (rcsName) {
        /// <summary>设置栅格目录名称</summary>
        /// <param name="rcsName" type="String">栅格目录名称</param>
        this.rcsName = rcsName;
    },

    getServerList: function (onSuccess) {
        /// <summary>获取数据源列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "datasource?f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getGDBList: function (onSuccess) {
        /// <summary>获取指定数据源下数据库列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "?user=" + this.User + "&psw=" + this.Password + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getDsList: function (onSuccess) {
        /// <summary>获取GDB下要素集列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/ds?containAll=" + this.containAll+"&f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/ds?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess, null, null, null, null, { async: false });
    },

    getRcsList: function (onSuccess) {
        /// <summary>获取GDB下所有栅格目录列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/rcs?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/rcs?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getProjectList: function (onSuccess) {
        /// <summary>获取参照系列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "?f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getProjectInfo: function (srefID, onSuccess) {
        /// <summary>获取参照系信息</summary>
        /// <param name="srefID" type="Integer">空间参照系ID</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + srefID + "?f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    AttachGDB:function (path, onSuccess) {
        /**
        * 附加地理数据库
        * Parameters:
        * path-{String} 数据库的绝对路径
        * onSuccess-{Function} 回调函数
        */
        var path = (path !=null ) ? encodeURI(path) : null;

        if (this.serverName == null || this.gdbName == null || path == null) {
            return;
        }

        var f = this.analysisResultType(this.resultFormat);
        this.partUrl = "gdb/attach/" + this.gdbName + "?gdbSvrName=" + this.serverName + "&path=" + path 
                     + "&f=" + f;

        if (this.user != null && this.password != null) {
            this.partUrl += "&gdbUserName=" + this.User;
                         +  "&gdbPwd=" + this.Password;
        }
        this.ajax(null, null, onSuccess);
    },
    DetachGDB: function (onSuccess) {
        /**
        * 注销地理数据库
        * Parameters:
        * onSuccess-{Function} 回调函数
        */
        if (this.serverName == null || this.gdbName == null) {
            return;
        }

        var f = this.analysisResultType(this.resultFormat);
        this.partUrl = "gdb/detach/" + this.gdbName + "?gdbSvrName=" + this.serverName;

        if (this.user != null && this.password != null) {
            this.partUrl += "&gdbUserName=" + this.User;
                         +"&gdbPwd=" + this.Password;
        }
        this.ajax(null, null, onSuccess);
    },
    CreateGDB:function (path, onSuccess) {
        /**
        * 创建地理数据库
        * Parameters:
        * path-{String} 数据库的绝对路径（本地数据源，即MapGISLocal，必须设置，仅包含创建数据库路径，不包含数据库名称）
        * onSuccess-{Function} 回调函数
        * return:
        * 是否成功创建数据库-{Boolen}
        */
        var path = (path !=null ) ? encodeURI(path) : null;

        if (this.serverName == null || this.gdbName == null || path == null) {
            return;
        }

        var f = this.analysisResultType(this.resultFormat);
        this.partUrl = "gdb/creat/" + this.gdbName + "?gdbSvrName=" + this.serverName + "&path=" + path 
                     + "&f=" + f;

        if (this.user != null && this.password != null) {
            this.partUrl += "&gdbUserName=" + this.User;
                         +  "&gdbPwd=" + this.Password;
        }
        this.ajax(null, null, onSuccess);
    },
    DeleteGDB: function (onSuccess) {
        /**
        * 删除地理数据库
        * Parameters:
        * onSuccess-{Function} 回调函数
        */
        if (this.serverName == null || this.gdbName == null) {
            return;
        }

        var f = this.analysisResultType(this.resultFormat);
        this.partUrl = "gdb/delete/" + this.gdbName + "?gdbSvrName=" + this.serverName;

        if (this.user != null && this.password != null) {
            this.partUrl += "&gdbUserName=" + this.User;
            +"&gdbPwd=" + this.Password;
        }
        this.ajax(null, null, onSuccess);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------MapDoc.js---------------------------------------------------------*/

Zondy.Service.Catalog.MapDoc = OpenLayers.Class(Zondy.Service.Catalog.CatalogServiceBase, {

    /**
    *版本信息
    */
    version: null, 
    
    /**
    *地图文档名称
    */
    docName: null,

    /**
    *地图文档下的地图的索引号，目前仅支持0
    */
    mapIndex: 0,
    
    /**
    *地图文档下图层的id
    */
    layerID: 0,
   
    /**
    *指定地图文档相关信息的结构,值为Zondy.Service.Catalog.IncludeStruct类型
    *语法：{includeDetails:true | false,includeSubs:true | false}
    *默认includeDetails为true ,includeSubs为false
    *示例：{includeDetails:true,includeSubs:true}
    *说明：当includeDetails为true时，includeSubs方有效
    */
    include:"{includeDetails:true,includeSubs:false}",

    /**
    *是否返回由DWS所返回的原始格式信息
    */
    returnFullStyle:false,

    /**
    *唯一标识，用于标识地图文档
    */
    guid: null,
    
    /**
    *唯一标识，用于标识地图文档缓存
    */
//    userid:null,

    setDocName: function (docName) {
        /// <summary>设置文档名称</summary>
        /// <param name="docName" type="String">文档名称</param>
        this.docName = docName;
    },

    setMapIndex: function (index) {
        /// <summary>设置地图序号</summary>
        /// <param name="index" type="Interger">地图在文档下得序号</param>
        this.mapIndex = index;
    },

    setLayerID: function (index) {
        /// <summary>设置图层序号</summary>
        /// <param name="index" type="Interger">图层在地图下得序号</param>
        this.layerID = index;
    },

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);
        if (this.guid == null) {
            this.guid = Zondy.Util.newGuid();
        }
        Zondy.Service.Catalog.CatalogServiceBase.prototype.initialize.apply(this);
    },

    getMapDocList: function (onSuccess) {
        /// <summary>获取服务器发布的地图文档列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        //(1)v为版本信息，例如v=2。当v缺省时，只返回直接发布的地图文档列表，当v=2时，返回包含直接发布的地图文档和目录形式发布的地图文档在内的所有地图文档列表。
        //(2)在发布地图文档时需注意，尽量保证直接发布的地图文档与目录发布的地图文档之间不存在重名文件。
        this.partUrl = "docs?v="+this.version+"&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getMapDocInfo: function (onSuccess) {
        /// <summary>获取指定地图文档的相关信息</summary>
        /// <param name="details" type="Boolean">返回结果是否包含细节内容</param>
        /// <param name="sub" type="Boolean">返回结果是否包含子项</param>
        this.partUrl = "docs/" + this.docName + "?include=" + this.include + "&returnFullStyle=" + this.returnFullStyle + "&guid=" + this.guid + "&f=" + this.resultFormat;
//        this.partUrl = "docs/" + this.docName + "?include=" + this.include + "&returnFullStyle=" + this.returnFullStyle + "&userid=" + this.userid + "&guid=" + this.guid + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getMapInfo: function (onSuccess, returnFullStyle, details, sub) {
        /// <summary>获取指定地图的相关信息</summary>
        /// <param name="details" type="Boolean">返回结果是否包含细节内容</param>
        /// <param name="sub" type="Boolean">返回结果是否包含子项</param>
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "?returnFullStyle" + this.returnFullStyle + "&guid=" + this.guid + "&f=" + this.resultFormat;
//        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "?returnFullStyle" + this.returnFullStyle + "&userid=" + this.userid + "&guid=" + this.guid + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getLayersInfo: function (onSuccess) {
        /// <summary>获取某地图下所有图层的图层信息</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/layers?f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getLayerInfo: function (onSuccess) {
        /// <summary>获取指定地图图层的相关信息</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/" + this.layerID + "?returnFullStyle=" + this.returnFullStyle +"&guid="+this.guid+"&f=" + this.resultFormat;
//        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/" + this.layerID + "?returnFullStyle=" + this.returnFullStyle + "&userid=" + this.userid + "&guid=" + this.guid + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    deleteLayer: function (onSuccess) {
        /// <summary>删除地图图层（GET）</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/layers/delete?layerIDs=" + this.layerID+"&guid=" + this.guid + "&f=" + this.resultFormat;
//        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/layers/delete?layerIDs=" + this.layerID + "&userid=" + this.userid + "&guid=" + this.guid + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    addLayer: function (addLayerInfos, onSuccess) {
        /// <summary>添加地图图层（POST）</summary>
        /// <param name="addLayerInfo" type="Array,Zondy.Service.Catalog.CAddMapLayerInfo in an Array">需要添加的图层</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/layers/add?guid="+this.guid+"&f=" + this.resultFormat;
//        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/layers/add?userid=" + this.userid + "&guid=" + this.guid + "&f=" + this.resultFormat;
        this.ajax(null, addLayerInfos, onSuccess, "POST");
    },

    changeIndex: function (newIndexArray, onSuccess) {
        /// <summary>更改图层顺序（POST）</summary>
        /// <param name="newIndexArray" type="Array,Interger in an Array">新图层的序号顺序数组</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/layers/index?guid=" + this.guid + "&f=" + this.resultFormat;
//        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex + "/layers/index?userid=" + this.userid + "&guid=" + this.guid + "&f=" + this.resultFormat;
        this.ajax(null, newIndexArray, onSuccess, "POST");
    },
    getLegendInfo: function (layerIDs, fields, onSuccess) {
        /// <summary>获取指定图层图例信息（Get）</summary>
        /// <param name="layerIDs" type="string">需要获取图例信息的图层索引,如0,6</param>
        ///<param name="fields" type="string">需要获取图例信息图层对应的字段,如省名,ID</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        /// <return type="Object">指定图层图例信息</return>
        var f = this.analysisResultType(this.resultFormat);
        this.partUrl = "legendInfo/" + this.docName + "?f=" + f + "&layerIndexes=" + layerIDs + "&fields=" + fields;
        this.ajax(null, null, onSuccess);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/
/*----------------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------TileLayer.js---------------------------------------------------------*/
Zondy.Service.Catalog.TileLayer = OpenLayers.Class(Zondy.Service.Catalog.CatalogServiceBase, {

    tileName: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);
        Zondy.Service.Catalog.CatalogServiceBase.prototype.initialize.apply(this);
    },

    setTileName: function (tileName) {
        /// <summary>设置瓦片名称</summary>
        /// <param name="docName" type="String">文档名称</param>
        this.tileName = tileName;
    },

    getTileList: function (onSuccess) {
        /// <summary>获取服务器瓦片列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "tiles?f=" + this.resultFormat + "&v=2";
        this.ajax(null, null, onSuccess);
    },

    getTileInfo: function (onSuccess) {
        /// <summary>获取指定瓦片的相关信息</summary>
        this.partUrl = "tiles/" + this.tileName + "?f=" + this.resultFormat + "&v=2.0";
        this.ajax(null, null, onSuccess);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------VectorLayer.js---------------------------------------------------------*/

Zondy.Service.Catalog.VectorLayer = OpenLayers.Class(Zondy.Service.Catalog.GDBInfo, {

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值对象</param>
        OpenLayers.Util.extend(this, options);
        Zondy.Service.Catalog.CatalogServiceBase.prototype.initialize.apply(this);
    },

    getSfclsList: function (onSuccess) {
        /// <summary>获取GDB下所有简单要素类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/sfcls?containAll=" + this.containAll + "&f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/sfcls?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess, null, null, null, null, { async: false });
    },
    getAclsList: function (onSuccess) {
        /// <summary>获取GDB下所有注记类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/acls?containAll=" + this.containAll + "&f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/acls?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getOclsList: function (onSuccess) {
        /// <summary>获取GDB下所有对象类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/ocls?containAll=" + this.containAll + "&f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/ocls?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getNclsList: function (onSuccess) {
        /// <summary>获取GDB下所有网络类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/ncls?containAll=" + this.containAll + "&f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/ncls?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getRdsList: function (onSuccess) {
        /// <summary>获取GDB下所有栅格数据集列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/rds?containAll=" + this.containAll + "&f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/rds?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getDsSfclsList: function (onSuccess) {
        /// <summary>获取GDB下指定要素集内所有简单要素类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/sfcls?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/sfcls?user=" + this.User + "&psw=" + this.Password +  "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getDsAclsList: function (onSuccess) {
        /// <summary>获取GDB下指定要素集内所有注记类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/acls?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/acls?user=" + this.User + "&psw=" + this.Password + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getDsOclsList: function (onSuccess) {
        /// <summary>获取GDB下指定要素集内所有对象类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/ocls?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/ocls?user=" + this.User + "&psw=" + this.Password +  "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },
    getDsNclsList: function (onSuccess) {
        /// <summary>获取GDB下指定要素集内所有网络类列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/ncls?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/ncls?user=" + this.User + "&psw=" + this.Password +"&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getRdsListInRcs: function (onSuccess) {
        /// <summary>获取GDB下指定栅格目录内所有栅格数据集列表</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.rcsName + "/rds?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.rcsName + "/rds?user=" + this.User + "&psw=" + this.Password  + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getLayerList: function (clsType, onSuccess) {
        /// <summary>通过传入的参数选择获取GDB下面的哪一类</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        /// <param name="clsType" type="String">值为"sfcls","ds", "acls", "ncls"，"ocls", "rds", "rcs"</param>
        ///</param>分别为数据库下简单要素类，要素集，注记类,网络类,对象类，栅格数据集，栅格目录</param>
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + clsType + "?containAll=" + this.containAll + "&f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + clsType + "?user=" + this.User + "&psw=" + this.Password + "&containAll=" + this.containAll + "&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getLayerListInDS: function (clsType, onSuccess) {
        /// <summary>通过传入的参数选择获取GDB下面指定要素集下的哪一类</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        /// <param name="clsType" type="String">值为"sfcls", "acls", "ncls"，"ocls", "rds", "rcs"
        ///分别为GDB下简单要素类，要素类，注记类或网络类
        if (this.serverName.toLowerCase() == "mapgislocal")
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/" + clsType + "?f=" + this.resultFormat;
        else
            this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + this.dsName + "/" + clsType + "?user=" + this.User + "&psw=" + this.Password +"&f=" + this.resultFormat;
        this.ajax(null, null, onSuccess);
    },

    getLayerInfo: function (gdbpUrl, onSuccess) {
        /// <summary>获取图层详细信息</summary>
        /// <param name="gdbpUrl" type="String">类URL</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.partUrl = "layerinfo?gdbpUrl=" + gdbpUrl + "&f=json";
        this.ajax(null, null, onSuccess, null, null, null, null, { async: false });
    },
    CreateVectCls:function (vectCls, onSuccess) {
        /**
        * 在指定GDB中创建图层
        * Parameters:
        * vectCls-{Zondy.Object.VectCls} 矢量类
        * 可指定图层的数据类型、几何形态、属性结构、要素数据集、空间参考等信息，
        * 其中图层的属性结构，采用POST参数形式传入
        * 若未设置图层名称，则图层名称为当前guid
        * onSuccess-{Function} 回调函数
        */
        var vectCls = (vectCls != null) ? vectCls : null;

                if(vectCls == null || this.serverName == null || this.gdbName == null){
        return;
    }

                if (this.User != null && this.Password != null ) {
        this.partUrl ="datasource/" + this.User + ":" + this.Password + "@";
    }
                else {
        this.partUrl = "datasource/";
    }

        var f = this.analysisResultType(this.resultFormat);

                if(vectCls.clsName == null){
        vectCls.clsName = Zondy.Util.newGuid();
    }

        this.partUrl += this.serverName + "/" + this.gdbName + "/" + vectCls.clsType + "/" + vectCls.clsName + "/create?"
                      + "geoType=" + vectCls.geoType + "&srefName=" + vectCls.srefName
                      + "&dsName=" + vectCls.dsName  + "&f=" + f;

        //将属性结构对象转为json字符串
        var attStructStr = $.toJSON(vectCls.attStruct);
          this.ajax(null, attStructStr, onSuccess, "POST", null, this.resultFormat);
    },
    deleteXCls: function (clsType, clsName, onSuccess) {
        if(this.serverName == null || this.gdbName == null || clsType == null || clsName == null){
            return;
        }
        var f = this.analysisResultType(this.resultFormat);
        this.partUrl = "datasource/" + this.serverName + "/" + this.gdbName + "/" + clsType +  "/" + clsName + "/delete?f=" + f;
        this.ajax(null, null, onSuccess);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ColorInfo.js---------------------------------------------------------*/
Zondy.Service.Catalog.ColorInfo = OpenLayers.Class(Zondy.Service.Catalog.CatalogServiceBase, {
    Blue: 0,
    ColorNO: 6,
    Green: 0,
    Red: 0,
    SystemLibID: 0,
    addNew: false,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值对象</param>
        OpenLayers.Util.extend(this, options);
        Zondy.Service.Catalog.CatalogServiceBase.prototype.initialize.apply(this);
    },
    getColorNO: function (options, onSuccess) {
        /// <summary>根据RGB获取颜色号</summary>
        /// <param name="options" type="object">rgb值</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.SystemLibID = options.SystemLibID;
        this.Red = options.Red;
        this.Green = options.Green;
        this.Blue = options.Blue;
        this.addNew = options.addNew;
        var f = this.resultFormat;
        this.partUrl = "ColorLib/getColorNO?f=" + f + "&libID=" + this.SystemLibID + "&r=" + this.Red + "&g=" + this.Green + "&b=" + this.Blue + "&addNew=" + this.addNew;
        this.ajax(null, null, onSuccess, null, null, null, null, { async: false });
    },
    getColorRGB: function (options, onSuccess) {
        /// <summary>根据颜色号获取RGB</summary>
        /// <param name="options" type="object">颜色号</param>
        /// <param name="onSuccess" type="Function">回调函数</param>
        this.SystemLibID = options.SystemLibID;
        this.ColorNO = options.ColorNO;
        var f = this.resultFormat;
        this.partUrl = "ColorLib/getColorRGB?f=" + f + "&libID=" + this.SystemLibID + "&colorNO=" + this.ColorNO;
        this.ajax(null, null, onSuccess, null, null, null, null, { async: false });
    }
});

/*---------------------------------------------------------EditServiceBase.js---------------------------------------------------------*/

Zondy.Service.EditServiceBase = OpenLayers.Class(Zondy.Service.HttpRequest, {
    /// <summary>用于添加要素的服务基类</summary>
    resultFormat: "json",

    initialize: function () {
        this.baseUrl = "igs/rest/mrfs";
    },

    getFullUrl: function () {
        /// <summary>获取完整服务的URL</summary>
        var s = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl + "/" + this.partUrl;
        return s;
    },

    getBaseUrl: function () {
        var s = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl + "/";
        return s;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------EditDocFeature.js---------------------------------------------------------*/
Zondy.Service.EditDocFeature = OpenLayers.Class(Zondy.Service.EditServiceBase, Zondy.Service.DocLayer, {
   
    /// <summary>添加要素到文档服务</summary>
    initialize: function (docName,layerIndex, options) {
        /// <summary>构造函数</summary>
        /// <param name="docName" type="String">文档名称</param>
        /// <param name="layerIndex" type="Interger">图层序号</param>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);
        this.docName = docName;
//        this.mapIndex = mapIndex;
        this.layerIndex = layerIndex;
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex.toString() + "/" + this.layerIndex.toString();
        Zondy.Service.EditServiceBase.prototype.initialize.apply(this);
    },

    add: function (features, onSuccess) {
        /// <summary>添加一组要素</summary>
        /// <param name="features" type="{Zondy.Object.FeatureSet}">添加一组要素</param>
        /// <param name="onSuccess" type="{Function}">添加成功后的回调函数</param>
        this.partUrl += "/addFeatures";
        var url = this.getFullUrl() + "?f=" + this.resultFormat;
        this.ajax(url, features, onSuccess, "POST");
    },

    update: function (features, onSuccess) {
        /// <summary>更新一组要素</summary>
        /// <param name="features"  type="{Zondy.Object.FeatureSet}">更新一组要素</param>
        /// <param name="onSuccess" type="{Function}">更新成功后的回调函数</param>

        this.partUrl += "/updateFeatures";
        var url = this.getFullUrl() + "?f=" + this.resultFormat;
        this.ajax(url, features, onSuccess, "POST");
    },

    deletes: function (featureIds, onSuccess) {
        /// <summary>删除一组要素</summary>
        /// <param name="featureIds"  type="{String}">删除一组要素，多个要素间用','分割</param>
        /// <param name="onSuccess" type="{Function}">删除成功后的回调函数</param>

        this.partUrl += "/deleteFeatures";
        var url = this.getFullUrl() + "?f=" + this.resultFormat + "&objectIds=" + featureIds;
        this.ajax(url, null, onSuccess, "POST");
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------EditLayerFeature.js---------------------------------------------------------*/
Zondy.Service.EditLayerFeature = OpenLayers.Class(Zondy.Service.EditServiceBase, {
    /// <summary>添加要素到图层</summary>
    gdbp: null,

    initialize: function (gdbp, options) {
        /// <summary>构造函数</summary>
        /// <param name="docName" type="String">文档名称</param>
        /// <param name="layerIndex" type="Interger">图层序号</param>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);
        this.gdbp = gdbp;
        this.partUrl = "layer";
        Zondy.Service.EditServiceBase.prototype.initialize.apply(this);
    },

    add: function (features, onSuccess) {
        /// <summary>添加一组要素</summary>
        /// <param name="features" type="{Zondy.Object.FeatureSet}">添加一组要素</param>
        /// <param name="onSuccess" type="{Function}">添加成功后的回调函数</param>
        this.partUrl += "/addFeatures";
        var url = this.getFullUrl() + "?f=" + this.resultFormat + "&gdbp=" + this.gdbp;
        this.ajax(url, features, onSuccess, "POST");
    },

    update: function (features, onSuccess) {
        /// <summary>更新一组要素</summary>
        /// <param name="features"  type="{Zondy.Object.FeatureSet}">更新一组要素</param>
        /// <param name="onSuccess" type="{Function}">更新成功后的回调函数</param>

        this.partUrl += "/updateFeatures";
        var url = this.getFullUrl() + "?f=" + this.resultFormat + "&gdbp=" + this.gdbp;
        this.ajax(url, features, onSuccess, "POST");
    },

    deletes: function (featureIds, onSuccess) {
        /// <summary>删除一组要素</summary>
        /// <param name="featureIds"  type="{String}">删除一组要素，多个要素间用','分割</param>
        /// <param name="onSuccess" type="{Function}">删除成功后的回调函数</param>

        this.partUrl += "/deleteFeatures";
        var url = this.getFullUrl() + "?f=" + this.resultFormat + "&objectIds=" + featureIds + "&gdbp=" + this.gdbp;
        this.ajax(url, null, onSuccess, "POST");
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryServiceBase.js---------------------------------------------------------*/

Zondy.Service.QueryServiceBase = OpenLayers.Class(Zondy.Service.HttpRequest, {

    /************************************private**************************************/
    resultCallBack: null,

    /**
    * 处理查询结果，并调用用户回调将结果返回给用户
    * Private, 本方法私有
    */
    processResult: function (jsonObj) {
        var rltObj = new Zondy.Object.FeatureSet();
        $.extend(rltObj, jsonObj);
        this.resultCallBack(rltObj);
    },

    /***********************************public*********************************************/

    /**
    *  用于查询的参数类
    *  {Zondy.Service.QueryParameter}
    */
    queryParam: null,

    initialize: function () {
        /// <summary>构造函数</summary>
        this.baseUrl = "igs/rest/mrfs/";
    },

    query: function (onSuccess) {
        /// <summary>查询函数，向服务器发送请求</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.queryParam == null) {
            return;
        }
        var fullRestUrl = "";

        if (this.queryParam instanceof Zondy.Service.QueryParameter) {
            // 如果是属于几何查询类
            fullRestUrl = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl
             + this.partUrl;
        }
        else {
            return;
        }
        var way = "";
        if (!this.requestType) {
            way = "GET";
        } else {
            way = this.requestType;
        }

        var dataObject = this.queryParam.getParameterObject();
        this.restQuery(fullRestUrl, dataObject, onSuccess, way);
    },

    restQuery: function (restUrl, dataObject, onSuccess, way) {
        this.resultCallBack = onSuccess;
        this.ajax(restUrl, dataObject, this.processResult, way, null, dataObject.f);

    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryFeatureStruct.js---------------------------------------------------------*/

Zondy.Service.QueryFeatureStruct = OpenLayers.Class({
    /**
    *  是否包含属性值
    *  {Bool}
    **/
    IncludeAttribute: true,

    /**
    *  是否包含几何图形信息
    *  {Bool}
    **/
    IncludeGeometry: false,

    /**
    *  是否包含图形参数
    *  {Bool}
    **/
    IncludeWebGraphic: false,

    toJSON: function () {
        /// <summary>获取此类的json形式的字符串</summary>
        return $.toJSON(this);
    },

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryParameterBase.js---------------------------------------------------------*/

Zondy.Service.QueryParameterBase = OpenLayers.Class({

    /// <summary>用于查询的几何描述
    /// {Zondy.Object.Tangram}
    /// </summary>
    geometry: null,

    /// <summary>
    /// 条件查询的SQL语句,如果为空，则表示为单一的几何查询；
    ///  如果取值，表示为几何和条件混合查询
    ///  {String}
    ///</summary>
    where: null,

    /// <summary>几何查询的规则
    ///{Zondy.Service.QueryFeatureRule}
    ///</summary>
    rule: null,

    /// <summary>
    ///     需要查询的要素OID号，多个间用‘，’分隔
    ///     如果此参数有值，查询将默认转化为使用要素ID查询，而忽略条件查询
    ///</summary>
    objectIds: null,


    /**
    * 分页号
    * {Interger}
    */
    pageIndex: 0,

    /**
    * 每页记录数
    * {Interger}
    */
    recordNumber: 20,

    /**
    * 查询结果的序列化形式(json（默认值）|xml|kml|gml|georss，对于xml，kml，gml或者georss格式的类xml类型将以text文本返回，如需要可调用$.parseXML(text)得到其xml包装)
    * {String}
    */
    resultFormat: "json",

    /**
    * 指定查询返回结果所包含的要素信息
    * {Zondy.Service.QueryFeatureStruct}
    */
    struct: null,
	
	/**
    * 指定查询返回结果的排序字段
    * {string}
    */
    orderField: null,

    /**
    * 是否升序排列，与orderField配合使用
    * {bool}
    */
    isAsc: false,

    initialize: function () {
        /// <summary>构造函数</summary>
        if (this.struct == null) {
            this.struct = new Zondy.Service.QueryFeatureStruct();
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryFeatureRule.js---------------------------------------------------------*/

Zondy.Service.QueryFeatureRule = OpenLayers.Class({
    /**
    *  是否仅比较要素的外包矩形，来判定是否与几何约束图形有交集
    *  {Bool}
    **/
    CompareRectOnly: false,

    /**
    *  是否将要素的可见性计算在内
    *  {Bool}
    **/
    EnableDisplayCondition: false,

    /**
    *  是否完全包含
    *  {Bool}
    **/
    MustInside: false,

    /**
    *  是否相交
    *  {Bool}
    **/
    Intersect: false,

    toJSON: function () {
        /// <summary>获取此类的json形式的字符串</summary>
        return $.toJSON(this);
    },

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryDocFeature.js---------------------------------------------------------*/

Zondy.Service.QueryDocFeature = OpenLayers.Class(Zondy.Service.QueryServiceBase, Zondy.Service.DocLayer, {

    onSuccess: null,
    
    initialize: function (queryParam, docName,layerIndex, options) {
        /// <summary>构造函数</summary>
        /// <param name="queryParam" type="Zondy.Service.QueryGeometryParameter">几何查询的参数类</param>
        /// <param name="docName" type="String">文档名称</param>
        /// <param name="layerIndex" type="Interger">图层序号</param>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);

        this.queryParam = queryParam;
        this.docName = docName;
//        this.mapIndex = mapIndex;
        this.layerIndex = layerIndex;
        this.partUrl = "docs/" + this.docName + "/" + this.mapIndex.toString() + "/" + this.layerIndex.toString() + "/query";
        Zondy.Service.QueryServiceBase.prototype.initialize.apply(this);
    },


    query: function (onSuccess) {
        /// <summary>查询函数，向服务器发送请求</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.queryParam == null) {
            return;
        }
        var fullRestUrl = "";

        if (this.queryParam instanceof Zondy.Service.QueryParameter) {
            // 如果是属于几何查询类
            fullRestUrl = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl
             + this.partUrl;
        }
        else {
            return;
        }
        var dataObject = this.queryParam.getParameterObject();
        this.restQuery(fullRestUrl, dataObject, onSuccess);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryLayerFeature.js---------------------------------------------------------*/

Zondy.Service.QueryLayerFeature = OpenLayers.Class(Zondy.Service.QueryServiceBase, {
    initialize: function (queryParam, options) {
        /// <summary>构造函数</summary>
        /// <param name="queryParam" type="Zondy.Service.QueryGeometryParameter">几何查询的参数类</param>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);

        this.queryParam = queryParam;
        this.partUrl = "layer/query";
        Zondy.Service.QueryServiceBase.prototype.initialize.apply(this);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryParameter.js---------------------------------------------------------*/
/**
* Class: OpenLayers.Geometry.Polygon 
* Polygon is a collection of Geometry.LinearRings. 
* 
* Inherits from:
*  - <Zondy.Service.QueryParameterBase> 
*  
*/
Zondy.Service.QueryParameter = OpenLayers.Class(Zondy.Service.QueryParameterBase, {

    getParameterURL: function () {
        /// <summary>获取相关参数的REST-URL表示形式</summary>
        var paramUrl = "";
        paramUrl = "geometry=" + this.geometry.toString();
        paramUrl += "&geometryType=" + this.geometry.getGeometryType();
        paramUrl += "&page=" + this.pageIndex.toString();
        paramUrl += "&pageCount=" + this.recordNumber.toString();
        paramUrl += "&f=" + this.resultFormat;
        if (this.struct != null)
            paramUrl += "&structs=" + $.toJSON(this.struct);
        if (this.where != null)
            paramUrl += "&where=" + this.where;
        if (this.rule != null)
            paramUrl += "&rule=" + $.toJSON(this.rule);
        if (this.objectIds != null)
            paramUrl += "&objectIds=" + this.objectIds;
        if (this.orderField != null)
            paramUrl += "&orderField=" + this.orderField;
        if (this.isAsc != null)
            paramUrl += "&isAsc=" + this.isAsc;		
        return paramUrl;
    },

    getParameterObject: function () {
        /// <summary>获取相关参数的Object形式,私有方法</summary>
        var obj = {};
        obj.f = this.resultFormat;
        if (this.struct != null) {
            obj.structs = this.struct.toJSON();
        }

        if (this.objectIds != null) {

            obj.objectIds = this.objectIds;
            return obj;
        };

        obj.page = this.pageIndex.toString();
        obj.pageCount = this.recordNumber.toString();

        if (this.geometry != null) {
            obj.geometry = this.geometry.toString();
            obj.geometryType = this.geometry.getGeometryType();
        }


        if (this.where != null)
            obj.where = this.where;
        if (this.rule != null)
            obj.rule = this.rule.toJSON();
		if (this.orderField != null)
            obj.orderField = this.orderField;
        if (this.isAsc != null)
            obj.isAsc = this.isAsc;
        return obj;
    },

    initialize: function (options) {
        /// <summary>构造函数</summary>
        this.struct = new Zondy.Service.QueryFeatureStruct();
        OpenLayers.Util.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------QueryByLayerParameter.js---------------------------------------------------------*/

/**
* Class: OpenLayers.Geometry.Polygon 
* Polygon is a collection of Geometry.LinearRings. 
* 
* Inherits from:
*  - <Zondy.Service.QueryParameterBase> 
*  
*/
Zondy.Service.QueryByLayerParameter = OpenLayers.Class(Zondy.Service.QueryParameter, {

    gdbp: null,

    getParameterURL: function () {
        /// <summary>获取相关参数的REST-URL表示形式</summary>
        var paramUrl = Zondy.Service.QueryParameter.prototype.getParameterURL.apply(this);
        return paramUrl + "&gdbp=" + this.gdbp;
    },

    getParameterObject: function () {
        /// <summary>获取相关参数的Object形式,私有方法</summary>
        var obj = Zondy.Service.QueryParameter.prototype.getParameterObject.apply(this);
        obj.gdbp = this.gdbp;
        return obj;
    },

    initialize: function (gdbp, options) {
        /// <summary>构造函数</summary>
        /// <param name="gdbp" type="String">被查询的图层的gdbp</param>
        /// <param name="options" type="Object">对象属性键值对</param>
        this.struct = new Zondy.Service.QueryFeatureStruct();
        this.gdbp = encodeURI(gdbp);
        OpenLayers.Util.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CAddMapLayerInfo.js---------------------------------------------------------*/

Zondy.Service.Catalog.CAddMapLayerInfo = OpenLayers.Class({

    Index: 0,
    LayerName: null,
    GDBP: null,

    initialize: function (layerName, index, gdbp) {
        /// <summary>构造函数</summary>
        /// <param name="layerName" type="String">图层名称</param>
        /// <param name="index" type="Interger">图层在地图或者组下的序号</param>
        /// <param name="gdbp" type="String">图层的gdbp</param>
        this.Index = index;
        this.LayerName = layerName;
        this.GDBP = gdbp;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CAddMapGroupInfo.js---------------------------------------------------------*/

Zondy.Service.Catalog.CAddMapGroupInfo = OpenLayers.Class({

    GroupName: null,
    Index: 0,
    AddMapLayerInfos: null,

    initialize: function (groupName, index, mapLayerInfo) {
        /// <summary>构造函数</summary>
        /// <param name="groupName" type="String">组名称</param>
        /// <param name="index" type="Interger">组在文档或者地图下的序号</param>
        /// <param name="mapLayerInfo" type="Array,Zondy.Service.Catalog.CAddMapLayerInfo in an Array">图层信息</param>
        this.GroupName = groupName;
        this.Index = index;
        this.AddMapLayerInfos = mapLayerInfo;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CAddMapInfo.js---------------------------------------------------------*/

Zondy.Service.Catalog.CAddMapInfo = OpenLayers.Class({
    /// <summary>地图名称</summary>
    MapName: null,

    /// <summary>地图在文档下的序号</summary>
    Index: 0,

    /// <summary>Array,Zondy.Service.Catalog.CAddMapLayerInfo in an Array，地图下的图层信息</summary>
    LayerInfos: null,

    /// <summary>Array,Zondy.Service.Catalog.CAddMapGroupInfo in an Array，地图下的组信息</summary>
    GroupInfos: null,

    initialize: function (mapName, layerInfos, options) {
        /// <summary>构造函数</summary>
        /// <param name="mapName" type="String">地图名称</param>
        /// <param name="layerInfos" type="Zondy.Service.Catalog.CAddMapLayerInfo in an Array">地图下的图层信息</param>
        /// <param name="options" type="Object">属性对象</param>

        this.MapName = mapName;
        this.LayerInfos = layerInfos;
        $.extend(this, options);
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------CAddDocInfo.js---------------------------------------------------------*/

Zondy.Service.Catalog.CAddDocInfo = OpenLayers.Class({
    /// <summary>用于创建一个地图文档</summary>

    /// <summary>是否在服务器文档列表里创建此文档结点</summary>
    CreatFolderNode: false,

    /// <summary>文档名称</summary>
    DocName: null,

    /// <summary>是否创建永久性地图文档，否则为临时性文档</summary>
    IsRelease: false,

    ///<summary>
    ///  地图文档下得地图信息
    ///  Array
    ///  A list of Zondy.Service.Catalog.AddMapInfo in an Array
    /// </summary>
    AddMapInfos: null,

    initialize: function (docName, mapInfos, options) {
        /// <summary>构造函数</summary>
        /// <param name="docName" type="String">需要创建的地图文档名</param>
        /// <param name="mapInfos" type="Array,Zondy.Service.Catalog.AddMapInfo in an Array">文档下的地图信息</param>
        /// <param name="options" type="Object">为此类的个属性赋值的对象</param>

        this.DocName = docName;
        this.AddMapInfos = mapInfos;
        $.extend(this, options);
    }
});

/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------PolygonJSON.js---------------------------------------------------------*/
Zondy.Format = {};
Zondy.Format.PolygonJSON = OpenLayers.Class(OpenLayers.Format.JSON, {
    /**
    Deserialize  a MapGIS Features , and Return an array of OpenLayers.Feature.Vector
    *
    * Parameters:
    * json-{String} | {Object},needs a Zondy.Object.FeatureSet format Javascript object.
    **/
    read: function (json, options) {
        var results = null;
        var obj = null;
        if (typeof json === 'string') {
            obj = OpenLayers.Format.JSON.prototype.read.apply(this,
                                                              [json]);
        } else {
            obj = json;
        }
        if (!obj) {
            OpenLayers.Console.error("Bad JSON:" + json);
        }
        return this.parseVectors(obj);
    },

    /*
    *   Parameters:
    *   obj: {Object},an object stand for Zondy.IGServer.WebService.REST.IGS.ExtendBaselibClass.SFeatureElementSet
    */
    parseVectors: function (zfeatureset) {
        // an array of OpenLayers.Feature.Vector
        var results = [];
        var vectorLength;
        if (!zfeatureset)
            return null;
        if (!zfeatureset.SFEleArray)
            return null;
        vectorLength = zfeatureset.SFEleArray.length;
        for (var i = 0; i < vectorLength; i++) {
            var zfeature = zfeatureset.SFEleArray[i];
            var attribute = this.parseAttribute(zfeatureset.AttStruct, zfeature.AttValue);
            var geometry = this.parseGeometry(zfeature.fGeom, zfeature.ftype);
            var vector = new OpenLayers.Feature.Vector(geometry, attribute, null);
            vector.fid = zfeature.FID.toString();
            vector.bounds = this.parseBound(zfeature.bound);
            results[i] = vector;
        }
        return results;
    },

    parseBound: function (zBound) {
        if (!zBound)
            return null;
        var result = new OpenLayers.Bounds(zBound.xmin, zBound.ymin, zBound.xmax, zBound.ymax);
        return result;
    },

    /*
    *  get the attribute object of the vector
    *   parameters :
    *   attstruct: {Object}, an object of Mapgis7.WebService.BasLib.GLine.AttStruct
    *   attvalue: {Array}
    */
    parseAttribute: function (attstruct, attvalue) {
        var attributes = {};
        var structLength;
        var valueLength;

        if (!attstruct && !attvalue)
            return null;
        structLength = attstruct.FldName.length;
        valueLength = attvalue.length;
        if (structLength != valueLength)
            return null;
        else {
            for (var i = 0; i < structLength; i++) {
                attributes[attstruct.FldName[i]] = attvalue[i];
            }
            return attributes;
        }
    },

    /*
    *   obj: {Object} an Object that response for mapgis  feature fGeom attribute
    */
    parseGeometry: function (fGeom, type) {
        var result = null;
        switch (type) {
            case 1:
                result = this.parseGPoint(fGeom.PntGeom);
                break;
            case 2:
                // if the obj is type of Line
                result = this.parseGLine(fGeom.LinGeom);
                break;
            case 3:
                // if the obj is type of Region
                result = this.parseGRegion(fGeom.RegGeom);
                break;
        }
        return result;
    },

    /*
    *   多个GRegion对应的是OpenLayers中的MulityplyPolygon,这里我们只取第一个GRegion
    */
    parseGRegion: function (gRegions) {
        /// <param name="gRegions" type="{Array}">an array of Mapgis7.WebService.BasLib.GRegion</param>
        var gRegionsLength;
        var results = [];
        var specifiedGRegion;
        if (!gRegions)
            return null;
        gRegionsLength = gRegions.length;
        if (gRegionsLength === 0)
            return null;
        specifiedGRegion = gRegions[0];
        if (!specifiedGRegion)
            return null;
        var specifiedGRegionLength = specifiedGRegion.Rings.length;
        for (var i = 0; i < specifiedGRegionLength; i++) {
            var zondyAnyLine = specifiedGRegion.Rings[i];
            var points = [];
            var zondyDots = zondyAnyLine.Arcs[0].Dots;
            var zondyDotsLength = zondyDots.length;
            for (var j = 0; j < zondyDotsLength; j++) {
                var point = new OpenLayers.Geometry.Point(zondyDots[j].x, zondyDots[j].y);
                points[j] = point;
            }
            results[i] = new OpenLayers.Geometry.LinearRing(points);
        }
        return new OpenLayers.Geometry.Polygon(results);
    },

    /*
    *  
    */
    parseGLine: function (glines) {
        /// <param name="glines" type="{Array}">an array of Mapgis7.WebService.BasLib.GLine</param>
        var glinesLength;
        var results = []; // an array of OpenLayers.Geometry.LinearRing;
        if (!glines)
            return null;
        glinesLength = glines.length;
        if (glinesLength === 0)
            return null;
        for (var i = 0; i < glinesLength; i++) {
            var points = [];
            var zondyDots = glines[i].Line.Arcs[0].Dots;
            var zondyDotsLength = zondyDots.length;
            for (var j = 0; j < zondyDotsLength; j++) {
                var point = new OpenLayers.Geometry.Point(zondyDots[j].x, zondyDots[j].y);
                points[j] = point;
            }
            results[i] = new OpenLayers.Geometry.LineString(points);
        }
        return new OpenLayers.Geometry.MultiLineString(results);
    },

    parseGPoint: function (gpoint) {
        if (!gpoint || gpoint.length == 0)
            return null;
        var points = [], dot;
        for (var i = 0, len = gpoint.length; i < len; i++) {
            dot = gpoint[i].Dot;
            points[i] = new OpenLayers.Geometry.Point(dot.x, dot.y);
        }
        var result = new OpenLayers.Geometry.MultiPoint(points);
        return result;
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ThemeOper.js---------------------------------------------------------*/

Zondy.Service.ThemeOper = OpenLayers.Class({
    /**
    * 查询服务器地址
    * {String}
    */
    ip: "localhost",
    /**
    * 会话id
    * {String}
    */
    guid: '',
    port: "6163",
    initialize: function (guid) {
        if (guid != null)
            this.guid = guid;
        else
            this.guid = Zondy.Util.newGuid();
    },
    /*
    * 获取专题图信息
    * mapDocName ：地图文档名称
    * idxArr：专题图索引数组(层次从地图开始，索引从0开始,例如："0/0,1/1,2/2")
    * onSuccess(themesInfoArr) : 获取成功回调方法
    */
    getThemesInfo: function (mapDocName, idxArr, onSuccess) {
        var rand = Math.random();
        var url = "http://" + this.ip + ":" + this.port + "/igs/rest/theme/" + mapDocName + "/get?idxArr=" + idxArr + "&r=" + rand + "&guid=" + this.guid;
        var http = new Zondy.Service.HttpRequest();
        http.ajax(url, null, function (jsonObj, status, xrequest) {
            var folderInfo = new Zondy.Object.Theme.FolderInfo();
            $.extend(true, folderInfo, jsonObj);
            if (folderInfo != null && folderInfo.attribute != null && folderInfo.attribute.length > 0) {
                var themesInfoArr = []; //new ThemesInfo[folderInfo.attribute.Length];
                var attArr;
                for (var i = 0; i < folderInfo.attribute.length; i++) {
                    themesInfoArr[i] = new Zondy.Object.Theme.ThemesInfo();
                    if (folderInfo.attribute[i] != null) {
                        themesInfoArr[i].LayerName = folderInfo.attribute[i].name;
                        attArr = $.parseJSON(folderInfo.attribute[i].value); //[];
                        //$.extend(true, attArr, folderInfo.attribute[i].Value);
                        if (attArr != null && attArr.length > 0) {
                            themesInfoArr[i].ThemeArr = []; //new ThemeBase[attArr.Length];
                            for (var j = 0; j < attArr.length; j++) {
                                switch (attArr[j].name) {
                                    case "CMultiClassTheme": //多表达式（多分段）专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CMultiClassTheme();
                                        break;
                                    case "CSimpleTheme": //简单专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CSimpleTheme();
                                        break;
                                    case "CChartTheme": //统计专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CChartTheme();
                                        break;
                                    case "CGraduatedSymbolTheme": //等级符号专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CGraduatedSymbolTheme();
                                        break;
                                    case "CDotDensityTheme": ////点密度专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CDotDensityTheme();
                                        break;
                                    case "CRandomTheme": //随机专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CRandomTheme();
                                        break;
                                    case "CFourColorTheme": //四色专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CFourColorTheme();
                                        break;
                                    case "CUniqueTheme": //唯一值专题图
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CUniqueTheme();
                                        break;
                                    case "CRangeTheme": //范围专题图（分段专题图）
                                        themesInfoArr[i].ThemeArr[j] = new Zondy.Object.Theme.CRangeTheme();
                                        break;
                                }
                                $.extend(true, themesInfoArr[i].ThemeArr[j], $.parseJSON(attArr[j].value));
                            }
                        }
                    }
                }
            }
            if (onSuccess != null)
                onSuccess(themesInfoArr);
        }, "Get");
    },
    /*
    * 删除专题图信息
    * mapDocName ：地图文档名称
    * idxArr：专题图索引数组(层次从地图开始，索引从0开始,例如："0/0,1/1,2/2")
    * onSuccess(themesInfoArr) : 获取成功回调方法
    */
    removeThemesInfo: function (mapDocName, idxArr, onSuccess) {
        var rand = Math.random();
        var url = "http://" + this.ip + ":" + this.port + "/igs/rest/theme/" + mapDocName + "/remove?idxArr=" + idxArr + "&r=" + rand + "&guid=" + this.guid;
        var http = new Zondy.Service.HttpRequest();
        http.ajax(url, null, function (jsonObj, status, xrequest) {
            if (onSuccess != null) {
                onSuccess(jsonObj);
            }
        }, "Get");
    },
    /*
    * 更新专题图信息
    * mapDocName ：地图文档名称
    * idxArr：专题图索引数组(层次从地图开始，索引从0开始,例如："0/0,1/1,2/2")
    * themesInfoArr: 更新的数据(ThemesInfo[])
    * onSuccess(themesInfoArr) : 获取成功回调方法
    */
    updateThemesInfo: function (mapDocName, idxArr, themesInfoArr, onSuccess) {
        var url = "http://" + this.ip + ":" + this.port + "/igs/rest/theme/" + mapDocName + "/update?idxArr=" + idxArr + "&guid=" + this.guid;
        var http = new Zondy.Service.HttpRequest();

        var jsStr = null;
        if (themesInfoArr != null && themesInfoArr.length > 0) {
            var folderInfo = new Zondy.Object.Theme.FolderInfo();
            folderInfo.name = "ThemeInfo";
            folderInfo.attribute = []; //new FolderInfoAttribute[themesInfoArr.Length];
            for (var i = 0; i < themesInfoArr.length; i++) {
                folderInfo.attribute[i] = new Zondy.Object.Theme.FolderInfoAttribute();
                folderInfo.attribute[i].name = themesInfoArr[i].LayerName;
                if (themesInfoArr[i].ThemeArr != null && themesInfoArr[i].ThemeArr.length > 0) {
                    var res = []; //new FolderInfoAttribute[themesInfoArr[i].ThemeArr.Length];
                    for (var j = 0; j < themesInfoArr[i].ThemeArr.length; j++) {
                        if (themesInfoArr[i].ThemeArr[j] != null)
                            res[j] = new Zondy.Object.Theme.FolderInfoAttribute(themesInfoArr[i].ThemeArr[j].Type, $.toJSON(themesInfoArr[i].ThemeArr[j]));
                    }
                    folderInfo.attribute[i].value = $.toJSON(res);
                }
            }
            jsStr = $.toJSON(folderInfo);
        }
        if (jsStr != null) {
            http.ajax(url, jsStr, function (jsonObj, status, xrequest) {
                if (onSuccess != null) {
                    onSuccess(jsonObj);
                }
            }, "POST", "application/text");
        }
        else {
            onSuccess(false);
        }
    },
    /*
    * 添加专题图信息
    * mapDocName ：地图文档名称
    * idxArr：专题图索引数组(层次从地图开始，索引从0开始,例如："0/0,1/1,2/2")
    * themesInfoArr: 添加的数据(ThemesInfo[])
    * onSuccess(themesInfoArr) : 获取成功回调方法
    */
    addThemesInfo: function (mapDocName, idxArr, themesInfoArr, onSuccess) {
        var url = "http://" + this.ip + ":" + this.port + "/igs/rest/theme/" + mapDocName + "/add?idxArr=" + idxArr + "&guid=" + this.guid;
        var http = new Zondy.Service.HttpRequest();

        var jsStr = null;
        if (themesInfoArr != null && themesInfoArr.length > 0) {
            var folderInfo = new Zondy.Object.Theme.FolderInfo();
            folderInfo.name = "ThemeInfo";
            folderInfo.attribute = []; //new FolderInfoAttribute[themesInfoArr.Length];
            for (var i = 0; i < themesInfoArr.length; i++) {
                folderInfo.attribute[i] = new Zondy.Object.Theme.FolderInfoAttribute();
                folderInfo.attribute[i].name = themesInfoArr[i].LayerName;
                if (themesInfoArr[i].ThemeArr != null && themesInfoArr[i].ThemeArr.length > 0) {
                    var res = []; //new FolderInfoAttribute[themesInfoArr[i].ThemeArr.Length];
                    for (var j = 0; j < themesInfoArr[i].ThemeArr.length; j++) {
                        if (themesInfoArr[i].ThemeArr[j] != null)
                            res[j] = new Zondy.Object.Theme.FolderInfoAttribute(themesInfoArr[i].ThemeArr[j].Type, $.toJSON(themesInfoArr[i].ThemeArr[j]));
                    }
                    folderInfo.attribute[i].Value = $.toJSON(res);
                }
            }
            jsStr = $.toJSON(folderInfo);
        }
        if (jsStr != null) {
            http.ajax(url, jsStr, function (jsonObj, status, xrequest) {
                if (onSuccess != null) {
                    onSuccess(jsonObj);
                }
            }, "POST", "application/text");
        }
        else {
            onSuccess(false);
        }
    }
});
/*----------------------------------------------------------------------------------------------------------------------------*/

/*---------------------------------------------------------ThemeStruct.js---------------------------------------------------------*/
if (Zondy.Object.Theme == null)
    Zondy.Object.Theme = {};
//---------------------------------------------------------------------------------------------------------------------------------------
/// <summary>
/// 统计图类型
/// </summary>
Zondy.Object.Theme.CChartType = {
    /// <summary>
    /// 未知类型
    /// </summary>
    Unknown: 0,
    /// <summary>
    /// 直方图
    /// </summary>
    Bar: 1,
    /// <summary>
    /// 3D直方图
    /// </summary>
    Bar3D: 2,
    /// <summary>
    /// 饼图
    /// </summary>
    Pie: 3,
    /// <summary>
    /// 3D饼图
    /// </summary>
    Pie3D: 4,
    /// <summary>
    /// 折线图
    /// </summary>
    Line: 5,
    /// <summary>
    /// 3D折线图
    /// </summary>
    Line3D: 6,
    /// <summary>
    /// 散点图
    /// </summary>
    Point: 7
};
/// <summary>
/// 统计图标注格式
/// </summary>
Zondy.Object.Theme.CChartLabelFormat = {
    /// <summary>
    /// 未知类型
    /// </summary>
    Unknown: 0,
    /// <summary>
    /// 实际值
    /// </summary>
    Value: 1,
    /// <summary>
    /// 百分比
    /// </summary>
    Percent: 2
};
/// <summary>
/// 线型调整方法枚举
/// </summary>
Zondy.Object.Theme.CLinAdjustType = {
    /// <summary>
    /// 调整
    /// </summary>
    Adjust: 0,
    /// <summary>
    /// 不调整
    /// </summary>
    NoAdjust: 1
};
/// <summary>
/// 线头类型枚举定义
/// </summary>   
Zondy.Object.Theme.CLinHeadType = {
    /// <summary>
    /// 圆头
    /// </summary>
    Round: 0,
    /// <summary>
    /// 平头
    /// </summary>
    Square: 1,
    /// <summary>
    /// 尖头
    /// </summary>
    Butt: 2
};
/// <summary>
/// 线拐角类型枚举
/// </summary>
Zondy.Object.Theme.CLinJointType = {
    /// <summary>
    /// 圆角
    /// </summary>
    Round: 0,
    /// <summary>
    /// 平角
    /// </summary>
    Square: 1,
    /// <summary>
    /// 尖角
    /// </summary>
    Butt: 2
};
/// <summary>
/// 线型生成方法
/// </summary>
Zondy.Object.Theme.CLinStyleMakeType = {
    /// <summary>
    /// 规律性生成线型
    /// </summary>
    Byrule: 0,
    /// <summary>
    /// 按控制点生成线型
    /// </summary> 
    Bypoint: 1
};
/// <summary>
/// 统计分段类型
/// </summary>
Zondy.Object.Theme.CItemType = {
    /// <summary>
    /// 未知类型
    /// </summary>
    Unknown: 0,
    /// <summary>
    /// 唯一值
    /// </summary>
    UniqueTheme: 1,
    /// <summary>
    /// 范围
    /// </summary>
    RangeTheme: 2
};
//---------------------------------------------------------------------------------------------------------------------------------------
//n:{string}
//att:{FolderInfoAttribute}
Zondy.Object.Theme.FolderInfo = function (n, att) {
    this.name = n;
    this.attribute = att;
};
//n:{string}
//v:{string}
Zondy.Object.Theme.FolderInfoAttribute = function (n, v) {
    this.name = n;
    this.Value = v;
};
/// <summary>
/// 专题图信息结构
/// </summary>
Zondy.Object.Theme.LayerThemeInfo = Zondy.Object.Theme.ThemesInfo = function () {
    /// <summary>
    /// 图层名{string}
    /// </summary>
    this.LayerName;
    /// <summary>
    /// 专题图数组{Array，存放各种专题图对象}
    /// </summary>
    this.ThemeArr;
};
/// <summary>
/// 专题图分段值
/// </summary>
Zondy.Object.Theme.ItemValue = function () {
    /// <summary>
    /// 开始值{string}
    /// </summary>
    this.StartValue;
    /// <summary>
    /// 结束值{string}
    /// </summary>
    this.EndValue;
    /// <summary>
    /// 统计分段类型{CItemType}
    /// </summary>
    this.ClassItemType;
};
/// <summary>
/// 表达式信息
/// </summary>
Zondy.Object.Theme.ExpInfo = function () {
    /// <summary>
    /// 获得分级字段表达式{string}
    /// </summary>
    this.Expression;
    /// <summary>
    /// 专题图分段值{Array,存放ItemValue对象}
    /// </summary>
    this.ItemValueArr;
};
/// <summary>
/// 专题图图形信息
/// </summary>
Zondy.Object.Theme.CThemeInfo = function () {
    /// <summary>
    /// 名称{string}
    /// </summary>
    this.Caption;
    /// <summary>
    /// 可见标志{bool}
    /// </summary>
    this.IsVisible;
    /// <summary>
    /// 最大显示比{double}
    /// </summary>
    this.MaxScale;
    /// <summary>
    /// 最小显示比{double}
    /// </summary>
    this.MinScale;
    /// <summary>
    /// 区信息{CRegInfo}
    /// </summary>
    this.RegInfo;
    /// <summary>
    /// 线信息{CLinInfo}
    /// </summary>
    this.LinInfo;
    /// <summary>
    /// 点信息{CPntInfo}
    /// </summary>
    this.PntInfo;
};
/// <summary>
/// 统一配置专题图
/// </summary>
Zondy.Object.Theme.CSimpleTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CSimpleTheme";
    /// <summary>
    /// 统一专题图的绘制信息
    /// </summary>
    this.ThemeInfo;
};
/// <summary>
/// 区信息
/// </summary>
Zondy.Object.Theme.CRegInfo = function () {
    /// <summary>
    /// 库ID{int}
    /// </summary>
    this.LibID = 0;
    /// <summary>
    /// 覆盖方式,true/false 覆盖/透明{bool}
    /// </summary>
    this.Ovprnt = false;
    /// <summary>
    /// 图案角度{float}
    /// </summary>
    this.Angle = 0.0;
    /// <summary>
    /// 结束填充色{int}
    /// </summary>
    this.EndClr = 0;
    /// <summary>
    /// 区域填充色{int}
    /// </summary>
    this.FillClr = 46;
    /// <summary>
    /// 填充模式{int}
    /// </summary>
    this.FillMode = 0;
    /// <summary>
    /// 是否需要完整图案填充{bool}
    /// </summary>
    this.FullPatFlg = true;
    /// <summary>
    /// 图案颜色{int}
    /// </summary>
    this.PatClr = 3;
    /// <summary>
    /// 图案高{int}
    /// </summary>
    this.PatHeight = 5;
    /// <summary>
    /// 图案编号{int}
    /// </summary>
    this.PatID = 0;
    /// <summary>
    /// 图案宽{float}
    /// </summary>
    this.PatWidth = 5;
    /// <summary>
    /// 图案笔宽{float}
    /// </summary>
    this.OutPenW = 1.0;
};
/// <summary>
/// 随机专题图(随机产生符号样式)
/// </summary>
Zondy.Object.Theme.CRandomTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CRandomTheme";
    /// <summary>
    /// 专题图信息{CThemeInfo}
    /// </summary>
    this.ThemeInfo;
};
Zondy.Object.Theme.CPntInfo = function () {
    /// <summary>
    /// 库ID{int}
    /// </summary>
    this.LibID = 0;
    /// <summary>
    /// 覆盖方式,true/false 覆盖/透明{bool}
    /// </summary>
    this.Ovprnt = false;
    /// <summary>
    /// 角度{float}
    /// </summary>
    this.Angle = 0;
    /// <summary>
    /// 背景颜色{int}
    /// </summary>
    this.BackClr = 0;
    /// <summary>
    /// 范围扩展{float}
    /// </summary>
    this.BackExp = 0;
    /// <summary>
    /// 自动压背景颜色标志{int}
    /// </summary>
    this.FillFlg = 0;
    /// <summary>
    /// 高度{float}
    /// </summary>
    this.Height = 0;
    /// <summary>
    /// 宽度{float}
    /// </summary>
    this.Width = 0;
    /// <summary>
    /// 可变颜色,数组长度为3{int[]}
    /// </summary>
    this.OutClr = [0, 0, 0];
    /// <summary>
    /// 符号编号{int}
    /// </summary>
    this.SymID = 0;
    /// <summary>
    /// 外部笔宽,数组长度为3{float[]}
    /// </summary>
    this.OutPenW = [0.05, 0.05, 0.05];
};
/// <summary>
///单值专题图
/// </summary>
Zondy.Object.Theme.CUniqueTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string} 
    /// </summary>
    this.Type = "CUniqueTheme";
    /// <summary>
    /// 缺省专题绘制信息{CThemeInfo}
    /// </summary>
    this.DefaultInfo;
    /// <summary>
    ///唯一字段表达式 类型{string}
    /// </summary>
    this.Expression;
    /// <summary>
    /// （笛卡尔积之后）每段专题绘制信息（如果不设置则采用默认绘制信息）{CThemeInfo[]} 
    /// </summary>
    this.UniqueThemeInfoArr;
    /// <summary>
    /// 每段专题绘制的图形类型，Reg/Lin/Pnt{string}
    /// </summary>
    this.GeoInfoType;
};

/// <summary>
/// 单值专题图信息
/// </summary>
Zondy.Object.Theme.CUniqueThemeInfo = function () {
    /// <summary>
    /// 值{string}
    /// </summary>
    this.Value;
    /// <summary>
    /// 名称{string}
    /// </summary>
    this.Caption;
    /// <summary>
    /// 可见标志{bool}
    /// </summary>
    this.IsVisible;
    /// <summary>
    /// 最大显示比{double}
    /// </summary>
    this.MaxScale;
    /// <summary>
    /// 最小显示比{double}
    /// </summary>
    this.MinScale;
    /// <summary>
    /// 区信息{CRegInfo}
    /// </summary>
    this.RegInfo;
    /// <summary>
    /// 线信息{CLinInfo}
    /// </summary>
    this.LinInfo;
    /// <summary>
    /// 点信息{CPntInfo}
    /// </summary>
    this.PntInfo;
};
/// <summary>
/// 多表达式（多字段）分段专题图
/// </summary>
Zondy.Object.Theme.CMultiClassTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CMultiClassTheme";
    /// <summary>
    /// 缺省专题绘制信息{CThemeInfo}
    /// </summary>
    this.DefaultInfo;
    /// <summary>
    /// 分段信息{ExpInfo[]}
    /// </summary>
    this.ExpInfoArr;
    /// <summary>
    /// （笛卡尔积之后）每段专题绘制信息（如果不设置则采用默认绘制信息）{CThemeInfo[]}
    /// </summary>
    this.MultiClassThemeInfoArr;
    /// <summary>
    /// 每段专题绘制的图形类型，Reg/Lin/Pnt{string}
    /// </summary>
    this.GeoInfoType;
};
/// <summary>
/// 线图形参数对象
/// </summary>
Zondy.Object.Theme.CLinInfo = function () {
    /// <summary>
    /// 库ID{int}
    /// </summary>
    this.LibID = 0;
    /// <summary>
    /// 覆盖方式,true/false 覆盖/透明{bool}
    /// </summary>
    this.Ovprnt = false;
    /// <summary>
    /// 线型调整方法{CLinAdjustType}
    /// </summary>
    this.AdjustFlg = Zondy.Object.Theme.CLinAdjustType.Adjust;
    /// <summary>
    /// 线头类型{CLinHeadType}
    /// </summary>
    this.HeadType = Zondy.Object.Theme.CLinHeadType.Round;
    /// <summary>
    /// 拐角类型{CLinJointType}
    /// </summary>
    this.JointType = Zondy.Object.Theme.CLinJointType.Round;
    /// <summary>
    /// 线型号{int}
    /// </summary>
    this.LinStyID = 0;
    /// <summary>
    /// 线型生成方法{CLinStyleMakeType}
    /// </summary>
    this.MakeMethod = Zondy.Object.Theme.CLinStyleMakeType.Byrule;
    /// <summary>
    /// 可变颜色,数组长度为3{int[]}
    /// </summary>
    this.OutClr = [46, 4, 3];
    /// <summary>
    /// X系数{float}
    /// </summary>
    this.XScale = 10;
    /// <summary>
    /// Y系数{float}
    /// </summary>
    this.YScale = 10;
    /// <summary>
    /// 外部笔宽,数组长度为3{float[]}
    /// </summary>
    this.OutPenW = [0.05, 0.05, 0.05];
};
/// <summary>
/// 等级符号专题图(根据符号的大小来反映数据的级别差异)
/// </summary>
Zondy.Object.Theme.CGraduatedSymbolTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CGraduatedSymbolTheme";
    /// <summary>
    /// 一定大小的符号代表的属性值{float}
    /// </summary>
    this.BaseValue = 0.000141;
    /// <summary>
    /// 是否显示负值{bool}
    /// </summary>
    this.DispMinus = false;
    /// <summary>
    /// 是否显示零值{bool}
    /// </summary>
    this.DispZero = true;
    /// <summary>
    /// 字段表达式{string}
    /// </summary>
    this.Expression;
    /// <summary>
    /// 负值点图形信息{CPntInfo}
    /// </summary> 
    this.MinusPntInfo;
    /// <summary>
    /// 正值点图形信息{CPntInfo}
    /// </summary>
    this.PlusPntInfo;
    /// <summary>
    /// 零值点图形信息{CPntInfo}
    /// </summary>
    this.ZeroPntInfo;
};
/// <summary>
/// 四色专题图
/// </summary>
Zondy.Object.Theme.CFourColorTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CFourColorTheme";
    /// <summary>
    /// 颜色信息,最长为16,优先选择前4种{int[]}
    /// </summary>
    this.ClrInfo = [25, 57, 89, 121];
};
/// <summary>
/// 点密度专题图
/// </summary>
Zondy.Object.Theme.CDotDensityTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CDotDensityTheme";
    /// <summary>
    /// 字段表达式{string}
    /// </summary>
    this.Expression;
    /// <summary>
    /// 点图形信息{CPntInfo}
    /// </summary>
    this.Info;
    /// <summary>
    /// 专题图中每一个点所代表的数值{double}
    /// </summary>
    this.Value;
};
Zondy.Object.Theme.CChartThemeRepresentInfo = function () {
    /// <summary>
    /// 统计值作为注记的表现信息{CAnnInfo}
    /// </summary>
    this.AnnInfoLabel;
    /// <summary>
    /// 统计值小数点位置{int}
    /// </summary>
    this.DigitLabel = 0;
    /// <summary>
    /// 统计值类型{CChartLabelFormat}
    /// </summary>
    this.FormatLabel = Zondy.Object.Theme.CChartLabelFormat.Unknown;
    /// <summary>
    /// 是否显示统计值{bool}
    /// </summary>
    this.IsDrawLabel = true;
    /// <summary>
    /// 线颜色值{int}
    /// </summary>
    this.LineColor = -1;
    /// <summary>
    /// 统计图标最大长度{double}
    /// </summary>
    this.MaxLength = 30;
    /// <summary>
    /// 统计图标最小半径{double}
    /// </summary>
    this.MinRadius = 10;
    /// <summary>
    /// 统计图标大小是否固定{int}
    /// </summary>
    this.PieSizeFixFlag = 0;
    /// <summary>
    /// 统计图标倾斜角度{double}
    /// </summary>
    this.PieTiltedAngle = 30;
    /// <summary>
    /// 统计图标半径{double}
    /// </summary>
    this.PlotRadius = 1;
    /// <summary>
    /// 统计图标厚度{double}
    /// </summary>
    this.ThickPersent = 10;
    /// <summary>
    /// 统计图标宽度{double}
    /// </summary>
    this.Width = 3;
};
/// <summary>
/// 统计专题图信息
/// </summary>
Zondy.Object.Theme.CChartThemeInfo = function () {
    /// <summary>
    /// 字段表达式{string}
    /// </summary>
    this.Expression;
    /// <summary>
    /// 名称{string}
    /// </summary>
    this.Caption;
    /// <summary>
    /// 可见标志{bool}
    /// </summary>
    this.IsVisible = true;
    /// <summary>
    /// 最大显示比{double}
    /// </summary>
    this.MaxScale = 0;
    /// <summary>
    /// 最小显示比{double}
    /// </summary>
    this.MinScale = 0;
    /// <summary>
    /// 区信息{CRegInfo}
    /// </summary>
    this.RegInfo;
    /// <summary>
    /// 线信息{CLinInfo}
    /// </summary>
    this.LinInfo;
    /// <summary>
    /// 点信息{CPntInfo}
    /// </summary>
    this.PntInfo;
};
/// <summary>
/// 统计专题图
/// </summary>
Zondy.Object.Theme.CChartTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CChartTheme";
    /// <summary>
    /// 统计图类型{CChartType}
    /// </summary>
    this.ChartType;
    /// <summary>
    /// 统计图符号参数信息{CChartThemeRepresentInfo}
    /// </summary>
    this.RepresentInfo;
    /// <summary>
    /// 统计专题图信息{CChartThemeInfo[]}
    /// </summary>
    this.ChartThemeInfoArr;
};
/// <summary>
/// 注记参数对象
/// </summary>
Zondy.Object.Theme.CAnnInfo = function () {
    /// <summary>
    /// 库ID{int}
    /// </summary>
    //[DataMember(Name = "libID")]
    this.LibID = 0;
    /// <summary>
    /// 覆盖方式,true/false 覆盖/透明{bool}
    /// </summary>
    //[DataMember(Name = "ovprnt")]
    this.Ovprnt = false;
    /// <summary>
    /// 角度值{float}
    /// </summary>
    this.Angle = 0;
    /// <summary>
    /// 背景颜色{int}
    /// </summary>
    this.BackClr = 0;
    /// <summary>
    /// 文本显示范围扩展,返回扩展值{int}
    /// </summary>     
    this.BackExp = 0;
    /// <summary>
    /// 西文字体{int}
    /// </summary>
    this.Chnt = 0;
    /// <summary>
    /// 颜色号{int}
    /// </summary>
    this.Color = 0;
    /// <summary>
    /// 字符角度值{float}
    /// </summary>
    this.FontAngle = 0;
    /// <summary>
    /// 高度{float}
    /// </summary>
    this.Height = 0;
    /// <summary>
    /// 中文字体{float}
    /// </summary>
    this.Ifnt = 0;
    /// <summary>
    /// 字形{int}
    /// </summary>
    this.Ifnx = 0;
    /// <summary>
    /// 自动压背景颜色返回true，否则返回false{bool}
    /// </summary>
    this.IsFilled = false;
    /// <summary>
    /// 排列方式,水平排列返回true，垂直排列返回false{bool}
    /// </summary>
    this.IsHzpl = true;
    /// <summary>
    /// X方向的偏移{float}
    /// </summary>
    this.OffsetX = 0;
    /// <summary>
    /// Y方向的偏移{float}
    /// </summary>
    this.OffsetY = 0;
    /// <summary>
    /// 间隔值{float}
    /// </summary>
    this.Space = 0;
    /// <summary>
    /// 宽度{float}
    /// </summary>
    this.Width = 0;
};
Zondy.Object.Theme.CRangeTheme = function () {
    /// <summary>
    /// 专题图名称{string}
    /// </summary>
    this.Name;
    /// <summary>
    /// 是否是单值或者分段专题图{bool}
    /// </summary>
    this.IsBaseTheme = false;
    /// <summary>
    /// 专题图可见性{bool}
    /// </summary>
    this.Visible = true;
    /// <summary>
    /// 类型{string}
    /// </summary>
    this.Type = "CRangeTheme";
    /// <summary>
    /// 专题图类型(CAllOtherDataItemInfoSource)
    /// </summary>
    this.AllOtherDataItemInfoSource = Zondy.Object.Theme.CAllOtherDataItemInfoSource.DefaultThemeInfo;
    /// <summary>
    /// 唯一字段表达式
    /// </summary>
    this.Expression = "";
    /// <summary>
    /// 缺省专题绘制信息(Zondy.Object.Theme.CThemeInfo)
    /// </summary>
    this.DefaultInfo = null;
    /// <summary>
    /// 范围专题图项信息数组(CRangeThemeInfo[])
    /// </summary>
    this.RangeThemeInfoArr = null;
};
/// <summary>
/// 未参与分类数据图形参数
/// </summary>
Zondy.Object.Theme.CAllOtherDataItemInfoSource = {
    /// <summary>
    /// 缺省的专题图形信息
    /// </summary> 
    DefaultThemeInfo: 1,
    /// <summary>
    /// 数据项的固有图形信息
    /// </summary>
    DataItemIntrinsicInfo: 2
};
/// <summary>
/// 分段专题图信息
/// </summary>
Zondy.Object.Theme.CRangeThemeInfo = function () {
    /// <summary>
    /// 名称{string}
    /// </summary>
    this.Caption;
    /// <summary>
    /// 可见标志{bool}
    /// </summary>
    this.IsVisible;
    /// <summary>
    /// 最大显示比{double}
    /// </summary>
    this.MaxScale;
    /// <summary>
    /// 最小显示比{double}
    /// </summary>
    this.MinScale;
    /// <summary>
    /// 区信息{CRegInfo}
    /// </summary>
    this.RegInfo;
    /// <summary>
    /// 线信息{CLinInfo}
    /// </summary>
    this.LinInfo;
    /// <summary>
    /// 点信息{CPntInfo}
    /// </summary>
    this.PntInfo;
    /// <summary>
    /// 开始值
    /// </summary>
    this.StartValue = "";
    /// <summary>
    /// 结束值
    /// </summary>
    this.EndValue = "";
};
/*----------------------------------------------------------------------------------------------------------------------------*/



/*---------------------------------------------------------MultiGeoQueryParameter.js---------------------------------------------------------*/

Zondy.Service.MultiGeoQueryParameter = OpenLayers.Class({
    /// <summary>用于查询的多几何数组
    /// {Zondy.Object.Point2D或Zondy.Object.PolyLine或Zondy.Object.Polygon对象构成的数组}
    /// </summary>
    geometry: null,

    /// <summary>
    /// 几何类型，表示geometry中元素代表的几何类型，可取值为"point","line","polygon"
    ///  {String}
    ///</summary>
    geometryType: null,

    /// <summary>
    /// 回调结果的包装形式
    ///  {String}
    ///</summary>
    resultFormat: "json",

    /// <summary>
    /// 缓冲半径，仅在多点和多线查询时起效
    ///  {String}
    ///</summary>
    nearDis: 0.0001,

    getParameterURL: function () {
        /// <summary>获取相关参数的REST-URL表示形式</summary>
        var paramUrl = "";
        paramUrl += "?f=" + this.resultFormat;
        paramUrl += "&geometryType=" + this.geometryType;
        paramUrl += "&nearDis=" + this.nearDis;
        return paramUrl;
    },

    initialize: function (options) {
        $.extend(this, options);
    }
});
/*-------------------------------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------MultiGeoQuery.js---------------------------------------------------------*/
Zondy.Service.MultiGeoQuery = OpenLayers.Class(Zondy.Service.QueryServiceBase, Zondy.Service.DocLayer, {

    onSuccess: null,

    initialize: function (queryParam, docName, layerIndex, options) {
        /// <summary>构造函数</summary>
        /// <param name="queryParam" type="Zondy.Service.MultiGeoQueryParameter">多几何查询的参数类</param>
        /// <param name="docName" type="String">文档名称</param>
        /// <param name="mapIndex" type="Interger">地图序号</param>
        /// <param name="layerIndex" type="String">图层序号</param>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);

        this.queryParam = queryParam;
        this.mapName = docName;
//        this.mapIndex = mapIndex;
        this.layerIndex = layerIndex;
        this.partUrl = "docs/" + this.mapName + "/" + this.mapIndex.toString() + "/" + this.layerIndex + "/Geoquery";
        this.partUrl += queryParam.getParameterURL();

        Zondy.Service.QueryServiceBase.prototype.initialize.apply(this);
    },


    query: function (onSuccess) {
        /// <summary>查询函数，向服务器发送请求</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.queryParam == null) {
            return;
        }
        var fullRestUrl = "";
        this.baseUrl = "igs/rest/extend/MultiGeo/";
        if (this.queryParam instanceof Zondy.Service.MultiGeoQueryParameter) {
            // 如果是属于多几何查询类
            fullRestUrl = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl
             + this.partUrl;
        }
        else {
            return;
        }

        if (this.queryParam.geometryType == "point") {
            var dataObj = { pointArr: this.queryParam.geometry }
        }
        else if (this.queryParam.geometryType == "line") {
            var dataObj = { lineArr: this.queryParam.geometry }
        }
        else if (this.queryParam.geometryType == "polygon") {
            var dataObj = { PolygonObjs: this.queryParam.geometry }
        }

        this.ajax(fullRestUrl, dataObj, onSuccess, "post", null, this.resultFormat)
    }
});
/*-------------------------------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------ObjClsQueryParameter.js---------------------------------------------------------*/
Zondy.Service.ObjClsQueryParameter = OpenLayers.Class({

    /// <summary>
    ///     需要查询的要素OID号，多个间用‘，’分隔
    ///     如果此参数有值，查询将默认转化为使用要素ID查询，而忽略条件查询
    ///</summary>
    objectIds: null,

    /// <summary>
    /// 条件查询的SQL语句；
    ///  {String}
    ///</summary>
    where: null,

    /// <summary>
    /// 回调结果的包装形式
    ///  {String}
    ///</summary>
    resultFormat: "json",


    getParameterURL: function () {
        /// <summary>获取相关参数的REST-URL表示形式</summary>
        var paramUrl = "";
        paramUrl += "&f=" + this.resultFormat;
        if (this.objectIds != null) {
            paramUrl += "&objectIds=" + this.objectIds;
        }
		if (this.where != null) {
			paramUrl += "&where=" + this.where;
		}
        return paramUrl;
    },

    initialize: function (options) {
        $.extend(this, options);
    }
});
/*-------------------------------------------------------------------------------------------------------------------------------------------*/
/*---------------------------------------------------------ObjClsQuery.js---------------------------------------------------------*/
Zondy.Service.ObjClsQuery = OpenLayers.Class(Zondy.Service.QueryServiceBase, {

    onSuccess: null,

    initialize: function (queryParam, gdbp, options) {
        /// <summary>构造函数</summary>
        /// <param name="queryParam" type="Zondy.Service.ObjClsQueryParameter">对象类查询的参数类</param>
        /// <param name="gdbp" type="String">对象类的GDBP地址</param>
        /// <param name="options" type="Object">属性赋值对象</param>
        $.extend(this, options);

        this.queryParam = queryParam;
        this.gdbp = gdbp;

        this.partUrl = "objlayer/query?gdbp=" + gdbp;
        this.partUrl += queryParam.getParameterURL();

        Zondy.Service.QueryServiceBase.prototype.initialize.apply(this);
    },


    query: function (onSuccess) {
        /// <summary>查询函数，向服务器发送请求</summary>
        /// <param name="onSuccess" type="Function">回调函数</param>
        if (this.queryParam == null) {
            return;
        }
        var fullRestUrl = "";
        this.baseUrl = "igs/rest/extend/dxlcz/";
        if (this.queryParam instanceof Zondy.Service.ObjClsQueryParameter) {
            // 如果是属于多几何查询类
            fullRestUrl = "http://" + this.ip + ":" + this.port + "/" + this.baseUrl
             + this.partUrl;
        }
        else {
            return;
        }
        this.ajax(fullRestUrl, null, onSuccess, "GET", null, this.resultFormat);
    }
});
/*-------------------------------------------------------------------------------------------------------------------------------------------*/

//========================================Zondy.Map.HeatMapLayer.js======================================================//
Zondy.Map.HeatMapLayer = OpenLayers.Class(OpenLayers.Layer, {
    /// <summary>点半径 {Double}</summary>
    radius: 20,

    /// <summary>要素数组 {Array<OpenLayers.Feature.Vector>}</summary>        
    featureArr: null,

    /// <summary>要素权 {String}</summary>
    featureWeight: null,

    /// <summary>要素半径 {String}</summary>
    featureRadius: null,

    /// <summary>最大权值 {Double}</summary>
    maxWeight: 0,

    /// <summary>最大宽度 {Double}</summary>
    maxWidth: 0,

    /// <summary>最大高度 {Double}</summary>
    maxHeight: 0,

    /*内部变量*/
    EVENT_TYPES: ["featuresadded", "featuresremoved", "featuresdrawcompleted"],
    baseCanvas: null,
    canvasContext: null,
    pixelHeatPoints: null,
    alphaValues: null,
    colorValues: null,
    canvasData: null,
    tempMaxValue: null,

    /// <summary>热力图图层类构造函数</summary>
    /// <param name="name" type="String">热力图显示名称</param>
    /// <param name="options" type="String">其他属性键值对</param>
    initialize: function (name, option) {


        OpenLayers.Util.extend(this, option);

        OpenLayers.Layer.prototype.initialize.apply(this, arguments);

        this.EVENT_TYPES = Zondy.Map.HeatMapLayer.prototype.EVENT_TYPES.concat(OpenLayers.Layer.prototype.EVENT_TYPES);

        this.baseCanvas = document.createElement("canvas");
        if (!this.baseCanvas.getContext) {
            return;
        }

        this.baseCanvas.id = "Canvas_" + this.id;
        this.baseCanvas.style.position = "absolute";
        this.div.appendChild(this.baseCanvas);
        this.canvasContext = this.baseCanvas.getContext("2d");
    },

    /// <summary>添加要素</summary>
    /// <param name="features" type="Array" OpenLayers.Feature.Vector in an Array>添加的要素</param>
    addHeatFeatures: function (features) {
        if (!(OpenLayers.Util.isArray(features))) {
            features = [features];
        }
        this.featureArr = this.featureArr || [];
        if (this.featureArr.length == 0) {
            this.featureArr = features;
        } else {
            this.featureArr.concat(features);
        }
        this.events.triggerEvent("featuresadded", {
            features: features,
            succeed: true
        });
        this.refresh();
    },

    /// <summary>删除要素</summary>
    /// <param name="features" type="Array" OpenLayers.Feature.Vector in an Array>删除的要素</param>
    removeHeatFeatures: function (features) {
        if (!features || features.length === 0 || !this.featureArr || this.featureArr.length === 0) {
            return null;
        }
        if (features === this.featureArr) {
            return this.removeAllFeatures();
        }
        if (!(OpenLayers.Util.isArray(features))) {
            features = [features];
        }
        var feature;
        var featuresInLayer = [];
        var featureIndex = -1;

        for (var i = 0; i < features.length; i++) {
            feature = features[i];
            featureIndex = OpenLayers.Util.indexOf(this.featureArr, feature);
            if (featureIndex === -1) {
                featuresInLayer.push(feature);
                continue;
            }
            this.featureArr.splice(featureIndex, 1);
        }
        var hasFeature = featuresInLayer.length == 0 ? true : false;
        this.refresh();
        this.events.triggerEvent("featuresremoved", {
            features: featuresInLayer,
            succeed: hasFeature
        });
    },

    /// <summary>删除所有要素</summary>
    removeAllFeatures: function () {
        if (this.featureArr && this.featureArr.length > 0) {
            for (var i = 0; i < this.featureArr.length; i++) {
                this.featureArr[i].destroy();
                this.featureArr[i] = null;
            }
        }
        this.featureArr = [];
        this.refresh();
    },

    /// <summary>更新指定范围内的要素（内部方法）</summary>
    /// <param name="extent" type="OpenLayers.Bounds">热力图显示名称</param>
    updateHeatFeatures: function (extent) {
        this.pixelHeatPoints = [];
        if (this.featureArr && this.featureArr.length > 0) {
            var i = 0, j = 0;
            var weight = -1;
            var resolution = this.map.getResolution();
            for (i = this.featureArr.length - 1; i >= 0; i--) {
                var feature = this.featureArr[i];
                var geom = feature.geometry;
                if (extent.contains(geom.x, geom.y)) {
                    //将地图坐标转换为像素坐标
                    var x = (geom.x / resolution + (-extent.left / resolution));
                    var y = ((extent.top / resolution) - geom.y / resolution);
                    var rad = this.featureRadius && feature.attributes[this.featureRadius] ? feature.attributes[this.featureRadius] : null;
                    rad = rad ? parseInt(rad / resolution) : rad;
                    var point = {
                        x: parseInt(x),
                        y: parseInt(y),
                        weight: feature.attributes[this.featureWeight],
                        geoRadius: rad
                    };
                    this.pixelHeatPoints.push(point);
                    weight = Math.max(weight, point.weight);
                }
            }
            this.tempValue = this.maxWeight ? this.maxWeight : weight;

            //绘制热力点
            this.canvasData = this.canvasContext.createImageData(this.maxWidth, this.maxHeight);
            this.alphaValues = [];
            this.colorValues = [];
            for (i = this.maxWidth - 1; i >= 0; i--) {
                this.alphaValues.push(new Array(this.maxHeight));
                this.colorValues.push(new Array(this.maxHeight));
            }
            for (j = this.pixelHeatPoints.length - 1; j >= 0; j--) {
                this.showHeatPoint(this.pixelHeatPoints[j].x, this.pixelHeatPoints[j].y, this.pixelHeatPoints[j].weight, this.pixelHeatPoints[j].geoRadius);
            }
            this.canvasContext.clearRect(0, 0, this.maxWidth, this.maxHeight);
            this.canvasContext.putImageData(this.canvasData, 0, 0);
            this.events.triggerEvent("featuresdrawcompleted");
        } else {
            this.canvasContext.clearRect(0, 0, this.maxWidth, this.maxWidth);
        }
    },

    /// <summary>显示热力点（内部方法）</summary>
    /// <param name="x" type="Int">x坐标</param>
    /// <param name="y" type="Int">y坐标</param>
    /// <param name="weight" type="double">权值</param>
    /// <param name="geoRadius" type="double">半径</param>
    showHeatPoint: function (x, y, weight, geoRadius) {
        if (weight == 0) {
            return;
        }
        var ratio = weight / this.tempValue;
        var rad = 3 + parseInt(this.radius * ratio);
        var temp;
        var xPixel, yPixel;
        if (geoRadius || geoRadius == 0) {
            rad = geoRadius;
        }
        for (var i = 0; i < rad; i++) {
            for (var j = 0; j <= rad; j++) {
                if (i && j) {
                    temp = 1 - Math.sqrt(i * i + j * j) / rad;
                    if (temp <= 0) {
                        xPixel = 0;
                        yPixel = 0;
                    } else {
                        xPixel = temp * temp * (0.1 + 0.9 * ratio);
                        yPixel = temp * ratio;
                    }
                    if (yPixel <= 0) {
                        break;
                    }
                    this.setHeatPointColor(x - i, y - j, xPixel, yPixel);
                    this.setHeatPointColor(x - i, y + j, xPixel, yPixel);
                    this.setHeatPointColor(x + i, y - j, xPixel, yPixel);
                    this.setHeatPointColor(x + i, y + j, xPixel, yPixel);
                } else {
                    if (!j) {
                        temp = 1 - i / rad;
                        xPixel = temp * temp * (0.1 + 0.9 * ratio);
                        yPixel = temp * ratio;
                        if (0 != i) {
                            this.setHeatPointColor(x + i, y, xPixel, yPixel);
                            this.setHeatPointColor(x - i, y, xPixel, yPixel);
                        } else {
                            this.setHeatPointColor(x, y, xPixel, yPixel);
                        }
                    } else {
                        if (!i) {
                            temp = 1 - j / rad;
                            yPixel = temp * ratio;
                            xPixel = temp * temp * (0.1 + 0.9 * ratio);
                            this.setHeatPointColor(x, y - j, xPixel, yPixel);
                            this.setHeatPointColor(x, y + j, xPixel, yPixel);
                        }
                    }
                }
            }
        }
    },

    /// <summary>设置热力图的点颜色（内部方法）</summary>
    /// <param name="x" type="Int">x坐标</param>
    /// <param name="y" type="Int">y坐标</param>
    /// <param name="xPixel" type="double"></param>
    /// <param name="yPixel" type="double"></param>
    setHeatPointColor: function (x, y, xPixel, yPixel) {
        if (x >= 0 && x < this.maxWidth && y >= 0 && y < this.maxHeight) {
            var aVal = this.alphaValues[x][y];
            var cVal = this.colorValues[x][y];
            var loc = y * this.maxWidth * 4 + x * 4;
            var canData = this.canvasData;
            if (aVal) {
                aVal = aVal + xPixel - xPixel * aVal;
                cVal = cVal + yPixel - yPixel * cVal;
            } else {
                aVal = xPixel;
                cVal = yPixel;
            }
            this.alphaValues[x][y] = aVal;
            this.colorValues[x][y] = cVal;

            var weight = cVal * cVal * cVal;
            var red, green;
            if (weight < 0.65) {
                green = 240;
                red = 370 * weight;
            } else {
                red = 240;
                green = 50 + (636 - 636 * weight);
            }

            canData.data[loc] = red;
            canData.data[loc + 1] = green;
            canData.data[loc + 2] = 0;
            canData.data[loc + 3] = aVal * 255;
        }
    },

    /*重写openlayers方法*/
    refresh: function () {
        if (this.map) {
            var extent = this.map.getExtent();
            this.updateHeatFeatures(extent);
        }
    },
    destroy: function () {
        if (this.featureArr && this.featureArr.length > 0) {
            for (var i = 0; i < features.length; i++) {
                this.featureArr[i].destroy();
                this.featureArr[i] = null;
            }
        }

        this.radius = 20;
        this.featureArr = null;
        this.pixelHeatPoints = null;
        this.baseCanvas = null;
        this.canvasData = null;
        this.canvasContext = null;
        this.alphaValues = null;
        this.colorValues = null;
        this.maxWeight = 0;
        this.maxWidth = 0;
        this.maxHeight = 0;

        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },
    moveTo: function (extent, zoomChanged, sizeChanged) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        this.zoomChanged = zoomChanged;
        if (!sizeChanged) {
            this.div.style.visibility = "hidden";
            this.div.style.left = -parseInt(this.map.layerContainerDiv.style.left) + "px";
            this.div.style.top = -parseInt(this.map.layerContainerDiv.style.top) + "px";
            var size = this.map.getSize();
            this.baseCanvas.width = parseInt(size.w);
            this.baseCanvas.height = parseInt(size.h);
            this.maxWidth = size.w;
            this.maxHeight = size.h;
            this.div.style.visibility = "visible";
            if (!zoomChanged) {
                this.updateHeatFeatures(extent);
            }
        }
        if (zoomChanged) {
            this.updateHeatFeatures(extent);
        }
    },

    CLASS_NAME: "Zondy.Map.HeatMapLayer"
});


/*---------------------------------------------------------Zondy.Object.VectCls.js---------------------------------------------------------*/
/*Zondy.Object.VectCls-------------------------------------------------------------------------------------------------------
* 矢量类对象
*/

Zondy.Object.VectCls =OpenLayers.Class({
    /// <summary>图层类型 {Zondy.Enum.VectClsType}</summary>
    clsType: Zondy.Enum.VectClsType.SFCls,

    /// <summary>图层名称 {String}</summary>
    clsName:  null,

    /// <summary> 要素几何类型 Zondy.Enum.FeatureType类型，只对简单要素类有效</summary>
    geoType: 1,

    /// <summary>空间参照系名称 String</summary>
    srefName: "",

    /// <summary>要素数据集名称 String</summary>
    dsName:"",

    /// <summary>图层属性结构对象  Zondy.Object.CAttStruct</summary>
    attStruct: null,

    initialize: function (options) {
        /// <summary>构造函数</summary>
        /// <param name="options" type="Object">属性字段赋值对象/param>
        $.extend(this, options);
    }
});

/*-------------------------------------------------------------------------------------------------------------------------------------------*/
//========================================Zondy.ClientThemeLayer.js======================================================//
Zondy.ClientThemeLayer = OpenLayers.Class(OpenLayers.Layer.Vector, {
    initialize: function (name, options) {
        var newArguments = [name, options];
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
    },
    /**
    * Method: 根据视窗范围计算需优先请求的行列号
    * @param {OpenLayers.Bounds} extent:当前视窗范围
    * @return {Array.<OpenLayers.Feature.Vector>} OL2要素.
    */
    getFeaturesInExtent: function (extent) {
        var featureArr = new Array();
        for (var i = 0, len = this.features.length; i < len; ++i) {
            var feature = this.features[i];
            var bounds = feature.geometry.getBounds();
            if (extent.left <= bounds.right && extent.right >= bounds.left && extent.bottom <= bounds.top && extent.top >= bounds.bottom) {
                featureArr.push(feature);
            }
        }
        return featureArr;
    }
});

/*-------------------------------------------------------------------------------------------------------------------------------------------*/
//========================================Zondy.ClientTheme.js======================================================//
/**
* @classdesc
* 客户端专题图操作对象
* @constructor
* @param {ol.Map} map: 地图容器
* @param {string} layerURL: 图层URL（"gdbp://MapGisLocal/示例数据/ds/世界地图/sfcls/海洋陆地"）
* @param {string} ip: IGS服务器地址
* @param {string} port: IGS服务端口
* @param {Number} rows: 网格行数
* @param {Number} cols: 网格列数
* @param {string} layerFilter: 图层过滤条件
* @param {OpenLayers.Bounds} layerExtend: 图层范围（OpenLayers.Bounds(-180, -90, 180, 90)）
* @param {Zondy.ClientThemeInfos} ClientThemeInfos: 客户端专题图信息
* @param {ol.layer.Vector} vectLayer: 绘制的矢量图层
* @api
*/
Zondy.ClientTheme = OpenLayers.Class({
    map: null,
    layerURL: null,
    ip: "localhost",
    port: "6163",
    rows: 6,
    cols: 6,
    layerFilter: "1>0",
    layerExtend: null,
    ClientThemeInfos: null,
    vectLayer: null,

    initialize: function (map, layerURL, options) {
        /// <summary>构造函数</summary>
        /// <param name="map" type="OpenLayers.Map">对象类查询的参数类</param>
        /// <param name="layerURL" type="String">图层URL</param>
        /// <param name="options" type="Object">属性赋值对象</param>
        if (map != null) {
            this.map = map;
            if (this.vectLayer == null) {
                //this.vectLayer = new OpenLayers.Layer.Vector();
                this.vectLayer = new Zondy.ClientThemeLayer();
                this.map.addLayer(this.vectLayer);
            }

            if (this.layerExtend == null) {
                this.layerExtend = this.map.maxExtent;
            }
        }
        this.layerURL = layerURL;
        $.extend(this, options);
    },

    /**
    * Method: 根据视窗范围计算需优先请求的行列号
    * @param {OpenLayers.Bounds} viewExtent:当前视窗范围
    * @return {Array.<minRow,minCol,maxRow,maxCol>} 网格序列范围.
    */
    CalGridRange: function (viewExtent) {
        //修正网格范围到图层范围之内

        viewExtent.left = viewExtent.left < this.layerExtend.left ? this.layerExtend.left : viewExtent.left;
        viewExtent.bottom = viewExtent.bottom < this.layerExtend.bottom ? this.layerExtend.bottom : viewExtent.bottom;
        viewExtent.right = viewExtent.right > this.layerExtend.right ? this.layerExtend.right : viewExtent.right;
        viewExtent.top = viewExtent.top > this.layerExtend.top ? this.layerExtend.top : viewExtent.top;

        var minCol = Math.floor((viewExtent.left - this.layerExtend.left) / ((this.layerExtend.right - this.layerExtend.left) / this.cols));
        var maxCol = Math.ceil((viewExtent.right - this.layerExtend.left) / ((this.layerExtend.right - this.layerExtend.left) / this.cols)) - 1;
        var minRow = Math.floor((viewExtent.bottom - this.layerExtend.bottom) / ((this.layerExtend.top - this.layerExtend.bottom) / this.rows));
        var maxRow = Math.ceil((viewExtent.top - this.layerExtend.bottom) / ((this.layerExtend.top - this.layerExtend.bottom) / this.rows)) - 1;
        minCol = minCol < 0 ? 0 : minCol;
        minRow = minRow < 0 ? 0 : minRow;
        maxCol = maxCol >= this.cols - 1 ? this.cols - 1 : maxCol;
        maxRow = maxRow >= this.rows - 1 ? this.rows - 1 : maxRow;
        return [minRow, minCol, maxRow, maxCol];
    },
    /**
    * Method: 计算视窗范围外的网格（按照优先绘制顺序）
    * @param {Array.<minRow,minCol,maxRow,maxCol>} gridRange:当前视窗范围的网格数组
    * @param {Number} rows:网格的行数.
    * @param {Number} cols:网格的列数.
    * @return {Array.<Array<row,col>>} 网格序列数组.
    */
    CalOutsideGrid: function (gridRange, resultArr) {
        var minR = gridRange[0];
        var minC = gridRange[1];
        var maxR = gridRange[2];
        var maxC = gridRange[3];
        if (minR == 0 && minC == 0 && maxR == this.rows - 1 && maxC == this.cols - 1) {
            return;
        }
        if (resultArr == null) {
            resultArr = new Array();
        }

        var _minR = minR - 1 >= 0 ? minR - 1 : 0;
        var _minC = minC - 1 >= 0 ? minC - 1 : 0;
        var _maxR = maxR + 1 <= this.rows - 1 ? maxR + 1 : this.rows - 1;
        var _maxC = maxC + 1 <= this.cols - 1 ? maxC + 1 : this.cols - 1;
        for (var i = _minC; i <= _maxC; i++) {
            if (minR != _minR) {
                resultArr.push([_minR, i]);
            }
            if (maxR != _maxR) {
                resultArr.push([_maxR, i]);
            }

        }
        for (var j = maxR; j >= minR; j--) {
            if (minC != _minC) {
                resultArr.push([j, _minC]);
            }

            if (_maxC != maxC) {
                resultArr.push([j, _maxC]);
            }

        }
        this.CalOutsideGrid([_minR, _minC, _maxR, _maxC], resultArr);
    },
    /**
    * Method: 根据行列号数组计算请求范围数组
    * @param {Array.<Array<row,col>>} gridArr:行列号数组
    * @param {OpenLayers.Bounds} layerExtend:当前图层范围
    * @param {Number} rows:网格的行数.
    * @param {Number} cols:网格的列数.
    * @return {Array.<OpenLayers.Bounds>} 网格范围数组.
    */
    CalOutsideGridExtends: function (gridArr) {
        var rowHei = (this.layerExtend.top - this.layerExtend.bottom) / this.rows;
        var colWid = (this.layerExtend.right - this.layerExtend.left) / this.cols;
        var extendArr = new Array();
        for (var i = 0; i < gridArr.length; i++) {
            var colIndex = gridArr[i][1];
            var rowIndex = gridArr[i][0];

            var minX = this.layerExtend.left + colWid * colIndex;
            var minY = this.layerExtend.bottom + rowHei * rowIndex;
            var maxX = minX + colWid;
            var maxY = minY + rowHei;
            var extent = new OpenLayers.Bounds(minX, minY, maxX, maxY);
            extendArr.push(extent);
        }
        return extendArr;
    },
    /**
    * Method: 根据行列号范围计算请求范围数组
    * @param {Array.<Number>:[minRow, minCol, maxRow, maxCol]} gridArr:行列号范围
    * @param {OpenLayers.Bounds} layerExtend:当前图层范围
    * @return {Array.<OpenLayers.Bounds>} 网格范围数组.
    */
    CalGridExtends: function (gridArr) {
        var rowHei = (this.layerExtend.top - this.layerExtend.bottom) / this.rows;
        var colWid = (this.layerExtend.right - this.layerExtend.left) / this.cols;
        var extendArr = new Array();
        for (var i = gridArr[2]; i >= gridArr[0]; i--) {
            for (var j = gridArr[1]; j <= gridArr[3]; j++) {
                var minX = this.layerExtend.left + colWid * j;
                var minY = this.layerExtend.bottom + rowHei * i;
                var maxX = minX + colWid;
                var maxY = minY + rowHei;
                var extent = new OpenLayers.Bounds(minX, minY, maxX, maxY);
                extendArr.push(extent);
            }
        }
        return extendArr;
    },
    /**
    * Method: 根据视窗范围计算网格范围数组
    * @param {OpenLayers.Bounds} viewExtent:当前视窗范围
    * @return {Array.<ol.Extent>} 网格范围数组.
    */
    GetGridExtendArr: function (viewExtent) {
        var gridIndexArr = this.CalGridRange(viewExtent);
        var extendArr = this.CalGridExtends(gridIndexArr);
        var gridIndexOutsideArr = new Array();
        this.CalOutsideGrid(gridIndexArr, gridIndexOutsideArr);

        var outsideExtendArr = this.CalOutsideGridExtends(gridIndexOutsideArr);
        var gridExtentArr = [extendArr, outsideExtendArr];

        return gridExtentArr;
    },
    /**
    * Method: 根据范围调用要素服务获取图元，保存图元的FID及范围到RBush中（需考虑要素不重复的因素）
    * @param {OpenLayers.Bounds} extent:网格范围
    * @param {boolen} isInView:网格是否在当前视窗内
    * @param {ol.Map} map:地图容器
    * @return 
    */
    GetFeatureByExtent: function (extent, isInView, map) {
        var rect = new Zondy.Object.Rectangle();
        rect.xmin = extent.left;
        rect.xmax = extent.right;
        rect.ymin = extent.bottom;
        rect.ymax = extent.top;

        var queryService = this.InitQueryService();
        queryService.queryParam.geometry = rect;
        queryService.queryTotalCnt = this.rows * this.cols;
        queryService.map = this.map;
        queryService.query(function (data) {
            if (data != null) {
                var sfArr = data.SFEleArray;
                var attStruct = data.AttStruct;
                if (this.themeInfos != null && this.themeInfos instanceof Zondy.ClientFourClrInfos) {
                    this.themeInfos.queryCnt++;
                }
                if (sfArr != null && sfArr.length != 0) {
                    var featureArr = new Array();
                    for (var i = 0; i < sfArr.length; i++) {
                        var fid = sfArr[i].FID;
                        var rect = sfArr[i].bound;
                        var isExist = false;
                        var features = this.vectLayer.getFeaturesByAttribute("fId", sfArr[i].FID);
                        if (features.length != 0) {
                            isExist = true;
                        }
                        if (isExist === false) {
                            var feature;
                            if (this.themeInfos instanceof Zondy.ClientGradeInfos) {
                                feature = Zondy.ClientTheme.prototype.GetOLFeature(sfArr[i], attStruct, "grade", this.map);
                            }
                            else if (this.themeInfos instanceof Zondy.ClientDensityInfos) {
                                feature = Zondy.ClientTheme.prototype.GetOLFeature(sfArr[i], attStruct, "density", this.map);
                            }
                            else {
                                feature = Zondy.ClientTheme.prototype.GetOLFeature(sfArr[i], attStruct, "other", this.map);
                            }
                            featureArr.push(feature);
                        }
                    }

                    if (this.themeInfos != null) {
                        if (this.themeInfos instanceof Zondy.ClientStatisticInfos) {
                            if (isInView) {
                                this.themeInfos.AddChartInView(featureArr, map);
                            }
                        }
                        else if (this.themeInfos instanceof Zondy.ClientDensityInfos) {
                            for (var i = 0; i < featureArr.length; i++) {
                                var dotFeature = this.themeInfos.SetThemeInfo(featureArr[i]);
                                if (dotFeature != null) {
                                    this.vectLayer.addFeatures([dotFeature]);
                                }
                            }
                        }
                        else if (this.themeInfos instanceof Zondy.ClientFourClrInfos) {
                        }
                        else {
                            for (var i = 0; i < featureArr.length; i++) {
                                this.themeInfos.SetThemeInfo(featureArr[i]);
                            }
                        }

                        this.vectLayer.addFeatures(featureArr);

                    } /*end of  if (this.themeInfos!=null)*/
                } /*end of if (sfArr!=null &&sfArr.length!=0)*/
                if (this.themeInfos != null && this.themeInfos instanceof Zondy.ClientFourClrInfos) {
                    if (this.themeInfos.queryCnt == this.queryTotalCnt) {
                        this.themeInfos.SetFourClrInfos(this.vectLayer);
                    }
                }
            } /*end of if (data != null)*/
        });
    },
    /**
    * Method: 初始化图层要素服务
    * @param {string} ip:查询图层要素服务的服务器地址
    * @param {string} port:查询图层要素服务的服务器端口
    * @param {string} layerfilter:查询图层要素服务的图层过滤条件（符合MapGIS属性查询规范）
    * @return 
    */
    InitQueryService: function () {
        var queryStruct = new Zondy.Service.QueryFeatureStruct();
        queryStruct.IncludeGeometry = true;
        queryStruct.IncludeAttribute = true;
        var queryParam = new Zondy.Service.QueryByLayerParameter(this.layerURL);
        queryParam.struct = queryStruct;
        queryParam.resultFormat = "json";
        queryParam.page = 0;
        queryParam.recordNumber = 500000; //设置查询要素数目
        queryParam.where = this.layerFilter;

        var queryService = new Zondy.Service.QueryLayerFeature(queryParam);
        queryService.ip = this.ip;
        queryService.port = this.port;
        queryService.requestType = "GET";

        $.extend(queryService, { vectLayer: this.vectLayer });
        $.extend(queryService, { themeInfos: this.ClientThemeInfos });
        //$.extend(queryService, { rbush: this.rbush });

        return queryService;
    },
    /**
    * Method: 转换MapGIS的要素到OL2要素，同时赋值相应的属性
    * @param {Zondy.Object.Feature} mapFeature 要素
    * @param {Zondy.Object.CAttStruct} AttStruct 属性结构
    * @param {string} themeType 专题图类型
    * @return {ol.Feature}
    */
    GetOLFeature: function (mapFeature, AttStruct, themeType, map) {
        var geometry = null;
        if (themeType == "grade") {
            var x = (mapFeature.bound.xmax + mapFeature.bound.xmin) / 2;
            var y = (mapFeature.bound.ymax + mapFeature.bound.ymin) / 2;
            var resolution = map.getResolution();
            geometry = new OpenLayers.Geometry.Polygon.createRegularPolygon(new OpenLayers.Geometry.Point(x, y), 14 * resolution, 40);
        }
        else {
            switch (mapFeature.ftype) {
                case 1:
                    var geom = mapFeature.fGeom.PntGeom;
                    var resolution = map.getResolution();
                    geometry = new OpenLayers.Geometry.Polygon.createRegularPolygon(new OpenLayers.Geometry.Point(geom[0].Dot.x, geom[0].Dot.y), 10 * resolution, 40);
                    break;
                case 2:
                    var geom = mapFeature.fGeom.LinGeom;
                    var linCoords = new Array();
                    var arcs = geom[0].Line.Arcs;
                    for (var i = 0; i < arcs.length; i++) {
                        var dots = arcs[i].Dots;
                        for (var j = 0; j < dots.length; j++) {
                            linCoords.push(new OpenLayers.Geometry.Point(dots[j].x, dots[j].y));
                        }
                    }
                    geometry = new OpenLayers.Geometry.LineString(linCoords);
                    break;
                case 3:
                    var geom = mapFeature.fGeom.RegGeom;
                    var results = new Array();
                    var rings = geom[0].Rings;
                    for (var i = 0; i < rings.length; i++) {
                        var points = new Array();
                        var arcs = rings[i].Arcs;
                        for (var j = 0; j < arcs.length; j++) {
                            var dots = arcs[j].Dots;
                            for (var k = 0; k < dots.length; k++) {
                                points.push(new OpenLayers.Geometry.Point(dots[k].x, dots[k].y));
                            }
                        }
                        results[i] = new OpenLayers.Geometry.LinearRing(points);
                    }
                    geometry = new OpenLayers.Geometry.Polygon(results);
                    break;
            }
        }

        var feature = new OpenLayers.Feature.Vector(geometry);

        var attValue = mapFeature.AttValue;
        var fldNames = AttStruct.FldName;

        var attObj = new Object();
        attObj["fId"] = mapFeature.FID;
        if (attValue != null) {
            for (var i = 0; i < fldNames.length; i++) {
                attObj[fldNames[i]] = attValue[i];
            }
        }
        else {
            for (var i = 0; i < fldNames.length; i++) {
                attObj[fldNames[i]] = 0;
            }
        }
        feature.attributes = attObj;

        if (themeType == "density") {
            var style = {
                fillOpacity: 0,
                fillColor: 'rgba(0,0,0,0)',
                strokeColor: 'rgba(0,0,0,0)'
            };
            feature.style = style;
        }

        return feature;
    },
    /**
    * Method: 获取所有图元
    * @param {OpenLayers.Bounds} extent:图层范围
    * @param {OpenLayers.Bounds in an Arry} gridExtentArr:网格范围数组
    * @return 
    */
    GetBaseValue: function (extent, gridExtentArr) {
        var queryService = this.InitQueryService();
        queryService.queryParam.struct.IncludeGeometry = false;
        queryService.ClientTheme = this;

        queryService.query(function (data) {
            if (data != null) {
                if (this.themeInfos.baseValue == 0) {
                    var sfArr = data.SFEleArray;
                    var attStruct = data.AttStruct;
                    var fldIndex = 0;
                    for (var i = 0; i < attStruct.FldName.length; i++) {
                        if (attStruct.FldName[i] == this.themeInfos.fldName) {
                            if (attStruct.FldType[i] == "string") {
                                return;
                            }
                            fldIndex = i;
                        }
                    }

                    if (sfArr != null) {
                        var sumVal = 0;
                        for (var i = 0; i < sfArr.length; i++) {
                            var val = parseFloat(sfArr[i].AttValue[fldIndex]);
                            if (val > 0) {
                                sumVal += val;
                            }
                        }

                        var wid = extent.right - extent.left;
                        var hei = extent.top - extent.bottom;
                        this.themeInfos.baseValue = sumVal / Math.max(wid, hei);

                    } /*end of if (goog.isDefAndNotNull(sfArr))*/
                } /*end of if (this.themeInfos.baseValue == 0)*/
            } /*end of if (goog.isDefAndNotNull(data))*/

            this.queryParam.struct.IncludeGeometry = true;
            for (var i = 0; i < gridExtentArr[0].length; i++) {
                this.ClientTheme.GetFeatureByExtent(gridExtentArr[0][i], true, this.map);
            }
            for (var i = 0; i < gridExtentArr[1].length; i++) {
                this.ClientTheme.GetFeatureByExtent(gridExtentArr[1][i], false, this.map);
            }
        });
    },
    /**
    * Method: 客户端专题图绘制入口函数：实现根据图层范围及视图范围分块请求
    * @param {}
    * @return
    */
    LayerRender: function () {
        if (this.map != null && this.ClientThemeInfos != null) {
            var viewExtent = this.map.getExtent();
            if (this.ClientThemeInfos instanceof Zondy.ClientGradeInfos || this.ClientThemeInfos instanceof Zondy.ClientDensityInfos) {
                var gridExtentArr = this.GetGridExtendArr(viewExtent);
                this.GetBaseValue(this.layerExtend, gridExtentArr);
            }
            else {
                if (this.ClientThemeInfos instanceof Zondy.ClientStatisticInfos) {
                    var layerNames = this.layerURL.split('/');
                    var chartThemeDiv = layerNames[layerNames.length - 1] + "-popUp";
                    this.ClientThemeInfos.chartThemeDiv = chartThemeDiv;
                    if (document.getElementById(chartThemeDiv) != null) {
                        $("#" + chartThemeDiv).empty();
                    }
                    else {
                        $("#map").append('<div id="' + chartThemeDiv + '"></div>');
                    }
                    this.vectLayer.setVisibility(false);
                    var boxes = new OpenLayers.Layer.Boxes();
                    this.map.addLayer(boxes);
                    this.map.setLayerIndex(boxes, 0)
                    this.map.boxes = boxes;
                    this.map.ClientThemeInfos = this.ClientThemeInfos;
                    this.map.vectLayer = this.vectLayer;
                    //this.map.on('moveend', this.UpdateRangeRender);
                    this.map.events.register("moveend", this.map, this.UpdateRangeRender)
                }

                var gridExtentArr = this.GetGridExtendArr(viewExtent);
                for (var i = 0; i < gridExtentArr[0].length; i++) {
                    this.GetFeatureByExtent(gridExtentArr[0][i], true, this.map);
                }
                for (var i = 0; i < gridExtentArr[1].length; i++) {
                    this.GetFeatureByExtent(gridExtentArr[1][i], false, this.map);
                }
            }
        }
    },
    /**
    * Method: 客户端专题图更新（只有在绘制专题图：LayerRender完成后才能调用）
    * @param {}
    * @return
    */
    UpdateLayerRender: function () {
        if (this.map != null && this.vectLayer != null && this.ClientThemeInfos != null) {
            //var vectSource = this.vectLayer.getSource();

            var viewExtent = this.map.getExtent();
            var gridExtentArr = this.GetGridExtendArr(viewExtent);
            if (this.ClientThemeInfos instanceof Zondy.ClientStatisticInfos) {
                this.map.boxes.clearMarkers();
                $("#" + this.ClientThemeInfos.chartThemeDiv).empty();

                var featureArr = this.vectLayer.getFeaturesInExtent(viewExtent);
                this.ClientThemeInfos.AddChartInView(featureArr, this.map);
            } /*end of if (this.ClientThemeInfos instanceof Zondy.ClientStatisticInfos)*/
            else {
                var gridExtents = gridExtentArr[0].concat(gridExtentArr[1]);
                for (var i = 0; i < gridExtents.length; i++) {
                    var featureArr = this.vectLayer.getFeaturesInExtent(gridExtents[i]);
                    for (var j = 0; j < featureArr.length; j++) {
                        if (this.ClientThemeInfos instanceof Zondy.ClientDensityInfos) {
                            if (featureArr[j].geometry instanceof OpenLayers.Geometry.Polygon) {
                                var dotFeature = this.ClientThemeInfos.SetThemeInfo(featureArr[j]);
                                if (dotFeature != null) {
                                    this.vectLayer.addFeatures([dotFeature]);
                                }
                            }
                            else {
                                this.vectLayer.removeFeatures([featureArr[j]]);
                            }
                        }
                        else {
                            this.ClientThemeInfos.SetThemeInfo(featureArr[j]);
                        }
                    }
                }
            }
            //}
        } /*end of if (this.map != null && this.vectLayer != null && goog.isDefAndNotNull(this.ClientThemeInfos))*/
        this.vectLayer.redraw(true);
    },
    /**
    * Method: 移除专题图
    * @param {}
    * @return
    */
    RemoveThemeLayer: function () {
        if (this.map != null) {
            if (this.vectLayer != null) {
                this.vectLayer.removeAllFeatures();
                this.map.removeLayer(this.vectLayer);
            }
            if (this.ClientThemeInfos instanceof Zondy.ClientStatisticInfos) {
                this.map.boxes.clearMarkers();
                this.map.removeLayer(this.map.boxes);
                $("#" + this.ClientThemeInfos.chartThemeDiv).remove();
                //this.map.un('moveend', this.UpdateRangeRender);
                this.map.events.unregister("moveend", this.map, this.UpdateRangeRender);
            }
        }
    },
    //地图移动事件的回调
    UpdateRangeRender: function (evt) {
        if (this.vectLayer != null && this.ClientThemeInfos != null) {
            if (this.ClientThemeInfos instanceof Zondy.ClientStatisticInfos) {
                var viewExtent = this.getExtent();
                var resolution = this.getResolution();
                var size = Math.max((this.ClientThemeInfos.height, this.ClientThemeInfos.width));
                var markers = this.boxes.markers;
                for (var k = markers.length; k > 0; k--) {
                    var position = markers[k - 1].bounds.getCenterLonLat();
                    if (position.lon > viewExtent.left && position.lon < viewExtent.right &&
                                                    position.lat > viewExtent.bottom && position.lat < viewExtent.top) {
                        var id = parseInt(markers[k - 1].div.id);
                        //var feature = this.vectLayer.getFeatureById(id);
                        var feature = this.vectLayer.getFeaturesByAttribute("fId", id)[0];
                        var extend = feature.geometry.getBounds();
                        var length = Math.max((extend.right - extend.left), extend.top - extend.bottom) / resolution;
                        if (length < size) {
                            this.boxes.removeMarker(markers[k - 1]);
                        }
                    }
                    else {
                        this.boxes.removeMarker(markers[k - 1]);
                    }
                }

                var featureArr = this.vectLayer.getFeaturesInExtent(viewExtent);
                this.ClientThemeInfos.AddChartInView(featureArr, this);
            } /*end of if (this.ClientThemeInfos instanceof Zondy.ClientStatisticInfos)*/
        } /*end of if (this.vectLayer != null && goog.isDefAndNotNull(this.ClientThemeInfos))*/
    },
    /**
    * Method: 动态生成笛卡尔积(分段专题图计算分段时使用)
    * @param {Array<Array<object>>}list
    * @return {Array<object>}
    */
    DynamicCreateDescartes: function (list) {
        //parent上一级索引;count指针计数
        var point = {};
        var result = [];
        var pIndex = null;
        var tempCount = 0;
        var temp = [];

        //根据参数列生成指针对象
        for (var index in list) {
            if (typeof list[index] == 'object') {
                point[index] = { 'parent': pIndex, 'count': 0 }
                pIndex = index;
            }
        }

        //单维度数据结构直接返回
        if (pIndex == null) {
            return list;
        }

        //动态生成笛卡尔积
        while (true) {
            for (var index in list) {
                tempCount = point[index]['count'];
                temp.push(list[index][tempCount]);
            }
            //压入结果数组
            result.push(temp);
            temp = [];
            //检查指针最大值问题
            while (true) {
                if (point[index]['count'] + 1 >= list[index].length) {
                    point[index]['count'] = 0;
                    pIndex = point[index]['parent'];
                    if (pIndex == null) {
                        return result;
                    }
                    //赋值parent进行再次检查
                    index = pIndex;
                }
                else {
                    point[index]['count']++;
                    break;
                }
            }
        }
        return result;
    }
});

//========================================Zondy.ClientThemeInfos.js======================================================//
/**
* @classdesc
* 专题图信息
* @constructor
* @param {Array} themeInfoArr: 专题图信息数组
* @api
*/
Zondy.ClientThemeInfos = OpenLayers.Class({
    themeInfoArr: [],
    initialize: function () {
        this.themeInfoArr = new Array();
    }
});
//========================================Zondy.ClientRandomInfos.js======================================================//
/**
* @classdesc
* 随机专题图信息
* @constructor
* @api
*/
Zondy.ClientRandomInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    initialize: function () {
    },
    SetThemeInfo: function (feature) {
        if (feature != null) {
            var color = '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6);
            var style = {
                strokeWidth: 1.25,
                fillColor: color,
                strokeColor: color,
                pointRadius: 7
            };
            feature.style = style;
        }
    }
});
//========================================Zondy.ClientUnifiedInfos.js======================================================//
/**
* @classdesc
* 统一专题图信息
* @constructor
* @param {OpenLayers.Feature.Vector.style} style:默认样式
* @api
*/
Zondy.ClientUnifiedInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    defaultStyle: {
        strokeWidth: 1.25,
        fillColor: 'rgba(255,255,255,0.4)',
        strokeColor: '#3399CC',
        pointRadius: 7
    },
    initialize: function (style) {
        this.defaultStyle = style;
    },
    SetThemeInfo: function (feature) {
        if (feature != null) {
            feature.style = this.defaultStyle;
        }
    }
});
//========================================Zondy.ClientUnifiedInfos.js======================================================//
/**
* @classdesc
* 单值专题图信息
* @constructor
* @param {OpenLayers.Feature.Vector.style} style:单值样式
* @param {string} fldValue: 单值
* @api
*/
Zondy.ClientUniqueInfo = OpenLayers.Class({
    style: {
        strokeWidth: 1.25,
        fillColor: 'rgba(255,255,255,0.4)',
        strokeColor: '#3399CC',
        pointRadius: 7
    },
    fldValue: "",
    initialize: function (style, fldValue) {
        if (style != null) {
            this.style = style;
        }
        if (fldValue != null) {
            this.fldValue = fldValue;
        }
    }
});
/**
* @classdesc
* 单值专题图信息
* @constructor
* @param {string} fldName: 单值字段
* @param {OpenLayers.Feature.Vector.style} style:默认样式
* @param {boolean} isGradualColor:默认样式是否渐进色显示
* @api
*/
Zondy.ClientUniqueInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    fldName: null,
    defaultStyle: {
        strokeWidth: 1.25,
        fillColor: 'rgba(255,255,255,0.4)',
        strokeColor: '#3399CC',
        pointRadius: 7
    },
    isGradualColor: false,
    initialize: function (fldName, opt_options) {
        this.fldName = fldName;
        $.extend(this, opt_options);
    },
    /**
    * 添加单值信息
    * @param {string} fldValue:单值
    * @param {OpenLayers.Feature.Vector.style} style:单值样式
    */
    AppendUniqueInfo: function (fldValue, style) {
        var uniqueInfo = new Zondy.ClientUniqueInfo();
        uniqueInfo.fldValue = fldValue;
        uniqueInfo.style = style;
        this.themeInfoArr.push(uniqueInfo);
    },
    /**
    * 设置要素的样式
    * @param {OpenLayers.Feature.Vector} feature:OL2要素
    */
    SetThemeInfo: function (feature) {
        if (feature != null) {
            if (this.themeInfoArr.length > 0) {
                for (var i = 0; i < this.themeInfoArr.length; i++) {
                    if (feature.attributes[this.fldName] == this.themeInfoArr[i].fldValue) {
                        feature.style = this.themeInfoArr[i].style;
                        break;
                    }
                    else {
                        var style = this.getDefaultStyle();
                        feature.style = style;
                    }
                }
            }
            else {
                var style = this.getDefaultStyle();
                feature.style = style;
            }
        }
    },
    /**
    * 获取要素的默认样式
    */
    getDefaultStyle: function () {
        var fillColor = "";
        if (this.defaultStyle == null) {
            fillColor = '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6);
        }
        else {
            if (this.isGradualColor) {//仅支持用RGB表示的颜色
                var defaultFillClr = this.defaultStyle.fillColor.split(',');
                var r = Math.round(Math.random() * 255);
                var g = defaultFillClr[1];
                var b = defaultFillClr[2];
                fillColor = "rgba(" + r + "," + g + "," + b + ", 0.4)";
            }
            else {
                return this.defaultStyle;
            }
        }
        var style = {
            strokeWidth: 1.25,
            fillColor: fillColor,
            strokeColor: fillColor,
            pointRadius: 7
        };
        return style;
    }
});
//========================================Zondy.ClientClassInfos.js======================================================//
/**
* @classdesc
* 专题图分段信息
* @constructor
* @param {OpenLayers.Feature.Vector.style} style: 分段样式
* @param {json} condition: 分段条件（json格式）<{fldName1:minValue/maxValue,fldName2:minValue/maxValue;}>
* @api
*/
Zondy.ClientClassInfo = OpenLayers.Class({
    style: {
        strokeWidth: 1.25,
        fillColor: 'rgba(255,255,255,0.4)',
        strokeColor: '#3399CC',
        pointRadius: 7
    },
    classFldCondition: null,
    initialize: function (style, condition) {
        if (style != null) {
            this.style = style;
        }
        if (condition != null) {
            this.classFldCondition = condition;
        }
    }
});
/**
* @classdesc
* 分段专题图信息
* @constructor
* @param {Array<string>} classFldNames: 分段字段
* @param {Array<int>} classRangeNum: 分段数数组
* @api
*/
Zondy.ClientClassInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    classFldNames: null,
    classRangeNum: null,
    initialize: function (fldNames, classRangeNum) {
        if (fldNames != null) {
            this.classFldNames = fldNames;
        }
        if (classRangeNum != null) {
            this.classRangeNum = classRangeNum;
        }
    },
    /**
    * 添加分段信息
    * @param {json} conditionJson:分段条件（json格式）<{fldName1:minValue/maxValue,fldName2:minValue/maxValue;}>
    * @param {OpenLayers.Feature.Vector.style} style:分段样式
    */
    AppendClassInfo: function (conditionJson, style) {
        var classInfo = new Zondy.ClientClassInfo();
        if (conditionJson != null) {
            classInfo.classFldCondition = conditionJson;
        }
        else {
            classInfo.classFldCondition = "";
        }
        if (style != null) {
            classInfo.style = style;
        }
        this.themeInfoArr.push(classInfo);
    },
    /**
    * 根据分段信息设置要素的样式
    * @param {OpenLayers.Feature.Vector} feature:OL2要素
    */
    SetThemeInfo: function (feature) {
        if (feature != null) {
            for (var j = 0; j < this.themeInfoArr.length; j++) {
                var classInfoCondition = this.themeInfoArr[j].classFldCondition;
                if (this.matchClassCondition(feature, classInfoCondition)) {
                    feature.style = this.themeInfoArr[j].style;
                }
            }
        }
    },
    /**
    * 根据要素属性值匹配分段信息
    * @param {OpenLayers.Feature.Vector} feature:OL2要素
    * @param {json} classFldCondition: 分段条件（json格式）<{fldName1:minValue/maxValue,fldName2:minValue/maxValue;}>
    * @return :true/false(是否匹配某一分段)
    */
    matchClassCondition: function (feature, classFldCondition) {
        var isMatch = true;
        for (var i = 0; i < this.classFldNames.length; i++) {
            var fldvalueRange = classFldCondition[this.classFldNames[i]];
            var minValue = Number(fldvalueRange.split('/')[0]);
            var maxValue = Number(fldvalueRange.split('/')[1]);
            var fldValue = Number(feature.attributes[this.classFldNames[i]]);
            if (fldValue < minValue || fldValue >= maxValue) {
                isMatch = false;
                break;
            }
        }
        return isMatch;
    }
});

//========================================Zondy.ClientFourClrInfos.js======================================================//
/**
* @classdesc
* 四色专题图信息
* @constructor
* @param {Array} fourClrInfoArry:四色信息数组
* @api
*/
Zondy.ClientFourClrInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    fourClrInfoArry: null,
    queryCnt: 0,
    initialize: function (fourClrInfoArry) {
        if (fourClrInfoArry != null) {
            this.fourClrInfoArry = fourClrInfoArry;
        }
    },
    /**
    * @classdesc
    * 设置四色专题图配色信息
    * @constructor
    * @param {ol.source.Vector} vectSource 矢量资源
    */
    SetFourClrInfos: function (vectLayer) {
        console.time('ClientFourClrInfos');

        var featureArr = vectLayer.features;
        var relationList = this.getRelateFeatures(vectLayer);
        var jsonText = JSON.stringify(relationList);
        var s = featureArr.length;
        var i = 1;       //i表示区域序号，i=2即第二个区域
        var k = 0;       //k表示颜色序号
        var j = 0;
        var iMax = 0;
        var bFlag = false;
        var clrNum = 4;
        var Color = new Array(clrNum);     //用于判断第1，2，3，4种颜色是否用过
        var multi = new Array(s);
        multi[0] = 1;    //第一个区域即featureArr[0]填上1号颜色

        while (i < s) {
            loop:
            {
                k = 1;
                while (1) {
                    for (j = 1; j <= clrNum; j++)
                        Color[j - 1] = 0;    //储存颜色的数组Color清0

                    iMax = iMax > i ? iMax : i;

                    j = 0;
                    while (j < relationList[i].length) {
                        var nID = relationList[i][j];       //指相邻的区域的索引号
                        if (multi[nID] > 0)		            //已经赋过颜色  判断Matrix[i][j]是否关联
                            Color[multi[nID] - 1] = -1;     //关联则登记这号颜色用过==-1

                        j++;
                    }

                    while (k <= clrNum) {
                        if (Color[k - 1] == 0)       //判断k号颜色是否用过  == 0没有用过，可以赋色
                        {
                            bFlag = true;
                            multi[i] = k;   //把第k种颜色给第i个区域
                            i++;
                            break loop;

                        }
                        bFlag = false;
                        k++;
                    }

                    if (bFlag == false && multi[i] != 0) {
                        while (k > clrNum) {
                            multi[i] = 0;
                            i--;
                            if (i <= 0)
                                break;
                            k = multi[i] + 1;
                            if (k <= clrNum)
                                break;
                        }
                    }

                    if (multi[i] == 0)     //没有赋过色。若颜色已用尽，则退回到前一个区域改变颜色
                    {
                        while (k > clrNum) {
                            multi[i] = 0;
                            i--;
                            if (i <= 0)
                                break;
                            k = multi[i] + 1;
                            if (k <= clrNum)
                                break;
                        }
                    }

                    if (iMax - i > 20 || i <= 0) {
                        clrNum++;
                        i++;
                        if (clrNum < 16)
                            break;
                        else {
                            return;
                        }
                    }
                    if (i < 1)
                        break;
                }
            }

        }

        for (var i = 0; i < featureArr.length; i++) {
            featureArr[i].attributes.fiilColor = multi[i];
            this.SetThemeInfo(featureArr[i]);
        }

        console.timeEnd('ClientFourClrInfos');
        vectLayer.redraw(true);
    },
    /**
    * @classdesc
    * 获取邻接要素
    * @constructor
    * @param {Zondy.ClientThemeLayer} vectLayer 矢量资源
    * @return {Array <ol.Feature>} 矢量要素数组
    */
    getRelateFeatures: function (vectLayer) {

        var totalFeatures = vectLayer.features;
        var relationList = new Array(totalFeatures.length);
        for (var i = 0; i < totalFeatures.length; i++) {
            totalFeatures[i].attributes.index = i;
        }
        for (var i = 0; i < totalFeatures.length; i++) {
            relationList[i] = new Array();
        }
        for (var i = 0; i < totalFeatures.length; i++) {
            var geom = totalFeatures[i].geometry;
            for (var j = i + 1; j < totalFeatures.length; j++) {
                if (this.getMainExtent(geom).getBounds().toGeometry().intersects(this.getMainExtent(totalFeatures[j].geometry).getBounds().toGeometry())) {
                    relationList[i].push(j);
                    relationList[j].push(i);
                }
            }
        }
        return relationList;
    },
    getRalateMatrix: function (vectLayer, featureArr) {
        var relationList = new Array(featureArr.length);
        for (var i = 0; i < featureArr.length; i++) {
            relationList[i] = new Array();
            featureArr[i].id = i;
        }

        for (var i = 0; i < featureArr.length; i++) {
            var geom = featureArr[i].geometry;
            var mainExtent = this.getMainExtent(geom);
            var featuresInExtent = vectLayer.getFeaturesInExtent(mainExtent.getBounds());

            if (featuresInExtent != null) {
                for (var j = 0; j < featuresInExtent.length; j++) {
                    var fId = featuresInExtent[j].id;
                    var extent = this.getMainExtent(featuresInExtent[j].geometry).getBounds();
                    if (fId && i != fId && mainExtent.intersects(extent.toGeometry())) {
                        var isExit = false;
                        for (var k = 0; k < relationList[i].length; k++) {
                            if (relationList[i][k] == fId) {
                                isExit = true;
                                break;
                            }
                        }
                        if (!isExit) {
                            relationList[i].push(fId);
                        }
                        isExit = false;
                        for (var k = 0; k < relationList[fId].length; k++) {
                            if (relationList[fId][k] == i) {
                                isExit = true;
                                break;
                            }
                        }
                        if (!isExit) {
                            relationList[fId].push(i);
                        }
                    } /*end of if (fId && i != fId)*/
                }
            } /*end of if (featuresInExtent != null) {*/
        }

        return relationList;
    },
    SetThemeInfo: function (feature) {
        if (feature != null) {
            var fillColor;
            var color = feature.attributes["fiilColor"] - 1;
            if (color < 0) {
                fillColor = this.fourClrInfoArry[Math.floor(Math.random() * this.fourClrInfoArry.length)];
            }
            else if (color > 3) {
                fillColor = this.fourClrInfoArry[color - 4];
            }
            else {
                fillColor = this.fourClrInfoArry[color];
            }
            var style = {
                strokeWidth: 1.25,
                fillColor: fillColor,
                strokeColor: fillColor,
                pointRadius: 7
            };
            feature.style = style;
        }
    },
    getMainExtent: function (geom) {
        var mainArea = 0;
        var mainIndex = 0;

        var coords = geom.components;
        for (var i = 0; i < coords.length; i++) {
            //if (coords[i].length > 2) {
            var nextArea = new OpenLayers.Geometry.Polygon([coords[i]]).getArea();
            if (mainArea < nextArea) {
                mainArea = nextArea;
                mainIndex = i;
            }
        }


        var mainPoly = new OpenLayers.Geometry.Polygon([geom.components[mainIndex]]);
        return mainPoly;
    }
});

//========================================Zondy.ClientGradeInfos.js======================================================//
/**
* @classdesc
* 等级专题图信息
* @constructor
* @param {string} fldName: 属性字段
* @param {double} baseValue:一像素代表的属性值
* @param {boolean} dispMinus: 是否显示负值
* @param {boolean} dispZero: 是否显示零值
* @param {OpenLayers.Feature.Vector.style} plusStyle: 正值样式
* @param {OpenLayers.Feature.Vector.style} minusStyle: 负值样式
* @param {OpenLayers.Feature.Vector.style} zeroStyle: 零值样式
* @api
*/
Zondy.ClientGradeInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    fldName: null,
    baseValue: 0,
    dispMinus: false,
    dispZero: false,
    plusStyle: {
        strokeWidth: 1,
        fillColor: 'rgba(255,0,0,0.4)',
        strokeColor: 'rgba(255,0,0,0.4)',
        pointRadius: 7
    },
    minusStyle: {
        strokeWidth: 1,
        fillColor: 'rgba(0,255,0,0.4)',
        strokeColor: 'rgba(0,255,0,0.4)',
        pointRadius: 7
    },
    zeroStyle: {
        strokeWidth: 1,
        fillColor: 'rgba(0,0,255,0.4)',
        strokeColor: 'rgba(0,0,255,0.4)',
        pointRadius: 7
    },
    initialize: function (fldName, opt_options) {
        if (fldName != null) {
            this.fldName = fldName;
        }
        $.extend(this, opt_options);
    },
    SetThemeInfo: function (feature) {
        var style, symbolSize;
        if (feature != null && this.baseValue != 0) {
            var val = parseFloat(feature.attributes[this.fldName]);
            var bounds = feature.geometry.getBounds();
            var origin = new OpenLayers.Geometry.Point((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
            var radius = (bounds.top - bounds.bottom) / 2;
            if (val > 0) {
                symbolSize = val / this.baseValue;
                style = this.plusStyle;
                feature.style = style;
            }
            else if (val < 0 && this.dispMinus) {
                symbolSize = Math.abs(val) / this.baseValue;
                style = this.minusStyle;
            }
            else if (val == 0 && this.dispZero) {
                symbolSize = this.zeroStyle.pointRadius;
                style = this.zeroStyle;
            }
            else {
                symbolSize = radius;
                style = {
                    fillColor: 'rgba(0,0,0,0)',
                    strokeColor: 'rgba(0,0,0,0)'
                };
            }
            if (symbolSize > 400) {
                symbolSize = 400;
            }
            feature.geometry.resize(symbolSize / radius, origin);
            feature.style = style;
        }
    }
});
//========================================Zondy.ClientDensityInfos.js======================================================//
/**
* @classdesc
* 点密度专题图信息
* @constructor
* @param {string} fldName: 属性字段
* @param {double} baseValue:点代表的属性值
* @param {double} rad:点半径
* @param {ol.style.Style} defaultStyle: 默认样式
* @api
*/
Zondy.ClientDensityInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    fldName: null,
    baseValue: 0,
    rad: 5,
    defaultStyle: {
        strokeWidth: 1,
        fillColor: 'rgba(255,0,0,0.4)',
        strokeColor: 'rgba(255,0,0,0.4)',
        pointRadius: 7
    },
    initialize: function (fldName, opt_options) {
        if (fldName != null) {
            this.fldName = fldName;
        }
        $.extend(this, opt_options);
    },
    SetThemeInfo: function (feature) {
        var dotFeature;
        if (feature != null && this.baseValue != 0) {
            var val = parseFloat(feature.attributes[this.fldName]);
            if (val > 0) {
                var dotArr = new Array();
                var num = parseInt(val / this.baseValue);
                var poly = feature.geometry;
                var extent = poly.getBounds();
                var wid = extent.right - extent.left;
                var hei = extent.top - extent.bottom;
                var count = Math.ceil(Math.sqrt(num));
                var hCount = 1, vCount = 1;
                var n = 0;
                var inum = 0;
                var val1 = 2, val2 = 2;

                if (num > 100) {
                    num = 100
                }

                while ((inum < num) && (n < count * 2) && (num <= 100)) {
                    var ver = hei / hCount;
                    var her = wid / vCount;

                    val2 = 2;

                    for (i = 0; i < hCount; i++) {
                        val1 = 2 + Math.pow(parseFloat(-1), parseFloat(i));

                        for (j = 0; j < vCount; j++) {
                            if (inum >= num)
                                break;

                            var x = extent.left + her * i + her / val2 + 0.5;
                            var y = extent.bottom + ver * j + ver / val1 + 0.5;
                            var targetDot = new OpenLayers.Geometry.Point(x, y);

                            if (extent.toGeometry().intersects(targetDot)) {
                                var geometry = new OpenLayers.Geometry.Polygon.createRegularPolygon(targetDot, this.rad, 40);
                                dotArr.push(geometry);
                                inum++;
                            }
                            if (val1 < ver)
                                val1 += 1;
                        }
                        if (val2 < her)
                            val2 += 1;
                    }
                    if (i == hCount) {
                        vCount += 1;
                        hCount += 1;
                        n++;
                    }
                }

                if (dotArr.length > 0) {
                    var geomCollection = new OpenLayers.Geometry.Collection(dotArr);
                    var dotFeature = new OpenLayers.Feature.Vector(geomCollection);
                    dotFeature.style = this.defaultStyle;
                }
            }
        }
        return dotFeature;
    }
});
//========================================Zondy.ClientStatisticInfos.js======================================================//
/**
* @classdesc
* 统计专题图信息
* @constructor
* @param {Array<string>} fldNames: 统计字段数组
* @param {string} chartType:统计图类型
* @param {Number} height:统计图高度
* @param {Number} width:统计图宽度
* @param {string} chartThemeDiv:存放统计图的div名称
* @api
*/
Zondy.Enum.ClientStatisticInfos = {
};
Zondy.Enum.ClientStatisticInfos.ChartType = {
    bar: "bar",
    pie: "pie",
    line: "line"
};
Zondy.ClientStatisticInfos = OpenLayers.Class(Zondy.ClientThemeInfos, {
    fldNames: null,
    chartType: Zondy.Enum.ClientStatisticInfos.ChartType.bar,
    height: 200,
    width: 200,
    chartThemeDiv: null,
    initialize: function (fldNames, opt_options) {
        if (fldNames != null) {
            this.fldNames = fldNames;
        }
        $.extend(this, opt_options);
    },
    SetThemeInfo: function (feature, map) {
        //feature.id = feature.attributes["fId"];
        var id = feature.attributes["fId"].toString();

        var width = this.width;
        if (this.chartType == "bar" || this.chartType == "line") {
            width += this.fldNames.length * 5;
        }
        //div必须设置position: absolute，否则无法显示到地图上对应位置。
        var content = '<div id="' + id + '" style="position: absolute;height:' + this.height + 'px; width:' + width + 'px;"></div>';
        $("#" + this.chartThemeDiv).append(content);

        var flds = new Array();
        var data = new Array();
        var fldData = new Array();
        for (var i = 0; i < this.fldNames.length; i++) {
            var fldVal = parseFloat(feature.attributes[this.fldNames[i]]).toFixed(2);
            flds.push(this.fldNames[i]);
            data.push(fldVal);

            var field = new Object;
            field["value"] = fldVal;
            field["name"] = this.fldNames[i];
            fldData.push(field);
        }

        var chartType = this.chartType;


        var extent = feature.geometry.getBounds();
        var resolution = map.getResolution();
        var x = (extent.left + extent.right) / 2;
        var y = (extent.top + extent.bottom) / 2;
        var w = width * resolution;
        var h = this.height * resolution;
        var bounds = new OpenLayers.Bounds(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
        var box = new OpenLayers.Marker.Box(bounds, "black", 0);
        //box.lonlat = new OpenLayers.LonLat(x, y);
        box.div = document.getElementById(id);
        map.boxes.addMarker(box);
        this.createEChart(chartType, id, flds, data, fldData);
        return box;
    },
    AddChartInView: function (featureArr, map) {
        var resolution = map.getResolution();
        var viewExtent = map.getExtent();
        for (var i = 0; i < featureArr.length; i++) {
            if (document.getElementById(featureArr[i].attributes["fId"].toString()) == null) {
                var extent = featureArr[i].geometry.getBounds();
                var position = [(extent.left + extent.right) / 2, (extent.top + extent.bottom) / 2];
                if (position[0] > viewExtent.left && position[0] < viewExtent.right &&
                                position[1] > viewExtent.bottom && position[1] < viewExtent.top) {
                    var length = Math.max((extent.right - extent.left), extent.top - extent.bottom) / resolution;
                    if (length > 200) {
                        var box = this.SetThemeInfo(featureArr[i], map);
                    }
                }
            }
        }
    },
    createEChart: function (chartType, id, flds, data, fldData) {
        var rad = "55%";
        var center = ['50%', '60%'];
        if (chartType == "ring") {
            chartType = "pie";
            rad = ['50%', '70%'];
        }

        // 使用
        require(
            [
                'echarts',
                'echarts/chart/' + chartType // 使用柱状图就加载bar模块，按需加载
            ],
            function (ec) {
                // 基于准备好的dom，初始化echarts图表
                var myChart = ec.init(document.getElementById(id));

                var option;
                switch (chartType) {
                    case "bar":
                    case "line":
                        {
                            option = {
                                tooltip: {
                                    show: true
                                },
                                legend: {
                                    data: [id]
                                },
                                xAxis: [
                                    {
                                        type: 'category',
                                        data: flds
                                    }
                                ],
                                yAxis: [
                                    {
                                        type: 'value'
                                    }
                                ],
                                series: [
                                    {
                                        "name": id,
                                        "type": chartType,
                                        "data": data
                                    }
                                ]
                            };
                        }
                        break;
                    case "pie":
                        {
                            option = {
                                tooltip: {
                                    trigger: 'item',
                                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                                },
                                legend: {
                                    orient: 'vertical',
                                    x: 'left',
                                    data: flds
                                },
                                calculable: false,
                                series: [
                                    {
                                        name: id,
                                        type: chartType,
                                        radius: rad,
                                        center: center,
                                        data: fldData
                                    }
                                ]
                            };
                        }
                        break;
                    default:
                        return null;
                }

                // 为echarts对象加载数据 
                myChart.setOption(option);
            }
        )
    }
});
