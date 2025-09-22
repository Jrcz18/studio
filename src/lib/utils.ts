
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
 * Opens a new window and prints the content of a DOM element.
 * It now relies on `@media print` styles in `globals.css`.
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
  
  // Clone the node to avoid manipulating the original DOM
  const contentToPrint = contentElement.cloneNode(true) as HTMLElement;
  contentToPrint.classList.add('print-content');

  const printWindow = window.open('', '_blank', 'height=800,width=800');

  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <link rel="stylesheet" href="/globals.css">
           <style>
             /* Additional print-specific overrides if needed */
             body { margin: 0; }
           </style>
        </head>
        <body>
          ${contentToPrint.outerHTML}
        </body>
      </html>
    `);

    // The load event ensures styles are applied before printing
    printWindow.addEventListener('load', () => {
        printWindow.document.close();
        printWindow.focus(); 
        printWindow.print();
        printWindow.close();
    }, true);
  }
}
