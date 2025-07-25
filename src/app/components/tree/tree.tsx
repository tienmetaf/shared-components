"use client"

import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TreeNode, TreeConfig, TreeSelectionMode } from './types'
import { getAllChildIds, getParentNodes } from './utils'

interface TreeProps {
    data: TreeNode[]
    config?: TreeConfig
    selectedValues?: string[]
    onSelectionChange?: (values: string[]) => void
    className?: string
}

interface TreeNodeProps {
    node: TreeNode
    depth: number
    isSelected: boolean
    isExpanded: boolean
    config: TreeConfig
    selectedValues: string[]
    onSelectionChange: (values: string[]) => void
    onToggleExpanded: (nodeId: string) => void
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({
                                                        node,
                                                        depth,
                                                        isSelected,
                                                        isExpanded,
                                                        config,
                                                        selectedValues,
                                                        onSelectionChange,
                                                        onToggleExpanded,
                                                    }) => {
    const hasChildren = node.children && node.children.length > 0
    const isCollapsible = config.collapsible !== false && hasChildren

    const handleToggle = useCallback(() => {
        if (isCollapsible) {
            onToggleExpanded(node.id.toString())
        }
    }, [isCollapsible, node.id, onToggleExpanded])

    const handleSelection = useCallback((checked: boolean) => {
        if (config.selectionMode === 'none') return

        let newSelection = [...selectedValues]

        if (config.selectionMode === 'single') {
            newSelection = checked ? [node.id.toString()] : []
        } else if (config.selectionMode === 'multiple') {
            if (checked) {
                // Add node and all children
                const childIds = getAllChildIds(node).map(id => id.toString())
                newSelection = [...new Set([...newSelection, ...childIds])]
            } else {
                // Remove node and all children
                const childIds = getAllChildIds(node).map(id => id.toString())
                newSelection = newSelection.filter(id => !childIds.includes(id))
            }
        }

        onSelectionChange(newSelection)
    }, [config.selectionMode, node, selectedValues, onSelectionChange])

    const renderIcon = () => {
        if (config.iconComponent) {
            return <config.iconComponent node={node} isExpanded={isExpanded} />
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

    const renderContent = () => {
        if (config.renderNode) {
            return config.renderNode(node, {
                isSelected,
                isExpanded,
                hasChildren: !!hasChildren,
                depth
            })
        }

        return (
            <div className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 transition-colors">
                {config.showCheckboxes && config.selectionMode !== 'none' && (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={handleSelection}
                        disabled={node.disabled}
                    />
                )}

                <div className="flex items-center gap-1 flex-1 cursor-pointer" onClick={handleToggle}>
                    {isCollapsible && (
                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                            {isExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                            ) : (
                                <ChevronRight className="w-3 h-3" />
                            )}
                        </Button>
                    )}

                    {!isCollapsible && hasChildren && (
                        <div className="w-6 h-6" /> // Spacer for alignment
                    )}

                    {renderIcon()}

                    <span className={cn(
                        "select-none",
                        node.disabled && "text-gray-400",
                        isSelected && "font-medium"
                    )}>
            {node.label}
          </span>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div style={{ paddingLeft: `${depth * 20}px` }}>
                {renderContent()}
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map(child => (
                        <TreeNodeComponent
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            isSelected={selectedValues.includes(child.id.toString())}
                            isExpanded={isExpanded}
                            config={config}
                            selectedValues={selectedValues}
                            onSelectionChange={onSelectionChange}
                            onToggleExpanded={onToggleExpanded}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export const Tree: React.FC<TreeProps> = ({
                                              data,
                                              config = {},
                                              selectedValues = [],
                                              onSelectionChange = () => {},
                                              className
                                          }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

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

    const finalConfig: TreeConfig = {
        selectionMode: 'multiple',
        collapsible: true,
        showCheckboxes: true,
        showIcons: true,
        ...config
    }

    return (
        <div className={cn("tree-container", className)}>
            {data.map(node => (
                <TreeNodeComponent
                    key={node.id}
                    node={node}
                    depth={0}
                    isSelected={selectedValues.includes(node.id.toString())}
                    isExpanded={expandedNodes.has(node.id.toString())}
                    config={finalConfig}
                    selectedValues={selectedValues}
                    onSelectionChange={onSelectionChange}
                    onToggleExpanded={handleToggleExpanded}
                />
            ))}
        </div>
    )
}