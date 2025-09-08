
import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
  </svg>
);


export const AnchorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 13H5V11H19V13Z" fill="currentColor"/>
    <path d="M13 19H11V5H13V19Z" fill="currentColor"/>
    <rect x="3" y="3" width="4" height="4" rx="1" fill="currentColor"/>
    <rect x="17" y="3" width="4" height="4" rx="1" fill="currentColor"/>
    <rect x="3" y="17" width="4" height="4" rx="1" fill="currentColor"/>
    <rect x="17" y="17" width="4" height="4" rx="1" fill="currentColor"/>
  </svg>
);

export const HandlesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19C8 5 16 5 20 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <rect x="2.5" y="17.5" width="3" height="3" fill="currentColor"/>
    <rect x="18.5" y="17.5" width="3" height="3" fill="currentColor"/>
    <circle cx="8" cy="5" r="2" fill="currentColor"/>
    <circle cx="16" cy="5" r="2" fill="currentColor"/>
    <path d="M4 19L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 19L16 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


export const OutlinesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>
  </svg>
);

export const CanvasGridIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ElementGuidesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="7" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
      <path d="M12 17V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
      <path d="M2 12H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
      <path d="M17 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
    </svg>
  );

export const AlignmentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 12H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 18H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 3V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        <path d="M16 3V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
);

export const RulerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3H21V7H3V3Z" fill="currentColor" fillOpacity="0.3"/>
        <path d="M3 3V21H7V3H3Z" fill="currentColor" fillOpacity="0.3"/>
        <path d="M7 3V7H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 7V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 7V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 7V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 7V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 7V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 7V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 9H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 15H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 18H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 21H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


export const CustomizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20.9167L14.75 18.1667L13.6667 17.0833L10.9167 19.8333L12 20.9167ZM18.9583 8.375L15.625 5.04167L6.04167 14.625L3 17.6667V21H6.33333L18.9583 8.375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PreferencesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line>
    <line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line>
    <line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line>
    <line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>
);


export const GenerateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V2M12 22V21M3 12H2M22 12H21M5.63586 5.63599L4.22165 4.22177M19.7782 19.7783L18.364 18.3641M5.63586 18.3641L4.22165 19.7783M19.7782 4.22177L18.364 5.63599" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17.5C15.0376 17.5 17.5 15.0376 17.5 12C17.5 8.96243 15.0376 6.5 12 6.5C8.96243 6.5 6.5 8.96243 6.5 12C6.5 15.0376 8.96243 17.5 12 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const ExportIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
      <path d="M18 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
    </svg>
  );

export const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
);

export const UnlockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>
);

export const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 14 4 9l5-5"/>
        <path d="M4 9h12a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9"/>
    </svg>
);

export const RedoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 14 5-5-5-5"/>
        <path d="M20 9H8a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h7"/>
    </svg>
);
