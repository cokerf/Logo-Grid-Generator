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

export const GridlinesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 19H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CustomizeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 20.9167L14.75 18.1667L13.6667 17.0833L10.9167 19.8333L12 20.9167ZM18.9583 8.375L15.625 5.04167L6.04167 14.625L3 17.6667V21H6.33333L18.9583 8.375Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PreferencesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21C12 21 15 15.6 15 12C15 8.4 12 6 12 6C12 6 9 8.4 9 12C9 15.6 12 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.44336 6.44336L8.56461 8.56461" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.4355 15.4355L17.5568 17.5568" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GenerateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3V2M12 22V21M3 12H2M22 12H21M5.63586 5.63599L4.22165 4.22177M19.7782 19.7783L18.364 18.3641M5.63586 18.3641L4.22165 19.7783M19.7782 4.22177L18.364 5.63599" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17.5C15.0376 17.5 17.5 15.0376 17.5 12C17.5 8.96243 15.0376 6.5 12 6.5C8.96243 6.5 6.5 8.96243 6.5 12C6.5 15.0376 8.96243 17.5 12 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);