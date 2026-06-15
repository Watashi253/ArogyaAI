// src/utils/downloadHelper.js

export const downloadSecuredPdf = async (endpoint, filename) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'; 
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      credentials: 'include', 
      headers: {
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to generate PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("PDF Download Error:", error);
    throw error; // Let the component handle the error toast
  }
};