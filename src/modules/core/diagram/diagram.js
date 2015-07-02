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
            restrict: "A",
            require: '^vzDiagram',
            link: function(scope, elem, attrs, diagramController){
                scope.$watch(selectedItem, function(selectedItem){
                    selectedItem ? elem.show() : elem.hide();
                });
                scope.$watch(position, function(position){

                    elem.css("top", position ? (position.y): -10000);
                    elem.css("left", position ? (position.x) : -10000);
                }, true);
                scope.$watch(size, function(size){
                    elem.css("width", size ? (size.width) : 1);
                    elem.css("height", size ? (size.height) : 1);
                }, true);

                function selectedItem(){
                    return diagramController.selectedItem
                }
                function size(){
                    return diagramController.selectedItem ? diagramController.selectedItem.size : null;
                }
                function position(){
                    return diagramController.selectedItem ? diagramController.selectedItem.position : null;
                }
            }
        }
    }
    // TODO: add keyboard shortcuts (into a separate module)
    function vzDiagramDirective($compile, $parse){
        return{
            restrict: "E",
            scope: true,
            transclude: true,
            template: '' +
            '<svg >' +
            '   <g>' +
            '       <g ng-repeat="link in vz.diagram.links" vz-link="link"></g>' +
            '       <g ng-repeat="elem in vz.diagram.elements" vz-element="elem"></g>' +
            '   </g>' +
            '</svg>' +
            '<div ng-transclude>' +
            '</div>',
            controller: function($element, $scope, $attrs){
                var positionInterceptors = [];
                var resizeInterceptors = [];
                this.elem = $element;
                this.rootSvgElem = $element.find("svg:first");
                this.viewport = this.rootSvgElem.find(">g:first");
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
                };

                this.zoom = 1;
                this.pan = {x:0, y: 0};
                var ctm = {
                    a: vz.zoom,
                    b: 0,
                    c: 0,
                    d: vz.zoom,
                    e: vz.pan.x,
                    f: vz.pan.y
                };
                this.getTransformationMatrix = function(){
                    var svgMatrix = vz.rootSvgElem[0].createSVGMatrix();
                    svgMatrix.a = ctm.a;
                    svgMatrix.b = ctm.b;
                    svgMatrix.c = ctm.c;
                    svgMatrix.d = ctm.d;
                    svgMatrix.e = ctm.e;
                    svgMatrix.f = ctm.f;
                    return svgMatrix;
                };
                // watch for changes in transformation matrix
                $scope.$watch(function(){
                    ctm.a = vz.zoom;
                    ctm.d = vz.zoom;
                    ctm.e = vz.pan.x;
                    ctm.f = vz.pan.y;
                    return ctm;
                }, function(matrix){
                    if(matrix){
                        console.log("transformation changed", matrix);
                        var transformStr = 'matrix(' + matrix.a + ',' + matrix.b + ',' + matrix.c + ',' + matrix.d
                            + ',' + matrix.e + ',' + matrix.f + ')';
                        vz.viewport[0].setAttributeNS(null, 'transform', transformStr);
                    }
                }, true);


            },
            controllerAs: "vz",
            compile: function(){
                return linkingFn;
            }
        };
        function linkingFn(scope, elem, attrs, ctrl){
            elem.bind("mousedown", function(evt){
                if(evt.target == ctrl.rootSvgElem.get(0)){
                    scope.$apply(function(){
                        ctrl.unSelect();
                    })
                }

            });
            if(attrs.vzDiagramController){
                $parse(attrs.vzDiagramController).assign(scope.$parent, scope.vz);
            }
        }
    }
})();