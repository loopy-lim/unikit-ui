// Table — shadcn/ui new-york-v4 table 포팅（/tmp/shadcn-ref/src/table）. 8종 export.
// 포팅 판단:
// - 원본은 <table>/<thead>/<tr>/<th> 등 표 요소 + 자손 셀렉터（［&_tr］:border-b,
//   ［&_tr:last-child］:border-0, has-aria-expanded:）로 스타일링한다. 브리지에는
//   표 요소가 없으므로 전부 View（div）로 이식하되 시각 토큰（테두리·배경·여백·높이）은
//   유지하고, 행/셀 배치는 flex（행=flex-row, 셀=flex-1 균등 폭）로 재구성했다.
//   셀 폭 균등（flex-1）은 원본 table 자동 배치와 다르다 — 사용처에서 셀 className으로
//   조절한다.
// - role은 사이클 40 브리지 확장（§2.1）으로 소급 지정한다 — Table=table,
//   Header/Body/Footer=rowgroup, TableRow=row, TableHead=columnheader,
//   TableCell=cell. 네이티브 RN이 모르는 role은 무시되고（브리지 문서화된
//   방침） 웹 스크린리더가 표 의미를 전달받는다.
// - 셀（TableHead·TableCell）의 children은 문자열을 권장한다 — 내부 Text가 색·
//   타이포를 담당한다（이중 지정）. 사용자 정의 콘텐츠는 직접 Text를 넣어야 한다.
// - 자손 셀렉터 미지원으로 소실되는 원본 토큰: TableHeader의 ［&_tr］:border-b는
//   TableRow 자체 border-b로 흡수, TableBody의 마지막 행 보더 제거（:last-child）와
//   TableRow의 data-state=selected·has-aria-expanded 배경은 미지원.
//   whitespace-nowrap·overflow-x-auto·transition·hover는 web: 접두.
//   caption-bottom은 flex-col DOM 순서 배치로 대체（캡션을 마지막에 넣으면 하단）.
import { createContext, forwardRef, useContext } from "react";
import {
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

// 가로 스크롤 컨테이너（원본 table-container div）
// 표 구역 context — 푸터 여부를 셀 Text로 전달한다（alert.tsx의 variant context
// 와 동일 패턴）. 컨테이너 font-medium은 웹에서만 텍스트로 상속되고 네이티브에서는
// 무시되는 비대칭이라 이중 지정 원칙대로 내부 Text에 내린다（사소 4）.
const TableSectionContext = createContext<"body" | "footer">("body");

const tableContainerVariants = cva("relative w-full web:overflow-x-auto");
// 표 본체 — 행이 쌓이는 열（원본 <table>의 w-full）
const tableVariants = cva("w-full flex-col");
const tableHeaderVariants = cva("flex-col");
const tableBodyVariants = cva("flex-col");
const tableFooterVariants = cva("flex-col border-t bg-muted/50");
const tableRowVariants = cva(
  "flex-row border-b web:transition-colors web:hover:bg-muted/50",
);
const tableHeadVariants = cva("h-10 flex-1 items-center px-2 text-left");
const tableHeadTextVariants = cva(
  "font-sans text-sm font-medium text-foreground web:whitespace-nowrap",
);
const tableCellVariants = cva("flex-1 items-center p-2 text-left");
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

// 원본과 같이 ref·className·props는 컨테이너가 아니라 표 본체（원본 <table>）에.
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
    // 푸터 안 셀은 굵게 — 원본 font-medium 상속을 이중 지정으로 재현（사소 4）.
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
