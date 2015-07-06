


(function(angular){

    /**
     * @ngdoc controller
     * @name Pan
     *
     * @description
     * _Please update the description and dependencies._
     *
     * @requires $scope
     * */
    angular.module('visular.pan')
        .controller('VzPanCtrl', VzPanCtrl);


    function VzPanCtrl(){
        var isPanActive = false;
        this.setPanActive = function(active){
            isPanActive = (angular.isDefined(active) ? active : true);
        }
        this.isPanActive = function(){
            return isPanActive;
        }
    }
})(angular);