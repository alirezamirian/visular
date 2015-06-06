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