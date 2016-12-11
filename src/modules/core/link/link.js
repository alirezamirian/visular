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