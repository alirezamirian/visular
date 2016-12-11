/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
angular.module('visular', ["visular.config","visular.core","visular.guideline","visular.pan","visular.resizeHandles","visular.zoom","sugarSvg"]);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/23/2015
 */


angular.module("visular.config",[])
    .provider("vzConfig", function(){

        this.markupPath = "templates"
        this.setMarkupPath = function(path){
            this.markupPath = path;
        }

        this.$get = function(){
            return this;
        }
    });
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/19/2015
 */


angular.module("visular.core",['visular.config'])

    .value("VZ_THRESHOLD",0.001);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/23/2015
 */


/**
 * @ngdoc module
 * @name visular.guideline
 * @description
 * This module provide semantic and UI for adding a guideline system to vz-diagram.
 * Two major part of the module are `vzGuideline` directive, and `VzGuidelineFactory` service.
 *
 * `vzGuidelineFactory` is a service with a `create()` method, which creates a guideline system object
 *  that handles all positioning semantics for a guideline system.
 *
 *  `vzGuideline` directive makes use of vzDiagram controller api to register a **element position interceptor**
 *  for the diagram. It also adds an overlay to diagram for visualizing guidelines
 */
angular.module("visular.guideline", [])


/**
 * @ngdoc directive
 * @name vzGuideline
 * @module visular.guideline
 *
 * @restrict A
 *
 * @description
 * `vz-guideline` is a directive that adds **guidelines** to `vz-diagram` element that help neat alignment of the
 * elements when dragging them. It internally uses `vzGuidelineFactory` which is a service that provides all
 * positioning semantics of moving rects in such guideline-enabled system.
 *
 * @usage
 * <hljs lang="html">
 *  <vz-diagram vz-guideline>
 *  </<vz-diagram>
 * </hljs>
 */
    .directive("vzGuideline", ["VzGuidelineFactory", "vzSvgUtils", function vzGuidelineDirective(VzGuidelineFactory, vzSvgUtils){
        var overlayTemplate =
            '<div class="vz-guideline"' +
            '   ng-repeat="guideline in guidelines"' +
            '   ng-class="guideline.isHorizontal() ? \'vz-guideline-h\' : \'vz-guideline-v\'"' +
            '   ng-style="{' +
            '       top: guideline.isHorizontal() ? transform(0,guideline.level).y : 0,' +
            '       left: !guideline.isHorizontal() ? transform(guideline.level,0).x : 0}"></div>';
        return{
            restrict: "A",
            require: "vzDiagram",
            link: function(){
                var diagramController = arguments[arguments.length-2],
                    scope = diagramController.addOverlay(overlayTemplate);

                var guidelineSystem = null;
                function movementStart(element){
                    function otherRectsFilter(elementModel){
                        return elementModel != element;
                    }
                    function elementModelToRect(elementModel){
                        return elementModel.getBBox();
                    }

                    /**
                     * TODO: elements can be filtered to a smaller set that are at least in viewport
                     */
                    var topLeft = diagramController.relativePoint({x:0, y:0});
                    var bottomRight = diagramController.relativePoint({
                        x:diagramController.elem.width(),
                        y:diagramController.elem.height()
                    });

                    guidelineSystem = VzGuidelineFactory.create(
                        g.rect(topLeft.x,topLeft.y,bottomRight.x-topLeft.x, bottomRight.y-topLeft.y),
                        diagramController.diagram.elements.filter(otherRectsFilter).map(elementModelToRect),
                        element.getBBox()
                    );
                    scope.guidelines = guidelineSystem.activeGuidelines;
                    scope.transform = function(x,y){
                        return vzSvgUtils.transformPoint(x,y,diagramController.getCTM());
                    }
                }
                function movementFinished(){
                    delete guidelineSystem;
                    scope.guidelines = [];
                }
                function positionInterceptor(pointToMove){
                    guidelineSystem.moveTargetToPosition(pointToMove);
                    return guidelineSystem.guidedTargetRect.origin();
                }
                diagramController
                    .addElementPositionInterceptor(
                    positionInterceptor, movementStart, movementFinished);
            }
        }
    }])
