type Props = {
  message: string;
  onReturn: () => void;
};
export const ErrorScreen: React.FC<Props> = ({ message, onReturn }) => {
  return (
    <div className="mx-auto w-full max-w-160 flex flex-col gap-4 p-4 sm:p-6 font-mono text-[#ff3333] bg-[#0a0a0a]">
      <div className="border border-[#ff3333] p-4 flex flex-col gap-3">
        <div className="text-sm animate-pulse">ERROR</div>
        <p className="text-xs text-[#ff8080] whitespace-pre-wrap">{message}</p>
      </div>
      <button
        className="self-start bg-transparent border-none p-1 font-mono text-xs text-[#7a1a1a] cursor-pointer text-left hover:text-[#ff3333]"
        onClick={onReturn}
      >
        [return to home]
      </button>
    </div>
  );
};
