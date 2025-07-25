import type { UniqueIdentifier } from '@dnd-kit/core'
import type { TreeNode, FlattenedTreeNode } from './types'

export function flattenTree(
    items: TreeNode[],
    parentId: UniqueIdentifier | null = null,
    depth = 0,
    collapsedItems: Set<UniqueIdentifier> = new Set()
): FlattenedTreeNode[] {
    return items.reduce<FlattenedTreeNode[]>((acc, item, index) => {
        const flattenedItem: FlattenedTreeNode = {
            ...item,
            parentId,
            depth,
            index,
            collapsed: collapsedItems.has(item.id)
        }

        acc.push(flattenedItem)

        if (item.children && item.children.length > 0 && !collapsedItems.has(item.id)) {
            acc.push(...flattenTree(item.children, item.id, depth + 1, collapsedItems))
        }

        return acc
    }, [])
}

export function findNodeById(nodes: TreeNode[], id: UniqueIdentifier): TreeNode | null {
    for (const node of nodes) {
        if (node.id === id) return node
        if (node.children) {
            const found = findNodeById(node.children, id)
            if (found) return found
        }
    }
    return null
}

export function removeNodeById(nodes: TreeNode[], id: UniqueIdentifier): TreeNode[] {
    return nodes.reduce<TreeNode[]>((acc, node) => {
        if (node.id === id) return acc

        const updatedNode = { ...node }
        if (node.children) {
            updatedNode.children = removeNodeById(node.children, id)
        }

        acc.push(updatedNode)
        return acc
    }, [])
}

export function moveNodeInArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
    const result = [...array]
    const [movedItem] = result.splice(fromIndex, 1)
    result.splice(toIndex, 0, movedItem)
    return result
}

export function moveNode(
    nodes: TreeNode[],
    nodeId: UniqueIdentifier,
    direction: 'up' | 'down' | 'indent' | 'outdent'
): TreeNode[] {
    const findAndMoveNode = (
        nodeList: TreeNode[],
        parentList?: TreeNode[]
    ): { nodes: TreeNode[]; moved: boolean } => {
        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i]

            if (node.id === nodeId) {
                const newNodes = [...nodeList]

                switch (direction) {
                    case 'up':
                        if (i > 0) {
                            return {
                                nodes: moveNodeInArray(newNodes, i, i - 1),
                                moved: true
                            }
                        }
                        break
                    case 'down':
                        if (i < newNodes.length - 1) {
                            return {
                                nodes: moveNodeInArray(newNodes, i, i + 1),
                                moved: true
                            }
                        }
                        break
                    case 'indent':
                        if (i > 0) {
                            const prevNode = newNodes[i - 1]
                            if (!prevNode.children) prevNode.children = []
                            prevNode.children.push(node)
                            newNodes.splice(i, 1)
                            return { nodes: newNodes, moved: true }
                        }
                        break
                    case 'outdent':
                        if (parentList) {
                            const parentIndex = parentList.findIndex(p => p.children === nodeList)
                            if (parentIndex !== -1) {
                                parentList.splice(parentIndex + 1, 0, node)
                                newNodes.splice(i, 1)
                                return { nodes: newNodes, moved: true }
                            }
                        }
                        break
                }

                return { nodes: newNodes, moved: false }
            }

            if (node.children) {
                const result = findAndMoveNode(node.children, nodeList)
                if (result.moved) {
                    return {
                        nodes: newNodes.map(n => n.id === node.id ? { ...n, children: result.nodes } : n),
                        moved: true
                    }
                }
            }
        }

        return { nodes: nodeList, moved: false }
    }

    return findAndMoveNode(nodes).nodes
}

export function getNodePath(nodes: TreeNode[], nodeId: UniqueIdentifier): UniqueIdentifier[] {
    const findPath = (nodeList: TreeNode[], path: UniqueIdentifier[] = []): UniqueIdentifier[] | null => {
        for (const node of nodeList) {
            const currentPath = [...path, node.id]

            if (node.id === nodeId) {
                return currentPath
            }

            if (node.children) {
                const result = findPath(node.children, currentPath)
                if (result) return result
            }
        }

        return null
    }

    return findPath(nodes) || []
}

export function getAllChildIds(node: TreeNode): UniqueIdentifier[] {
    const ids: UniqueIdentifier[] = [node.id]

    if (node.children) {
        node.children.forEach(child => {
            ids.push(...getAllChildIds(child))
        })
    }

    return ids
}

export function getParentNodes(nodes: TreeNode[], nodeId: UniqueIdentifier): UniqueIdentifier[] {
    const path = getNodePath(nodes, nodeId)
    return path.slice(0, -1) // Exclude the node itself
}