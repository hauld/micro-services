import {
    renderGraphiQL,
    sendMultipartResponseResult,
    sendResponseResult,
    shouldRenderGraphiQL,
} from "graphql-helix";
import {
    getGraphQLParameters,
    processRequest
} from "graphql-helix";
import { execute, subscribe, GraphQLError } from "graphql";

export default function GraphqlAdapter(service) {
    var _service = service;
    return async function grapqlMiddleware(req, res) {
        const request = {
            body: req.body,
            headers: req.headers,
            method: req.method,
            query: req.query,
        };
        
        if (shouldRenderGraphiQL(request)) {
            res.send(
                renderGraphiQL({
                subscriptionsEndpoint: _service.subEndpoint || "ws://localhost:4000/graphql",
                })
            );
            return;
        }
        
        const { operationName, query, variables } = getGraphQLParameters(request);

        const result = await processRequest({
                                                operationName,
                                                query,
                                                variables,
                                                request,
                                                schema: _service.schema,
                                                rootValueFactory: _service.getRootValue
                                            });
        //const result = await _service.serve(request);

        if (result.type === "RESPONSE") {
            sendResponseResult(result, res);
        } else if (result.type === "MULTIPART_RESPONSE") {
            sendMultipartResponseResult(result, res);
        } else {
            res.status(422);
            res.json({
                errors: [new GraphQLError("Subscriptions should be sent over WebSocket.")],
            });
        }
    }
}