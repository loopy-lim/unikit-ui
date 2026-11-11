// NativeSelect — shadcn/ui（new-york-v4） native-select.tsx 유니버설 포팅 （사이클 40, T-2a）.
// 원본: shadcn-ref/ui/native-select.tsx — <select>/<option>/<optgroup> 요소 대신
// 브리지 Select/SelectOption 프리미티브（웹 select/option  네이티브 Pressable+Modal
// 폴백, bridge/types.ts 계약）를 직접 소비한다.
//
// 포팅 판단（원본 대비 차이）:
// - 웹은 브리지 Select가 <select>를 렌더해 원본과 동등하다. 네이티브는 프리미티브의
//   Pressable 트리거（combobox role）+Modal 옵션 목록 폴백으로 대체된다 — 래퍼에
//   겹친 ChevronDownIcon（브리지 SVG 아이콘, absolute 오버레이）는 양측 동일하게
//   붙는다.
// - size（"sm"|"default"）는 브리지 SelectProps가 data-size 전달을 지원하지 않아
//   조건부 클래스（h-8 py-1 / h-9 py-2）로 전개한다.
// - aria-invalid: 속성 셀렉터 스타일은 브리지가 aria-invalid를 select에 넘기지
//   않으므로 textarea.tsx 관행대로 invalid?: boolean prop + 조건부 클래스로 치환.
// - disabled 포인터/커서 토큰은 web: 접두, 래퍼 불투명화（원본 has-［select:disabled］
//   :opacity-50）는 disabled prop 조건부 클래스로 근사.
// - focus-visible 링은 원본 규격（ring-3 · ring-ring/50 · 무오프셋）을 web: 접두로
//   준수한다（사이클 72）. transition-［color,box-shadow］ 임의값은 web:transition-all,
//   selection:*/appearance-none은 웹 전용 개념이라 web: 접두.
// - w-fit은 uniwind 미지원 — tabs.tsx 관행의 self-start（교차축 시작 정렬）로 치환.
// - dark: 변형 토큰은 프로젝트 관행（미사용）대로 제거.
// - NativeSelectOptGroup: 브리지에 optgroup 프리미티브가 없다. 실험 확인 결과
//   네이티브 Select는 직계 자식 요소의 props만 추출해 목록을 그리므로（Children
//   .toArray는 래퍼 컴포넌트를 평탄화하지 않는다） 래퍼를 그대로 두면 네이티브에서
//   깨진 빈 항목이 생긴다. 따라서 NativeSelect가 children을 순회하며 OptGroup
//   래퍼를 풀어 평탄화한 옵션 목록을 프리미티브에 넘긴다 — 그룹 라벨（<optgroup>
//   시맨틱）은 양측 모두 상실（한계, 브리지 개선 과제）.
// - option의 bg-［Canvas］ text-［CanvasText］는 임의값 색 토큰이라 제거 — 드롭다운
//   목록 배경은 어차피 UA（웹）/Modal（네이티브）이 그린다.
// - data-slot 속성은 브리지가 전달하지 않아 제거（셀렉터 스타일 의존 없음）.
import {
  Children,
  forwardRef,
  isValidElement,
  type ReactNode,
} from "react";
import {
  ChevronDownIcon,
  Select,
  SelectOption,
  Text,
  View,
  type BridgeViewRef,
  type ViewProps,
} from "@unikit-bridge/ui/primitives";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

/** OptGroup 래퍼를 풀어 SelectOption 직계 목록으로 평탄화（네이티브 추출 정합）. */
function flattenOptions(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (isValidElement(child) && child.type === NativeSelectOptGroup) {
      return flattenOptions((child.props as { children?: ReactNode }).children);
    }
    return [child];
  });
}

// 트리거 — 원본 select 토큰에서 속성 셀렉터를 조건부 클래스로 전개.
const nativeSelectVariants = cva(
  "w-full min-w-0 web:appearance-none rounded-md border border-input bg-transparent px-3 text-sm text-foreground web:shadow-xs web:transition-all web:outline-none web:selection:bg-primary web:selection:text-primary-foreground web:focus-visible:border-ring web:focus-visible:ring-3 web:focus-visible:ring-ring/50",
);

export type NativeSelectProps = ViewProps & {
  /** 폼 값 — 브리지 계약（웹 select value  네이티브 목록 선택） */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** 세로 크기（원본 data-size） — 조건부 클래스로 전개 */
  size?: "sm" | "default";
  /** 오류 상태（원본 aria-invalid:* 치환） — 붉은 테두리 */
  invalid?: boolean;
};

const NativeSelect = forwardRef<BridgeViewRef, NativeSelectProps>(
  (
    {
      className,
      size = "default",
      invalid,
      value,
      defaultValue,
      onValueChange,
      disabled,
      accessibilityLabel,
      nativeID,
      testID,
      children,
    },
    ref,
  ) => (
    <View
      ref={ref}
      // 원본 group/native-select relative w-fit has-［select:disabled］:opacity-50 근사
      className={cn("relative self-start", disabled && "opacity-50")}
    >
      <Select
        className={cn(
          nativeSelectVariants(),
          size === "sm" ? "h-8 py-1" : "h-9 py-2",
          // 오른쪽 ⌄ 글리프 공간（원본 pr-9）
          "pr-9",
          invalid && "border-destructive web:focus-visible:ring-destructive/20",
          disabled && "web:pointer-events-none web:cursor-not-allowed",
          className,
        )}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        nativeID={nativeID}
        testID={testID}
      >
        {flattenOptions(children)}
      </Select>
      {/* ChevronDownIcon — 절대 배치로 트리거 위에 겹친다（양측 동일）.
          -translate-y-1/2 대신 top-0 bottom-0 + items-center 조합(네이티브 안전). */}
      <View
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 right-3.5 items-center justify-center"
      >
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground opacity-50 web:select-none" />
      </View>
    </View>
  ),
);
NativeSelect.displayName = "NativeSelect";

export type NativeSelectOptionProps = {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
};

// 브리지 SelectOption은 ref를 받지 않는다（데이터 서술자 — 네이티브는 null 렌더）.
// 원본 API 유지를 위한 forwardRef 래퍼일 뿐 ref는 전달하지 않는다.
const NativeSelectOption = forwardRef<BridgeViewRef, NativeSelectOptionProps>(
  ({ value, disabled, children }, _ref) => (
    <SelectOption value={value} disabled={disabled}>
      {children}
    </SelectOption>
  ),
);
NativeSelectOption.displayName = "NativeSelectOption";

export type NativeSelectOptGroupProps = {
  /** 그룹 라벨 — 브리지 계약상 전달 불가（상실, 머리 주석 참조） */
  label?: string;
  disabled?: boolean;
  children?: ReactNode;
};

// 실제 렌더는 NativeSelect의 flattenOptions가 이 래퍼를 풀어 대신한다（머리 주석）.
// 여기서는 자식을 그대로 통과시키는 투명 래퍼 — reflabeldisabled는 계약상
// 전달 대상이 없다.
const NativeSelectOptGroup = forwardRef<
  BridgeViewRef,
  NativeSelectOptGroupProps
>(({ children }, _ref) => <>{children}</>);
NativeSelectOptGroup.displayName = "NativeSelectOptGroup";

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
