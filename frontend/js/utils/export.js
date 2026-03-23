export function downloadCSV(data, headers, labels, filename = 'export.csv') {
    const SEP = ';';

    const escape = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        // Envolver en comillas si contiene el separador, comillas o saltos de línea
        return str.includes(SEP) || str.includes('"') || str.includes('\n')
            ? `"${str}"`
            : str;
    };

    const rows = [
        // Pista para Excel sobre el separador
        `sep=${SEP}`,
        labels.join(SEP),
        ...data.map(row => headers.map(h => escape(row[h])).join(SEP)),
    ];

    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], {
        type: 'text/csv;charset=utf-8;',
    });

    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
