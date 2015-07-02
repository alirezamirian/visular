/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 6/19/2015
 */


(function(angular) {
    angular.module("visular.zoom", [])
        .directive("vzZoom", vzZoomDirectiveFactory);


    function vzZoomDirectiveFactory(){
        var deltaNormalizer = .1;
        return{
            restrict: "A",
            require: "vzDiagram",
            link: function(scope, elem, attrs, vzDiagramCtrl){

                scope.$on("$destroy", cleanUp);
                init();
                function wheelHandler(event){
                    // Inspired by https://github.com/ariutta/svg-pan-zoom
                    var point = getEventPoint(event, vzDiagramCtrl.rootSvgElem),
                        oldCTM = vzDiagramCtrl.getTransformationMatrix(),
                        relativePoint = point.matrixTransform(oldCTM.inverse()),
                        delta = event.originalEvent.deltaY,
                        newZoom = oldCTM.a - delta*deltaNormalizer,
                        modifier = vzDiagramCtrl.rootSvgElem[0].createSVGMatrix()
                            .translate(relativePoint.x, relativePoint.y)
                            .scale(newZoom/oldCTM.a)
                            .translate(-relativePoint.x, -relativePoint.y);
                    console.log(delta);
                    var newCTM = oldCTM.multiply(modifier);
                    scope.$apply(function(){
                        vzDiagramCtrl.pan.x = newCTM.e;
                        vzDiagramCtrl.pan.y = newCTM.f;
                        vzDiagramCtrl.zoom = newCTM.a;
                    });
                    return false;
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
                    elem.bind("wheel", wheelHandler);
                }
                function cleanUp(){
                    elem.unbind("wheel", wheelHandler);
                }
            }
        }
    }

})(angular);