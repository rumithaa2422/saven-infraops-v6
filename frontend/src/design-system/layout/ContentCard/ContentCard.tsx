/**
 * ContentCard Component
 * Enterprise Design System V2
 */

import React from 'react';
import { Card, CardHeader, CardSection, CardFooter } from '../../components/Card';

/**
 * ContentCard component - wrapper for content pages
 */
export interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentCard({ children, className = '' }: ContentCardProps): React.ReactElement {
  return (
    <Card variant="bordered" padding="none" className={className}>
      {children}
    </Card>
  );
}

ContentCard.Header = CardHeader;
ContentCard.Section = CardSection;
ContentCard.Footer = CardFooter;

export default ContentCard;