/**
 * @ngdoc service
 * @name VzGuidelineFactory
 * @module visular.guideline
 * @description
 * ##NOTE: you, as a user of vz-guideline, don't need to know about what goes on under the hood in `VzGuidelineFactory`.
 * it's usage is limited to `vzGuideline` directive. So you can freely skip this documentation, unless you want to write
 * your own implementation of the guideline directive, based on `vzGuidelineFactory`.
 *
 * If you want to encapsulate all semantics of a guideline system into a model, it should:
 * * Let you specify position of a rectangle inside a coordinate system
 * * Give you back the guided position of that rectangle
 * * Tell you what guidelines are utilized (if any) to compute guided position
 *
 * `create()` method of `VzGuidelineFactory` is responsible for creating such models.
 * It accepts three arguments:
 *  * containerRect: The rect which specifies the container boundries.
 *  * otherRects: An array of rects that are used to adding guidelines based on their positions
 *  * targetRect: The target rect that its position should be mapped to a guided position
 *
 *
 *  // TODO: complete docs
 */
    .factory("VzGuidelineFactory", function(){
        var Guideline = {
            create: function(containerRect, otherRects, targetRect){
                return new GuidelineSystemModel(containerRect, otherRects, targetRect);
            },
            Types: {
                TOP: 1,
                H_MIDDLE: 2,
                BOTTOM: 3,
                LEFT: 4,
                V_MIDDLE: 5,
                RIGHT: 6
            }
        };
        function GuidelineModel(type, level){
            this.type = type;
            this.level = level;
            this.isHorizontal = function(){
                return this.type == Guideline.Types.BOTTOM || this.type == Guideline.Types.H_MIDDLE
                    || this.type == Guideline.Types.TOP;
            }
        }
        function GuidelineSystemModel(containerRect, otherRects, targetRect){
            this.THRESHOLD = 10;
            var guidelines = [];

            // init
            guidelines.push(new GuidelineModel(Guideline.Types.H_MIDDLE, containerRect.y+containerRect.height/2));
            guidelines.push(new GuidelineModel(Guideline.Types.TOP, containerRect.y));
            guidelines.push(new GuidelineModel(Guideline.Types.BOTTOM, containerRect.y+containerRect.height));

            guidelines.push(new GuidelineModel(Guideline.Types.V_MIDDLE, containerRect.x+containerRect.width/2));
            guidelines.push(new GuidelineModel(Guideline.Types.LEFT, containerRect.x));
            guidelines.push(new GuidelineModel(Guideline.Types.RIGHT, containerRect.x+containerRect.width));

            angular.forEach(otherRects, function(rect){
                guidelines.push(new GuidelineModel(Guideline.Types.H_MIDDLE, rect.y+rect.height/2));
                guidelines.push(new GuidelineModel(Guideline.Types.TOP, rect.y));
                guidelines.push(new GuidelineModel(Guideline.Types.BOTTOM, rect.y+rect.height));

                guidelines.push(new GuidelineModel(Guideline.Types.V_MIDDLE, rect.x+rect.width/2));
                guidelines.push(new GuidelineModel(Guideline.Types.LEFT, rect.x));
                guidelines.push(new GuidelineModel(Guideline.Types.RIGHT, rect.x+rect.width));
            });

            targetRect = angular.copy(targetRect);
            this.guidedTargetRect = angular.copy(targetRect);
            this.activeGuidelines = [];
            this.moveTargetToPosition = function(pos){
                this.activeGuidelines.length = 0;
                targetRect.y = pos.y;
                targetRect.x = pos.x;
                var hMatch = null, vMatch = null;
                for(var i=0; i<guidelines.length && (!hMatch || !vMatch); i++){
                    var guideline = guidelines[i];

                    // if a horizontal guideline is already found, just skip to next guideline
                    /*if( hMatch && guideline.isHorizontal())
                     continue;
                     if( vMatch && !guideline.isHorizontal())
                     continue;*/
                    /**
                     * TODO: now if more than one guideline matches, the element will stick to the one
                     * that is upper in the switch case! the selected guideline can be changed to the
                     * one that deserves it the most (the nearest one)!
                     */

                    switch(guideline.type){
                        case Guideline.Types.H_MIDDLE:
                            if(Math.abs(targetRect.y + targetRect.height/2 - guideline.level) < this.THRESHOLD) {
                                hMatch = guideline;
                                this.guidedTargetRect.y = guideline.level - targetRect.height/2;
                                this.activeGuidelines.push(guideline);
                            }
                            break;
                        case Guideline.Types.TOP:
                            if(Math.abs(targetRect.y - guideline.level) < this.THRESHOLD){
                                hMatch = guideline;
                                this.guidedTargetRect.y = guideline.level;
                                this.activeGuidelines.push(guideline);
                            }
                            break;
                        case Guideline.Types.BOTTOM:
                            if(Math.abs(targetRect.y + targetRect.height - guideline.level) < this.THRESHOLD){
                                hMatch = guideline;
                                this.guidedTargetRect.y = guideline.level - targetRect.height ;
                                this.activeGuidelines.push(guideline);
                            }
                            break;

                        case Guideline.Types.V_MIDDLE:
                            if(Math.abs(targetRect.x + targetRect.width/2 - guideline.level) < this.THRESHOLD){
                                vMatch = guideline;
                                this.guidedTargetRect.x = guideline.level - targetRect.width/2;
                                this.activeGuidelines.push(guideline);
                            }
                            break;
                        case Guideline.Types.LEFT:
                            if(Math.abs(targetRect.x - guideline.level) < this.THRESHOLD){
                                vMatch = guideline;
                                this.guidedTargetRect.x = guideline.level;
                                this.activeGuidelines.push(guideline);
                            }
                            break;
                        case Guideline.Types.RIGHT:
                            if(Math.abs(targetRect.x + targetRect.width - guideline.level) < this.THRESHOLD){
                                vMatch = guideline;
                                this.guidedTargetRect.x = guideline.level - targetRect.width;
                                this.activeGuidelines.push(guideline);
                            }
                            break;

                    }
                }
                if(!hMatch)
                    this.guidedTargetRect.y = targetRect.y;
                if(!vMatch)
                    this.guidedTargetRect.x = targetRect.x;
            }
        }
        return Guideline;
    });
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 7/7/2015
 */


