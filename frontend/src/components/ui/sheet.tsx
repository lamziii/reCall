// "Sheet" names the same slide-in-panel pattern as Drawer. Re-exported under
// both names since product copy sometimes uses one term or the other.
export {
  Drawer as Sheet,
  DrawerTrigger as SheetTrigger,
  DrawerContent as SheetContent,
  DrawerHeader as SheetHeader,
  DrawerTitle as SheetTitle,
  DrawerDescription as SheetDescription,
  DrawerFooter as SheetFooter,
} from './drawer'
export type { DrawerProps as SheetProps, DrawerContentProps as SheetContentProps } from './drawer'
