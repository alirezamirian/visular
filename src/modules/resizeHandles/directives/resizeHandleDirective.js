(function(angular){
    "use strict";
    /**
     * @ngdoc directive
     * @name vzResizeHandle
     *
     * @description
     * handles for resizing an element. The logic for resizing element is determined based on the value of
     * `vzResizeHandle` attribute which can strings like: **top**, **bottom left**, **top right**, **left**, etc.
     *
     * @restrict E
     * */
    angular.module('visular.resizeHandles')
        .directive('vzResizeHandle', vzResizeHandleDirectiveProvider);

    // TODO: provide `g` as an angular service instead of global variable
    // TODO: feat: add keepAspectRatio option for corner handles ('top left', 'bottom right', etc.), which is the default
    // and can be ignored with SHIFT or CTRL key
    function vzResizeHandleDirectiveProvider(VzDraggableFactory){
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

                        var positionExpression = attrs.vzOverlayHandle.toLowerCase();
                        if(positionExpression.indexOf("top")>-1){
                            rect.height = Math.max(elemOffsets.top + elemRect.height - evt.pageY, MIN_SIZE);
                            rect.y = (elemRect.y + elemRect.height)/* old bottom*/ - rect.height;
                        }
                        if(positionExpression.indexOf("bottom")>-1){
                            rect.height = Math.max(evt.pageY - elemOffsets.top, MIN_SIZE);
                        }
                        if(positionExpression.indexOf("left")>-1){
                            rect.width = Math.max(elemOffsets.left + elemRect.width - evt.pageX, MIN_SIZE);
                            rect.x = (elemRect.x + elemRect.width)/* old right*/ - rect.width;
                        }
                        if(positionExpression.indexOf("right")>-1){
                            rect.width = Math.max(evt.pageX - elemOffsets.left, MIN_SIZE);
                        }

                        diagramController
                            .resizeElement(rect, diagramController.selectedItem, evt);
                    });

            }
        }
    }

})(angular);

