"use client"

import React, { useState, useCallback, useMemo } from 'react'
import {
    DndContext,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    PointerSensor,
    useSensor,
    useSensors,
    MeasuringStrategy,
    DropAnimation,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    useSortable,
    SortableContext as SortableContextProvider,
} from '@dnd-kit/sortable'
import {
    ChevronRight,
    ChevronDown,
    Folder,
    File,
    Trash2,
    ChevronUp,
    ChevronDown as MoveDown,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TreeNode, SortableTreeConfig, FlattenedTreeNode } from './types'
import { flattenTree, removeNodeById, moveNode } from './utils'

interface SortableTreeProps {
    data: TreeNode[]
    config?: SortableTreeConfig
    onDataChange?: (data: TreeNode[]) => void
    className?: string
}

interface SortableTreeItemProps {
    node: FlattenedTreeNode
    config: SortableTreeConfig
    onToggleExpanded: (nodeId: string) => void
    onRemove?: (nodeId: string) => void
    onMove?: (nodeId: string, direction: 'up' | 'down' | 'indent' | 'outdent') => void
    isOverlay?: boolean
}

const dropAnimationConfig: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.4',
            },
        },
    }),
}

const SortableTreeItem: React.FC<SortableTreeItemProps> = ({
                                                               node,
                                                               config,
                                                               onToggleExpanded,
                                                               onRemove,
                                                               onMove,
                                                               isOverlay = false,
                                                           }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: node.id,
        data: {
            type: 'TreeNode',
            node,
        },
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const hasChildren = node.children && node.children.length > 0
    const isCollapsible = config.collapsible !== false && hasChildren

    const handleToggle = useCallback(() => {
        if (isCollapsible) {
            onToggleExpanded(node.id.toString())
        }
    }, [isCollapsible, node.id, onToggleExpanded])

    const renderIcon = () => {
        if (config.iconComponent) {
            return <config.iconComponent node={node} isExpanded={!node.collapsed} />
        }

        if (config.showIcons !== false) {
            if (hasChildren) {
                return <Folder className="w-4 h-4" />
            } else {
                return <File className="w-4 h-4" />
            }
        }

        return null
    }

    const renderMoveButtons = () => {
        if (!config.showMoveButtons) return null

        return (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => onMove?.(node.id.toString(), 'up')}
                    title="Move up"
                >
                    <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => onMove?.(node.id.toString(), 'down')}
                    title="Move down"
                >
                    <MoveDown className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => onMove?.(node.id.toString(), 'indent')}
                    title="Increase indent"
                >
                    <ArrowRight className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => onMove?.(node.id.toString(), 'outdent')}
                    title="Decrease indent"
                >
                    <ArrowLeft className="w-3 h-3" />
                </Button>
            </div>
        )
    }

    const renderContent = () => {
        if (config.renderNode) {
            return config.renderNode(node, {
                isSelected: false,
                isExpanded: !node.collapsed,
                hasChildren: !!hasChildren,
                depth: node.depth
            })
        }

        return (
            <div className={cn(
                "flex items-center gap-2 py-2 px-2 rounded group transition-colors",
                "hover:bg-gray-100",
                isDragging && "opacity-40"
            )}>
                <div
                    className="flex items-center gap-1 flex-1 cursor-grab active:cursor-grabbing"
                    ref={setNodeRef}
                    style={style}
                    {...attributes}
                    {...listeners}
                >
                    {isCollapsible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0"
                            onClick={handleToggle}
                        >
                            {node.collapsed ? (
                                <ChevronRight className="w-3 h-3" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                        </Button>
                    )}

                    {!isCollapsible && hasChildren && (
                        <div className="w-6 h-6" />
                    )}

                    {renderIcon()}

                    <span className={cn(
                        "select-none flex-1",
                        node.disabled && "text-gray-400"
                    )}>
            {node.label}
          </span>
                </div>

                {renderMoveButtons()}

                {config.removable && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        onClick={() => onRemove?.(node.id.toString())}
                        title="Remove"
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div style={{ paddingLeft: `${node.depth * 20}px` }}>
            {renderContent()}
        </div>
    )
}

export const SortableTree: React.FC<SortableTreeProps> = ({
                                                              data,
                                                              config = {},
                                                              onDataChange = () => {},
                                                              className
                                                          }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
    const [activeNode, setActiveNode] = useState<FlattenedTreeNode | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3,
            },
        })
    )

    const finalConfig: SortableTreeConfig = {
        collapsible: true,
        removable: true,
        showMoveButtons: true,
        showDropIndicator: true,
        showIcons: true,
        ...config
    }

    const flattenedTree = useMemo(() => {
        return flattenTree(data, null, 0, expandedNodes)
    }, [data, expandedNodes])

    const sortableIds = useMemo(() => {
        return flattenedTree.map(node => node.id)
    }, [flattenedTree])

    const handleToggleExpanded = useCallback((nodeId: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev)
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId)
            } else {
                newSet.add(nodeId)
            }
            return newSet
        })
    }, [])

    const handleRemove = useCallback((nodeId: string) => {
        const newData = removeNodeById(data, nodeId)
        onDataChange(newData)
        finalConfig.onRemove?.(nodeId)
    }, [data, onDataChange, finalConfig])

    const handleMove = useCallback((nodeId: string, direction: 'up' | 'down' | 'indent' | 'outdent') => {
        const newData = moveNode(data, nodeId, direction)
        onDataChange(newData)
        finalConfig.onMove?.(nodeId, direction)
    }, [data, onDataChange, finalConfig])

    const handleDragStart = ({ active }: DragStartEvent) => {
        const activeNode = flattenedTree.find(node => node.id === active.id)
        setActiveNode(activeNode || null)
    }

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveNode(null)

        if (!over || active.id === over.id) {
            return
        }

        // Handle drag and drop logic here
        // This is a simplified version - you might want to implement more sophisticated logic
        console.log('Drag ended:', { active: active.id, over: over.id })
    }

    return (
        <div className={cn("sortable-tree-container", className)}>
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
            >
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                    {flattenedTree.map(node => (
                        <SortableTreeItem
                            key={node.id}
                            node={node}
                            config={finalConfig}
                            onToggleExpanded={handleToggleExpanded}
                            onRemove={handleRemove}
                            onMove={handleMove}
                        />
                    ))}
                </SortableContext>

                <DragOverlay dropAnimation={dropAnimationConfig}>
                    {activeNode && (
                        <SortableTreeItem
                            node={activeNode}
                            config={finalConfig}
                            onToggleExpanded={handleToggleExpanded}
                            isOverlay
                        />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    )
}