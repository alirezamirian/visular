/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/19/2015
 */


angular.module("demoApp", ['visular'])

    .config(function(vzConfigProvider){
        vzConfigProvider.setMarkupPath("../templates");
    })


    .controller("mainController", function(VzDiagramModel, VzElementModel){
        this.diagram = new VzDiagramModel();
        var elems = [
            new VzElementModel("UserTask"),
            new VzElementModel("UserTask")
        ];
        elems[0].position.x = 100;
        elems[0].position.y = 200;
        elems[0].name = "test1";
        elems[1].name = "test2";

        this.diagram.addElement(elems[0]);
        this.diagram.addElement(elems[1]);

        this.diagram.addLink(elems[0], elems[1]);

    })
