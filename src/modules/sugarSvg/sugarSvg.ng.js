/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 6/5/2015
 */


/**
 * @ngdoc module
 * @name sugarSvg
 * @description
 * Svg standard covers a lot of the programmer needs to achieve what they want via standard svg attributes.
 * However, for some simple tasks like centering text inside a `g` element, a couple of attributes are necessary
 * on the `text` element, which are not quite predictable for someone who is not familiar enough with svg standard.
 * sugerSvg is a module that provides developer with some directives that facilitate common tasks like centering
 * text elements horizontally and vertically inside `g` elements.
 *
 */
(function(angular){
    "use strict";

    angular.module("sugarSvg", [])

    /**
     * @ngdoc directive
     * @name sugarSvg.directive:ssTextCenter
     * @element text
     * @restrict A
     */
        .directive("ssTextCenter", ssTextCenterDirectiveFactory);


    function ssTextCenterDirectiveFactory(){
        return{
            restrict: "A",
            compile: function(tElem){
                tElem.attr("dx", "50%");
                tElem.attr("dy", "50%");
                tElem.attr("text-anchor", "middle");
                tElem.attr("dominant-baseline", "middle");
            }
        }
    }
})(angular);