(function(){
    "use strict";
    angular.module("visular.core")
        .directive("vzResizeHandle", vzResizeHandleDirective);

    function vzResizeHandleDirective(VzDraggableFactory){
        return{
            restrict: "E",
            require: "^vzDiagram",
            link: function(scope, elem, attrs, diagramController){
                var elemRect;
                new VzDraggableFactory(elem, diagramController.elem)
                    .onDragStart(function(){
                        elemRect = scope.selectedItem.getRect();
                    })
                    .onDrag(function(evt){
                        var rect = g.rect(elemRect);
                        rect.width  = Math.max(evt.pageX - diagramController.elem.offset().left - elemRect.x, 10);
                        rect.height = Math.max(evt.pageY - diagramController.elem.offset().top - elemRect.y,10);
                        diagramController
                            .resizeElement(rect, scope.selectedItem, evt);
                    });

            }
        }
    }
})();