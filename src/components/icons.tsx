import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const WrenchIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3l9.4-9.4a4 4 0 0 0-2-2z" />
    <path d="M14.7 6.3a4 4 0 0 1 5.6-1.4l-2.6 2.6.8 2.4 2.4.8 2.6-2.6" />
  </Base>
);

export const PhoneIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </Base>
);

export const ScissorsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="6" cy="6.5" r="2.5" />
    <circle cx="6" cy="17.5" r="2.5" />
    <path d="M8 8l12 9M8 16L20 7" />
  </Base>
);

export const CarIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 17H3.5v-4.5L5.8 7.5A2 2 0 0 1 7.6 6.5h8.8a2 2 0 0 1 1.8 1l2.3 5V17H19" />
    <path d="M3.5 12.5h17" />
    <circle cx="7.5" cy="17" r="2" />
    <circle cx="16.5" cy="17" r="2" />
    <path d="M9.5 17h5" />
  </Base>
);

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4-4" />
  </Base>
);

export const PinIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </Base>
);

export const LocateIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="8" />
    <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
  </Base>
);

export const MenuIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const CloseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const ArrowIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const ProfileIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Base>
);

export const StarIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />
  </Base>
);

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3l7.5 2.8v5.7c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V5.8z" />
    <path d="M8.8 12l2.2 2.2 4.2-4.4" />
  </Base>
);

export const QuoteIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3h8l4 4v14H6z" />
    <path d="M14 3v4h4M9 12h6M9 16h6" />
  </Base>
);

export const ChatIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Base>
);

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.3l2.7 2.7L16 9.5" />
  </Base>
);

export const FacebookIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.4l.6-3.5H14V8.5z" />
  </Base>
);

export const InstagramIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17 7v.01" strokeWidth="2.4" />
  </Base>
);

export const XIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" />
  </Base>
);
