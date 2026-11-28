import { createContext, forwardRef, useContext } from "react";
import {
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

const TableSectionContext = createContext<"body" | "footer">("body");

const tableContainerVariants = cva("relative w-full web:overflow-x-auto");

const tableVariants = cva("w-full flex-col");
const tableHeaderVariants = cva("flex-col");
const tableBodyVariants = cva("flex-col");
const tableFooterVariants = cva("flex-col border-t bg-muted/50");
const tableRowVariants = cva(
  "flex-row border-b web:transition-colors web:hover:bg-muted/50",
);

const tableHeadVariants = cva("h-10 flex-1 justify-center px-2 text-left");
const tableHeadTextVariants = cva(
  "font-sans text-sm font-medium text-foreground web:whitespace-nowrap",
);
const tableCellVariants = cva("flex-1 justify-center p-2 text-left");
const tableCellTextVariants = cva(
  "font-sans text-sm text-foreground web:whitespace-nowrap",
);
const tableCaptionVariants = cva("w-full mt-4");
const tableCaptionTextVariants = cva("font-sans text-sm text-muted-foreground");

export type TableProps = ViewProps;
export type TableHeaderProps = ViewProps;
export type TableBodyProps = ViewProps;
export type TableFooterProps = ViewProps;
export type TableRowProps = ViewProps;
export type TableHeadProps = ViewProps;
export type TableCellProps = ViewProps;
export type TableCaptionProps = ViewProps;

const Table = forwardRef<BridgeViewRef, TableProps>(
  ({ className, ...props }, ref) => (
    <View className={cn(tableContainerVariants())}>
      <View
        ref={ref}
        accessibilityRole="table"
        className={cn(tableVariants(), className)}
        {...props}
      />
    </View>
  ),
);
Table.displayName = "Table";

const TableHeader = forwardRef<BridgeViewRef, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="rowgroup"
      className={cn(tableHeaderVariants(), className)}
      {...props}
    />
  ),
);
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<BridgeViewRef, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="rowgroup"
      className={cn(tableBodyVariants(), className)}
      {...props}
    />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = forwardRef<BridgeViewRef, TableFooterProps>(
  ({ className, children, ...props }, ref) => (
    <TableSectionContext.Provider value="footer">
      <View
        ref={ref}
        accessibilityRole="rowgroup"
        className={cn(tableFooterVariants(), className)}
        {...props}
      >
        {children}
      </View>
    </TableSectionContext.Provider>
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = forwardRef<BridgeViewRef, TableRowProps>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="row"
      className={cn(tableRowVariants(), className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = forwardRef<BridgeViewRef, TableHeadProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      accessibilityRole="columnheader"
      className={cn(tableHeadVariants(), className)}
      {...props}
    >
      <Text className={cn(tableHeadTextVariants())}>{children}</Text>
    </View>
  ),
);
TableHead.displayName = "TableHead";

const TableCell = forwardRef<BridgeViewRef, TableCellProps>(
  ({ className, children, ...props }, ref) => {

    const inFooter = useContext(TableSectionContext) === "footer";
    return (
      <View
        ref={ref}
        accessibilityRole="cell"
        className={cn(tableCellVariants(), className)}
        {...props}
      >
        <Text className={cn(tableCellTextVariants(), inFooter && "font-medium")}>
          {children}
        </Text>
      </View>
    );
  },
);
TableCell.displayName = "TableCell";

const TableCaption = forwardRef<BridgeViewRef, TableCaptionProps>(
  ({ className, children, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(tableCaptionVariants(), className)}
      {...props}
    >
      <Text className={cn(tableCaptionTextVariants())}>{children}</Text>
    </View>
  ),
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
  tableContainerVariants,
  tableVariants,
  tableHeaderVariants,
  tableBodyVariants,
  tableFooterVariants,
  tableRowVariants,
  tableHeadVariants,
  tableHeadTextVariants,
  tableCellVariants,
  tableCellTextVariants,
  tableCaptionVariants,
  tableCaptionTextVariants,
};
