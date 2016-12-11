Visular is a javascript diagramming toolkit based on AngularJS

# IMPORTANT:
I started writing a Visular about two years ago, as a declarative and extensible
angular toolkit for diagramming. It just left its development too early, but here is my 
first thoughts and implementations left out for any developer who might be interested :) 
take a look at the [demo](https://alirezamirian.github.io/visular/demo/)

The idea is to add common functionality to you designer in a declarative manner as much as 
possible. For example if you want to enable panning (while holding space key), you just add
`vz-pan` directive into your `vz-diagram`, or you can enable zomming on wheel event by 
`vz-zoom-on-wheel`. Another common feature for diagramming environments is to have guide lines 
(aka magnets) which helps user position elements aligned with each other. This can be added
to a `vz-diagram` component simply by adding a `vz-guideline` directive.

``` html
   <vz-diagram vz-pan vz-zoom-on-wheel vz-guideline></vz-diagram>
```

While these kind of directives are meant to be shipped with Visular out of the box (in a modular structure),
the design of the library must be such that these utilities and directives are implemented completely on top of public 
api exposed by core components of Visular such as `vz-diagram`. This way, any other special case (such as domain 
specific position guidelines and magnets) can be implemented with the same api.

# Why?
TODO
# Features
TODO