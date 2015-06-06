(function(){
    "use strict";
    angular.module("visular.core")
        .factory("VzDiagramModel", VzDiagramModel)
        .directive("vzDiagram", vzDiagramDirective)
        .directive("vzSelectedItemOverlay", vzSelectedItemOverlayDirective)


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
    function vzSelectedItemOverlayDirective(){
        return{
            restrict: "E",
            transclude: true,
            template:
                '<div class="vz-selected-item-overlay"\
                    ng-transclude\
                    ng-show="vz.selectedItem" \
                    ng-style="{\
                        left: vz.selectedItem.position.x || -1000, \
                        top: vz.selectedItem.position.y || -1000, \
                        width: vz.selectedItem.size.width || 1, \
                        height: vz.selectedItem.size.height || 1}"> \
                </div>'
        }
    }
    function vzDiagramDirective($compile, $parse){
        return{
            restrict: "E",
            scope: true,
            controller: function($element, $scope, $attrs){
                var positionInterceptors = [];
                var resizeInterceptors = [];
                this.elem = $element;
                var vz = this;
                $scope.$watch($attrs.vzDiagramModel, function(){
                    vz.diagram = $parse($attrs.vzDiagramModel)($scope);
                });
                this.bringToFront = function(elementModel){
                    var idx = this.diagram.elements.indexOf(elementModel);
                    if(idx>-1){
                        this.diagram.elements.splice(idx,1);
                        this.diagram.elements.push(elementModel);
                    }
                };
                this.isSelected = function(item){
                    // this can be extended for multiple selection
                    return this.selectedItem == item;
                }
                this.select = function(elementModel){
                    this.selectedItem = elementModel;
                };
                this.unSelect = function(){
                    this.selectedItem = null;
                };
                this.drag = {
                    started: function(draggingElement, mouseEvent){
                        positionInterceptors.forEach(function(item){
                            item.movementStartHandler(draggingElement, mouseEvent);
                        });
                    },
                    finished: function(draggingElement, mouseEvent){
                        positionInterceptors.forEach(function(item){
                            item.movementFinishHandler(draggingElement, mouseEvent);
                        });
                    },
                    to: function(pos, draggingElement, mouseEvent){
                        var interceptedPos = pos;
                        positionInterceptors.forEach(function(item){
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
                    //console.log("resize ",resizingElement," to ", interceptedRect.width, interceptedRect.height)

                    resizingElement.size.width = interceptedRect.width;
                    resizingElement.size.height = interceptedRect.height;
                    resizingElement.position.x = interceptedRect.x;
                    resizingElement.position.y = interceptedRect.y;

                };
                this.addElementPositionInterceptor = function(positionInterceptor, movementStartHandler, movementFinishHandler){
                    positionInterceptors.push({
                        interceptor: positionInterceptor || angular.identity,
                        movementStartHandler: movementStartHandler || angular.noop,
                        movementFinishHandler: movementFinishHandler || angular.noop
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
            controllerAs: "vz",
            compile: function(tElem){
                tElem.prepend(
                    '<svg>' +
                    '   <g ng-repeat="link in vz.diagram.links" vz-link="link"></g>' +
                    '   <g ng-repeat="elem in vz.diagram.elements" vz-element="elem"></g>' +
                    '</svg>');
                return linkingFn;
            }
        };
        function linkingFn(scope, elem, attrs, ctrl){
            elem.bind("mousedown", function(evt){
                scope.$apply(function(){
                    ctrl.unSelect();
                })
            });
        }
    }
})();