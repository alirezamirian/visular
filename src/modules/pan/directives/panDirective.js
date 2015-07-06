

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
        .directive('vzPan', function ($document, $parse) {
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

                    function mousedownHanlder(event){
                        diagramCtrl.elem.addClass("vz-pan-active");
                        $document.bind("mousemove", mouseMoveHandler);
                        $document.one("mouseup", function(){
                            diagramCtrl.elem.removeClass("vz-pan-active");
                            $document.unbind("mousemove", mouseMoveHandler);
                        })
                    }
                    function mouseMoveHandler(event){
                        console.log("mousemove");
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
        });

})(angular);