/* eslint-disable indent */

import { capitalize } from 'lodash';
import * as ts from 'typescript';

const visitNode = (node: ts.Node, program: ts.Program): ts.Node => {
  const typeChecker = program.getTypeChecker();
  if (!ts.isInterfaceDeclaration(node)) {
    return node;
  }

  const type = typeChecker.getTypeAtLocation(node);

  const schema = ts.createObjectLiteral(
    type.getProperties().map(property => {
      const propertyType = property.valueDeclaration
        .getText()
        .replace(/^\w+: /, '')
        .replace(/;$/, '')
        .replace(/;/g, ',')
        .replace(/^\w/g, capitalize)
        .replace(/:\s*\w/g, match =>
          match.slice(0, -1).concat(match.slice(-1).toUpperCase()),
        )
        .replace(/(\w+)\[\]/g, (match, arrayType) => `[${arrayType}]`);

      const propertyTypeIdentifier = ts.createIdentifier(propertyType);

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
