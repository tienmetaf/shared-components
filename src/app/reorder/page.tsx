"use client"

import {ReorderableContainers, ReorderableList, useUndoRedo} from "@/app/components/reorder/ReorderableList";
import React, {useState} from "react";

// Single list
type Field = { id: string; label: string };
// export default function SingleDemo() {
//   const [items, setItems] = React.useState<Field[]>([
//     { id: "a", label: "Họ và tên" },
//     { id: "b", label: "Email" },
//     { id: "c", label: "Số điện thoại" },
//   ]);
//   const history = useUndoRedo(items);
//   return (
//     <ReorderableList<Field>
//       value={items}
//       onChange={setItems}
//       historyHook={history}
//       renderItem={(item) => (
//         <div className="rounded-lg bg-muted p-3">
//           <div className="text-sm font-medium">{item.label}</div>
//           <div className="text-xs text-muted-foreground">ID: {item.id}</div>
//         </div>
//       )}
//     />
//   );
// }

export default function MultiDemo() {
  type F = { id: string; label: string };
  const [data, setData] = React.useState<Record<string, F[]>>({
    Kho: [ { id: 'a', label: 'Họ và tên' }, { id: 'b', label: 'Email' } ],
    Form: [ { id: 'c', label: 'Số điện thoại' } ]
  });
  const history = useUndoRedo(data);
  return (
    <ReorderableContainers<F>
      containers={data}
      onChange={setData}
      historyHook={history}
      renderItem={(item) => (
        <div className="rounded-lg bg-muted p-3">
          <div className="text-sm font-medium">{item.label}</div>
        </div>
      )}
    />
  );
}