
/*---------------------------------------------------------全局变量定义---------------------------------------------------------*/
//Zondy在zdclient中定义了
Zondy.Control = OpenLayers.Class(Zondy, {
});

Zondy.Marker = OpenLayers.Class(Zondy, {
});

/*---------------------------------------------------------导航控件---------------------------------------------------------*/
/**
* Class: Zondy.Control.PanZoomBar
*
* Inherits from:
*  - <OpenLayers.Control.PanZoom>
*/
Zondy.Control.PanZoomBar = OpenLayers.Class(OpenLayers.Control.PanZoom, {

    /** 
    * APIProperty: zoomStopWidth
    */
    zoomStopWidth: 18,

    /** 
    * APIProperty: zoomStopHeight
    */
    zoomStopHeight: 11,

    /** 
    * Property: slider
    */
    slider: null,

    /** 
    * Property: sliderEvents
    * {<OpenLayers.Events>}
    */
    sliderEvents: null,

    /** 
    * Property: zoomBarDiv
    * {DOMElement}
    */
    zoomBarDiv: null,

    /** 
    * Property: divEvents
    * {<OpenLayers.Events>}
    */
    divEvents: null,

    /** 
    * Property: zoomWorldIcon(复位，默认是加上的)
    * {Boolean}
    */
    zoomWorldIcon: true,

    /**
    * Constructor: Zondy.Control.PanZoomBar
    */
    initialize: function () {
        OpenLayers.Control.PanZoom.prototype.initialize.apply(this, arguments);
    },

    /**
    * APIMethod: destroy
    */
    destroy: function () {

        this.div.removeChild(this.slider);
        this.slider = null;

        this.sliderEvents.destroy();
        this.sliderEvents = null;

        this.div.removeChild(this.zoombarDiv);
        this.zoomBarDiv = null;

        this.divEvents.destroy();
        this.divEvents = null;

        this.map.events.un({
            "zoomend": this.moveZoomBar,
            "changebaselayer": this.redraw,
            scope: this
        });

        OpenLayers.Control.PanZoom.prototype.destroy.apply(this, arguments);
    },

    /**
    * Method: setMap
    * 
    * Parameters:
    * map - {<OpenLayers.Map>} 
    */
    setMap: function (map) {
        OpenLayers.Control.PanZoom.prototype.setMap.apply(this, arguments);
        this.map.events.register("changebaselayer", this, this.redraw);
    },

    /** 
    * Method: redraw
    * clear the div and start over.
    */
    redraw: function () {
        if (this.div != null) {
            this.div.innerHTML = "";
        }
        this.draw();
    },

    /**
    * Method: draw 
    *
    * Parameters:
    * px - {<OpenLayers.Pixel>} 
    */
    draw: function (px) {
        // initialize our internal div
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        px = this.position.clone();
        // 显示的位置
        px = new OpenLayers.Pixel(6, 80);
        // place the controls
        this.buttons = [];

        var sz = new OpenLayers.Size(19, 16);
        var updown_sz = new OpenLayers.Size(57, 21);
        var centered = new OpenLayers.Pixel(px.x + sz.w, px.y);
        var updown_centered = new OpenLayers.Pixel(px.x, px.y - 5);
        var wposition = sz.w;

        if (!this.zoomWorldIcon) {
            centered = new OpenLayers.Pixel(px.x + sz.w / 2, px.y);
            updown_sz = new OpenLayers.Size(36, 18);
            updown_centered = new OpenLayers.Pixel(px.x, px.y);
        }

        this._addButton("panup", "zongdy_up.png", updown_centered, updown_sz);
        px.y = centered.y + sz.h;
        this._addButton("panleft", "zongdy_left.png", px, sz);
        if (this.zoomWorldIcon) {
            this._addButton("zoomworld", "zongdy_refresh.png", px.add(sz.w, 0), sz);

            wposition *= 2;
        }
        this._addButton("panright", "zongdy_right.png", px.add(wposition, 0), sz);
        this._addButton("pandown", "zongdy_down.png", updown_centered.add(0, sz.h * 2 + 5), updown_sz);
        this._addButton("zoomin", "zongdy_plus.png", centered.add(0, sz.h * 3 + 5), sz);
        centered = this._addZoomBar(centered.add(0, sz.h * 4 + 5));
        this._addButton("zoomout", "zongdy_minus.png", centered, sz);
        return this.div;
    },

    /** 
    * Method: _addZoomBar
    * 
    * Parameters:
    * location - {<OpenLayers.Pixel>} where zoombar drawing is to start.
    */
    _addZoomBar: function (centered) {
        var imgLocation = OpenLayers.Util.getImagesLocation();

        var id = this.id + "_" + this.map.id;
        var zoomsToEnd = this.map.getNumZoomLevels() - 1 - this.map.getZoom();
        var slider = OpenLayers.Util.createAlphaImageDiv(id,
                       centered.add(-1, zoomsToEnd * this.zoomStopHeight),
                       new OpenLayers.Size(20, 9),
                       imgLocation + "slider.png",
                       "absolute");
        this.slider = slider;

        this.sliderEvents = new OpenLayers.Events(this, slider, null, true,
                                            { includeXY: true });
        this.sliderEvents.on({
            "mousedown": this.zoomBarDown,
            "mousemove": this.zoomBarDrag,
            "mouseup": this.zoomBarUp,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });

        var sz = new OpenLayers.Size();
        sz.h = this.zoomStopHeight * this.map.getNumZoomLevels();
        sz.w = this.zoomStopWidth;
        var div = null;

        if (OpenLayers.Util.alphaHack()) {
            var id = this.id + "_" + this.map.id;
            div = OpenLayers.Util.createAlphaImageDiv(id, centered,
                                      new OpenLayers.Size(sz.w,
                                              this.zoomStopHeight),
                                      imgLocation + "zongdy_zoombar.png",
                                      "absolute", null, "crop");
            div.style.height = sz.h + "px";
        } else {
            div = OpenLayers.Util.createDiv(
                        'OpenLayers_Control_PanZoomBar_Zoombar' + this.map.id,
                        centered,
                        sz,
                        imgLocation + "zongdy_zoombar.png");
        }

        this.zoombarDiv = div;

        this.divEvents = new OpenLayers.Events(this, div, null, true,
                                                { includeXY: true });
        this.divEvents.on({
            "mousedown": this.divClick,
            "mousemove": this.passEventToSlider,
            "dblclick": this.doubleClick,
            "click": this.doubleClick
        });

        this.div.appendChild(div);

        this.startTop = parseInt(div.style.top);
        this.div.appendChild(slider);

        this.map.events.register("zoomend", this, this.moveZoomBar);

        centered = centered.add(0,
            this.zoomStopHeight * this.map.getNumZoomLevels());
        return centered;
    },

    /*
    * Method: passEventToSlider
    * This function is used to pass events that happen on the div, or the map,
    * through to the slider, which then does its moving thing.
    *
    * Parameters:
    * evt - {<OpenLayers.Event>} 
    */
    passEventToSlider: function (evt) {
        this.sliderEvents.handleBrowserEvent(evt);
    },

    /*
    * Method: divClick
    * Picks up on clicks directly on the zoombar div
    *           and sets the zoom level appropriately.
    */
    divClick: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        var y = evt.xy.y;
        var top = OpenLayers.Util.pagePosition(evt.object)[1];
        var levels = (y - top) / this.zoomStopHeight;
        if (!this.map.fractionalZoom) {
            levels = Math.floor(levels);
        }
        var zoom = (this.map.getNumZoomLevels() - 1) - levels;
        zoom = Math.min(Math.max(zoom, 0), this.map.getNumZoomLevels() - 1);
        this.map.zoomTo(zoom);
        OpenLayers.Event.stop(evt);
    },

    /*
    * Method: zoomBarDown
    * event listener for clicks on the slider
    *
    * Parameters:
    * evt - {<OpenLayers.Event>} 
    */
    zoomBarDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        this.map.events.on({
            "mousemove": this.passEventToSlider,
            "mouseup": this.passEventToSlider,
            scope: this
        });
        this.mouseDragStart = evt.xy.clone();
        this.zoomStart = evt.xy.clone();
        this.div.style.cursor = "move";
        // reset the div offsets just in case the div moved
        this.zoombarDiv.offsets = null;
        OpenLayers.Event.stop(evt);
    },

    /*
    * Method: zoomBarDrag
    * This is what happens when a click has occurred, and the client is
    * dragging.  Here we must ensure that the slider doesn't go beyond the
    * bottom/top of the zoombar div, as well as moving the slider to its new
    * visual location
    *
    * Parameters:
    * evt - {<OpenLayers.Event>} 
    */
    zoomBarDrag: function (evt) {
        if (this.mouseDragStart != null) {
            var deltaY = this.mouseDragStart.y - evt.xy.y;
            var offsets = OpenLayers.Util.pagePosition(this.zoombarDiv);
            if ((evt.clientY - offsets[1]) > 0 &&
                (evt.clientY - offsets[1]) < parseInt(this.zoombarDiv.style.height) - 2) {
                var newTop = parseInt(this.slider.style.top) - deltaY;
                this.slider.style.top = newTop + "px";
            }
            this.mouseDragStart = evt.xy.clone();
            OpenLayers.Event.stop(evt);
        }
    },

    /*
    * Method: zoomBarUp
    * Perform cleanup when a mouseup event is received -- discover new zoom
    * level and switch to it.
    *
    * Parameters:
    * evt - {<OpenLayers.Event>} 
    */
    zoomBarUp: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }
        if (this.zoomStart) {
            this.div.style.cursor = "";
            this.map.events.un({
                "mouseup": this.passEventToSlider,
                "mousemove": this.passEventToSlider,
                scope: this
            });
            var deltaY = this.zoomStart.y - evt.xy.y;
            var zoomLevel = this.map.zoom;
            if (this.map.fractionalZoom) {
                zoomLevel += deltaY / this.zoomStopHeight;
                zoomLevel = Math.min(Math.max(zoomLevel, 0),
                                     this.map.getNumZoomLevels() - 1);
            } else {
                zoomLevel += Math.round(deltaY / this.zoomStopHeight);
            }
            this.map.zoomTo(zoomLevel);
            this.moveZoomBar();
            this.mouseDragStart = null;
            OpenLayers.Event.stop(evt);
        }
    },

    /*
    * Method: moveZoomBar
    * Change the location of the slider to match the current zoom level.
    */
    moveZoomBar: function () {
        var newTop =
            ((this.map.getNumZoomLevels() - 1) - this.map.getZoom()) *
            this.zoomStopHeight + this.startTop + 1;
        this.slider.style.top = newTop + "px";
    },

    CLASS_NAME: "Zondy.Control.PanZoomBar"
});

