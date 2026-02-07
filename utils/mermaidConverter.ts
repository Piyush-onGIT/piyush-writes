import { visit } from 'unist-util-visit';

export function rehypeMermaidBlocks() {
  return (tree: any) => {
    visit(tree, 'element', (node, index, parent) => {
      if (
        node.tagName === 'pre' &&
        node.children?.[0]?.tagName === 'code' &&
        node.children[0].properties?.className?.includes('language-mermaid')
      ) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['mermaid'] },
          children: node.children[0].children
        };
      }
    });
  };
}
