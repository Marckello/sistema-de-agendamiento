import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}

export function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled = false, 
  size = 'md',
  label,
  description
}: ToggleSwitchProps) {
  const sizes = {
    sm: {
      track: 'h-5 w-10',
      thumb: 'h-4 w-4',
      translate: 'translate-x-5',
      icon: 'w-2.5 h-2.5'
    },
    md: {
      track: 'h-7 w-14',
      thumb: 'h-6 w-6',
      translate: 'translate-x-7',
      icon: 'w-3.5 h-3.5'
    },
    lg: {
      track: 'h-8 w-16',
      thumb: 'h-7 w-7',
      translate: 'translate-x-8',
      icon: 'w-4 h-4'
    }
  };

  const currentSize = sizes[size];

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex items-center shrink-0
        ${currentSize.track}
        rounded-full cursor-pointer
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
        dark:focus:ring-offset-gray-900
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${checked 
          ? 'bg-gradient-to-r from-primary-500 via-primary-600 to-purple-600 shadow-lg shadow-primary-500/30' 
          : 'bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700'
        }
      `}
    >
      <span
        className={`
          inline-flex items-center justify-center
          ${currentSize.thumb}
          rounded-full
          bg-white
          shadow-md
          transform transition-all duration-300 ease-in-out
          ${checked ? currentSize.translate : 'translate-x-0.5'}
        `}
      >
        {checked ? (
          <CheckIcon className={`${currentSize.icon} text-primary-600`} />
        ) : (
          <XMarkIcon className={`${currentSize.icon} text-gray-400`} />
        )}
      </span>
    </button>
  );

  if (label || description) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {label && (
            <span className="font-medium text-gray-900 dark:text-white">{label}</span>
          )}
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {toggle}
      </div>
    );
  }

  return toggle;
}

export default ToggleSwitch;
