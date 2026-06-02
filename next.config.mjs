/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite probar desde el celu por IP de red (ej. http://172.20.10.6:3000).
  // Si cambia tu IP local, agregala aca y reinicia `npm run dev`.
  allowedDevOrigins: ['172.20.10.6'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
