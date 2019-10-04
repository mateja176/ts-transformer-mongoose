/* eslint-disable indent */

import * as ts from 'typescript';

const visitNode = (node: ts.Node, program: ts.Program): ts.Node => {
  if (!ts.isInterfaceDeclaration(node)) {
    return node;
  }

  const typeChecker = program.getTypeChecker();

  const type = typeChecker.getTypeAtLocation(node);

  const schema = type.getProperties().map(property => {
    const prop = property.valueDeclaration
      .getText()
      .replace(/^\w+: /, '')
      .replace(/;$/, '')
      .replace(/;/g, ',')
      .replace(/^\w/g, match =>
        match
          .charAt(0)
          .toUpperCase()
          .concat(match.slice(1)),
      )
      .replace(/:\s*\w/g, match =>
        match.slice(0, -1).concat(match.slice(-1).toUpperCase()),
      )
      .replace(/(\w+)\[\]/g, (match, arrayType) => `[${arrayType}]`);

    return `${property.getName()}: ${prop}`;
  });

  return ts.createIdentifier(
    `export const ${node.name.getText()} = {
  ${schema}
}`,
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
