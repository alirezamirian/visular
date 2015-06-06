(function(){
    "use strict";
    angular.module("visular.core")
        .directive("vzResizeHandle", vzResizeHandleDirective)
        .directive("vzResizeOverlay", vzResizeOverlayDirective);

    function vzResizeOverlayDirective(){
        return{
            require: "vzDiagram",
            compile: function(tElem){
                tElem.append(
                    '<vz-selected-item-overlay>' +
                    '   <vz-resize-handle vz-overlay-handle="top left"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="top"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="top right"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="right"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="bottom right"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="bottom"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="bottom left"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="left"></vz-resize-handle>' +
                    '</vz-selected-item-overlay>');
            }
        }
    }
    // TODO: provide `g` as an angular service instead of global variable
    function vzResizeHandleDirective(VzDraggableFactory){
        var MIN_SIZE = 10;
        return{
            restrict: "E",
            require: "^vzDiagram",
            link: function(scope, elem, attrs, diagramController){
                var elemRect;
                var elemOffsets = {};
                new VzDraggableFactory(elem, diagramController.elem)
                    .onDragStart(function(){
                        elemRect = diagramController.selectedItem.getRect();
                        // elemOffsets: global offsets of element (relative to document) at the time drag has been started
                        elemOffsets.top = diagramController.elem.offset().top + elemRect.y;
                        elemOffsets.left = diagramController.elem.offset().left + elemRect.x;
                    })
                    .onDrag(function(evt){
                        var rect = g.rect(elemRect);

                        if(attrs.vzOverlayHandle.indexOf("top")>-1){
                            rect.height = Math.max(elemOffsets.top + elemRect.height - evt.pageY, MIN_SIZE);
                            rect.y = (elemRect.y + elemRect.height)/* old bottom*/ - rect.height;
                        }
                        if(attrs.vzOverlayHandle.indexOf("bottom")>-1){
                            rect.height = Math.max(evt.pageY - elemOffsets.top, MIN_SIZE);
                        }
                        if(attrs.vzOverlayHandle.indexOf("left")>-1){
                            rect.width = Math.max(elemOffsets.left + elemRect.width - evt.pageX, MIN_SIZE);
                            rect.x = (elemRect.x + elemRect.width)/* old right*/ - rect.width;
                        }
                        if(attrs.vzOverlayHandle.indexOf("right")>-1){
                            rect.width = Math.max(evt.pageX - elemOffsets.left, MIN_SIZE);
                        }

                        diagramController
                            .resizeElement(rect, diagramController.selectedItem, evt);
                    });

            }
        }
    }
})();