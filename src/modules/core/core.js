/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/19/2015
 */


angular.module("visular.core",['visular.config'])

    .value("VZ_THRESHOLD",0.001)


    .factory("VzElementModel", function(){
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
            }
            this.resizable = true;
            this.rotation = 0;
        }
    })
    .factory("VzLinkModel", function(){
        return function(type){
            this.source = null;
            this.target = null;
            this.middlePoints = [];
        }
    })
    .factory("VzDiagramModel", function(VzElementModel, VzLinkModel){
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
    })

    .directive("vzResizeHandle", function($document){
        return{
            restrict: "E",
            require: "^vzDesigner",
            link: function(scope, elem){


            }
        }
    })
    .directive("vzDesigner", function($compile){
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
                }

                this.addElementDragInterceptor = function(dragInterceptor, dragStartHandler, dragFinishHandler){
                    dragInterceptors.push({
                        interceptor: dragInterceptor || angular.identity,
                        dragStartHandler: dragStartHandler || angular.noop,
                        dragFinishHandler: dragFinishHandler || angular.noop
                    })
                }
                this.addOverlay = function(overlayHtml){
                    var overlayScope = $scope.$new();
                    var overlay = angular.element(overlayHtml).appendTo($element);
                    $compile(overlay)(overlayScope);
                    return overlayScope;
                }
            }
        }
    })


    .directive("vzLink", function(){
        return{
            restrict: "A",
            require: "^vzDesigner",
            scope:{
                model: "=vzLink"
            },
            template:
            '<g class="vz-link">' +
            '   <path class="vz-link-path" stroke="#888" ng-attr-d="{{path()}}"></path>' +
            '   <path   class="vz-link-arrow" ' +
            '           stroke="#666" d="M 10 0 L 0 5 L 10 10 z"' +
            '           ng-attr-transform="' +
            '               translate({{targetArrow.translate.x}}, {{targetArrow.translate.y}}) ' +
            '               rotate({{targetArrow.rotation}})">' +
            '</g>',
            link: function(scope, elem, attrs, designerController){

                scope.srcElem = null;
                scope.targetElem = null;
                scope.startPoint = new g.point(0,0);
                scope.endPoint = new g.point(0,0);
                scope.targetArrow = {
                    rotation: 0,
                    translate: {
                        x: 0,
                        y: 0
                    }
                };

                scope.$watch("model.source.id", function(){
                    scope.srcElem = designerController.diagram.elementsById[scope.model.source.id];
                });
                scope.$watch("model.target.id", function(){
                    scope.targetElem = designerController.diagram.elementsById[scope.model.target.id];
                });
                scope.$watch("[targetElem.position, targetElem.size, srcElem.position, srcElem.size]", function(){
                    if(scope.targetElem && scope.srcElem){
                        scope.startPoint = scope.srcElem.getBBox()
                            .intersectionWithLineFromCenterToPoint(scope.targetElem.getBBox().center());
                        scope.endPoint = scope.targetElem.getBBox()
                            .intersectionWithLineFromCenterToPoint(scope.srcElem.getBBox().center());
                        updateTargetArrow();
                    }
                }, true);
                scope.path = function(){
                    var points = [];
                    if(scope.startPoint)
                        points.push(scope.startPoint);
                    // TODO: add intermediate points
                    if(scope.endPoint)
                        points.push(scope.endPoint);
                    // TODO: implement other kind of paths
                    return "M " + points.map(function(point){
                            return point.x + " " + point.y;
                        }).join(" ");
                }
                function updateTargetArrow(){
                    scope.targetArrow.rotation = 180 - scope.startPoint.theta(scope.endPoint);
                    // lets do a little math! :D
                    var rotationInRadians = scope.targetArrow.rotation * (Math.PI / 180);
                    var ARROW_SIZE = 10;
                    scope.targetArrow.translate.x = scope.endPoint.x + (ARROW_SIZE/2)*(Math.sin(rotationInRadians));
                    scope.targetArrow.translate.y = scope.endPoint.y - (ARROW_SIZE/2)*(Math.cos(rotationInRadians));
                }
            }
        }
    })

    .directive("vzElement", function(vzConfig, $document, VzDraggableFactory, VZ_THRESHOLD){
        return{
            restrict: "A",
            require: '^vzDesigner',
            scope: {
                model: "=vzElement"
            },
            template:
            '<g class="vz-element" ' +
            '   ng-attr-transform="' +
            '       translate({{model.position.x}},{{model.position.y}})' +
            '       scale({{scaleX}}, {{scaleY}})" ' +
            '   ng-include="markupUrl()">' +
            '</g>',
            link: function(scope, elem, attrs, designerController){
                scope.markupUrl = function(){
                    return vzConfig.markupPath + "/" + scope.model.type + ".svg";
                };

                // control scales
                scope.scaleX = 1;
                scope.scaleY = 1;
                scope.$watch(function(){
                    return elem.get(0).getBBox().height;
                }, function(height){
                    console.log(Math.abs(scope.model.size.height - height));
                    if(height && Math.abs(scope.model.size.height - height) > VZ_THRESHOLD)
                        scope.scaleY = scope.model.size.height / height ;
                });
                scope.$watch(function(){
                    return elem.get(0).getBBox().width;
                }, function(width){
                    if(width && Math.abs(scope.model.size.width - width) > VZ_THRESHOLD)
                        scope.scaleX = scope.model.size.width / width;
                });
                function mousedown(){
                    scope.$apply(function(){
                        designerController.bringToFront(scope.model);
                    });
                }
                function mouseup(){
                    scope.$apply(function(){
                        designerController.select(scope.model);
                    });
                }

                elem.bind("mousedown", mousedown);
                scope.$on("$destroy", function(){
                    elem.unbind("mousedown", mousedown);
                })

                elem.bind("mouseup", mouseup);
                scope.$on("$destroy", function(){
                    elem.unbind("mouseup", mouseup);
                });

                new VzDraggableFactory(elem, designerController.elem)
                    .onDragStart(function(evt){
                        designerController.drag.started(scope.model, evt);
                    })
                    .onDragFinish(function(evt){
                        designerController.drag.finished(scope.model, evt);
                    })
                    .onDrag(function(evt){
                        designerController.drag
                            .to(g.point(this.elementMovement.x,this.elementMovement.y), scope.model, evt);
                    });
            }
        }
    })


    .factory("VzDraggableFactory", function($document){
        return function(domElem, containerDomElem){
            var _this = this, onDrag, onDragStart, onDragFinish, containerOffset;
            domElem = angular.element(domElem);
            var scope = domElem.scope();

            domElem.bind("mousedown", mousedown);

            scope.$on("$destroy", function(){
                domElem.unbind("mousedown", mousedown);
            });

            this.onDrag = function(callback){
                onDrag = callback;
                return this;
            };
            this.onDragStart = function(callback){
                onDragStart = callback;
                return this;
            }
            this.onDragFinish = function(callback){
                onDragFinish = callback;
                return this;
            }
            function mousedown(evt){
                _this.startPosition = {
                    x: evt.pageX,
                    y: evt.pageY
                };
                _this.localOffset = {
                    x: _this.startPosition.x - domElem.position().left,
                    y: _this.startPosition.y - domElem.position().top
                }
                containerOffset = containerDomElem.offset();
                if(angular.isFunction(onDragStart)){
                    scope.$apply(function(){
                        onDragStart.call(_this, evt);
                    })
                }
                $document.bind("mousemove", mousemove);
                $document.one("mouseup", function(){
                    $document.unbind("mousemove", mousemove);
                    if(angular.isFunction(onDragFinish)){
                        scope.$apply(function(){
                            onDragFinish.call(_this, evt);
                        })
                    }
                });
                return false;
            }
            function mousemove(evt){
                _this.position = {
                    x: evt.pageX,
                    y: evt.pageY
                };
                _this.elementMovement = {
                    /**
                     * TODO: simplify calculation if possible
                     */
                    x: Math.min(Math.max(evt.pageX,containerOffset.left), containerDomElem.width() + containerOffset.left)
                    - _this.localOffset.x - containerOffset.left,
                    y: Math.min(Math.max(evt.pageY,containerOffset.top), containerDomElem.height()+ containerOffset.top)
                    - _this.localOffset.y - containerOffset.top
                };
                if(angular.isFunction(onDrag)){
                    scope.$apply(function(){
                        onDrag.call(_this, evt);
                    })
                }
            }
        }
    });