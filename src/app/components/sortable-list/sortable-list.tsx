"use client";

import React, {useMemo, useCallback} from "react";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {GripVertical, ArrowUp, ArrowDown} from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

// ---------- Types
export type IdGetter<T> = (item: T) => string;

export interface SortableListProps<T> {
    items: T[];
    onChange: (next: T[]) => void;
    renderItem: (item: T) => React.ReactNode; // your custom element (any shape)
    getId?: IdGetter<T>; // defaults to (i)=> (i as any).id
    disabled?: boolean;
    className?: string;
    rowClassName?: string; // optional to tune per-row UI
}

// Small helper
function arrayMove<T>(arr: T[], from: number, to: number) {
    const next = [...arr];
    const [spliced] = next.splice(from, 1);
    next.splice(to, 0, spliced);
    return next;
}

// ---------- Sortable Row
function SortableRow<T>({
                            item,
                            index,
                            total,
                            getId,
                            renderItem,
                            onMove,
                            disabled,
                            rowClassName,
                        }: {
    item: T;
    index: number;
    total: number;
    getId: IdGetter<T>;
    renderItem: (item: T) => React.ReactNode;
    onMove: (from: number, to: number) => void;
    disabled?: boolean;
    rowClassName?: string;
}) {
    const id = getId(item);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id});

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const canUp = index > 0;
    const canDown = index < total - 1;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={[
                "w-full max-w-full select-none",
                "rounded-xl border bg-background/60 backdrop-blur",
                "shadow-sm hover:shadow transition-shadow",
                isDragging ? "opacity-70 ring-2 ring-primary" : "",
                rowClassName ?? "",
            ].join(" ")}
        >
            {/* Content grid keeps arbitrary custom content tidy on all screens */}
            <div className="flex items-stretch gap-2 p-2 sm:p-3">
                {/* Drag handle – large touch target for mobile */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 self-stretch h-auto px-2 sm:px-3 cursor-grab touch-none data-[dragging=true]:cursor-grabbing"
                    disabled={disabled}
                    aria-label="Kéo để sắp xếp"
                    data-dragging={isDragging}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="h-5 w-5"/>
                </Button>

                {/* User content area – grow, wrap, and clip nicely whatever you render */}
                <div className="min-w-0 flex-1">
                    <div className="min-h-12 sm:min-h-14 flex items-center">
                        <div className="w-full min-w-0">
                            {renderItem(item)}
                        </div>
                    </div>
                </div>

                <Separator orientation="vertical" className="mx-1 hidden sm:block" />

                {/* Up/Down controls – stacked on mobile, inline on desktop */}
                <div className="flex sm:flex-col gap-1 sm:gap-2 items-center justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:h-8 sm:w-8"
                        disabled={disabled || !canUp}
                        aria-label="Di chuyển lên"
                        onClick={() => onMove(index, index - 1)}
                    >
                        <ArrowUp className="h-4 w-4"/>
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:h-8 sm:w-8"
                        disabled={disabled || !canDown}
                        aria-label="Di chuyển xuống"
                        onClick={() => onMove(index, index + 1)}
                    >
                        <ArrowDown className="h-4 w-4"/>
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ---------- Main List
export default function SortableList<T>(props: SortableListProps<T>) {
    const {items, onChange, renderItem, getId: _getId, disabled, className, rowClassName} = props;

    const getId = useMemo<IdGetter<T>>(() => _getId ?? ((i: any) => String(i.id)), [_getId]);
    const ids = useMemo(() => items.map(getId), [items, getId]);

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 8}}),
        useSensor(TouchSensor,   {activationConstraint: {delay: 100, tolerance: 15}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
    );

    const moveIndex = useCallback((from: number, to: number) => {
        if (to < 0 || to >= items.length || from === to) return;
        onChange(arrayMove(items, from, to));
    }, [items, onChange]);

    const handleDragEnd = useCallback((e: DragEndEvent) => {
        const {active, over} = e;
        if (!over || active.id === over.id) return;
        const oldIndex = ids.indexOf(String(active.id));
        const newIndex = ids.indexOf(String(over.id));
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            onChange(arrayMove(items, oldIndex, newIndex));
        }
    }, [ids, items, onChange]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <div className={["w-full max-w-full space-y-3", className ?? ""].join(" ")}
                     style={{touchAction: "pan-y"}}>
                    {items.map((item, idx) => (
                        <SortableRow<T>
                            key={getId(item)}
                            item={item}
                            index={idx}
                            total={items.length}
                            getId={getId}
                            renderItem={renderItem}
                            onMove={moveIndex}
                            disabled={disabled}
                            rowClassName={rowClassName}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}