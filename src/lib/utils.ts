
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

// In-memory cache for the CSS content
let cssContent: string | null = null;
let cssPromise: Promise<string> | null = null;

/**
 * Fetches the app's global CSS content.
 * It fetches the content only once and caches it for subsequent calls.
 * This is safe for client-side use as it fetches a public asset.
 * @returns {Promise<string>} A promise that resolves to the CSS content.
 */
async function getGlobalCss(): Promise<string> {
  if (cssContent) {
    return Promise.resolve(cssContent);
  }
  if (cssPromise) {
    return cssPromise;
  }

  // In a Next.js app directory, `globals.css` is a public asset.
  // This fetch request will work in both development and production/static builds.
  cssPromise = fetch('/globals.css')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(text => {
      cssContent = text;
      cssPromise = null; // Clear promise after resolution
      return text;
    })
    .catch(error => {
      console.error("Failed to fetch globals.css:", error);
      cssPromise = null; // Clear promise on failure
      return ""; // Return empty string on failure
    });
  
  return cssPromise;
}


/**
 * Opens a new window and prints the content of a DOM element.
 * It dynamically includes the app's global styles for accurate rendering.
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
  
  const contentHtml = contentElement.innerHTML;
  const printWindow = window.open('', '_blank', 'height=800,width=800');

  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
        </head>
        <body class="p-8">
          ${contentHtml}
        </body>
      </html>
    `);

    getGlobalCss().then(css => {
      const styleEl = printWindow.document.createElement('style');
      styleEl.textContent = css;
      printWindow.document.head.appendChild(styleEl);
      
      // Allow styles to apply before printing
      setTimeout(() => {
        printWindow.document.close(); // Important for some browsers
        printWindow.focus(); // Important for some browsers
        printWindow.print();
        printWindow.close();
      }, 500); 
    });
  }
}
