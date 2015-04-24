(function(){
    "use strict";
    angular.module("visular.core")
        .directive("vzResizeHandle", vzResizeHandleDirective);

    function vzResizeHandleDirective(VzDraggableFactory){
        return{
            restrict: "E",
            require: "^vzDesigner",
            link: function(scope, elem, attrs, designerController){
                var elemRect;
                new VzDraggableFactory(elem, designerController.elem)
                    .onDragStart(function(){
                        elemRect = scope.selectedItem.getRect();
                    })
                    .onDrag(function(evt){
                        var rect = g.rect(elemRect);
                        rect.width  = Math.max(evt.pageX - designerController.elem.offset().left - elemRect.x, 10);
                        rect.height = Math.max(evt.pageY - designerController.elem.offset().top - elemRect.y,10);
                        designerController
                            .resizeElement(rect, scope.selectedItem, evt);
                    });

            }
        }
    }
})();