import QRCode from 'qrcode';

export async function generateQRCode(text: string, size: number = 200): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    color: { dark: '#00F0FF', light: '#0D0E12' },
  });
  return canvas.toDataURL('image/png');
}
