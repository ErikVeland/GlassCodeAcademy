import React from 'react';
import './styles.css';

export default function VirginCheckinLeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="virgin-onboarding-theme">{children}</div>;
}
