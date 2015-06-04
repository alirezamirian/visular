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
    function vzElementDirective(vzConfig, $document, VzDraggableFactory, $timeout, VZ_THRESHOLD){
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

                // control scales
                scope.scaleX = 1;
                scope.scaleY = 1;
                scope.$watch(function () {
                    return elem.get(0).getBBox().height.toFixed(1);
                }, function (newValue, oldValue) {
                    console.log(oldValue + " => " + newValue);
                });
                /*scope.$watch(function(){
                 return +elem.get(0).getBBox().height.toFixed(1);
                 }, function(height){
                 if(height && Math.abs(scope.model.size.height - height) > VZ_THRESHOLD)
                 scope.scaleY = scope.model.size.height / height ;
                 });
                 scope.$watch(function(){
                 return +elem.get(0).getBBox().width.toFixed(1);
                 }, function(width){
                 if(width && Math.abs(scope.model.size.width - width) > VZ_THRESHOLD)
                 scope.scaleX = scope.model.size.width / width;
                 });*/
                /*scope.$watch(function(){
                 var currentBBox = elem.get(0).getBBox();
                 console.log("currBbox", currentBBox);
                 console.log(Math.abs(scope.model.size.height - currentBBox.height),Math.abs(scope.model.size.width - currentBBox.width))

                 $timeout(function(){
                 if(currentBBox.height && Math.abs(scope.model.size.height - currentBBox.height) > VZ_THRESHOLD)
                 scope.scaleY = scope.model.size.height / currentBBox.height ;
                 if(currentBBox.width && Math.abs(scope.model.size.width - currentBBox.width) > VZ_THRESHOLD)
                 scope.scaleX = scope.model.size.width / currentBBox.width;
                 },10)


                 });*/
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

                elem.bind("mousedown", mousedown);
                scope.$on("$destroy", function(){
                    elem.unbind("mousedown", mousedown);
                });

                elem.bind("mouseup", mouseup);
                scope.$on("$destroy", function(){
                    elem.unbind("mouseup", mouseup);
                });

                new VzDraggableFactory(elem, diagramController.elem)
                    .onDragStart(function(evt){
                        diagramController.drag.started(scope.model, evt);
                    })
                    .onDragFinish(function(evt){
                        diagramController.drag.finished(scope.model, evt);
                    })
                    .onDrag(function(evt){
                        diagramController.drag
                            .to(g.point(this.draggedPosition.x,this.draggedPosition.y), scope.model, evt);
                    });
            }
        }
    }
})();