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
                var elemInitialRect;
                new VzDraggableFactory(elem, diagramController.elem)
                    .onDragStart(function(){
                        elemInitialRect = diagramController.selectedItem.getRect();
                    })
                    .onDrag(function(evt){
                        var rect = g.rect(elemInitialRect);
                        var eventPoint = diagramController.relativePoint(evt);
                        var positionExpression = attrs.vzOverlayHandle.toLowerCase();
                        if(positionExpression.indexOf("top")>-1){
                            rect.height = Math.max(elemInitialRect.y + elemInitialRect.height - eventPoint.y, MIN_SIZE);
                            rect.y = Math.min(eventPoint.y, elemInitialRect.y + elemInitialRect.height - MIN_SIZE);
                        }
                        if(positionExpression.indexOf("bottom")>-1){
                            rect.height = Math.max(eventPoint.y - elemInitialRect.y, MIN_SIZE);
                        }
                        if(positionExpression.indexOf("left")>-1){
                            rect.width = Math.max(elemInitialRect.width + elemInitialRect.x +  - eventPoint.x, MIN_SIZE);
                            rect.x = Math.min(eventPoint.x, elemInitialRect.x + elemInitialRect.width - MIN_SIZE);
                        }
                        if(positionExpression.indexOf("right")>-1){
                            rect.width = Math.max(eventPoint.x - elemInitialRect.x, MIN_SIZE);
                        }

                        diagramController
                            .resizeElement(rect, diagramController.selectedItem, evt);
                    });

            }
        }
    }

})(angular);

