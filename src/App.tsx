import { useCallback, useEffect, useState } from "react";
import { Result } from "@praha/byethrow";

import { compress, decompress } from "./lib/compression";
import { serialize, deserialize } from "./serializer";
import { deserializeErrorMessage } from "./serializer/errorMessages";
import type { ParsedDonation } from "./parser/types";

import { Home } from "./Home";
import { Viewer } from "./Viewer";
import { ErrorScreen } from "./Error";

const QUERY_KEY = "d";
const clearParams = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete(QUERY_KEY);
  window.history.replaceState(null, "", url.toString());
};

type Screen =
  | { type: "home" }
  | { type: "viewer"; donation: ParsedDonation }
  | { type: "error"; message: string };

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>({ type: "home" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(QUERY_KEY);
    if (!encoded) return;

    const load = async () => {
      const json = await decompress(encoded).catch(() => null);
      if (json == null) {
        setScreen({
          type: "error",
          message: "不明な データ ドスエ",
        });
        clearParams();

        return;
      }

      const result = deserialize(json);
      if (Result.isSuccess(result)) {
        setScreen({ type: "viewer", donation: result.value });
      } else {
        setScreen({
          type: "error",
          message: deserializeErrorMessage(result.error),
        });
        clearParams();
      }
    };

    void load();
  }, []);

  const handleSubmit = useCallback(async (parsed: ParsedDonation) => {
    console.log(serialize(parsed));
    const encoded = await compress(serialize(parsed));

    const url = new URL(window.location.href);
    url.searchParams.set(QUERY_KEY, encoded);
    window.history.pushState(null, "", url.toString());

    setScreen({ type: "viewer", donation: parsed });
  }, []);

  const handleReturn = useCallback(() => {
    clearParams();

    setScreen({ type: "home" });
  }, []);

  switch (screen.type) {
    case "home":
      return <Home onSubmit={handleSubmit} />;
    case "viewer":
      return <Viewer donation={screen.donation} onReturn={handleReturn} />;
    case "error":
      return <ErrorScreen message={screen.message} onReturn={handleReturn} />;

    default: {
      throw new Error(
        `exhaustive error: ${(screen satisfies never as Screen).type}`,
      );
    }
  }
};
