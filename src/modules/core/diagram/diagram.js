(function(){
    "use strict";
    angular.module("visular.core")
        .factory("VzDiagramModel", VzDiagramModel)
        .directive("vzDiagram", vzDiagramDirective);


    function VzDiagramModel(VzElementModel, VzLinkModel){
        return function VzDiagramClass(){
            this.elements = [];
            this.links = [];
            this.elementsById = {};
            this.addElement = function(element){
                if(element instanceof VzElementModel){
                    this.elements.push(element);
                    this.elementsById[element.id] = element;
                }
            };
            this.addLink = function(source, target){
                var link = new VzLinkModel();
                link.source = source;
                link.target = target;
                this.links.push(link);
            }
        }
    }
    function vzDiagramDirective($compile){
        return{
            restrict: "E",
            scope:{
                diagram: "=vzDiagram",
                selectedItem: "=?vzSelectedItem"
            },
            template:
            '<svg>' +
            '   <g ng-repeat="link in diagram.links" vz-link="link"></g>' +
            '   <g ng-repeat="elem in diagram.elements" vz-element="elem"></g>' +
            '</svg>' +
            '<div class="vz-selected-item-overlay"' +
            '   ng-show="selectedItem" ' +
            '   ng-style="{' +
            '       left: selectedItem.position.x || -1000, ' +
            '       top: selectedItem.position.y || -1000,' +
            '       width: selectedItem.size.width || 1,' +
            '       height: selectedItem.size.height || 1}">' +
            '   <vz-resize-handle vz-overlay-handle="bottom right"></vz-resize-handle>' +
            '</div>',
            controller: function($element, $scope){
                var dragInterceptors = [];
                var resizeInterceptors = [];
                this.elem = $element;
                this.diagram = $scope.diagram;
                this.bringToFront = function(elementModel){
                    var idx = $scope.diagram.elements.indexOf(elementModel);
                    if(idx>-1){
                        $scope.diagram.elements.splice(idx,1);
                        $scope.diagram.elements.push(elementModel);
                    }
                };
                this.selectedItem = function(){
                    return $scope.selectedItem;
                };
                this.select = function(elementModel){
                    $scope.selectedItem = elementModel;
                };
                this.unSelect = function(){
                    $scope.selectedItem = null;
                }
                this.drag = {
                    started: function(draggingElement, mouseEvent){
                        dragInterceptors.forEach(function(item){
                            item.dragStartHandler(draggingElement, mouseEvent);
                        });
                    },
                    finished: function(draggingElement, mouseEvent){
                        dragInterceptors.forEach(function(item){
                            item.dragFinishHandler(draggingElement, mouseEvent);
                        });
                    },
                    to: function(pos, draggingElement, mouseEvent){
                        var interceptedPos = pos;
                        dragInterceptors.forEach(function(item){
                            interceptedPos = item.interceptor(interceptedPos, draggingElement, mouseEvent);
                        });
                        draggingElement.position.x = interceptedPos.x;
                        draggingElement.position.y = interceptedPos.y;
                    }
                };
                this.resizeElement = function(rect, resizingElement, mouseEvent){
                    var interceptedRect = rect;
                    resizeInterceptors.forEach(function(item){
                        interceptedRect = item.interceptor(interceptedRect, resizingElement, mouseEvent);
                    });
                    console.log("resize ",resizingElement," to ", interceptedRect.width, interceptedRect.height)

                    resizingElement.size.width = interceptedRect.width;
                    resizingElement.size.height = interceptedRect.height;
                    /*resizingElement.position.x = interceptedRect.x;
                     resizingElement.position.y = interceptedRect.y;*/

                };
                this.addElementDragInterceptor = function(dragInterceptor, dragStartHandler, dragFinishHandler){
                    dragInterceptors.push({
                        interceptor: dragInterceptor || angular.identity,
                        dragStartHandler: dragStartHandler || angular.noop,
                        dragFinishHandler: dragFinishHandler || angular.noop
                    })
                };
                this.addElementResizeInterceptor = function(resizeInterceptor){
                    resizeInterceptor.push({
                        interceptor: resizeInterceptor || angular.identity
                    });
                };
                this.addOverlay = function(overlayHtml){
                    var overlayScope = $scope.$new();
                    var overlay = angular.element(overlayHtml).appendTo($element);
                    $compile(overlay)(overlayScope);
                    return overlayScope;
                }
            },
            link: function(scope, elem, attrs, ctrl){

                console.log("elem", elem.find("svg:first"))
                elem.bind("mousedown", function(evt){
                    console.log("mousedown", evt);
                    scope.$apply(function(){
                        ctrl.unSelect();
                    })
                });
            }
        }
    }
})();