/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 6/19/2015
 */


(function(angular) {
    angular.module("visular.zoom", [])
        .directive("vzZoom", vzZoomDirectiveFactory);


    function vzZoomDirectiveFactory(){
        var zoomScaleSensitivity = .1;
        return{
            restrict: "A",
            require: "vzDiagram",
            link: function(scope, elem, attrs, vzDiagramCtrl){

                var lastMouseWheelEventTime;
                scope.$on("$destroy", cleanUp);
                init();
                function wheelHandler(event){
                    // Inspired by https://github.com/ariutta/svg-pan-zoom
                    var evt = event.originalEvent,
                        point = getEventPoint(event, vzDiagramCtrl.rootSvgElem),
                        oldCTM = vzDiagramCtrl.getTransformationMatrix(),
                        relativePoint = point.matrixTransform(oldCTM.inverse());


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

                    var modifier = vzDiagramCtrl.rootSvgElem[0].createSVGMatrix()
                        .translate(relativePoint.x, relativePoint.y)
                        .scale(newRelativeZoom)
                        .translate(-relativePoint.x, -relativePoint.y);
                    // Update cache
                    lastMouseWheelEventTime = Date.now();

                    // Make empirical adjustments for browsers that give deltaY in pixels (deltaMode=0)
                    if ('deltaMode' in event && evt.deltaMode === 0 && evt.wheelDelta) {
                        delta = evt.deltaY === 0 ? 0 :  Math.abs(evt.wheelDelta) / evt.deltaY
                    }

                    delta = -0.3 < delta && delta < 0.3 ? delta : (delta > 0 ? 1 : -1) * Math.log(Math.abs(delta) + 10) / divider
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
                    lastMouseWheelEventTime = Date.now();
                }
                function cleanUp(){
                    elem.unbind("wheel", wheelHandler);
                }
            }
        }
    }

})(angular);