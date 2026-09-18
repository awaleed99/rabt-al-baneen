import { ImageResponse } from 'next/og';


export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 110,
          background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 50%, #1e3a8a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          borderRadius: '36px',
          fontWeight: 900,
        }}
      >
        ر
      </div>
    ),
    {
      ...size,
    }
  );
}