(function(angular){
    "use strict";
    angular.module("visular.pan", ['visular.core']);
})(angular);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 6/6/2015
 */


(function(angular){
    "use strict";
    angular.module('visular.resizeHandles', ['visular.core']);

})(angular);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 6/19/2015
 */


(function(angular) {
    angular.module("visular.zoom", [])
        .directive("vzZoomOnWheel", vzZoomOnWheelDirectiveFactory)
        .directive("vzZoomGetterSetter", vzZoomGetterSetterDirectiveFactory)
        .factory("vzZoomAtPoint", vzZoomAtPointFactory);



    function vzZoomAtPointFactory(){
        return function(relativePoint, zoom, vzDiagramCtrl, isAbsolute){
            var currentCTM = vzDiagramCtrl.getCTM();
            if(isAbsolute){
                zoom = zoom/currentCTM.a;
            }
            var modifier = vzDiagramCtrl.rootSvgElem[0].createSVGMatrix()
                .translate(relativePoint.x, relativePoint.y)
                .scale(zoom)
                .translate(-relativePoint.x, -relativePoint.y);

            return currentCTM.multiply(modifier);
        }
    }

    function vzZoomGetterSetterDirectiveFactory(vzZoomAtPoint, $parse){
        return{
            restrict: "A",
            require: "vzDiagram",
            link: function(scope, elem, attrs, vzDiagramCtrl){

                $parse(attrs.vzZoomGetterSetter).assign(scope, vzZoomGetterSetter);
                function vzZoomGetterSetter(zoom){
                    // Getter
                    if(!angular.isDefined(zoom)){
                        return vzDiagramCtrl.getCTM().a;
                    }
                    console.log("setter got called");
                    // Setter
                    // TODO: move computation of center to a util module
                    // TODO: zoom at the relative point corresponding to center, not center itself
                    var center = vzDiagramCtrl.rootSvgElem[0].createSVGPoint();
                    center.x = vzDiagramCtrl.elem.width()/2;
                    center.y = vzDiagramCtrl.elem.height()/2;
                    var ctm = vzZoomAtPoint(center, zoom, vzDiagramCtrl, true);
                    vzDiagramCtrl.setCTM(ctm);
                }
            }
        }
    }
    vzZoomGetterSetterDirectiveFactory.$inject = ["vzZoomAtPoint", "$parse"];

    var vzZoomOnWheelDefaultOptions = {
        preventDefault: true,
        requiredKeys: false
    }
    function vzZoomOnWheelDirectiveFactory(vzZoomAtPoint){
        var zoomScaleSensitivity = .1;
        return{
            restrict: "A",
            require: "vzDiagram",
            link: function(scope, elem, attrs, vzDiagramCtrl){
                var options = angular.extend({}, vzZoomOnWheelDefaultOptions, scope.$eval(attrs.vzZoomOnWheelOptions) || {});

                var lastMouseWheelEventTime;
                scope.$on("$destroy", cleanUp);
                init();
                /*if(options.requiredKeys){
                    vzDiagramCtrl.addKeyCombinationCursor(options.requiredKeys, 'zoom-in');
                }*/
                function wheelHandler(event){
                    if(options.requiredKeys){
                        var keysArePressed = options.requiredKeys
                            .split(' ')
                            .every(function(key){
                                return event[key + "Key"];
                            });
                        if(!keysArePressed){
                            return;
                        }
                    }


                    // Inspired by https://github.com/ariutta/svg-pan-zoom
                    var evt = event.originalEvent,
                        relativePoint = vzDiagramCtrl.relativePoint(event);


                    // Default delta in case that deltaY is not available
                    var delta = evt.deltaY || 1
                        , timeDelta = Date.now() - lastMouseWheelEventTime
                        , divider = 3 + Math.max(0, 30 - timeDelta);

                    // Update cache
                    lastMouseWheelEventTime = Date.now();

                    // Make empirical adjustments for browsers that give deltaY in pixels (deltaMode=0)
                    if ('deltaMode' in evt && evt.deltaMode === 0 && evt.wheelDelta) {
                        delta = evt.deltaY === 0 ? 0 :  Math.abs(evt.wheelDelta) / evt.deltaY;
                    }

                    delta = -0.3 < delta && delta < 0.3 ? delta : (delta > 0 ? 1 : -1) * Math.log(Math.abs(delta) + 10) / divider;

                    var newRelativeZoom = Math.pow(1 + zoomScaleSensitivity, (-1) * delta);

                    var newCTM = vzZoomAtPoint(relativePoint, newRelativeZoom, vzDiagramCtrl);
                    scope.$apply(function(){
                        vzDiagramCtrl.setCTM(newCTM);
                    });
                    if(options.preventDefault){
                        if(evt.preventDefault)
                            evt.preventDefault();
                        else
                            evt.returnValue = false;
                    }
                }

                /**
                 * returns a SvgPoint instance indicating the event coordinates
                 * // TODO: move it to a seperate service
                 * // TODO: add support for touch
                 * @param event: event object
                 * @param svg: root svg element
                 * @returns SvgPoint
                 */
                function getEventPoint(event, svg){
                    var diaOffset = svg.offset();
                    var point = svg[0].createSVGPoint();
                    point.x = event.originalEvent.pageX - diaOffset.left;
                    point.y = event.originalEvent.pageY - diaOffset.top;
                    return point;
                }
                function init(){
                    if(attrs.vzZoomOnWheelOptions){
                        // TODO: think about necessity of watching options. it can possibly become optional
                        scope.$watch(attrs.vzZoomOnWheelOptions, function(newOptions){
                            if(angular.isObject(newOptions)){
                                angular.extend(options, newOptions);
                            }
                        });
                    }

                    lastMouseWheelEventTime = Date.now();
                    elem.bind("wheel", wheelHandler);
                }
                function cleanUp(){
                    elem.unbind("wheel", wheelHandler);
                }
            }
        }
    }
    vzZoomOnWheelDirectiveFactory.$inject = ["vzZoomAtPoint"];

})(angular);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 6/5/2015
 */


