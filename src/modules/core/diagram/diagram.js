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
    function vzSelectedItemOverlayDirective(vzSvgUtils, VzElementModel){
        return{
            restrict: "A",
            require: '^vzDiagram',
            link: function(scope, elem, attrs, diagramController){
                scope.$watch(selectedItem, function(selectedItem){
                    (selectedItem && selectedItem instanceof VzElementModel) ? elem.show() : elem.hide();
                });
                scope.$watch(position, setPosition, true);
                scope.$watch(size, setSize, true);
                scope.$watch(diagramController.transformStr, function(){
                    setPosition(position());
                    setSize(size());
                });
                function setPosition(position){
                    if(position){
                        var topLeft = vzSvgUtils.transformPoint(position.x,position.y,diagramController.getCTM());
                        elem.css("top", position ? (topLeft.y): -10000);
                        elem.css("left", position ? (topLeft.x) : -10000);
                    }
                }
                function setSize(size){
                    elem.css("width", size ? (size.width*diagramController.getCTM().a) : 1);
                    elem.css("height", size ? (size.height*diagramController.getCTM().a) : 1);
                }
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
    function vzDiagramDirective($compile, $parse, $document){
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

                var ctm = this.rootSvgElem[0].createSVGMatrix();
                this.getCTM = function(){
                    return ctm;
                };
                this.setCTM = function(newCTM){
                    if(newCTM instanceof SVGMatrix){
                        ctm.a = newCTM.a;
                        ctm.b = newCTM.b;
                        ctm.c = newCTM.c;
                        ctm.d = newCTM.d;
                        ctm.e = newCTM.e;
                        ctm.f = newCTM.f;
                    }

                };
                // watch for changes in transformation matrix, because of some reason, it's not possible to watch
                // SVGMatrix instances
                $scope.$watch(function(){
                    return{
                        a: ctm.a,
                        b: ctm.b,
                        c: ctm.c,
                        d: ctm.d,
                        e: ctm.e,
                        f: ctm.f
                    }
                }, function(matrix){
                    if(matrix){
                        console.log("transformation changed", matrix);
                        var transformStr = vz.transformStr(matrix);
                        vz.viewport[0].setAttributeNS(null, 'transform', transformStr);
                    }
                }, true);

                this.transformStr = function(){
                    return 'matrix(' + ctm.a + ',' + ctm.b + ',' + ctm.c + ',' + ctm.d
                    + ',' + ctm.e + ',' + ctm.f + ')';
                };
                this.relativePoint = function(event){
                    var point = this.rootSvgElem[0].createSVGPoint();
                    // if input is a point itself
                    if(angular.isDefined(event.x) && angular.isDefined(event.y)){
                        point.x = event.x;
                        point.y = event.y;
                    }
                    // if input is a mouse event, compute the point in pixels relative to diagram
                    else{
                        var diaOffset = this.rootSvgElem.offset();
                        point.x = event.originalEvent.pageX - diaOffset.left;
                        point.y = event.originalEvent.pageY - diaOffset.top;
                    }

                    return point.matrixTransform(ctm.inverse());
                };

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