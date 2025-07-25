import type { UniqueIdentifier } from '@dnd-kit/core'
import type { Control, FieldValues, Path } from 'react-hook-form'

export interface TreeNode {
    id: UniqueIdentifier
    label: string
    children?: TreeNode[]
    data?: any
    disabled?: boolean
    collapsible?: boolean
}

export interface FlattenedTreeNode extends TreeNode {
    parentId: UniqueIdentifier | null
    depth: number
    index: number
    collapsed?: boolean
}

export type TreeSelectionMode = 'single' | 'multiple' | 'none'

export interface TreeConfig {
    selectionMode?: TreeSelectionMode
    collapsible?: boolean
    showCheckboxes?: boolean
    showIcons?: boolean
    iconComponent?: React.ComponentType<{ node: TreeNode; isExpanded: boolean }>
    renderNode?: (node: TreeNode, options: {
        isSelected: boolean
        isExpanded: boolean
        hasChildren: boolean
        depth: number
    }) => React.ReactNode
}

export interface SortableTreeConfig extends TreeConfig {
    removable?: boolean
    showMoveButtons?: boolean
    showDropIndicator?: boolean
    onRemove?: (nodeId: UniqueIdentifier) => void
    onMove?: (nodeId: UniqueIdentifier, direction: 'up' | 'down' | 'indent' | 'outdent') => void
}

export interface TreeFieldConfig<T extends FieldValues> {
    name: Path<T>
    label: string
    data: TreeNode[]
    config?: TreeConfig
}

export interface SortableTreeFieldConfig<T extends FieldValues> {
    name: Path<T>
    label: string
    data: TreeNode[]
    config?: SortableTreeConfig
}

export interface TreeRenderProps<T extends FieldValues> {
    fieldConfig: TreeFieldConfig<T>
    formControl: Control<T>
    selectedValues: UniqueIdentifier[]
    onSelectionChange: (values: UniqueIdentifier[]) => void
    expandedNodes: Set<UniqueIdentifier>
    onToggleExpanded: (nodeId: UniqueIdentifier) => void
}

export interface SortableTreeRenderProps<T extends FieldValues> {
    fieldConfig: SortableTreeFieldConfig<T>
    formControl: Control<T>
    treeData: TreeNode[]
    onTreeChange: (data: TreeNode[]) => void
    expandedNodes: Set<UniqueIdentifier>
    onToggleExpanded: (nodeId: UniqueIdentifier) => void
}