/*---------------------------------------------------------比例尺控件---------------------------------------------------------*/
/**
* Class: Zondy.Control.ScaleBar
* A scale bar styled with CSS(style/scalebar-thin.css).
* 
* Inherits from:
*  - <OpenLayers.Control>
*/
Zondy.Control.ScaleBar = OpenLayers.Class(OpenLayers.Control, {

    /**
    * Property: element
    * {Element}
    */
    element: null,

    /**
    * Property: scale
    * {Float} Scale denominator (1 / X) - set on update
    */
    scale: 1,

    /** 
    * APIProperty: displaySystem
    * {String} Display system for scale bar - metric or english supported.
    *     Default is metric.
    */
    displaySystem: 'metric',

    /**
    * APIProperty: minWidth
    * {Integer} Minimum width of the scale bar in pixels.  Default is 100 px.
    */
    minWidth: 100,

    /**
    * APIProperty: maxWidth
    * Maximum width of the scale bar in pixels.  Default is 200 px.
    */
    maxWidth: 200,

    /**
    * APIProperty: divisions
    * {Integer} Number of major divisions for the scale bar.  Default is 2.
    */
    divisions: 2,

    /**
    * APIProperty: subdivisions
    * {Integer} Number of subdivisions per major division.  Default is 1.
    */
    subdivisions: 1,

    /**
    * APIProperty: showMinorMeasures
    * {Boolean} Show measures for subdivisions.  Default is false.
    */
    showMinorMeasures: false,

    /**
    * APIProperty: singleLine
    * {Boolean} Display scale bar length and unit after scale bar.  Default
    *     is false.
    */
    singleLine: false,

    /**
    * APIProperty: align
    * {String} Determines how scale bar will be aligned within the element -
    * left, center, or right supported
    */
    align: 'left',

    /**
    * APIProperty: div
    * {Element} Optional DOM element to become the container for the scale
    *     bar.  If not provided, one will be created.
    */
    div: null,

    /**
    * Property: scaleText
    * Text to prefix the scale denominator used as a title for the scale bar
    *     element.  Default is "比例尺 1:".
    */
    scaleText: "比例尺 1:",

    /**
    * Property: thousandsSeparator
    * Thousands separator for formatted scale bar measures.  The title
    *     attribute for the scale bar always uses
    *     <OpenLayers.Number.thousandsSeparator> for number formatting.  To
    *     conserve space on measures displayed with markers, the default
    *     thousands separator for formatting is "" (no separator).
    */
    thousandsSeparator: "",

    /**
    * Property: measurementProperties
    * {Object} Holds display units, abbreviations, and conversion to inches
    * (since we're using dpi) per measurement sytem.
    */
    measurementProperties: {
        english: {
            units: ['英里', '英尺', '英寸'],
            inches: [63360, 12, 1]
        },
        metric: {
            units: ['千米', '米', '厘米'],
            inches: [39370.07874, 39.370079, 0.393701]
        }
    },

    /**
    * Property: limitedStyle
    * {Boolean} For browsers with limited CSS support, limitedStyle will be
    *     set to true.  In addition, this property can be set to true in the
    *     options sent to the constructor.  If true scale bar element offsets
    *     will be determined based on the <defaultStyles> object.
    */
    limitedStyle: false,

    /**
    * Property: customStyle
    * {Object} For cases where <limitedStyle> is true, a customStyle property
    *     can be set on the options sent to the constructor.  The
    *     <defaultStyles> object will be extended with this custom style
    *     object.
    */
    customStyles: null,

    /**
    * Property: defaultStyles
    * {Object} For cases where <limitedStyle> is true, default scale bar
    *     element offsets are taken from this object.  Values correspond to
    *     pixel dimensions given in the stylesheet.
    */
    defaultStyles: {
        Bar: {
            height: 11, top: 12,
            borderLeftWidth: 0,
            borderRightWidth: 0
        },
        BarAlt: {
            height: 11, top: 12,
            borderLeftWidth: 0,
            borderRightWidth: 0
        },

        MarkerMajor: {
            height: 7, width: 2, top: 12,
            borderLeftWidth: 0,
            borderRightWidth: 0
        },
        MarkerMinor: {
            height: 13, width: 13, top: 12,
            borderLeftWidth: 0,
            borderRightWidth: 0
        },

        NumbersBox: {
            height: 13, width: 40, top: 24
        },
        LabelBox: {
            height: 15, top: -2
        },
        LabelBoxSingleLine: {
            height: 15,
            width: 35, top: 5, left: 10
        }
    },

    /**
    * Property: appliedStyles
    * For cases where <limitedStyle> is true, scale bar element offsets will
    *     be determined based on <defaultStyles> extended with any
    *     <customStyles>.
    */
    appliedStyles: null,

    /**
    * Constructor: Zondy.Control.ScaleBar
    * Create a new scale bar instance.
    *
    * Parameters: 
    * options - {Object} Optional object whose properties will be set on this
    *     object.
    */
    initialize: function (options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        if (this.limitedStyle) {
            //this.appliedStyles = OpenLayers.Util.extend({}, this.defaultStyles);
            // OpenLayers.Util.extend(this.appliedStyles, this.customStyles);
        }
        // create scalebar DOM elements
        this.element = document.createElement('div');
        this.element.style.position = 'relative';
        this.element.className = this.displayClass + 'Wrapper';
        this.labelContainer = document.createElement('div');
        this.labelContainer.className = this.displayClass + 'Units';
        this.labelContainer.style.position = 'absolute';
        this.graphicsContainer = document.createElement('div');
        this.graphicsContainer.style.position = 'absolute';
        this.graphicsContainer.className = this.displayClass + 'Graphics';
        this.numbersContainer = document.createElement('div');
        this.numbersContainer.style.position = 'absolute';
        this.numbersContainer.className = this.displayClass + 'Numbers';
        this.element.appendChild(this.graphicsContainer);
        this.element.appendChild(this.labelContainer);
        this.element.appendChild(this.numbersContainer);
    },

    /**
    * APIMethod: destroy
    * Destroy the control.
    */
    destroy: function () {
        this.map.events.unregister('moveend', this, this.onMoveend);
        this.div.innerHTML = "";
        OpenLayers.Control.prototype.destroy.apply(this);
    },

    /**
    * Method: draw
    */
    draw: function () {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        // determine offsets for graphic elements
        this.dxMarkerMajor = (
            this.styleValue('MarkerMajor', 'borderLeftWidth') +
            this.styleValue('MarkerMajor', 'width') +
            this.styleValue('MarkerMajor', 'borderRightWidth')
        ) / 2;
        this.dxMarkerMinor = (
            this.styleValue('MarkerMinor', 'borderLeftWidth') +
            this.styleValue('MarkerMinor', 'width') +
            this.styleValue('MarkerMinor', 'borderRightWidth')
        ) / 2;
        this.dxBar = (
            this.styleValue('Bar', 'borderLeftWidth') +
            this.styleValue('Bar', 'borderRightWidth')
        ) / 2;
        this.dxBarAlt = (
            this.styleValue('BarAlt', 'borderLeftWidth') +
            this.styleValue('BarAlt', 'borderRightWidth')
        ) / 2;
        this.dxNumbersBox = this.styleValue('NumbersBox', 'width') / 2;
        // set scale bar element height
        var classNames = ['Bar', 'BarAlt', 'MarkerMajor', 'MarkerMinor'];
        if (this.singleLine) {
            classNames.push('LabelBoxSingleLine');
        } else {
            classNames.push('NumbersBox', 'LabelBox');
        }
        var vertDisp = 0;
        for (var classIndex = 0; classIndex < classNames.length; ++classIndex) {
            var cls = classNames[classIndex];
            vertDisp = Math.max(
                vertDisp,
                this.styleValue(cls, 'top') + this.styleValue(cls, 'height')
            );
        }
        this.element.style.height = vertDisp + 'px';
        this.xOffsetSingleLine = this.styleValue('LabelBoxSingleLine', 'width') +
                                 this.styleValue('LabelBoxSingleLine', 'left');

        //this.div.style.left = 4 + "px";
        // var mapHeight = this.map.div.style.height;
        //this.div.style.top = parseInt(mapHeight.substring(0, mapHeight.length - 2)) - 40 + "px";

        this.div.appendChild(this.element);
        this.map.events.register('moveend', this, this.onMoveend);
        this.update();
        return this.div;
    },

    /**
    * Method: onMoveend
    * Registered as a listener for "moveend".
    */
    onMoveend: function () {
        this.update();
    },

    /**
    * APIMethod: update
    * Update the scale bar after modifying properties.
    *
    * Parameters:
    * scale - {Float} Optional scale denominator.  If not specified, the
    *     map scale will be used.
    */
    update: function (scale) {
        if (this.map.baseLayer == null || !this.map.getScale()) {
            return;
        }
        this.scale = (scale != undefined) ? scale : this.map.getScale();
        // update the element title and width
        this.element.title = this.scaleText + OpenLayers.Number.format(this.scale);
        this.element.style.width = this.maxWidth + 'px';

        // check each measurement unit in the display system
        var comp = this.getComp();
        // get the value (subdivision length) with the lowest cumulative score
        this.setSubProps(comp);
        // clean out any old content from containers
        this.labelContainer.innerHTML = "";
        this.graphicsContainer.innerHTML = "";
        this.numbersContainer.innerHTML = "";
        // create all divisions
        var numDiv = this.divisions * this.subdivisions;
        var alignmentOffset = {
            left: 0 + (this.singleLine ? 0 : this.dxNumbersBox),
            center: (this.maxWidth / 2) -
                (numDiv * this.subProps.pixels / 2) -
                (this.singleLine ? this.xOffsetSingleLine / 2 : 0),
            right: this.maxWidth -
                (numDiv * this.subProps.pixels) -
                (this.singleLine ? this.xOffsetSingleLine : this.dxNumbersBox)
        }
        var xPos, measure, divNum, cls, left;
        for (var di = 0; di < this.divisions; ++di) {
            // set xPos and measure to start of division
            xPos = di * this.subdivisions * this.subProps.pixels +
                   alignmentOffset[this.align];
            // add major marker
            this.graphicsContainer.appendChild(this.createElement(
                "MarkerMajor", " ", xPos - this.dxMarkerMajor
            ));
            // add major measure
            if (!this.singleLine) {
                measure = (di == 0) ? 0 :
                    OpenLayers.Number.format(
                        (di * this.subdivisions) * this.subProps.length,
                        this.subProps.dec, this.thousandsSeparator
                    );
                this.numbersContainer.appendChild(this.createElement(
                    "NumbersBox", measure, xPos - this.dxNumbersBox
                ));
            }
            // create all subdivisions
            for (var si = 0; si < this.subdivisions; ++si) {
                if ((si % 2) == 0) {
                    cls = "Bar";
                    left = xPos - this.dxBar;
                } else {
                    cls = "BarAlt";
                    left = xPos - this.dxBarAlt;
                }
                this.graphicsContainer.appendChild(this.createElement(
                    cls, " ", left, this.subProps.pixels
                ));
                // add minor marker if not the last subdivision
                if (si < this.subdivisions - 1) {
                    // set xPos and measure to end of subdivision
                    divNum = (di * this.subdivisions) + si + 1;
                    xPos = divNum * this.subProps.pixels +
                           alignmentOffset[this.align];
                    this.graphicsContainer.appendChild(this.createElement(
                        "MarkerMinor", " ", xPos - this.dxMarkerMinor
                    ));
                    if (this.showMinorMeasures && !this.singleLine) {
                        // add corresponding measure
                        measure = divNum * this.subProps.length;
                        this.numbersContainer.appendChild(this.createElement(
                            "NumbersBox", measure, xPos - this.dxNumbersBox
                        ));
                    }
                }
            }
        }
        // set xPos and measure to end of divisions
        xPos = numDiv * this.subProps.pixels;
        xPos += alignmentOffset[this.align];
        // add the final major marker
        this.graphicsContainer.appendChild(this.createElement(
            "MarkerMajor", " ", xPos - this.dxMarkerMajor
        ));
        // add final measure
        measure = OpenLayers.Number.format(
            numDiv * this.subProps.length,
            this.subProps.dec, this.thousandsSeparator
        );
        if (!this.singleLine) {
            this.numbersContainer.appendChild(this.createElement(
                "NumbersBox", measure, xPos - this.dxNumbersBox
            ));
        }
        // add content to the label element
        var labelBox = document.createElement('div');
        labelBox.style.position = 'absolute';
        var labelText;
        if (this.singleLine) {
            labelText = measure;
            labelBox.className = this.displayClass + 'LabelBoxSingleLine';
            labelBox.style.left = Math.round(
                xPos + this.styleValue('LabelBoxSingleLine', 'left')) + 'px';
        } else {
            labelText = '';
            labelBox.className = this.displayClass + 'LabelBox';
            labelBox.style.textAlign = 'center';
            labelBox.style.width = Math.round(numDiv * this.subProps.pixels) + 'px'
            labelBox.style.left = Math.round(alignmentOffset[this.align]) + 'px';
            labelBox.style.overflow = 'hidden';
        }

        labelText += ' ' + this.subProps.units;

        labelBox.appendChild(document.createTextNode(labelText));
        this.labelContainer.appendChild(labelBox);
    },

    /**
    * Method: createElement
    * Create a scale bar element.  These are absolutely positioned with
    *     hidden overflow and left offset.
    *
    * Parameters:
    * cls - {String} Class name suffix.
    * text - {String} Text for child node.
    * left - {Float} Left offset.
    * width - {Float} Optional width.
    * 
    * Returns:
    * {Element} A scale bar element.
    */
    createElement: function (cls, text, left, width) {
        var element = document.createElement("div");
        element.className = this.displayClass + cls;
        OpenLayers.Util.extend(element.style, {
            position: "absolute",
            textAlign: "center",
            overflow: "hidden",
            left: Math.round(left) + "px"
        });
        element.appendChild(document.createTextNode(text));
        if (width) {
            element.style.width = Math.round(width) + "px";
        }
        return element;
    },

    /**
    * Method: getComp
    * Get comparison matrix.
    */
    getComp: function () {
        var system = this.measurementProperties[this.displaySystem];
        var numUnits = system.units.length;
        var comp = new Array(numUnits);
        var numDiv = this.divisions * this.subdivisions;
        for (var unitIndex = 0; unitIndex < numUnits; ++unitIndex) {
            comp[unitIndex] = {};
            var ppdu = OpenLayers.DOTS_PER_INCH *
                system.inches[unitIndex] / this.scale;
            var minSDDisplayLength = ((this.minWidth - this.dxNumbersBox) /
                                       ppdu) / numDiv;
            var maxSDDisplayLength = ((this.maxWidth - this.dxNumbersBox) /
                                       ppdu) / numDiv;
            // add up scores for each marker (even if numbers aren't displayed)
            for (var vi = 0; vi < numDiv; ++vi) {
                var minNumber = minSDDisplayLength * (vi + 1);
                var maxNumber = maxSDDisplayLength * (vi + 1);
                var num = this.getHandsomeNumber(minNumber, maxNumber);
                var compNum = {
                    value: (num.value / (vi + 1)),
                    score: 0, tie: 0, dec: 0, displayed: 0
                };
                // tally up scores for all values given this subdivision length
                for (var vi2 = 0; vi2 < numDiv; ++vi2) {
                    var position = num.value * (vi2 + 1) / (vi + 1);
                    var num2 = this.getHandsomeNumber(position, position);
                    var major = ((vi2 + 1) % this.subdivisions == 0);
                    var last = ((vi2 + 1) == numDiv);
                    if ((this.singleLine && last) ||
                       (!this.singleLine && (major || this.showMinorMeasures))) {
                        // count scores for displayed marker measurements
                        compNum.score += num2.score;
                        compNum.tie += num2.tie;
                        compNum.dec = Math.max(compNum.dec, num2.dec);
                        compNum.displayed += 1;
                    } else {
                        // count scores for non-displayed marker measurements
                        compNum.score += num2.score / this.subdivisions;
                        compNum.tie += num2.tie / this.subdivisions;
                    }
                }
                // adjust scores so numbers closer to 1 are preferred for display
                compNum.score *= (unitIndex + 1) * compNum.tie / compNum.displayed;
                comp[unitIndex][vi] = compNum;
            }
        }
        return comp;
    },

    /**
    * Method: setSubProps
    * Set subdivision properties based on comparison matrix.
    */
    setSubProps: function (comp) {
        var system = this.measurementProperties[this.displaySystem];
        var score = Number.POSITIVE_INFINITY;
        var tie = Number.POSITIVE_INFINITY;
        for (var unitIndex = 0; unitIndex < comp.length; ++unitIndex) {
            var ppdu = OpenLayers.DOTS_PER_INCH *
                system.inches[unitIndex] / this.scale;
            for (var vi in comp[unitIndex]) {
                var compNum = comp[unitIndex][vi];
                if ((compNum.score < score) ||
                   ((compNum.score == score) && (compNum.tie < tie))) {
                    this.subProps = {
                        length: compNum.value,
                        pixels: ppdu * compNum.value,
                        units: system.units[unitIndex],
                        dec: compNum.dec
                    };
                    score = compNum.score;
                    tie = compNum.tie;
                }
            }
        }
    },

    /**
    * Method: styleValue
    * Get an integer value associated with a particular selector and key.
    *     Given a stylesheet with .displayClassSomeSelector {border: 2px solid red},
    *     styleValue('SomeSelector', 'borderWidth') returns 2
    *
    * Returns:
    * {Integer} A value associated with a style selector/key combo.
    */
    styleValue: function (selector, key) {
        var value = 0;
        if (this.limitedStyle) {
            value = this.appliedStyles[selector][key];
        } else {
            selector = "." + this.displayClass + selector;
            rules:
            for (var i = document.styleSheets.length - 1; i >= 0; --i) {
                var sheet = document.styleSheets[i];
                if (!sheet.disabled) {
                    var allRules;
                    try {
                        if (typeof (sheet.cssRules) == 'undefined') {
                            if (typeof (sheet.rules) == 'undefined') {
                                // can't get rules, keep looking
                                continue;
                            } else {
                                allRules = sheet.rules;
                            }
                        } else {
                            allRules = sheet.cssRules;
                        }
                    } catch (err) {
                        continue;
                    }
                    for (var ruleIndex = 0; ruleIndex < allRules.length; ++ruleIndex) {
                        var rule = allRules[ruleIndex];
                        if (rule.selectorText &&
                           (rule.selectorText.toLowerCase() == selector.toLowerCase())) {
                            if (rule.style[key] != '') {
                                value = parseInt(rule.style[key]);
                                break rules;
                            }
                        }
                    }
                }
            }
        }
        // if the key was not found, the equivalent value is zero
        return value ? value : 0;
    },

    /**
    * Method: getHandsomeNumber
    * Attempts to generate a nice looking positive number between two other
    *     positive numbers.
    *
    * Parameters:
    * small - {Float} Lower positive bound.
    * big - {Float} Upper positive bound.
    * sigFigs - {Integer} Number of significant figures to consider.  Default
    *     is 10.
    *
    * Returns:
    * {Object} Object representing a nice looking number.
    */
    getHandsomeNumber: function (small, big, sigFigs) {
        sigFigs = (sigFigs == null) ? 10 : sigFigs;
        // if all else fails, return a small ugly number
        var num = {
            value: small,
            score: Number.POSITIVE_INFINITY,
            tie: Number.POSITIVE_INFINITY,
            dec: 3
        };
        // try the first three comely multiplicands (in order of comliness)
        var cmult, max, dec, tmult, multiplier, score, tie;
        for (var hexp = 0; hexp < 3; ++hexp) {
            cmult = Math.pow(2, (-1 * hexp));
            max = Math.floor(Math.log(big / cmult) / Math.LN10);
            for (var texp = max; texp > (max - sigFigs + 1); --texp) {
                dec = Math.max(hexp - texp, 0);
                tmult = cmult * Math.pow(10, texp);
                // check if there is an integer multiple of tmult
                // between small and big
                if ((tmult * Math.floor(big / tmult)) >= small) {
                    // check if small is an integer multiple of tmult
                    if (small % tmult == 0) {
                        multiplier = small / tmult;
                    } else {
                        // smallest integer multiple between small and big
                        multiplier = Math.floor(small / tmult) + 1;
                    }
                    // test against the best (lower == better)
                    score = multiplier + (2 * hexp);
                    tie = (texp < 0) ? (Math.abs(texp) + 1) : texp;
                    if ((score < num.score) || ((score == num.score) &&
                       (tie < num.tie))) {
                        num.value = parseFloat((tmult * multiplier).toFixed(dec));
                        num.score = score;
                        num.tie = tie;
                        num.dec = dec;
                    }
                }
            }
        }
        return num;
    },

    CLASS_NAME: "Zondy.Control.ScaleBar"

});