/**
 * @ngdoc module
 * @name sugarSvg
 * @description
 * Svg standard covers a lot of the programmer needs to achieve what they want via standard svg attributes.
 * However, for some simple tasks like centering text inside a `g` element, a couple of attributes are necessary
 * on the `text` element, which are not quite predictable for someone who is not familiar enough with svg standard.
 * sugerSvg is a module that provides developer with some directives that facilitate common tasks like centering
 * text elements horizontally and vertically inside `g` elements.
 *
 */
(function(angular){
    "use strict";

    angular.module("sugarSvg", [])

    /**
     * @ngdoc directive
     * @name sugarSvg.directive:ssTextCenter
     * @element text
     * @restrict A
     */
        .directive("ssTextCenter", ssTextCenterDirectiveFactory);


    function ssTextCenterDirectiveFactory(){
        return{
            restrict: "A",
            compile: function(tElem){
                tElem.attr("dx", "50%");
                tElem.attr("dy", "50%");
                tElem.attr("text-anchor", "middle");
                tElem.attr("dominant-baseline", "middle");
            }
        }
    }
})(angular);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
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
    vzElementDirective.$inject = ["vzConfig", "VzDraggableFactory"];
})();
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
(function(){
    'use strict';

    angular.module("visular.core")
        .factory("VzLinkModel", VzLinkModel)
        .directive("vzLink", vzLinkDirective);

    function VzLinkModel(){
        return function(type){
            this.source = null;
            this.target = null;
            this.middlePoints = [];
        }
    }
    function vzLinkDirective(){
        return{
            restrict: "A",
            require: "^vzDiagram",
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
            link: function(scope, elem, attrs, diagramController){

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
                    scope.srcElem = diagramController.diagram.elementsById[scope.model.source.id];
                });
                scope.$watch("model.target.id", function(){
                    scope.targetElem = diagramController.diagram.elementsById[scope.model.target.id];
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
                };


                init();
                scope.$on("$destroy", cleanup);

                function init(){
                    elem.bind("mouseup", selectElement);
                }
                function cleanup(){
                    elem.unbind("mouseup", selectElement);
                }
                function selectElement(){
                    scope.$apply(function(){
                        diagramController.select(scope.model);
                    });
                }
                function updateTargetArrow(){
                    if(scope.startPoint){
                        scope.targetArrow.rotation = 180 - scope.startPoint.theta(scope.endPoint);
                        // lets do a little math! :D
                        var rotationInRadians = scope.targetArrow.rotation * (Math.PI / 180);
                        var ARROW_SIZE = 10;
                        scope.targetArrow.translate.x = scope.endPoint.x + (ARROW_SIZE/2)*(Math.sin(rotationInRadians));
                        scope.targetArrow.translate.y = scope.endPoint.y - (ARROW_SIZE/2)*(Math.cos(rotationInRadians));
                    }

                }
            }
        }
    }
})();
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
(function(){
    angular.module("visular.core")
        .factory("VzDraggableFactory", VzDraggableFactory);

    function VzDraggableFactory($document){
        return function(domElem, containerDomElem){
            var _this = this, onDrag, onDragStart, onDragFinish, containerOffset;
            domElem = angular.element(domElem);
            containerDomElem = containerDomElem ? angular.element(containerDomElem) : $document;
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
                    x: _this.startPosition.x - domElem.offset().left,
                    y: _this.startPosition.y - domElem.offset().top
                }
                containerOffset = containerDomElem.offset();
                containerOffset.bottom = containerOffset.top + containerDomElem.height();
                containerOffset.right = containerOffset.left + containerDomElem.width();
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
                /**
                 * TODO: simplify calculation if possible
                 */
                var pageXLimitedToContainer = Math.min(Math.max(evt.pageX,containerOffset.left), containerOffset.right)
                var pageYLimitedToContainer = Math.min(Math.max(evt.pageY,containerOffset.top), containerOffset.bottom);

                _this.draggedPosition = {
                    x: pageXLimitedToContainer - _this.localOffset.x - containerOffset.left,
                    y: pageYLimitedToContainer - _this.localOffset.y - containerOffset.top
                };
                if(angular.isFunction(onDrag)){
                    scope.$apply(function(){
                        onDrag.call(_this, evt);
                    })
                }
            }
        }
    }
    VzDraggableFactory.$inject = ["$document"];
})();
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 7/5/2015
 */


