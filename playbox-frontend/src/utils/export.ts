// utils/export.ts
export function exportToCSV(data: any[], filename: string) {
    if (!data.length) return;
  
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const cell = row[header];
          return typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell;
        }).join(',')
      )
    ];
  
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  
  export function exportToPDF(data: any[], filename: string) {
    // Implement PDF export if needed
    console.log('PDF export not implemented yet');
  }