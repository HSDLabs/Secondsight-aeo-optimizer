import { useState } from 'react'

export default function TreeNode({ node, level = 0 }) {
  const [open, setOpen] = useState(level < 2)

  if (!node) return null

  const hasChildren = node.children?.length > 0
  const label = getLabel(node.role)
  const name = cleanName(node.name, label)

  return (
    <div className="tree-node" style={{ '--level': level }}>
      <button
        className="tree-node-label"
        type="button"
        disabled={!hasChildren}
        onClick={() => hasChildren && setOpen(!open)}
        aria-expanded={hasChildren ? open : undefined}
      >
        <span className="tree-caret">{hasChildren ? (open ? 'v' : '>') : '-'}</span>
        <span className="tree-role">{label}</span>
        {name && <span className="tree-name">{name}</span>}
      </button>

      {open &&
        node.children?.map((child, idx) => (
          <TreeNode
            key={`${child.role || 'node'}-${idx}`}
            node={child}
            level={level + 1}
          />
        ))}
    </div>
  )
}

function getLabel(role = '') {
  const labels = {
    document: 'Document',
    header: 'Header',
    nav: 'Navigation',
    main: 'Main Content',
    section: 'Section',
    article: 'Article',
    footer: 'Footer',
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    a: 'Link',
    button: 'Button',
    img: 'Image',
    form: 'Form',
    input: 'Input'
  }

  return labels[role] || humanize(role || 'Node')
}

function humanize(value) {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function cleanName(value = '', label) {
  const squashed = value.replace(/\s+/g, ' ').trim()
  if (!squashed || squashed.toLowerCase() === label.toLowerCase()) return ''
  if (squashed.length <= 42) return squashed
  return `${squashed.slice(0, 39).trim()}...`
}
