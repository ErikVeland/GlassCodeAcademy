// Accessibility Audit and WCAG 2.1 AA Compliance System
import React from 'react';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  rule: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  element: string;
  description: string;
  help: string;
  wcagReference: string;
  fix?: string;
}

interface AccessibilityReport {
  timestamp: number;
  url: string;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  passCount: number;
  compliance: {
    level: 'AA' | 'A' | 'Non-compliant';
    percentage: number;
  };
  issues: AccessibilityIssue[];
  recommendations: string[];
}

class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];
  private passedChecks: number = 0;
  private totalChecks: number = 0;

  public async performAudit(): Promise<AccessibilityReport> {
    this.reset();
    
    await this.checkColorContrast();
    await this.checkKeyboardNavigation();
    await this.checkImageAlternatives();
    await this.checkHeadingStructure();
    await this.checkFormLabels();
    await this.checkFocusVisible();
    await this.checkLanguageAttributes();
    await this.checkSkipLinks();

    return this.generateReport();
  }

  private reset() {
    this.issues = [];
    this.passedChecks = 0;
    this.totalChecks = 0;
  }

  private addIssue(issue: AccessibilityIssue) {
    this.issues.push(issue);
    this.totalChecks++;
  }

  private addPass() {
    this.passedChecks++;
    this.totalChecks++;
  }

  private async checkColorContrast() {
    const elements = document.querySelectorAll('*');
    
    for (const element of Array.from(elements).slice(0, 100)) { // Limit for performance
      const style = window.getComputedStyle(element);
      const color = style.color;
      const backgroundColor = style.backgroundColor;
      
      if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrast = this.calculateContrast(color, backgroundColor);
        const fontSize = parseFloat(style.fontSize);
        const isLargeText = fontSize >= 18;
        const requiredRatio = isLargeText ? 3 : 4.5;
        
        if (contrast < requiredRatio) {
          this.addIssue({
            type: 'error',
            rule: 'color-contrast',
            impact: 'serious',
            element: element.tagName.toLowerCase(),
            description: `Insufficient color contrast: ${contrast.toFixed(2)}:1 (requires ${requiredRatio}:1)`,
            help: 'Ensure text has sufficient contrast against background',
            wcagReference: 'WCAG 2.1 AA 1.4.3',
            fix: 'Adjust text or background color to meet contrast requirements'
          });
        } else {
          this.addPass();
        }
      }
    }
  }

  private async checkImageAlternatives() {
    const images = document.querySelectorAll('img');
    
    for (const img of Array.from(images)) {
      const alt = img.getAttribute('alt');
      
      if (alt === null) {
        this.addIssue({
          type: 'error',
          rule: 'image-alt',
          impact: 'critical',
          element: 'img',
          description: 'Image missing alt attribute',
          help: 'Add descriptive alt text or mark as decorative',
          wcagReference: 'WCAG 2.1 AA 1.1.1',
          fix: 'Add alt="descriptive text" or alt="" for decorative images'
        });
      } else {
        this.addPass();
      }
    }
  }

  private async checkFormLabels() {
    const formControls = document.querySelectorAll('input, textarea, select');
    
    for (const control of Array.from(formControls)) {
      const type = (control as HTMLInputElement).type;
      if (type === 'hidden' || type === 'button' || type === 'submit') continue;
      
      const id = control.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const ariaLabel = control.getAttribute('aria-label');
      
      if (!hasLabel && !ariaLabel) {
        this.addIssue({
          type: 'error',
          rule: 'form-label',
          impact: 'critical',
          element: control.tagName.toLowerCase(),
          description: 'Form control missing accessible label',
          help: 'Add label element or aria-label',
          wcagReference: 'WCAG 2.1 AA 3.3.2',
          fix: 'Add <label for="id">Label</label> or aria-label="Label"'
        });
      } else {
        this.addPass();
      }
    }
  }

  private async checkHeadingStructure() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    for (const heading of Array.from(headings)) {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.addIssue({
          type: 'error',
          rule: 'heading-order',
          impact: 'moderate',
          element: heading.tagName.toLowerCase(),
          description: `Heading level skipped from H${previousLevel} to H${level}`,
          help: 'Use heading levels in sequential order',
          wcagReference: 'WCAG 2.1 AA 1.3.1',
          fix: `Use H${previousLevel + 1} instead of H${level}`
        });
      } else {
        this.addPass();
      }
      
      previousLevel = level;
    }
  }

  private async checkKeyboardNavigation() {
    const interactive = document.querySelectorAll('[onclick], button, a[href]');
    
    for (const element of Array.from(interactive)) {
      const tabIndex = element.getAttribute('tabindex');
      
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addIssue({
          type: 'warning',
          rule: 'positive-tabindex',
          impact: 'moderate',
          element: element.tagName.toLowerCase(),
          description: 'Positive tabindex should be avoided',
          help: 'Use tabindex="0" or natural tab order',
          wcagReference: 'WCAG 2.1 AA 2.1.1',
          fix: 'Remove positive tabindex or set to 0'
        });
      } else {
        this.addPass();
      }
    }
  }

  private async checkFocusVisible() {
    const focusable = document.querySelectorAll('a, button, input, textarea, select');
    let focusableWithoutIndicator = 0;
    
    for (const element of Array.from(focusable).slice(0, 10)) { // Sample check
      const computedStyle = window.getComputedStyle(element, ':focus');
      const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '0px';
      
      if (!hasOutline) {
        focusableWithoutIndicator++;
      }
    }
    
    if (focusableWithoutIndicator > 0) {
      this.addIssue({
        type: 'error',
        rule: 'focus-visible',
        impact: 'serious',
        element: 'focusable-elements',
        description: 'Elements lack visible focus indicators',
        help: 'Add CSS focus styles',
        wcagReference: 'WCAG 2.1 AA 2.4.7',
        fix: 'Add CSS: element:focus { outline: 2px solid blue; }'
      });
    } else {
      this.addPass();
    }
  }

  private async checkLanguageAttributes() {
    const lang = document.documentElement.getAttribute('lang');
    
    if (!lang) {
      this.addIssue({
        type: 'error',
        rule: 'html-lang',
        impact: 'serious',
        element: 'html',
        description: 'HTML element missing lang attribute',
        help: 'Add lang attribute to identify page language',
        wcagReference: 'WCAG 2.1 AA 3.1.1',
        fix: 'Add lang="en" to html element'
      });
    } else {
      this.addPass();
    }
  }

  private async checkSkipLinks() {
    const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]'))
      .some(link => link.textContent?.toLowerCase().includes('skip'));
    
    if (!skipLinks) {
      this.addIssue({
        type: 'warning',
        rule: 'skip-link',
        impact: 'moderate',
        element: 'document',
        description: 'Missing skip to main content link',
        help: 'Add skip navigation for keyboard users',
        wcagReference: 'WCAG 2.1 AA 2.4.1',
        fix: 'Add skip link at page start'
      });
    } else {
      this.addPass();
    }
  }

  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    const rgb1 = this.parseColor(color1);
    const rgb2 = this.parseColor(color2);
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  private parseColor(color: string): [number, number, number] {
    const rgb = color.match(/\d+/g);
    return rgb ? [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])] : [0, 0, 0];
  }

  private getLuminance([r, g, b]: [number, number, number]): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private generateReport(): AccessibilityReport {
    const errorCount = this.issues.filter(i => i.type === 'error').length;
    const warningCount = this.issues.filter(i => i.type === 'warning').length;
    const compliancePercentage = this.totalChecks > 0 ? 
      Math.round((this.passedChecks / this.totalChecks) * 100) : 0;
    
    let level: 'AA' | 'A' | 'Non-compliant';
    if (errorCount === 0 && compliancePercentage >= 95) level = 'AA';
    else if (errorCount <= 2 && compliancePercentage >= 80) level = 'A';
    else level = 'Non-compliant';

    return {
      timestamp: Date.now(),
      url: window.location.href,
      totalIssues: this.issues.length,
      errorCount,
      warningCount,
      passCount: this.passedChecks,
      compliance: { level, percentage: compliancePercentage },
      issues: this.issues,
      recommendations: this.generateRecommendations()
    };
  }

  private generateRecommendations(): string[] {
    const recs: string[] = [];
    if (this.issues.some(i => i.rule === 'color-contrast')) 
      recs.push('Improve color contrast ratios');
    if (this.issues.some(i => i.rule === 'image-alt')) 
      recs.push('Add alt text to images');
    if (this.issues.some(i => i.rule === 'form-label')) 
      recs.push('Label all form controls');
    return recs;
  }
}

export const accessibilityAuditor = new AccessibilityAuditor();

export function useAccessibilityMonitor() {
  const [report, setReport] = React.useState<AccessibilityReport | null>(null);
  const [isAuditing, setIsAuditing] = React.useState(false);

  const runAudit = React.useCallback(async () => {
    setIsAuditing(true);
    try {
      const auditReport = await accessibilityAuditor.performAudit();
      setReport(auditReport);
    } finally {
      setIsAuditing(false);
    }
  }, []);

  return { report, isAuditing, runAudit };
}