(function(){
    "use strict";

    angular.module("visular.core")
            .service("vzSvgUtils", VzSvgUtilsFactory);

    function VzSvgUtilsFactory(){
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.transformPoint = function(x, y, svgMatrix){
            var point = svg.createSVGPoint();
            point.x = x;
            point.y = y;
            return point.matrixTransform(svgMatrix);
        }
    }
}());
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
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
    VzDiagramModel.$inject = ["VzElementModel", "VzLinkModel"];
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
    vzSelectedItemOverlayDirective.$inject = ["vzSvgUtils", "VzElementModel"];
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
            controller: ["$element", "$scope", "$attrs", function($element, $scope, $attrs){
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

            }],
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
    vzDiagramDirective.$inject = ["$compile", "$parse", "$document"];
})();
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */


(function(angular){
    "use strict";

    /**
     * @ngdoc directive
     * @name pan
     *
     * @description
     * _Please update the description and restriction._
     *
     * @restrict A
     * */
    angular.module('visular.pan')
        .directive('vzPan', ["$document", "$parse", function ($document, $parse) {
            return {
                restrict: 'A',
                require: ['vzPan', 'vzDiagram'],
                controller: 'VzPanCtrl',
                link: function (scope, elem, attrs, ctrls) {
                    var panCtrl = ctrls[0],
                        diagramCtrl = ctrls[1];
                    scope.$watch(panCtrl.isPanActive, function(isActive){
                        console.log("pan active changed", isActive)
                        if(isActive){
                            diagramCtrl.elem.addClass("vz-pan");
                            diagramCtrl.elem.bind("mousedown", mousedownHanlder);
                        }
                        else{
                            diagramCtrl.elem.removeClass("vz-pan");
                            diagramCtrl.elem.removeClass("vz-pan-active");
                            diagramCtrl.elem.unbind("mousedown", mousedownHanlder);
                        }
                    });

                    scope.$watch(attrs.vzPan, function(isActive){
                        if(angular.isDefined(isActive)){
                            panCtrl.setPanActive(isActive);
                        }
                    });


                    init();
                    scope.$on("$destroy",cleanup);


                    var panStartingPoint, startingPan;
                    function mousedownHanlder(event){
                        diagramCtrl.elem.addClass("vz-pan-active");
                        panStartingPoint = {
                            x: event.originalEvent.pageX,
                            y: event.originalEvent.pageY
                        };
                        startingPan = {x: diagramCtrl.getCTM().e, y: diagramCtrl.getCTM().f};
                        $document.bind("mousemove", mouseMoveHandler);
                        $document.one("mouseup", function(){
                            diagramCtrl.elem.removeClass("vz-pan-active");
                            $document.unbind("mousemove", mouseMoveHandler);
                        });
                    }
                    function mouseMoveHandler(event){
                        var xDiff = event.originalEvent.pageX - panStartingPoint.x;
                        var yDiff = event.originalEvent.pageY - panStartingPoint.y;
                        var currentCTM = diagramCtrl.getCTM();
                        scope.$apply(function(){
                            currentCTM.e = startingPan.x + xDiff;
                            currentCTM.f = startingPan.y + yDiff;
                        });
                        console.log("mousemove", xDiff, yDiff);
                    }


                    function keydownHandler(event){
                        if(event.keyCode == 32){
                            scope.$apply(function(){
                                panCtrl.setPanActive(true);
                            });
                            event.preventDefault();
                        }
                    }
                    function keyupHanlder(event){
                        if(event.keyCode == 32){
                            scope.$apply(function(){
                                panCtrl.setPanActive(false);
                            });
                            event.preventDefault();
                        }
                    }
                    function init(){
                        $document.bind("keydown", keydownHandler);
                        $document.bind("keyup", keyupHanlder);
                    }
                    function cleanup(){
                        $document.unbind("keydown", keydownHandler);
                        $document.unbind("keyup", keyupHanlder);
                    }
                }
            };
        }]);

})(angular);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
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
    vzResizeHandleDirectiveProvider.$inject = ["VzDraggableFactory"];

})(angular);


