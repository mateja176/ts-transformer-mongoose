"use strict";
/* eslint-disable indent */
exports.__esModule = true;
var path = require("path");
var ts = require("typescript");
var indexTs = path.join(__dirname, 'index.ts');
var isKeysCallExpression = function (node, typeChecker) {
    if (!ts.isCallExpression(node)) {
        return false;
    }
    var signature = typeChecker.getResolvedSignature(node);
    if (typeof signature === 'undefined') {
        return false;
    }
    var declaration = signature.declaration;
    return (!!declaration &&
        !ts.isJSDocSignature(declaration) &&
        path.join(declaration.getSourceFile().fileName) === indexTs &&
        !!declaration.name &&
        declaration.name.getText() === 'keys');
};
var visitNode = function (node, program) {
    var typeChecker = program.getTypeChecker();
    if (!isKeysCallExpression(node, typeChecker)) {
        return node;
    }
    if (!node.typeArguments) {
        return ts.createArrayLiteral([]);
    }
    var type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
    var properties = typeChecker.getPropertiesOfType(type);
    return ts.createArrayLiteral(properties.map(function (property) { return ts.createLiteral(property.name); }));
};
var visitNodeAndChildren = function (node, program, context) {
    // @ts-ignore
    return ts.visitEachChild(visitNode(node, program), function (childNode) { return visitNodeAndChildren(childNode, program, context); }, context);
};
exports["default"] = (function (program) { return function (context) { return function (file) { return visitNodeAndChildren(file, program, context); }; }; });
