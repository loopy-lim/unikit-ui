import { Catalog, type FunctionImplementation } from "@a2ui/web_core";

import { createA2uiBasicComponents } from "./catalog-basic";
import { createA2uiBasicFunctions } from "./functions";
import type { A2uiExtras, UnikitA2uiComponent, UnikitCatalogOptions } from "./types";
import { UNIKIT_CATALOG_ID } from "./types";

export const UNIKIT_CATALOG_INSTRUCTIONS = `이 카탈로그는 UniKit UI 렌더러용이에요. 레이아웃에는 Row와 Column을 쓰고, 문자열 연결이나 데이터 주입은 formatString(value)을 \${expression} 표기로 작성해요. 검증 메시지는 컴포넌트의 @checks message에 직접 지어요.`;

export function createUnikitCatalog(
  options?: UnikitCatalogOptions,
): Catalog<UnikitA2uiComponent, FunctionImplementation> {
  return new Catalog(
    UNIKIT_CATALOG_ID,
    "1.0",
    createA2uiBasicComponents(),
    createA2uiBasicFunctions({ locale: options?.locale, catalogId: UNIKIT_CATALOG_ID }),
    {
      title: "UniKit A2UI Catalog",
      description: "UniKit UI 브리지 프리미티브로 렌더링하는 A2UI 카탈로그예요.",
      instructions: UNIKIT_CATALOG_INSTRUCTIONS,
    },
  );
}

export type { A2uiExtras };
