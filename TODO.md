#Zoom
- Change the semantic of zooming. Instead of considering `zoom` and `pan` az API of diagram, provide just an API to setting 
and getting CTM, then in zoom module, provide a service for zooming, a directive that uses that service to provide zooming 
functionality through wheel and pinch events, and a directive to expose API for getting and setting zoom (which ables creating
zooming UI control by simple bindings to that API)


#Other
- Encapsulate geometry.js into an angular service
- Make links selectable