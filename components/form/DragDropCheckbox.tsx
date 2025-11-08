'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Typography,
  Container,
  Box,
  Divider,
  Button,
  Checkbox,
} from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

interface Bouquet {
  id: number;
  bouquet_name: string;
  [key: string]: any;
}

interface DragDropCheckboxProps {
  initial?: Bouquet[];
  selected: number[];
  title: string;
  handleSelectedBouquet: (id: number) => void;
  handleSelectAll: (items: Bouquet[]) => void;
  handleSelectNone: (items: Bouquet[]) => void;
  handleNewOrder: (newItems: Bouquet[]) => void;
}

// Memoized Item component for better performance
const SortableItem = memo(function SortableItem({
  item,
  checked,
  onItemChange,
}: {
  item: Bouquet;
  checked: boolean;
  onItemChange: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }),
    [transform, transition, isDragging]
  );

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        width: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        borderBottom: 1,
        borderColor: (theme) => theme.palette.divider,
        cursor: isDragging ? 'grabbing' : 'grab',
        backgroundColor: isDragging
          ? (theme) => theme.palette.action.selected
          : 'transparent',
        '&:hover': {
          backgroundColor: (theme) => theme.palette.action.hover,
          borderBottom: 0,
        },
      }}
    >
      <DragIndicatorIcon
        sx={{
          color: 'text.disabled',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
        }}
      />

      <Checkbox
        disableRipple
        checked={checked}
        icon={<RadioButtonUncheckedIcon />}
        checkedIcon={<CheckCircleOutlineIcon />}
        onChange={(e) => {
          e.stopPropagation();
          onItemChange();
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <Box
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <Typography
          noWrap
          variant="subtitle2"
          sx={{
            pr: 1,
            pl: 1,
            height: 52,
            lineHeight: '52px',
            transition: (theme) =>
              theme.transitions.create('opacity', {
                duration: theme.transitions.duration.shortest,
              }),
            ...(checked && {
              opacity: 0.48,
            }),
          }}
        >
          {item.bouquet_name}
        </Typography>
      </Box>
    </Box>
  );
});

SortableItem.displayName = 'SortableItem';

export default function DragDropCheckbox({
  initial = [],
  selected,
  title,
  handleSelectedBouquet,
  handleSelectAll,
  handleSelectNone,
  handleNewOrder,
}: DragDropCheckboxProps) {
  const [items, setItems] = useState<Bouquet[]>([]);

  // Memoize items to prevent unnecessary re-renders
  const itemsIds = useMemo(() => items.map((item) => item.id), [items]);

  // Configure sensors for better touch and keyboard support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update items when initial prop changes (memoized)
  useEffect(() => {
    if (initial && initial.length > 0) {
      setItems(initial);
    }
  }, [initial]);

  // Memoized drag end handler
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id);
        const newIndex = currentItems.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(currentItems, oldIndex, newIndex);
          // Notify parent of new order
          handleNewOrder(newItems);
          return newItems;
        }

        return currentItems;
      });
    },
    [handleNewOrder]
  );

  // Memoized select all handler
  const handleSelectAllClick = useCallback(() => {
    handleSelectAll(items);
  }, [items, handleSelectAll]);

  // Memoized select none handler
  const handleSelectNoneClick = useCallback(() => {
    handleSelectNone(items);
  }, [items, handleSelectNone]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Container
        sx={{
          width: 1,
          boxShadow: (theme) => theme.shadows[2],
          '&:hover': {
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        <Typography variant="h6" sx={{ m: 1 }}>
          {title}
        </Typography>

        <Box>
          <Button
            variant="outlined"
            size="small"
            sx={{ mr: 1, mb: 1 }}
            startIcon={<CheckBoxIcon />}
            onClick={handleSelectAllClick}
          >
            Select All
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="warning"
            sx={{ mb: 1 }}
            startIcon={<CheckBoxOutlineBlankIcon />}
            onClick={handleSelectNoneClick}
          >
            Select None
          </Button>
        </Box>

        <Divider />

        {items && items.length > 0 ? (
          <SortableContext items={itemsIds} strategy={verticalListSortingStrategy}>
            <Box
              sx={{
                overflowY: 'auto',
                maxHeight: '400px',
                minHeight: '200px',
              }}
            >
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  checked={selected.includes(item.id)}
                  onItemChange={() => handleSelectedBouquet(item.id)}
                />
              ))}
            </Box>
          </SortableContext>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No bouquets available
            </Typography>
          </Box>
        )}
      </Container>
    </DndContext>
  );
}