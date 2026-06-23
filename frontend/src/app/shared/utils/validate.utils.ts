export async function isImgUrl(url: string): Promise<boolean> {
  if (url.trim() == "") {
    return false
  }

  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    
    const contentType = res.headers.get('Content-Type');
    if (contentType?.startsWith('image')) {
      return true;
    }

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
    
  } catch (err) {
    return false;
  }
}

export function isTestMode(value: any): boolean {
  return ['true-false', 'choose', 'match', 'input'].includes(value);
}
  
export function isAnswerMode(value: any): boolean {
  return ['title', 'description'].includes(value);
}