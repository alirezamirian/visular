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
    .directive("vzGuideline", function vzGuidelineDirective(VzGuidelineFactory, vzSvgUtils){
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
    })
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