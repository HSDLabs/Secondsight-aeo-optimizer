import TreeNode from './TreeNode'

export default function A11yPanel({ snapshot, screenshotMeta, selectedNodeId, onSelectNode }) {
  const selectedPath = findNodePath(snapshot, selectedNodeId)

  return (
    <section className="analysis-panel structure-panel" aria-labelledby="machine-structure-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">What machines understand</p>
          <h2 id="machine-structure-title">Machine Structure</h2>
        </div>
        <span>{selectedNodeId ? 'Linked selection' : 'Semantic tree'}</span>
      </div>

      <div className="tree-shell">
        <TreeNode
          node={snapshot}
          screenshotMeta={screenshotMeta}
          selectedNodeId={selectedNodeId}
          selectedPath={selectedPath}
          onSelectNode={onSelectNode}
        />
      </div>
    </section>
  )
}

function findNodePath(node, nodeId, path = []) {
  if (!node || !nodeId) return []

  const nextPath = [...path, node.id]
  if (node.id === nodeId) return nextPath

  for (const child of node.children || []) {
    const childPath = findNodePath(child, nodeId, nextPath)
    if (childPath.length) return childPath
  }

  return []
}