/*---------------------------------------------------------图例控件---------------------------------------------------------*/

/**
* Class: Zondy.Control.LegendBar
* 
* Inherits from:
*  - <OpenLayers.Control>
*/
Zondy.Control.LegendBar = OpenLayers.Class(OpenLayers.Control, {

    /**
    * Property: element
    * {Element}
    */
    element: null,

    /**
    * Property: legendName
    * Name to Legend used as a title for the legend bar
    *     element.  Default is "图例".
    */
    legendName: "图例",

    /**
    * APIProperty: left
    * left position
    */
    left: null,

    /**
    * APIProperty: top
    * top position
    */
    top: null,

    /**
    * APIProperty: LegendMarks
    * {Array(<Zondy.Control.LegendMark>)} Ordered list of LegendMarks in the LegendBar
    */
    LegendMarks: null,

    /**
    * Constructor: Zondy.Control.ScaleBar
    * Create a new scale bar instance.
    *
    * Parameters: 
    * options - {Object} Optional object whose properties will be set on this
    *     object.
    */
    initialize: function (legendName, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        if (legendName) {
            this.legendName = legendName;
        }
        this.LegendMarks = [];

        this.element = document.createElement('div');
        this.element.style.position = 'relative';
    },

    /**
    * APIMethod: destroy
    * Destroy the control.
    */
    destroy: function () {

        this.div.innerHTML = "";
        OpenLayers.Control.prototype.destroy.apply(this);
    },

    /**
    * Method: draw
    */
    draw: function () {
        OpenLayers.Control.prototype.draw.apply(this, arguments);

        if (!this.left && !this.top) {
            this.div.style.right = 10 + "px";
            this.div.style.bottom = 10 + "px";
        } else {
            this.div.style.left = this.left + "px";
            this.div.style.top = this.top + "px";
        }

        this.div.style.border = "double blue 4px";
        this.div.style.backgroundColor = "#E2ECFA";
        //create legend title div 
        var titleDiv = document.createElement('div');
        titleDiv.style.textAlign = "center";
        titleDiv.style.fontSize = "13";
        titleDiv.appendChild(document.createTextNode(this.legendName));
        this.div.appendChild(titleDiv);

        this.div.appendChild(this.element);
        return this.div;
    },

    /**
    * APIMethod: addLegendMark
    *
    * Parameters:
    * legendMark - {<Zondy.Control.LegendMark>}
    */
    addLegendMark: function (legendMark) {
        this.element.appendChild(legendMark.markContainerDiv);
        this.LegendMarks.push(legendMark);
        legendMark.draw();
    },

    /**
    * APIMethod: removeLegendMark
    *
    * Parameters:
    * legendMark - {<Zondy.Control.LegendMark>}
    */
    removeLegendMark: function (legendMark) {
        this.element.removeChild(legendMark.markContainerDiv);
        //删除数组的内容
        for (var i = 0, len = this.LegendMarks.length; i < len; i++) {
            var iLegendMark = this.LegendMarks[i];
            if (iLegendMark == legendMark) {
                this.LegendMarks.splice(i, 1);
                break;
            }
        }

        legendMark.legendBar = null;
        legendMark.destroy();
    },


    CLASS_NAME: "Zondy.Control.LegendBar"

});

/**
* Class: Zondy.Control.LegendMark
*/
Zondy.Control.LegendMark = OpenLayers.Class({

    /**
    * Property: markContainerDiv
    * {HTMLDivElement} The element that contains the mark.
    */
    markContainerDiv: null,

    /**
    * Property: markName
    * Name used as a title for the mark
    *     element.  Default is "名称1".
    */
    markName: "名称1",

    /**
    * Property: markPicUrl
    * {String}picture used as a url for the mark
    */
    markPicUrl: "",

    /**
    * APIProperty: left
    * left position
    */
    left: 2,

    /**
    * APIProperty: top
    * top position
    */
    top: 2,

    /**
    * APIProperty: legendBar
    * {<Zondy.Control.LegendBar>} This variable is set when the layer is added to 
    *     the LegendBar, via the accessor function setLegendBar().
    */
    legendBar: null,

    /**
    * Constructor: Zondy.Control.LegendMark
    * Create a new LegendMark instance.
    *
    * Parameters: 
    * options - {Object} Optional object whose properties will be set on this
    *     object.
    */
    initialize: function (markPicUrl, markName, left, top) {

        if (markName) {
            this.markName = markName;
        }
        this.markPicUrl = markPicUrl;
        if (left && top) {
            this.left = left;
            this.top = top;
        }

        // create LegendMark DOM elements
        this.markContainerDiv = document.createElement('div');
        this.markContainerDiv.style.position = 'relative';
        this.markContainerDiv.style.left = this.left + "px";
        this.markContainerDiv.style.top = this.top + "px";
    },

    /**
    * APIMethod: destroy
    * Destroy the control.
    */
    destroy: function () {

        this.markContainerDiv.innerHTML = "";
        this.markContainerDiv = null;
    },

    /** 
    * Method: clone
    * 
    * Returns:
    * {<Zondy.Control.LegendMark>} A fresh copy of the LegendMark.
    */
    clone: function (obj) {
        if (obj == null) {
            obj = new Zondy.Control.LegendMark(this.markPicUrl,
                                               this.markName,
                                               this.left,
                                               this.top);
        }
        obj.legendBar = null;
        return obj;
    },

    /**
    * Method: draw
    */
    draw: function () {
        //create pic and name
        var markPicDiv = document.createElement('div');
        var markNameDiv = document.createElement('div');

        markPicDiv.appendChild(OpenLayers.Util.createImage(null, null, OpenLayers.Size(10, 10),
                                                           this.markPicUrl, null, null, null, null));
        markNameDiv.style.fontSize = "10";
        markNameDiv.appendChild(document.createTextNode(this.markName));
        //创建一个一行两列的表格
        var markTable = document.createElement("table");
        markTable.border = "0px";
        var row = markTable.insertRow(0);
        var subcell0 = row.insertCell(0);
        //subcell0.style.width = "50%";
        subcell0.appendChild(markPicDiv);

        var subcell1 = row.insertCell(1);
        //subcell1.style.width = "80%";
        subcell1.appendChild(markNameDiv);

        this.markContainerDiv.appendChild(markTable);
        this.display(true);
        return this.markContainerDiv;
    },

    /**
    * Method: setLegendBar
    * 
    * Parameters:
    * legendBar - {<Zondy.Control.LegendBar>}
    */
    setLegendBar: function (legendBar) {
        this.legendBar = legendBar;
    },
    /** 
    * Method: display
    * Hide or show the mark
    *
    * Parameters:
    * display - {Boolean}
    */
    display: function (display) {
        this.markContainerDiv.style.display = (display) ? "" : "none";
    },


    CLASS_NAME: "Zondy.Control.LegendMark"

});

/*---------------------------------------------------------放大镜控件---------------------------------------------------------*/

