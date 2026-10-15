import type { Ref } from 'react';
import { NICKNAME_MAX_LENGTH, nicknameLength } from '../nickname';

interface NicknameFieldProps {
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  inputRef?: Ref<HTMLInputElement>;
}

export function NicknameField({ value, onChange, error, inputRef }: NicknameFieldProps) {
  const count = nicknameLength(value.trim());

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor="nickname" className="font-display text-lg font-semibold text-birch-50">
          Nickname
        </label>
        <span className="text-sm font-bold text-birch-200 tabular-nums" aria-hidden="true">
          {count}/{NICKNAME_MAX_LENGTH}
        </span>
      </div>
      <input
        id="nickname"
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={NICKNAME_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        placeholder="e.g. Chip Woodbury"
        aria-invalid={error !== null}
        aria-describedby="nickname-help"
        className={`rounded-xl border-[3px] bg-birch-50 px-4 py-3 font-display text-xl text-bark-900 shadow-[inset_0_3px_0_rgb(59_36_22/0.12)] outline-none placeholder:text-bark-300 focus:border-lantern-500 ${
          error ? 'border-berry-500' : 'border-bark-900'
        }`}
      />
      <p
        id="nickname-help"
        aria-live="polite"
        className={`min-h-5 text-sm font-bold ${error ? 'text-[#ffd2c4]' : 'text-birch-200'}`}
      >
        {error ?? 'Remembered on this device — no account needed.'}
      </p>
    </div>
  );
}
