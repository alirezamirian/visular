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

})(angular);