/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */
/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 6/6/2015
 */


(function(angular){
    "use strict";

    /**
     * @ngdoc directive
     * @name vzResizeHandles
     *
     * @description
     * Adds default overlay for resize handles. It will adds all possible 8 resize handles.
     *
     * @restrict A
     * */
    angular.module("visular.resizeHandles")
        .directive("vzResizeHandles", vzResizeHandlesDirective);

    function vzResizeHandlesDirective(){
        return{
            restrict: "A",
            require: "vzDiagram",
            compile: function(tElem){
                tElem.append(
                    '<div vz-selected-item-overlay>' +
                    '   <vz-resize-handle vz-overlay-handle="top left"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="top"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="top right"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="right"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="bottom right"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="bottom"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="bottom left"></vz-resize-handle>' +
                    '   <vz-resize-handle vz-overlay-handle="left"></vz-resize-handle>' +
                    '</div>');
            }
        }
    }

})(angular);
/*!
 * Visular
 * https://github.com/alirezamirian/visular
 * @license MIT
 * v0.0.1
 */



(function(angular){

    /**
     * @ngdoc controller
     * @name Pan
     *
     * @description
     * _Please update the description and dependencies._
     *
     * @requires $scope
     * */
    angular.module('visular.pan')
        .controller('VzPanCtrl', VzPanCtrl);


    function VzPanCtrl(){
        var isPanActive = false;
        this.setPanActive = function(active){
            isPanActive = (angular.isDefined(active) ? active : true);
        }
        this.isPanActive = function(){
            return isPanActive;
        }
    }
})(angular);