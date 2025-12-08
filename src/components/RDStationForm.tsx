import React, { useEffect } from 'react';

export function RDStationForm() {
    useEffect(() => {
        const scriptId = 'rdstation-forms-script';

        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js';
            script.async = true;
            script.onload = () => {
                // @ts-ignore
                if (window.RDStationForms) {
                    // @ts-ignore
                    new window.RDStationForms('mdt-b4d9bb12ac23d939aca5', 'null').createForm();
                }
            };
            document.body.appendChild(script);
        } else {
            // If script is already loaded, just init the form
            // @ts-ignore
            if (window.RDStationForms) {
                // @ts-ignore
                new window.RDStationForms('mdt-b4d9bb12ac23d939aca5', 'null').createForm();
            }
        }
    }, []);

    return (
        <div className="w-full max-w-sm">
            <div role="main" id="mdt-b4d9bb12ac23d939aca5"></div>
        </div>
    );
}
