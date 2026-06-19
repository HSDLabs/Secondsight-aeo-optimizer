import TreeNode from './TreeNode'

export default function A11yPanel({ snapshot }) {
  return (
    <section className="analysis-panel structure-panel" aria-labelledby="machine-structure-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">What machines understand</p>
          <h2 id="machine-structure-title">Machine Structure</h2>
        </div>
        <span>Semantic tree</span>
      </div>

      <div className="tree-shell">
        <TreeNode node={snapshot} />
      </div>
    </section>
  )
}
