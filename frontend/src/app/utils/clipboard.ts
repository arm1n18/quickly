export function copyToClipboard(text: string) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
    } catch (err) {
        console.error('Failed to copy text using execCommand: ', err);
    }
}