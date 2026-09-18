import { ImageResponse } from 'next/og';


export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #0d9488 0%, #0369a1 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          borderRadius: '7px',
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
