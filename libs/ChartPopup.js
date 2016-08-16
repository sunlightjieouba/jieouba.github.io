
OpenLayers.Popup.ChartPopup =
  OpenLayers.Class(OpenLayers.Popup, {
      offset: new OpenLayers.Pixel(0, 0),
      initialize: function (id, lonlat, contentSize, contentHTML, closeBox,
                        closeBoxCallback, offset) {
          if (offset!=null) {
              this.offset = offset;
          }
          OpenLayers.Popup.prototype.initialize.apply(this, arguments);

      },
      /**
      * Method: moveTo
      * 
      * Parameters:
      * px - {<OpenLayers.Pixel>} the top and left position of the popup div. 
      */
      moveTo: function (px) {
          if ((px != null) && (this.div != null)) {
              this.div.style.left = px.x + this.offset.x + "px";
              this.div.style.top = px.y + this.offset.y + "px";
          }
      },
     

      CLASS_NAME: "OpenLayers.Popup.ChartPopup"
  });