/**
* Class: Zondy.Control.Magnifier
*
* Inerits from:
*  - <OpenLayers.Control>
*/
Zondy.Control.Magnifier = OpenLayers.Class(OpenLayers.Control, {

    mapDiv: null,
    /**
    * Property: mmap
    * {<OpenLayers.Map>}
    */
    mmap: null,

    /**
    * APIProperty: draggable
    * {Boolean}
    */
    draggable: true,

    /**
    * Property: size
    * {OpenLayers.Size}
    */
    size: new OpenLayers.Size(160, 160),

    /**
    * APIProperty: zoomable
    * {Boolean} 
    */
    zoomable: true,

    /**
    * APIProperty: delta
    * {Integer}
    */
    delta: 1,

    /**
    *map options
    * APIProperty: mapOptions
    * {Object}
    */
    mapOptions: null,

    /**
    * Constructor: Zondy.Control.Magnifier
    * Create a new Magnifier bar instance.
    *
    * Parameters: 
    * options - {Object} Optional object whose properties will be set on this
    *     object.
    */
    initialize: function (mapOptions, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.mapOptions = mapOptions;

    },
    /**
    * Method: draw
    */
    draw: function (px) {
        OpenLayers.Control.prototype.draw.apply(this, arguments);

        var imageLocation = OpenLayers.Util.getImagesLocation();
        //set div width and height
        this.div.style.width = this.size.w + "px";
        this.div.style.height = this.size.h + "px";
        //set div position
        this.div.style.top = "5px";
        this.div.style.right = "5px";
        //this.div.style.filter = "chroma(color=red)";

        this.mapDiv = document.createElement('div');
        this.mapDiv.style.width = this.size.w + "px";
        this.mapDiv.style.height = this.size.h + "px";
        this.mapDiv.style.position = "absolute";
        this.mapDiv.style.zIndex = 1;
        this.mapDiv.style.cursor = "crosshair";
        this.div.appendChild(this.mapDiv);

        if (this.mapOptions.maxExtent && this.mapOptions.maxResolution) {
            this.mmap = new OpenLayers.Map(this.mapDiv, OpenLayers.Util.applyDefaults({
                maxExtent: this.mapOptions.maxExtent,
                maxResolution: this.mapOptions.maxResolution,
                controls: [],
                layers: [this.map.baseLayer.clone()]

            }, this.map.initialOptions));

        } else {
            this.mmap = new OpenLayers.Map(this.mapDiv, OpenLayers.Util.applyDefaults({
                controls: [],
                layers: [this.map.baseLayer.clone()]
            }, this.map.initialOptions));

        }
        //can move
        OpenLayers.Event.observe(this.mapDiv, "mousemove",
            OpenLayers.Function.bindAsEventListener(this.drag, this)
          );

        this.handlers = this.handlers || {};
        //can zoom
        if (this.zoomable) {
            this.handlers.wheel = new OpenLayers.Handler.MouseWheel(this, {
                up: this.zoom,
                down: this.zoom
            });
            this.handlers.wheel.setMap(this.mmap);
            this.handlers.wheel.activate();
        }
        if (this.map.events) {
            this.map.events.on({
                "move": this.update,
                "changebaselayer": this.changelayer,
                scope: this
            });
        }

        return this.div;
    },

    /**
    * APIMethod: zoom
    * 放大/缩小
    * Parameters:
    * evt - {Event} The mouse event
    */
    zoom: function (evt, delta) {
        this.delta = Math.max(this.delta + delta, 0);
        this.mmap.zoomTo(this.map.getZoom() + this.delta);
    },
    /**
    * APIMethod: drag
    * 拖动
    */
    drag: function (evt) {
        if (!this.map.div.scrolls) {
            var viewportElement = OpenLayers.Util.getViewportElement();
            this.map.div.scrolls = [
                viewportElement.scrollLeft,
                viewportElement.scrollTop
            ];
        }
        if (!this.map.div.lefttop) {
            this.map.div.lefttop = [
                (document.documentElement.clientLeft || 0),
                (document.documentElement.clientTop || 0)
            ];
        }
        if (!this.map.div.offsets) {
            this.map.div.offsets = OpenLayers.Util.pagePosition(this.map.div);
        }
        this.div.style.left = (evt.clientX + this.map.div.scrolls[0] - this.map.div.offsets[0]
                         - this.map.div.lefttop[0] - this.size.w / 2) + "px";
        this.div.style.top = (evt.clientY + this.map.div.scrolls[1] - this.map.div.offsets[1]
                         - this.map.div.lefttop[1] - this.size.h / 2) + "px";

        this.update();
    },

    changelayer: function (evt) {
        // TODO: overkill, we know that we have only one layer (?)
        for (var i = 0, len = this.mmap.layers.length; i < len; i++) {
            this.mmap.removeLayer(this.mmap.layers[i]);
        }
        this.mmap.addLayer(evt.layer.clone());
    },

    update: function () {

        var px = new OpenLayers.Pixel(this.div.offsetLeft + (this.div.offsetWidth / 2),
                                      this.div.offsetTop + (this.div.offsetHeight / 2));
        this.mmap.updateSize();
        this.mmap.moveTo(this.map.getLonLatFromPixel(px),
                         this.map.getZoom() + this.delta);

    },

    /**
    * APIMethod: destroy
    * Destroy the control.
    */
    destroy: function () {

        if (this.map.events) {
            this.map.events.un({
                "move": this.update,
                "changebaselayer": this.changelayer,
                scope: this
            });
        }
        if (this.mmap) {
            this.mmap.destroy();
        }

        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    CLASS_NAME: "Zondy.Control.Magnifier"
});

/*---------------------------------------------------------测量控件（长度和面积）---------------------------------------------------------*/

/**
* Class: Zondy.Marker.Text
*
* Inherits from:
*  - <OpenLayers.Marker> 
*/
Zondy.Marker.Text = OpenLayers.Class(OpenLayers.Marker, {

    /** 
    * Property: lonLat 
    * {<OpenLayers.LonLat>} 
    */
    lonLat: null,

    /** 
    * Property: lonLat 
    * {<String>}(Html内容)
    */
    content: "",

    /** 
    * Property: size 
    * {<OpenLayers.Size>}
    */
    size: null,

    /** 
    * Property: div
    * {DOMElement}
    */
    div: null,

    /**
    * APIProperty: tolerance
    * {int}(私有)
    */
    tolerance: 7,

    /** 
    * Constructor: Zondy.Marker.Text
    *
    * Parameters:
    * lonLat - {<OpenLayers.LonLat>} 
    * borderColor - {String} 
    * borderWidth - {int} 
    */
    initialize: function (lonLat, content, size, borderColor, borderWidth) {
        this.lonLat = lonLat;
        this.content = content;
        this.size = size;
        this.div = OpenLayers.Util.createDiv();
        this.div.style.overflow = 'hidden';
        this.div.style.backgroundColor = '#EDEDED';
        this.div.style.textAlign = "center";
        this.div.style.fontSize = "12";
        this.div.className = 'ZondyMarkerTextDiv';

        this.events = new OpenLayers.Events(this, this.div, null);
        this.setBorder(borderColor, borderWidth);
    },

    /**
    * Method: destroy 
    */
    destroy: function () {

        this.bounds = null;
        this.div = null;

        OpenLayers.Marker.prototype.destroy.apply(this, arguments);
    },

    /** 
    * Method: setBorder
    * Allow the user to change the box's color and border width
    * 
    * Parameters:
    * color - {String} Default is "#949494"
    * width - {int} Default is 1
    */
    setBorder: function (color, width) {
        if (!color) {
            color = "#949494";
        }
        if (!width) {
            width = 1;
        }
        this.div.style.border = width + "px solid " + color;
    },

    /** 
    * Method: draw
    * 
    * Parameters:
    * px - {<OpenLayers.Pixel>} 
    * sz - {<OpenLayers.Size>} 
    * 
    * Returns: 
    * {DOMElement} A new DOM Image with this marker icon set at the 
    *         location passed-in
    */
    draw: function (px) {
        px = px.add(this.tolerance, 0);
        if (!this.size) {
            this.size = new OpenLayers.Size(80, 20);
        }
        OpenLayers.Util.modifyDOMElement(this.div, null, px, this.size);
        this.div.innerHTML = this.content;

        return this.div;
    },

    /**
    * Method: display
    * Hide or show the icon
    * 
    * Parameters:
    * display - {Boolean} 
    */
    display: function (display) {
        this.div.style.display = (display) ? "" : "none";
    },

    CLASS_NAME: "Zondy.Marker.Text"
});

/**
* Class: Zondy.Texts
* Draw divs as 'Texts' on the layer. 
*
* Inherits from:
*  - <OpenLayers.Layer.Markers>
*/
Zondy.Texts = OpenLayers.Class(OpenLayers.Layer.Markers, {

    /**
    * Constructor: Zondy.Texts
    *
    * Parameters:
    * name - {String}
    * options - {Object} Hashtable of extra options to tag onto the layer
    */
    initialize: function (name, options) {
        OpenLayers.Layer.Markers.prototype.initialize.apply(this, arguments);
    },

    /** 
    * Method: drawMarker 
    * Calculate the pixel location for the marker, create it, and
    *    add it to the layer's div
    *
    * Parameters: 
    * marker - {<Zondy.Marker.Text>}
    */
    drawMarker: function (marker) {
        var lonLat = marker.lonLat;
        var location = this.map.getLayerPxFromLonLat(lonLat);
        if (location == null) {
            marker.display(false);
        } else {
            var markerDiv = marker.draw(location);
            if (!marker.drawn) {
                this.div.appendChild(markerDiv);
                marker.drawn = true;
            }
        }
    },


    /**
    * APIMethod: removeMarker 
    * 
    * Parameters:
    * marker - {<OpenLayers.Marker.Box>} 
    */
    removeMarker: function (marker) {
        OpenLayers.Util.removeItem(this.markers, marker);
        if ((marker.div != null) &&
            (marker.div.parentNode == this.div)) {
            this.div.removeChild(marker.div);
        }
    },

    CLASS_NAME: "Zondy.Texts"
});

/**
* Class: Zondy.Control.Measure
* Allows for drawing of features for measurements.
*
* Inherits from:
*  - <OpenLayers.Control>
*/
Zondy.Control.Measure = OpenLayers.Class(OpenLayers.Control, {

    /** 
    * APIProperty: handlerOptions
    * {Object} Used to set non-default properties on the control's handler
    */
    handlerOptions: null,

    /**
    * Property: callbacks
    * {Object} The functions that are sent to the handler for callback
    */
    callbacks: null,

    /**
    * Property: displaySystem
    * {String} Display system for output measurements.  Supported values
    *     are 'english', 'metric', and 'geographic'.  Default is 'metric'.
    */
    displaySystem: 'metric',

    /**
    * Property: geodesic
    * {Boolean} Calculate geodesic metrics instead of planar metrics.  This
    *     requires that geometries can be transformed into Geographic/WGS84
    *     (if that is not already the map projection).  Default is false.
    */
    geodesic: false,

    /**
    * Property: displaySystemUnits
    * {Object} Units for various measurement systems.  Values are arrays
    *     of unit abbreviations (from OpenLayers.INCHES_PER_UNIT) in decreasing
    *     order of length.
    */
    displaySystemUnits: {
        geographic: ['dd'],
        english: ['mi', 'ft', 'in'],
        metric: ['km', 'm']
    },

    /**
    * Property: delay
    * {Number} Number of milliseconds between clicks before the event is
    *     considered a double-click.  The "measurepartial" event will not
    *     be triggered if the sketch is completed within this time.  This
    *     is required for IE where creating a browser reflow (if a listener
    *     is modifying the DOM by displaying the measurement values) messes
    *     with the dblclick listener in the sketch handler.
    */
    partialDelay: 100,

    /**
    * Property: delayedTrigger
    * {Number} Timeout id of trigger for measurepartial.
    */
    delayedTrigger: null,

    /**
    * APIProperty: persist
    * {Boolean} Keep the temporary measurement sketch drawn after the
    *     measurement is complete.  The geometry will persist until a new
    *     measurement is started, the control is deactivated, or <cancel> is
    *     called.
    */
    persist: true,

    /** 
    * Property: texts
    * {<Zondy.Texts>}(私有)
    */
    texts: null,

    /** 
    * Property: closeMarkers
    * {<OpenLayers.Layer.Markers>}(私有)
    */
    closeMarkers: null,

    /**
    * APIProperty: tolerance
    * {int}(私有)
    */
    tolerance: 15,
    /**
    * APIProperty: stat
    * {Array}(私有)
    */
    stat: null,

    /**
    * APIProperty: order
    * {int}(私有)
    */
    order: null,

    /**
    * APIProperty: measureLayer
    * {OpenLayers.Layer.Vector}(私有)
    */
    measureLayer: null,

    /**
    * APIProperty: immediate
    * {Boolean} Activates the immediate measurement so that the "measurepartial"
    *     event is also fired once the measurement sketch is modified.
    *     Default is false.
    */
    immediate: true,

    /**
    * Constructor: Zondy.Control.Measure
    * 
    * Parameters:
    * handler - {<OpenLayers.Handler>} 
    * options - {Object} 
    */
    initialize: function (handler, options) {

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        var callbacks = { done: this.measureComplete,
            point: this.measurePartial
        };
        if (this.immediate) {
            callbacks.modify = this.measureImmediate;
        }
        this.callbacks = OpenLayers.Util.extend(callbacks, this.callbacks);
        /// no clicked
        this.clicked = false;
        //measure layer style
        this.measureStyles = new OpenLayers.StyleMap({
            "default": new OpenLayers.Style({
                pointRadius: "${type}", // sized according to type attribute
                fillColor: "#CAFF70",
                fillOpacity: 0.3,
                strokeColor: "#ff9933",
                strokeWidth: 2,
                graphicZIndex: 1
            })
        });

        // style the sketch fancy
        var sketchSymbolizers = {
            "Point": {
                pointRadius: 4,
                graphicName: "square",
                fillColor: "#556B2F",
                fillOpacity: 0.5,
                strokeWidth: 1,
                strokeOpacity: 1,
                strokeColor: "#333333"
            },
            "Line": {
                strokeWidth: 3,
                strokeOpacity: 1,
                strokeColor: "#8B814C",
                strokeDashstyle: "dash"
            },
            "Polygon": {
                strokeWidth: 2,
                strokeOpacity: 1,
                strokeColor: "#666666",
                fillColor: "white",
                fillOpacity: 0.3,
                strokeDashstyle: "dash"
            }
        };
        this.style = new OpenLayers.Style();
        this.style.addRules([
                new OpenLayers.Rule({ symbolizer: sketchSymbolizers })
            ]);
        var styleMap = new OpenLayers.StyleMap({ "default": this.style });
        // let the handler options override, so old code that passes 'persist' 
        // directly to the handler does not need an update
        this.handlerOptions = OpenLayers.Util.extend(
            { persist: this.persist, layerOptions: { styleMap: styleMap }
            }, this.handlerOptions
        );
        this.handler = new handler(this, this.callbacks, this.handlerOptions);

    },
    /**
    * APIMethod: activate
    */
    draw: function (px) {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        this.div.style.border = "solid red 1px";
        this.div.style.backgroundColor = "#E2ECFA";
        this.div.style.fontSize = "12";

        //when first click,we can draw it
        if (this.clicked) {
            if (this.handler.CLASS_NAME.indexOf('Path') > -1) {//measure length
                this.div.innerHTML = "";
                var element = document.createElement("div");
                //change units
                this.changeUnits();
                element.innerHTML = "总长: <b><font color='red'>" + this.stat[0].toFixed(2) + "</font></b>" + this.stat[1] + "<br>单击确定地点，双击结束";
                this.div.appendChild(element);
            } else { //measure area
                this.div.innerHTML = "";
                var element = document.createElement("div");
                //change units
                this.changeUnits();
                element.innerHTML = "当前面积: <b><font color='red'>" + this.stat[0].toFixed(2) + "</font></b>平方" + this.stat[1] + "<br>单击确定地点，双击结束";
                this.div.appendChild(element);
            }

        }
        if (!this.clicked) {
            //this.div.appendChild(document.createTextNode("单击确定起点"));
            this.div.appendChild(document.createTextNode(""));
            this.map.events.register('mouseover', this, this.showDiv);
            this.map.events.register('mouseout', this, this.hideDiv);
        }
        //first create measure layer
        if (!this.measureLayer) {
            this.measureLayer = new OpenLayers.Layer.Vector("measureLayer", {
                styleMap: this.measureStyles
            });
            this.map.addLayer(this.measureLayer);
        }
        //first create texts layer
        if (!this.texts) {
            this.texts = new Zondy.Texts("measureTexts");
            this.map.addLayer(this.texts);
            this.pointIndex = 0;
        }
        //first create close marker layer
        if (!this.closeMarkers) {
            this.closeMarkers = new OpenLayers.Layer.Markers("measureClose");
            this.map.addLayer(this.closeMarkers);
        }
        return this.div;
    },
    /** 
    * Method: showDiv
    *  show the div
    */
    showDiv: function (evt) {

        this.div.style.left = evt.xy.x + this.tolerance + "px";
        this.div.style.top = evt.xy.y + this.tolerance + "px";

        this.div.style.display = "";
    },
    /** 
    * Method: hideDiv
    *  hide the div
    *
    */
    hideDiv: function () {
        //Hide div
        this.div.style.display = "none";
    },
    /** 
    * Method: changeDiv
    *  change the div
    *
    */
    changeDivContent: function () {
        this.clicked = true;
        this.div.innerHTML = "";
        this.draw();
        this.div.style.display = "";
    },
    /**
    * APIMethod: activate
    */
    activate: function () {
        return OpenLayers.Control.prototype.activate.apply(this, arguments);
    },

    /**
    * APIMethod: deactivate
    */
    deactivate: function () {
        this.cancelDelay();
        return OpenLayers.Control.prototype.deactivate.apply(this, arguments);
    },

    /**
    * APIMethod: cancel
    * Stop the control from measuring.  If <persist> is true, the temporary
    *     sketch will be erased.
    */
    cancel: function () {
        this.cancelDelay();
        this.handler.cancel();
    },

    /**
    * APIMethod: setImmediate
    * Sets the <immediate> property. Changes the activity of immediate
    * measurement.
    */
    setImmediate: function (immediate) {
        this.immediate = immediate;
        if (this.immediate) {
            this.callbacks.modify = this.measureImmediate;
        } else {
            delete this.callbacks.modify;
        }
    },
    /**
    * APIMethod: changeUnits
    * change units
    */
    changeUnits: function () {
        //change units
        if (this.stat) {
            if (this.stat[1] == "km") {
                this.stat[1] = "千米";
            } else if (this.stat[1] == "m") {
                this.stat[1] = "米";
            }
        }
    },
    /**
    * Method: updateHandler
    *
    * Parameters:
    * handler - {Function} One of the sketch handler constructors.
    * options - {Object} Options for the handler.
    */
    updateHandler: function (handler, options) {
        var active = this.active;
        if (active) {
            this.deactivate();
        }
        this.handler = new handler(this, this.callbacks, options);
        if (active) {
            this.activate();
        }
    },

    /**
    * Method: measureComplete
    * Called when the measurement sketch is done.
    *
    * Parameters:
    * geometry - {<OpenLayers.Geometry>}
    */
    measureComplete: function (geometry) {
        this.cancelDelay();
        this.measure(geometry);
        var geoObj = geometry.components;
        //change units
        this.changeUnits();
        var feature = new OpenLayers.Feature.Vector(geometry);
        this.measureLayer.addFeatures([feature]);

        if (geometry.CLASS_NAME.indexOf('LineString') > -1) {
            this.lonLat = new OpenLayers.LonLat(geoObj[this.pointIndex - 1].x, geoObj[this.pointIndex - 1].y);
            //add text
            var content = "总长: <b><font color='red'>" + this.stat[0].toFixed(2) + "</font></b>" + this.stat[1];
            var text = new Zondy.Marker.Text(this.lonLat, content, new OpenLayers.Size(200, 20));
            this.texts.addMarker(text);

        } else {
            var geoPoly = geoObj[0].components;
            this.lonLat = new OpenLayers.LonLat(geoPoly[this.pointIndex - 1].x, geoPoly[this.pointIndex - 1].y);
            //add text
            var content = "总面积: <b><font color='red'>" + this.stat[0].toFixed(2) + "</font></b>平方" + this.stat[1];
            var text = new Zondy.Marker.Text(this.lonLat, content, new OpenLayers.Size(300, 20));
            this.texts.addMarker(text);
        }
        //add close marker
        var imageLoaction = OpenLayers.Util.getImagesLocation();
        var close = new OpenLayers.Marker(this.lonLat, new OpenLayers.Icon(imageLoaction + "measureclose.gif", new OpenLayers.Size(15, 15)));
        close.events.register('click', this, function () {
            this.measureLayer.removeFeatures([feature]);
            this.closeMarkers.clearMarkers();
            this.texts.clearMarkers();
            this.map.removeLayer(this.measureLayer);
            this.map.removeLayer(this.closeMarkers);
            this.map.removeLayer(this.texts);
        });
        close.events.register('mouseover', this, function () {
            close.icon.imageDiv.style.cursor = "pointer";
            close.icon.imageDiv.title = "清除本次测量";
        });
        this.closeMarkers.addMarker(close);

        //Complete
        this.map.events.unregister('mouseover', this, this.showDiv);
        this.map.events.unregister('mouseout', this, this.hideDiv);
        this.div.innerHTML = "";
        this.hideDiv();
        this.deactivate();
    },

    /**
    * Method: measurePartial
    * Called each time a new point is added to the measurement sketch.
    *
    * Parameters:
    * point - {<OpenLayers.Geometry.Point>} The last point added.
    * geometry - {<OpenLayers.Geometry>} The sketch geometry.
    */
    measurePartial: function (point, geometry) {
        this.cancelDelay();
        geometry = geometry.clone();

        // when we're wating for a dblclick, we have to trigger measurepartial
        // after some delay to deal with reflow issues in IE
        if (this.handler.freehandMode(this.handler.evt)) {
            // no dblclick in freehand mode
            this.measure(geometry);
            if (geometry.CLASS_NAME.indexOf('LineString') > -1) {//measure length
                var geoObj = geometry.components;
                //change units
                this.changeUnits();
                if (this.pointIndex == 0) {
                    var lonLat = new OpenLayers.LonLat(geoObj[0].x, geoObj[0].y);
                    var text = new Zondy.Marker.Text(lonLat, "<b><font color='#5E5E5E'>起点", new OpenLayers.Size(50, 20));
                    this.texts.addMarker(text);
                    this.pointIndex++;
                } else {
                    var lonLat = new OpenLayers.LonLat(geoObj[this.pointIndex].x, geoObj[this.pointIndex].y);
                    var content = "<b><font color='red'>" + this.stat[0].toFixed(2) + "</font></b>" + this.stat[1];
                    var text = new Zondy.Marker.Text(lonLat, content, new OpenLayers.Size(80, 20));
                    this.texts.addMarker(text);
                    this.pointIndex++;
                }
            } else {//measure area
                this.pointIndex++;
            }

        } else {
            this.delayedTrigger = window.setTimeout(
                OpenLayers.Function.bind(function () {
                    this.delayedTrigger = null;
                    this.measure(geometry);
                    var geoObj = geometry.components;
                    //change units
                    this.changeUnits();
                    if (geometry.CLASS_NAME.indexOf('LineString') > -1) {//measure length

                        if (this.pointIndex == 0) {
                            var lonLat = new OpenLayers.LonLat(geoObj[0].x, geoObj[0].y);
                            var text = new Zondy.Marker.Text(lonLat, "<b><font color='#5E5E5E'>起点", new OpenLayers.Size(50, 20));
                            this.texts.addMarker(text);
                            this.pointIndex++;
                        } else {
                            var lonLat = new OpenLayers.LonLat(geoObj[this.pointIndex].x, geoObj[this.pointIndex].y);
                            var content = "<b><font color='red'>" + this.stat[0].toFixed(2) + "</font></b><font color='#5E5E5E'>" + this.stat[1] + "</font>";
                            var text = new Zondy.Marker.Text(lonLat, content, new OpenLayers.Size(80, 20));
                            this.texts.addMarker(text);
                            this.pointIndex++;
                        }
                    } else {//measure area
                        this.pointIndex++;
                    }

                }, this),
                this.partialDelay
            );
        }
    },

    /**
    * Method: measureImmediate
    * Called each time the measurement sketch is modified.
    * 
    * Parameters: point - {<OpenLayers.Geometry.Point>} The point at the
    * mouseposition. feature - {<OpenLayers.Feature.Vector>} The sketch feature.
    */
    measureImmediate: function (point, feature, drawing) {
        if (drawing && this.delayedTrigger === null &&
                                !this.handler.freehandMode(this.handler.evt)) {
            this.measure(feature.geometry);
            //change main div
            this.changeDivContent();
        }
    },

    /**
    * Method: cancelDelay
    * Cancels the delay measurement that measurePartial began.
    */
    cancelDelay: function () {
        if (this.delayedTrigger !== null) {
            window.clearTimeout(this.delayedTrigger);
            this.delayedTrigger = null;
        }
    },

    /**
    * Method: measure
    *
    * Parameters:
    * geometry - {<OpenLayers.Geometry>}
    * eventType - {String}
    */
    measure: function (geometry) {
        var order;
        if (geometry.CLASS_NAME.indexOf('LineString') > -1) {
            this.stat = this.getBestLength(geometry);
            this.order = 1; //测量距离
        } else {
            this.stat = this.getBestArea(geometry);
            this.order = 2; //测量面积
        }
    },

    /**
    * Method: getBestArea
    * Based on the <displaySystem> returns the area of a geometry.
    *
    * Parameters:
    * geometry - {<OpenLayers.Geometry>}
    *
    * Returns:
    * {Array([Float, String])}  Returns a two item array containing the
    *     area and the units abbreviation.
    */
    getBestArea: function (geometry) {
        var units = this.displaySystemUnits[this.displaySystem];
        var unit, area;
        for (var i = 0, len = units.length; i < len; ++i) {
            unit = units[i];
            area = this.getArea(geometry, unit);
            if (area > 1) {
                break;
            }
        }
        return [area, unit];
    },

    /**
    * Method: getArea
    *
    * Parameters:
    * geometry - {<OpenLayers.Geometry>}
    * units - {String} Unit abbreviation
    *
    * Returns:
    * {Float} The geometry area in the given units.
    */
    getArea: function (geometry, units) {
        var area, geomUnits;
        if (this.geodesic) {
            area = geometry.getGeodesicArea(this.map.getProjectionObject());
            geomUnits = "m";
        } else {
            area = geometry.getArea();
            geomUnits = this.map.getUnits();
        }
        var inPerDisplayUnit = OpenLayers.INCHES_PER_UNIT[units];
        if (inPerDisplayUnit) {
            var inPerMapUnit = OpenLayers.INCHES_PER_UNIT[geomUnits];
            area *= Math.pow((inPerMapUnit / inPerDisplayUnit), 2);
        }
        return area;
    },

    /**
    * Method: getBestLength
    * Based on the <displaySystem> returns the length of a geometry.
    *
    * Parameters:
    * geometry - {<OpenLayers.Geometry>}
    *
    * Returns:
    * {Array([Float, String])}  Returns a two item array containing the
    *     length and the units abbreviation.
    */
    getBestLength: function (geometry) {
        var units = this.displaySystemUnits[this.displaySystem];
        var unit, length;
        for (var i = 0, len = units.length; i < len; ++i) {
            unit = units[i];
            length = this.getLength(geometry, unit);
            if (length > 1) {
                break;
            }
        }
        return [length, unit];
    },

    /**
    * Method: getLength
    *
    * Parameters:
    * geometry - {<OpenLayers.Geometry>}
    * units - {String} Unit abbreviation
    *
    * Returns:
    * {Float} The geometry length in the given units.
    */
    getLength: function (geometry, units) {
        var length, geomUnits;
        if (this.geodesic) {
            length = geometry.getGeodesicLength(this.map.getProjectionObject());
            geomUnits = "m";
        } else {
            length = geometry.getLength();
            geomUnits = this.map.getUnits();
        }
        var inPerDisplayUnit = OpenLayers.INCHES_PER_UNIT[units];
        if (inPerDisplayUnit) {
            var inPerMapUnit = OpenLayers.INCHES_PER_UNIT[geomUnits];
            length *= (inPerMapUnit / inPerDisplayUnit);
        }
        return length;
    },

    CLASS_NAME: "Zondy.Control.Measure"
});

/*---------------------------------------------------------右键控件---------------------------------------------------------*/

/**
* initialize BROWSER_EVENTS
*/
OpenLayers.Events.prototype.BROWSER_EVENTS = ["mouseover", "mouseout",
                       "mousedown", "mouseup", "mousemove",
                       "click", "dblclick", "resize", "focus", "blur", "contextmenu"];
/**
* Class: OpenLayers.Control.RightClickMenu
*
* Inerits from:
*  - <OpenLayers.Control>
*/
Zondy.Control.RightClickMenu = OpenLayers.Class(OpenLayers.Control, {

    /**
    * Property: element
    * {Element}
    */
    element: null,
    /** 
    * Property: zoomBox
    * {<OpenLayers.Control.ZoomBox>}
    */
    zoomBox: null,
    /** 
    * Property: boxes
    * {<OpenLayers.Layer.Boxes>}
    */
    boxes: null,
    /** 
    * Property: pointIndex
    * {<int>}
    */
    pointIndex: 0,
    /** 
    * Property: dragPan
    * {<OpenLayers.Control.DragPan>}
    */
    dragPan: null,

    /**
    * APIProperty: measureResult
    * {String} measure result
    */
    measureResult: "",
    /**
    * Constructor: Zondy.Control.RightClickMenu
    * Create a new RightClickMenu instance.
    *
    * Parameters: 
    * options - {Object} Optional object whose properties will be set on this
    *     object.
    */
    initialize: function (options) {

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        //create div
        this.element = document.createElement("div");
        this.element.style.backgroundColor = "#E2ECFA";

    },
    /**
    * Method: draw
    */
    draw: function (px) {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        //cancel the right click of brower
        this.map.div.oncontextmenu = function () { return false; };

        this.div.style.border = "solid blue 1px";
        //create menu
        this.noContextMenu();
        this.map.events.register('contextmenu', this, this.showDiv);
        this.map.events.register('click', this, this.hideDiv);

        this.activate();

        return this.div;
    },

    /**
    * Method: noContextMenu
    */
    noContextMenu: function () {
        var imgLocation = OpenLayers.Util.getImagesLocation();
        //define method
        var rightMenu = this;
        function doFunc(index) {
            rightMenu.doFunction(index);
        };

        //right menu options
        //var menuOptionsArr = ["放大", "缩小", "移动", "复位", "刷新", "鹰眼", "放大镜", "测距", "测面积"];
        var menuOptionsArr = ["放大", "缩小", "移动", "复位", "刷新",  "测距", "测面积"];
        //create table
        var rightTable = document.createElement("table");
        rightTable.border = "0px";

        var row, subcell0, subcell1;
        for (var i = 0; i < menuOptionsArr.length; i++) {

            row = rightTable.insertRow(i);
            //change style
            row.onmouseover = function () {
                this.style.cursor = "hand";
                this.style.backgroundColor = "#3370CC";
            };
            row.onmouseout = function () {
                this.style.cursor = "default";
                this.style.backgroundColor = "transparent";
            };
            row.onclick = function (rightMenu) {
                doFunc(this.rowIndex);
            };

            subcell0 = row.insertCell(0);
            subcell0.style.width = "30%";
            subcell0.style.backgroundColor = "#00CCFF";
            subcell0.appendChild(OpenLayers.Util.createImage(null, null, OpenLayers.Size(10, 10),
                                                           imgLocation + "rmenu" + (i + 1) + ".gif", null, null, null, null));
            subcell1 = row.insertCell(1);
            subcell1.style.width = "70%";
            subcell1.style.fontSize = "12";
            subcell1.appendChild(document.createTextNode(menuOptionsArr[i]));
        }
        this.element.appendChild(rightTable);
        this.div.appendChild(this.element);
        //Hide div
        this.hideDiv();
    },

    /** 
    * Method: doFunction
    *
    */
    doFunction: function (index) {

        switch (index) {
            case 0:
                //放大
                this.zoomIn();
                this.hideDiv();
                break;
            case 1:
                //缩小
                this.zoomOut();
                this.hideDiv();
                break;
            case 2:
                //移动
                this.move();
                this.hideDiv();
                break;
            case 3:
                //复位
                this.reset();
                this.hideDiv();
                break;
            case 4:
                //刷新
                this.refresh();
                this.hideDiv();
                break;
//            case 5:
//                //鹰眼
//                this.overviewMap();
//                this.hideDiv();
//                break;
//            case 6:
//                //放大镜
//                this.magnifier();
//                this.hideDiv();
//                break;
            case 5:
                //测距
                this.measureDistance();
                this.hideDiv();
                break;
            case 6:
                //测面积
                this.measureArea();
                this.hideDiv();
                break;
        }


    },
    /** 
    * Method: showDiv
    *  show the control
    *
    */
    showDiv: function (evt) {
        this.div.style.left = evt.xy.x + "px";
        this.div.style.top = evt.xy.y + "px";

        this.div.style.display = "";
    },
    /** 
    * Method: hideDiv
    *  hide the control
    *
    */
    hideDiv: function () {
        //Hide div
        this.div.style.display = "none";
    },
    /**
    * APIMethod: zoom
    * 放大
    */
    zoomIn: function () {
        this.zoomBox = new OpenLayers.Control.ZoomBox(
                    { map: this.map });
        this.zoomBox.draw();
        this.zoomBox.activate();
    },
    /**
    * APIMethod: zoom
    * 缩小
    */
    zoomOut: function () {
        this.zoomBox = new OpenLayers.Control.ZoomBox(
                    { map: this.map, out: true });
        this.zoomBox.draw();
        this.zoomBox.activate();
    },
    /**
    * APIMethod: move
    * 移动
    */
    move: function () {
        this.dragPan = new OpenLayers.Control.DragPan(
            OpenLayers.Util.extend({ map: this.map }, null)
        );
        this.dragPan.draw();
        this.dragPan.activate();
    },
    /**
    * APIMethod: reset
    *复位
    */
    reset: function () {
        this.map.zoomToMaxExtent();
    },
    /**
    * APIMethod: refresh
    *刷新
    */
    refresh: function () {
        this.map.baseLayer.clearGrid();
        this.map.baseLayer.redraw();
    },
    /**
    * APIMethod: overviewMap
    *鹰眼
    */
    overviewMap: function () {
        var overviewArr = this.map.getControlsByClass("Zondy.Control.OverviewMap");
        if (overviewArr) {
            if (overviewArr.length > 0) {
                for (var i = 0; i < overviewArr.length; i++) {
                    map.removeControl(overviewArr[i]);
                }
            }
        }
        var overview = new Zondy.Control.OverviewMap();
        this.map.addControl(overview);
        overview.activate();
        overview.maximizeControl();
    },
    /**
    * APIMethod: overviewMap
    *放大镜
    */
    magnifier: function () {
        var magnifyArr = this.map.getControlsByClass("Zondy.Control.Magnifier");
        if (magnifyArr) {
            if (magnifyArr.length > 0) {
                for (var i = 0; i < magnifyArr.length; i++) {
                    map.removeControl(magnifyArr[i]);
                }
            }
        }
        var magnify = new Zondy.Control.Magnifier({ maxExtent: new OpenLayers.Bounds(114.125602, 30.453932, 114.500707, 30.829037), maxResolution: 0.00146525390625 });
        this.map.addControl(magnify);
       
    },

    /**
    * APIMethod: measureDistance
    *测距
    */
    measureDistance: function () {
        var measureArr = this.map.getControlsByClass("Zondy.Control.Measure");
        if (measureArr) {
            if (measureArr.length > 0) {
                for (var i = 0; i < measureArr.length; i++) {
                    map.removeControl(measureArr[i]);
                }
            }
        }
        this.measure = new Zondy.Control.Measure(
                               OpenLayers.Handler.Path);
        this.map.addControl(this.measure);
        this.measure.activate();
       
    },
    /**
    * APIMethod: measureArea
    *测面积
    */
    measureArea: function () {
        var measureArr = this.map.getControlsByClass("Zondy.Control.Measure");
        if (measureArr) {
            if (measureArr.length > 0) {
                for (var i = 0; i < measureArr.length; i++) {
                    map.removeControl(measureArr[i]);
                }
            }
        }
        this.measure = new Zondy.Control.Measure(
                               OpenLayers.Handler.Polygon);
        this.map.addControl(this.measure);
        this.measure.activate();
      
    },
   

    /**
    * APIMethod: destroy
    * Destroy the control.
    */
    destroy: function () {

        this.div.innerHTML = "";
        OpenLayers.Control.prototype.destroy.apply(this);
    },


    CLASS_NAME: "Zondy.Control.RightClickMenu"
});

/*---------------------------------------------------------鹰眼控件---------------------------------------------------------*/

/**
* Class: Zondy.Control.OverviewMap
* The OverMap control creates a small overview map, useful to display the 
* extent of a zoomed map and your main map and provide additional 
* navigation options to the User.  By default the overview map is drawn in
* the lower right corner of the main map. Create a new overview map with the
* <Zondy.Control.OverviewMap> constructor.
*
* Inerits from:
*  - <OpenLayers.Control>
*/
Zondy.Control.OverviewMap = OpenLayers.Class(OpenLayers.Control, {

    /**
    * Property: element
    * {DOMElement} The DOM element that contains the overview map
    */
    element: null,

    /**
    * APIProperty: ovmap
    * {<OpenLayers.Map>} A reference to the overview map itself.
    */
    ovmap: null,

    /**
    * APIProperty: size
    * {<OpenLayers.Size>} The overvew map size in pixels.  Note that this is
    * the size of the map itself - the element that contains the map (default
    * class name olControlOverviewMapElement) may have padding or other style
    * attributes added via CSS.
    */
    size: new OpenLayers.Size(140, 130),

    /**
    * APIProperty: layers
    * {Array(<OpenLayers.Layer>)} Ordered list of layers in the overview map.
    * If none are sent at construction, the base layer for the main map is used.
    */
    layers: null,

    /**
    * APIProperty: minRectSize
    * {Integer} The minimum width or height (in pixels) of the extent
    *     rectangle on the overview map.  When the extent rectangle reaches
    *     this size, it will be replaced depending on the value of the
    *     <minRectDisplayClass> property.  Default is 15 pixels.
    */
    minRectSize: 15,

    /**
    * APIProperty: minRectDisplayClass
    * {String} Replacement style class name for the extent rectangle when
    *     <minRectSize> is reached.  This string will be suffixed on to the
    *     displayClass.  Default is "RectReplacement".
    *
    * Example CSS declaration:
    * (code)
    * .olControlOverviewMapRectReplacement {
    *     overflow: hidden;
    *     cursor: move;
    *     background-image: url("img/overview_replacement.gif");
    *     background-repeat: no-repeat;
    *     background-position: center;
    * }
    * (end)
    */
    minRectDisplayClass: "RectReplacement",

    /**
    * APIProperty: minRatio
    * {Float} The ratio of the overview map resolution to the main map
    *     resolution at which to zoom farther out on the overview map.
    */
    minRatio: 8,

    /**
    * APIProperty: maxRatio
    * {Float} The ratio of the overview map resolution to the main map
    *     resolution at which to zoom farther in on the overview map.
    */
    maxRatio: 32,

    /**
    * APIProperty: mapOptions
    * {Object} An object containing any non-default properties to be sent to
    *     the overview map's map constructor.  These should include any
    *     non-default options that the main map was constructed with.
    */
    mapOptions: null,

    /**
    * APIProperty: autoPan
    * {Boolean} Always pan the overview map, so the extent marker remains in
    *     the center.  Default is false.  If true, when you drag the extent
    *     marker, the overview map will update itself so the marker returns
    *     to the center.
    */
    autoPan: false,

    /**
    * Property: handlers
    * {Object}
    */
    handlers: null,

    /**
    * Property: resolutionFactor
    * {Object}
    */
    resolutionFactor: 1,

    /**
    * APIProperty: maximized
    * {Boolean} Start as maximized (visible). Defaults to false.
    */
    maximized: false,

    /**
    * Constructor: Zondy.Control.OverviewMap
    * Create a new overview map
    *
    * Parameters:
    * object - {Object} Properties of this object will be set on the overview
    * map object.  Note, to set options on the map object contained in this
    * control, set <mapOptions> as one of the options properties.
    */
    initialize: function (options) {
        this.layers = [];
        this.handlers = {};
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },

    /**
    * APIMethod: destroy
    * Deconstruct the control
    */
    destroy: function () {
        if (!this.mapDiv) { // we've already been destroyed
            return;
        }
        if (this.handlers.click) {
            this.handlers.click.destroy();
        }
        if (this.handlers.drag) {
            this.handlers.drag.destroy();
        }

        this.ovmap && this.ovmap.eventsDiv.removeChild(this.extentRectangle);
        this.extentRectangle = null;

        if (this.rectEvents) {
            this.rectEvents.destroy();
            this.rectEvents = null;
        }

        if (this.ovmap) {
            this.ovmap.destroy();
            this.ovmap = null;
        }

        this.element.removeChild(this.mapDiv);
        this.mapDiv = null;

        this.div.removeChild(this.element);
        this.element = null;

        if (this.maximizeDiv) {
            OpenLayers.Event.stopObservingElement(this.maximizeDiv);
            this.div.removeChild(this.maximizeDiv);
            this.maximizeDiv = null;
        }

        if (this.minimizeDiv) {
            OpenLayers.Event.stopObservingElement(this.minimizeDiv);
            this.div.removeChild(this.minimizeDiv);
            this.minimizeDiv = null;
        }

        this.map.events.un({
            "moveend": this.update,
            "changebaselayer": this.baseLayerDraw,
            scope: this
        });

        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

    /**
    * Method: draw
    * Render the control in the browser.
    */
    draw: function () {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        if (!(this.layers.length > 0)) {
            if (this.map.baseLayer) {
                var layer = this.map.baseLayer.clone();
                this.layers = [layer];
            } else {
                this.map.events.register("changebaselayer", this, this.baseLayerDraw);
                return this.div;
            }
        }

        // create overview map DOM elements
        this.element = document.createElement('div');
        this.element.className = this.displayClass + 'Element';
        this.element.style.display = 'none';

        this.mapDiv = document.createElement('div');
        this.mapDiv.style.width = this.size.w + 'px';
        this.mapDiv.style.height = this.size.h + 'px';
        this.mapDiv.style.position = 'relative';
        this.mapDiv.style.overflow = 'hidden';
        this.mapDiv.id = OpenLayers.Util.createUniqueID('overviewMap');

        this.extentRectangle = document.createElement('div');
        this.extentRectangle.style.position = 'absolute';
        this.extentRectangle.style.zIndex = 1000;  //HACK
        this.extentRectangle.className = this.displayClass + 'ExtentRectangle';

        this.element.appendChild(this.mapDiv);

        this.div.appendChild(this.element);

        // Optionally add min/max buttons if the control will go in the
        // map viewport.
        if (!this.outsideViewport) {
            this.div.className += " " + this.displayClass + 'Container';
            var imgLocation = OpenLayers.Util.getImagesLocation();
            // maximize button div
            var img = imgLocation + 'h_arrow.gif';
            this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                        this.displayClass + 'MaximizeButton',
                                        null,
                                        new OpenLayers.Size(15, 15),
                                        img,
                                        'absolute');
            this.maximizeDiv.style.display = 'none';
            this.maximizeDiv.className = this.displayClass + 'MaximizeButton';
            OpenLayers.Event.observe(this.maximizeDiv, 'click',
                OpenLayers.Function.bindAsEventListener(this.maximizeControl,
                                                        this)
            );
            this.div.appendChild(this.maximizeDiv);

            // minimize button div
            var img = imgLocation + 'd_arrow.gif';
            this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                        'OpenLayers_Control_minimizeDiv',
                                        null,
                                        new OpenLayers.Size(15, 15),
                                        img,
                                        'absolute');
            this.minimizeDiv.style.display = 'none';
            this.minimizeDiv.className = this.displayClass + 'MinimizeButton';
            OpenLayers.Event.observe(this.minimizeDiv, 'click',
                OpenLayers.Function.bindAsEventListener(this.minimizeControl,
                                                        this)
            );
            this.div.appendChild(this.minimizeDiv);

            var eventsToStop = ['dblclick', 'mousedown'];

            for (var i = 0, len = eventsToStop.length; i < len; i++) {

                OpenLayers.Event.observe(this.maximizeDiv,
                                         eventsToStop[i],
                                         OpenLayers.Event.stop);

                OpenLayers.Event.observe(this.minimizeDiv,
                                         eventsToStop[i],
                                         OpenLayers.Event.stop);
            }
            //初始化为最小化
            this.minimizeControl();
        } else {
            // show the overview map
            this.element.style.display = '';
        }
        if (this.map.getExtent()) {
            this.update();
        }

        this.map.events.register('moveend', this, this.update);

        if (this.maximized) {
            this.maximizeControl();
        }
        return this.div;
    },

    /**
    * Method: baseLayerDraw
    * Draw the base layer - called if unable to complete in the initial draw
    */
    baseLayerDraw: function () {
        this.draw();
        this.map.events.unregister("changebaselayer", this, this.baseLayerDraw);
    },

    /**
    * Method: rectDrag
    * Handle extent rectangle drag
    *
    * Parameters:
    * px - {<OpenLayers.Pixel>} The pixel location of the drag.
    */
    rectDrag: function (px) {
        var deltaX = this.handlers.drag.last.x - px.x;
        var deltaY = this.handlers.drag.last.y - px.y;
        if (deltaX != 0 || deltaY != 0) {
            var rectTop = this.rectPxBounds.top;
            var rectLeft = this.rectPxBounds.left;
            var rectHeight = Math.abs(this.rectPxBounds.getHeight());
            var rectWidth = this.rectPxBounds.getWidth();
            // don't allow dragging off of parent element
            var newTop = Math.max(0, (rectTop - deltaY));
            newTop = Math.min(newTop,
                              this.ovmap.size.h - this.hComp - rectHeight);
            var newLeft = Math.max(0, (rectLeft - deltaX));
            newLeft = Math.min(newLeft,
                               this.ovmap.size.w - this.wComp - rectWidth);
            this.setRectPxBounds(new OpenLayers.Bounds(newLeft,
                                                       newTop + rectHeight,
                                                       newLeft + rectWidth,
                                                       newTop));
        }
    },

    /**
    * Method: mapDivClick
    * Handle browser events
    *
    * Parameters:
    * evt - {<OpenLayers.Event>} evt
    */
    mapDivClick: function (evt) {
        var pxCenter = this.rectPxBounds.getCenterPixel();
        var deltaX = evt.xy.x - pxCenter.x;
        var deltaY = evt.xy.y - pxCenter.y;
        var top = this.rectPxBounds.top;
        var left = this.rectPxBounds.left;
        var height = Math.abs(this.rectPxBounds.getHeight());
        var width = this.rectPxBounds.getWidth();
        var newTop = Math.max(0, (top + deltaY));
        newTop = Math.min(newTop, this.ovmap.size.h - height);
        var newLeft = Math.max(0, (left + deltaX));
        newLeft = Math.min(newLeft, this.ovmap.size.w - width);
        this.setRectPxBounds(new OpenLayers.Bounds(newLeft,
                                                   newTop + height,
                                                   newLeft + width,
                                                   newTop));
        this.updateMapToRect();
    },

    /**
    * Method: maximizeControl
    * Unhide the control.  Called when the control is in the map viewport.
    *
    * Parameters:
    * e - {<OpenLayers.Event>}
    */
    maximizeControl: function (e) {
        var overview = this;
        var pntTime;
        this.element.style.display = '';
        this.element.style.height = 0 + "px";
        this.element.style.width = 0 + "px";
        function change() {
            if (parseInt(overview.element.style.height) < overview.size.h && parseInt(overview.element.style.width) < overview.size.w) {
                overview.element.style.width = (parseInt(overview.element.style.width) + overview.size.w / 10) + "px";
                overview.element.style.height = (parseInt(overview.element.style.height) + overview.size.h / 10) + "px";
                pntTime = setTimeout(change, 20);
            }
            else {
                overview.showToggle(false);
                clearTimeout(pntTime);
            }
        };
        change();
        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
    * Method: minimizeControl
    * Hide all the contents of the control, shrink the size, 
    * add the maximize icon
    * 
    * Parameters:
    * e - {<OpenLayers.Event>}
    */
    minimizeControl: function (e) {
        var overview = this;
        var pntTime;
        function change() {
            if (parseInt(overview.element.style.height) > 0 && parseInt(overview.element.style.width) > 0) {
                overview.element.style.width = (parseInt(overview.element.style.width) - overview.size.w / 10) + "px";
                overview.element.style.height = (parseInt(overview.element.style.height) - overview.size.h / 10) + "px";
                pntTime = setTimeout(change, 20);
            }
            else {
                overview.element.style.display = 'none';
                overview.showToggle(true);
                clearTimeout(pntTime);
            }
        };
        change();
        if (e != null) {
            OpenLayers.Event.stop(e);
        }
    },

    /**
    * Method: showToggle
    * Hide/Show the toggle depending on whether the control is minimized
    *
    * Parameters:
    * minimize - {Boolean} 
    */
    showToggle: function (minimize) {
        this.maximizeDiv.style.display = minimize ? '' : 'none';
        this.minimizeDiv.style.display = minimize ? 'none' : '';
    },

    /**
    * Method: update
    * Update the overview map after layers move.
    */
    update: function () {
        if (this.ovmap == null) {
            this.createMap();
        }

        if (this.autoPan || !this.isSuitableOverview()) {
            this.updateOverview();
        }

        // update extent rectangle
        this.updateRectToMap();
    },

    /**
    * Method: isSuitableOverview
    * Determines if the overview map is suitable given the extent and
    * resolution of the main map.
    */
    isSuitableOverview: function () {
        var mapExtent = this.map.getExtent();
        var maxExtent = this.map.maxExtent;
        var testExtent = new OpenLayers.Bounds(
                                Math.max(mapExtent.left, maxExtent.left),
                                Math.max(mapExtent.bottom, maxExtent.bottom),
                                Math.min(mapExtent.right, maxExtent.right),
                                Math.min(mapExtent.top, maxExtent.top));

        if (this.ovmap.getProjection() != this.map.getProjection()) {
            testExtent = testExtent.transform(
                this.map.getProjectionObject(),
                this.ovmap.getProjectionObject());
        }

        var resRatio = this.ovmap.getResolution() / this.map.getResolution();
        return ((resRatio > this.minRatio) &&
                (resRatio <= this.maxRatio) &&
                (this.ovmap.getExtent().containsBounds(testExtent)));
    },

    /**
    * Method updateOverview
    * Called by <update> if <isSuitableOverview> returns true
    */
    updateOverview: function () {
        var mapRes = this.map.getResolution();
        var targetRes = this.ovmap.getResolution();
        var resRatio = targetRes / mapRes;
        if (resRatio > this.maxRatio) {
            // zoom in overview map
            targetRes = this.minRatio * mapRes;
        } else if (resRatio <= this.minRatio) {
            // zoom out overview map
            targetRes = this.maxRatio * mapRes;
        }
        var center;
        if (this.ovmap.getProjection() != this.map.getProjection()) {
            center = this.map.center.clone();
            center.transform(this.map.getProjectionObject(),
                this.ovmap.getProjectionObject());
        } else {
            center = this.map.center;
        }
        this.ovmap.setCenter(center, this.ovmap.getZoomForResolution(
            targetRes * this.resolutionFactor));
        this.updateRectToMap();
    },

    /**
    * Method: createMap
    * Construct the map that this control contains
    */
    createMap: function () {
        // create the overview map
        var options = OpenLayers.Util.extend(
                        { controls: [], maxResolution: 'auto',
                            fallThrough: false
                        }, this.mapOptions);
        this.ovmap = new OpenLayers.Map(this.mapDiv, options);
        this.ovmap.eventsDiv.appendChild(this.extentRectangle);

        // prevent ovmap from being destroyed when the page unloads, because
        // the OverviewMap control has to do this (and does it).
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
    },

    /**
    * Method: updateRectToMap
    * Updates the extent rectangle position and size to match the map extent
    */
    updateRectToMap: function () {
        // If the projections differ we need to reproject
        var bounds;
        if (this.ovmap.getProjection() != this.map.getProjection()) {
            bounds = this.map.getExtent().transform(
                this.map.getProjectionObject(),
                this.ovmap.getProjectionObject());
        } else {
            bounds = this.map.getExtent();
        }
        var pxBounds = this.getRectBoundsFromMapBounds(bounds);
        if (pxBounds) {
            this.setRectPxBounds(pxBounds);
        }
    },

    /**
    * Method: updateMapToRect
    * Updates the map extent to match the extent rectangle position and size
    */
    updateMapToRect: function () {
        var lonLatBounds = this.getMapBoundsFromRectBounds(this.rectPxBounds);
        if (this.ovmap.getProjection() != this.map.getProjection()) {
            lonLatBounds = lonLatBounds.transform(
                this.ovmap.getProjectionObject(),
                this.map.getProjectionObject());
        }
        this.map.panTo(lonLatBounds.getCenterLonLat());
    },

    /**
    * Method: setRectPxBounds
    * Set extent rectangle pixel bounds.
    *
    * Parameters:
    * pxBounds - {<OpenLayers.Bounds>}
    */
    setRectPxBounds: function (pxBounds) {
        var top = Math.max(pxBounds.top, 0);
        var left = Math.max(pxBounds.left, 0);
        var bottom = Math.min(pxBounds.top + Math.abs(pxBounds.getHeight()),
                              this.ovmap.size.h - this.hComp);
        var right = Math.min(pxBounds.left + pxBounds.getWidth(),
                             this.ovmap.size.w - this.wComp);
        var width = Math.max(right - left, 0);
        var height = Math.max(bottom - top, 0);
        if (width < this.minRectSize || height < this.minRectSize) {
            this.extentRectangle.className = this.displayClass +
                                             this.minRectDisplayClass;
            var rLeft = left + (width / 2) - (this.minRectSize / 2);
            var rTop = top + (height / 2) - (this.minRectSize / 2);
            this.extentRectangle.style.top = Math.round(rTop) + 'px';
            this.extentRectangle.style.left = Math.round(rLeft) + 'px';
            this.extentRectangle.style.height = this.minRectSize + 'px';
            this.extentRectangle.style.width = this.minRectSize + 'px';
        } else {
            this.extentRectangle.className = this.displayClass +
                                             'ExtentRectangle';
            this.extentRectangle.style.top = Math.round(top) + 'px';
            this.extentRectangle.style.left = Math.round(left) + 'px';
            this.extentRectangle.style.height = Math.round(height) + 'px';
            this.extentRectangle.style.width = Math.round(width) + 'px';
        }
        this.rectPxBounds = new OpenLayers.Bounds(
            Math.round(left), Math.round(bottom),
            Math.round(right), Math.round(top)
        );
    },

    /**
    * Method: getRectBoundsFromMapBounds
    * Get the rect bounds from the map bounds.
    *
    * Parameters:
    * lonLatBounds - {<OpenLayers.Bounds>}
    *
    * Returns:
    * {<OpenLayers.Bounds>}A bounds which is the passed-in map lon/lat extent
    * translated into pixel bounds for the overview map
    */
    getRectBoundsFromMapBounds: function (lonLatBounds) {
        var leftBottomLonLat = new OpenLayers.LonLat(lonLatBounds.left,
                                                     lonLatBounds.bottom);
        var rightTopLonLat = new OpenLayers.LonLat(lonLatBounds.right,
                                                   lonLatBounds.top);
        var leftBottomPx = this.getOverviewPxFromLonLat(leftBottomLonLat);
        var rightTopPx = this.getOverviewPxFromLonLat(rightTopLonLat);
        var bounds = null;
        if (leftBottomPx && rightTopPx) {
            bounds = new OpenLayers.Bounds(leftBottomPx.x, leftBottomPx.y,
                                           rightTopPx.x, rightTopPx.y);
        }
        return bounds;
    },

    /**
    * Method: getMapBoundsFromRectBounds
    * Get the map bounds from the rect bounds.
    *
    * Parameters:
    * pxBounds - {<OpenLayers.Bounds>}
    *
    * Returns:
    * {<OpenLayers.Bounds>} Bounds which is the passed-in overview rect bounds
    * translated into lon/lat bounds for the overview map
    */
    getMapBoundsFromRectBounds: function (pxBounds) {
        var leftBottomPx = new OpenLayers.Pixel(pxBounds.left,
                                                pxBounds.bottom);
        var rightTopPx = new OpenLayers.Pixel(pxBounds.right,
                                              pxBounds.top);
        var leftBottomLonLat = this.getLonLatFromOverviewPx(leftBottomPx);
        var rightTopLonLat = this.getLonLatFromOverviewPx(rightTopPx);
        return new OpenLayers.Bounds(leftBottomLonLat.lon, leftBottomLonLat.lat,
                                     rightTopLonLat.lon, rightTopLonLat.lat);
    },

    /**
    * Method: getLonLatFromOverviewPx
    * Get a map location from a pixel location
    *
    * Parameters:
    * overviewMapPx - {<OpenLayers.Pixel>}
    *
    * Returns:
    * {<OpenLayers.LonLat>} Location which is the passed-in overview map
    * OpenLayers.Pixel, translated into lon/lat by the overview map
    */
    getLonLatFromOverviewPx: function (overviewMapPx) {
        var size = this.ovmap.size;
        var res = this.ovmap.getResolution();
        var center = this.ovmap.getExtent().getCenterLonLat();

        var delta_x = overviewMapPx.x - (size.w / 2);
        var delta_y = overviewMapPx.y - (size.h / 2);

        return new OpenLayers.LonLat(center.lon + delta_x * res,
                                     center.lat - delta_y * res);
    },

    /**
    * Method: getOverviewPxFromLonLat
    * Get a pixel location from a map location
    *
    * Parameters:
    * lonlat - {<OpenLayers.LonLat>}
    *
    * Returns:
    * {<OpenLayers.Pixel>} Location which is the passed-in OpenLayers.LonLat, 
    * translated into overview map pixels
    */
    getOverviewPxFromLonLat: function (lonlat) {
        var res = this.ovmap.getResolution();
        var extent = this.ovmap.getExtent();
        var px = null;
        if (extent) {
            px = new OpenLayers.Pixel(
                        Math.round(1 / res * (lonlat.lon - extent.left)),
                        Math.round(1 / res * (extent.top - lonlat.lat)));
        }
        return px;
    },

    CLASS_NAME: 'Zondy.Control.OverviewMap'
});

/*---------------------------------------------------------图层显示控件---------------------------------------------------------*/
/**
* Class: Zondy.Control.LayerSwitcher
* The LayerSwitcher control displays a table of contents for the map. This 
* allows the user interface to switch between BaseLasyers and to show or hide
* Overlays. By default the switcher is shown minimized on the right edge of 
* the map, the user may expand it by clicking on the handle.
*
* To create the LayerSwitcher outside of the map, pass the Id of a html div 
* as the first argument to the constructor.
* 
* Inherits from:
*  - <OpenLayers.Control>
*/
Zondy.Control.LayerSwitcher =
  OpenLayers.Class(OpenLayers.Control, {

      /**  
      * Property: layerStates 
      * {Array(Object)} Basically a copy of the "state" of the map's layers 
      *     the last time the control was drawn. We have this in order to avoid
      *     unnecessarily redrawing the control.
      */
      layerStates: null,

      /**
      * Property: layerSwitcherSize
      * {OpenLayers.Size}(展开后)
      */
      layerSwitcherSize: new OpenLayers.Size(180, 200),

      // DOM Elements

      /**
      * Property: layersDiv
      * {DOMElement} 
      */
      layersDiv: null,

      /** 
      * Property: baseLayersDiv
      * {DOMElement}
      */
      baseLayersDiv: null,

      /** 
      * Property: baseLayers
      * {Array(<OpenLayers.Layer>)}
      */
      baseLayers: null,


      /** 
      * Property: dataLbl
      * {DOMElement} 
      */
      dataLbl: null,

      /** 
      * Property: dataLayersDiv
      * {DOMElement} 
      */
      dataLayersDiv: null,

      /** 
      * Property: dataLayers
      * {Array(<OpenLayers.Layer>)} 
      */
      dataLayers: null,


      /** 
      * Property: minimizeDiv
      * {DOMElement} 
      */
      layerBtnDiv: null,

      /**
      * APIProperty: ascending
      * {Boolean} 
      */
      ascending: true,

      /**
      * Constructor: Zondy.Control.LayerSwitcher
      * 
      * Parameters:
      * options - {Object}
      */
      initialize: function (options) {
          this.layerStates = [];
          OpenLayers.Control.prototype.initialize.apply(this, [options]);

      },

      /**
      * APIMethod: destroy
      */
      destroy: function () {

          OpenLayers.Event.stopObservingElement(this.div);

          OpenLayers.Event.stopObservingElement(this.layerBtnDiv);

          //clear out layers info and unregister their events 
          this.clearLayersArray("base");
          this.clearLayersArray("data");

          this.map.events.un({
              "addlayer": this.redraw,
              "changelayer": this.redraw,
              "removelayer": this.redraw,
              "changebaselayer": this.redraw,
              scope: this
          });

          OpenLayers.Control.prototype.destroy.apply(this, arguments);
      },

      /** 
      * Method: setMap
      *
      * Properties:
      * map - {<OpenLayers.Map>} 
      */
      setMap: function (map) {
          OpenLayers.Control.prototype.setMap.apply(this, arguments);

          this.map.events.on({
              "addlayer": this.redraw,
              "changelayer": this.redraw,
              "removelayer": this.redraw,
              "changebaselayer": this.redraw,
              scope: this
          });
      },

      /**
      * Method: draw
      *
      * Returns:
      * {DOMElement} A reference to the DIV DOMElement containing the 
      *     switcher tabs.
      */
      draw: function () {
          OpenLayers.Control.prototype.draw.apply(this);

          // create layout divs
          this.loadContents();

          // set mode to minimize
          if (!this.outsideViewport) {
              this.showControls(false);
          }

          // populate div with current info
          this.redraw();

          return this.div;
      },

      /** 
      * Method: clearLayersArray
      * User specifies either "base" or "data". we then clear all the
      *     corresponding listeners, the div, and reinitialize a new array.
      * 
      * Parameters:
      * layersType - {String}  
      */
      clearLayersArray: function (layersType) {
          var layers = this[layersType + "Layers"];
          if (layers) {
              for (var i = 0, len = layers.length; i < len; i++) {
                  var layer = layers[i];
                  OpenLayers.Event.stopObservingElement(layer.inputElem);
                  OpenLayers.Event.stopObservingElement(layer.labelSpan);
              }
          }
          this[layersType + "LayersDiv"].innerHTML = "";
          this[layersType + "Layers"] = [];
      },


      /**
      * Method: checkRedraw
      * Checks if the layer state has changed since the last redraw() call.
      * 
      * Returns:
      * {Boolean} The layer state changed since the last redraw() call. 
      */
      checkRedraw: function () {
          var redraw = false;
          if (!this.layerStates.length ||
             (this.map.layers.length != this.layerStates.length)) {
              redraw = true;
          } else {
              for (var i = 0, len = this.layerStates.length; i < len; i++) {
                  var layerState = this.layerStates[i];
                  var layer = this.map.layers[i];
                  if ((layerState.name != layer.name) ||
                     (layerState.inRange != layer.inRange) ||
                     (layerState.id != layer.id) ||
                     (layerState.visibility != layer.visibility)) {
                      redraw = true;
                      break;
                  }
              }
          }
          return redraw;
      },

      /** 
      * Method: redraw
      * Goes through and takes the current state of the Map and rebuilds the
      *     control to display that state. Groups base layers into a 
      *     radio-button group and lists each data layer with a checkbox.
      *
      * Returns: 
      * {DOMElement} A reference to the DIV DOMElement containing the control
      */
      redraw: function () {
          //if the state hasn't changed since last redraw, no need 
          // to do anything. Just return the existing div.
          if (!this.checkRedraw()) {
              return this.div;
          }

          //clear out previous layers 
          this.clearLayersArray("base");
          this.clearLayersArray("data");

          var containsOverlays = false;
          var containsBaseLayers = false;

          // Save state -- for checking layer if the map state changed.
          // We save this before redrawing, because in the process of redrawing
          // we will trigger more visibility changes, and we want to not redraw
          // and enter an infinite loop.
          var len = this.map.layers.length;
          this.layerStates = new Array(len);
          for (var i = 0; i < len; i++) {
              var layer = this.map.layers[i];
              this.layerStates[i] = {
                  'name': layer.name,
                  'visibility': layer.visibility,
                  'inRange': layer.inRange,
                  'id': layer.id
              };
          }

          var layers = this.map.layers.slice();
          if (!this.ascending) { layers.reverse(); }
          for (var i = 0, len = layers.length; i < len; i++) {
              var layer = layers[i];
              var baseLayer = layer.isBaseLayer;

              if (layer.displayInLayerSwitcher) {

                  if (baseLayer) {
                      containsBaseLayers = true;
                  } else {
                      containsOverlays = true;
                  }

                  // only check a baselayer if it is *the* baselayer, check data
                  //  layers if they are visible
                  var checked = (baseLayer) ? (layer == this.map.baseLayer)
                                          : layer.getVisibility();

                  // create input element
                  var inputElem = document.createElement("input");
                  inputElem.id = this.id + "_input_" + layer.name;
                  inputElem.name = (baseLayer) ? this.id + "_baseLayers" : layer.name;
                  inputElem.type = (baseLayer) ? "radio" : "checkbox";
                  inputElem.value = layer.name;
                  inputElem.checked = checked;
                  inputElem.defaultChecked = checked;

                  if (!baseLayer && !layer.inRange) {
                      inputElem.disabled = true;
                  }
                  var context = {
                      'inputElem': inputElem,
                      'layer': layer,
                      'layerSwitcher': this
                  };
                  OpenLayers.Event.observe(inputElem, "mouseup",
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );

                  // create span
                  var labelSpan = document.createElement("span");
                  OpenLayers.Element.addClass(labelSpan, "labelSpan");
                  if (!baseLayer && !layer.inRange) {
                      labelSpan.style.color = "gray";
                  }
                  labelSpan.innerHTML = layer.name;
                  labelSpan.style.verticalAlign = (baseLayer) ? "bottom"
                                                            : "baseline";
                  OpenLayers.Event.observe(labelSpan, "click",
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );
                  // create line break
                  var br = document.createElement("br");


                  var groupArray = (baseLayer) ? this.baseLayers
                                             : this.dataLayers;
                  groupArray.push({
                      'layer': layer,
                      'inputElem': inputElem,
                      'labelSpan': labelSpan
                  });

                  var groupDiv = (baseLayer) ? this.baseLayersDiv
                                           : this.dataLayersDiv;
                  groupDiv.appendChild(inputElem);
                  groupDiv.appendChild(labelSpan);
                  groupDiv.appendChild(br);
              }
          }

          // if no overlays, dont display the overlay label
          this.dataLbl.style.display = (containsOverlays) ? "" : "none";

          // if no baselayers, dont display the baselayer label
          this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";

          return this.div;
      },

      /** 
      * Method:
      * A label has been clicked, check or uncheck its corresponding input
      * 
      * Parameters:
      * e - {Event} 
      *
      * Context:  
      *  - {DOMElement} inputElem
      *  - {<OpenLayers.Control.LayerSwitcher>} layerSwitcher
      *  - {<OpenLayers.Layer>} layer
      */

      onInputClick: function (e) {

          if (!this.inputElem.disabled) {
              if (this.inputElem.type == "radio") {
                  this.inputElem.checked = true;
                  this.layer.map.setBaseLayer(this.layer);
              } else {
                  this.inputElem.checked = !this.inputElem.checked;
                  this.layerSwitcher.updateMap();
              }
          }
          OpenLayers.Event.stop(e);
      },

      /**
      * Method: onLayerClick
      * Need to update the map accordingly whenever user clicks in either of
      *     the layers.
      * 
      * Parameters: 
      * e - {Event} 
      */
      onLayerClick: function (e) {
          this.updateMap();
      },


      /** 
      * Method: updateMap
      * Cycles through the loaded data and base layer input arrays and makes
      *     the necessary calls to the Map object such that that the map's 
      *     visual state corresponds to what the user has selected in 
      *     the control.
      */
      updateMap: function () {

          // set the newly selected base layer
          for (var i = 0, len = this.baseLayers.length; i < len; i++) {
              var layerEntry = this.baseLayers[i];
              if (layerEntry.inputElem.checked) {
                  this.map.setBaseLayer(layerEntry.layer, false);
              }
          }

          // set the correct visibilities for the overlays
          for (var i = 0, len = this.dataLayers.length; i < len; i++) {
              var layerEntry = this.dataLayers[i];
              layerEntry.layer.setVisibility(layerEntry.inputElem.checked);
          }

      },

      /** 
      * Method: maxOrminControl
      * Set up the labels and divs for the control
      * 
      * Parameters:
      * e - {Event} 
      */
      maxOrminControl: function (e) {

          var layerSwitcherDivView = this;
          var pntTime;
          this.layersDiv.style.display = "";
          //change span text
          if (this.layerBtnSpan.innerText == "展开") {

              this.layerBtnSpan.innerText = "收缩";
              function changeBig() {
                  if (parseInt(layerSwitcherDivView.div.style.height) < layerSwitcherDivView.layerSwitcherSize.h) {
                      layerSwitcherDivView.div.style.height = (parseInt(layerSwitcherDivView.div.style.height) + 20) + "px";
                      pntTime = setTimeout(changeBig, 1);
                  }
                  else {

                      clearTimeout(pntTime);
                  }
              };
              //change big
              changeBig();
          } else {
              this.layerBtnSpan.innerText = "展开";
              function changeSmall() {
                  if (parseInt(layerSwitcherDivView.div.style.height) > 20) {
                      layerSwitcherDivView.div.style.height = (parseInt(layerSwitcherDivView.div.style.height) - 20) + "px";
                      pntTime = setTimeout(changeSmall, 1);
                  }
                  else {

                      clearTimeout(pntTime);
                  }
              };
              //change small
              changeSmall();
          }
          if (e != null) {
              OpenLayers.Event.stop(e);
          }
      },

      /** 
      * Method: mouseoverlayerBtnSpan
      * Set up the labels and divs for the control
      * 
      * Parameters:
      * e - {Event} 
      */
      mouseoverlayerBtnSpan: function (e) {
          this.layerBtnSpan.style.color = "#A52A2A";

          if (e != null) {
              OpenLayers.Event.stop(e);
          }
      },
      /** 
      * Method: mouseoutlayerBtnSpan
      * Set up the labels and divs for the control
      * 
      * Parameters:
      * e - {Event} 
      */
      mouseoutlayerBtnSpan: function (e) {
          this.layerBtnSpan.style.color = "black";

          if (e != null) {
              OpenLayers.Event.stop(e);
          }
      },
      /**
      * Method: showControls
      * Hide/Show all LayerSwitcher controls depending on whether we are
      *     minimized or not
      * 
      * Parameters:
      * minimize - {Boolean}
      */
      showControls: function (minimize) {
          this.layersDiv.style.display = minimize ? "" : "none";
      },

      /** 
      * Method: loadContents
      * Set up the labels and divs for the control
      */
      loadContents: function () {

          //configure main div
          OpenLayers.Event.observe(this.div, "mouseup",
            OpenLayers.Function.bindAsEventListener(this.mouseUp, this));
          OpenLayers.Event.observe(this.div, "click",
                      this.ignoreEvent);
          OpenLayers.Event.observe(this.div, "mousedown",
            OpenLayers.Function.bindAsEventListener(this.mouseDown, this));
          OpenLayers.Event.observe(this.div, "dblclick", this.ignoreEvent);
          this.div.style.backgroundColor = "#E2ECFA";
          this.div.style.display = '';
          this.div.style.width = this.layerSwitcherSize.w + "px";
          this.div.style.height = 20 + "px";
          this.div.style.border = "4px #226DDD double";

          //create layerBtnDiv,always show
          this.layerBtnDiv = document.createElement("div");
          OpenLayers.Element.addClass(this.layerBtnDiv, "layerBtnDiv");
          this.layerBtnDiv.appendChild(document.createTextNode("图层列表"));
          this.div.appendChild(this.layerBtnDiv);

          //create line
          this.line = document.createElement("hr");
          this.line.style.width = "100%";
          this.line.style.position = 'absolute';
          this.line.style.top = 20 + "px";
          this.div.appendChild(this.line);
          //create span
          this.layerBtnSpan = document.createElement("span");
          OpenLayers.Element.addClass(this.layerBtnSpan, "layerBtnSpan");
          this.layerBtnSpan.title = "展开/收缩";
          this.layerBtnSpan.appendChild(document.createTextNode("展开"));

          OpenLayers.Event.observe(this.layerBtnSpan, "click",
            OpenLayers.Function.bindAsEventListener(this.maxOrminControl, this)
          );
          OpenLayers.Event.observe(this.layerBtnSpan, "mouseover",
            OpenLayers.Function.bindAsEventListener(this.mouseoverlayerBtnSpan, this)
          );
          OpenLayers.Event.observe(this.layerBtnSpan, "mouseout",
            OpenLayers.Function.bindAsEventListener(this.mouseoutlayerBtnSpan, this)
          );
          this.div.appendChild(this.layerBtnSpan);

          // layers list div 
          this.layersDiv = document.createElement("div");
          this.layersDiv.id = this.id + "_layersDiv";
          OpenLayers.Element.addClass(this.layersDiv, "layersDiv");
          this.layersDiv.style.height = (this.layerSwitcherSize.h - 30) + "px";
          this.layersDiv.style.width = this.layerSwitcherSize.w + "px";


          this.baseLbl = document.createElement("div");
          this.baseLbl.innerHTML = OpenLayers.i18n("基础图层");
          this.baseLbl.style.color = "#636363";
          OpenLayers.Element.addClass(this.baseLbl, "baseLbl");

          this.baseLayersDiv = document.createElement("div");
          OpenLayers.Element.addClass(this.baseLayersDiv, "baseLayersDiv");

          this.dataLbl = document.createElement("div");
          this.dataLbl.style.color = "#636363";
          this.dataLbl.innerHTML = OpenLayers.i18n("覆盖层");
          OpenLayers.Element.addClass(this.dataLbl, "dataLbl");

          this.dataLayersDiv = document.createElement("div");
          OpenLayers.Element.addClass(this.dataLayersDiv, "dataLayersDiv");

          if (this.ascending) {
              this.layersDiv.appendChild(this.baseLbl);
              this.layersDiv.appendChild(this.baseLayersDiv);
              this.layersDiv.appendChild(this.dataLbl);
              this.layersDiv.appendChild(this.dataLayersDiv);
          } else {
              this.layersDiv.appendChild(this.dataLbl);
              this.layersDiv.appendChild(this.dataLayersDiv);
              this.layersDiv.appendChild(this.baseLbl);
              this.layersDiv.appendChild(this.baseLayersDiv);
          }

          this.div.appendChild(this.layersDiv);

      },

      /** 
      * Method: ignoreEvent
      * 
      * Parameters:
      * evt - {Event} 
      */
      ignoreEvent: function (evt) {
          OpenLayers.Event.stop(evt);
      },

      /** 
      * Method: mouseDown
      * Register a local 'mouseDown' flag so that we'll know whether or not
      *     to ignore a mouseUp event
      * 
      * Parameters:
      * evt - {Event}
      */
      mouseDown: function (evt) {
          this.isMouseDown = true;
          this.ignoreEvent(evt);
      },

      /** 
      * Method: mouseUp
      * If the 'isMouseDown' flag has been set, that means that the drag was 
      *     started from within the LayerSwitcher control, and thus we can 
      *     ignore the mouseup. Otherwise, let the Event continue.
      *  
      * Parameters:
      * evt - {Event} 
      */
      mouseUp: function (evt) {
          if (this.isMouseDown) {
              this.isMouseDown = false;
              this.ignoreEvent(evt);
          }
      },

      CLASS_NAME: "Zondy.Control.LayerSwitcher"
  });