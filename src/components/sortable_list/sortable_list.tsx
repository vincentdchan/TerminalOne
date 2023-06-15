import React, { useState, useCallback } from "react";

export interface RenderProps {
  index: number;
  item: any;
  dragging: boolean;
  onDragStart?: React.DragEventHandler;
  onDragOver?: React.DragEventHandler;
  onDragEnd?: React.DragEventHandler;
}

export interface SortableListProps {
  items: any[];
  onMove?: (from: number, to: number) => void;
  renderItem: (renderProps: RenderProps) => React.ReactNode;
}

interface ItemWithOriginalIndex {
  originalIndex: number;
  item: any;
}

interface DraggingContext {
  startIndex: number;
  startOriginalIndex: number;
  itemsWithIndexes: ItemWithOriginalIndex[];
}

export function SortableList(props: SortableListProps) {
  const { items, onMove, renderItem } = props;
  const [draggingContext, setDraggingContext] =
    useState<DraggingContext | null>(null);

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      if (draggingContext) {
        onMove?.(
          draggingContext.startOriginalIndex,
          draggingContext.startIndex
        );
      }

      setDraggingContext(null);
    },
    [draggingContext, onMove]
  );

  return (
    <>
      {draggingContext
        ? draggingContext.itemsWithIndexes.map((itemWithIndex, index) => {
            const handleDragOver = (e: React.DragEvent) => {
              e.dataTransfer.effectAllowed = "move";

              if (!draggingContext) {
                return;
              }

              if (
                itemWithIndex.originalIndex ===
                draggingContext.startOriginalIndex
              ) {
                return;
              }

              const itemsWithIndexes = [...draggingContext.itemsWithIndexes];

              // swap items
              const tmp = itemsWithIndexes[draggingContext.startIndex];
              itemsWithIndexes[draggingContext.startIndex] =
                itemsWithIndexes[index];
              itemsWithIndexes[index] = tmp;

              setDraggingContext({
                ...draggingContext,
                startIndex: index,
                itemsWithIndexes,
              });
            };
            return renderItem({
              index: itemWithIndex.originalIndex,
              item: itemWithIndex.item,
              dragging:
                itemWithIndex.originalIndex ===
                draggingContext.startOriginalIndex,
              onDragOver: handleDragOver,
              onDragEnd: handleDragEnd,
            });
          })
        : items.map((item, index) => {
            const handleDragStart = (e: React.DragEvent) => {
              e.dataTransfer.effectAllowed = "move";

              setDraggingContext({
                startIndex: index,
                startOriginalIndex: index,
                itemsWithIndexes: items.map((item, index) => ({
                  originalIndex: index,
                  item,
                })),
              });
            };
            return renderItem({
              index,
              item,
              dragging: false,
              onDragStart: handleDragStart,
              onDragEnd: handleDragEnd,
            });
          })}
    </>
  );
}
