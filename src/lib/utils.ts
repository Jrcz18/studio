
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  // Adjust for timezone offset to prevent off-by-one-day errors
  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
  
  return adjustedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
  });
}


/**
 * Opens a new window and prints the content of a DOM element, preserving all styles.
 * @param {object} params - The parameters for printing.
 * @param {string} params.contentId - The ID of the DOM element to print.
 * @param {string} params.title - The title of the print window.
 */
export function printContent({ contentId, title }: { contentId: string; title: string }) {
  const contentElement = document.getElementById(contentId);
  if (!contentElement) {
    console.error(`Element with id "${contentId}" not found.`);
    return;
  }
  
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(`<html><head><title>${title}</title>`);

    // Copy all style sheets from the main document to the new window
    const styleSheets = Array.from(document.styleSheets);
    styleSheets.forEach(styleSheet => {
      if (styleSheet.href) {
        // For external stylesheets, create a link element
        const link = printWindow.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        printWindow.document.head.appendChild(link);
      } else if (styleSheet.cssRules) {
        // For inline stylesheets, create a style element
        const style = printWindow.document.createElement('style');
        style.textContent = Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
        printWindow.document.head.appendChild(style);
      }
    });

    printWindow.document.write('</head><body>');
    printWindow.document.write(contentElement.innerHTML);
    printWindow.document.write('</body></html>');

    // The timeout allows the browser to load and apply the stylesheets before printing
    setTimeout(() => {
        printWindow.document.close();
        printWindow.focus(); 
        printWindow.print();
        printWindow.close();
    }, 500);
  }
}
