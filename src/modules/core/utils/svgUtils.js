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