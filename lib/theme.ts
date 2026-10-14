export const THEME_KEY = 'chino-theme';
export const DARK_THEME_COLOR = '#111a17';
export const LIGHT_THEME_COLOR = '#f7f4ee';

export function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'color';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
}

// Se ejecuta antes del primer pintado y migra la preferencia B/N anterior.
export const themeScript = `try{var p=localStorage.getItem('${THEME_KEY}');var d=p==='dark'||p==='bw';document.documentElement.dataset.theme=d?'dark':'color';var m=document.querySelector('meta[name="theme-color"]');m&&m.setAttribute('content',d?'${DARK_THEME_COLOR}':'${LIGHT_THEME_COLOR}');if(p==='bw')localStorage.setItem('${THEME_KEY}','dark')}catch(e){}`;
