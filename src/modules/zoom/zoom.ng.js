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
                var wheelPosition = {x: 0, y: 0};
                function wheelHandler(event){
                    var diaOffset = vzDiagramCtrl.elem.offset();
                    var x = event.originalEvent.pageX - diaOffset.left +5;
                    var y = event.originalEvent.pageY - diaOffset.top-2;
                    var positionChanged = false;
                    if(wheelPosition.x != x || wheelPosition.y != y){
                        console.log("position changed")
                        positionChanged = true;
                    }


                    var delta = event.originalEvent.deltaY;
                    var translation = vzDiagramCtrl.zoom.center;
                    scope.$apply(function(){
                        if(positionChanged){
                            vzDiagramCtrl.zoom.center.x = vzDiagramCtrl.zoom.center.x + (x-vzDiagramCtrl.zoom.center.x)/vzDiagramCtrl.zoom.factor;
                            vzDiagramCtrl.zoom.center.y = vzDiagramCtrl.zoom.center.y + (y-vzDiagramCtrl.zoom.center.y)/vzDiagramCtrl.zoom.factor;
                        }
                        vzDiagramCtrl.zoom.factor *= (1 - deltaNormalizer * delta);
                    });
                    wheelPosition.x = x;
                    wheelPosition.y = y;
                    return false;
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