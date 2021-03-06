(function(){
    'use strict';

    angular.module("visular.core")
        .factory("VzElementModel", VzElementModel)
        .directive("vzElement", vzElementDirective);

    function VzElementModel(){
        return function(type){
            this.type = type || "default";
            // GUID generator. It can be moved to a separate service in future, in case of elsewhere usage.
            this.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
            this.position = {
                x: 0,
                y: 0
            };
            this.size = {
                width: 100,
                height: 100
            };

            this.getBBox = function(){
                return g.rect(this.position.x, this.position.y, this.size.width, this.size.height).bbox(this.rotation);
            };
            this.getRect = function(){
                return g.rect(this.position.x, this.position.y, this.size.width, this.size.height);
            }
            this.resizable = true;
            this.rotation = 0;
        }
    }
    function vzElementDirective(vzConfig, VzDraggableFactory){
        return{

            restrict: "A",
            require: '^vzDiagram',
            scope: {
                model: "=vzElement"
            },
            template:
                '<svg class="vz-element" \
                    ng-class="{\'vz-selected\': vzDiagram.isSelected(model)}"\
                    ng-attr-width="{{model.size.width}}" \
                    ng-attr-height="{{model.size.height}}" \
                    ng-attr-x="{{model.position.x}}" \
                    ng-attr-y="{{model.position.y}}" \
                    ng-include="markupUrl()">\
                </svg>',
            link: function(scope, elem, attrs, diagramController){
                scope.vzDiagram = diagramController;
                scope.markupUrl = function(){
                    return vzConfig.markupPath + "/" + scope.model.type + ".svg";
                };

                init();
                scope.$on("$destroy", cleanup);

                function init(){
                    elem.bind("mousedown", mousedown);
                    elem.bind("mouseup", mouseup);
                    new VzDraggableFactory(elem, diagramController.elem)
                        .onDragStart(function(evt){
                            diagramController.drag.started(scope.model, evt);
                        })
                        .onDragFinish(function(evt){
                            diagramController.drag.finished(scope.model, evt);
                        })
                        .onDrag(function(evt){
                            diagramController.drag
                                .to(
                                diagramController.relativePoint(g.point(this.draggedPosition.x,this.draggedPosition.y)),
                                scope.model, evt);
                        });
                }
                function cleanup(){
                    elem.unbind("mouseup", mouseup);
                    elem.unbind("mousedown", mousedown);
                }
                function mousedown(){
                    scope.$apply(function(){
                        diagramController.bringToFront(scope.model);
                    });
                }
                function mouseup(){
                    scope.$apply(function(){
                        diagramController.select(scope.model);
                    });
                }
            }
        }
    }
})();