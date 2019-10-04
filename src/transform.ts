/* eslint-disable indent */

import * as ts from 'typescript';

const visitNode = (node: ts.Node, program: ts.Program): ts.Node => {
  const typeChecker = program.getTypeChecker();
  if (!ts.isInterfaceDeclaration(node)) {
    return node;
  }

  const type = typeChecker.getTypeAtLocation(node);

  // TODO unsupported cases: array type (convert array to tuple), object literals type
  const schema = ts.createObjectLiteral(
    type.getProperties().map(property => {
      const propertyType = property.valueDeclaration
        .getText()
        .split(': ')[1]
        .slice(0, -1);

      const propertyTypeConstructor = propertyType
        .charAt(0)
        .toUpperCase()
        .concat(propertyType.slice(1));

      const propertyTypeIdentifier = ts.createIdentifier(
        propertyTypeConstructor,
      );

      return ts.createPropertyAssignment(
        property.getName(),
        propertyTypeIdentifier,
      );
    }),
  );

  return schema;
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
