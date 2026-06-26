import React from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeMap: Record<IconSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
};

interface IconBaseProps {
  size?: IconSize;
  className?: string;
}

const IconBase: React.FC<IconBaseProps & { children: React.ReactNode }> = ({
  size = 'md',
  className = '',
  children,
}) => (
  <svg
    className={`${sizeMap[size]} ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const HomeIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </IconBase>
);

export const UserIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </IconBase>
);

export const UsersIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </IconBase>
);

export const ShieldIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </IconBase>
);

export const ShieldCheckIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconBase>
);

export const GraduationCapIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.083 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </IconBase>
);

export const CreditCardIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </IconBase>
);

export const WalletIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </IconBase>
);

export const MapPinIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </IconBase>
);

export const SearchIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </IconBase>
);

export const ChatIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </IconBase>
);

export const BotIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </IconBase>
);

export const DocumentTextIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </IconBase>
);

export const BuildingIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </IconBase>
);

export const WorkerIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11M5 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 005 11zm11 10c0-3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 0013 11m4 0c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054.09A13.916 13.916 0 0017 11z" />
  </IconBase>
);

export const SparklesIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </IconBase>
);

export const ChartBarIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </IconBase>
);

export const TrendingUpIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </IconBase>
);

export const PhoneIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </IconBase>
);

export const LightningIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
  </IconBase>
);

export const ArrowRightIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </IconBase>
);

export const CheckIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M5 13l4 4L19 7" />
  </IconBase>
);

export const XIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M6 18L18 6M6 6l12 12" />
  </IconBase>
);

export const ExclamationIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </IconBase>
);

export const InformationCircleIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconBase>
);

export const LockIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </IconBase>
);

export const KeyIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </IconBase>
);

export const UploadIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </IconBase>
);

export const SendIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </IconBase>
);

export const WifiIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </IconBase>
);

export const QrCodeIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 4v16m8-8H4m15-6h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1zM5 5h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zm0 10h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 011-1zm14 0h-2a1 1 0 00-1 1v2a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 00-1-1z" />
  </IconBase>
);

export const StarIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </IconBase>
);

export const BellIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </IconBase>
);

export const MenuIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </IconBase>
);

export const RadarIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
    <path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 10a4 4 0 110-8 4 4 0 010 8z" />
    <path d="M12 10a2 2 0 100 4 2 2 0 000-4z" />
  </IconBase>
);

export const BriefcaseIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </IconBase>
);

export const AcademicCapIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.083 0 01.665-6.479L12 14z" />
  </IconBase>
);

export const CurrencyDollarIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </IconBase>
);

export const HeartIcon: React.FC<IconBaseProps> = (props) => (
  <IconBase {...props}>
    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </IconBase>
);
