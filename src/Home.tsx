import { useState } from "react";
import { Result } from "@praha/byethrow";
import { parseDonation } from "./parser/parse";
import { parseErrorMessage } from "./parser/errorMessages";
import type { ParsedDonation } from "./parser/types";
import { ErrorScreen } from "./Error";

type Props = {
  onSubmit: (donation: ParsedDonation) => void;
};
export const Home: React.FC<Props> = ({ onSubmit }) => {
  const [input, setInput] = useState("");
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const result = parseDonation(input);
    if (Result.isFailure(result)) {
      setErrorMessage(parseErrorMessage(result.error));
      return;
    }

    onSubmit(result.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey && e.keyCode === 13) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (errorMessage != null) {
    return (
      <ErrorScreen
        message={errorMessage}
        onReturn={() => setErrorMessage(null)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-160 flex flex-col gap-4 p-4 sm:p-6 font-mono text-[#33ff33] bg-[#0a0a0a]">
      {/* NOTE: iOS Safariでフォントサイズ16px未満のinput/textareaにフォーカスしたとき自動ズームするお節介を抑制する */}
      {isTextareaFocused && (
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
        />
      )}

      <textarea
        className="bg-[#1a1a1a] text-[#33ff33] border border-[#33ff33] p-3 font-mono text-sm resize-y placeholder:text-[#1a7a1a]"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onTouchStart={() => setIsTextareaFocused(true)}
        onBlur={() => setIsTextareaFocused(false)}
        rows={20}
      />
      <button
        className="self-start bg-transparent border-none p-1 font-mono text-xs text-[#1a7a1a] cursor-pointer text-left hover:text-[#33ff33] disabled:text-[#0e3e0e] disabled:cursor-not-allowed"
        onClick={handleSubmit}
        disabled={!input.trim()}
      >
        [Shift+Enter] submit
      </button>
    </div>
  );
};
