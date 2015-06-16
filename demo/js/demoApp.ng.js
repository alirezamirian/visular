/**
 * @author: alireza mirian <alireza.mirian@gmail.com>
 * @date: 3/19/2015
 */


angular.module("demoApp", ['visular', 'ngMaterial', 'ngMessages'])

    .config(function(vzConfigProvider){
        vzConfigProvider.setMarkupPath("../templates");
    })


    .controller("mainController", function(VzDiagramModel, VzElementModel){
        this.diagram = new VzDiagramModel();
        var userTask1 = new VzElementModel("UserTask");
        var userTask2 = new VzElementModel("UserTask");
        var startNoneEvent = new VzElementModel("StartNoneEvent");
        var endNoneEvent = new VzElementModel("EndNoneEvent");

        startNoneEvent.position.x = 100;
        startNoneEvent.position.y = 125;
        startNoneEvent.size.width = 50;
        startNoneEvent.size.height = 50;
        startNoneEvent.name = "Start";

        endNoneEvent.position.x = 600;
        endNoneEvent.position.y = 125;
        endNoneEvent.size.width = 50;
        endNoneEvent.size.height = 50;

        userTask1.size.width = 150;
        userTask1.position.x = 200;
        userTask1.position.y = 100;
        userTask1.name = "Task 1";

        userTask2.size.width = 150;
        userTask2.position.x = 400;
        userTask2.position.y = 100;
        userTask2.name = "Task 2";


        this.diagram.addElement(startNoneEvent);
        this.diagram.addElement(userTask1);
        this.diagram.addElement(userTask2);
        this.diagram.addElement(endNoneEvent);

        this.diagram.addLink(startNoneEvent, userTask1);
        this.diagram.addLink(userTask1, userTask2);
        this.diagram.addLink(userTask2, endNoneEvent);

    })
