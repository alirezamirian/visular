/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/23/2015
 */


angular.module("visular.config",[])
    .provider("vzConfig", function(){

        this.markupPath = "templates"
        this.setMarkupPath = function(path){
            this.markupPath = path;
        }

        this.$get = function(){
            return this;
        }
    });