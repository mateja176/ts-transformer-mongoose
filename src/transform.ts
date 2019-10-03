/* eslint-disable indent */

import * as ts from 'typescript';

const visitNode = (node: ts.Node, program: ts.Program): ts.Node => {
  const typeChecker = program.getTypeChecker();
  if (!ts.isInterfaceDeclaration(node)) {
    return node;
  }
  return ts.createStringLiteral(node.name.text);
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
