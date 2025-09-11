"use client";

import React from "react";
import {Card} from "@/components/ui/card";
import SortableList from "@/app/components/sortable-list/sortable-list";


// ---------- Example usage (you can delete this section in your app)

// ---------- Demo
export default function DemoSortableList() {
    const [blocks, setBlocks] = React.useState([
        {id: "a", title: "Ảnh bìa", desc: "Custom element có thể là card, form, …"},
        {id: "b", title: "Mô tả", desc: "Hover/click nút để xem preview & highlight"},
        {id: "c", title: "Gallery", desc: "Animation trượt tới đường line"},
    ]);

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="p-3 sm:p-4">
                <h2 className="text-base sm:text-lg font-semibold mb-3">Sắp xếp các phần</h2>
                <SortableList
                    items={blocks}
                    onChange={setBlocks}
                    debounceMs={320}
                    renderItem={(b) => (
                        <div className="min-w-0">
                            <div className="text-sm sm:text-base font-medium truncate">{b.title}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground truncate">{b.desc}</div>
                        </div>
                    )}
                />
            </Card>
        </div>
    );
}
