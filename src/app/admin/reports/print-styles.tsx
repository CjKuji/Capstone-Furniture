export function PrintStyles() {
    return (
        <style jsx global>{`
            @media print {
                /* 1. Complete annihilation of system architecture sidebar/topbars & chat bots */
                aside, 
                nav, 
                header, 
                footer,
                .sidebar, 
                #sidebar, 
                .admin-sidebar,
                .navbar, 
                .print-hidden,
                .print\\:hidden,
                /* Structural target rules for standard embeddable automated customer support platforms */
                #crisp-chatbox,
                .crisp-client,
                #intercom-container,
                .intercom-app,
                iframe[id*="chat"],
                div[class*="chat"],
                div[id*="chat"],
                #tw-chatbot,
                .global-chatbot-wrapper { 
                    display: none !important; 
                    width: 0 !important; 
                    height: 0 !important; 
                    visibility: hidden !important;
                    opacity: 0 !important;
                    overflow: hidden !important;
                }

                @page {
                    size: A4 portrait;
                    margin: 12mm;
                }

                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                /* 2. Flatten page container tree to unlock absolute 100% full-width printing layouts */
                body, 
                html, 
                main, 
                #root, 
                .__next, 
                div[class*="layout"], 
                div[class*="wrapper"],
                div[class*="container"] { 
                    background: #ffffff !important; 
                    color: #000000 !important; 
                    width: 100% !important; 
                    max-width: 100% !important;
                    margin: 0 !important; 
                    padding: 0 !important; 
                    position: static !important;
                    overflow: visible !important;
                    display: block !important;
                    box-shadow: none !important;
                }

                /* 3. Global high-contrast print legibility optimizations */
                .print\\:text-black { color: #000000 !important; }
                .print\\:text-gray-900 { color: #111827 !important; }
                .print\\:text-gray-700 { color: #374151 !important; }
                .print\\:text-gray-500 { color: #6B7280 !important; }
                .print\\:bg-white { background-color: #ffffff !important; }
                .print\\:bg-gray-50 { background-color: #F9FAFB !important; }
                .print\\:border-gray-200 { border-color: #E5E7EB !important; }
                .print\\:border-gray-300 { border-color: #D1D5DB !important; }
                .print\\:border-gray-400 { border-color: #9CA3AF !important; }
                .break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
                .print-card { break-inside: avoid !important; page-break-inside: avoid !important; }
                .print-section { break-inside: avoid !important; page-break-inside: avoid !important; }
                .print-table thead { display: table-header-group !important; }
                .print-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
                .print-table th, .print-table td { page-break-inside: avoid !important; }
                .print-header { display: none; }
                .print-hidden { display: none !important; }
                .print-only { display: none; }
                .print-shell { width: 100% !important; max-width: 100% !important; }
                .print-compact { font-size: 11px !important; line-height: 1.4 !important; }
                .print-report-card { background: #ffffff !important; border: 1px solid #d1d5db !important; border-radius: 8px !important; box-shadow: none !important; }
                .print-report-table th, .print-report-table td { padding: 6px 0 !important; }
                .print-report-table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
                .print-report-section { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 12px !important; }
                .print-report-summary { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 8px !important; }
            }

            @media print {
                .print-only { display: block !important; }
                .print\\:rounded-none { border-radius: 0 !important; }
                .print\\:px-0 { padding-left: 0 !important; padding-right: 0 !important; }
                .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
                .print\\:shadow-none { box-shadow: none !important; }
                .screen-only { display: none !important; }
                .print-only-report { display: block !important; }
            }
        `}</style>
    );
}
