
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
      try {
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
      } catch (e) {
        console.warn('Could not copy stylesheet. This is often due to cross-origin security restrictions.', e);
      }
    });

    // Add specific styles for the print container
    const printSpecificStyles = `
      @media print {
        body {
          background-color: #fff;
        }
        .print-container {
          padding: 2rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          max-width: 800px;
          margin: 2rem auto;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
      }
       body {
          background-color: #f3f4f6;
        }
       .print-container {
          padding: 2rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          max-width: 800px;
          margin: 2rem auto;
          background-color: #fff;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
    `;
    const styleElement = printWindow.document.createElement('style');
    styleElement.textContent = printSpecificStyles;
    printWindow.document.head.appendChild(styleElement);


    printWindow.document.write('</head><body>');
    // Wrap the content in a styled container
    printWindow.document.write('<div class="print-container">');
    printWindow.document.write(contentElement.innerHTML);
    printWindow.document.write('</div>');
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
