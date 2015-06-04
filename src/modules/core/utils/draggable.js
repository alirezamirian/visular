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
                    x: _this.startPosition.x - domElem.position().left,
                    y: _this.startPosition.y - domElem.position().top
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
})();