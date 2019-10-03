/* eslint-disable indent */

import * as path from 'path';
import * as ts from 'typescript';

const indexTs = path.join(__dirname, 'index.ts');
const isKeysCallExpression = (
  node: ts.Node,
  typeChecker: ts.TypeChecker,
): node is ts.CallExpression => {
  if (!ts.isCallExpression(node)) {
    return false;
  }
  const signature = typeChecker.getResolvedSignature(node);
  if (typeof signature === 'undefined') {
    return false;
  }
  const { declaration } = signature;
  return (
    !!declaration &&
    !ts.isJSDocSignature(declaration) &&
    path.join(declaration.getSourceFile().fileName) === indexTs &&
    !!declaration.name &&
    declaration.name.getText() === 'keys'
  );
};

const visitNode = (node: ts.Node, program: ts.Program): ts.Node => {
  const typeChecker = program.getTypeChecker();
  if (!isKeysCallExpression(node, typeChecker)) {
    return node;
  }
  if (!node.typeArguments) {
    return ts.createArrayLiteral([]);
  }
  const type = typeChecker.getTypeFromTypeNode(node.typeArguments[0]);
  const properties = typeChecker.getPropertiesOfType(type);
  return ts.createArrayLiteral(
    properties.map(property => ts.createLiteral(property.name)),
  );
};

const visitNodeAndChildren = <N extends ts.Node>(
  node: N,
  program: ts.Program,
  context: ts.TransformationContext,
): N =>
  // @ts-ignore
  ts.visitEachChild(
    visitNode(node, program),
    childNode => visitNodeAndChildren(childNode, program, context),
    context,
  );

export default (program: ts.Program): ts.TransformerFactory<ts.SourceFile> => (
  context: ts.TransformationContext,
) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context);
