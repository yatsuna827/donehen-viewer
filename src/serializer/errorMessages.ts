import type { DeserializeError } from "./deserialize";

export const deserializeErrorMessage = (error: DeserializeError): string => {
  switch (error.type) {
    case "invalid-json":
      return "不正な データ ドスエ";
    case "schema-validation-failed":
      return "不明な データ ドスエ";
  }
};
