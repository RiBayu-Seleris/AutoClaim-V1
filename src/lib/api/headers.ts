/**
 * Header ini membuat ngrok free meneruskan request browser ke backend,
 * bukan membalas halaman warning HTML yang tidak punya header CORS.
 */
export const NGROK_SKIP_BROWSER_WARNING_HEADER = 'ngrok-skip-browser-warning';
export const NGROK_SKIP_BROWSER_WARNING_VALUE = 'true';
