// Wave 1: primitives
export { Badge, Chip, StatusDot, type Tone } from './lib/badge/badge';
export { Button, IconButton, type ButtonSize, type ButtonVariant } from './lib/button/button';
export { Callout, EmptyState, Kbd, Skeleton } from './lib/feedback/feedback';
export {
  Check,
  Checkbox,
  Control,
  Field,
  FIELD,
  Fieldset,
  Radio,
  Switch,
  type FieldContext,
} from './lib/field/field';
export { Icon } from './lib/icon/icon';
export { SegmentedControl, type SegmentOption } from './lib/segmented/segmented-control';

// Wave 2: overlays
export { CommandPalette, matchesQuery, type Command } from './lib/command-palette/command-palette';
export { ConfirmDialog, type ConfirmOptions } from './lib/dialog/confirm';
export {
  Dialog,
  DialogBase,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  type ClosedBy,
} from './lib/dialog/dialog';
export { Menu, MenuItem, MenuLabel, MenuSeparator } from './lib/popover/menu';
export { Popover, PopoverBase, PopoverTrigger, type Align, type Placement } from './lib/popover/popover';
export { Tooltip } from './lib/popover/tooltip';
export { Toaster, type ToastOptions } from './lib/toast/toast';

// Wave 3: layout and data
export { Cell, DataTable, StatGrid, StatTile, type Column } from './lib/data/data-table';
export { Breadcrumbs, Card, CardGrid, Page, PageHeader, Panel } from './lib/page/page';
export { Tab, Tabs } from './lib/page/tabs';
export {
  FormActions,
  FormActionsNote,
  SettingCard,
  SettingCardFooter,
  SettingRow,
} from './lib/settings/settings';
