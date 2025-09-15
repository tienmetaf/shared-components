"use client";

import * as React from "react";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    PointerSensor,
    KeyboardSensor,
    TouchSensor,
    useSensor,
    useSensors, DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    GripVertical,
    ChevronUp,
    ChevronDown,
    Undo2,
    Redo2,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

/**
 * =============================
 * 1) Reusable Hooks
 * =============================
 */

/** Undo/Redo history hook that's reusable across components/forms. */
export function useUndoRedo<T>(initial: T) {
    const [past, setPast] = React.useState<T[]>([]);
    const [present, setPresent] = React.useState<T>(initial);
    const [future, setFuture] = React.useState<T[]>([]);

    /** Push a new state into history. */
    const commit = React.useCallback((next: T) => {
        setPast((p) => [...p, present]);
        setPresent(next);
        setFuture([]);
    }, [present]);

    /** Replace current without touching history (sync from outside). */
    const sync = React.useCallback((next: T) => {
        setPresent(next);
    }, []);

    const undo = React.useCallback(() => {
        let result: T | undefined;
        setPast((p) => {
            if (p.length === 0) return p;
            const prev = p[p.length - 1];
            result = prev;
            setFuture((f) => [present, ...f]);
            setPresent(prev);
            return p.slice(0, -1);
        });
        return result;
    }, [present]);

    const redo = React.useCallback(() => {
        let result: T | undefined;
        setFuture((f) => {
            if (f.length === 0) return f;
            const next = f[0];
            result = next;
            setPast((p) => [...p, present]);
            setPresent(next);
            return f.slice(1);
        });
        return result;
    }, [present]);

    const reset = React.useCallback((val: T) => {
        setPast([]);
        setPresent(val);
        setFuture([]);
        return val;
    }, []);

    const canUndo = past.length > 0;
    const canRedo = future.length > 0;

    return { value: present, commit, undo, redo, reset, canUndo, canRedo, sync } as const;
}

/**
 * Helper for reordering within and between arrays.
 */
export function moveBetween<T>(
    source: T[],
    target: T[],
    fromIndex: number,
    toIndex: number
) {
    const src = [...source];
    const tgt = [...target];
    const [moved] = src.splice(fromIndex, 1);
    tgt.splice(toIndex, 0, moved);
    return { source: src, target: tgt };
}

/** Base type for list items. */
export type ItemBase = { id: string };

/**
 * =============================
 * 2) Sortable Row (UI-agnostic content)
 * =============================
 */
function SortableRow<T extends ItemBase>(props: {
    item: T;
    index: number;
    render: (item: T) => React.ReactNode;
    onMoveUp: () => void;
    onMoveDown: () => void;
    disabled?: boolean;
    className?: string;
}) {
    const { item, render, onMoveUp, onMoveDown, disabled, className } = props;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-stretch gap-2 rounded-xl border bg-background p-2 w-full max-w-full",
                "select-none touch-none",
                isDragging && "opacity-60 shadow-lg",
                className
            )}
        >
            {/* Drag handle */}
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                    "shrink-0 cursor-grab active:cursor-grabbing hover:bg-muted",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                disabled={disabled}
                {...attributes}
                {...listeners}
                aria-label="Kéo để sắp xếp"
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* Custom content – bạn render cái gì cũng được */}
            <div className="min-w-0 flex-1">{render(item)}</div>

            <Separator orientation="vertical" className="mx-1" />

            <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Lên" onClick={onMoveUp}>
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Xuống" onClick={onMoveDown}>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

/**
 * =============================
 * 3) Single-List Component (works controlled or uncontrolled)
 * =============================
 */
export type ReorderableListProps<T extends ItemBase> = {
    value: T[]; // controlled value
    onChange?: (items: T[]) => void; // controlled handler (optional)
    renderItem: (item: T) => React.ReactNode;
    disabled?: boolean;
    resetTo?: T[]; // reset target from parent
    dndContextId?: string; // to share context across multiple lists
    onDragStart?: (e: DragStartEvent) => void;
    onDragOver?: (e: DragOverEvent) => void;
    onDragEndExternal?: (e: DragEndEvent) => void; // parent handles drop
    className?: string;
    /**
     * Provide your own undo/redo hook instance to share history with parent/form.
     * If omitted, component creates its own.
     */
    historyHook?: ReturnType<typeof useUndoRedo<T[]>>;
};

