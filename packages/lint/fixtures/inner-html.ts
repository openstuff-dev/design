declare const el: { innerHTML: string };
declare const sanitizer: { bypassSecurityTrustHtml(html: string): unknown };

el.innerHTML = '<b>hi</b>';
export const trusted = sanitizer.bypassSecurityTrustHtml('<b>hi</b>');