export function ReorderableList<T extends ItemBase>(props: ReorderableListProps<T>) {
    const { value, onChange, renderItem, disabled, resetTo, dndContextId, onDragStart, onDragOver, onDragEndExternal, className, historyHook } = props;

    // History: either provided from parent or internal
    const internalHistory = useUndoRedo<T[]>(value);
    const history = historyHook ?? internalHistory;

    // Keep history present in sync with external value (without pushing to history)
    React.useEffect(() => { history.sync(value); }, [history, value]);
    React.useEffect(() => { if (resetTo) history.reset(resetTo); }, [history, resetTo]);

    const items = history.value;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 12 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const commitNext = React.useCallback((next: T[]) => {
        history.commit(next); // push vào history trước
        onChange?.(next);     // thông báo ra ngoài nếu parent điều khiển
    }, [history, onChange]);

    const move = React.useCallback((from: number, to: number) => {
        if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
        commitNext(arrayMove(items, from, to));
    }, [items, commitNext]);

    const handleDragEnd = React.useCallback((event: DragEndEvent) => {
        if (onDragEndExternal) return onDragEndExternal(event);
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((it) => it.id === String(active.id));
        const newIndex = items.findIndex((it) => it.id === String(over.id));
        if (oldIndex !== -1 && newIndex !== -1) commitNext(arrayMove(items, oldIndex, newIndex));
    }, [items, commitNext, onDragEndExternal]);

    // Toolbar handlers must update both history and external value
    const onUndo = React.useCallback(() => {
        const prev = history.undo();
        if (prev) onChange?.(prev);
    }, [history, onChange]);
    const onRedo = React.useCallback(() => {
        const next = history.redo();
        if (next) onChange?.(next);
    }, [history, onChange]);
    const onReset = React.useCallback(() => {
        const base = resetTo ?? value;
        const r = history.reset(base);
        onChange?.(r);
    }, [history, onChange, resetTo, value]);

    const ids = items.map((it) => it.id);

    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center gap-2 mb-2">
                <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!history.canUndo}>
                    <Undo2 className="h-4 w-4 mr-1" /> Undo
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onRedo} disabled={!history.canRedo}>
                    <Redo2 className="h-4 w-4 mr-1" /> Redo
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={onReset}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
            </div>

            <Card className="p-2 sm:p-3 border-dashed">
                <DndContext
                    id={dndContextId}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2" style={{ touchAction: "pan-y" }}>
                            {items.map((item, index) => (
                                <SortableRow
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    render={renderItem}
                                    onMoveUp={() => move(index, Math.max(0, index - 1))}
                                    onMoveDown={() => move(index, Math.min(items.length - 1, index + 1))}
                                    disabled={disabled}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </Card>
        </div>
    );
}

/**
 * =============================
 * 4) Multi-Container Component (drag across lists)
 * =============================
 */
export type ContainersMap<T extends ItemBase> = Record<string, T[]>; // e.g. {source: [...], target: [...]}

// Helper: find which container an id belongs to (item id or container id)
function findContainerId<T extends ItemBase>(id: string | undefined, data: ContainersMap<T>): string | undefined {
    if (!id) return undefined;
    if (Object.prototype.hasOwnProperty.call(data, id)) return id; // it's a container id
    return Object.keys(data).find((k) => data[k].some((it) => it.id === id));
}

export function ReorderableContainers<T extends ItemBase>(props: {
    containers: ContainersMap<T>;
    onChange: (next: ContainersMap<T>) => void;
    renderItem: (item: T) => React.ReactNode;
    disabled?: boolean;
    className?: string;
    /** share history across all containers if needed */
    historyHook?: ReturnType<typeof useUndoRedo<ContainersMap<T>>>;
}) {
    const { containers, onChange, renderItem, disabled, className, historyHook } = props;
    const keys = React.useMemo(() => Object.keys(containers), [containers]);

    const internalHistory = useUndoRedo<ContainersMap<T>>(containers);
    const history = historyHook ?? internalHistory;

    // Keep in sync when external changes come in
    React.useEffect(() => { history.sync(containers); }, [containers, history]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 12 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [activeId, setActiveId] = React.useState<string | null>(null);
    const activeItem = React.useMemo(() => {
        if (!activeId) return null;
        const cid = findContainerId(activeId, containers);
        if (!cid) return null;
        return containers[cid].find((it) => it.id === activeId) ?? null;
    }, [activeId, containers]);

    const setNext = React.useCallback((next: ContainersMap<T>) => {
        history.commit(next);
        onChange(next);
    }, [history, onChange]);

    const onDragStart = React.useCallback((e: DragStartEvent) => {
        setActiveId(String(e.active.id));
    }, []);

    // Cross-container movement while dragging — per dnd-kit docs we do this in onDragOver
    const onDragOver = React.useCallback((e: DragOverEvent) => {
        const activeId = String(e.active.id);
        const overId = e.over ? String(e.over.id) : undefined;

        const fromCid = findContainerId(activeId, containers);
        const toCid = findContainerId(overId, containers);
        if (!fromCid || !toCid || fromCid === toCid) return; // same container or unknown

        const fromItems = containers[fromCid];
        const toItems = containers[toCid];

        const fromIndex = fromItems.findIndex((it) => it.id === activeId);
        const overIndex = overId && Object.prototype.hasOwnProperty.call(containers, overId)
            ? toItems.length // hovered over the container itself (empty area)
            : Math.max(0, toItems.findIndex((it) => it.id === overId));

        if (fromIndex === -1) return;

        const { source, target } = moveBetween(fromItems, toItems, fromIndex, overIndex === -1 ? toItems.length : overIndex);
        const next = { ...containers, [fromCid]: source, [toCid]: target };
        setNext(next);
    }, [containers, setNext]);

    // Reorder within a container on drop
    const onDragEnd = React.useCallback((e: DragEndEvent) => {
        const activeId = String(e.active.id);
        const overId = e.over ? String(e.over.id) : undefined;

        const fromCid = findContainerId(activeId, containers);
        const toCid = findContainerId(overId, containers);

        setActiveId(null);

        if (!fromCid || !toCid) return;

        if (fromCid === toCid && overId && !Object.prototype.hasOwnProperty.call(containers, overId)) {
            const items = containers[fromCid];
            const oldIndex = items.findIndex((it) => it.id === activeId);
            const newIndex = items.findIndex((it) => it.id === overId);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const next = { ...containers, [fromCid]: arrayMove(items, oldIndex, newIndex) };
                setNext(next);
            }
        }
    }, [containers, setNext]);

    const onDragCancel = React.useCallback(() => setActiveId(null), []);

    // Toolbar
    const onUndo = React.useCallback(() => { const prev = history.undo(); if (prev) onChange(prev); }, [history, onChange]);
    const onRedo = React.useCallback(() => { const next = history.redo(); if (next) onChange(next); }, [history, onChange]);
    const onReset = React.useCallback(() => { const r = history.reset(containers); onChange(r); }, [history, onChange, containers]);

    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center gap-2 mb-3">
                <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!history.canUndo}><Undo2 className="h-4 w-4 mr-1" /> Undo</Button>
                <Button type="button" variant="outline" size="sm" onClick={onRedo} disabled={!history.canRedo}><Redo2 className="h-4 w-4 mr-1" /> Redo</Button>
                <Button type="button" variant="secondary" size="sm" onClick={onReset}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {keys.map((k) => {
                        const items = containers[k];
                        const ids = items.map((it) => it.id); // items must be unique across containers
                        return (
                            <DroppableContainer key={k} id={k} title={k}>
                                <Card className="p-2 sm:p-3 border-dashed">
                                    <div className="mb-2 text-sm font-medium">{k}</div>
                                    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-2" style={{ touchAction: "pan-y" }}>
                                            {items.map((item, index) => (
                                                <ContainerRow
                                                    key={item.id}
                                                    item={item}
                                                    index={index}
                                                    render={renderItem}
                                                    disabled={disabled}
                                                    onMoveUp={() => {
                                                        const arr = containers[k];
                                                        const next = { ...containers, [k]: arrayMove(arr, index, Math.max(0, index - 1)) };
                                                        setNext(next);
                                                    }}
                                                    onMoveDown={() => {
                                                        const arr = containers[k];
                                                        const next = { ...containers, [k]: arrayMove(arr, index, Math.min(arr.length - 1, index + 1)) };
                                                        setNext(next);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </Card>
                            </DroppableContainer>
                        );
                    })}
                </div>

                {/* Drag overlay so item can freely move across containers */}
                <DragOverlay>
                    {activeItem ? (
                        <div className="pointer-events-none opacity-90">
                            {renderItem(activeItem)}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

function DroppableContainer(props: { id: string; title?: React.ReactNode; children: React.ReactNode }) {
    const { id, children } = props;
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className="min-h-[80px]">
            {children}
        </div>
    );
}

function ContainerRow<T extends ItemBase>(props: {
    item: T;
    index: number;
    render: (item: T) => React.ReactNode;
    onMoveUp: () => void;
    onMoveDown: () => void;
    disabled?: boolean;
}) {
    const { item, render, onMoveUp, onMoveDown, disabled } = props;
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-stretch gap-2 rounded-xl border bg-background p-2 w-full max-w-full",
                "select-none touch-none",
                isDragging && "opacity-60 shadow-lg"
            )}
        >
            <Button type="button" variant="ghost" size="icon" className="shrink-0 cursor-grab active:cursor-grabbing hover:bg-muted" disabled={disabled} {...attributes} {...listeners} aria-label="Kéo để sắp xếp">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="min-w-0 flex-1">{render(item)}</div>
            <Separator orientation="vertical" className="mx-1" />
            <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Lên" onClick={onMoveUp}><ChevronUp className="h-4 w-4" /></Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Xuống" onClick={onMoveDown}><ChevronDown className="h-4 w-4" /></Button>
            </div>
        </div>
    );
}

/**
 * =============================
 * 5) Minimal examples (remove in prod)
 * =============================
 * (unchanged)
 */
